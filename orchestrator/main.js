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

async function run() {
  const task = process.argv.slice(2).join(" ");

  if (!task) {
    console.log("Usage: sdd \"your task here\"");
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
    const proceed = await checkNegotiation(task);
    if (!proceed) {
      logExecution(`TASK CANCELLED BY USER AT NEGOTIATION STEP`);
      return;
    }
  }

  // ── Load memory, agent, phase ────────────────────────────────────────────
  const memory = loadMemory(config);
  const agent = loadAgent(config.default_agent);
  const phase = loadPhase(config.default_phase);

  // ── Build and send prompt ────────────────────────────────────────────────
  const prompt = buildPrompt(
    phase.promptTemplate,
    phase.contract,
    agent,
    memory,
    task
  );

  console.log("\n⚙  Running SDD...\n");

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
