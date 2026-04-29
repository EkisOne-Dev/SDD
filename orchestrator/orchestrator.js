import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ── Config loaders ────────────────────────────────────────────────────────────

export function loadConfig() {
  const raw = fs.readFileSync(path.join(ROOT, "config/system.json"), "utf-8");
  return JSON.parse(raw);
}

export function loadEngineAdapter() {
  const raw = fs.readFileSync(path.join(ROOT, "engine/adapter.json"), "utf-8");
  return JSON.parse(raw);
}

// ── Memory ────────────────────────────────────────────────────────────────────

export function loadMemory(config) {
  try {
    return fs.readFileSync(path.join(ROOT, config.memory_file), "utf-8");
  } catch {
    return "";
  }
}

export function saveMemory(config, entry) {
  const memPath = path.join(ROOT, config.memory_file);
  fs.appendFileSync(memPath, entry + "\n");
  try {
    const stats = fs.statSync(memPath);
    if (stats.size > 50 * 1024) {
      logExecution("WARNING: memory.txt exceeds 50KB — compression recommended");
      console.log("\n⚠️  Memory file exceeds 50KB. Consider running memory compression.");
    }
  } catch (_) {}
}

// ── Agent loader ──────────────────────────────────────────────────────────────

export function loadAgent(agentName) {
  const agentDir = path.join(ROOT, "agents", agentName);
  const identity = fs.readFileSync(path.join(agentDir, "identity.txt"), "utf-8");
  const strategy = fs.readFileSync(path.join(agentDir, "strategy.txt"), "utf-8");
  const constraints = JSON.parse(
    fs.readFileSync(path.join(agentDir, "constraints.json"), "utf-8")
  );
  return { identity, strategy, constraints };
}

// ── Phase loader ──────────────────────────────────────────────────────────────

export function loadPhase(phaseName) {
  const phaseDir = path.join(ROOT, "phases", phaseName);
  const contract = JSON.parse(
    fs.readFileSync(path.join(phaseDir, "contract.json"), "utf-8")
  );
  const promptTemplate = fs.readFileSync(path.join(phaseDir, "prompt.txt"), "utf-8");
  return { contract, promptTemplate };
}

// ── Prompt builder ────────────────────────────────────────────────────────────

export function buildPrompt(template, contract, agent, memory, task, priorOutput = "", complexity = "complex") {
  const triBlock = complexity === "simple" ? `Respond directly and concisely. Do NOT use [INTERNAL REASONING], [ARTIFACT], or [VERIFICATION] sections. No section headers. Start immediately with the answer.` : `If you are a specialist agent (architect, developer, researcher, reviewer, analyst, mentor, strategist), structure your response using TRI-STRUCTURE:

[INTERNAL REASONING]
- Break down the task into first principles
- Identify constraints and dependencies
- State your approach before executing

[ARTIFACT]
- Deliver the final high-quality output here
- Code must be complete and production-ready
- Analysis must use structured formats

[VERIFICATION]
- List 3 specific criteria proving this output is correct

If you are the basic agent, respond directly without TRI-STRUCTURE.`;
  return template
    .replace("{goal}", contract.goal)
    .replace("{constraints}", contract.constraints.join(", "))
    .replace("{success_criteria}", contract.success_criteria)
    .replace("{output_format}", contract.output_format)
    .replace("{memory}", memory || "No memory context yet.")
    .replace("{prior_output}", priorOutput || "(none — first agent in chain)")
    .replace("{identity}", agent.identity)
    .replace("{strategy}", agent.strategy)
    .replace("{tri_structure}", triBlock)
    .replace("{task}", task);
}

// ── Logger ────────────────────────────────────────────────────────────────────

export function logExecution(entry) {
  const today = new Date().toISOString().split("T")[0];
  const logFile = path.join(ROOT, "logs", `${today}.log`);
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `[${timestamp}] ${entry}\n`);
}

// ── AI engine runner ──────────────────────────────────────────────────────────

export async function runEngine(prompt, adapter, agentName = null, complexity = "simple") {
  let active = { ...adapter[adapter.active] };
  if (agentName && adapter.agent_models && adapter.agent_models[agentName]) {
    const modelMap = adapter.agent_models[agentName];
    const chosenModel = modelMap[complexity] || modelMap["simple"];
    if (chosenModel && active.provider === "gemini" && chosenModel.includes("deepseek")) {
      active = { ...adapter["fallback"], model: chosenModel };
    } else if (chosenModel) {
      active.model = chosenModel;
    }
  }

  if (active.provider === "gemini") {
    return await runGemini(prompt, active);
  }

  if (active.provider === "openrouter") {
    return await runOpenRouter(prompt, active);
  }

  if (active.provider === "ollama") {
    return await runOllama(prompt, active);
  }

  throw new Error(`Unknown provider: ${active.provider}`);
}

async function runGemini(prompt, config) {
  const apiKey = process.env[config.api_key_env];
  if (!apiKey) throw new Error(`Missing env variable: ${config.api_key_env}`);

  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: config.model });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function runOpenRouter(prompt, config) {
  const apiKey = process.env[config.api_key_env];
  if (!apiKey) throw new Error(`Missing env variable: ${config.api_key_env}`);

  const response = await fetch(`${config.base_url}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: config.max_tokens
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter error: ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function runOllama(prompt, config) {
  const response = await fetch(`${config.base_url}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.model,
      prompt: prompt,
      stream: false
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Ollama error: ${err}`);
  }

  const data = await response.json();
  return data.response;
}
