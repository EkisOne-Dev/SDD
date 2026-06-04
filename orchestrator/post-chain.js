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


// ── Map-Reduce compression (Priority 1) ──────────────────────────────────────
// Compresses final result when it exceeds threshold T for the active provider.
// T = (context_limit × 0.75) / agentCount — dynamic per active cascade slot.
// Uses Ollama phi4-mini — local, zero API cost.

async function compressOutput(result, agentCount, adapter) {
  const activeKey = adapter.active || 'primary';
  const contextLimit = (adapter[activeKey] && adapter[activeKey].context_limit) || 32000;
  const T_tokens = Math.floor((contextLimit * 0.75) / Math.max(agentCount, 1));
  const T_chars = T_tokens * 4;

  if (!result || result.length <= T_chars) return { result, compressed: false };

  const phi4Config = {
    provider: 'ollama',
    model: 'phi4-mini:3.8b-q4_K_M',
    base_url: 'http://localhost:11434',
    context_limit: 32768
  };

  const prompt = `You are a compression agent. Your only job is to compress the following text.

RULES:
- Preserve ALL technical content: code, variables, decisions, specific values, named entities
- Preserve ALL conclusions and recommendations
- Remove: reasoning artifacts, hedging, repetition, verbose explanations, filler phrases
- Output ONLY the compressed content — no preamble, no meta-commentary
- Target: reduce to 40-60% of original length without losing substance

TEXT TO COMPRESS:
${result.slice(0, T_chars * 2)}`;

  try {
    const { default: fetch } = await import('node-fetch');
    const res = await fetch(`${phi4Config.base_url}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: phi4Config.model, prompt, stream: false })
    });
    const data = await res.json();
    const compressed = data.response && data.response.trim();
    if (!compressed || compressed.length < 50) return { result, compressed: false };
    return { result: compressed, compressed: true, originalChars: result.length, finalChars: compressed.length };
  } catch (err) {
    return { result, compressed: false, error: err.message };
  }
}
export async function runPostChain({ task, result, complexity, chain, promptChars, config, adapter }) {
  let finalResult = stripTriStructure(result, complexity);

  // ── Map-Reduce compression ────────────────────────────────────────────
  if (config.map_reduce_enabled && (complexity === 'complex' || complexity === 'moderate')) {
    const agentCount = chain.agents ? chain.agents.length : 1;
    const { result: compressed, compressed: wasCompressed, originalChars, finalChars } = await compressOutput(finalResult, agentCount, adapter);
    if (wasCompressed) {
      finalResult = compressed;
      const ratio = Math.round((finalChars / originalChars) * 100);
      console.log(c.dim(`\n🗜  Map-Reduce: ${originalChars} → ${finalChars} chars (${ratio}% of original)`));
      logExecution(`MAP_REDUCE: ${originalChars} → ${finalChars} chars (${ratio}%)`);
    }
  }

  // ── Self-critique (optional) ──────────────────────────────────────────
  if (config.self_critique_enabled && complexity === 'complex' && chain.agents.length > 1) { // moderate skips self-critique
    console.log(c.status('\n🔎 Running self-critique...'));
    const critique = await runSelfCritique(task, finalResult, adapter);
    if (critique && critique !== 'PASS') {
      finalResult = finalResult + '\n\n[SELF-CRITIQUE]\n' + critique;
      logExecution('SELF-CRITIQUE APPENDED');
    } else {
      logExecution('SELF-CRITIQUE: PASS');
    }
  }

  // ── Guardian Angel — Phase 47 ──────────────────────────────────────────
  if (config.guardian_angel_enabled) {
    try {
      const { routeSkill } = await import('../skills/router.js');
      const ga = routeSkill('__post_chain__');
      if (ga && ga.content) {
        console.log(c.status('\n👼 Guardian Angel auditing...'));
        const gaPrompt = ga.content + '\n\n## ORIGINAL TASK\n' + task + '\n\n## OUTPUT TO AUDIT\n' + finalResult;
        const gaReport = await runEngine(gaPrompt, adapter);
        console.log(c.dim('\n─── GUARDIAN REPORT ───'));
        console.log(c.dim(gaReport));
        console.log(c.dim('───────────────────────'));
        logExecution('GUARDIAN ANGEL COMPLETE');
      }
    } catch (err) {
      console.log(c.dim('  ⚠️  Guardian angel skipped: ' + err.message));
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
