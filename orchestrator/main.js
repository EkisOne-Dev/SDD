import {
  loadConfig,
  loadEngineAdapter,
  loadMemory,
  saveMemory,
  loadAgent,
  logExecution,
  runEngine
} from "./orchestrator.js";

import { checkCapability } from "../skills/tools/capability-check.js";
import { checkNegotiation } from "../skills/tools/negotiator.js";
import { runPipeline, resumePipeline } from "./pipeline.js";
import { routeSkill } from "../skills/router.js";
import { runSelfResearch } from "../skills/tools/self-research.js";
import { selectChain, runChain } from "./chains.js";
import { runSelfCritique } from "../skills/tools/self-critique.js";
import { scoreOutput, saveScore, displayScore } from "../skills/tools/scorer.js";
import { observe } from "../skills/tools/observer.js";
import { captureBaseline, checkDrift, displayDrift, displayBaseline } from "../skills/tools/drift-control.js";
import { logCost, displayCost, showTotals, estimateTokens } from "../skills/tools/cost-tracker.js";
import { showHelp, showStatus, showProjects, showPostmortems, runMenu } from './menu.js';
import { runLearnCommand } from '../skills/tools/learn-command.js';
import { generateImage } from '../skills/tools/image-gen.js';
import { runProposalManager } from "../skills/tools/proposal-manager.js";

// ── Main execution ───────────────────────────────────────────────────────────
async function run(injectedTask = null) {
  let task = injectedTask || process.argv.slice(2).join(' ');

  // ── Pipeline mode branch ─────────────────────────────────────────────────
  if (task.toLowerCase().startsWith('project ')) {
    const projectTask = task.slice(8).trim();
    const deps = { loadAgent, loadMemory, config: loadConfig(), runEngine, adapter: loadEngineAdapter(), logExecution };
    await runPipeline(projectTask, deps);
    return;
  }

  if (task.toLowerCase() === 'help') {
    showHelp();
    return;
  }

  if (task.toLowerCase() === 'status') {
    showStatus();
    return;
  }

  if (task.toLowerCase() === 'costs') {
    showTotals();
    return;
  }

  if (task.toLowerCase() === 'baseline') {
    const result = captureBaseline();
    if (result.success) {
      displayBaseline(result.baseline);
    } else {
      console.log(`
⚠️  ${result.reason}
`);
    }
    return;
  }

  if (task.toLowerCase().startsWith('resume ')) {
    const projectName = task.slice(7).trim();
    const deps = { loadAgent, loadMemory, config: loadConfig(), runEngine, adapter: loadEngineAdapter(), logExecution };
    await resumePipeline(projectName, deps);
    return;
  }

  if (task.toLowerCase() === 'projects') {
    showProjects();
    return;
  }

  if (task.toLowerCase() === 'postmortems') {
    showPostmortems();
    return;
  }

  if (task.toLowerCase() === 'learn') {
    const adapter = loadEngineAdapter();
    await runLearnCommand(null, adapter);
    return;
  }

  if (task.toLowerCase().startsWith('learn ')) {
    const learnTopic = task.slice(6).trim();
    const adapter = loadEngineAdapter();
    await runLearnCommand(learnTopic, adapter);
    return;
  }

  if (task.toLowerCase().startsWith('image ')) {
    const description = task.slice(6).trim();
    if (!description) { console.log('Usage: sdd image "description"'); return; }
    const result = await generateImage(description);
    console.log(`\n🎨 Image Generation\n`);
    console.log(`  Prompt:  ${result.prompt}`);
    console.log(`  URL:     ${result.url}`);
    console.log(`\n  Open the URL in any browser to view/download the image.\n`);
    return;
  }

  if (!task) {
    await runMenu(run);
    return;
  }

  // ── Load system config ───────────────────────────────────────────────────
  const config = loadConfig();
  const adapter = loadEngineAdapter();

  logExecution(`TASK RECEIVED: ${task}`);

  // ── Capability check ─────────────────────────────────────────────────────
  if (config.capability_check_enabled) {
    const capable = await checkCapability(task);
    if (!capable) {
      logExecution(`CAPABILITY CHECK FAILED: ${task}`);
      return;
    }
  }

  // ── Negotiation check ────────────────────────────────────────────────────
  if (config.negotiation_enabled) {
    const negotiated = await checkNegotiation(task);
    if (negotiated === null) {
      logExecution(`TASK CANCELLED BY USER AT NEGOTIATION STEP`);
      return;
    }
    if (negotiated !== task) {
      logExecution(`TASK REWRITTEN BY NEGOTIATOR: ${negotiated}`);
    }
    task = negotiated;
  }

  // ── Skills check ─────────────────────────────────────────────────────────
  let skillContext = null;
  if (config.self_research_enabled) {
    const matchedSkill = routeSkill(task);
    if (matchedSkill) {
      console.log(`\n🔍 Skill: ${matchedSkill.name}`);
      logExecution(`SKILL MATCHED: ${matchedSkill.id}`);
    }
    skillContext = await runSelfResearch(task, config, adapter);
    if (skillContext) logExecution(`SKILL CONTEXT INJECTED`);
  }

  // ── Chain selection and execution ────────────────────────────────────────
  const chain = selectChain(task);
  console.log("⚙  Running SDD...\n");

  try {
    const { result, complexity } = await runChain(task, chain, config, adapter, skillContext);

    // ── Self-critique (optional) ─────────────────────────────────────────
    let finalResult = result;
    if (config.self_critique_enabled && complexity === "complex" && chain.agents.length > 1) {
      console.log("\n🔎 Running self-critique...");
      const critique = await runSelfCritique(task, result, adapter);
      if (critique && critique !== "PASS") {
        finalResult = result + "\n\n[SELF-CRITIQUE]\n" + critique;
        logExecution(`SELF-CRITIQUE APPENDED`);
      } else {
        logExecution(`SELF-CRITIQUE: PASS`);
      }
    }

    console.log("\n=== RESULT ===\n");
    console.log(finalResult);

    saveMemory(config, `\nUser: ${task}\nAssistant: ${finalResult}`);

    // ── Scoring ──────────────────────────────────────────────────────────
    if (config.scoring_enabled) {
      const scores = scoreOutput(task, finalResult);
      displayScore(scores);
      saveScore(task, finalResult, scores);
      logExecution(`SCORE: overall=${scores.overall} clarity=${scores.clarity} usefulness=${scores.usefulness} efficiency=${scores.efficiency} redundancy=${scores.redundancy}`);
    }
    // ── Drift control ───────────────────────────────────────────────────
    if (config.scoring_enabled) {
      const driftReport = checkDrift(finalResult);
      if (driftReport) displayDrift(driftReport);
    }

    if (config.meta_observation_enabled) {
      const staged = observe();
      if (staged) logExecution(`META: ${staged.length} proposal(s) staged`);
      await runProposalManager();
    }

    // ── Cost tracking ──────────────────────────────────────────────────
    if (config.cost_tracking_enabled) {
      const costEntry = logCost(task, task, finalResult, chain.agents.length);
      displayCost(costEntry);
      logExecution(`COST: calls=${costEntry.api_calls} tokens=${costEntry.total_tokens}`);
    }
    logExecution(`TASK COMPLETED: ${task}`);

  } catch (err) {
    const msg = `ERROR: ${err.message}`;
    console.error("\n" + msg);
    logExecution(msg);
  }
}

run();
