import { existsSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import { mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const ROADMAPS = path.join(ROOT, 'learning/roadmaps');
const PROGRESS = path.join(ROOT, 'learning/progress');
const SESSIONS  = path.join(ROOT, 'learning/sessions');

export function slugify(topic) {
  return topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function loadRoadmap(slug) {
  const file = path.join(ROADMAPS, `${slug}.json`);
  if (!existsSync(file)) return null;
  try { return JSON.parse(readFileSync(file, 'utf-8')); } catch { return null; }
}

export function saveRoadmap(slug, roadmap) {
  mkdirSync(ROADMAPS, { recursive: true });
  writeFileSync(path.join(ROADMAPS, `${slug}.json`), JSON.stringify(roadmap, null, 2));
}

export function loadProgress(slug) {
  const file = path.join(PROGRESS, `${slug}.json`);
  if (!existsSync(file)) return { slug, topic: slug, current_topic_index: 0, completed: [], weak_spots: [] };
  try { return JSON.parse(readFileSync(file, 'utf-8')); } catch {
    return { slug, topic: slug, current_topic_index: 0, completed: [], weak_spots: [] };
  }
}

export function saveProgress(slug, progress) {
  mkdirSync(PROGRESS, { recursive: true });
  writeFileSync(path.join(PROGRESS, `${slug}.json`), JSON.stringify(progress, null, 2));
}

export function loadLastSession(slug) {
  const dir = path.join(SESSIONS, slug);
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir).filter(f => f.endsWith('.json')).sort();
  if (!files.length) return null;
  try { return JSON.parse(readFileSync(path.join(dir, files[files.length - 1]), 'utf-8')); } catch { return null; }
}

export function saveSession(slug, session) {
  const dir = path.join(SESSIONS, slug);
  mkdirSync(dir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  writeFileSync(path.join(dir, `${ts}.json`), JSON.stringify(session, null, 2));
}

export function listRoadmaps() {
  if (!existsSync(ROADMAPS)) return [];
  return readdirSync(ROADMAPS)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const slug = f.replace('.json', '');
      const progress = loadProgress(slug);
      const roadmap = loadRoadmap(slug);
      const total = roadmap?.topics?.length ?? 0;
      const done = progress.completed?.length ?? 0;
      return { slug, total, done };
    });
}

export function buildMentorContext(topic, roadmap, progress, lastSession) {
  const currentTopic = roadmap.topics[progress.current_topic_index] ?? 'Review';
  const completed = progress.completed.join(', ') || 'none yet';
  const weak = progress.weak_spots.join(', ') || 'none identified';
  const last = lastSession
    ? `Last session ended with: "${lastSession.last_question ?? 'n/a'}" — learner response: "${lastSession.learner_response ?? 'n/a'}"`
    : 'This is the first session.';

  return `
MENTORSHIP CONTEXT
==================
Subject: ${topic}
Roadmap: ${roadmap.topics.join(' → ')}
Current topic: ${currentTopic} (topic ${progress.current_topic_index + 1} of ${roadmap.topics.length})
Completed topics: ${completed}
Known weak spots: ${weak}
${last}

Teach the current topic using the Socratic method. End with a verification question.
If the learner's answer is incorrect or off-target: say so directly before re-explaining. Do not diplomatically acknowledge and move on. Say something like "Not quite — that is not what I was looking for." then correct the misconception explicitly before asking the next question.
`.trim();
}
