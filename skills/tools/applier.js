import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../../');
const META_LOG = path.join(ROOT, 'meta/logs/self-improvements.jsonl');

const APPLY_ACTIONS = {
  clarity: {
    description: 'Added formatting mandate to all specialist agent strategy files',
    apply: () => {
      const agents = ['architect', 'developer', 'analyst', 'researcher', 'reviewer', 'mentor'];
      const addition = '\n\nFORMATTING MANDATE: Always use headers (##) and bullet points for multi-part answers. Never produce a wall of unbroken text.';
      for (const agent of agents) {
        const file = path.join(ROOT, `agents/${agent}/strategy.txt`);
        if (!fs.existsSync(file)) continue;
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('FORMATTING MANDATE')) continue;
        fs.appendFileSync(file, addition);
      }
    }
  },
  usefulness: {
    description: 'Added task-echo instruction to basic phase prompt',
    apply: () => {
      const file = path.join(ROOT, 'phases/basic/prompt.txt');
      if (!fs.existsSync(file)) return;
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('restate the core goal')) return;
      fs.appendFileSync(file, '\n\nBefore executing, restate the core goal of the task in one sentence.');
    }
  },
  efficiency: {
    description: 'Added anti-filler constraints to all agent constraint files',
    apply: () => {
      const agents = ['basic', 'architect', 'developer', 'analyst', 'researcher', 'reviewer', 'mentor'];
      const fillerRule = 'Use filler phrases like "certainly", "of course", "great question", "I hope this helps"';
      for (const agent of agents) {
        const file = path.join(ROOT, `agents/${agent}/constraints.json`);
        if (!fs.existsSync(file)) continue;
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (!data.never || data.never.includes(fillerRule)) continue;
        data.never.push(fillerRule);
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
      }
    }
  },
  redundancy: {
    description: 'Added no-repetition constraint to reviewer agent strategy',
    apply: () => {
      const file = path.join(ROOT, 'agents/reviewer/strategy.txt');
      if (!fs.existsSync(file)) return;
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('REDUNDANCY CHECK')) return;
      fs.appendFileSync(file, '\n\nREDUNDANCY CHECK: Always scan output for repeated sentences or phrases before finalizing. Remove or consolidate any duplicate content.');
    }
  }
};

function applyProposal(proposal) {
  const action = APPLY_ACTIONS[proposal.dimension];
  if (!action) {
    return { success: false, message: `No apply action defined for: ${proposal.dimension}` };
  }

  try {
    action.apply();

    const commitMsg = `Self-improvement [${proposal.dimension}]: ${action.description}`;
    execSync('git add -A', { cwd: ROOT });
    execSync(`git commit -m "${commitMsg}"`, { cwd: ROOT });
    const hash = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim();

    const entry = {
      timestamp: new Date().toISOString(),
      proposal_id: proposal.id,
      dimension: proposal.dimension,
      description: action.description,
      commit: hash
    };
    if (!fs.existsSync(path.dirname(META_LOG))) fs.mkdirSync(path.dirname(META_LOG), { recursive: true });
    fs.appendFileSync(META_LOG, JSON.stringify(entry) + '\n');

    return { success: true, description: action.description, commit: hash };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export { applyProposal };
