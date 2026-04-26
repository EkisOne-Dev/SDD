import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../../');
const COSTS_DIR = path.join(ROOT, 'meta/costs');
const COSTS_FILE = path.join(COSTS_DIR, 'costs.jsonl');

// Gemini Flash free tier approximate token costs (for awareness only)
const CHARS_PER_TOKEN = 4;

function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

function logCost(task, prompt, result, agentCount) {
  const inputTokens = estimateTokens(prompt);
  const outputTokens = estimateTokens(result);
  const totalTokens = inputTokens + outputTokens;

  const entry = {
    timestamp: new Date().toISOString(),
    task: task.substring(0, 80),
    api_calls: agentCount,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_tokens: totalTokens
  };

  if (!fs.existsSync(COSTS_DIR)) fs.mkdirSync(COSTS_DIR, { recursive: true });
  fs.appendFileSync(COSTS_FILE, JSON.stringify(entry) + '\n');

  return entry;
}

function displayCost(entry) {
  console.log('─────────────────────────');
  console.log('💰 COST ESTIMATE');
  console.log('─────────────────────────');
  console.log(`  API calls     ${entry.api_calls}`);
  console.log(`  Input tokens  ~${entry.input_tokens}`);
  console.log(`  Output tokens ~${entry.output_tokens}`);
  console.log(`  Total tokens  ~${entry.total_tokens}`);
  console.log('─────────────────────────\n');
}

function showTotals() {
  if (!fs.existsSync(COSTS_FILE)) {
    console.log('\n⚠️  No cost data yet. Run some tasks first.\n');
    return;
  }

  const lines = fs.readFileSync(COSTS_FILE, 'utf8').trim().split('\n').filter(Boolean);
  const entries = lines.map(l => JSON.parse(l));

  const totalCalls = entries.reduce((s, e) => s + e.api_calls, 0);
  const totalTokens = entries.reduce((s, e) => s + e.total_tokens, 0);
  const avgTokens = Math.round(totalTokens / entries.length);

  console.log('\n─────────────────────────');
  console.log('💰 COST TOTALS');
  console.log('─────────────────────────');
  console.log(`  Runs tracked  ${entries.length}`);
  console.log(`  Total calls   ${totalCalls}`);
  console.log(`  Total tokens  ~${totalTokens}`);
  console.log(`  Avg per run   ~${avgTokens} tokens`);
  console.log('─────────────────────────\n');
}

export { logCost, displayCost, showTotals, estimateTokens };
