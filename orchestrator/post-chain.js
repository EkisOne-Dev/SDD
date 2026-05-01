import { saveMemory, logExecution, runEngine } from "./orchestrator.js";
import { runSelfCritique } from "../skills/tools/self-critique.js";
import { scoreOutput, saveScore, displayScore } from "../skills/tools/scorer.js";
import { observe } from "../skills/tools/observer.js";
import { checkDrift, displayDrift, displayChart } from "../skills/tools/drift-control.js";
import { logCost, displayCost } from "../skills/tools/cost-tracker.js";
import { summarizeMemoryIfNeeded } from "../skills/tools/memory-summarizer.js";
import { runProposalManager } from "../skills/tools/proposal-manager.js";
import { c } from "./colors.js";

export function stripTriStructure(result, complexity) {
  if (complexity !== 'simple' || !result.includes('[INTERNAL REASONING]')) {
    return result;
  }
  const artifactMatch = result.match(/\[ARTIFACT\][^\n]*\n([\s\S]*?)(?=\[VERIFICATION\]|$)/i);
  if (artifactMatch && artifactMatch[1].trim().length > 0) {
    return artifactMatch[1].trim();
  }
  const lines = result.split('\n');
  const startIdx = lines.findIndex(line => {
    const t = line.trim();
    return t.length > 20 &&
      !t.startsWith('[') &&
      !t.startsWith('*') &&
      !t.startsWith('-') &&
      !t.match(/^\d+\./);
  });
  return startIdx >= 0 ? lines.slice(startIdx).join('\n').trim() : result;
}

export async function runPostChain({ task, result, complexity, chain, promptChars, config, adapter }) {
  let finalResult = stripTriStructure(result, complexity);

  // ── Self-critique (optional) ──────────────────────────────────────────
  if (config.self_critique_enabled && complexity === 'complex' && chain.agents.length > 1) {
    console.log(c.status('\n🔎 Running self-critique...'));
    const critique = await runSelfCritique(task, finalResult, adapter);
    if (critique && critique !== 'PASS') {
      finalResult = finalResult + '\n\n[SELF-CRITIQUE]\n' + critique;
      logExecution('SELF-CRITIQUE APPENDED');
    } else {
      logExecution('SELF-CRITIQUE: PASS');
    }
  }

  // ── Display result ────────────────────────────────────────────────────
  console.log(c.result('\n=== RESULT ===\n'));
  console.log(finalResult);

  // ── Memory ────────────────────────────────────────────────────────────
  saveMemory(config, `\nUser: ${task}\nAssistant: ${finalResult}`);
  const memAbsPath = process.env.HOME + '/sdd/' + config.memory_file;
  await summarizeMemoryIfNeeded(memAbsPath, runEngine, adapter);

  // ── Scoring ───────────────────────────────────────────────────────────
  if (config.scoring_enabled) {
    const scores = scoreOutput(task, finalResult);
    displayScore(scores);
    saveScore(task, finalResult, scores);
    logExecution(`SCORE: overall=${scores.overall} clarity=${scores.clarity} usefulness=${scores.usefulness} efficiency=${scores.efficiency} redundancy=${scores.redundancy}`);
    const driftReport = checkDrift(finalResult);
    if (driftReport) displayDrift(driftReport);
    displayChart();
  }

  // ── Meta observation ──────────────────────────────────────────────────
  if (config.meta_observation_enabled) {
    const staged = observe();
    if (staged) logExecution(`META: ${staged.length} proposal(s) staged`);
    await runProposalManager();
  }

  // ── Cost tracking ─────────────────────────────────────────────────────
  if (config.cost_tracking_enabled) {
    const costEntry = logCost(task, promptChars || task, finalResult, chain.agents.length);
    displayCost(costEntry);
    logExecution(`COST: calls=${costEntry.api_calls} tokens=${costEntry.total_tokens}`);
  }

  logExecution(`TASK COMPLETED: ${task}`);
  return finalResult;
}
