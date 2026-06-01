import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sddRoot = join(__dirname, '..', '..');

const _systemJson = loadJson(join(sddRoot, 'config', 'system.json'));
const _adapter    = loadJson(join(sddRoot, 'engine', 'adapter.json'));
const _capMd      = (() => { try { return readFileSync(join(sddRoot, 'CAPABILITIES.md'), 'utf8'); } catch { return ''; } })();
const _scores     = loadJsonl(join(sddRoot, 'meta', 'scores', 'scores.jsonl'));

function loadJson(p) {
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; }
}

function loadJsonl(p) {
  if (!existsSync(p)) return [];
  return readFileSync(p, 'utf8').split('\n').filter(l => l.trim())
    .map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}

function getAgentRoster() {
  try {
    return readdirSync(join(sddRoot, 'agents'), { withFileTypes: true })
      .filter(d => d.isDirectory()).map(d => d.name);
  } catch { return []; }
}

function getCapabilityCount(md) {
  const matches = md.match(/✅ Active/g);
  return matches ? matches.length : 0;
}

function getScoreAverages(scores) {
  if (scores.length === 0) return null;
  const recent = scores.slice(-20);
  const dims = ['clarity', 'usefulness', 'efficiency', 'redundancy', 'overall'];
  const averages = {};
  for (const dim of dims) {
    const vals = recent.map(s => s.scores?.[dim]).filter(n => typeof n === 'number');
    if (vals.length > 0) averages[dim] = parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1));
  }
  return { sample_size: recent.length, averages };
}

function getProviderCascade(adapter) {
  const roles = ['primary', 'fallback', 'fallback2', 'fallback3', 'fallback4', 'local_fallback'];
  return roles.filter(r => adapter?.[r]).map(r => ({
    role: r,
    provider: adapter[r].provider,
    model: adapter[r].model
  }));
}

export async function generateSnapshot() {
  const versionsDir = join(sddRoot, 'versions');
  if (!existsSync(versionsDir)) mkdirSync(versionsDir, { recursive: true });

  const systemJson = _systemJson;
  const adapter = _adapter;
  const version = systemJson?.version || 'unknown';
  const outputPath = join(versionsDir, `v${version}.json`);

  // Idempotent — skip if snapshot already exists for this version
  if (existsSync(outputPath)) return { skipped: true, version, reason: 'Snapshot already exists for this version' };

  const capMd = _capMd;
  const scores = _scores;

  const snapshot = {
    version,
    timestamp: new Date().toISOString(),
    config_flags: {
      capability_check_enabled: systemJson?.capability_check_enabled,
      negotiation_enabled: systemJson?.negotiation_enabled,
      self_research_enabled: systemJson?.self_research_enabled,
      scoring_enabled: systemJson?.scoring_enabled,
      meta_observation_enabled: systemJson?.meta_observation_enabled,
      cost_tracking_enabled: systemJson?.cost_tracking_enabled,
      free_only_mode: systemJson?.free_only_mode,
      local_first: adapter?.local_first,
      universal_thinking_enabled: systemJson?.universal_thinking_enabled,
      semantic_memory_enabled: systemJson?.semantic_memory_enabled,
      spec_clarifier_enabled: systemJson?.spec_clarifier_enabled,
      guardian_angel_enabled: systemJson?.guardian_angel_enabled
    },
    agent_roster: getAgentRoster(),
    capability_count: getCapabilityCount(capMd),
    score_averages: getScoreAverages(scores),
    provider_cascade: getProviderCascade(adapter)
  };

  writeFileSync(outputPath, JSON.stringify(snapshot, null, 2));
  return { created: true, version, path: `versions/v${version}.json` };
}
