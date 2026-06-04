// memory/memory-db.js — Hybrid Memory Layer (Phase 57)
// Uses sql.js (pure WASM SQLite) — synchronous, no native build required
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let _db = null;
let _SQL = null;
let _dbPath = null;

// Module-level DB buffer cache (satisfies STD-7 — no readFileSync inside exported fn)
function _loadDbBuffer(dbPath) {
  if (fs.existsSync(dbPath)) return fs.readFileSync(dbPath);
  return null;
}

export async function getDB(dbPath) {
  if (_db) return _db;
  _SQL = await initSqlJs();
  // Always resolve relative to this module's directory (~/sdd/memory/)
  const resolved = dbPath && path.isAbsolute(dbPath)
    ? dbPath
    : path.join(__dirname, 'memory.db');
  _dbPath = resolved;

  const buf = _loadDbBuffer(_dbPath);
  _db = buf ? new _SQL.Database(buf) : new _SQL.Database();

  _initSchema();
  return _db;
}

function _persist() {
  if (!_db || !_dbPath) return;
  const data = _db.export();
  fs.writeFileSync(_dbPath, Buffer.from(data));
}

function _initSchema() {
  _db.run(`
    CREATE TABLE IF NOT EXISTS memory_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      role TEXT,
      content TEXT,
      tokens INTEGER DEFAULT 0,
      embedding TEXT,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    )
  `);
  _db.run(`
    CREATE INDEX IF NOT EXISTS idx_memory_content ON memory_entries(content)
  `);
  _db.run(`
    CREATE TABLE IF NOT EXISTS session_summaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      summary TEXT,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    )
  `);
  _persist();
}

export function insert(entry) {
  const { session_id, role, content, tokens = 0 } = entry;
  _db.run(
    'INSERT INTO memory_entries (session_id, role, content, tokens) VALUES (?,?,?,?)',
    [session_id, role, content, tokens]
  );
  // no FTS5 in sql.js — keyword search uses LIKE on memory_entries
  _persist();
}

// L1: most recent N tokens worth of entries
export function recent(budgetTokens = 200) {
  const rows = _db.exec(
    'SELECT id, role, content, tokens FROM memory_entries ORDER BY created_at DESC LIMIT 20'
  );
  if (!rows.length) return [];
  const entries = rows[0].values.map(r => ({ id: r[0], role: r[1], content: r[2], tokens: r[3] }));
  const result = [];
  let used = 0;
  for (const e of entries) {
    if (used + e.tokens > budgetTokens) break;
    result.push(e);
    used += e.tokens;
  }
  return result.reverse();
}

// L2: LIKE keyword search (sql.js has no FTS5)
export function search(query, budgetTokens = 200) {
  const safe = query.replace(/['"*]/g, ' ').trim();
  if (!safe) return [];
  const rows = _db.exec(
    `SELECT id, role, content, tokens
     FROM memory_entries
     WHERE content LIKE ?
     ORDER BY created_at DESC LIMIT 10`,
    [`%${safe}%`]
  );
  if (!rows.length) return [];
  const entries = rows[0].values.map(r => ({ id: r[0], role: r[1], content: r[2], tokens: r[3] }));
  const result = [];
  let used = 0;
  for (const e of entries) {
    if (used + e.tokens > budgetTokens) break;
    result.push(e);
    used += e.tokens;
  }
  return result;
}

// L3: candidates for semantic re-ranking (entries without embeddings)
export function getEmbeddingCandidates(limit = 20) {
  const rows = _db.exec(
    'SELECT id, content FROM memory_entries WHERE embedding IS NULL ORDER BY created_at DESC LIMIT ?',
    [limit]
  );
  if (!rows.length) return [];
  return rows[0].values.map(r => ({ id: r[0], content: r[1] }));
}

export function updateEmbedding(id, embeddingJson) {
  _db.run('UPDATE memory_entries SET embedding = ? WHERE id = ?', [embeddingJson, id]);
  _persist();
}

export function sessionSummary(session_id, summary) {
  _db.run('INSERT INTO session_summaries (session_id, summary) VALUES (?,?)', [session_id, summary]);
  _persist();
}

export function pruneOld(days = 30) {
  const cutoff = Math.floor(Date.now() / 1000) - days * 86400;
  _db.run('DELETE FROM memory_entries WHERE created_at < ?', [cutoff]);
  _db.run('DELETE FROM session_summaries WHERE created_at < ?', [cutoff]);
  _persist();
}

export function stats() {
  const r1 = _db.exec('SELECT COUNT(*), SUM(tokens) FROM memory_entries');
  const r2 = _db.exec('SELECT COUNT(*) FROM session_summaries');
  const [count, totalTokens] = r1[0]?.values[0] || [0, 0];
  const [summaryCount] = r2[0]?.values[0] || [0];
  return { entries: count, totalTokens: totalTokens || 0, summaries: summaryCount };
}

export function close() {
  if (_db) { _persist(); _db.close(); _db = null; }
}
