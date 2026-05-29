# Context Compaction
**ID:** context-compaction
**Classification:** Memory Manager
**Phase:** 48

## Objective
Generate a structured session summary that preserves critical information for the next session.

## Trigger Conditions
- User runs: sdd session-end
- memory.txt approaches 40KB threshold

## Summary Structure
### [DATE] — [SESSION TITLE]
**Completed:** [phases or tasks done]
**Decisions:** [architectural decisions made]
**Discoveries:** [bugs found, patterns identified]
**Open items:** [unfinished work]
**Next action:** [exactly what to do first next session]
**Commit:** [git hash]

## Constraints
- YOU MUST make the next action specific enough to execute without re-reading the session
- NEVER lose a commit hash or filename in summarization
- NEVER produce a summary that omits open items or the next action field