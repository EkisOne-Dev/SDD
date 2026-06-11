#!/usr/bin/env node
// scripts/sync-version.js
// Usage: node scripts/sync-version.js <version>
// Or via: sdd release <version>
// Updates all architectural design files to the given version, then verifies, commits, and backs up.

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const version = process.argv[2];
if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error('Usage: sdd release <version>  (e.g. sdd release 4.10.0)');
  process.exit(1);
}

const date = new Date().toISOString().split('T')[0];
let updated = [];

function patch(filePath, replacements) {
  let content = readFileSync(filePath, 'utf8');
  for (const [from, to] of replacements) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
    }
  }
  writeFileSync(filePath, content);
}

// ── SPEC.md ─────────────────────────────────────────────────────────────────
const specPath = join(ROOT, 'SPEC.md');
const specContent = readFileSync(specPath, 'utf8');
const curDocVer = (specContent.match(/\| Document Version \| (.+?) \|/) || [])[1] || '?';
const curSysVer = (specContent.match(/\| System Version \| v(.+?) —/) || [])[1] || '?';
patch(specPath, [
  [`| Document Version | ${curDocVer} |`,       `| Document Version | ${version} |`],
  [`| System Version | v${curSysVer} —`,         `| System Version | v${version} —`],
  [`| Last Updated | ${curDocVer.slice(0,10)} |`, `| Last Updated | ${date} |`],
]);
updated.push('SPEC.md');

// ── CAPABILITIES.md ──────────────────────────────────────────────────────────
const capPath = join(ROOT, 'CAPABILITIES.md');
const capContent = readFileSync(capPath, 'utf8');
const curCapVer = (capContent.match(/\*\*Version:\*\* (.+)/) || [])[1]?.trim() || '?';
patch(capPath, [
  [`**Version:** ${curCapVer}`, `**Version:** ${version}`],
  [`**Last Updated:** `,        `**Last Updated:** `],  // date line kept as-is, just version bumped
]);
// Update Last Updated date specifically
let cap = readFileSync(capPath, 'utf8');
cap = cap.replace(/\*\*Last Updated:\*\* \d{4}-\d{2}-\d{2}/, `**Last Updated:** ${date}`);
writeFileSync(capPath, cap);
updated.push('CAPABILITIES.md');

// ── verify.sh ────────────────────────────────────────────────────────────────
const verPath = join(ROOT, 'scripts', 'verify.sh');
const verContent = readFileSync(verPath, 'utf8');
const curVerVer = (verContent.match(/SDD System Verification v(.+?)\\n/) || verContent.match(/Verification v([\d.]+)/) || [])[1] || '?';
patch(verPath, [
  [`SDD System Verification v${curVerVer}`, `SDD System Verification v${version}`],
]);
updated.push('verify.sh');

// ── system.json ──────────────────────────────────────────────────────────────
const sysPath = join(ROOT, 'config', 'system.json');
const sys = JSON.parse(readFileSync(sysPath, 'utf8'));
sys.version = version;
writeFileSync(sysPath, JSON.stringify(sys, null, 2));
updated.push('config/system.json');

// ── package.json ─────────────────────────────────────────────────────────────
const pkgPath = join(ROOT, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
pkg.version = version;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
updated.push('package.json');

// ── README.md — version line only ────────────────────────────────────────────
const readmePath = join(ROOT, 'README.md');
let readme = readFileSync(readmePath, 'utf8');
readme = readme.replace(/\*\*Version:\*\* [\d.]+/, `**Version:** ${version}`);
readme = readme.replace(/\| Last session \| .+ \|/, `| Last session | ${date} |`);
writeFileSync(readmePath, readme);
updated.push('README.md');

// ── featurelist.json ─────────────────────────────────────────────────────────
const flPath = join(ROOT, 'featurelist.json');
const fl = JSON.parse(readFileSync(flPath, 'utf8'));
fl.version = version;
fl.system_version = version;
fl.last_updated = date;
writeFileSync(flPath, JSON.stringify(fl, null, 2));
updated.push('featurelist.json');

console.log(`\n✅ Version synced → v${version} (${date})`);
console.log(`   Files updated: ${updated.join(', ')}\n`);

// ── Verify ───────────────────────────────────────────────────────────────────
console.log('🔍 Running verify.sh...');
try {
  const verifyPath = join(ROOT, 'scripts', 'verify.sh');
  const raw = execSync(`bash "${verifyPath}"`, { encoding: 'utf8' });
  const clean = raw.replace(/\x1b\[[0-9;]*m/g, '');
  const totalMatch = clean.match(/Total checks\s*:\s*(\d+)/);
  const passMatch  = clean.match(/Passed\s*:\s*(\d+)/);
  const failMatch  = clean.match(/Failed\s*:\s*(\d+)/);
  const total = totalMatch?.[1] ?? '?';
  const pass  = passMatch?.[1]  ?? '?';
  const fail  = parseInt(failMatch?.[1] ?? '1', 10);
  console.log(`   ${pass}/${total} checks passed`);
  if (fail === 0) {
    console.log('   ✅ All checks passed — system verified\n');
  } else {
    console.log(`   ⚠️  ${fail} check(s) failed — fix before committing\n`);
    process.exit(1);
  }
} catch (e) {
  console.error('   ❌ verify.sh failed to run:', e.message);
  process.exit(1);
}

// ── Commit ───────────────────────────────────────────────────────────────────
const msg = `chore: v${version} — version sync across all architectural design files`;
try {
  execSync(`cd ~/sdd && git add -A && git commit -m "${msg}"`, { encoding: 'utf8' });
  console.log(`✅ Committed: ${msg}`);
} catch (e) {
  if (e.stdout?.includes('nothing to commit')) {
    console.log('ℹ️  Nothing to commit — files already at this version');
  } else {
    console.error('❌ Commit failed:', e.message);
  }
}

// ── Backup ───────────────────────────────────────────────────────────────────
console.log('\n📦 Running backup...');
try {
  execSync('bash ~/sdd/backup.sh', { encoding: 'utf8' });
  console.log('✅ Backup complete\n');
} catch (e) {
  console.log('⚠️  Backup returned non-zero — check backup.sh output\n');
}
