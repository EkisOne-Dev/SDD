import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCORES_FILE = path.join(__dirname, '../../meta/scores/scores.jsonl');
const PROPOSALS_DIR = path.join(__dirname, '../../meta/proposals');

const THRESHOLD = 60;
const WINDOW = 5;
const MIN_TRIGGERS = 3;

const HINTS = {
  clarity: {
    issue: 'Output lacks structure — missing headers, lists, or has dense unbroken text.',
    suggestion: 'Add explicit formatting instructions to agent strategy files: require headers and bullet points for multi-part answers.'
  },
  usefulness: {
    issue: 'Output has low keyword overlap with the task — may be drifting off-topic.',
    suggestion: 'Add a task-echo step to agent prompts: agents should restate the task goal before executing.'
  },
  efficiency: {
    issue: 'Output contains filler phrases or is poorly sized relative to task complexity.',
    suggestion: 'Add anti-filler constraints to all agent strategy files and the basic phase contract.'
  },
  redundancy: {
    issue: 'Output contains repeated phrases or sentences.',
    suggestion: 'Add a no-repetition constraint to the reviewer agent. Reviewer should flag and remove duplicate content.'
  }
};

function readScores() {
  if (!fs.existsSync(SCORES_FILE)) return [];
  const lines = fs.readFileSync(SCORES_FILE, 'utf8').trim().split('\n').filter(Boolean);
  return lines.map(l => JSON.parse(l));
}

function getPendingDimensions() {
  if (!fs.existsSync(PROPOSALS_DIR)) return new Set();
  const files = fs.readdirSync(PROPOSALS_DIR).filter(f => f.endsWith('.json'));
  const pending = new Set();
  for (const f of files) {
    try {
      const p = JSON.parse(fs.readFileSync(path.join(PROPOSALS_DIR, f), 'utf8'));
      if (p.status === 'pending') pending.add(p.dimension);
    } catch {}
  }
  return pending;
}

function observe() {
  const scores = readScores();
  if (scores.length < WINDOW) return null;

  const recent = scores.slice(-WINDOW);
  const pendingDimensions = getPendingDimensions();
  const dimensions = ['clarity', 'usefulness', 'efficiency', 'redundancy'];
  const staged = [];

  for (const dim of dimensions) {
    if (pendingDimensions.has(dim)) continue;
    const lowCount = recent.filter(s => s.scores[dim] < THRESHOLD).length;
    if (lowCount >= MIN_TRIGGERS) {
      const avg = Math.round(recent.reduce((sum, s) => sum + s.scores[dim], 0) / recent.length);
      const proposal = {
        id: `${dim}-${Date.now()}`,
        dimension: dim,
        status: 'pending',
        created: new Date().toISOString(),
        observed: `${dim} scored below ${THRESHOLD} in ${lowCount} of the last ${WINDOW} runs (avg: ${avg})`,
        issue: HINTS[dim].issue,
        suggestion: HINTS[dim].suggestion,
        snoozed_until: null,
        resolved: null
      };
      if (!fs.existsSync(PROPOSALS_DIR)) fs.mkdirSync(PROPOSALS_DIR, { recursive: true });
      fs.writeFileSync(
        path.join(PROPOSALS_DIR, `${proposal.id}.json`),
        JSON.stringify(proposal, null, 2)
      );
      staged.push(proposal);
    }
  }

  return staged.length > 0 ? staged : null;
}

export { observe };
