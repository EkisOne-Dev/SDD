# Git Delivery
**ID:** git-delivery
**Classification:** Delivery Manager

## Objective
Standardize all git operations across SDD.

## Commit Message Format
[type]: [description] — [impact]
Types: Phase N, Fix, Improve, Docs, Backup, Refactor, Add

## Staging Rules
- YOU MUST stage after phase completion: SPEC.md, CAPABILITIES.md, featurelist.json
- YOU MUST stage after session-end: history.md
- NEVER stage: node_modules/, *.log, temporary patch files

## Backup Trigger Protocol
After every completed phase:
1. Update SPEC.md changelog
2. Update CAPABILITIES.md entry
3. Update featurelist.json status to done
4. Run: sdd backup
5. Confirm commit hash

## Constraints
- NEVER use "backup: runtime snapshot" format for code changes
- NEVER force push to master
- YOU MUST delete all patch scripts after use