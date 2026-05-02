// ── SDD Code Quality Checker — called by pre-commit hook per file ─────────────
// Usage: node hooks/check.js <filepath>
// Output: first line is PASS or FAIL, followed by violation messages

import { readFileSync } from 'fs';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = process.argv[2];

if (!filePath) {
  console.log('FAIL');
  console.log('No file path provided');
  process.exit(1);
}

let content;
try {
  content = readFileSync(filePath, 'utf8');
} catch {
  console.log('FAIL');
  console.log(`Cannot read file: ${filePath}`);
  process.exit(1);
}

const violations = [];

// ── STD-8: No object-style logExecution calls ─────────────────────────────────
const logMatches = content.match(/logExecution\s*\(\s*\{/g) || [];
if (logMatches.length > 0) {
  violations.push(`[STD-8] logExecution() called with object argument (${logMatches.length}x) — use template literal string`);
}

// ── STD-3: No dead code aliases ───────────────────────────────────────────────
const deadAliasLines = content.split('\n').filter(line => {
  const trimmed = line.trim();
  return trimmed.startsWith('const finalPrompt = prompt') ||
         trimmed.startsWith('const finalResult = result;');
});
if (deadAliasLines.length > 0) {
  violations.push('[STD-3] Dead code alias detected — const X = Y where both are identical references');
}

// ── STD-4: No variable shadowing (agents inside loop) ────────────────────────
if (/for\s*\(let\s+i/.test(content) && /const\s+agents\s*=\s*effectiveAgents/.test(content)) {
  violations.push('[STD-4] Variable shadowing: const agents = effectiveAgents shadows outer agents');
}

// ── STD-7: readFileSync inside exported function without cache ────────────────
const exportFnWithRead = content.match(/export\s+(async\s+)?function\s+\w+[^{]*\{[\s\S]{0,800}readFileSync/);
if (exportFnWithRead && !content.includes('_cache') && !content.includes('Cache =')) {
  violations.push('[STD-7] readFileSync inside exported function — add module-level cache');
}

// ── STD-9: loadMemory called without task argument ────────────────────────────
const loadMemoryNoTask = content.split('\n').filter(line => {
  const trimmed = line.trim();
  return /^\s*(const|let|var|await|return)?\s*loadMemory\s*\(\s*config\s*\)/.test(trimmed) &&
    !trimmed.startsWith('//') &&
    !trimmed.startsWith('*') &&
    !trimmed.includes("'loadMemory") &&
    !trimmed.includes('"loadMemory') &&
    !trimmed.includes('match(') &&
    !trimmed.includes('includes(');
});
if (loadMemoryNoTask.length > 0) {
  violations.push(`[STD-9] loadMemory(config) called without task argument (${loadMemoryNoTask.length}x) — pass task as second argument`);
}

if (violations.length > 0) {
  console.log('FAIL');
  violations.forEach(v => console.log(v));
} else {
  console.log('PASS');
}
