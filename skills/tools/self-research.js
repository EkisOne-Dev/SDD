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


async function webSearch(task) {
  try {
    // Step 1: search Wikipedia for best matching article
    const query = encodeURIComponent(task);
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${query}&format=json&srlimit=1&origin=*`;
    const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(6000) });
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const topResult = searchData?.query?.search?.[0];
    if (!topResult) return null;

    // Step 2: fetch summary for top result
    const titleEncoded = encodeURIComponent(topResult.title);
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${titleEncoded}`;
    const summaryRes = await fetch(summaryUrl, { signal: AbortSignal.timeout(6000) });
    if (!summaryRes.ok) return null;
    const summaryData = await summaryRes.json();

    const extract = summaryData?.extract;
    if (!extract || extract.length < 50) return null;

    // Cap at 500 chars to avoid bloating the prompt
    return `Web context [${summaryData.title}]:\n${extract.slice(0, 500)}`;
  } catch {
    return null; // Fail silently — network unavailable or timeout
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

  // Web search layer — activates when self_research_mode is "web"
  if (config.self_research_mode === "web") {
    const webContext = await webSearch(task);
    if (webContext) {
      parts.push(webContext);
    }
  }

  return parts.length > 0 ? parts.join("\n\n") : null;
}
