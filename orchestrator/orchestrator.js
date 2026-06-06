import fs from "fs";
import { getDB, insert, recent, search } from '../memory/memory-db.js';
import { createSpinner } from "./spinner.js";
import { validateSystemConfig, validateAdapterConfig } from "./validator.js";
import path from "path";
import { fileURLToPath } from "url";
import { writeThinkChain } from './blackboard.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ── Config loaders ────────────────────────────────────────────────────────────

// ── Phase 64: DeepSeek Think-Chain stripper ──────────────────────────────────
// Strips <think>...</think> blocks from DeepSeek-R1 output.
// Returns { clean, thinkRaw } — clean is safe for extractHandoff().
export function stripThinkBlock(raw) {
  const match = raw.match(/<think>([\s\S]*?)<\/think>/i);
  if (!match) return { clean: raw, thinkRaw: null };
  const thinkRaw = match[1].trim();
  const clean = raw.replace(/<think>[\s\S]*?<\/think>/i, '').trim();
  return { clean, thinkRaw };
}

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
  // Phase 57: sqlite shadow read (fire-and-forget — sync fallback below)
  if (config.memory_backend === 'sqlite') {
    try {
      const dbPath = config.memory_db_path || '../memory/memory.db';
      // getDB is async — sqlite read deferred to loadMemoryWithSemantics async path
      // flat file read continues below as L1 hot fallback during transition
    } catch (err) { /* non-fatal */ }
  }
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

export async function loadMemoryWithSemantics(config, task) {
  if (config.semantic_memory_enabled && task) {
    try {
      const { retrieveMemory } = await import('../skills/tools/semantic-memory.js');
      const result = await retrieveMemory(task);
      if (result) return result;
    } catch { /* Ollama unavailable — fall through to keyword retrieval */ }
  }
  return loadMemory(config, task);
}

export async function saveMemory(config, entry) {
  // Phase 57: shadow write to sqlite (57c — async/await, reliable write)
  if (config.memory_backend === 'sqlite' || config.memory_backend === 'shadow') {
    try {
      const dbPath = config.memory_db_path || '../memory/memory.db';
      const sessionId = config._session_id || Date.now().toString();
      // entry is a string: "\nUser: ...\nAssistant: ..."
      const str = typeof entry === 'string' ? entry : JSON.stringify(entry);
      const userMatch = str.match(/User:\s*([\s\S]*?)(?=\nAssistant:|$)/);
      const asstMatch = str.match(/Assistant:\s*([\s\S]*?)$/);
      const userText = userMatch ? userMatch[1].trim() : '';
      const asstText = asstMatch ? asstMatch[1].trim() : '';
      await getDB(dbPath);
      if (userText) await insert({ session_id: sessionId, role: 'user', content: userText, tokens: Math.ceil(userText.length/4) });
      if (asstText) await insert({ session_id: sessionId, role: 'assistant', content: asstText, tokens: Math.ceil(asstText.length/4) });
    } catch (err) { /* non-fatal */ }
  }
  const memPath = path.join(ROOT, config.memory_file);
  fs.appendFileSync(memPath, entry + "\n");
  // Semantic memory: fire-and-forget embed of new entry
  if (config && config.semantic_memory_enabled) {
    const userMatch = entry.match(/User:\s*(.+?)(?=\nAssistant:|$)/s);
    const asstMatch = entry.match(/\nAssistant:\s*([\s\S]+)/);
    if (userMatch && asstMatch) {
      import('../skills/tools/semantic-memory.js')
        .then(({ embedNewEntry }) => embedNewEntry(userMatch[1], asstMatch[1]))
        .catch(() => {});
    }
  }
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

// Phase 47c — strip redundant whitespace + markdown from injected blocks
export function compressPrompt(text) {
  if (!text) return text;
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/^-{3,}$/gm, '')
    .replace(/^={3,}$/gm, '')
    .trim();
}

export function buildPrompt(template, contract, agent, memory, task, priorOutput = "", complexity = "complex", reviewFocus = "Check for clarity, completeness, and accuracy", thinkingProtocol = "") {
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
  const _mem   = compressPrompt(memory)      || "No memory context yet.";
  const _prior  = compressPrompt(priorOutput) || "(none — first agent in chain)";
  const _ident  = compressPrompt(agent.identity);
  const _strat  = compressPrompt(agent.strategy);

  const assembled = template
    .replace("{goal}", contract.goal)
    .replace("{constraints}", contract.constraints.join(", "))
    .replace("{success_criteria}", contract.success_criteria)
    .replace("{output_format}", contract.output_format)
    .replace("{memory}", _mem)
    .replace("{prior_output}", _prior)
    .replace("{identity}", _ident)
    .replace("{strategy}", _strat)
    .replace("{tri_structure}", triBlock)
    .replace("{task}", task)
    .replace("{review_focus}", reviewFocus);
  const _protocol = thinkingProtocol ? '\n\n' + compressPrompt(thinkingProtocol) : '';
  return assembled + _protocol;
}

// ── Logger ────────────────────────────────────────────────────────────────────

export function logExecution(entry) {
  const today = new Date().toISOString().split("T")[0];
  const logFile = path.join(ROOT, "logs", `${today}.log`);
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `[${timestamp}] ${entry}\n`);
}

// ── AI engine runner ──────────────────────────────────────────────────────────


// Phase 46 — per-model context budget enforcement
function estimateTokens(text) {
  return Math.ceil((text || '').length / 4);
}

function trimToContextBudget(prompt, contextLimit) {
  if (!contextLimit) return prompt;
  const estimated = estimateTokens(prompt);
  if (estimated <= contextLimit) return prompt;
  const overBy = estimated - contextLimit;
  const trimChars = overBy * 4;
  const memStart = prompt.indexOf('## MEMORY');
  const memEnd   = prompt.indexOf('## TASK');
  if (memStart !== -1 && memEnd !== -1 && memEnd > memStart) {
    const memBlock = prompt.slice(memStart, memEnd);
    const trimmed  = memBlock.length > trimChars
      ? memBlock.slice(trimChars)
      : '[Memory trimmed to fit context budget]\n';
    console.log('  ⚠️  Context budget: trimmed ~' + overBy + ' tokens from memory block');
    return prompt.slice(0, memStart) + trimmed + prompt.slice(memEnd);
  }
  console.log('  ⚠️  Context budget: trimmed ~' + overBy + ' tokens (fallback mode)');
  return prompt.slice(trimChars);
}

export async function runEngine(prompt, adapter, agentName = null, complexity = "simple", chainType = null) {
  // Phase 46 — enforce per-model context budget
  const _activeKey = adapter.active || 'primary';
  const _limit = adapter[_activeKey] && adapter[_activeKey].context_limit;
  prompt = trimToContextBudget(prompt, _limit);

  let active = { ...adapter[adapter.active] };
  let agentOverrideKey = null;

  // Agent-specific full provider override (e.g. developer → mistral_codestral)
  if (agentName && adapter.agent_models && adapter.agent_models[agentName]) {
    const modelMap = adapter.agent_models[agentName];
    const chosenSlot = modelMap[complexity] || modelMap['simple'];
    if (chosenSlot && adapter[chosenSlot] && adapter[chosenSlot].provider !== undefined) {
      // Full config swap — different provider entirely (e.g. mistral)
      active = { ...adapter[chosenSlot] };
      agentOverrideKey = chosenSlot;
      // Re-enforce context budget against override provider's tighter limit
      if (active.context_limit) prompt = trimToContextBudget(prompt, active.context_limit);
    } else if (chosenSlot && active.provider === 'gemini') {
      // Legacy path: model-only swap within gemini
      active.model = chosenSlot;
    }
  }

  // Phase 61 — Reasoning provider tier gate (T3)
  // architect/strategist + complex → reasoning_provider (cerebras_reasoning)
  // thinking_budget: moderate=2048, complex=8192
  const _reasoningAgents = ['architect', 'strategist'];
  const _reasoningKey = adapter.reasoning_provider;
  if (
    _reasoningKey &&
    adapter[_reasoningKey] &&
    _reasoningAgents.includes(agentName) &&
    (complexity === 'complex' || complexity === 'moderate') &&
    !(agentOverrideKey && adapter[agentOverrideKey]?.think === true)
  ) {
    active = { ...adapter[_reasoningKey] };
    agentOverrideKey = _reasoningKey;
    active.thinking_budget = complexity === 'complex' ? 8192 : 2048;
    if (active.context_limit) prompt = trimToContextBudget(prompt, active.context_limit);
    logExecution(`REASONING TIER: ${active.model} (thinking_budget=${active.thinking_budget}) for ${agentName}/${complexity}`);
  }

    // Cascade fallback chain on failure — fallback5 added; override starts chain
  const _cascadeKeys = ['fallback', 'fallback2', 'fallback3', 'fallback4', 'fallback5', 'local_fallback'];
  const providerChain = agentOverrideKey
    ? [agentOverrideKey, ..._cascadeKeys.filter(k => adapter[k])]
    : [adapter.active, ..._cascadeKeys.filter(k => adapter[k])];

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

  if (adapter.local_first && chainType) {
    const localResult = await tryLocalFirst(prompt, adapter, chainType);
    if (localResult) {
      logExecution(`LOCAL MODEL: ${adapter.local_model_routing?.[chainType] || 'default'} used for ${chainType}`);
      return localResult;
    }
  }

  const _raw = await tryWithFallback(providerChain);
  // Phase 64 — strip <think> blocks from DeepSeek-R1 output; store in blackboard
  if (_raw && typeof _raw === 'string' && _raw.includes('<think>')) {
    const { clean, thinkRaw } = stripThinkBlock(_raw);
    if (thinkRaw) {
      try {
        writeThinkChain('runEngine', chainType || agentName || 'unknown', agentName || 'unknown', thinkRaw);
      } catch (_) { /* blackboard may not be init'd in all call paths — safe to skip */ }
      logExecution(`THINK-CHAIN stored: ${thinkRaw.length} chars for ${agentName || chainType}`);
    }
    return clean;
  }
  return _raw;
}


async function tryLocalFirst(prompt, adapter, chainType) {
  if (!adapter.local_first || !adapter.local_model_routing) return null;
  const localModel = adapter.local_model_routing[chainType] || adapter.local_model_routing.default;
  if (!localModel) return null;

  try { await fetch('http://localhost:11434', { signal: AbortSignal.timeout(3000) }); }
  catch { return null; }

  const modelSlug = localModel.split(':')[0].replace(/[^a-z0-9.]/g, '-');
  const skillPath = path.join(ROOT, 'skills/library/model-' + modelSlug + '.md');
  const skillPrefix = (skillPath && fs.existsSync(skillPath))
    ? fs.readFileSync(skillPath, 'utf-8') + '\n\n'
    : '';

  const localConfig = {
    provider: 'ollama',
    model: localModel,
    base_url: adapter.local_fallback?.base_url || 'http://localhost:11434/api',
    api_key_env: null,
    timeout_ms: 90000
  };

  try {
    const result = await executeEngine(skillPrefix + prompt, localConfig);
    if (result && result.trim().length > 10) return result;
    return null;
  } catch { return null; }
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

  if (active.provider === "mistral") {
    return await runOpenAICompatible(prompt, active);
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
  // Phase 63 — inject thinkingBudget when set by reasoning tier gate
  const _modelConfig = { model: config.model };
  if (config.thinking_budget) {
    _modelConfig.generationConfig = { thinkingConfig: { thinkingBudget: config.thinking_budget } };
  }
  const model = genAI.getGenerativeModel(_modelConfig);
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
  let num_ctx = 2048;
  try {
    const adapterRaw = fs.readFileSync(path.join(ROOT, 'engine/adapter.json'), 'utf-8');
    const adapterCfg = JSON.parse(adapterRaw);
    num_ctx = adapterCfg.ollama_model_config?.[config.model]?.num_ctx ?? 2048;
    if (adapterCfg.ollama_model_config?.[config.model]?.think === true) config.think = true;
  } catch {}

  const response = await fetch(`${config.base_url}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.model,
      prompt: prompt,
      stream: false,
      options: { num_ctx, ...(config.think === true ? { think: true } : {}) }
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Ollama error: ${err}`);
  }

  const data = await response.json();
  return data.response;
}
