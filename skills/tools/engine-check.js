import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');

function loadAdapter() {
  return JSON.parse(readFileSync(path.join(ROOT, 'engine/adapter.json'), 'utf-8'));
}

async function checkGemini(config) {
  const key = process.env[config.api_key_env];
  if (!key) return { ok: false, reason: 'API key not set', latency: null };
  const start = Date.now();
  try {
    const res = await fetch(
      `${config.base_url}/v1beta/models/${config.model}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'reply with one word: ok' }] }] }),
        signal: AbortSignal.timeout(10000)
      }
    );
    const latency = Date.now() - start;
    if (res.status === 429) return { ok: false, reason: 'Quota exceeded (429)', latency };
    if (!res.ok) return { ok: false, reason: `HTTP ${res.status}`, latency };
    const data = await res.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '?';
    return { ok: true, reason: reply.trim().slice(0, 30), latency };
  } catch (e) {
    return { ok: false, reason: e.message.slice(0, 50), latency: Date.now() - start };
  }
}

async function checkOpenRouter(config) {
  const key = process.env[config.api_key_env];
  if (!key) return { ok: false, reason: 'API key not set', latency: null };
  const start = Date.now();
  try {
    const res = await fetch(`${config.base_url}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 5,
        messages: [{ role: 'user', content: 'reply with one word: ok' }]
      }),
      signal: AbortSignal.timeout(10000)
    });
    const latency = Date.now() - start;
    if (res.status === 429) return { ok: false, reason: 'Quota exceeded (429)', latency };
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, reason: err?.error?.message?.slice(0, 50) ?? `HTTP ${res.status}`, latency };
    }
    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content ?? '?';
    return { ok: true, reason: reply.trim().slice(0, 30), latency };
  } catch (e) {
    return { ok: false, reason: e.message.slice(0, 50), latency: Date.now() - start };
  }
}

async function checkOllama(config) {
  const start = Date.now();
  try {
    const cleanBase = config.base_url.endsWith('/api')
      ? config.base_url.slice(0, -4)
      : config.base_url;
    const res = await fetch(`${cleanBase}/api/tags`, {
      signal: AbortSignal.timeout(5000)
    });
    const latency = Date.now() - start;
    if (!res.ok) return { ok: false, reason: `HTTP ${res.status}`, latency };
    const data = await res.json();
    const models = (data.models ?? []).map(m => m.name);
    const found = models.some(m => m === config.model || m.startsWith(config.model + ":"));
    return {
      ok: found,
      reason: found ? `${config.model} available` : `${config.model} not installed`,
      latency
    };
  } catch (e) {
    return { ok: false, reason: 'Ollama not running', latency: Date.now() - start };
  }
}

async function checkOpenAICompatible(config) {
  const key = process.env[config.api_key_env];
  if (!key) return { ok: false, reason: 'API key not set', latency: null };
  const start = Date.now();
  try {
    const res = await fetch(`${config.base_url}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ model: config.model, max_tokens: 5, messages: [{ role: 'user', content: 'reply with one word: ok' }] }),
      signal: AbortSignal.timeout(10000)
    });
    const latency = Date.now() - start;
    if (res.status === 429) return { ok: false, reason: 'Quota exceeded (429)', latency };
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, reason: err?.message?.slice(0, 50) ?? `HTTP ${res.status}`, latency };
    }
    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content ?? '?';
    return { ok: true, reason: reply.trim().slice(0, 30), latency };
  } catch (e) {
    return { ok: false, reason: e.message.slice(0, 50), latency: Date.now() - start };
  }
}

export async function runEngineCheck() {
  const adapter = loadAdapter();
  const active = adapter.active;

  console.log('\n🔌 SDD Engine Status Check\n');

  const checks = [
    { role: 'primary',        label: 'Gemini',      config: adapter.primary,        fn: checkGemini },
    { role: 'fallback',       label: 'Fallback 1',  config: adapter.fallback,       fn: checkOpenRouter },
    { role: 'fallback2',      label: 'Fallback 2',  config: adapter.fallback2,      fn: checkOpenRouter },
    { role: 'fallback3',      label: 'Groq',         config: adapter.fallback3,      fn: checkOpenAICompatible },
    { role: 'fallback4',      label: 'Cerebras',     config: adapter.fallback4,      fn: checkOpenAICompatible },
    { role: 'local_fallback', label: 'Ollama',       config: adapter.local_fallback, fn: checkOllama }
  ].filter(c => c.config);

  for (const { role, label, config, fn } of checks) {
    process.stdout.write(`  Checking ${label} (${config.model})...`);
    const result = await fn(config);
    const ms = result.latency != null ? `${result.latency}ms` : '—';
    const activeTag = role === active ? ' ← active' : '';
    const status = result.ok ? '✅' : '❌';
    console.log(`\r  ${status}  ${label.padEnd(12)} ${config.model.padEnd(35)} ${ms.padStart(6)}${activeTag}`);
    if (!result.ok) console.log(`       Reason: ${result.reason}`);
  }

  console.log();
}
