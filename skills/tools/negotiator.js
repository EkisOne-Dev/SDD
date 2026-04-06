import * as readline from "readline";

// ── Negotiation triggers ─────────────────────────────────────────────────────
const TRIGGERS = [
  {
    detect: task => /^(make|create|write|build|give me)\s+a\s+list/i.test(task),
    suggestion: "A structured document with categories may be more useful than a plain list.",
    rewrite: task => `Create a structured categorized document for: ${task}`
  },
  {
    detect: task => /explain\s+.{0,30}\s+simply|explain\s+.{0,30}\s+like/i.test(task),
    suggestion: "An explanation with a real-world analogy and a concrete example produces better understanding than a simple definition.",
    rewrite: task => `Explain using a real-world analogy and a concrete example: ${task}`
  },
  {
    detect: task => /fix\s+(this|my)\s+(code|bug|error|issue)/i.test(task) && task.length < 60,
    suggestion: "You have not included the code or error message. I need that to actually fix it.",
    rewrite: task => `${task} — NOTE: No code or error was provided. Ask the user to supply both before attempting a fix.`
  },
  {
    detect: task => /^(what is|what are)\s+the\s+best/i.test(task),
    suggestion: "A comparison with clear criteria (speed, cost, ease of use) is more actionable than a generic best-of list.",
    rewrite: task => `Produce a criteria-based comparison (speed, cost, ease of use) for: ${task}`
  },
  {
    detect: task => /translate\s+.{0,40}\s+to/i.test(task) && !/context|formal|tone/i.test(task),
    suggestion: "Translations vary significantly by tone and context. Specifying formal, casual, or technical will produce a better result.",
    rewrite: task => `${task} — NOTE: No tone was specified. Ask the user whether they want formal, casual, or technical before translating.`
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
// Returns the task string to use (original or rewritten), or null if cancelled.

export async function checkNegotiation(task) {
  const trigger = TRIGGERS.find(t => t.detect(task));

  if (!trigger) {
    return task;
  }

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
