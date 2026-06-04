import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');

const SKILL_PATH = join(ROOT, 'skills/library/capability-classifier.md');
const OLLAMA_BASE = 'http://localhost:11434';
const CLASSIFIER_MODEL = 'qwen3.5:0.8b';
const OLLAMA_TIMEOUT_MS = 3000;

// ── Unambiguous pre-filter — skip AI for obvious cases ────────────────────────
const PRE_FILTER = {
  medical:          ['symptom', 'diagnosis', 'diagnose', 'treatment', 'disease', 'medicine'],
  legal:            ['lawsuit', 'liability', 'compliance', 'litigation', 'jurisdiction'],
  financial_advice: ['invest', 'portfolio', 'retirement fund', 'stock market', 'crypto'],
  programming:      ['function(', 'console.log', 'import ', 'def ', 'return ', '#!/']
};

function preFilter(task) {
  const lower = task.toLowerCase();
  for (const [domain, keywords] of Object.entries(PRE_FILTER)) {
    if (keywords.some(kw => lower.includes(kw))) {
      const confidence = (domain === 'medical' || domain === 'legal' || domain === 'financial_advice')
        ? 'low' : 'high';
      return { domain, confidence, reason: 'Unambiguous pre-filter match.', source: 'prefilter' };
    }
  }
  return null;
}

// ── Ollama availability check ─────────────────────────────────────────────────
async function checkOllamaAvailable() {
  try {
    const { default: fetch } = await import('node-fetch');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1000);
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

// ── AI classification via qwen3.5:0.8b ───────────────────────────────────────
async function classifyWithAI(task) {
  // Pre-filter first — instant return for unambiguous cases
  const hit = preFilter(task);
  if (hit) return hit;

  // Load skill
  if (!existsSync(SKILL_PATH)) return null;
  const systemPrompt = readFileSync(SKILL_PATH, 'utf8');

  // Ollama availability guard
  const available = await checkOllamaAvailable();
  if (!available) return null;

  try {
    const { default: fetch } = await import('node-fetch');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

    const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: CLASSIFIER_MODEL,
        system: systemPrompt,
        prompt: `Classify this task: ${task}`,
        stream: false,
        options: { temperature: 0.1, num_predict: 80 }
      })
    });
    clearTimeout(timer);

    const data = await res.json();
    const raw = data.response && data.response.trim();
    if (!raw) return null;

    // Strip markdown fences if model wraps output
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    // Validate schema
    const validDomains = ['general','system_design','programming','data_analysis',
      'mentorship','technical_writing','strategic_planning','research',
      'multimedia_content','legal','medical','financial_advice'];
    const validConf = ['high','medium','low'];

    if (!validDomains.includes(parsed.domain) || !validConf.includes(parsed.confidence)) {
      return null;
    }

    return { ...parsed, source: 'ai' };
  } catch {
    return null;
  }
}

export { classifyWithAI };
