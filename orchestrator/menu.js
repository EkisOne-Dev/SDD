import readline from 'readline';

// ── Status cache — read once per session (Standard #7) ───────────────────────
let _statusCache = null;

function getStatusData(ROOT) {
  if (_statusCache) return _statusCache;
  const data = {};
  const scorePath = ROOT + '/meta/scores/scores.jsonl';
  if (existsSync(scorePath)) {
    const lines = readFileSync(scorePath, 'utf-8').trim().split('\n').filter(Boolean);
    if (lines.length) {
      try { data.lastScore = JSON.parse(lines[lines.length - 1]); } catch {}
    }
  }
  const proposalsPath = ROOT + '/meta/proposals';
  data.proposals = existsSync(proposalsPath)
    ? readdirSync(proposalsPath).filter(f => f.endsWith('.json')).length
    : 0;
  const costPath = ROOT + '/meta/costs/costs.jsonl';
  if (existsSync(costPath)) {
    const lines = readFileSync(costPath, 'utf-8').trim().split('\n').filter(Boolean);
    let total = 0;
    lines.forEach(l => { try { total += JSON.parse(l).calls ?? 1; } catch {} });
    data.apiCalls = total;
  } else { data.apiCalls = 0; }
  try { data.git = execSync(`git -C ${ROOT} log -1 --format="%h %s"`).toString().trim(); }
  catch { data.git = '—'; }
  _statusCache = data;
  return _statusCache;
}
import { askWithRl } from './utils.js';
import { execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// prompt() removed — use askWithRl() from utils.js (Standard #5)

export function showHelp() {
  console.log(`
╔══════════════════════════════════════════╗
║           SDD — Command Reference        ║
╚══════════════════════════════════════════╝

  sdd "task"              Run a single task
  sdd project "idea"      Start a pipeline project
  sdd resume <name>       Resume a paused project
  sdd costs               Show API cost totals
  sdd baseline            Lock current score averages
  sdd status              System snapshot
  sdd check-engines         Test all configured AI providers and report status
  sdd projects             List all pipeline projects and their status
  sdd postmortems          Show completed project postmortems
  sdd learn "topic"         Start or continue a Socratic learning session
  sdd learn                 List active roadmaps and progress
  sdd image "description"  Generate an image via Pollinations.ai
  sdd help                Show this reference
  sdd                     Interactive menu
`);
}

export function showStatus() {
  const d = getStatusData(ROOT);
  console.log('\n📊 SDD System Status\n');
  if (d.lastScore) {
    console.log(`  Last score:   ${d.lastScore.scores?.overall ?? '—'}/100  (${(d.lastScore.task ?? '').slice(0, 40)})`);
  } else {
    console.log('  Last score:   — (no scores yet)');
  }
  console.log(`  Proposals:    ${d.proposals} pending`);
  console.log(`  API calls:    ${d.apiCalls} logged`);
  console.log(`  Git HEAD:     ${d.git ?? '—'}`);
  console.log();
}


export function showProjects() {
  const projectsDir = path.join(ROOT, 'projects');
  if (!existsSync(projectsDir)) { console.log('\n📁 No projects found.\n'); return; }
  const projects = readdirSync(projectsDir).filter(f => {
    try { return existsSync(path.join(projectsDir, f, 'state.json')); } catch { return false; }
  });
  if (!projects.length) { console.log('\n📁 No projects found.\n'); return; }
  console.log('\n📁 SDD Projects\n');
  projects.forEach(p => {
    try {
      const state = JSON.parse(readFileSync(path.join(projectsDir, p, 'state.json'), 'utf-8'));
      const status = state.status === 'complete' ? '✅' : state.status === 'paused' ? '⏸ ' : '▶ ';
      const stage = state.current_stage ?? '—';
      const done = (state.stages_completed ?? []).length;
      console.log(`  ${status}  ${(state.original_task ?? p).slice(0, 45).padEnd(45)}  stage: ${stage.padEnd(10)}  (${done}/7 stages)`);
    } catch { console.log(`  ?  ${p}`); }
  });
  console.log('\n  Resume with: sdd resume <project-name>\n');
}

export function showPostmortems() {
  const pmDir = path.join(ROOT, 'meta/postmortems');
  if (!existsSync(pmDir)) { console.log('\n📋 No postmortems found.\n'); return; }
  const files = readdirSync(pmDir).filter(f => f.endsWith('.md')).sort();
  if (!files.length) { console.log('\n📋 No postmortems yet. Complete a pipeline project to generate one.\n'); return; }
  console.log('\n📋 SDD Postmortems\n');
  files.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
  console.log();
  const latest = files[files.length - 1];
  console.log(`--- Latest: ${latest} ---\n`);
  try {
    const content = readFileSync(path.join(pmDir, latest), 'utf-8');
    console.log(content);
  } catch { console.log('Could not read postmortem file.'); }
  console.log();
}
export async function runMenu(runTask) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log(`
╔══════════════════════════════════════════╗
║              SDD — Main Menu             ║
╚══════════════════════════════════════════╝

  1. Run a task
  2. Start a project
  3. Resume a project
  4. System status
  5. View costs
  6. Help
  7. Exit
  8. Generate an image
  9. List projects
  10. View postmortems
`);

  const choice = (await askWithRl(rl, 'Select: ')).trim();
  rl.close();

  switch (choice) {
    case '1': {
      const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout });
      const t = await prompt(rl2, 'Task: ');
      rl2.close();
      if (t.trim()) await runTask(t.trim());
      break;
    }
    case '2': {
      const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout });
      const idea = await prompt(rl2, 'Project idea: ');
      rl2.close();
      if (idea.trim()) await runTask('project ' + idea.trim());
      break;
    }
    case '3': {
      const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout });
      const name = await prompt(rl2, 'Project name: ');
      rl2.close();
      if (name.trim()) await runTask('resume ' + name.trim());
      break;
    }
    case '4': showStatus(); break;
    case '5': await runTask('costs'); break;
    case '6': showHelp(); break;
    case '8': {
      const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout });
      const desc = await prompt(rl2, 'Image description: ');
      rl2.close();
      if (desc.trim()) await runTask('image ' + desc.trim());
      break;
    }
    case '9': showProjects(); break;
    case '10': showPostmortems(); break;
    case '7':
    default:
      console.log('\nGoodbye.\n');
  }
}
