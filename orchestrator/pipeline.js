import fs from 'fs';
import path from 'path';
import readline from 'readline';

import { fileURLToPath } from 'url';
import { generatePostmortem } from '../skills/tools/postmortem.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SDD_ROOT = path.resolve(__dirname, '..');

const STAGES = ['propose', 'spec', 'design', 'tasks', 'apply', 'verify', 'archive'];

const STAGE_AGENTS = {
  propose:  'strategist',
  spec:     'architect',
  design:   'architect',
  tasks:    'developer',
  apply:    'developer',
  verify:   'reviewer',
  archive:  'analyst'
};

// ── Helpers ────────────────────────────────────────────────────────────────

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

function projectDir(name) {
  return path.join(SDD_ROOT, 'projects', name);
}

function statePath(name) {
  return path.join(projectDir(name), 'state.json');
}

function artifactPath(name, stage) {
  return path.join(projectDir(name), 'outputs', `${stage}.md`);
}

function loadState(name) {
  const p = statePath(name);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function saveState(state) {
  state.updated_at = new Date().toISOString();
  fs.writeFileSync(statePath(state.project_name), JSON.stringify(state, null, 2));
}

function loadArtifact(name, stage) {
  const p = artifactPath(name, stage);
  if (!fs.existsSync(p)) return '';
  return fs.readFileSync(p, 'utf8');
}

function saveArtifact(name, stage, content) {
  const p = artifactPath(name, stage);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

function loadPipelinePhase(stage) {
  const base = path.join(SDD_ROOT, 'phases', 'pipeline', stage);
  const contract = JSON.parse(fs.readFileSync(path.join(base, 'contract.json'), 'utf8'));
  const prompt   = fs.readFileSync(path.join(base, 'prompt.txt'), 'utf8');
  return { contract, prompt };
}

function loadAgentSafe(name, loadAgent) {
  try { return loadAgent(name); }
  catch (_) { return loadAgent('basic'); }
}

function buildPipelinePrompt(promptTemplate, task, memory, priorArtifact) {
  return promptTemplate
    .replace('{{task}}', task)
    .replace('{{memory}}', memory || '(none)')
    .replace('{{prior_artifact}}', priorArtifact || '(none — first stage)');
}

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

function logPipeline(projectName, message) {
  const logDir  = path.join(SDD_ROOT, 'logs');
  const logFile = path.join(logDir, new Date().toISOString().slice(0, 10) + '.log');
  fs.mkdirSync(logDir, { recursive: true });
  const entry = `[${new Date().toISOString()}] [PIPELINE:${projectName}] ${message}\n`;
  fs.appendFileSync(logFile, entry);
}

// ── Project bootstrap ───────────────────────────────────────────────────────

function createProject(task) {
  const name = slugify(task);
  const dir  = projectDir(name);

  if (fs.existsSync(statePath(name))) {
    console.log(`\n⚠️  Project "${name}" already exists.`);
    console.log(`   Use: sdd resume ${name}`);
    process.exit(0);
  }

  fs.mkdirSync(path.join(dir, 'outputs'),  { recursive: true });
  fs.mkdirSync(path.join(dir, 'context'),  { recursive: true });
  fs.mkdirSync(path.join(dir, 'logs'),     { recursive: true });

  const state = {
    project_name:      name,
    original_task:     task,
    created_at:        new Date().toISOString(),
    updated_at:        new Date().toISOString(),
    status:            'active',
    current_stage:     'propose',
    stages_completed:  [],
    artifacts:         {}
  };

  saveState(state);

  // Write objective
  fs.writeFileSync(path.join(dir, 'objective.md'), `# Project: ${name}\n\n${task}\n`);

  // Write decisions log stub
  fs.writeFileSync(path.join(dir, 'decisions.json'), JSON.stringify([], null, 2));

  logPipeline(name, `Project created — task: "${task}"`);
  return state;
}

// ── Stage runner ────────────────────────────────────────────────────────────

async function runStage(state, stage, deps) {
  const { loadAgent, loadMemory, config, runEngine, adapter, logExecution } = deps;

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`▶  STAGE: ${stage.toUpperCase()}`);
  console.log(`   Project: ${state.project_name}`);
  console.log(`${'─'.repeat(50)}`);

  const { contract, prompt: promptTemplate } = loadPipelinePhase(stage);
  const agent    = loadAgentSafe(STAGE_AGENTS[stage], loadAgent);
  const memory   = loadMemory(config);

  // Load prior artifact (previous stage output)
  const stagesIdx   = STAGES.indexOf(stage);
  const priorStage  = stagesIdx > 0 ? STAGES[stagesIdx - 1] : null;
  const priorArtifact = priorStage ? loadArtifact(state.project_name, priorStage) : '';

  const fullPrompt = buildPipelinePrompt(
    promptTemplate,
    state.original_task,
    memory,
    priorArtifact
  );

  logExecution({ stage: `PIPELINE:${stage}`, project: state.project_name, status: 'STARTED' });
  console.log(`\n⏳ Running ${stage} stage...\n`);

  let result;
  try {
    result = await runEngine(fullPrompt, adapter);
  } catch (err) {
    console.error(`\n❌ Engine error during ${stage}: ${err.message}`);
    logExecution({ stage: `PIPELINE:${stage}`, project: state.project_name, status: 'ENGINE_ERROR', error: err.message });
    throw err;
  }

  // Save artifact
  saveArtifact(state.project_name, stage, result);

  // Update state
  state.stages_completed.push(stage);
  state.artifacts[stage] = `outputs/${stage}.md`;

  const nextStage = STAGES[stagesIdx + 1] || null;
  state.current_stage = nextStage || 'complete';

  logExecution({ stage: `PIPELINE:${stage}`, project: state.project_name, status: 'COMPLETE' });
  logPipeline(state.project_name, `Stage ${stage} complete — artifact saved`);

  // Print result
  console.log(`\n${'═'.repeat(50)}`);
  console.log(result);
  console.log(`${'═'.repeat(50)}\n`);
  console.log(`✅ ${stage.toUpperCase()} complete — saved to outputs/${stage}.md`);

  return { result, nextStage };
}

// ── Confirmation prompt ─────────────────────────────────────────────────────

async function askAdvance(stage, nextStage) {
  if (!nextStage) return 'Y'; // archive is last — no prompt needed
  console.log(`\nProceed to ${nextStage.toUpperCase()}?`);
  console.log('  [Y] Yes — continue   [P] Pause   [N] Abort');
  const ans = await prompt('> ');
  return ans.toUpperCase() || 'Y';
}

// ── Main pipeline entry ─────────────────────────────────────────────────────

async function runPipeline(task, deps) {
  let state = createProject(task);

  console.log(`\n🚀 Pipeline started: ${state.project_name}`);
  console.log(`   Stages: ${STAGES.join(' → ')}\n`);

  for (const stage of STAGES) {
    // Skip already-completed stages (for resume support)
    if (state.stages_completed.includes(stage)) {
      console.log(`⏭  Skipping ${stage} (already complete)`);
      continue;
    }

    try {
      const { nextStage } = await runStage(state, stage, deps);
      saveState(state);

      if (stage === 'archive') {
        // Pipeline complete
        state.status = 'complete';
        saveState(state);
        logPipeline(state.project_name, 'Pipeline complete — all stages done');
        const pm = generatePostmortem(state.original_task, state.stages_completed);
        console.log(`
📋 Postmortem saved: ${pm.filepath}`);
        logPipeline(state.project_name, `Postmortem generated: ${pm.filepath}`);
        console.log(`\n🎉 Project "${state.project_name}" is complete.`);
        console.log(`   All artifacts in: projects/${state.project_name}/outputs/`);
        break;
      }

      const answer = await askAdvance(stage, nextStage);

      if (answer === 'P') {
        state.status = 'paused';
        saveState(state);
        logPipeline(state.project_name, `Pipeline paused after ${stage}`);
        console.log(`\n⏸  Paused after ${stage.toUpperCase()}.`);
        console.log(`   Resume with: sdd resume ${state.project_name}`);
        process.exit(0);
      }

      if (answer === 'N') {
        state.status = 'aborted';
        saveState(state);
        logPipeline(state.project_name, `Pipeline aborted after ${stage}`);
        console.log(`\n🛑 Aborted after ${stage.toUpperCase()}.`);
        console.log(`   Artifacts saved so far in: projects/${state.project_name}/outputs/`);
        process.exit(0);
      }

      // Y or anything else — continue
      console.log(`\n▶  Advancing to ${nextStage.toUpperCase()}...\n`);

    } catch (err) {
      state.status = 'error';
      saveState(state);
      console.error(`\n❌ Pipeline failed at ${stage}: ${err.message}`);
      process.exit(1);
    }
  }
}

// ── Resume entry ────────────────────────────────────────────────────────────

async function resumePipeline(projectName, deps) {
  const state = loadState(projectName);

  if (!state) {
    console.error(`\n❌ No project found: "${projectName}"`);
    console.log('   Run: sdd project "your idea" to start a new one.');
    process.exit(1);
  }

  if (state.status === 'complete') {
    console.log(`\n✅ Project "${projectName}" is already complete.`);
    console.log(`   Artifacts: projects/${projectName}/outputs/`);
    process.exit(0);
  }

  console.log(`\n▶  Resuming: ${projectName}`);
  console.log(`   Status: ${state.status}`);
  console.log(`   Completed: ${state.stages_completed.join(', ') || 'none'}`);
  console.log(`   Next stage: ${state.current_stage}`);

  state.status = 'active';

  for (const stage of STAGES) {
    if (state.stages_completed.includes(stage)) {
      console.log(`⏭  Skipping ${stage} (already complete)`);
      continue;
    }

    try {
      const { nextStage } = await runStage(state, stage, deps);
      saveState(state);

      if (stage === 'archive') {
        const pm2 = generatePostmortem(state.original_task, state.stages_completed);
        console.log(`
📋 Postmortem saved: ${pm2.filepath}`);
        logPipeline(state.project_name, `Postmortem generated: ${pm2.filepath}`);
        state.status = 'complete';
        saveState(state);
        logPipeline(state.project_name, 'Pipeline complete — resumed and finished');
        console.log(`\n🎉 Project "${state.project_name}" is complete.`);
        console.log(`   All artifacts in: projects/${state.project_name}/outputs/`);
        break;
      }

      const answer = await askAdvance(stage, nextStage);

      if (answer === 'P') {
        state.status = 'paused';
        saveState(state);
        logPipeline(state.project_name, `Pipeline paused after ${stage}`);
        console.log(`\n⏸  Paused after ${stage.toUpperCase()}.`);
        console.log(`   Resume with: sdd resume ${state.project_name}`);
        process.exit(0);
      }

      if (answer === 'N') {
        state.status = 'aborted';
        saveState(state);
        logPipeline(state.project_name, `Pipeline aborted after ${stage}`);
        console.log(`\n🛑 Aborted after ${stage.toUpperCase()}.`);
        process.exit(0);
      }

      console.log(`\n▶  Advancing to ${nextStage.toUpperCase()}...\n`);

    } catch (err) {
      state.status = 'error';
      saveState(state);
      console.error(`\n❌ Pipeline failed at ${stage}: ${err.message}`);
      process.exit(1);
    }
  }
}

export { runPipeline, resumePipeline, createProject, STAGES };
