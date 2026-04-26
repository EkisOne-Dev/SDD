import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../../');
const POSTMORTEMS_DIR = path.join(ROOT, 'meta/postmortems');

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 50);
}

function generatePostmortem(projectName, stages) {
  const slug = slugify(projectName);
  const timestamp = new Date().toISOString();
  const date = timestamp.split('T')[0];

  // Collect artifacts from each stage
  const stageNames = ['propose', 'spec', 'design', 'tasks', 'apply', 'verify', 'archive'];
  const artifacts = [];
  const decisions = [];

  for (const stage of stageNames) {
    const stagePath = path.join(ROOT, `projects/${slug}/outputs/${stage}.md`);
    if (fs.existsSync(stagePath)) {
      artifacts.push(`projects/${slug}/outputs/${stage}.md`);
    }
  }

  // Read archive output for summary if available
  const archivePath = path.join(ROOT, `projects/${slug}/outputs/archive.md`);
  let archiveSummary = 'Archive not available.';
  if (fs.existsSync(archivePath)) {
    const content = fs.readFileSync(archivePath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    archiveSummary = lines.slice(0, 10).join('\n');
  }

  // Read decisions log if available
  const decisionsPath = path.join(ROOT, `projects/${slug}/decisions.json`);
  let decisionsLog = [];
  if (fs.existsSync(decisionsPath)) {
    try {
      decisionsLog = JSON.parse(fs.readFileSync(decisionsPath, 'utf8'));
    } catch {}
  }

  const postmortem = `# Postmortem — ${projectName}
**Date:** ${date}
**Project slug:** ${slug}
**Generated:** ${timestamp}

---

## Project Summary
${archiveSummary}

---

## Pipeline Stages Completed
${stageNames.map(s => {
  const p = path.join(ROOT, `projects/${slug}/outputs/${s}.md`);
  return `- [${fs.existsSync(p) ? '✅' : '❌'}] ${s}`;
}).join('\n')}

---

## Artifacts Produced
${artifacts.length > 0 ? artifacts.map(a => `- ${a}`).join('\n') : '- None recorded'}

---

## Key Decisions
${decisionsLog.length > 0
  ? decisionsLog.map(d => `- **${d.stage || 'unknown'}:** ${d.decision || JSON.stringify(d)}`).join('\n')
  : '- No structured decisions log found. See archive output for decisions.'}

---

## What Worked Well
*(Review the verify and archive stages for specifics.)*

## What Could Be Improved
*(Review any FAIL or GAP items in the verify stage output.)*

## Lessons Learned
*(Derived from archive stage — see archive.md for full lessons.)*

---

## Recommendation
Review \`projects/${slug}/outputs/verify.md\` for acceptance criteria results.
Review \`projects/${slug}/outputs/archive.md\` for full lessons and follow-up actions.
`;

  if (!fs.existsSync(POSTMORTEMS_DIR)) {
    fs.mkdirSync(POSTMORTEMS_DIR, { recursive: true });
  }

  const filename = `${date}-${slug}.md`;
  const filepath = path.join(POSTMORTEMS_DIR, filename);
  fs.writeFileSync(filepath, postmortem);

  return { filepath: `meta/postmortems/${filename}`, slug, date };
}

export { generatePostmortem };
