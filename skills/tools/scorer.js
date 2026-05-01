import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
import { c } from '../../orchestrator/colors.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCORES_DIR = path.join(__dirname, '../../meta/scores');

function scoreOutput(task, output) {
  const scores = {
    clarity:    scoreClarity(output),
    usefulness: scoreUsefulness(task, output),
    efficiency: scoreEfficiency(task, output),
    redundancy: scoreRedundancy(output),
  };
  scores.overall = Math.round(
    (scores.clarity + scores.usefulness + scores.efficiency + scores.redundancy) / 4
  );
  return scores;
}

function scoreClarity(output) {
  let score = 60;
  // Formatting is a bonus, not a requirement
  if (output.includes('##') || output.includes('**')) score += 10;
  if (output.includes('\n-') || output.includes('\n*')) score += 5;
  const sentences = output.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 0) {
    const avgLen = output.length / sentences.length;
    if (avgLen < 200) score += 10; // concise sentences are clear
    else if (avgLen > 400) score -= 10; // overly long sentences hurt clarity
  }
  // Penalize wall-of-text lines but not short clean answers
  const lines = output.split('\n');
  const avgLineLen = output.length / Math.max(lines.length, 1);
  if (avgLineLen > 300) score -= 10;
  return Math.min(100, Math.max(0, score));
}

function scoreUsefulness(task, output) {
  let score = 50;
  const taskWords = new Set(
    task.toLowerCase().split(/\W+/).filter(w => w.length > 3)
  );
  const outputLower = output.toLowerCase();
  let hits = 0;
  for (const word of taskWords) {
    if (outputLower.includes(word)) hits++;
  }
  const overlap = taskWords.size > 0 ? hits / taskWords.size : 0;
  score += Math.round(overlap * 40);
  // Precision bonus: high keyword coverage in a short answer is excellent
  if (overlap > 0.8 && output.length < 300) score += 10;
  // Only penalise truly empty answers
  if (output.length < 50) score -= 20;
  return Math.min(100, Math.max(0, score));
}

function scoreEfficiency(task, output) {
  let score = 70;
  if (task.length > 150 && output.length < 100) score -= 20; // very thin answer on complex task
  if (task.length < 50 && output.length > 2000) score -= 15;
  const fillers = [
    'certainly', 'of course', 'absolutely', 'great question',
    'sure thing', 'definitely', 'i hope this helps',
    'feel free to ask', 'let me know if'
  ];
  const outputLower = output.toLowerCase();
  for (const f of fillers) {
    if (outputLower.includes(f)) score -= 10;
  }
  return Math.min(100, Math.max(0, score));
}

function scoreRedundancy(output) {
  let score = 80;
  const sentences = output.split(/[.!?\n]+/).map(s => s.trim()).filter(s => s.length > 20);
  const seen = new Set();
  let repeats = 0;
  for (const s of sentences) {
    const normalized = s.toLowerCase().replace(/\W+/g, ' ').trim();
    if (seen.has(normalized)) repeats++;
    seen.add(normalized);
  }
  score -= repeats * 15;
  const words = output.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  const phrases = {};
  for (let i = 0; i < words.length - 2; i++) {
    const phrase = words.slice(i, i + 3).join(' ');
    phrases[phrase] = (phrases[phrase] || 0) + 1;
  }
  const repeatedPhrases = Object.values(phrases).filter(c => c > 6).length;
  score -= repeatedPhrases * 3;
  return Math.min(100, Math.max(0, score));
}

function saveScore(task, output, scores) {
  if (!fs.existsSync(SCORES_DIR)) {
    fs.mkdirSync(SCORES_DIR, { recursive: true });
  }
  const entry = {
    timestamp: new Date().toISOString(),
    task: task.substring(0, 100),
    scores,
  };
  const file = path.join(SCORES_DIR, 'scores.jsonl');
  fs.appendFileSync(file, JSON.stringify(entry) + '\n');
}

function displayScore(scores) {
  console.log(c.metric('\n─────────────────────────'));
  console.log(c.metric('📊 OUTPUT SCORE'));
  console.log(c.metric('─────────────────────────'));
  console.log(c.metric(`  Clarity     ${bar(scores.clarity)}  ${scores.clarity}`));
  console.log(c.metric(`  Usefulness  ${bar(scores.usefulness)}  ${scores.usefulness}`));
  console.log(c.metric(`  Efficiency  ${bar(scores.efficiency)}  ${scores.efficiency}`));
  console.log(c.metric(`  Redundancy  ${bar(scores.redundancy)}  ${scores.redundancy}`));
  console.log('─────────────────────────');
  console.log(c.metric(`  Overall     ${bar(scores.overall)}  ${scores.overall}/100`));
  console.log('─────────────────────────\n');
}

function bar(score) {
  const filled = Math.round(score / 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

export { scoreOutput, saveScore, displayScore };
