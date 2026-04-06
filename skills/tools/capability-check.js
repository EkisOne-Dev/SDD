import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as readline from "readline";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

// ── Domain keywords ───────────────────────────────────────────────────────────
// Maps keywords in the task to a domain in knowledge-map.json

const DOMAIN_KEYWORDS = {
  system_design:      ["architecture", "system", "design", "structure", "diagram", "infrastructure"],
  programming:        ["code", "function", "bug", "script", "program", "debug", "implement", "build", "develop"],
  data_analysis:      ["data", "analyze", "analysis", "dataset", "csv", "chart", "statistics", "insight"],
  mentorship:         ["learn", "teach", "explain", "guide", "understand", "mentor", "how does", "what is"],
  technical_writing:  ["document", "readme", "report", "write", "draft", "summarize", "documentation"],
  strategic_planning: ["plan", "strategy", "roadmap", "goal", "prioritize", "decision", "approach"],
  research:           ["research", "find", "search", "investigate", "compare", "review", "study"],
  multimedia_content: ["image", "video", "audio", "music", "illustration", "graphic", "visual", "poster", "thumbnail"],
  legal:              ["law", "legal", "contract", "compliance", "regulation", "rights", "liability"],
  medical:            ["medical", "health", "diagnosis", "symptom", "medicine", "treatment", "disease"],
  financial_advice:   ["invest", "stock", "portfolio", "financial advice", "trade", "crypto", "retirement"]
};

function classifyDomain(task) {
  const lower = task.toLowerCase();
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return domain;
    }
  }
  return "general";
}

function loadKnowledgeMap() {
  const raw = fs.readFileSync(
    path.join(ROOT, "capability/knowledge-map.json"), "utf-8"
  );
  return JSON.parse(raw);
}

function logResourceFetch(entry) {
  const logPath = path.join(ROOT, "capability/resource-log.json");
  const raw = fs.readFileSync(logPath, "utf-8");
  const log = JSON.parse(raw);
  log.entries.push(entry);
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
}

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function checkCapability(task) {
  const map = loadKnowledgeMap();
  const domain = classifyDomain(task);

  // Domain not in map — treat as general, proceed
  if (!map.domains[domain]) {
    return true;
  }

  const { confidence, notes } = map.domains[domain];

  // High confidence — proceed silently
  if (confidence === "high") {
    return true;
  }

  // Medium confidence — warn and ask
  if (confidence === "medium") {
    console.log("\n⚠️  CAPABILITY CHECK");
    console.log(`Domain:     ${domain}`);
    console.log(`Confidence: medium`);
    if (notes) console.log(`Note:       ${notes}`);
    console.log("");
    console.log("Options:");
    console.log("  1. Proceed anyway (output may be limited)");
    console.log("  2. Cancel and provide more context");
    console.log("");

    const answer = await ask("Your choice (1 or 2): ");

    if (answer === "2") {
      console.log("\nTask cancelled. Please re-run with additional context or resources.\n");
      return false;
    }

    logResourceFetch({
      timestamp: new Date().toISOString(),
      task,
      domain,
      confidence,
      decision: "user_proceeded_with_warning"
    });

    return true;
  }

  // Low confidence — hard stop with explanation
  if (confidence === "low") {
    console.log("\n🚫  CAPABILITY CHECK — INSUFFICIENT KNOWLEDGE");
    console.log(`Domain:     ${domain}`);
    console.log(`Confidence: low`);
    if (notes) console.log(`Note:       ${notes}`);
    console.log("");
    console.log("This domain requires external verification or specialist knowledge.");
    console.log("The system cannot deliver professional-quality output for this task.");
    console.log("");
    console.log("Options:");
    console.log("  1. Provide a reference document or resource, then re-run");
    console.log("  2. Proceed anyway (not recommended — output will be unreliable)");
    console.log("");

    const answer = await ask("Your choice (1 or 2): ");

    if (answer === "1") {
      console.log("\nTask cancelled. Please re-run with your resource as context.\n");
      return false;
    }

    logResourceFetch({
      timestamp: new Date().toISOString(),
      task,
      domain,
      confidence,
      decision: "user_overrode_low_confidence"
    });

    return true;
  }

  return true;
}
