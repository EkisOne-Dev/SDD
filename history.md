# SDD DECISION & DISCOVERY LOG
> Human-curated record of significant decisions, discoveries, and session summaries.
> Updated via `sdd session-end` or manually after any significant architectural decision.
> This is NOT AI memory (memory.txt). This is the engineering diary.
> Format: append only. Never delete entries.

---

## FORMAT
### [DATE] — [SESSION TITLE]
**Decision/Discovery:** What was decided or found
**Reason:** Why
**Impact:** What it affects
**Commit:** git hash

---

## LOG

### 2026-04-27 — Phases 0–18 Complete
**Decision:** Built SDD from scratch — 9 agents, multi-provider cascade, pipeline, mentorship, scoring, drift control, memory, image gen, CLI navigation
**Reason:** Initial build following SPEC.md roadmap
**Impact:** Full system operational
**Commit:** bb553c7

### 2026-04-29 — 6-Provider Cascade + Provider Fixes
**Decision:** Gemini → Gemma 4 31B → gpt-oss-120b → Groq → Cerebras → Ollama cascade. Ollama model override bug fixed. Gemma confirmed as best OpenRouter fallback.
**Reason:** Gemini 20 req/day limit insufficient. Single fallback unreliable.
**Impact:** Effectively unlimited daily usage across 6 independent rate limit pools
**Commit:** e883b1c

### 2026-04-30 — Code Quality Standards Established
**Decision:** 10 permanent engineering principles adopted. Phases 19-26 were a systematic code quality audit fixing SRP violations, dead code, variable shadowing, object logging, memory injection, and chain misrouting.
**Reason:** Codebase had accumulated technical debt from rapid feature development
**Impact:** Pre-commit hook now enforces standards on all new JS. Phases 21-26 complete.
**Commit:** 986c2b5

### 2026-05-01 — Backup System + Terminal UX
**Decision:** backup.sh created with git push + SD card backup + RESTORE.md. Terminal color UI added via colors.js. Visual spinner added for AI calls.
**Reason:** System recovery and UX polish
**Impact:** Full system recoverable after Termux uninstall. Output is color-coded and animated.
**Commit:** 6c349b3

### 2026-05-02 — Phases 31-34: Workflow Architecture Upgraded
**Decision:** 3-tier complexity (simple/moderate/complex), structured agent handoff via extractHandoff(), 6 chain-specific phase contracts, task-aware reviewer with skill router best-match.
**Reason:** Multi-agent workflow had critical gaps — agents received raw blobs, not structured handoffs. Routing was fragile.
**Impact:** Biggest workflow quality improvement since initial build.
**Commit:** See v3.7.2 changelog

### 2026-05-24 — Harness Engineering Adopted + New Models
**Decision:** Harness engineering methodology adopted. constitution.md, featurelist.json, history.md, skills/library/ planned as Phases 41-51. Local models (phi4-mini, qwen2.5-coder, deepseek-coder, qwen2.5, gemma3, qwen3.5) to become primary via task-aware router. Online = quality fallback.
**Reason:** Move from ad-hoc to structured engineering. Small local models need constraints to be reliable. Unlimited local inference removes API rate limits.
**Impact:** Phases 41-51 planned. Local-first architecture target.
**Commit:** d6d194f

### 2026-05-24 — Qwen3 Deliberation Issue Documented
**Decision:** Qwen3 models require /no_think system prompt prefix for SDD use
**Reason:** Qwen3:4b entered 30-minute deliberation loop on a typo due to reasoning-first architecture
**Impact:** All Qwen3 skill files must include /no_think prefix. Documented in constitution.md rule 6.
**Commit:** d6d194f

### 2026-05-24 — Tiered Reasoning Pipeline (Future Review)
**Concept:** Use small fast local models for preliminary preprocessing, then pass structured output to a higher-capability model for architectural decisions and final reasoning.
**How it works:** Small model (phi4-mini or qwen3.5:0.8b) receives raw task, extracts key facts, structures the problem into clean JSON. Large model (Gemini, Groq 70B, or Cerebras 235B) receives only the clean structured input — not verbose raw context. Large model makes the decision or architectural suggestion.
**Why this matters:** Large models produce better output when given structured precise input vs raw verbose text. Token cost to large model is reduced significantly. Small model preprocessing is fast and free (local). The pattern separates "information extraction" (small model strength) from "reasoning over structured information" (large model strength).
**SDD application:** Architect and strategist chains could run phi4-mini first to extract constraints, dependencies, and requirements into structured JSON, then pass that to Gemini or Groq 70B for the actual architectural recommendation. The guardian-angel skill could use this pattern for constitution auditing.
**Status:** Concept documented — to be designed as part of Phase 44 (intent parser) or a dedicated Phase 52.
**Commit:** e424379


### 2026-05-29 — Implemented Phase 47c routing and context compression
**Decision:** Implemented `num_ctx` parameter for context window management and `compressPrompt` function for optimizing prompt length, along with online-first routing logic for agent selection. The `47c-prime` scoped models were also integrated.
**Reason:** To improve efficiency, reduce latency, and enhance the model's ability to handle longer conversations by dynamically adjusting context and prompt sizes.
**Impact:** The system can now dynamically manage context window sizes for different models and compress prompts to fit within those windows, leading to more efficient and potentially faster responses. Online-first routing ensures the most appropriate agent is selected quickly.
**Commit:** dac6194

### 2026-05-29 — Implemented SDD session termination command
**Decision:** Implemented the `sdd session-end` command, allowing for graceful termination of active orchestration sessions. This command triggers a clean shutdown sequence, including saving runtime state and releasing resources.
**Reason:** To provide a robust mechanism for managing the lifecycle of long-running AI orchestration sessions.
**Impact:** Users can now cleanly end SDD sessions, preventing resource leaks and ensuring state is preserved for potential future resumption. This enhances system stability and manageability.
**Commit:** b466f6f

### 2026-05-31 — Universal Thinking Protocol Live, Coherence Audit Resolved
**Decision:** Implemented Universal Thinking Protocol, resolving all identified coherence audit issues (registry C-001-C-004, hook installation, version corrections, model-gemma3.md creation, path normalization). This completes planned phases 49-51 and 47c-prime.
**Reason:** To achieve a fully functional and robust AI orchestration system by addressing all outstanding technical debt and implementing core protocols.
**Impact:** The system can now reliably execute complex AI workflows with improved coherence and error handling. Specifically, the validator agent correctly receives synthesized design artifacts instead of reviewer audits, and all skill library paths and model configurations are properly managed.
**Commit:** 46e6047

### 2026-05-31 — Validator receives synthesized design, not reviewer audit
**Decision:** Implemented `preReviewerOutput` tracker and structured `[DESIGN TO VALIDATE]` handoff within `orchestrator/chains.js` to ensure the validator agent receives only the synthesized design artifact.
**Reason:** The validator was incorrectly receiving the reviewer's audit commentary instead of the clean design, causing task misalignment.
**Impact:** The validator agent can now correctly process synthesized design artifacts, enabling accurate evaluation and progression of complex AI orchestration chains.
**Commit:** a98b276