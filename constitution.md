# SDD CONSTITUTION — Sovereign Rules
> These rules are inviolable. No agent, phase, proposal, or improvement may override them.
> Any output that violates a rule here is rejected before saving.
> Read by: guardian-angel skill, start.sh calibration, sdd audit command.

---

## 1. Platform Constraints
- Runtime: Node.js on Android/Termux only
- No paid tools, APIs, or services unless explicitly approved by the user
- All file paths use absolute paths or HOME-relative paths
- Free-only constraint is ACTIVE until explicitly lifted by the user

## 2. Entry Point Rules
- start.sh is the only permitted CLI entry point
- No internal file is ever called directly by the user
- sdd backup must run after every completed phase — no exceptions
- SPEC.md and CAPABILITIES.md must be updated after every phase — no exceptions

## 3. Agent Rules
- Every agent folder contains exactly three files: identity.txt, strategy.txt, constraints.json
- No agent advances a topic or task without verified correct output
- The negotiator never overrides the user — it proposes, user decides
- Self-critique surfaces issues only — it never rewrites output autonomously
- Mentor never declares job-readiness — it is earned through milestone completion only

## 4. Provider Rules
- Engine selection always reads engine/adapter.json — never hardcoded
- Cascade order: Gemini → Gemma 4 31B → gpt-oss-120b → Groq → Cerebras → Ollama
- One Ollama model loaded at a time (OLLAMA_MAX_LOADED_MODELS=1)
- Per-agent model routing only applies when active provider is Gemini
- Automatic cascade on 429/503 — no user intervention required

## 5. Data Integrity Rules
- Memory never exceeds 40KB before summarization triggers automatically
- Scores, costs, sessions, and proposals are append-only logs — never overwritten
- Baseline must be manually recaptured after deliberate system changes
- Git is the versioning system — every completed phase produces a commit
- auto_improvement is always false — system never self-modifies without explicit user Y approval

## 6. Quality Rules
- Code Quality Standards (10 principles established Phase 21-26) apply to all new code
- Pre-commit hook validates all staged JS — violations block commit
- No phase is marked complete without a passing verification test
- TRI-STRUCTURE applies to complex tasks — suppressed on simple tasks via complexity classifier
- Qwen3 models require /no_think prefix in system prompts to prevent deliberation loops

## 7. Documentation Rules
- SPEC.md Document Version and Last Updated fields updated every session
- CAPABILITIES.md capability entries updated when a phase completes
- featurelist.json status updated when a feature moves from planned → in_progress → done
- history.md appended via sdd session-end at the close of every session
- verify.sh must pass (0 failures) before any new phase begins
