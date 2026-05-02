import {
  loadAgent,
  loadMemory,
  loadPhase,
  buildPrompt,
  logExecution,
  runEngine
} from "./orchestrator.js";
import { c } from "./colors.js";

// ── Chain definitions ─────────────────────────────────────────────────────────

const CHAINS = [
  {
    type: "creative",
    triggers: ["write", "generate", "draft", "content", "blog",
               "post", "script", "story", "caption", "copy", "email",
               "newsletter", "creative"],
    agents: ["creator", "reviewer"]
  },
  {
    type: "strategy",
    triggers: ["strategy", "strategize", "roadmap", "prioritize", "plan", "decision",
               "tradeoff", "framework", "goals", "okr", "vision", "mission",
               "business", "growth", "launch", "market", "positioning"],
    agents: ["strategist", "reviewer"]
  },
  {
    type: "architecture",
    triggers: ["design", "architecture", "structure", "system", "diagram",
               "component", "module", "schema", "blueprint", "scaffold", "layout",
               "hierarchy", "dependency"],
    agents: ["researcher", "architect", "reviewer"]
  },
  {
    type: "development",
    triggers: ["code", "build", "fix", "implement", "debug", "script", "function",
               "bug", "refactor", "error", "exception", "compile", "test", "class",
               "method", "api"],
    agents: ["developer", "reviewer"]
  },
  {
    type: "research",
    triggers: ["research", "find", "look up", "what is", "explain", "how does",
               "why does", "background", "history", "overview", "summarize", "fact",
               "source", "compare", "difference"],
    agents: ["researcher", "reviewer"]
  },
  {
    type: "analysis",
    triggers: ["analyze", "analyse", "data", "report", "insights", "evaluate",
               "assess", "breakdown", "metrics", "trends"],
    agents: ["researcher", "analyst"]
  },
  {
    type: "review",
    triggers: ["review", "check", "critique", "audit", "validate", "proofread",
               "rate", "score", "feedback", "quality"],
    agents: ["reviewer"]
  }
];

const COMPLEX_KEYWORDS = [
  "design", "implement", "build", "architecture", "analyze", "research",
  "create", "develop", "system", "explain", "teach", "refactor", "optimize"
];

// ── Complexity classifier ─────────────────────────────────────────────────────

export function classifyComplexity(task, chain) {
  const isMultiAgent = chain.agents.length > 1;
  const isLong = task.length > 100;
  const hasComplexKeyword = COMPLEX_KEYWORDS.some(k => task.toLowerCase().includes(k));

  if (isMultiAgent && (isLong || hasComplexKeyword)) return "complex";
  return "simple";
}

// ── Chain selector ────────────────────────────────────────────────────────────

export function selectChain(task) {
  const t = task.toLowerCase();
  let bestChain = null;
  let bestScore = 0;

  for (const chain of CHAINS) {
    const score = chain.triggers.filter(k => t.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      bestChain = chain;
    }
  }

  if (bestChain) return { type: bestChain.type, agents: bestChain.agents };
  return { type: "basic", agents: ["basic"] };
}

// ── Context compressor ────────────────────────────────────────────────────────

function compressContext(text, maxChars = 6000) {
  if (!text || text.length <= maxChars) return text;
  return `[COMPRESSED — ${text.length} chars truncated to ${maxChars}]\n${text.slice(0, maxChars)}\n...[truncated]`;
}

// ── Chain runner ──────────────────────────────────────────────────────────────

export async function runChain(task, chain, config, adapter, skillContext) {
  const { agents, type } = chain;
  const complexity = classifyComplexity(task, chain);
  const isMulti = agents.length > 1;
  const phase = loadPhase(config.default_phase);

  if (isMulti) {
    console.log(c.status(`\n🔗 Chain [${complexity}]: ${agents.join(" → ")}`));
    logExecution(`CHAIN SELECTED: ${type} [${agents.join(" → ")}] complexity=${complexity}`);
  } else {
    logExecution(`AGENT SELECTED: ${agents[0]} complexity=${complexity}`);
  }

  let previousOutput = null;
  let finalResult = null;
  let totalPromptChars = 0;

  // For simple tasks, use basic agent directly — avoids TRI-STRUCTURE from specialists
  const effectiveAgents = (complexity === 'simple' && type !== 'simple')
    ? ['basic']
    : agents;

  for (let i = 0; i < effectiveAgents.length; i++) {
    const agentName = effectiveAgents[i];
    const isLast = i === effectiveAgents.length - 1;

    console.log(c.status(`\n🤖 Agent: ${agentName} [${complexity}]`));
    logExecution(`CHAIN AGENT STARTED: ${agentName}`);

    const agent = loadAgent(agentName);

    // Build memory block
    let rawMemory = loadMemory(config, task);
    if (skillContext) {
      rawMemory += "\n\n[SKILL CONTEXT — Self Research]\n" + skillContext;
    }

    // Compress and inject prior agent output
    const compressedPrior = previousOutput
      ? compressContext(previousOutput)
      : null;

    const memory = compressedPrior
      ? rawMemory + `\n\n[PRIOR AGENT OUTPUT — ${agents[i - 1].toUpperCase()}]\n` + compressedPrior
      : rawMemory;

    const prompt = buildPrompt(
      phase.promptTemplate,
      phase.contract,
      agent,
      memory,
      task,
      compressedPrior || "",
      complexity
    );

    totalPromptChars += prompt.length;

    const result = await runEngine(prompt, adapter, agentName, complexity);

    previousOutput = result;
    finalResult = result;

    logExecution(`CHAIN AGENT COMPLETE: ${agentName}`);

    if (isMulti && !isLast) {
      console.log(c.dim(`\n✓ ${agentName} complete — passing to ${effectiveAgents[i + 1]}...\n`));
    }
  }

  return { result: finalResult, complexity, promptChars: totalPromptChars };
}
