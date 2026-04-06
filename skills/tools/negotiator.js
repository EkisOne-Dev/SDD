import * as readline from "readline";

// ── Negotiation triggers ──────────────────────────────────────────────────────
// Each entry defines a pattern to detect and a better approach to suggest

const TRIGGERS = [
  {
    detect: task => /^(make|create|write|build|give me)\s+a\s+list/i.test(task),
    suggestion: "A structured document with categories may be more useful than a plain list.",
    alternative: "Structured categorized document"
  },
  {
    detect: task => /explain\s+.{0,30}\s+simply|explain\s+.{0,30}\s+like/i.test(task),
    suggestion: "An explanation with a real-world analogy and a concrete example produces better understanding than a simple definition.",
    alternative: "Analogy-based explanation with example"
  },
  {
    detect: task => /fix\s+(this|my)\s+(code|bug|error|issue)/i.test(task) && task.length < 60,
    suggestion: "You have not included the code or error message. I need that to actually fix it.",
    alternative: "Please re-run and include the code and the exact error message"
  },
  {
    detect: task => /^(what is|what are)\s+the\s+best/i.test(task),
    suggestion: "A comparison with clear criteria (speed, cost, ease of use) is more actionable than a generic best-of list.",
    alternative: "Criteria-based comparison"
  },
  {
    detect: task => /translate\s+.{0,40}\s+to/i.test(task) && !/context|formal|tone/i.test(task),
    suggestion: "Translations vary significantly by tone and context. Specifying formal, casual, or technical will produce a better result.",
    alternative: "Ask for tone/context before translating"
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

// ── Main export ───────────────────────────────────────────────────────────────

export async function checkNegotiation(task) {
  const trigger = TRIGGERS.find(t => t.detect(task));

  // No trigger matched — proceed silently
  if (!trigger) {
    return true;
  }

  console.log("\n💡  SUGGESTION BEFORE I PROCEED");
  console.log(`You asked for:       ${task}`);
  console.log(`Better approach:     ${trigger.suggestion}`);
  console.log(`Alternative output:  ${trigger.alternative}`);
  console.log("");
  console.log("Options:");
  console.log("  A. Proceed with your original request");
  console.log("  B. Use the suggested approach");
  console.log("  C. Cancel — I will rephrase my request");
  console.log("");

  const answer = await ask("Your choice (A, B or C): ");

  if (answer === "C") {
    console.log("\nTask cancelled. Re-run with your updated request.\n");
    return false;
  }

  if (answer === "B") {
    console.log(`\nProceeding with: ${trigger.alternative}\n`);
    // The suggestion is noted — the agent identity and strategy will guide output quality
    return true;
  }

  // A or anything else — proceed with original
  return true;
}
