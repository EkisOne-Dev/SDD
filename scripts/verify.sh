#!/data/data/com.termux/files/usr/bin/bash

PASS=0
FAIL=0
WARN=0

pass() { echo "  ✅ $1"; PASS=$((PASS+1)); }
fail() { echo "  ❌ $1"; FAIL=$((FAIL+1)); }
warn() { echo "  ⚠️  $1"; WARN=$((WARN+1)); }

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║       SDD System Verification v5.9.1     ║"
echo "╚══════════════════════════════════════════╝"

echo ""
echo "📁 Directory Structure"
for f in start.sh backup.sh SPEC.md CAPABILITIES.md README.md config/system.json engine/adapter.json orchestrator/main.js orchestrator/orchestrator.js orchestrator/chains.js orchestrator/pipeline.js orchestrator/menu.js orchestrator/post-chain.js orchestrator/validator.js orchestrator/spinner.js orchestrator/colors.js orchestrator/utils.js skills/router.js skills/registry.json skills/tools/capability-check.js skills/tools/negotiator.js skills/tools/self-research.js skills/tools/self-critique.js skills/tools/scorer.js skills/tools/observer.js skills/tools/proposal-manager.js skills/tools/applier.js skills/tools/postmortem.js skills/tools/drift-control.js skills/tools/cost-tracker.js skills/tools/image-gen.js skills/tools/learner.js skills/tools/learn-command.js skills/tools/engine-check.js skills/tools/memory-summarizer.js skills/tools/session-end.js skills/tools/intent-parser.js skills/tools/semantic-memory.js skills/tools/audit.js skills/tools/insight-generator.js skills/tools/snapshot.js memory/blackboard-db.js orchestrator/blackboard.js orchestrator/sub-agent-manager.js; do
  [ -f "$HOME/sdd/$f" ] && pass "$f" || fail "$f MISSING"
done

echo ""
echo "🤖 Agent Roster"
for agent in basic architect developer analyst researcher reviewer mentor creator strategist validator; do
  dir="$HOME/sdd/agents/$agent"
  if [ -f "$dir/identity.txt" ] && [ -f "$dir/strategy.txt" ] && [ -f "$dir/constraints.json" ]; then
    pass "$agent"
  else
    fail "$agent — missing files"
  fi
done

echo ""
echo "🔄 Pipeline Phases"
for phase in propose spec design tasks apply verify archive; do
  dir="$HOME/sdd/phases/pipeline/$phase"
  if [ -f "$dir/contract.json" ] && [ -f "$dir/prompt.txt" ]; then
    pass "pipeline/$phase"
  else
    fail "pipeline/$phase — missing files"
  fi
done

echo ""
echo "⚙️  Config Flags"
node --input-type=module << 'JSEOF'
import { readFileSync } from 'fs';
const config = JSON.parse(readFileSync(process.env.HOME + '/sdd/config/system.json', 'utf-8'));
const required = ['capability_check_enabled','negotiation_enabled','self_research_enabled','scoring_enabled','meta_observation_enabled','cost_tracking_enabled','free_only_mode','auto_improvement','intent_parser_enabled','spec_clarifier_enabled','guardian_angel_enabled','semantic_memory_enabled','universal_thinking_enabled'];
required.forEach(f => {
  if (f in config) process.stdout.write('  ✅ ' + f + ': ' + config[f] + '\n');
  else process.stdout.write('  ❌ ' + f + ': MISSING\n');
});
if (config.auto_improvement !== false) process.stdout.write('  ❌ auto_improvement must be false\n');
JSEOF

echo ""
echo "🔌 Engine Adapter"
node --input-type=module << 'JSEOF'
import { readFileSync } from 'fs';
const a = JSON.parse(readFileSync(process.env.HOME + '/sdd/engine/adapter.json', 'utf-8'));
['primary','fallback','fallback2','fallback3','fallback4','local_fallback'].forEach(k => {
  if (a[k]) process.stdout.write('  ✅ ' + k + ': ' + a[k].provider + ' / ' + a[k].model + '\n');
  else process.stdout.write('  ⚠️  ' + k + ': not configured\n');
});
process.stdout.write('  ✅ active: ' + a.active + '\n');
JSEOF

echo ""
echo "🦙 Ollama Models"
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
  curl -s http://localhost:11434/api/tags | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8')); d.models.forEach(m=>console.log('  ✅ ' + m.name));"
else
  warn "Ollama not running — start with: ollama serve &"
fi

echo ""
echo "🏗️  Harness Files"
for f in constitution.md featurelist.json history.md; do
  [ -f "$HOME/sdd/$f" ] && pass "$f" || warn "$f — not yet built"
done
[ -d "$HOME/sdd/skills/library" ] && pass "skills/library/" || warn "skills/library/ — not yet built"
[ -f "$HOME/sdd/memory/embeddings.json" ] && pass "memory/embeddings.json" || warn "memory/embeddings.json — run: sdd index-memory"
[ -f "$HOME/sdd/skills/library/universal-thinking.md" ] && pass "skills/library/universal-thinking.md" || fail "universal-thinking.md MISSING"

echo ""
echo "📦 Git State"
cd ~/sdd
echo "  ✅ Branch: $(git branch --show-current)"
echo "  ✅ HEAD: $(git log -1 --format='%h %s')"

echo ""
echo "─────────────────────────────────────────"
echo "  ✅ Passed:   $PASS"
echo "  ❌ Failed:   $FAIL"
echo "  ⚠️  Warnings: $WARN"
echo "─────────────────────────────────────────"
[ $FAIL -eq 0 ] && echo "  🎯 System verified — ready to build" || echo "  🔧 Fix failures before proceeding"
echo ""

echo ""
echo "📋 Harness Files (Phase 41-42)"
for f in constitution.md featurelist.json history.md; do
  [ -f "$HOME/sdd/$f" ] && pass "$f" || fail "$f MISSING"
done
[ -f "$HOME/sdd/scripts/verify.sh" ] && pass "scripts/verify.sh" || fail "scripts/verify.sh MISSING"
[ -f "$HOME/sdd/scripts/sync-version.js" ] && pass "scripts/sync-version.js" || fail "scripts/sync-version.js MISSING"
