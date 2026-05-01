#!/data/data/com.termux/files/usr/bin/bash

set -e

SDD_DIR="$HOME/sdd"
BACKUP_DIR="/sdcard/sdd-backup"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo ""
echo "🔒 SDD Backup — $TIMESTAMP"
echo "─────────────────────────────────────"

# ── Step 1: Stage runtime files ───────────────────────────
echo "📁 Staging runtime files..."
cd "$SDD_DIR"
git add \
  config/system.json \
  memory/memory.txt \
  memory/memory.backup.txt \
  meta/costs/costs.jsonl \
  meta/scores/scores.jsonl \
  meta/baselines/baseline.json \
  engine/adapter.json \
  2>/dev/null || true

# Only commit if there are staged changes
if git diff --cached --quiet; then
  echo "   No changes to commit — already up to date"
else
  git commit -m "backup: runtime snapshot — $TIMESTAMP"
  echo "   ✅ Committed"
fi

# ── Step 2: Push to GitHub ────────────────────────────────
echo "☁️  Pushing to GitHub..."
git push origin master
echo "   ✅ Pushed to https://github.com/EkisOne-Dev/SDD.git"

# ── Step 3: Back up .bashrc to SD card ───────────────────
echo "📋 Backing up .bashrc to SD card..."
mkdir -p "$BACKUP_DIR"
cp "$HOME/.bashrc" "$BACKUP_DIR/.bashrc.backup"
echo "   ✅ Saved to $BACKUP_DIR/.bashrc.backup"

# ── Step 4: Copy backup script itself to SD card ─────────
cp "$SDD_DIR/backup.sh" "$BACKUP_DIR/backup.sh"
echo "   ✅ Script saved to $BACKUP_DIR/backup.sh"

# ── Step 5: Write restore instructions ───────────────────
cat > "$BACKUP_DIR/RESTORE.md" << 'EOF'
# SDD Restore Instructions

## If Termux was uninstalled / fresh install:

1. Install Termux from F-Droid
2. Install dependencies:
   pkg install git nodejs
3. Clone repo:
   git clone https://github.com/EkisOne-Dev/SDD.git ~/sdd
4. Restore .bashrc:
   cp /sdcard/sdd-backup/.bashrc.backup ~/.bashrc
   source ~/.bashrc
5. Install node dependencies:
   cd ~/sdd && npm install
6. Verify:
   sdd status

## Your API keys are stored in .bashrc.backup on this SD card.
## Keep this folder private.
EOF
echo "   ✅ RESTORE.md written to SD card"

echo "─────────────────────────────────────"
echo "✅ Backup complete — $(date '+%H:%M:%S')"
echo ""
