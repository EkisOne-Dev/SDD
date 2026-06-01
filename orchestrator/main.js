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
import { captureBaseline, checkDrift, displayDrift, displayBaseline, displayChart } from "../skills/tools/drift-control.js";
import { logCost, displayCost, showTotals, estimateTokens } from "../skills/tools/cost-tracker.js";
import { showHelp, showStatus, showProjects, showPostmortems, runMenu } from './menu.js';
import { summarizeMemoryIfNeeded } from '../skills/tools/memory-summarizer.js';
import { runEngineCheck } from '../skills/tools/engine-check.js';
import { runLearnCommand } from '../skills/tools/learn-command.js';
import { runSessionEnd } from '../skills/tools/session-end.js';
import { indexMemory } from '../skills/tools/semantic-memory.js';
import { runAudit } from '../skills/tools/audit.js';
import { runInsightsCommand } from '../skills/tools/insights-command.js';
import { generateImage } from '../skills/tools/image-gen.js';
import { runProposalManager } from "../skills/tools/proposal-manager.js";
import { runPostChain } from "./post-chain.js";
import { c } from "./colors.js";

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

  if (task.toLowerCase() === 'check-engines') {
    await runEngineCheck();
    return;
  }

  if (task.toLowerCase() === 'session-end') {
    const adapter = loadEngineAdapter();
    await runSessionEnd(adapter);
    return;
  }

  if (task.toLowerCase() === 'insights') {
    await runInsightsCommand();
    return;
  }

  if (task.toLowerCase() === 'index-memory') {
    console.log('\n🧠 Indexing memory entries with nomic-embed-text...\n');
    const { added, total } = await indexMemory();
    console.log(`✅ Done. ${added} new entries indexed. ${total} total in store.\n`);
    return;
  }

  if (task.toLowerCase().startsWith('release')) {
    const version = task.slice(7).trim();
    if (!version) {
      console.log('\nUsage: sdd release <version>  (e.g. sdd release 4.10.0)\n');
    } else {
      const { execSync } = await import('child_process');
      execSync(`node ${process.env.HOME}/sdd/scripts/sync-version.js ${version}`,
        { stdio: 'inherit' });
    }
    return;
  }

  if (task.toLowerCase().startsWith('audit')) {
    const query = task.slice(5).trim();
    if (!query) {
      console.log('\nUsage: sdd audit <capability name or keyword>\n');
    } else {
      await runAudit(query);
    }
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

  if (task.toLowerCase() === 'hook-install') {
    const { execSync } = await import('child_process');
    const hookSrc = process.env.HOME + '/sdd/hooks/pre-commit';
    const hookDst = process.env.HOME + '/sdd/.git/hooks/pre-commit';
    execSync('cp ' + hookSrc + ' ' + hookDst);
    execSync('chmod +x ' + hookDst);
    console.log('\n✅ Pre-commit hook installed — all commits will be validated.\n');
    return;
  }

  if (task.toLowerCase() === 'hook-uninstall') {
    const hookDst = process.env.HOME + '/sdd/.git/hooks/pre-commit';
    try {
      const { execSync } = await import('child_process');
      execSync('rm ' + hookDst);
      console.log('\n✅ Pre-commit hook removed.\n');
    } catch {
      console.log('\n⚠️  No hook found to remove.\n');
    }
    return;
  }

  if (task.toLowerCase() === 'backup') {
    const { execSync } = await import('child_process');
    execSync(process.env.HOME + '/sdd/backup.sh', { stdio: 'inherit' });
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

  // ── Intent Parser ────────────────────────────────────────────────────────
  if (config.intent_parser_enabled) {
    const { parseIntent } = await import('../skills/tools/intent-parser.js');
    const parsed = await parseIntent(task);
    if (parsed) {
      console.log(`\n🎯 Intent parsed [${parsed.task_type}|${parsed.complexity}] confidence:${parsed.confidence}`);
      if (parsed.interpreted_task) task = parsed.interpreted_task;
      logExecution(`INTENT PARSED: type=${parsed.task_type} complexity=${parsed.complexity} confidence=${parsed.confidence}`);
    }
  }

  // ── Skills check — Phase 47 ─────────────────────────────────────────────
  let skillContext = null;
  const matchedSkill = routeSkill(task);

  if (matchedSkill) {
    console.log(c.skill(`\n🔍 Skill: ${matchedSkill.name}`));
    logExecution(`SKILL MATCHED: ${matchedSkill.id}`);
    // Inject composed Alpha+Beta skill content as base context
    if (matchedSkill.content) skillContext = matchedSkill.content;
  }

  // Spec-clarifier pre-chain pass
  if (config.spec_clarifier_enabled && matchedSkill && matchedSkill.phase === 'pre-chain') {
    try {
      console.log(c.skill(`\n🔍 Spec Clarifier running...`));
      const clarifyPrompt = `${matchedSkill.content}\n\n## TASK\n${task}`;
      const clarification = await runEngine(clarifyPrompt, adapter);
      console.log(c.result(`\n📋 SPEC CLARIFIER\n`) + clarification + '\n');
      logExecution('SPEC CLARIFIER COMPLETE');
    } catch (err) {
      console.log(c.dim('  ⚠️  Spec clarifier skipped: ' + err.message));
    }
  }

  // Self-research appended on top of skill context
  if (config.self_research_enabled) {
    const researchContext = await runSelfResearch(task, config, adapter);
    if (researchContext) {
      skillContext = skillContext
        ? skillContext + '\n\n' + researchContext
        : researchContext;
      logExecution(`SKILL CONTEXT INJECTED`);
    }
  }

  // ── Chain selection and execution ────────────────────────────────────────
  const chain = selectChain(task);
  console.log(c.dim("⚙  Running SDD...\n"));

  try {
    const { result, complexity, promptChars } = await runChain(task, chain, config, adapter, skillContext);
    await runPostChain({ task, result, complexity, chain, promptChars, config, adapter });
  } catch (err) {
    const msg = `ERROR: ${err.message}`;
    console.error(c.error("\n" + msg));
    logExecution(msg);
  }
}

run();
