import {
  loadConfig,
  loadEngineAdapter,
  loadMemory,
  saveMemory,
  loadAgent,
  loadPhase,
  buildPrompt,
  logExecution,
  runEngine
} from "./orchestrator.js";

import { checkCapability } from "../skills/tools/capability-check.js";
import { checkNegotiation } from "../skills/tools/negotiator.js";
import { runPipeline, resumePipeline } from "./pipeline.js";
import { routeSkill } from "../skills/router.js";
import { runSelfResearch } from "../skills/tools/self-research.js";

// ── Agent routing ────────────────────────────────────────────────────────────
function selectAgent(task) {
  const t = task.toLowerCase();

  const routes = [
    {
      agent: "architect",
      keywords: [
        "design", "architecture", "structure", "system", "plan",
        "diagram", "component", "module", "schema", "blueprint",
        "scaffold", "layout", "hierarchy", "dependency"
      ]
    },
    {
      agent: "developer",
      keywords: [
        "code", "bug", "fix", "debug", "function", "script",
        "implement", "programming", "refactor", "error", "exception",
        "class", "method", "api", "build", "compile", "test"
      ]
    },
    {
      agent: "researcher",
      keywords: [
        "research", "find", "look up", "what is", "explain",
        "summarize", "fact", "source", "compare", "difference",
        "how does", "why does", "background", "history", "overview"
      ]
    },
    {
      agent: "reviewer",
      keywords: [
        "review", "check", "critique", "evaluate", "assess",
        "feedback", "quality", "improve", "audit", "validate",
        "proofread", "analyse", "analyze", "rate", "score"
      ]
    }
  ];

  for (const route of routes) {
    if (route.keywords.some(k => t.includes(k))) {
      return route.agent;
    }
  }

  return "basic";
}

// ── Main execution ───────────────────────────────────────────────────────────
async function run() {
  let task = process.argv.slice(2).join(' ');

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

  const config = loadConfig();
  const adapter = loadEngineAdapter();

  logExecution(`TASK RECEIVED: ${task}`);

  if (config.capability_check_enabled) {
    const capable = await checkCapability(task);
    if (!capable) {
      logExecution(`CAPABILITY CHECK FAILED: ${task}`);
      return;
    }
  }

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
    if (skillContext) {
      logExecution(`SKILL CONTEXT INJECTED`);
    }
  }

  const agentName = selectAgent(task);
  console.log(`\n🤖 Agent: ${agentName}`);
  logExecution(`AGENT SELECTED: ${agentName}`);

  const rawMemory = loadMemory(config);
  const memory = skillContext
    ? rawMemory + "\n\n[SKILL CONTEXT — Self Research]\n" + skillContext
    : rawMemory;

  const agent = loadAgent(agentName);
  const phase = loadPhase(config.default_phase);

  const prompt = buildPrompt(
    phase.promptTemplate,
    phase.contract,
    agent,
    memory,
    task
  );

  console.log("⚙  Running SDD...\n");

  try {
    const result = await runEngine(prompt, adapter);

    console.log("=== RESULT ===\n");
    console.log(result);

    saveMemory(config, `\nUser: ${task}\nAssistant: ${result}`);
    logExecution(`TASK COMPLETED: ${task}`);

  } catch (err) {
    const msg = `ERROR: ${err.message}`;
    console.error("\n" + msg);
    logExecution(msg);
  }
}

run();
