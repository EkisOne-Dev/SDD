import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');

const THRESHOLD = 40 * 1024;  // 40KB — trigger summarization
const TARGET    = 20 * 1024;  // 20KB — target after summarization
const KEEP_RECENT = 5;         // always keep last N exchanges verbatim

function parseExchanges(text) {
  const exchanges = [];
  const lines = text.split('\n');
  let current = null;

  for (const line of lines) {
    if (line.startsWith('User: ')) {
      if (current) exchanges.push(current);
      current = { user: line.slice(6).trim(), assistant: '' };
    } else if (line.startsWith('Assistant: ') && current) {
      current.assistant = line.slice(11).trim();
    } else if (current && current.assistant !== undefined) {
      current.assistant += '\n' + line;
    }
  }
  if (current) exchanges.push(current);
  return exchanges.filter(e => e.user && e.assistant.trim());
}

function groupByTopic(exchanges) {
  const groups = {};
  for (const ex of exchanges) {
    const task = ex.user.toLowerCase();
    let topic = 'general';
    if (/code|function|variable|debug|script|build|implement/.test(task)) topic = 'programming';
    else if (/design|architecture|system|structure|plan/.test(task)) topic = 'architecture';
    else if (/analyze|data|compare|report|insight/.test(task)) topic = 'analysis';
    else if (/learn|teach|explain|what is|how does/.test(task)) topic = 'learning';
    else if (/strategy|roadmap|prioritize|framework/.test(task)) topic = 'strategy';
    else if (/write|create|draft|content|story/.test(task)) topic = 'creative';
    if (!groups[topic]) groups[topic] = [];
    groups[topic].push(ex.user.slice(0, 80));
  }
  return groups;
}

function buildSummary(groups) {
  const lines = ['[MEMORY SUMMARY — older sessions compressed]'];
  for (const [topic, tasks] of Object.entries(groups)) {
    lines.push(`${topic}: ${tasks.join(' | ')}`);
  }
  lines.push('[END SUMMARY]');
  return lines.join('\n');
}

export async function summarizeMemoryIfNeeded(memoryFilePath, runEngine, adapter) {
  if (!memoryFilePath || typeof memoryFilePath !== 'string' || !existsSync(memoryFilePath)) return false;

  const stat = readFileSync(memoryFilePath);
  if (stat.length < THRESHOLD) return false;

  console.log('\n🧠 Memory threshold reached — compressing older entries...');

  const text = readFileSync(memoryFilePath, 'utf-8');
  const exchanges = parseExchanges(text);

  if (exchanges.length <= KEEP_RECENT) return false;

  const older = exchanges.slice(0, -KEEP_RECENT);
  const recent = exchanges.slice(-KEEP_RECENT);

  // Group older by topic and build summary
  const groups = groupByTopic(older);
  const summary = buildSummary(groups);

  // Rebuild: summary block + recent verbatim
  const recentText = recent
    .map(e => `User: ${e.user}\nAssistant: ${e.assistant.trim()}`)
    .join('\n\n');

  const newContent = summary + '\n\n' + recentText + '\n';

  // Backup before overwriting
  copyFileSync(memoryFilePath, memoryFilePath.replace('memory.txt', 'memory.backup.txt'));
  writeFileSync(memoryFilePath, newContent);

  const newSize = Buffer.byteLength(newContent, 'utf-8');
  console.log(`✅ Memory compressed: ${Math.round(stat.length/1024)}KB → ${Math.round(newSize/1024)}KB (backup saved)\n`);
  return true;
}
