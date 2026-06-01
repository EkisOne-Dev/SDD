import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const sddRoot = join(__dirname, '..', '..');

function getSessionAge(insight, allInsights) {
  const ts = new Date(insight.timestamp).getTime();
  const laterBatches = new Set(
    allInsights
      .filter(i => new Date(i.timestamp).getTime() > ts)
      .map(i => i.timestamp.slice(0, 16))
  );
  return laterBatches.size;
}

function loadInsights() {
  const insightsPath = join(sddRoot, 'meta', 'insights', 'insights.jsonl');
  if (!existsSync(insightsPath)) return [];
  const lines = readFileSync(insightsPath, 'utf8').trim().split('\n').filter(Boolean);
  const all = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  // Deduplicate by pattern — keep most recent entry per pattern
  const byPattern = new Map();
  for (const ins of all) {
    const existing = byPattern.get(ins.pattern);
    if (!existing || new Date(ins.timestamp) > new Date(existing.timestamp)) {
      byPattern.set(ins.pattern, ins);
    }
  }
  return [...byPattern.values()];
}

export function loadActiveInsights() {
  const all = loadInsights();
  return all.filter(ins => getSessionAge(ins, all) < 10);
}

export async function runInsightsCommand() {
  const all = loadInsights();

  if (all.length === 0) {
    console.log('\n⚠  No insights found. Run sdd session-end to generate insights.\n');
    return [];
  }

  const active = [];
  const stale = [];

  for (const ins of all) {
    const age = getSessionAge(ins, all);
    if (age >= 10) stale.push({ ...ins, sessionAge: age });
    else active.push({ ...ins, sessionAge: age });
  }

  const CONF_BADGE = { HIGH: '🔴', MEDIUM: '🟡', LOW: '🟢' };

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  SDD INSIGHT SIGNALS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (active.length === 0) {
    console.log('  No active signals.\n');
  } else {
    for (const ins of active) {
      const badge = CONF_BADGE[ins.confidence] || '⚪';
      console.log(`${badge} [${ins.confidence}] ${ins.pattern}`);
      console.log(`   → ${ins.recommended_action}`);
      if (ins.evidence && ins.evidence.length > 0) {
        console.log(`   Evidence: ${ins.evidence.slice(0, 3).join(' | ')}`);
      }
      console.log(`   Sessions active: ${ins.sessionAge}`);
      console.log();
    }
  }

  if (stale.length > 0) {
    console.log(`  ── ${stale.length} stale signal(s) older than 10 sessions ──`);
    for (const ins of stale) {
      console.log(`  ⚪ [STALE/${ins.confidence}] ${ins.pattern} (${ins.sessionAge} sessions ago)`);
    }
    console.log();
  }

  console.log(`  ${active.length} active  |  ${stale.length} stale  |  ${all.length} total`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return active;
}
