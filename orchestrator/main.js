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

// ── Main execution ───────────────────────────────────────────────────────────
async function run() {
  let task = process.argv.slice(2).join(' ');

  // ── Pipeline mode branch ─────────────────────────────────────────────────
  if (task.toLowerCase().startsWith('project ')) {
    const projectTask = task.slice(8).trim();
    const deps = { loadAgent, loadMemory, config: loadConfig(), runEngine, adapter: loadEngineAdapter(), logExecution };
    await runPipeline(projectTask, deps);
    return;
  }

  if (task.toLowerCase().startsWith('resume ')) {
    const projectName = task.slice(7).trim();
    const deps = { loadAgent, loadMemory, config: loadConfig(), runEngine, adapter: loadEngineAdapter(), logExecution };
    await resumePipeline(projectName, deps);
    return;
  }

  if (!task) {
    console.log("Usage:  sdd \"your task here\"");
    console.log("        sdd project \"your idea\"");
    console.log("        sdd resume <project-name>");
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
    logExecution(`TASK COMPLETED: ${task}`);

  } catch (err) {
    const msg = `ERROR: ${err.message}`;
    console.error("\n" + msg);
    logExecution(msg);
  }
}

run();
