#!/data/data/com.termux/files/usr/bin/bash

# ── Calibration checks ───────────────────────────────────
SDD="$HOME/sdd"
ERRORS=0

# Node.js
node --version > /dev/null 2>&1 || { echo "❌ Node.js not found — install with: pkg install nodejs"; ERRORS=$((ERRORS+1)); }

# Git repo
git -C "$SDD" status > /dev/null 2>&1 || { echo "❌ Git repo not healthy — run: git -C ~/sdd status"; ERRORS=$((ERRORS+1)); }

# Required harness files
for f in constitution.md SPEC.md CAPABILITIES.md engine/adapter.json config/system.json; do
  [ -f "$SDD/$f" ] || { echo "❌ Missing required file: $f"; ERRORS=$((ERRORS+1)); }
done

# Required orchestrator files
for f in orchestrator/main.js orchestrator/orchestrator.js orchestrator/chains.js; do
  [ -f "$SDD/$f" ] || { echo "❌ Missing orchestrator file: $f"; ERRORS=$((ERRORS+1)); }
done

# Ollama (optional — warn only)
curl -s http://localhost:11434 > /dev/null 2>&1 || echo "⚠️  Ollama not running — local models unavailable. Start with: ollama serve &"

# Abort if errors found
if [ $ERRORS -gt 0 ]; then
  echo ""
  echo "❌ $ERRORS calibration check(s) failed. Fix before running SDD."
  exit 1
fi

# ── Launch ───────────────────────────────────────────────
cd "$SDD/orchestrator"
node main.js "$@"
