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
    case '7':
    default:
      console.log('\nGoodbye.\n');
  }
}
