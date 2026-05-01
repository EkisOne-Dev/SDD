import * as readline from "readline";

// ── Negotiation triggers ─────────────────────────────────────────────────────
// Each trigger has a score weight — higher = stronger match signal
const TRIGGERS = [
  // ── Missing context — code/error not provided ─────────────────────────────
  {
    detect: task => /fix\s+(this|my)\s+(code|bug|error|issue|function|script)/i.test(task) && task.length < 80,
    score: 3,
    suggestion: "No code or error message was included. I need both to actually fix it.",
    rewrite: task => `${task} — NOTE: No code or error was provided. Ask the user to supply both before attempting a fix.`
  },
  // ── Missing content — summarize/review without providing the thing ────────
  {
    detect: task => /^(summarize|summarise|review|proofread|translate|rewrite|improve)\s+(this|my|the)\b/i.test(task) && task.length < 70,
    score: 3,
    suggestion: "You referenced 'this' or 'my' content but haven't included it. Please paste the content you want me to work with.",
    rewrite: task => `${task} — NOTE: No content was provided. Ask the user to paste the actual text before proceeding.`
  },
  // ── Vague improvement request ─────────────────────────────────────────────
  {
    detect: task => /^make\s+(it|this|my|the)\s+(better|good|great|perfect|nicer|cleaner|faster)/i.test(task),
    score: 3,
    suggestion: "What specifically should be improved — clarity, tone, speed, structure, or something else?",
    rewrite: task => `${task} — NOTE: No specific improvement target given. Ask the user what dimension to optimize before proceeding.`
  },
  // ── List request → structured document ───────────────────────────────────
  {
    detect: task => /^(make|create|write|build|give me|generate)\s+a\s+list/i.test(task),
    score: 2,
    suggestion: "A structured document with categories is more useful than a plain list.",
    rewrite: task => `Create a structured categorized document for: ${task}`
  },
  // ── Best-of request without criteria ─────────────────────────────────────
  {
    detect: task => /^(what is|what are|which (is|are))\s+the\s+best/i.test(task),
    score: 2,
    suggestion: "A comparison with clear criteria (speed, cost, ease of use) is more actionable than a generic best-of list.",
    rewrite: task => `Produce a criteria-based comparison (speed, cost, ease of use) for: ${task}`
  },
  // ── Compare without criteria ──────────────────────────────────────────────
  {
    detect: task => /compare\s+.{2,40}\s+(and|vs|versus|or)\s+.{2,40}/i.test(task) && !/criteria|better for|use case|when to/i.test(task),
    score: 2,
    suggestion: "Comparisons are more useful with specific criteria. Should I compare by speed, cost, ease of use, or use case?",
    rewrite: task => `Compare with specific criteria (speed, cost, ease of use, best use case): ${task}`
  },
  // ── Explain simply → analogy + example ───────────────────────────────────
  {
    detect: task => /explain\s+.{0,40}\s+(simply|like|in simple|for (a )?(beginner|kid|non-technical))/i.test(task),
    score: 2,
    suggestion: "An explanation with a real-world analogy and concrete example produces better understanding.",
    rewrite: task => `Explain using a real-world analogy and a concrete example: ${task}`
  },
  // ── Plan request without timeframe ────────────────────────────────────────
  {
    detect: task => /(create|make|build|write|give me)\s+a\s+(plan|roadmap|schedule|timeline)/i.test(task) && !/week|month|day|year|sprint|\d/i.test(task),
    score: 2,
    suggestion: "A plan is much more actionable with a timeframe. Should this cover days, weeks, or months?",
    rewrite: task => `${task} — NOTE: No timeframe specified. Ask the user for the time horizon before creating the plan.`
  },
  // ── Ideas request without constraints ─────────────────────────────────────
  {
    detect: task => /(give me|generate|brainstorm|list)\s+.{0,20}(ideas|suggestions|options|examples)/i.test(task) && !/how many|\d+|budget|constraint/i.test(task),
    score: 1,
    suggestion: "Idea generation is more focused with constraints. How many ideas? Any budget or format requirements?",
    rewrite: task => `Generate 5 specific, actionable ideas with brief rationale for each: ${task}`
  },
  // ── Translate without tone ────────────────────────────────────────────────
  {
    detect: task => /translate\s+.{0,40}\s+to/i.test(task) && !/formal|casual|technical|tone|context/i.test(task),
    score: 1,
    suggestion: "Translations vary by tone. Should this be formal, casual, or technical?",
    rewrite: task => `${task} — NOTE: No tone specified. Ask the user whether they want formal, casual, or technical before translating.`
  },
  // ── Binary should I X or Y decision ──────────────────────────────────────
  {
    detect: task => /should\s+i\s+.{2,40}\s+or\s+.{2,40}/i.test(task) && !/context|situation|goal|because/i.test(task),
    score: 1,
    suggestion: "A decision between two options depends on your goals and constraints. What matters most to you — speed, cost, simplicity, or something else?",
    rewrite: task => `Analyze the tradeoffs and provide a recommendation with clear reasoning for: ${task}`
  },
  // ── Write something vague (no format/audience/length) ────────────────────
  {
    detect: task => /^(write|draft|create)\s+(something|a piece|an? \w+)\s+(about|on|for)\s+/i.test(task) && task.length < 60,
    score: 1,
    suggestion: "What format, length, and audience should I target? (e.g. blog post for beginners, 500 words)",
    rewrite: task => `${task} — NOTE: No format, length, or audience specified. Ask the user before writing.`
  },
  // ── Help me with X (too vague) ────────────────────────────────────────────
  {
    detect: task => /^help\s+(me\s+)?(with|on|for)\s+\w+$/i.test(task),
    score: 1,
    suggestion: "This is quite broad. What specifically do you need — an explanation, a plan, code, or something else?",
    rewrite: task => `${task} — NOTE: Request is too vague. Ask the user what specific output they need before proceeding.`
  },
  // ── How do I X (steps vs explanation ambiguity) ───────────────────────────
  {
    detect: task => /^how\s+(do\s+i|can\s+i|should\s+i)\s+.{5,}/i.test(task) && !/step|example|code|explain/i.test(task),
    score: 1,
    suggestion: "Should I give you step-by-step instructions, a conceptual explanation, or a code example?",
    rewrite: task => `Provide step-by-step instructions with a concrete example for: ${task}`
  },
  // ── Summarize without length target ───────────────────────────────────────
  {
    detect: task => /summarize|summarise/i.test(task) && !/word|sentence|paragraph|bullet|brief|short|long/i.test(task) && task.length > 60,
    score: 1,
    suggestion: "How long should the summary be — a few sentences, a paragraph, or bullet points?",
    rewrite: task => `Summarize in 3-5 concise bullet points covering the key points: ${task}`
  }
];

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim().toUpperCase());
    });
  });
}

// ── Best-match trigger selection (Standard #6) ───────────────────────────────
function findBestTrigger(task) {
  let best = null;
  let bestScore = 0;
  for (const trigger of TRIGGERS) {
    if (trigger.detect(task) && trigger.score > bestScore) {
      bestScore = trigger.score;
      best = trigger;
    }
  }
  return best;
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function checkNegotiation(task) {
  const trigger = findBestTrigger(task);

  if (!trigger) return task;

  console.log("\n💡  SUGGESTION BEFORE I PROCEED");
  console.log(`You asked for:      ${task}`);
  console.log(`Better approach:    ${trigger.suggestion}`);
  console.log("");
  console.log("Options:");
  console.log("  A. Proceed with your original request");
  console.log("  B. Use the suggested approach");
  console.log("  C. Cancel — I will rephrase my request");
  console.log("");

  const answer = await ask("Your choice (A, B or C): ");

  if (answer === "C") {
    console.log("\nTask cancelled. Re-run with your updated request.\n");
    return null;
  }

  if (answer === "B") {
    const rewritten = trigger.rewrite(task);
    console.log(`\nProceeding with: ${rewritten}\n`);
    return rewritten;
  }

  return task;
}
