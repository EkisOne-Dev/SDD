#!/data/data/com.termux/files/usr/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# verify.sh — SDD Full System Verification
# Run from ~/sdd/ directory: bash verify.sh
# Checks: static file presence, JSON structure, version sync, code patterns.
# Does NOT make API calls or run live sdd commands (no quota consumed).
# ─────────────────────────────────────────────────────────────────────────────

SDD="$(cd "$(dirname "$0")" && pwd)"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

PASS=0
FAIL=0
FAIL_LIST=()

pass() { printf "  ${GREEN}✅${NC} %s\n" "$1"; PASS=$((PASS+1)); }
fail() { printf "  ${RED}❌${NC} %s\n" "$1"; FAIL=$((FAIL+1)); FAIL_LIST+=("$1"); }

check_file()    { [ -f "$SDD/$2" ]        && pass "$1" || fail "$1"; }
check_dir()     { [ -d "$SDD/$2" ]        && pass "$1" || fail "$1"; }
check_grep()    { grep -q "$3" "$SDD/$2" 2>/dev/null && pass "$1" || fail "$1"; }
check_json()    {
  node -e "try{JSON.parse(require('fs').readFileSync('$SDD/$2','utf8'));process.exit(0)}catch{process.exit(1)}" 2>/dev/null \
    && pass "$1" || fail "$1"
}

section() { printf "\n${CYAN}${BOLD}── %s${NC}\n" "$1"; }

# ─────────────────────────────────────────────────────────────────────────────
printf "${BOLD}\n╔══════════════════════════════════════════╗${NC}\n"
printf "${BOLD}║   SDD System Verification — verify.sh    ║${NC}\n"
printf "${BOLD}╚══════════════════════════════════════════╝${NC}\n"
printf "  Root: %s\n" "$SDD"

# ─────────────────────────────────────────────────────────────────────────────
section "A — CLI Entry Point (Cap 1)"
# ─────────────────────────────────────────────────────────────────────────────
check_file  "start.sh exists"                            "start.sh"
check_grep  "start.sh has correct shebang"               "start.sh"  "#!/data/data/com.termux"
check_grep  "start.sh changes into orchestrator dir"     "start.sh"  "cd.*orchestrator"
check_grep  "start.sh calls node main.js"                "start.sh"  "node main.js"

# ─────────────────────────────────────────────────────────────────────────────
section "B — Core Orchestrator Files (Cap 2, 9, 13, 36, 37, 62, 63)"
# ─────────────────────────────────────────────────────────────────────────────
check_file  "orchestrator/main.js exists"                "orchestrator/main.js"
check_file  "orchestrator/orchestrator.js exists"        "orchestrator/orchestrator.js"
check_file  "orchestrator/chains.js exists"              "orchestrator/chains.js"
check_file  "orchestrator/post-chain.js exists"          "orchestrator/post-chain.js"
check_file  "orchestrator/pipeline.js exists"            "orchestrator/pipeline.js"
check_file  "orchestrator/validator.js exists"           "orchestrator/validator.js"
check_file  "orchestrator/sub-agent-manager.js exists"   "orchestrator/sub-agent-manager.js"
check_file  "orchestrator/blackboard.js exists"          "orchestrator/blackboard.js"

# ─────────────────────────────────────────────────────────────────────────────
section "C — Engine Adapter (Cap 5, 10, 50, 51, 64, Phase 61)"
# ─────────────────────────────────────────────────────────────────────────────
check_file  "engine/adapter.json exists"                 "engine/adapter.json"
check_json  "engine/adapter.json is valid JSON"          "engine/adapter.json"
check_grep  "adapter.json has active key"                "engine/adapter.json"  '"active"'
check_grep  "adapter.json has agent_models section"      "engine/adapter.json"  '"agent_models"'
check_grep  "adapter.json has architect model entry"     "engine/adapter.json"  '"architect"'
check_grep  "adapter.json has local_first field"         "engine/adapter.json"  '"local_first"'
check_grep  "adapter.json has mistral_codestral block"   "engine/adapter.json"  '"mistral_codestral"'
check_grep  "adapter.json has groq_sam block"            "engine/adapter.json"  '"groq_sam"'
check_grep  "adapter.json has sam_provider key"          "engine/adapter.json"  '"sam_provider"'
check_grep  "adapter.json has reasoning_provider key"    "engine/adapter.json"  '"reasoning_provider"'
check_grep  "adapter.json has groq_deepseek block"       "engine/adapter.json"  '"groq_deepseek"'
check_grep  "adapter.json has cerebras_reasoning block"  "engine/adapter.json"  '"cerebras_reasoning"'

# ─────────────────────────────────────────────────────────────────────────────
section "D — System Config (Cap 6, 57, 53, Phase 60)"
# ─────────────────────────────────────────────────────────────────────────────
check_file  "config/system.json exists"                  "config/system.json"
check_json  "config/system.json is valid JSON"           "config/system.json"
check_grep  "system.json has capability_check_enabled"   "config/system.json"  '"capability_check_enabled"'
check_grep  "system.json has negotiation_enabled"        "config/system.json"  '"negotiation_enabled"'
check_grep  "system.json has scoring_enabled"            "config/system.json"  '"scoring_enabled"'
check_grep  "system.json has universal_thinking_enabled" "config/system.json"  '"universal_thinking_enabled"'
check_grep  "system.json has semantic_memory_enabled"    "config/system.json"  '"semantic_memory_enabled"'
check_grep  "system.json has intent_parser_enabled"      "config/system.json"  '"intent_parser_enabled"'
check_grep  "system.json has memory_backend key"         "config/system.json"  '"memory_backend"'

# ─────────────────────────────────────────────────────────────────────────────
section "E — Architectural Docs & Version Sync (Cap 58)"
# ─────────────────────────────────────────────────────────────────────────────
check_file  "SPEC.md exists"                             "SPEC.md"
check_file  "CAPABILITIES.md exists"                     "CAPABILITIES.md"
check_file  "package.json exists"                        "package.json"
check_file  "featurelist.json exists"                    "featurelist.json"
check_file  "README.md exists"                           "README.md"
check_file  "scripts/sync-version.js exists"             "scripts/sync-version.js"

# Version sync: package.json version must match config/system.json version
PKG_VER=$(node -e "try{console.log(require('$SDD/package.json').version)}catch{}" 2>/dev/null)
SYS_VER=$(node -e "try{console.log(require('$SDD/config/system.json').version||'')}catch{}" 2>/dev/null)
if [ -n "$PKG_VER" ] && [ "$PKG_VER" = "$SYS_VER" ]; then
  pass "version sync: package.json ($PKG_VER) matches system.json"
else
  fail "version sync: package.json ($PKG_VER) != system.json ($SYS_VER)"
fi

# ─────────────────────────────────────────────────────────────────────────────
section "F — Memory & Runtime Scripts (Cap 3, 35, 52, 53, 56, 62)"
# ─────────────────────────────────────────────────────────────────────────────
check_dir   "memory/ directory exists"                   "memory"
check_file  "memory/memory.txt exists"                   "memory/memory.txt"
check_file  "memory/embeddings.json exists"              "memory/embeddings.json"
check_file  "memory/blackboard-db.js exists"             "memory/blackboard-db.js"
check_file  "backup.sh exists"                           "backup.sh"
check_file  "history.md exists"                          "history.md"

# ─────────────────────────────────────────────────────────────────────────────
section "G — Meta System (Cap 18–24, 55, 56, 59)"
# ─────────────────────────────────────────────────────────────────────────────
check_dir   "meta/scores/ directory exists"              "meta/scores"
check_file  "meta/scores/scores.jsonl exists"            "meta/scores/scores.jsonl"
check_dir   "meta/proposals/ directory exists"           "meta/proposals"
check_dir   "meta/logs/ directory exists"                "meta/logs"
check_dir   "meta/postmortems/ directory exists"         "meta/postmortems"
check_dir   "meta/baselines/ directory exists"           "meta/baselines"
check_dir   "meta/costs/ directory exists"               "meta/costs"
check_dir   "meta/insights/ directory exists"            "meta/insights"
check_dir   "versions/ directory exists"                 "versions"

# ─────────────────────────────────────────────────────────────────────────────
section "H — Agent Roster — 9 agents × 3 files (Cap 9, Design Rule 3)"
# ─────────────────────────────────────────────────────────────────────────────
for agent in creator strategist architect developer researcher analyst reviewer mentor basic; do
  if [ -f "$SDD/agents/$agent/identity.txt" ] && \
     [ -f "$SDD/agents/$agent/strategy.txt" ] && \
     [ -f "$SDD/agents/$agent/constraints.json" ]; then
    printf "  ${GREEN}✅${NC} agents/%s — identity + strategy + constraints\n" "$agent"
    PASS=$((PASS+1))
  else
    printf "  ${RED}❌${NC} agents/%s — missing one or more required files\n" "$agent"
    FAIL=$((FAIL+1))
    FAIL_LIST+=("agents/$agent — missing required files")
  fi
done

# ─────────────────────────────────────────────────────────────────────────────
section "I — Capability & Skills Registry (Cap 7, 14)"
# ─────────────────────────────────────────────────────────────────────────────
check_file  "capability/knowledge-map.json exists"       "capability/knowledge-map.json"
check_file  "skills/registry.json exists"                "skills/registry.json"
check_json  "skills/registry.json is valid JSON"         "skills/registry.json"
check_file  "skills/router.js exists"                    "skills/router.js"

# ─────────────────────────────────────────────────────────────────────────────
section "J — Skills Tools (Cap 7, 8, 15–25, 29, 52–55, 59, 61)"
# ─────────────────────────────────────────────────────────────────────────────
check_file  "skills/tools/capability-check.js"           "skills/tools/capability-check.js"
check_file  "skills/tools/negotiator.js"                 "skills/tools/negotiator.js"
check_file  "skills/tools/self-research.js"              "skills/tools/self-research.js"
check_file  "skills/tools/scorer.js"                     "skills/tools/scorer.js"
check_file  "skills/tools/self-critique.js"              "skills/tools/self-critique.js"
check_file  "skills/tools/drift-control.js"              "skills/tools/drift-control.js"
check_file  "skills/tools/cost-tracker.js"               "skills/tools/cost-tracker.js"
check_file  "skills/tools/image-gen.js"                  "skills/tools/image-gen.js"
check_file  "skills/tools/postmortem.js"                 "skills/tools/postmortem.js"
check_file  "skills/tools/memory-summarizer.js"          "skills/tools/memory-summarizer.js"
check_file  "skills/tools/learn-command.js"              "skills/tools/learn-command.js"
check_file  "skills/tools/learner.js"                    "skills/tools/learner.js"
check_file  "skills/tools/applier.js"                    "skills/tools/applier.js"
check_file  "skills/tools/engine-check.js"               "skills/tools/engine-check.js"
check_file  "skills/tools/session-end.js"                "skills/tools/session-end.js"
check_file  "skills/tools/audit.js"                      "skills/tools/audit.js"
check_file  "skills/tools/semantic-memory.js"            "skills/tools/semantic-memory.js"
check_file  "skills/tools/insight-generator.js"          "skills/tools/insight-generator.js"
check_file  "skills/tools/intent-parser.js"              "skills/tools/intent-parser.js"
check_file  "skills/tools/snapshot.js"                   "skills/tools/snapshot.js"

# ─────────────────────────────────────────────────────────────────────────────
section "K — Skills Library (Cap 36–44, 57)"
# ─────────────────────────────────────────────────────────────────────────────
check_file  "skills/library/universal-thinking.md"       "skills/library/universal-thinking.md"
check_file  "skills/library/spec-clarifier.md"           "skills/library/spec-clarifier.md"
check_file  "skills/library/guardian-angel.md"           "skills/library/guardian-angel.md"
check_file  "skills/library/assumption-extractor.md"     "skills/library/assumption-extractor.md"
check_file  "skills/library/failure-mode-scanner.md"     "skills/library/failure-mode-scanner.md"

# ─────────────────────────────────────────────────────────────────────────────
section "L — Hooks (Cap 39)"
# ─────────────────────────────────────────────────────────────────────────────
check_file  "hooks/pre-commit exists"                    "hooks/pre-commit"
check_file  "hooks/check.js exists"                      "hooks/check.js"
check_file  "hooks/rules.js exists"                      "hooks/rules.js"

# ─────────────────────────────────────────────────────────────────────────────
section "M — Learning & Pipeline System (Cap 13, 29, 30)"
# ─────────────────────────────────────────────────────────────────────────────
check_dir   "learning/ directory exists"                 "learning"
check_dir   "learning/roadmaps/ directory exists"        "learning/roadmaps"
check_dir   "projects/ directory exists"                 "projects"
check_dir   "phases/ directory exists"                   "phases"

# ─────────────────────────────────────────────────────────────────────────────
section "N — Code Pattern Checks (Phase 56, 60, 61, 62, 63, 66)"
# ─────────────────────────────────────────────────────────────────────────────

# Phase 56 / Cap 60 — Auto Mode Override fires in main.js
check_grep  "main.js has auto mode strict block"         \
            "orchestrator/main.js"  "Auto mode"

# Phase 56 / Cap 61 — Pipeline Detection exported from intent-parser.js
check_grep  "intent-parser.js exports detectPipelineIntent" \
            "skills/tools/intent-parser.js"  "detectPipelineIntent"

# Phase 57B / Cap 62 — Blackboard DB has think_chains table definition
check_grep  "blackboard-db.js defines think_chains table" \
            "memory/blackboard-db.js"  "think_chains"

# Phase 58 / Cap 63 — SAM exports runSubAgentManager
check_grep  "sub-agent-manager.js exports runSubAgentManager" \
            "orchestrator/sub-agent-manager.js"  "runSubAgentManager"

# Phase 58B / Cap 64 — SAM swaps adapter.active to sam_provider
check_grep  "sub-agent-manager.js swaps adapter to sam_provider" \
            "orchestrator/sub-agent-manager.js"  "sam_provider"

# Phase 57 — Hybrid Memory: memory_backend key read in orchestrator
check_grep  "orchestrator.js reads memory_backend config" \
            "orchestrator/orchestrator.js"  "memory_backend"

# Phase 61 — reasoning_provider read in runEngine
check_grep  "orchestrator.js reads reasoning_provider"   \
            "orchestrator/orchestrator.js"  "reasoning_provider"

# Phase 66 — Reasoning chain memory: retrieveReasoningChain in semantic-memory.js
check_grep  "semantic-memory.js exports retrieveReasoningChain" \
            "skills/tools/semantic-memory.js"  "retrieveReasoningChain"

# Phase 66 — think_chains schema has score + timestamp columns
check_grep  "blackboard-db.js think_chains has score column" \
            "memory/blackboard-db.js"  "score"

# ─────────────────────────────────────────────────────────────────────────────
# FINAL REPORT
# ─────────────────────────────────────────────────────────────────────────────
TOTAL=$((PASS+FAIL))
printf "\n${BOLD}╔══════════════════════════════════════════╗${NC}\n"
printf "${BOLD}║  VERIFICATION COMPLETE                   ║${NC}\n"
printf "${BOLD}╠══════════════════════════════════════════╣${NC}\n"
printf "${BOLD}║${NC}  Total checks : %-25s${BOLD}║${NC}\n" "$TOTAL"
printf "${BOLD}║${NC}  ${GREEN}Passed${NC}        : %-25s${BOLD}║${NC}\n" "$PASS"

if [ "$FAIL" -eq 0 ]; then
  printf "${BOLD}║${NC}  ${GREEN}Failed${NC}        : %-25s${BOLD}║${NC}\n" "$FAIL"
  printf "${BOLD}╠══════════════════════════════════════════╣${NC}\n"
  printf "${BOLD}║${NC}  ${GREEN}${BOLD}%s/%s checks pass ✅ — system verified${NC}  ${BOLD}║${NC}\n" "$PASS" "$TOTAL"
else
  printf "${BOLD}║${NC}  ${RED}Failed${NC}        : %-25s${BOLD}║${NC}\n" "$FAIL"
  printf "${BOLD}╠══════════════════════════════════════════╣${NC}\n"
  printf "${BOLD}║${NC}  ${RED}${BOLD}%s/%s checks pass — %s issue(s) found${NC}  ${BOLD}║${NC}\n" "$PASS" "$TOTAL" "$FAIL"
fi

printf "${BOLD}╚══════════════════════════════════════════╝${NC}\n"

if [ "${#FAIL_LIST[@]}" -gt 0 ]; then
  printf "\n${RED}${BOLD}Failed checks:${NC}\n"
  for item in "${FAIL_LIST[@]}"; do
    printf "  ${RED}•${NC} %s\n" "$item"
  done
  printf "\n"
fi

[ "$FAIL" -eq 0 ] && exit 0 || exit 1

