import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT       = join(__dirname, '..', '..');
const MEMORY_FILE = join(ROOT, 'memory', 'memory.txt');
const EMBED_FILE  = join(ROOT, 'memory', 'embeddings.json');
const EMBED_URL   = 'http://localhost:11434/api/embeddings';
const MODEL       = 'nomic-embed-text';
const TOP_K       = 5;

// FIX 2: hash-based ID — stable across memory.txt edits
function hashText(text) {
  return createHash('md5').update(text).digest('hex').slice(0, 12);
}

async function embed(text) {
  const res = await fetch(EMBED_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, prompt: text.slice(0, 2000) })
  });
  if (!res.ok) throw new Error(`Embed failed: ${res.status}`);
  const data = await res.json();
  return data.embedding;
}

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na  += a[i] * a[i];
    nb  += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// FIX 3: multi-line parser + summary block skip
function parseMemory() {
  if (!existsSync(MEMORY_FILE)) return [];
  const lines = readFileSync(MEMORY_FILE, 'utf8').split('\n');
  const entries = [];
  let cur = null;
  let inSummary = false;
  let inAssistant = false;

  for (const line of lines) {
    if (line.startsWith('[MEMORY SUMMARY')) { inSummary = true; continue; }
    if (line.startsWith('[END SUMMARY]'))   { inSummary = false; continue; }
    if (inSummary) continue;

    if (line.startsWith('User:')) {
      if (cur) entries.push(cur);
      cur = { user: line.slice(5).trim(), assistant: '' };
      inAssistant = false;
    } else if (line.startsWith('Assistant:') && cur) {
      cur.assistant = line.slice(10).trim();
      inAssistant = true;
    } else if (inAssistant && cur) {
      cur.assistant += '\n' + line;
    }
  }
  if (cur) entries.push(cur);
  return entries;
}

function loadStore() {
  if (!existsSync(EMBED_FILE)) return [];
  try { return JSON.parse(readFileSync(EMBED_FILE, 'utf8')); }
  catch { return []; }
}

function saveStore(store) {
  writeFileSync(EMBED_FILE, JSON.stringify(store, null, 2));
}

export async function indexMemory() {
  const entries = parseMemory();
  const store   = loadStore();
  const indexed = new Set(store.map(e => e.id));
  let added = 0;

  for (const entry of entries) {
    const text = `User: ${entry.user}\nAssistant: ${entry.assistant}`;
    const id   = hashText(text);           // FIX 2: hash ID
    if (indexed.has(id)) continue;
    const embedding = await embed(text);
    store.push({ id, text, embedding, timestamp: Date.now() });
    indexed.add(id);
    added++;
    process.stdout.write(`\r  Indexed ${added} new entries...`);
  }
  if (added > 0) { saveStore(store); process.stdout.write('\n'); }
  return { total: store.length, added };
}

export async function retrieveMemory(query) {
  const store = loadStore();
  if (store.length === 0) return null;
  const qEmbed = await embed(query);
  const scored = store
    .map(e => ({ text: e.text, score: cosine(qEmbed, e.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K);
  return scored.map(e => e.text).join('\n\n');
}

// FIX 4: internal try/catch — safe to fire-and-forget from saveMemory
export async function embedNewEntry(userText, assistantText) {
  try {
    const store = loadStore();
    const text  = `User: ${userText}\nAssistant: ${assistantText}`;
    const id    = hashText(text);          // FIX 2: hash ID
    if (store.some(e => e.id === id)) return; // already indexed
    const embedding = await embed(text);
    store.push({ id, text, embedding, timestamp: Date.now() });
    saveStore(store);
  } catch { /* Ollama unavailable — silent fallback */ }
}

// ── Phase 66 — Reasoning Chain Retrieval ─────────────────────────────────────
// Finds the top-1 prior think_chain most similar to the current task.
// Quality gate: only considers chains with score >= 80.
// Returns { task_slug, agent, model, think_raw, score } or null.
export async function retrieveReasoningChain(task, agent = null) {
  let chains;
  try {
    const { readThinkChains } = await import('../../orchestrator/blackboard.js');
    chains = readThinkChains(200, 80); // quality gate: score >= 80
  } catch { return null; }
  if (!chains || chains.length === 0) return null;

  // Filter by agent if specified
  const candidates = agent
    ? chains.filter(c => c.agent === agent || !c.agent)
    : chains;
  if (candidates.length === 0) return null;

  // Embed the current task
  let qEmbed;
  try { qEmbed = await embed(task); } catch { return null; }

  // Score by cosine similarity against task_slug as proxy text
  const scored = candidates
    .filter(c => c.think_raw && c.think_raw.length > 50)
    .map(c => ({
      ...c,
      similarity: cosine(qEmbed, []) // placeholder — use task_slug embed below
    }));

  // Embed each candidate's task_slug for similarity scoring
  const withSim = await Promise.all(
    candidates
      .filter(c => c.think_raw && c.think_raw.length > 50)
      .map(async c => {
        try {
          const cEmbed = await embed(c.task_slug || c.agent || 'general');
          return { ...c, similarity: cosine(qEmbed, cEmbed) };
        } catch { return { ...c, similarity: 0 }; }
      })
  );

  withSim.sort((a, b) => b.similarity - a.similarity);
  const top = withSim[0];
  if (!top || top.similarity < 0.5) return null; // minimum similarity threshold
  return top;
}
