import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const OLLAMA_URL = 'http://localhost:11434/api/generate';
const PARSER_MODEL = 'phi4-mini:latest';
const WORD_THRESHOLD = 15;

const VAGUE = ['help me with','something','maybe','kind of','not sure','i want to','can you','i need'];

function loadInstructions() {
  const p = path.join(ROOT, 'skills/library/intent-parser.md');
  return existsSync(p) ? readFileSync(p, 'utf-8') : '';
}

export function isAmbiguous(task) {
  const words = task.trim().split(/\s+/).length;
  const hasVague = VAGUE.some(v => task.toLowerCase().includes(v));
  return words > WORD_THRESHOLD || hasVague;
}

async function callPhi4(prompt) {
  try {
    const res = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: PARSER_MODEL,
        prompt,
        stream: false,
        options: { temperature: 0.1, num_predict: 300 }
      }),
      signal: AbortSignal.timeout(30000)
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.response?.trim() || null;
  } catch {
    return null;
  }
}

export async function parseIntent(task) {
  if (!isAmbiguous(task)) return null;

  // Check Ollama is running
  try {
    await fetch('http://localhost:11434', { signal: AbortSignal.timeout(5000) });
  } catch {
    return null; // Ollama offline — skip silently
  }

  const instructions = loadInstructions();
  const prompt = `${instructions}\n\nTask to normalize: "${task}"\n\nReturn ONLY the JSON object:`;

  const raw = await callPhi4(prompt);
  if (!raw) return null;

  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    if (!parsed.interpreted_task) return null;
    return parsed;
  } catch {
    return null;
  }
}
