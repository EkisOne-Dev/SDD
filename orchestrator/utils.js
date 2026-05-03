// ── Shared utilities — SRP: owns cross-cutting helpers only ───────────────────
// Standard #5: single definition imported by pipeline.js, negotiator.js, menu.js

import readline from 'readline';

/**
 * Prompts the user for input and returns their response as a trimmed string.
 * Creates and closes its own readline interface per call.
 */
export function askUser(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

/**
 * Prompts using an existing readline interface (for multi-question flows).
 * Caller is responsible for closing the interface.
 */
export function askWithRl(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}
