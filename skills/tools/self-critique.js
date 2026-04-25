import { runEngine } from "../../orchestrator/orchestrator.js";

export async function runSelfCritique(task, output, adapter) {
  const prompt = `You are a quality auditor. Review the output below against the original task.

ORIGINAL TASK:
${task}

OUTPUT PRODUCED:
${output}

Identify any gaps, errors, or missed requirements in 3 bullet points.
If the output fully satisfies the task, respond only with: PASS

Be specific. Do not pad with filler.`;

  try {
    const result = await runEngine(prompt, adapter, "reviewer", "simple");
    return result ? result.trim() : null;
  } catch {
    return null;
  }
}
