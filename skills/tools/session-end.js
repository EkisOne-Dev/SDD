// Phase 48 — sdd session-end
// Generates a structured session summary and appends it to history.md

import { execSync } from 'child_process';
import { readFileSync, appendFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { runEngine } from '../../orchestrator/orchestrator.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');

export async function runSessionEnd(adapter) {
  console.log('\n📋 Generating session summary...\n');

  // 1. Collect recent git commits (this session — last 12h, fallback last 5)
  let gitLog = '';
  try {
    gitLog = execSync(`git -C ${ROOT} log --oneline --since="12 hours ago"`, { encoding: 'utf-8' }).trim();
    if (!gitLog) gitLog = execSync(`git -C ${ROOT} log --oneline -5`, { encoding: 'utf-8' }).trim();
  } catch { gitLog = 'No commits found'; }

  // 2. Latest commit hash
  let latestHash = 'see git log';
  try {
    latestHash = execSync(`git -C ${ROOT} log --format="%h" -1`, { encoding: 'utf-8' }).trim();
  } catch {}

  // 3. Last ~2000 chars of SPEC changelog
  let specChangelog = '';
  try {
    const spec = readFileSync(join(ROOT, 'SPEC.md'), 'utf-8');
    const match = spec.match(/## CHANGELOG([\s\S]*)/);
    if (match) specChangelog = match[1].slice(-2000).trim();
  } catch {}

  // 4. Today's date
  const today = new Date().toISOString().split('T')[0];

  // 5. Build generation prompt
  const prompt = `You are writing a session history entry for SDD — an AI orchestration system built on Android via Termux.

Use EXACTLY this format and nothing else:
### ${today} — [short descriptive title of what was accomplished this session]
**Decision:** [what was built or changed — 1-2 sentences, specific and technical]
**Reason:** [why these changes were made — 1 sentence]
**Impact:** [what the system can now do that it could not before — 1-2 sentences]
**Commit:** ${latestHash}

RECENT GIT COMMITS THIS SESSION:
${gitLog}

RECENT SPEC CHANGELOG:
${specChangelog}

Write ONE entry. Be specific and technical. Output only the formatted block — no preamble, no explanation.`;

  // 6. Generate summary via AI
  let summary = '';
  try {
    summary = await runEngine(prompt, adapter);
  } catch (e) {
    console.error('❌ Session summary generation failed:', e.message);
    return;
  }

  // 7. Append to history.md
  const historyFile = join(ROOT, 'history.md');
  appendFileSync(historyFile, '\n\n' + summary.trim());

  console.log('\n✅ Session summary appended to history.md\n');
  console.log(summary.trim());
}
