import fs from "fs";
import { createSpinner } from "./spinner.js";
import { validateSystemConfig, validateAdapterConfig } from "./validator.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ── Config loaders ────────────────────────────────────────────────────────────

export function loadConfig() {
  const filePath = path.join(ROOT, "config/system.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const config = JSON.parse(raw);
  validateSystemConfig(config, filePath);
  return config;
}

export function loadEngineAdapter() {
  const filePath = path.join(ROOT, "engine/adapter.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const adapter = JSON.parse(raw);
  validateAdapterConfig(adapter, filePath);
  return adapter;
}

// ── Memory ────────────────────────────────────────────────────────────────────

export function loadMemory(config, task = "") {
  try {
    const raw = fs.readFileSync(path.join(ROOT, config.memory_file), "utf-8");
    if (!task) return raw.slice(-2000);

    // Parse into exchange pairs
    const lines = raw.split("\n");
    const exchanges = [];
    let current = null;

    for (const line of lines) {
      if (line.startsWith("User:")) {
        if (current) exchanges.push(current);
        current = { user: line, assistant: [] };
      } else if (current) {
        current.assistant.push(line);
      }
    }
    if (current) exchanges.push(current);

    if (exchanges.length === 0) return "";

    // Always keep last 5 verbatim
    const KEEP_LAST = 5;
    const recent = exchanges.slice(-KEEP_LAST);
    const older = exchanges.slice(0, -KEEP_LAST);

    // Score older exchanges by keyword overlap with task
    const taskWords = new Set(
      task.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(" ").filter(w => w.length > 3)
    );

    const scored = older.map(ex => {
      const text = (ex.user + " " + ex.assistant.join(" ")).toLowerCase();
      let score = 0;
      for (const word of taskWords) {
        if (text.includes(word)) score++;
      }
      return { ex, score };
    });

    // Take top 3 relevant older exchanges
    const relevant = scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(s => s.ex);

    const toInject = [...relevant, ...recent];

    // Serialize and cap at 2000 chars
    let result = toInject.map(ex =>
      ex.user + "\n" + ex.assistant.join("\n")
    ).join("\n");

    if (result.length > 2000) result = result.slice(-2000);
    return result;

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
  } catch (err) {
    logExecution(`WARNING: saveMemory stat check failed — ${err.message}`);
  }
}

// ── Agent loader ──────────────────────────────────────────────────────────────

// ── Agent cache — read once per agent name, reuse (Standard #7) ──────────────
const _agentCache = {};

export function loadAgent(agentName) {
  if (_agentCache[agentName]) return _agentCache[agentName];
  const agentDir = path.join(ROOT, "agents", agentName);
  const identity = fs.readFileSync(path.join(agentDir, "identity.txt"), "utf-8");
  const strategy = fs.readFileSync(path.join(agentDir, "strategy.txt"), "utf-8");
  const constraints = JSON.parse(
    fs.readFileSync(path.join(agentDir, "constraints.json"), "utf-8")
  );
  _agentCache[agentName] = { identity, strategy, constraints };
  return _agentCache[agentName];
}

// ── Phase loader ──────────────────────────────────────────────────────────────

// ── Phase cache — read once per chain type, reuse (Standard #7) ─────────────
const _phaseCache = {};

export function loadPhase(phaseName, chainType = null) {
  const cacheKey = chainType || phaseName;
  if (_phaseCache[cacheKey]) return _phaseCache[cacheKey];

  const chainPhaseDir = chainType ? path.join(ROOT, "phases", chainType) : null;
  const defaultPhaseDir = path.join(ROOT, "phases", phaseName);

  let contractPath = path.join(defaultPhaseDir, "contract.json");
  if (chainPhaseDir && fs.existsSync(path.join(chainPhaseDir, "contract.json"))) {
    contractPath = path.join(chainPhaseDir, "contract.json");
  }

  const contract = JSON.parse(fs.readFileSync(contractPath, "utf-8"));
  const promptTemplate = fs.readFileSync(path.join(defaultPhaseDir, "prompt.txt"), "utf-8");
  _phaseCache[cacheKey] = { contract, promptTemplate };
  return _phaseCache[cacheKey];
}

// ── Prompt builder ────────────────────────────────────────────────────────────

export function buildPrompt(template, contract, agent, memory, task, priorOutput = "", complexity = "complex", reviewFocus = "Check for clarity, completeness, and accuracy") {
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
    .replace("{task}", task)
    .replace("{review_focus}", reviewFocus);
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
  if (agentName && adapter.agent_models && adapter.agent_models[agentName] && active.provider === "gemini") {
    const modelMap = adapter.agent_models[agentName];
    const chosenModel = modelMap[complexity] || modelMap["simple"];
    if (chosenModel) {
      active.model = chosenModel;
    }
  }

  // Cascade fallback chain on failure
  const providerChain = [
    adapter.active,
    ...['fallback', 'fallback2', 'fallback3', 'fallback4', 'local_fallback'].filter(k => adapter[k])
  ];

  async function tryWithFallback(providers, idx = 0) {
    if (idx >= providers.length) throw new Error('All providers exhausted');
    const providerKey = providers[idx];
    const providerConfig = providerKey === adapter.active ? active : { ...adapter[providerKey] };
    try {
      const spinner = createSpinner(providerConfig.model);
      spinner.start();
      try {
        const result = await executeEngine(prompt, providerConfig);
        spinner.stop();
        return result;
      } catch (e) {
        spinner.stop();
        throw e;
      }
    } catch (e) {
      const isRetryable = e.status === 429 || e.status === 503 || (e.message && (e.message.includes('429') || e.message.includes('503') || e.message.includes('quota')));
      if (isRetryable && idx + 1 < providers.length) {
        const nextConfig = providers[idx + 1] === adapter.active ? active : adapter[providers[idx + 1]];
        console.log(`\n⚡ ${providerConfig.model} unavailable — switching to ${nextConfig?.model ?? providers[idx + 1]}...`);
        return tryWithFallback(providers, idx + 1);
      }
      throw e;
    }
  }

  return tryWithFallback(providerChain);
}

async function executeEngine(prompt, active) {

  if (active.provider === "groq") {
    return await runOpenAICompatible(prompt, active);
  }

  if (active.provider === "cerebras") {
    return await runOpenAICompatible(prompt, active);
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

async function runOpenAICompatible(prompt, config) {
  const apiKey = process.env[config.api_key_env];
  if (!apiKey) throw new Error(`Missing env variable: ${config.api_key_env}`);
  const response = await fetch(`${config.base_url}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: config.max_tokens ?? 4096,
      messages: [{ role: "user", content: prompt }]
    }),
    signal: AbortSignal.timeout(config.timeout_ms ?? 15000)
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const e = new Error(`${config.provider} error: ${err?.message ?? response.statusText}`);
    e.status = response.status;
    throw e;
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
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
