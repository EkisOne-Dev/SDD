import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

function loadCapabilities() {
  const raw = readFileSync(join(ROOT, 'CAPABILITIES.md'), 'utf8');
  // Split into sections by ### heading
  const sections = raw.split(/\n(?=### \d+)/).filter(s => s.trim().startsWith('###'));
  return sections.map(s => {
    const headerMatch = s.match(/^### (\d+) — (.+)/m);
    if (!headerMatch) return null;
    return { number: headerMatch[1], name: headerMatch[2].trim(), raw: s };
  }).filter(Boolean);
}

function findCapabilities(query) {
  const caps = loadCapabilities();
  const q = query.toLowerCase();
  return caps.filter(c =>
    c.number === q ||
    c.name.toLowerCase().includes(q) ||
    c.raw.toLowerCase().includes(q)
  );
}

function extractFiles(sectionRaw) {
  const lines = sectionRaw.split('\n');
  const files = [];
  let inFiles = false;
  for (const line of lines) {
    if (line.includes('**Files responsible:**')) { inFiles = true; continue; }
    if (inFiles) {
      if (line.startsWith('**') || line.startsWith('---') || line.trim() === '') {
        if (files.length > 0) break;
        continue;
      }
      if (line.trim().startsWith('-')) {
        // Extract path before — or → or whitespace
        const raw = line.replace(/^\s*-\s*/, '');
        const filePath = raw.split(/\s+[—→]|\s+→/)[0].trim();
        // Strip inline function refs like → functionName()
        const cleanPath = filePath.split('→')[0].trim();
        if (cleanPath && !cleanPath.startsWith('`')) files.push(cleanPath);
      }
    }
  }
  return files;
}

function checkFiles(files) {
  return files.map(f => {
    const full = join(ROOT, f);
    return { path: f, exists: existsSync(full) };
  });
}

function lookupFeatureStatus(capName) {
  try {
    const fl = JSON.parse(readFileSync(join(ROOT, 'featurelist.json'), 'utf8'));
    for (const [, feat] of Object.entries(fl.features)) {
      if (feat.title && feat.title.toLowerCase().includes(capName.toLowerCase().slice(0, 20))) {
        return feat.status;
      }
    }
  } catch { /* ignore */ }
  return 'unknown';
}

function writeProposal(cap, missingFiles) {
  const proposalsDir = join(ROOT, 'meta', 'proposals');
  const id = `audit-gap-cap${cap.number}-${Date.now()}`;
  const proposal = {
    id,
    source: 'sdd-audit',
    capability: `${cap.number} — ${cap.name}`,
    issue: `${missingFiles.length} responsible file(s) missing from disk`,
    missing_files: missingFiles,
    suggestion: `Implement or restore missing files for capability ${cap.number}: ${cap.name}`,
    priority: 'high',
    created: new Date().toISOString(),
    status: 'pending'
  };
  writeFileSync(join(proposalsDir, `${id}.json`), JSON.stringify(proposal, null, 2));
  return id;
}

export async function runAudit(query) {
  console.log(`\n🔍 SDD Audit — searching for: "${query}"\n`);

  const matches = findCapabilities(query);
  if (matches.length === 0) {
    console.log(`  ❌ No capability found matching "${query}"\n`);
    return;
  }

  let totalGaps = 0;

  for (const cap of matches) {
    console.log(`─── Capability #${cap.number} — ${cap.name}`);

    const files = extractFiles(cap.raw);
    const checked = checkFiles(files);
    const status = lookupFeatureStatus(cap.name);

    console.log(`  Status     : ${status}`);
    console.log(`  Files (${checked.length}):`);

    const missing = [];
    for (const f of checked) {
      console.log(`    ${f.exists ? '✅' : '❌'} ${f.path}`);
      if (!f.exists) missing.push(f.path);
    }

    if (missing.length > 0) {
      totalGaps += missing.length;
      const id = writeProposal(cap, missing);
      console.log(`\n  ⚠️  ${missing.length} file(s) missing — proposal written: ${id}`);
    } else {
      console.log(`\n  ✅ All files present — no gaps found`);
    }
    console.log('');
  }

  if (totalGaps === 0) {
    console.log(`✅ Audit complete — no gaps detected\n`);
  } else {
    console.log(`⚠️  Audit complete — ${totalGaps} gap(s) found. Check meta/proposals/ for details.\n`);
  }
}
