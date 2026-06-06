// memory/blackboard-db.js — Blackboard DB Layer (Phase 57B)
// Ephemeral session DB — separate from memory.db (permanent).
// Rule: blackboard.db is VACUUM'd after every session cleanup.
//       memory.db is NEVER VACUUM'd mid-session.
// sql.js: async init, synchronous queries — never wrap query calls in async.
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let _db = null;
let _SQL = null;
let _dbPath = null;

function _loadDbBuffer(dbPath) {
  if (fs.existsSync(dbPath)) return fs.readFileSync(dbPath);
  return null;
}

export async function getBB(dbPath) {
  if (_db) return _db;
  _SQL = await initSqlJs();
  const resolved = dbPath && path.isAbsolute(dbPath)
    ? dbPath
    : path.join(__dirname, 'blackboard.db');
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
  _db.run('BEGIN TRANSACTION');
  _db.run(`
    CREATE TABLE IF NOT EXISTS pipeline_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      task_slug TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      agent TEXT,
      created_at INTEGER DEFAULT (strftime('%s','now')),
      updated_at INTEGER DEFAULT (strftime('%s','now'))
    )
  `);
  _db.run(`
    CREATE TABLE IF NOT EXISTS task_solutions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      task_slug TEXT NOT NULL,
      agent TEXT,
      solution TEXT,
      score REAL DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    )
  `);
  _db.run(`
    CREATE TABLE IF NOT EXISTS session_context (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL UNIQUE,
      context_json TEXT,
      updated_at INTEGER DEFAULT (strftime('%s','now'))
    )
  `);
  _db.run(`
    CREATE TABLE IF NOT EXISTS interaction_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT,
      agent TEXT,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    )
  `);
  _db.run(`
    CREATE TABLE IF NOT EXISTS think_chains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      task_slug TEXT,
      agent TEXT,
      think_raw TEXT,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    )
  `);
  _db.run('COMMIT');
  _persist();
}

// ── Write helpers — all atomic ────────────────────────────────────────────────

export function bbInsertTask(session_id, task_slug, agent = null) {
  _db.run('BEGIN TRANSACTION');
  _db.run(
    'INSERT INTO pipeline_tasks (session_id, task_slug, agent) VALUES (?,?,?)',
    [session_id, task_slug, agent]
  );
  _db.run('COMMIT');
  _persist();
}

export function bbUpdateTaskStatus(session_id, task_slug, status) {
  _db.run('BEGIN TRANSACTION');
  _db.run(
    `UPDATE pipeline_tasks SET status=?, updated_at=strftime('%s','now')
     WHERE session_id=? AND task_slug=?`,
    [status, session_id, task_slug]
  );
  _db.run('COMMIT');
  _persist();
}

export function bbInsertSolution(session_id, task_slug, agent, solution, score = 0) {
  _db.run('BEGIN TRANSACTION');
  _db.run(
    'INSERT INTO task_solutions (session_id, task_slug, agent, solution, score) VALUES (?,?,?,?,?)',
    [session_id, task_slug, agent, solution, score]
  );
  _db.run('COMMIT');
  _persist();
}

export function bbUpsertContext(session_id, context_json) {
  _db.run('BEGIN TRANSACTION');
  _db.run(
    `INSERT INTO session_context (session_id, context_json, updated_at)
     VALUES (?,?,strftime('%s','now'))
     ON CONFLICT(session_id) DO UPDATE SET
       context_json=excluded.context_json,
       updated_at=excluded.updated_at`,
    [session_id, typeof context_json === 'string' ? context_json : JSON.stringify(context_json)]
  );
  _db.run('COMMIT');
  _persist();
}

export function bbInsertInteraction(session_id, role, content, agent = null) {
  _db.run('BEGIN TRANSACTION');
  _db.run(
    'INSERT INTO interaction_history (session_id, role, content, agent) VALUES (?,?,?,?)',
    [session_id, role, content, agent]
  );
  _db.run('COMMIT');
  _persist();
}

export function bbInsertThinkChain(session_id, task_slug, agent, think_raw) {
  _db.run('BEGIN TRANSACTION');
  _db.run(
    'INSERT INTO think_chains (session_id, task_slug, agent, think_raw) VALUES (?,?,?,?)',
    [session_id, task_slug, agent, think_raw]
  );
  _db.run('COMMIT');
  _persist();
}

// ── Read helpers ──────────────────────────────────────────────────────────────

export function bbGetTasks(session_id) {
  const rows = _db.exec(
    'SELECT id, task_slug, status, agent, created_at FROM pipeline_tasks WHERE session_id=? ORDER BY created_at ASC',
    [session_id]
  );
  if (!rows.length) return [];
  return rows[0].values.map(r => ({ id: r[0], task_slug: r[1], status: r[2], agent: r[3], created_at: r[4] }));
}

export function bbGetSolutions(session_id, task_slug) {
  const rows = _db.exec(
    'SELECT id, agent, solution, score FROM task_solutions WHERE session_id=? AND task_slug=? ORDER BY score DESC',
    [session_id, task_slug]
  );
  if (!rows.length) return [];
  return rows[0].values.map(r => ({ id: r[0], agent: r[1], solution: r[2], score: r[3] }));
}

export function bbGetContext(session_id) {
  const rows = _db.exec(
    'SELECT context_json FROM session_context WHERE session_id=?',
    [session_id]
  );
  if (!rows.length || !rows[0].values.length) return null;
  try { return JSON.parse(rows[0].values[0][0]); } catch { return null; }
}

export function bbGetInteractions(session_id, limit = 20) {
  const rows = _db.exec(
    'SELECT role, content, agent, created_at FROM interaction_history WHERE session_id=? ORDER BY created_at DESC LIMIT ?',
    [session_id, limit]
  );
  if (!rows.length) return [];
  return rows[0].values.map(r => ({ role: r[0], content: r[1], agent: r[2], created_at: r[3] })).reverse();
}

// ── Session cleanup — VACUUM after every call ─────────────────────────────────

export function bbCleanupSession(session_id) {
  _db.run('BEGIN TRANSACTION');
  _db.run('DELETE FROM pipeline_tasks WHERE session_id=?', [session_id]);
  _db.run('DELETE FROM task_solutions WHERE session_id=?', [session_id]);
  _db.run('DELETE FROM session_context WHERE session_id=?', [session_id]);
  _db.run('DELETE FROM interaction_history WHERE session_id=?', [session_id]);
  _db.run('DELETE FROM think_chains WHERE session_id=?', [session_id]);
  _db.run('COMMIT');
  // VACUUM after every cleanup — blackboard.db is ephemeral by design
  _db.run('VACUUM');
  _persist();
}

export function bbClose() {
  if (_db) { _persist(); _db.close(); _db = null; }
}
