import readline from 'readline';
import { execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function prompt(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

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
  sdd image "description"  Generate an image via Pollinations.ai
  sdd help                Show this reference
  sdd                     Interactive menu
`);
}

export function showStatus() {
  console.log('\n📊 SDD System Status\n');

  const scorePath = path.join(ROOT, 'meta/scores/scores.jsonl');
  if (existsSync(scorePath)) {
    const lines = readFileSync(scorePath, 'utf-8').trim().split('\n').filter(Boolean);
    if (lines.length) {
      try {
        const last = JSON.parse(lines[lines.length - 1]);
        console.log(`  Last score:   ${last.scores?.overall ?? '—'}/100  (${(last.task ?? '').slice(0, 40)})`);
      } catch { console.log('  Last score:   —'); }
    }
  } else {
    console.log('  Last score:   — (no scores yet)');
  }

  const proposalsPath = path.join(ROOT, 'meta/proposals');
  if (existsSync(proposalsPath)) {
    const count = readdirSync(proposalsPath).filter(f => f.endsWith('.json')).length;
    console.log(`  Proposals:    ${count} pending`);
  } else {
    console.log('  Proposals:    0 pending');
  }

  const costPath = path.join(ROOT, 'meta/costs/costs.jsonl');
  if (existsSync(costPath)) {
    const lines = readFileSync(costPath, 'utf-8').trim().split('\n').filter(Boolean);
    let total = 0;
    lines.forEach(l => { try { total += JSON.parse(l).calls ?? 1; } catch {} });
    console.log(`  API calls:    ${total} logged`);
  } else {
    console.log('  API calls:    0 logged');
  }

  try {
    const git = execSync(`git -C ${ROOT} log -1 --format="%h %s"`).toString().trim();
    console.log(`  Git HEAD:     ${git}`);
  } catch {
    console.log('  Git HEAD:     —');
  }

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

  const choice = (await prompt(rl, 'Select: ')).trim();
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
