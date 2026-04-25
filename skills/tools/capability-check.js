import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as readline from "readline";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

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

// FIX: Check ALL matching domains — return lowest confidence found
function classifyDomain(task) {
  const lower = task.toLowerCase();
  const matched = [];
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      matched.push(domain);
    }
  }
  return matched.length > 0 ? matched : ["general"];
}

function loadKnowledgeMap() {
  const raw = fs.readFileSync(
    path.join(ROOT, "capability/knowledge-map.json"), "utf-8"
  );
  return JSON.parse(raw);
}

// FIX: Safe read with fallback if resource-log.json missing or malformed
function logResourceFetch(entry) {
  const logPath = path.join(ROOT, "capability/resource-log.json");
  let log = { entries: [] };
  try {
    const raw = fs.readFileSync(logPath, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.entries)) {
      log = parsed;
    }
  } catch (_) {}
  log.entries.push(entry);
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => { rl.close(); resolve(answer.trim()); });
  });
}

const CONFIDENCE_RANK = { "high": 0, "medium": 1, "low": 2 };

export async function checkCapability(task) {
  const map = loadKnowledgeMap();
  const domains = classifyDomain(task);

  // Find lowest confidence across all matched domains
  let worstDomain = null;
  let worstConfidence = "high";

  for (const domain of domains) {
    if (!map.domains[domain]) continue;
    const { confidence } = map.domains[domain];
    if (CONFIDENCE_RANK[confidence] > CONFIDENCE_RANK[worstConfidence]) {
      worstConfidence = confidence;
      worstDomain = domain;
    }
  }

  if (!worstDomain || worstConfidence === "high") return true;

  const { notes } = map.domains[worstDomain];

  if (worstConfidence === "medium") {
    console.log("\n⚠️  CAPABILITY CHECK");
    console.log(`Domain:     ${worstDomain}`);
    console.log(`Confidence: medium`);
    if (notes) console.log(`Note:       ${notes}`);
    console.log("\nOptions:");
    console.log("  1. Proceed anyway (output may be limited)");
    console.log("  2. Cancel and provide more context");
    const answer = await ask("\nYour choice (1 or 2): ");
    if (answer === "2") {
      console.log("\nTask cancelled. Please re-run with additional context.\n");
      return false;
    }
    logResourceFetch({ timestamp: new Date().toISOString(), task, domain: worstDomain, confidence: worstConfidence, decision: "user_proceeded_with_warning" });
    return true;
  }

  if (worstConfidence === "low") {
    console.log("\n🚫  CAPABILITY CHECK — INSUFFICIENT KNOWLEDGE");
    console.log(`Domain:     ${worstDomain}`);
    console.log(`Confidence: low`);
    if (notes) console.log(`Note:       ${notes}`);
    console.log("\nThis domain requires external verification or specialist knowledge.");
    console.log("\nOptions:");
    console.log("  1. Provide a reference document or resource, then re-run");
    console.log("  2. Proceed anyway (not recommended — output will be unreliable)");
    const answer = await ask("\nYour choice (1 or 2): ");
    if (answer === "1") {
      console.log("\nTask cancelled. Please re-run with your resource as context.\n");
      return false;
    }
    logResourceFetch({ timestamp: new Date().toISOString(), task, domain: worstDomain, confidence: worstConfidence, decision: "user_overrode_low_confidence" });
    return true;
  }

  return true;
}
