import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../../');
const SCORES_FILE = path.join(ROOT, 'meta/scores/scores.jsonl');
const BASELINES_DIR = path.join(ROOT, 'meta/baselines');
const BASELINE_FILE = path.join(BASELINES_DIR, 'baseline.json');

const DRIFT_THRESHOLD = 10;
const MIN_SCORES = 5;
const DIMENSIONS = ['clarity', 'usefulness', 'efficiency', 'redundancy', 'overall'];

function readScores() {
  if (!fs.existsSync(SCORES_FILE)) return [];
  const lines = fs.readFileSync(SCORES_FILE, 'utf8').trim().split('\n').filter(Boolean);
  return lines.map(l => JSON.parse(l));
}

function computeAverages(scores) {
  if (scores.length === 0) return null;
  const avgs = {};
  for (const dim of DIMENSIONS) {
    avgs[dim] = Math.round(
      scores.reduce((sum, s) => sum + (s.scores[dim] || 0), 0) / scores.length
    );
  }
  return avgs;
}

function loadBaseline() {
  if (!fs.existsSync(BASELINE_FILE)) return null;
  try { return JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8')); }
  catch { return null; }
}

function captureBaseline() {
  const scores = readScores();
  if (scores.length < MIN_SCORES) {
    return { success: false, reason: `Need at least ${MIN_SCORES} scores to capture a baseline. Currently have ${scores.length}.` };
  }

  const recent = scores.slice(-20);
  const avgs = computeAverages(recent);
  const baseline = {
    captured_at: new Date().toISOString(),
    sample_size: recent.length,
    averages: avgs
  };

  if (!fs.existsSync(BASELINES_DIR)) fs.mkdirSync(BASELINES_DIR, { recursive: true });
  fs.writeFileSync(BASELINE_FILE, JSON.stringify(baseline, null, 2));
  return { success: true, baseline };
}

function checkDrift(currentScores) {
  const baseline = loadBaseline();
  if (!baseline) return null;

  const scores = readScores();
  if (scores.length < MIN_SCORES) return null;

  const recent = scores.slice(-5);
  const current = computeAverages(recent);
  const drifts = [];

  for (const dim of DIMENSIONS) {
    const base = baseline.averages[dim];
    const curr = current[dim];
    const delta = curr - base;
    if (delta <= -DRIFT_THRESHOLD) {
      drifts.push({ dimension: dim, baseline: base, current: curr, delta });
    }
  }

  return drifts.length > 0 ? { drifts, current, baseline: baseline.averages, captured_at: baseline.captured_at } : null;
}

function displayDrift(report) {
  console.log('\n─────────────────────────');
  console.log('⚠️  DRIFT DETECTED');
  console.log('─────────────────────────');
  console.log(`Baseline captured: ${report.captured_at.split('T')[0]}`);
  for (const d of report.drifts) {
    console.log(`  ${d.dimension.padEnd(12)} baseline ${d.baseline}  →  now ${d.current}  (${d.delta})`);
  }
  console.log('─────────────────────────');
  console.log('Run: sdd baseline   to reset baseline to current averages');
  console.log('─────────────────────────\n');
}

function displayBaseline(baseline) {
  console.log('\n─────────────────────────');
  console.log('📏 BASELINE CAPTURED');
  console.log('─────────────────────────');
  console.log(`  Sample: last ${baseline.sample_size} runs`);
  for (const dim of DIMENSIONS) {
    console.log(`  ${dim.padEnd(12)} ${baseline.averages[dim]}`);
  }
  console.log('─────────────────────────\n');
}

export { captureBaseline, checkDrift, displayDrift, displayBaseline };
