import { readFileSync, appendFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sddRoot = join(__dirname, '..', '..');

function loadJsonl(filePath) {
  if (!existsSync(filePath)) return [];
  return readFileSync(filePath, 'utf8')
    .split('\n')
    .filter(l => l.trim())
    .map(l => { try { return JSON.parse(l); } catch { return null; } })
    .filter(Boolean);
}

function analyzeScores(scores) {
  const insights = [];
  if (scores.length < 5) return insights;

  const DIMENSIONS = ['clarity', 'usefulness', 'efficiency', 'redundancy'];
  const recent = scores.slice(-20);

  // Weakest dimension
  const dimAvgs = {};
  for (const dim of DIMENSIONS) {
    const vals = recent.map(s => s.scores?.[dim]).filter(n => typeof n === 'number');
    if (vals.length > 0) dimAvgs[dim] = vals.reduce((a, b) => a + b, 0) / vals.length;
  }
  const weakest = Object.entries(dimAvgs).sort((a, b) => a[1] - b[1])[0];
  if (weakest && weakest[1] < 70) {
    insights.push({
      timestamp: new Date().toISOString(),
      pattern: `Dimension weakness: "${weakest[0]}" averaging ${weakest[1].toFixed(1)} across last ${recent.length} sessions`,
      evidence: Object.entries(dimAvgs).map(([d, v]) => `${d}: ${v.toFixed(1)}`),
      confidence: recent.length >= 10 ? 'HIGH' : 'MEDIUM',
      recommended_action: `Target "${weakest[0]}" in next agent strategy.txt refinement pass`
    });
  }

  // Overall score trend — last 10 vs prior 10
  if (scores.length >= 20) {
    const overall = scores.map(s => s.scores?.overall).filter(n => typeof n === 'number');
    if (overall.length >= 20) {
      const recentAvg = overall.slice(-10).reduce((a, b) => a + b, 0) / 10;
      const priorAvg = overall.slice(-20, -10).reduce((a, b) => a + b, 0) / 10;
      const delta = recentAvg - priorAvg;
      if (Math.abs(delta) >= 3) {
        insights.push({
          timestamp: new Date().toISOString(),
          pattern: `Overall score trend ${delta > 0 ? 'improving' : 'declining'}: ${delta > 0 ? '+' : ''}${delta.toFixed(1)} pts (last 10 vs prior 10)`,
          evidence: [`Recent avg: ${recentAvg.toFixed(1)}`, `Prior avg: ${priorAvg.toFixed(1)}`, `Last 5: ${overall.slice(-5).join(', ')}`],
          confidence: 'MEDIUM',
          recommended_action: delta < 0 ? 'Review recent strategy.txt changes — regression likely' : 'Positive trend — preserve current configuration'
        });
      }
    }
  }

  return insights;
}

function analyzeImprovements(improvements) {
  const insights = [];
  if (improvements.length < 2) return insights;

  const byDimension = {};
  for (const imp of improvements) {
    const dim = imp.dimension || 'unknown';
    byDimension[dim] = (byDimension[dim] || 0) + 1;
  }
  const top = Object.entries(byDimension).sort((a, b) => b[1] - a[1])[0];
  if (top && top[1] >= 2) {
    insights.push({
      timestamp: new Date().toISOString(),
      pattern: `Recurring improvement target: "${top[0]}" (${top[1]} proposals applied)`,
      evidence: Object.entries(byDimension).map(([d, c]) => `${d}: ${c} proposal${c > 1 ? 's' : ''}`),
      confidence: top[1] >= 5 ? 'HIGH' : 'MEDIUM',
      recommended_action: `Systemic issue in "${top[0]}" — investigate root cause rather than continuing surface patches`
    });
  }

  return insights;
}


function loadPostmortems(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .sort()
    .map(f => ({ filename: f, content: readFileSync(join(dir, f), 'utf8') }));
}

function analyzePostmortems(postmortems) {
  const insights = [];
  if (postmortems.length < 2) return insights;

  const STAGES = ['propose', 'spec', 'design', 'tasks', 'apply', 'verify', 'archive'];
  const stageFailCounts = {};

  for (const pm of postmortems) {
    for (const stage of STAGES) {
      if (pm.content.includes('[\u274c] ' + stage)) {
        stageFailCounts[stage] = (stageFailCounts[stage] || 0) + 1;
      }
    }
  }

  // Repeatedly failing stages (>=30% of projects or at least 2)
  const threshold = Math.max(2, Math.floor(postmortems.length * 0.3));
  const failingStages = Object.entries(stageFailCounts)
    .filter(([, count]) => count >= threshold)
    .sort((a, b) => b[1] - a[1]);

  if (failingStages.length > 0) {
    const [topStage, topCount] = failingStages[0];
    insights.push({
      timestamp: new Date().toISOString(),
      pattern: 'Pipeline stage repeatedly failing: "' + topStage + '" incomplete in ' + topCount + '/' + postmortems.length + ' projects',
      evidence: failingStages.map(([s, c]) => s + ': ' + c + ' failure' + (c > 1 ? 's' : '')),
      confidence: topCount >= 3 ? 'HIGH' : 'MEDIUM',
      recommended_action: 'Investigate "' + topStage + '" stage — recurring pipeline gap detected across postmortems',
      source: 'postmortem'
    });
  }

  // Catastrophic runs — 3+ failed stages in a single project (last 10)
  const recent = postmortems.slice(-10);
  const highFailure = recent.filter(pm =>
    STAGES.filter(s => pm.content.includes('[\u274c] ' + s)).length >= 3
  );
  if (highFailure.length >= 2) {
    insights.push({
      timestamp: new Date().toISOString(),
      pattern: 'Catastrophic pipeline runs: ' + highFailure.length + ' projects with 3+ failed stages (last 10)',
      evidence: highFailure.map(pm => pm.filename.replace('.md', '')),
      confidence: 'HIGH',
      recommended_action: 'Review pipeline stage contracts — multiple stages failing per run indicates systemic issue',
      source: 'postmortem'
    });
  }

  return insights;
}

export async function generateInsights() {
  const insightsDir = join(sddRoot, 'meta', 'insights');
  if (!existsSync(insightsDir)) mkdirSync(insightsDir, { recursive: true });

  const scores = loadJsonl(join(sddRoot, 'meta', 'scores', 'scores.jsonl'));
  const improvements = loadJsonl(join(sddRoot, 'meta', 'logs', 'self-improvements.jsonl'));
  const postmortems = loadPostmortems(join(sddRoot, 'meta', 'postmortems'));
  const outputPath = join(insightsDir, 'insights.jsonl');

  const insights = [...analyzeScores(scores), ...analyzeImprovements(improvements), ...analyzePostmortems(postmortems)];

  if (insights.length === 0) return { count: 0, message: 'Insufficient data for pattern synthesis' };

  for (const insight of insights) appendFileSync(outputPath, JSON.stringify(insight) + '\n');

  return { count: insights.length, insights };
}
