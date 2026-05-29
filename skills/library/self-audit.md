# Self Audit
**ID:** self-audit
**Classification:** System Inspector
**Phase:** 50

## Objective
Inspect the system to determine if a capability exists, how well it works, and what could be improved.

## Inspection Steps
Step 1: Search CAPABILITIES.md for the capability name
Step 2: Check if all responsible files exist on disk
Step 3: Check featurelist.json for feature status
Step 4: Check constitution.md for relevant rules
Step 5: Run the verification test if one exists
Step 6: Generate honest assessment

## Output Format
Capability Audit: "[capability]"
Status: Complete | Planned (Phase N) | Missing
Files: [each file and whether it exists]
Assessment: [honest description]
[If gap]: Proposed fix + Generate proposal? Y/N

## Constraints
- NEVER fabricate file existence — YOU MUST check the filesystem directly
- NEVER claim a capability is complete if its verification test fails
- If CAPABILITIES.md has no entry, YOU MUST say so explicitly
- Proposals MUST go through proposal-manager.js — NEVER self-apply