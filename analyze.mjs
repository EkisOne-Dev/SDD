#!/usr/bin/env node
/**
 * analyze.mjs — SDD Static Code Analysis & Undocumented Capability Detector
 * Fase 0 del proceso de refactorización integral.
 *
 * Usage  : node analyze.mjs
 *          node analyze.mjs --root /path/to/sdd
 * Output : code-state-report.md in project root
 *
 * Phases : 1-Collection 2-Extraction 3-CrossRef 4-Classification 5-Report
 * Constraints: ES Module, no external deps, Node.js 18+, static only.
 */

import { readFile, readdir, writeFile } from 'fs/promises';
import { existsSync }                    from 'fs';
import { join, relative, extname, basename } from 'path';

// ── CONFIGURATION ─────────────────────────────────────────────────────────────

const ROOT = (process.argv[2] === '--root' && process.argv[3])
  ? process.argv[3] : process.cwd();

const REPORT_OUT = join(ROOT, 'code-state-report.md');
const NOW        = new Date().toISOString().slice(0, 19).replace('T', ' ');

const SOURCE_DIRS    = ['orchestrator','skills','commands','hooks','memory','meta','engine','agents'];
const ROOT_JS_NAMES  = ['main.js','index.js','cli.js','sdd.js'];
const SKIP_DIR_NAMES = new Set(['node_modules','.git','logs','backup','costs','insights','baselines','snapshots','postmortems']);

const JS_METHODS = new Set([
  'then','catch','finally','length','toString','constructor','prototype',
  'call','apply','bind','map','filter','reduce','forEach','find','some',
  'every','push','pop','shift','unshift','slice','splice','join','split',
  'keys','values','entries','assign','freeze','create','name','message',
  'stack','code','type','data','error','result','ok','value','done',
  'next','return','throw','includes','startsWith','endsWith','replace',
  'match','test','exec','log','warn','info','debug','trace',
  'resolve','reject','all','race','any','from','of','isArray','parse',
  'stringify','floor','ceil','round','max','min','abs','random','now',
  'trim','padStart','padEnd','repeat','at','flat','flatMap','sort',
  'reverse','fill','indexOf','lastIndexOf','has','get','set','delete',
  'clear','size','add','path','dir','base','ext',
]);

const ARCH_CONTEXT = [
  'capability','phase','command','config','agent','provider','chain',
  'feature','function','skill','files responsible','trigger','table',
  'schema','export','import','sdd ','`sdd',
];

// ── UTILITIES ─────────────────────────────────────────────────────────────────

async function collectFiles(dir, exts = ['.js','.mjs']) {
  const results = [];
  if (!existsSync(dir)) return results;
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return results; }
  for (const e of entries) {
    if (SKIP_DIR_NAMES.has(e.name)) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) results.push(...await collectFiles(full, exts));
    else if (exts.includes(extname(e.name))) results.push(full);
  }
  return results;
}

async function safeRead(p) {
  try { return await readFile(p, 'utf8'); } catch { return null; }
}

function safeJSON(content, label) {
  try { return JSON.parse(content); }
  catch (e) { return { _parseError: `${label}: ${e.message}` }; }
}

function lineCount(t) { return t ? t.split('\n').length : 0; }
function fmt(n)        { return Number(n).toLocaleString(); }

function isArchDocumented(term, docText) {
  if (!term || !docText.includes(term)) return false;
  const lower = docText.toLowerCase(), lowerTerm = term.toLowerCase();
  let idx = lower.indexOf(lowerTerm);
  while (idx !== -1) {
    const win = lower.slice(Math.max(0, idx - 300), idx + term.length + 300);
    if (ARCH_CONTEXT.some(kw => win.includes(kw))) return true;
    idx = lower.indexOf(lowerTerm, idx + 1);
  }
  return false;
}

function isInDocs(term, docText) { return Boolean(term && docText.includes(term)); }

// ── PHASE 1 — COLLECTION ──────────────────────────────────────────────────────

async function phase1_collect() {
  process.stdout.write('  [1/5] Collecting files...');
  const sourceFiles = new Map();

  for (const dir of SOURCE_DIRS) {
    for (const f of await collectFiles(join(ROOT, dir))) {
      const c = await safeRead(f);
      if (c !== null) sourceFiles.set(relative(ROOT, f).replace(/\\/g, '/'), c);
    }
  }
  for (const name of ROOT_JS_NAMES) {
    const c = await safeRead(join(ROOT, name));
    if (c !== null && !sourceFiles.has(name)) sourceFiles.set(name, c);
  }

  const specContent  = await safeRead(join(ROOT, 'SPEC.md'))         || '';
  const capsContent  = await safeRead(join(ROOT, 'CAPABILITIES.md')) || '';
  const docText      = specContent + '\n' + capsContent;
  const systemRaw    = await safeRead(join(ROOT, 'config/system.json'));
  const adapterRaw   = await safeRead(join(ROOT, 'engine/adapter.json'));
  const packageRaw   = await safeRead(join(ROOT, 'package.json'));
  const verifyRaw    = await safeRead(join(ROOT, 'scripts/verify.sh'))
                    || await safeRead(join(ROOT, 'verify.sh')) || '';
  const systemJson   = systemRaw  ? safeJSON(systemRaw,  'system.json')  : null;
  const adapterJson  = adapterRaw ? safeJSON(adapterRaw, 'adapter.json') : null;
  const packageJson  = packageRaw ? safeJSON(packageRaw, 'package.json') : null;

  const skillPaths = await collectFiles(join(ROOT, 'skills'), ['.js','.mjs','.md']);
  const skillFiles = skillPaths.map(f => relative(ROOT, f).replace(/\\/g, '/'));

  const agentsDir = join(ROOT, 'agents');
  let agentDirs = [];
  if (existsSync(agentsDir)) {
    try {
      const ents = await readdir(agentsDir, { withFileTypes: true });
      agentDirs = ents.filter(e => e.isDirectory()).map(e => e.name);
    } catch {}
  }

  let totalLines = 0;
  for (const c of sourceFiles.values()) totalLines += lineCount(c);

  console.log(` ${sourceFiles.size} files, ${fmt(totalLines)} lines`);
  return { sourceFiles, docText, specContent, capsContent,
           systemJson, adapterJson, packageJson, verifyRaw,
           skillFiles, agentDirs, totalLines };
}

// ── PHASE 2 — EXTRACTION ─────────────────────────────────────────────────────

function v1_cliCommands(sourceFiles) {
  const commands = new Map(), flags = new Map();
  const cmdPats = [
    /args\[0\]\s*===\s*['"]([a-zA-Z][\w-]{0,29})['"]/g,
    /argv\[2\]\s*===\s*['"]([a-zA-Z][\w-]{0,29})['"]/g,
    /command\s*===\s*['"]([a-zA-Z][\w-]{0,29})['"]/g,
    /\bcmd\s*===\s*['"]([a-zA-Z][\w-]{0,29})['"]/g,
    /case\s+['"]([a-zA-Z][\w-]{0,29})['"]\s*:/g,
  ];
  const flagPats = [
    /\.includes\s*\(\s*['"](-{1,2}[\w-]+)['"]\s*\)/g,
    /\.indexOf\s*\(\s*['"](-{1,2}[\w-]+)['"]\s*\)/g,
  ];
  for (const [fp, c] of sourceFiles) {
    for (const p of cmdPats)
      for (const m of c.matchAll(p)) {
        const v = m[1].trim();
        if (!commands.has(v)) commands.set(v, new Set());
        commands.get(v).add(fp);
      }
    for (const p of flagPats)
      for (const m of c.matchAll(p)) {
        const v = m[1].trim();
        if (!flags.has(v)) flags.set(v, new Set());
        flags.get(v).add(fp);
      }
    for (const m of c.matchAll(/`sdd\s+([\w-]+)/g)) {
      const v = m[1].trim();
      if (!commands.has(v)) commands.set(v, new Set());
      commands.get(v).add(fp + ' [template]');
    }
  }
  return { commands, flags };
}

function v2_configKeys(sourceFiles, systemJson) {
  const codeKeys = new Map();
  const pats = [
    /\bconfig\.([a-zA-Z_][a-zA-Z0-9_]*)\b/g,
    /\bsystem\.([a-zA-Z_][a-zA-Z0-9_]*)\b/g,
    /\bcfg\.([a-zA-Z_][a-zA-Z0-9_]*)\b/g,
    /config\['([a-zA-Z_][a-zA-Z0-9_]*)'\]/g,
    /config\["([a-zA-Z_][a-zA-Z0-9_]*)"\]/g,
  ];
  for (const [fp, c] of sourceFiles)
    for (const p of pats)
      for (const m of c.matchAll(p)) {
        const k = m[1];
        if (!JS_METHODS.has(k) && k.length > 1) {
          if (!codeKeys.has(k)) codeKeys.set(k, new Set());
          codeKeys.get(k).add(fp);
        }
      }
  const systemKeys = (systemJson && !systemJson._parseError)
    ? new Set(Object.keys(systemJson)) : new Set();
  return { codeKeys, systemKeys };
}

function v3_providers(adapterJson) {
  if (!adapterJson || adapterJson._parseError)
    return { providers: [], activeProvider: null, parseError: adapterJson?._parseError };
  const RESERVED = new Set(['active','_comment','version','agent_models']);
  const providers = Object.entries(adapterJson)
    .filter(([k,v]) => !RESERVED.has(k) && v && typeof v === 'object' && !Array.isArray(v))
    .map(([key, b]) => ({ key, provider: b.provider||b.name||'?', model: b.model||'?',
                          hasApiKey: Boolean(b.api_key_env), think: b.think === true }));
  return { providers, activeProvider: adapterJson.active || null, parseError: null };
}

function v4_dbSchema(sourceFiles) {
  const tables = new Map();
  const NON_COL = new Set(['PRIMARY','UNIQUE','FOREIGN','INDEX','CHECK','CONSTRAINT','KEY']);
  function parseCols(block) {
    return block.split(',').map(s => s.trim())
      .map(s => s.match(/^['"`]?(\w+)['"`]?\s+\w/)?.[1])
      .filter(Boolean).filter(c => !NON_COL.has(c.toUpperCase()));
  }
  const createPat = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?['`"]?(\w+)['`"]?\s*\(([\s\S]*?)\)/gi;
  for (const [fp, c] of sourceFiles) {
    for (const m of c.matchAll(createPat))
      if (!tables.has(m[1])) tables.set(m[1], { columns: parseCols(m[2]), sourceFile: fp });
  }
  return tables;
}

function v5_skillFiles(skillFiles, docText) {
  return skillFiles.map(fp => {
    const name = basename(fp, extname(fp)), ext = extname(fp);
    const type = ext === '.md' ? 'definition' : ext === '.js'||ext === '.mjs' ? 'tool' : 'other';
    return { fp, name, type, documented: isInDocs(name, docText)||isInDocs(fp, docText) };
  });
}

function v6_exports(sourceFiles) {
  const exportMap = new Map(), allImported = new Set();
  const declPats = [
    /export\s+(?:async\s+)?function\s+(\w+)/g,
    /export\s+const\s+(\w+)\s*=/g,
    /export\s+(?:async\s+)?class\s+(\w+)/g,
  ];
  for (const [fp, c] of sourceFiles) {
    const exps = new Set();
    for (const p of declPats) for (const m of c.matchAll(p)) exps.add(m[1]);
    for (const m of c.matchAll(/export\s*\{([^}]+)\}/g))
      m[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean).forEach(n => exps.add(n));
    if (exps.size) exportMap.set(fp, exps);
    for (const m of c.matchAll(/import\s+\{([^}]+)\}\s+from/g))
      m[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean).forEach(n => allImported.add(n));
    for (const m of c.matchAll(/import\s+(\w+)\s+from\s+['"][^'"]+['"]/g))
      allImported.add(m[1]);
  }
  const orphaned = [];
  for (const [fp, names] of exportMap)
    for (const name of names)
      if (!allImported.has(name)) orphaned.push({ name, fp });
  return { exportMap, orphaned };
}

function v7_envVars(sourceFiles, docText) {
  const envMap = new Map();
  for (const [fp, c] of sourceFiles)
    for (const m of c.matchAll(/process\.env\.([A-Z_][A-Z0-9_]*)/g)) {
      if (!envMap.has(m[1])) envMap.set(m[1], new Set());
      envMap.get(m[1]).add(fp);
    }
  return [...envMap.entries()].map(([name, files]) =>
    ({ name, files: [...files], documented: isInDocs(name, docText) }));
}

function v8_chainTypes(sourceFiles, docText) {
  const chains = [];
  const entry = [...sourceFiles.entries()].find(([p]) => p.endsWith('chains.js')||p.endsWith('chains.mjs'));
  if (!entry) return chains;
  const [fp, c] = entry;
  for (const m of c.matchAll(/name:\s*['"]([^'"]+)['"]/g)) {
    const name = m[1];
    const ctx = c.slice(Math.max(0, m.index - 100), m.index + 600);
    if (!ctx.includes('agents:')) continue;
    const agM = ctx.match(/agents:\s*\[([^\]]+)\]/);
    const trM = ctx.match(/triggers:\s*\[([^\]]*)\]/);
    chains.push({
      name,
      agents:  agM ? agM[1].split(',').map(s => s.trim().replace(/['"]/g,'')).filter(Boolean) : [],
      triggers: trM ? trM[1].split(',').map(s => s.trim().replace(/['"]/g,'')).filter(Boolean).slice(0,4) : [],
      documented: isArchDocumented(name, docText), sourceFile: fp,
    });
  }
  return chains;
}

function v9_verifyScript(verifyRaw) {
  if (!verifyRaw) return { checks: [], totalFound: 0, docCount: null };
  const lines = verifyRaw.split('\n');
  const checks = [], CHECK_PATS = [/grep\s+-[qcl]/,/\[\s*-[feds]/,/test\s+-[feds]/,/\|\|\s*fail/,/node\s+.*&&/,/wc\s+-[lc]/];
  let lastComment = '';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#') && !line.startsWith('#!')) { lastComment = line.replace(/^#+\s*/,''); continue; }
    if (line.length > 3 && CHECK_PATS.some(p => p.test(line)))
      checks.push({ lineNum: i+1, description: lastComment||line.slice(0,60), command: line.slice(0,80) });
    if (line.length > 0 && !line.startsWith('#')) lastComment = '';
  }
  const cM = verifyRaw.match(/EXPECTED(?:_COUNT)?\s*=\s*(\d+)/i);
  return { checks, totalFound: checks.length, docCount: cM ? parseInt(cM[1]) : null };
}

function v10_inverseDrift(docText, sourceFiles) {
  const allPaths = new Set(sourceFiles.keys()), allContent = [...sourceFiles.values()].join('\n');
  const drift = [], seen = new Set();
  for (const m of docText.matchAll(/`([a-zA-Z][\w/.-]+\.(?:js|mjs|json|sh|md))`/g)) {
    const ref = m[1];
    if (seen.has(ref)) continue; seen.add(ref);
    if (!existsSync(join(ROOT, ref)) && !allPaths.has(ref))
      drift.push({ type: 'file', ref, status: 'NOT FOUND ON DISK' });
  }
  const BUILTINS = new Set(['console','JSON','Object','Array','Promise','Math','parseInt','parseFloat','String','Number','Boolean','setTimeout','process','require']);
  for (const m of docText.matchAll(/`(\w{3,})\(\)`/g)) {
    const fn = m[1], key = `fn:${fn}`;
    if (seen.has(key)||BUILTINS.has(fn)) continue; seen.add(key);
    const inCode = allContent.includes(`function ${fn}`)||allContent.includes(`const ${fn} =`)||allContent.includes(`async function ${fn}`);
    if (!inCode) drift.push({ type: 'function', ref: `${fn}()`, status: 'NOT FOUND IN CODE' });
  }
  return drift;
}

function vB_docIntegrity(specContent, capsContent) {
  const issues = [];
  const h2Counts = new Map();
  for (const m of specContent.matchAll(/^## (.+)$/gm)) {
    const h = m[1].trim(); h2Counts.set(h, (h2Counts.get(h)||0)+1);
  }
  for (const [h, n] of h2Counts)
    if (n > 1) issues.push({ doc: 'SPEC.md', type: 'DUPLICATE_SECTION',
      detail: `"## ${h}" appears ${n} times — delete all but one.` });
  const endIdx = specContent.indexOf('End of SPEC.md');
  if (endIdx !== -1 && specContent.slice(endIdx).split('\n').length > 5)
    issues.push({ doc: 'SPEC.md', type: 'MISPLACED_END_MARKER',
      detail: 'End of SPEC.md marker appears with content after it — move to EOF.' });
  const plannedInActive = [];
  for (const block of capsContent.split(/(?=^### \d+ —)/m))
    if (block.includes('✅ Active') && block.includes('(planned)')) {
      const t = block.match(/^### (\d+ — .+)$/m);
      if (t) plannedInActive.push(t[1].trim());
    }
  if (plannedInActive.length)
    issues.push({ doc: 'CAPABILITIES.md', type: 'PLANNED_IN_ACTIVE',
      detail: `${plannedInActive.length} Active capabilities with "(planned)" labels: ${plannedInActive.slice(0,3).join(', ')}` });
  const cM = capsContent.match(/(\d+)\/(\d+)\s*checks?\s*pass/gi);
  if (cM) issues.push({ doc: 'CAPABILITIES.md', type: 'HARDCODED_VERIFY_COUNT',
      detail: `Found: "${cM.join(', ')}" — verify matches actual check count.` });
  return issues;
}

// ── PHASE 3 — CROSS-REFERENCE ────────────────────────────────────────────────

function phase3_crossRef(extracted, docText, systemJson) {
  const cmdResults = [...extracted.v1.commands.entries()].map(([cmd, files]) => ({
    cmd, files: [...files], documented: isArchDocumented(cmd, docText)||isInDocs(`sdd ${cmd}`, docText),
  }));
  const allKeys = new Set([...extracted.v2.codeKeys.keys(), ...extracted.v2.systemKeys]);
  const configResults = [...allKeys].map(key => ({
    key, inCode: extracted.v2.codeKeys.has(key), inSystem: extracted.v2.systemKeys.has(key),
    inDocs: isInDocs(key, docText), files: [...(extracted.v2.codeKeys.get(key)||new Set())].slice(0,3),
  }));
  const providerResults = extracted.v3.providers.map(p => ({
    ...p, documented: isInDocs(p.key, docText)||isInDocs(p.provider, docText),
  }));
  const schemaResults = [...extracted.v4.entries()].map(([name, info]) => ({
    name, ...info, documented: isInDocs(name, docText),
  }));
  return { cmdResults, configResults, providerResults, schemaResults };
}

// ── PHASE 4 — CLASSIFICATION ──────────────────────────────────────────────────

function phase4_candidates(extracted, crossRef, docText) {
  const byName = new Map();
  function push(name, type, vector, detail) {
    if (!name) return;
    if (!byName.has(name)) byName.set(name, { name, type, vectors: [], detail });
    const c = byName.get(name);
    if (!c.vectors.includes(vector)) c.vectors.push(vector);
  }
  for (const r of crossRef.cmdResults)       if (!r.documented) push(r.cmd,  'CLI Command',       'V1', r.files[0]||'?');
  for (const r of crossRef.configResults)    if (r.inCode && !r.inSystem && !r.inDocs) push(r.key, 'Config Key', 'V2', r.files[0]||'?');
  for (const p of crossRef.providerResults)  if (!p.documented) push(p.key,  'Adapter Provider',  'V3', `${p.provider}/${p.model}`);
  for (const t of crossRef.schemaResults)    if (!t.documented) push(t.name, 'Database Table',    'V4', `cols: ${t.columns.slice(0,3).join(',')} (${t.sourceFile})`);
  for (const s of extracted.v5)              if (!s.documented) push(s.name, `Skill (${s.type})`, 'V5', s.fp);
  for (const o of extracted.v6.orphaned)     if (!isInDocs(o.name, docText)) push(o.name, 'Orphaned Export', 'V6', o.fp);
  for (const e of extracted.v7)              if (!e.documented) push(e.name, 'Env Variable',      'V7', e.files[0]||'?');
  for (const ch of extracted.v8)             if (!ch.documented) push(ch.name,'Chain Type',       'V8', `agents:[${ch.agents.slice(0,3).join(',')}]`);

  return [...byName.values()].map(c => ({
    ...c, score: c.vectors.length,
    confidence: c.vectors.length >= 3 ? 'HIGH' : c.vectors.length === 2 ? 'MEDIUM' : 'LOW',
  })).sort((a,b) => b.score - a.score || a.name.localeCompare(b.name));
}

// ── PHASE 5 — REPORT ─────────────────────────────────────────────────────────

function phase5_report(data) {
  const { collection, extracted, crossRef, candidates } = data;
  const { sourceFiles, docText, specContent, capsContent,
          adapterJson, packageJson, agentDirs, totalLines } = collection;
  const version = packageJson?.version || 'unknown';
  const out = [];
  const ln = s => out.push(s ?? '');
  const br = () => out.push('');
  const hr = () => out.push('---');

  const highC  = candidates.filter(c => c.confidence==='HIGH').length;
  const medC   = candidates.filter(c => c.confidence==='MEDIUM').length;
  const lowC   = candidates.filter(c => c.confidence==='LOW').length;
  const orphC  = extracted.v6.orphaned.length;
  const driftC = extracted.v10.length;
  const noSysC = crossRef.configResults.filter(r => r.inCode && !r.inSystem).length;
  const deadC  = crossRef.configResults.filter(r => !r.inCode && r.inSystem).length;

  ln('# SDD — Code State Report');
  ln(`**Generated:** ${NOW}  `);
  ln(`**Root:** \`${ROOT}\`  `);
  ln(`**Version:** ${version}  `);
  ln(`**Source files:** ${sourceFiles.size} · ${fmt(totalLines)} lines  `);
  ln(`**Docs:** SPEC.md (${fmt(lineCount(specContent))} ln) · CAPABILITIES.md (${fmt(lineCount(capsContent))} ln)`);
  br();
  ln('## Quick Summary');br();
  ln('| Metric | Count |');ln('|---|---|');
  ln(`| Undocumented candidates HIGH (3+ vectors) | **${highC}** |`);
  ln(`| Undocumented candidates MEDIUM (2 vectors) | ${medC} |`);
  ln(`| Undocumented candidates LOW (1 vector) | ${lowC} |`);
  ln(`| Orphaned exports | ${orphC} |`);
  ln(`| Spec→code drift (docs ref missing code) | ${driftC} |`);
  ln(`| Config keys in code, absent from system.json | ${noSysC} |`);
  ln(`| Config keys in system.json unused in code | ${deadC} |`);
  ln(`| Doc integrity issues | ${extracted.vB.length} |`);
  br();hr();br();

  // S1 — Project Structure
  ln('## 1 — Project Structure');br();
  const byDir = new Map();
  for (const [p,c] of sourceFiles) {
    const d = p.includes('/') ? p.split('/')[0] : '(root)';
    if (!byDir.has(d)) byDir.set(d,{count:0,lines:0});
    byDir.get(d).count++; byDir.get(d).lines += lineCount(c);
  }
  ln('| Directory | Files | Lines |');ln('|---|---|---|');
  for (const [d,i] of [...byDir.entries()].sort((a,b)=>a[0].localeCompare(b[0])))
    ln(`| \`${d}/\` | ${i.count} | ${fmt(i.lines)} |`);
  br();
  const top12 = [...sourceFiles.entries()].map(([p,c])=>({p,l:lineCount(c)})).sort((a,b)=>b.l-a.l).slice(0,12);
  ln('**Largest files:**');br();ln('| File | Lines | Note |');ln('|---|---|---|');
  for (const f of top12) ln(`| \`${f.p}\` | ${fmt(f.l)} | ${f.l>500?'🔴 SRP risk':f.l>300?'⚠️ candidate':''} |`);
  br();
  if (agentDirs.length) { ln(`**Agent roster:** ${agentDirs.join(' · ')}`);br(); }
  hr();br();

  // S2 — Dependencies
  ln('## 2 — Import/Export Dependency');br();
  const fanout = new Map();
  for (const [fp,c] of sourceFiles) {
    const n = [...c.matchAll(/from\s+['"][^'"]+['"]/g)].length;
    fanout.set(fp, n);
  }
  const hiFanout = [...fanout.entries()].filter(([,n])=>n>=5).sort((a,b)=>b[1]-a[1]);
  if (hiFanout.length) {
    ln('**High coupling files (≥5 imports):**');br();ln('| File | Imports |');ln('|---|---|');
    for (const [f,n] of hiFanout) ln(`| \`${f}\` | ${n} ${n>=8?'🔴':'⚠️'} |`);br();
  }
  const totalExp = [...extracted.v6.exportMap.values()].reduce((s,m)=>s+m.size,0);
  ln(`**Total named exports:** ${totalExp} · **Orphaned:** ${orphC}`);br();hr();br();

  // S3 — CLI Commands
  ln('## 3 — CLI Command Inventory');br();
  if (crossRef.cmdResults.length === 0) { ln('No CLI commands detected.');br(); }
  else {
    ln('| Command | Source | Documented |');ln('|---|---|---|');
    for (const r of crossRef.cmdResults.sort((a,b)=>a.cmd.localeCompare(b.cmd)))
      ln(`| \`sdd ${r.cmd}\` | \`${r.files[0]}\` | ${r.documented?'✅':'⚠️ not in docs'} |`);
  }
  br();hr();br();

  // S4 — Config Keys
  ln('## 4 — Config Key Audit');br();
  const completeK = crossRef.configResults.filter(r=>r.inCode&&r.inSystem);
  const codeOnlyK = crossRef.configResults.filter(r=>r.inCode&&!r.inSystem);
  const sysOnlyK  = crossRef.configResults.filter(r=>!r.inCode&&r.inSystem);
  ln(`**Aligned (code + system.json):** ${completeK.length}`);br();
  if (completeK.length) {
    ln('| Key | In Docs |');ln('|---|---|');
    for (const r of completeK.sort((a,b)=>a.key.localeCompare(b.key))) ln(`| \`${r.key}\` | ${r.inDocs?'✅':'—'} |`);br();
  }
  if (codeOnlyK.length) {
    ln(`**⚠️ In code, missing from system.json (${codeOnlyK.length}):**`);br();
    ln('| Key | File | In Docs |');ln('|---|---|---|');
    for (const r of codeOnlyK.sort((a,b)=>a.key.localeCompare(b.key))) ln(`| \`${r.key}\` | ${r.files[0]||'?'} | ${r.inDocs?'✅':'❌'} |`);br();
  }
  if (sysOnlyK.length) {
    ln(`**⚠️ In system.json, unused in code (${sysOnlyK.length}):**`);br();
    ln('| Key |');ln('|---|');
    for (const r of sysOnlyK) ln(`| \`${r.key}\` |`);br();
  }
  hr();br();

  // S5 — Providers
  ln('## 5 — Provider & Adapter Inventory');br();
  if (extracted.v3.parseError) { ln(`⛔ ${extracted.v3.parseError}`); }
  else if (!crossRef.providerResults.length) { ln('No providers found.'); }
  else {
    ln(`**Active:** \`${extracted.v3.activeProvider||'?'}\``);br();
    ln('| Key | Provider | Model | think | API Key | Documented |');ln('|---|---|---|---|---|---|');
    for (const p of crossRef.providerResults)
      ln(`| \`${p.key}\` | ${p.provider} | \`${p.model}\` | ${p.think?'✅':'—'} | ${p.hasApiKey?'✅':'❌'} | ${p.documented?'✅':'⚠️'} |`);
  }
  br();hr();br();

  // S6 — DB Schema
  ln('## 6 — Database Schema Inventory');br();
  if (!crossRef.schemaResults.length) { ln('No CREATE TABLE statements found.'); }
  else for (const t of crossRef.schemaResults) {
    ln(`**Table:** \`${t.name}\` — ${t.documented?'✅ Documented':'⚠️ Not in docs'} (\`${t.sourceFile}\`)`);
    ln(`Columns: ${t.columns.map(c=>`\`${c}\``).join(', ')||'(could not parse)'}`);br();
  }
  hr();br();

  // S7 — Skill Files
  ln('## 7 — Skill File Inventory');br();
  if (!extracted.v5.length) { ln('No files in `skills/`.'); }
  else {
    ln('| File | Type | Documented |');ln('|---|---|---|');
    for (const s of extracted.v5.sort((a,b)=>a.fp.localeCompare(b.fp)))
      ln(`| \`${s.fp}\` | ${s.type} | ${s.documented?'✅':'⚠️'} |`);
  }
  br();hr();br();

  // S8 — Undocumented Candidates (the core)
  ln('## 8 — Undocumented Capability Candidates');br();
  ln('Vectors: V1=CLI V2=ConfigKey V3=Provider V4=DBTable V5=Skill V6=OrphanExport V7=EnvVar V8=ChainType');
  ln('**HIGH** = 3+ vectors · **MEDIUM** = 2 · **LOW** = 1');br();
  if (!candidates.length) { ln('✅ No undocumented candidates.'); }
  else {
    for (const level of ['HIGH','MEDIUM','LOW']) {
      const group = candidates.filter(c=>c.confidence===level);
      if (!group.length) continue;
      ln(`### ${level} — ${group.length} candidate${group.length>1?'s':''}`);br();
      ln('| Name | Type | Vectors | Detail |');ln('|---|---|---|---|');
      for (const c of group) ln(`| \`${c.name}\` | ${c.type} | ${c.vectors.join(', ')} | ${c.detail} |`);br();
    }
  }
  hr();br();

  // S9 — Orphaned Exports
  ln('## 9 — Orphaned Exports');br();
  if (!extracted.v6.orphaned.length) { ln('✅ No orphaned exports.'); }
  else {
    ln('| Name | Source | In Docs |');ln('|---|---|---|');
    for (const o of extracted.v6.orphaned.sort((a,b)=>a.name.localeCompare(b.name)))
      ln(`| \`${o.name}\` | \`${o.fp}\` | ${isInDocs(o.name,docText)?'✅':'❌'} |`);
  }
  br();hr();br();

  // S10 — Spec-to-Code Drift
  ln('## 10 — Spec-to-Code Drift');br();
  if (!extracted.v10.length) { ln('✅ All doc-referenced files/functions found.'); }
  else {
    ln('| Type | Reference | Status |');ln('|---|---|---|');
    for (const item of extracted.v10) ln(`| ${item.type} | \`${item.ref}\` | ${item.status} |`);
  }
  br();hr();br();

  // S11 — verify.sh Coverage
  ln('## 11 — verify.sh Coverage');br();
  const { checks, totalFound } = extracted.v9;
  ln(`**Checks found in verify.sh:** ${totalFound}`);
  const cM = capsContent.match(/(\d+)\/(\d+)\s*checks?\s*pass/i);
  if (cM) {
    const docN = parseInt(cM[1]);
    ln(`**Count in CAPABILITIES.md:** ${docN} ${docN===totalFound?'✅':'⚠️ MISMATCH — actual: '+totalFound}`);
  }
  br();
  if (checks.length) {
    ln('| # | Line | Description |');ln('|---|---|---|');
    checks.slice(0,40).forEach((c,i)=>ln(`| ${i+1} | ${c.lineNum} | ${c.description.slice(0,70)} |`));
    if (checks.length>40) ln(`| … | … | (${checks.length-40} more) |`);
  }
  br();hr();br();

  // S12 — Doc Integrity
  ln('## 12 — Documentation Integrity');br();
  if (!extracted.vB.length) { ln('✅ No structural doc issues detected.'); }
  else {
    ln('| Doc | Type | Detail |');ln('|---|---|---|');
    for (const i of extracted.vB) ln(`| ${i.doc} | \`${i.type}\` | ${i.detail} |`);
  }
  br();hr();br();
  ln('## Notes');br();
  ln('Static analysis only — no code is executed. Results are approximations; verify before acting.');
  ln('*Run again after refactoring to verify post-refactor state.*');

  return out.join('\n');
}

// ── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│  SDD Static Analyzer — analyze.mjs      │');
  console.log('└─────────────────────────────────────────┘\n');

  if (!existsSync(join(ROOT,'SPEC.md')) && !existsSync(join(ROOT,'CAPABILITIES.md'))) {
    console.error('SPEC.md and CAPABILITIES.md not found. Run from SDD root.');
    process.exit(1);
  }

  console.log('[Phase 1/5] Collecting files...');
  const collection = await phase1_collect();
  const { sourceFiles, docText, systemJson, adapterJson, skillFiles } = collection;

  console.log('[Phase 2/5] Extracting signals (10 vectors + doc integrity)...');
  const v1 = v1_cliCommands(sourceFiles);
  const v2 = v2_configKeys(sourceFiles, systemJson);
  const v3 = v3_providers(adapterJson);
  const v4 = v4_dbSchema(sourceFiles);
  const v5 = v5_skillFiles(skillFiles, docText);
  const v6 = v6_exports(sourceFiles);
  const v7 = v7_envVars(sourceFiles, docText);
  const v8 = v8_chainTypes(sourceFiles, docText);
  const v9 = v9_verifyScript(collection.verifyRaw);
  const v10 = v10_inverseDrift(docText, sourceFiles);
  const vB = vB_docIntegrity(collection.specContent, collection.capsContent);
  const extracted = { v1,v2,v3,v4,v5,v6,v7,v8,v9,v10,vB };

  console.log('[Phase 3/5] Cross-referencing against SPEC + CAPABILITIES...');
  const crossRef = phase3_crossRef(extracted, docText, systemJson);

  console.log('[Phase 4/5] Scoring undocumented candidates...');
  const candidates = phase4_candidates(extracted, crossRef, docText);

  console.log('[Phase 5/5] Building report...');
  await writeFile(REPORT_OUT, phase5_report({ collection, extracted, crossRef, candidates }), 'utf8');

  const highC = candidates.filter(c=>c.confidence==='HIGH').length;
  const medC  = candidates.filter(c=>c.confidence==='MEDIUM').length;
  const lowC  = candidates.filter(c=>c.confidence==='LOW').length;

  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│  RESULTS                                │');
  console.log('├─────────────────────────────────────────┤');
  console.log(`│  Files scanned    : ${String(sourceFiles.size).padEnd(18)}│`);
  console.log(`│  HIGH confidence  : ${String(highC).padEnd(18)}│`);
  console.log(`│  MEDIUM confidence: ${String(medC).padEnd(18)}│`);
  console.log(`│  LOW confidence   : ${String(lowC).padEnd(18)}│`);
  console.log(`│  Orphaned exports : ${String(v6.orphaned.length).padEnd(18)}│`);
  console.log(`│  Spec→code drift  : ${String(v10.length).padEnd(18)}│`);
  console.log(`│  Doc issues       : ${String(vB.length).padEnd(18)}│`);
  console.log('├─────────────────────────────────────────┤');
  console.log('│  Report → code-state-report.md          │');
  console.log('└─────────────────────────────────────────┘\n');
}

main().catch(err => {
  console.error('Analysis failed:', err.message);
  process.exit(1);
});
