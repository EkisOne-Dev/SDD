// orchestrator/sub-agent-manager.js — SubAgentManager (Phase 58)
// 5-phase execution: Decompose → Execute loop → Reviewer gate → Map-Reduce → Synthesis → Archive → VACUUM
// Cognitive fit routing preserved from Phase 47b.
// Reviewer gate: phi4-mini PASS/FAIL/RETRY, max 2 retries → BLOCKED.
// Compression threshold T = (context_limit × 0.75) / task_count.
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

import { loadAgent, buildPrompt, logExecution, runEngine } from './orchestrator.js';
import { c } from './colors.js';
import {
  initBlackboard,
  writePipelineTask,
  updateTaskStatus,
  writeTaskSolution,
  writeSessionContext,
  writeInteraction,
  getTaskSolutions,
  vacuumBlackboard
} from './blackboard.js';

// ── Cognitive fit map (Phase 47b) ─────────────────────────────────────────────
const COGNITIVE_FIT = {
  architect:  'qwen3:8b',
  strategist: 'qwen3:8b',
  developer:  'qwen2.5-coder:7b',
  researcher: 'qwen2.5:7b',
  reviewer:   'phi4-mini:3.8b-q4_K_M',
  validator:  'phi4-mini:3.8b-q4_K_M',
  creator:    'gemma3:4b',
  analyst:    'phi4-mini:3.8b-q4_K_M',
  basic:      'phi4-mini:3.8b-q4_K_M'
};

// ── Phase 1: Decompose ────────────────────────────────────────────────────────
// Uses architect agent to break the master task into sub-tasks.
// Returns array of { slug, description, agent } objects.
async function decompose(masterTask, config, adapter) {
  const agent = await loadAgent('architect');
  const decomposeTemplate = `{identity}

You are decomposing a complex task into atomic sub-tasks for a multi-agent system.
Master task: ${masterTask}

Respond ONLY with a JSON array. Each element must have:
  { "slug": "short-id", "description": "one sentence", "agent": "architect|developer|researcher|reviewer|creator|strategist|analyst" }

Return 2–6 sub-tasks maximum. No prose, no markdown fences — raw JSON array only.
{task}`;
  const decomposeContract = {
    goal: masterTask,
    constraints: ['Return raw JSON array only — no prose, no markdown'],
    success_criteria: 'Valid JSON array of 2-6 sub-task objects',
    output_format: 'Raw JSON array'
  };
  const prompt = buildPrompt(decomposeTemplate, decomposeContract, agent, '', masterTask, '', 'simple');
  const raw = await runEngine(prompt, adapter, 'architect', 'complex', 'architecture');
  let tasks = [];
  try {
    const clean = raw.replace(/```json|```/g, '').trim();
    tasks = JSON.parse(clean);
    if (!Array.isArray(tasks)) throw new Error('Not an array');
  } catch (e) {
    logExecution(`SubAgentManager decompose parse error: ${e.message}`);
    // Fallback: single task assigned to basic agent
    tasks = [{ slug: 'main', description: masterTask, agent: 'basic' }];
  }
  return tasks;
}

// ── Phase 2: Execute loop ─────────────────────────────────────────────────────
// Runs each sub-task through its assigned agent.
// Compression threshold T = (context_limit × 0.75) / task_count.
async function executeSubTask(subTask, masterTask, priorContext, config, adapter) {
  const contextLimit = adapter[adapter.active]?.context_limit || 8000;
  const taskCount = Math.max(priorContext.taskCount || 1, 1);
  const T = Math.floor((contextLimit * 0.75) / taskCount);

  const agentName = subTask.agent || 'basic';
  const agent = await loadAgent(agentName);

  // Build compressed prior context string within T tokens (approx 4 chars/token)
  const priorStr = priorContext.solutions.length
    ? priorContext.solutions
        .map(s => `[${s.slug}] ${s.solution}`)
        .join('\n')
        .slice(0, T * 4)
    : '';

  const systemCtx = priorStr
    ? `Prior sub-task results (compressed to fit context budget):\n${priorStr}\n\n`
    : '';

  const prompt = `${agent.identity}\n\n${agent.strategy}\n\n${systemCtx}Master task: ${masterTask}\nYour sub-task: ${subTask.description}\n\nDeliver a complete, high-quality response.`;

  const result = await runEngine(prompt, adapter, agentName, 'complex', agentName);
  return result;
}

// ── Phase 3: Reviewer gate ────────────────────────────────────────────────────
// phi4-mini reviews each sub-task result. PASS / FAIL / RETRY.
// Max 2 retries — then BLOCKED.
const REVIEWER_GATE_PROMPT = (subTask, solution) =>
  `You are a strict quality gate reviewer (phi4-mini analytical mode).
Sub-task: ${subTask.description}
Agent output:
${solution}

Evaluate ONLY whether the output directly addresses the sub-task.
Respond with EXACTLY one of:
  PASS — output is complete and on-target
  FAIL — output is off-target or unusable
  RETRY — output is partially correct but needs one more attempt

No explanation. One word only.`;

async function reviewerGate(subTask, solution, adapter) {
  const agent = await loadAgent('reviewer');
  const prompt = REVIEWER_GATE_PROMPT(subTask, solution);
  const verdict = await runEngine(prompt, adapter, 'reviewer', 'complex', 'review');
  const word = verdict.trim().split(/\s+/)[0].toUpperCase();
  if (word === 'PASS' || word === 'FAIL' || word === 'RETRY') return word;
  return 'PASS'; // Lenient default on parse failure
}

// ── Phase 4: Map-Reduce ───────────────────────────────────────────────────────
// Collects all PASS'd solutions, compresses to T tokens each, returns joined string.
function mapReduce(solutions, contextLimit, taskCount) {
  const T = Math.floor((contextLimit * 0.75) / Math.max(taskCount, 1));
  return solutions
    .filter(s => s.status === 'PASS')
    .map(s => `### ${s.slug}\n${s.solution.slice(0, T * 4)}`)
    .join('\n\n');
}

// ── Phase 5: Synthesis ────────────────────────────────────────────────────────
// Strategist agent synthesizes all PASS'd sub-results into a final unified output.
async function synthesize(masterTask, reducedContext, config, adapter) {
  const agent = await loadAgent('strategist');
  const prompt = `${agent.identity}\n\n${agent.strategy}\n\nYou are synthesizing the results of a multi-agent decomposition into a single coherent response.\n\nMaster task: ${masterTask}\n\nSub-task results:\n${reducedContext}\n\nProduce a unified, complete, well-structured final answer. Use TRI-STRUCTURE format.`;
  return runEngine(prompt, adapter, 'strategist', 'complex', 'strategy');
}

// ── Public entry point ────────────────────────────────────────────────────────

export async function runSubAgentManager(masterTask, config, adapter) {
  // Route all SAM calls through dedicated sam_provider to avoid exhausting primary cascade
  if (adapter.sam_provider && adapter[adapter.sam_provider]) {
    adapter = { ...adapter, active: adapter.sam_provider };
  }
  const sessionId = config._session_id || Date.now().toString();
  const bbPath = config.blackboard_db_path
    ? (config.blackboard_db_path.startsWith('/')
        ? config.blackboard_db_path
        : join(ROOT, config.blackboard_db_path))
    : join(ROOT, 'memory', 'blackboard.db');

  await initBlackboard(bbPath);
  logExecution(`SubAgentManager START session=${sessionId} task="${masterTask.slice(0,60)}"`);
  console.log(c.cyan('\n🧩 SubAgentManager — Decomposing task...'));

  // Phase 1: Decompose
  const subTasks = await decompose(masterTask, config, adapter);
  console.log(c.dim(`   ${subTasks.length} sub-tasks identified`));

  for (const st of subTasks) {
    writePipelineTask(sessionId, st.slug, st.agent);
  }
  writeSessionContext(sessionId, { masterTask, taskCount: subTasks.length });

  // Phase 2 + 3: Execute loop with reviewer gate
  const solutions = [];
  const priorContext = { solutions: [], taskCount: subTasks.length };

  for (const subTask of subTasks) {
    console.log(c.dim(`\n   ▶ [${subTask.slug}] ${subTask.description.slice(0, 60)}`));
    updateTaskStatus(sessionId, subTask.slug, 'running');

    let solution = null;
    let verdict = 'RETRY';
    let attempts = 0;
    const MAX_RETRIES = 2;

    while (verdict === 'RETRY' && attempts <= MAX_RETRIES) {
      if (attempts > 0) console.log(c.yellow(`   ↺ Retry ${attempts}/${MAX_RETRIES} [${subTask.slug}]`));
      solution = await executeSubTask(subTask, masterTask, priorContext, config, adapter);
      writeInteraction(sessionId, 'assistant', solution, subTask.agent);
      verdict = await reviewerGate(subTask, solution, adapter);
      attempts++;
    }

    if (verdict === 'FAIL' || (verdict === 'RETRY' && attempts > MAX_RETRIES)) {
      verdict = 'BLOCKED';
      console.log(c.red(`   ✗ [${subTask.slug}] BLOCKED after ${attempts} attempt(s)`));
      updateTaskStatus(sessionId, subTask.slug, 'blocked');
    } else {
      console.log(c.green(`   ✓ [${subTask.slug}] ${verdict}`));
      updateTaskStatus(sessionId, subTask.slug, 'done');
    }

    writeTaskSolution(sessionId, subTask.slug, subTask.agent, solution || '', 0);
    solutions.push({ slug: subTask.slug, solution: solution || '', status: verdict });
    priorContext.solutions.push({ slug: subTask.slug, solution: solution || '' });
  }

  // Phase 4: Map-Reduce
  const contextLimit = adapter[adapter.active]?.context_limit || 8000;
  const reducedContext = mapReduce(solutions, contextLimit, subTasks.length);

  const passCount = solutions.filter(s => s.status === 'PASS').length;
  const blockedCount = solutions.filter(s => s.status === 'BLOCKED').length;
  console.log(c.cyan(`\n   Map-Reduce: ${passCount} PASS, ${blockedCount} BLOCKED`));

  // Phase 5: Synthesis
  console.log(c.cyan('   Synthesizing final output...'));
  const finalOutput = await synthesize(masterTask, reducedContext, config, adapter);

  // Archive + VACUUM
  logExecution(`SubAgentManager COMPLETE session=${sessionId} pass=${passCount} blocked=${blockedCount}`);
  vacuumBlackboard(sessionId);

  return {
    output: finalOutput,
    meta: {
      subTasks: subTasks.length,
      passed: passCount,
      blocked: blockedCount,
      solutions
    }
  };
}
