import { readFileSync, existsSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SDD_ROOT = join(__dirname, "../../");

function loadKnowledgeMap() {
  const path = join(SDD_ROOT, "capability/knowledge-map.json");
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function loadMemorySnippet(task) {
  const path = join(SDD_ROOT, "memory/memory.txt");
  if (!existsSync(path)) return null;

  const content = readFileSync(path, "utf8");
  const lines = content.split("\n");
  const keywords = task.toLowerCase().split(" ").filter(w => w.length > 3);
  const relevant = lines.filter(line =>
    keywords.some(k => line.toLowerCase().includes(k))
  );

  if (relevant.length === 0) return null;
  return relevant.slice(0, 10).join("\n");
}

function scanProjects(task) {
  const projectsDir = join(SDD_ROOT, "projects");
  if (!existsSync(projectsDir)) return null;

  const t = task.toLowerCase();
  const keywords = t.split(" ").filter(w => w.length > 3);
  const found = [];

  try {
    const projects = readdirSync(projectsDir);
    for (const project of projects) {
      const objectivePath = join(projectsDir, project, "objective.md");
      if (existsSync(objectivePath)) {
        const content = readFileSync(objectivePath, "utf8");
        if (keywords.some(w => content.toLowerCase().includes(w))) {
          found.push(`Project "${project}": ${content.slice(0, 120).trim()}...`);
        }
      }
    }
  } catch {
    return null;
  }

  return found.length > 0 ? found.join("\n") : null;
}

async function synthesizeWithAI(task, localContext, adapter) {
  const { runEngine } = await import("../../orchestrator/orchestrator.js");

  const prompt = `You are a research assistant. Given the task and existing context below, identify any key knowledge gaps or additional context that would improve the final output. Be concise — 3 to 5 sentences max. If context is already sufficient, respond only with: "Context sufficient."

TASK: ${task}

EXISTING CONTEXT:
${localContext}`;

  try {
    const result = await runEngine(prompt, adapter);
    if (result && !result.includes("Context sufficient")) {
      return result.trim();
    }
    return null;
  } catch {
    return null;
  }
}

export async function runSelfResearch(task, config, adapter) {
  const parts = [];

  const km = loadKnowledgeMap();
  if (km) {
    for (const [domain, data] of Object.entries(km.domains)) {
      const domainLabel = domain.replace(/_/g, " ");
      if (task.toLowerCase().includes(domainLabel) && data.confidence !== "high") {
        parts.push(`Domain note [${domain}]: confidence=${data.confidence}. ${data.notes}`);
      }
    }
  }

  const memSnippet = loadMemorySnippet(task);
  if (memSnippet) {
    parts.push(`Relevant memory:\n${memSnippet}`);
  }

  const projectSnippet = scanProjects(task);
  if (projectSnippet) {
    parts.push(`Related projects:\n${projectSnippet}`);
  }

  if (parts.length === 0 && config.self_research_mode !== "ai") {
    return null;
  }

  const localContext = parts.join("\n\n") || "No local context found.";

  if (config.self_research_mode === "ai" && adapter) {
    const aiContext = await synthesizeWithAI(task, localContext, adapter);
    if (aiContext) {
      return `${localContext}\n\nAI synthesis:\n${aiContext}`;
    }
  }

  return parts.length > 0 ? localContext : null;
}
