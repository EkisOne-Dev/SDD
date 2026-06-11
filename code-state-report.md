# SDD — Code State Report
**Generated:** 2026-06-11 16:18:09  
**Root:** `/data/data/com.termux/files/home/sdd`  
**Version:** 5.13.0  
**Source files:** 41 · 5,721 lines  
**Docs:** SPEC.md (2,233 ln) · CAPABILITIES.md (1,781 ln)

## Quick Summary

| Metric | Count |
|---|---|
| Undocumented candidates HIGH (3+ vectors) | **0** |
| Undocumented candidates MEDIUM (2 vectors) | 0 |
| Undocumented candidates LOW (1 vector) | 35 |
| Orphaned exports | 27 |
| Spec→code drift (docs ref missing code) | 27 |
| Config keys in code, absent from system.json | 14 |
| Config keys in system.json unused in code | 9 |
| Doc integrity issues | 4 |

---

## 1 — Project Structure

| Directory | Files | Lines |
|---|---|---|
| `hooks/` | 2 | 131 |
| `memory/` | 2 | 412 |
| `orchestrator/` | 12 | 2,442 |
| `skills/` | 25 | 2,736 |

**Largest files:**

| File | Lines | Note |
|---|---|---|
| `orchestrator/orchestrator.js` | 677 | 🔴 SRP risk |
| `orchestrator/main.js` | 325 | ⚠️ candidate |
| `orchestrator/pipeline.js` | 313 | ⚠️ candidate |
| `orchestrator/sub-agent-manager.js` | 273 |  |
| `orchestrator/chains.js` | 271 |  |
| `memory/blackboard-db.js` | 256 |  |
| `orchestrator/menu.js` | 179 |  |
| `skills/tools/semantic-memory.js` | 170 |  |
| `skills/tools/insight-generator.js` | 164 |  |
| `orchestrator/post-chain.js` | 162 |  |
| `skills/tools/negotiator.js` | 159 |  |
| `memory/memory-db.js` | 156 |  |

**Agent roster:** analyst · architect · basic · creator · developer · mentor · researcher · reviewer · strategist · validator

---

## 2 — Import/Export Dependency

**High coupling files (≥5 imports):**

| File | Imports |
|---|---|
| `orchestrator/main.js` | 26 🔴 |
| `orchestrator/post-chain.js` | 9 🔴 |
| `orchestrator/orchestrator.js` | 8 🔴 |
| `orchestrator/pipeline.js` | 8 🔴 |
| `skills/tools/session-end.js` | 8 🔴 |
| `orchestrator/menu.js` | 6 ⚠️ |
| `orchestrator/chains.js` | 5 ⚠️ |
| `orchestrator/sub-agent-manager.js` | 5 ⚠️ |
| `skills/tools/capability-check.js` | 5 ⚠️ |
| `skills/tools/proposal-manager.js` | 5 ⚠️ |

**Total named exports:** 124 · **Orphaned:** 27

---

## 3 — CLI Command Inventory

| Command | Source | Documented |
|---|---|---|
| `sdd next` | `skills/tools/learn-command.js` | ✅ |
| `sdd quit` | `skills/tools/learn-command.js` | ✅ |

---

## 4 — Config Key Audit

**Aligned (code + system.json):** 19

| Key | In Docs |
|---|---|
| `ai_capability_classifier_enabled` | — |
| `capability_check_enabled` | ✅ |
| `cost_tracking_enabled` | ✅ |
| `default_phase` | ✅ |
| `guardian_angel_enabled` | ✅ |
| `intent_parser_enabled` | ✅ |
| `map_reduce_enabled` | — |
| `memory_backend` | ✅ |
| `memory_db_path` | — |
| `memory_file` | ✅ |
| `meta_observation_enabled` | ✅ |
| `negotiation_enabled` | ✅ |
| `scoring_enabled` | ✅ |
| `self_critique_enabled` | ✅ |
| `self_research_enabled` | ✅ |
| `self_research_mode` | ✅ |
| `semantic_memory_enabled` | ✅ |
| `spec_clarifier_enabled` | ✅ |
| `universal_thinking_enabled` | ✅ |

**⚠️ In code, missing from system.json (14):**

| Key | File | In Docs |
|---|---|---|
| `_session_id` | orchestrator/orchestrator.js | ❌ |
| `api_key_env` | orchestrator/orchestrator.js | ✅ |
| `base_url` | orchestrator/orchestrator.js | ✅ |
| `blackboard_db_path` | orchestrator/sub-agent-manager.js | ❌ |
| `evaluation` | orchestrator/main.js | ✅ |
| `json` | orchestrator/orchestrator.js | ✅ |
| `max_tokens` | orchestrator/orchestrator.js | ✅ |
| `model` | orchestrator/orchestrator.js | ✅ |
| `provider` | orchestrator/orchestrator.js | ✅ |
| `stream` | orchestrator/orchestrator.js | ✅ |
| `think` | orchestrator/orchestrator.js | ✅ |
| `thinking_budget` | orchestrator/orchestrator.js | ✅ |
| `timeout_ms` | orchestrator/orchestrator.js | ❌ |
| `validation` | orchestrator/main.js | ✅ |

**⚠️ In system.json, unused in code (9):**

| Key |
|---|
| `version` |
| `log_level` |
| `default_agent` |
| `entry_point` |
| `free_only_mode` |
| `auto_improvement` |
| `ai_skill_routing_enabled` |
| `memory_budget_tokens` |
| `memory_prune_days` |

---

## 5 — Provider & Adapter Inventory

**Active:** `primary`

| Key | Provider | Model | think | API Key | Documented |
|---|---|---|---|---|---|
| `ollama_model_config` | ? | `?` | — | ❌ | ✅ |
| `primary` | gemini | `gemini-2.5-flash-lite` | — | ✅ | ✅ |
| `fallback` | gemini | `gemini-2.5-flash` | — | ✅ | ✅ |
| `fallback2` | groq | `llama-3.3-70b-versatile` | — | ✅ | ✅ |
| `fallback3` | openrouter | `google/gemma-4-31b-it:free` | — | ✅ | ✅ |
| `fallback4` | openrouter | `openai/gpt-oss-120b:free` | — | ✅ | ✅ |
| `fallback5` | cerebras | `gpt-oss-120b` | — | ✅ | ✅ |
| `groq_sam` | groq | `llama-3.3-70b-versatile` | — | ✅ | ✅ |
| `mistral_codestral` | mistral | `codestral-latest` | — | ✅ | ✅ |
| `local_fallback` | ollama | `qwen2.5:7b` | — | ❌ | ✅ |
| `groq_deepseek` | groq | `deepseek-r1-distill-llama-70b` | — | ✅ | ✅ |
| `cerebras_reasoning` | cerebras | `qwen-3-235b-a22b` | ✅ | ✅ | ✅ |

---

## 6 — Database Schema Inventory

**Table:** `pipeline_tasks` — ⚠️ Not in docs (`memory/blackboard-db.js`)
Columns: `id`, `session_id`, `task_slug`, `status`, `agent`, `created_at`

**Table:** `task_solutions` — ⚠️ Not in docs (`memory/blackboard-db.js`)
Columns: `id`, `session_id`, `task_slug`, `agent`, `solution`, `score`, `created_at`

**Table:** `session_context` — ⚠️ Not in docs (`memory/blackboard-db.js`)
Columns: `id`, `session_id`, `context_json`, `updated_at`

**Table:** `interaction_history` — ⚠️ Not in docs (`memory/blackboard-db.js`)
Columns: `id`, `session_id`, `role`, `content`, `agent`, `created_at`

**Table:** `think_chains` — ✅ Documented (`memory/blackboard-db.js`)
Columns: `id`, `session_id`, `task_slug`, `agent`, `model`, `think_raw`, `score`, `created_at`

**Table:** `memory_entries` — ⚠️ Not in docs (`memory/memory-db.js`)
Columns: `id`, `session_id`, `role`, `content`, `tokens`, `embedding`, `created_at`

**Table:** `session_summaries` — ⚠️ Not in docs (`memory/memory-db.js`)
Columns: `id`, `session_id`, `summary`, `created_at`

---

## 7 — Skill File Inventory

| File | Type | Documented |
|---|---|---|
| `skills/library/assumption-extractor.md` | definition | ✅ |
| `skills/library/capability-classifier.md` | definition | ⚠️ |
| `skills/library/context-compaction.md` | definition | ✅ |
| `skills/library/failure-mode-scanner.md` | definition | ✅ |
| `skills/library/git-delivery.md` | definition | ✅ |
| `skills/library/guardian-angel.md` | definition | ✅ |
| `skills/library/intent-parser.md` | definition | ✅ |
| `skills/library/model-deepseek-coder.md` | definition | ⚠️ |
| `skills/library/model-gemma3.md` | definition | ✅ |
| `skills/library/model-phi4-mini.md` | definition | ⚠️ |
| `skills/library/model-qwen2.5-coder.md` | definition | ⚠️ |
| `skills/library/model-qwen2.5.md` | definition | ⚠️ |
| `skills/library/model-qwen3.5.md` | definition | ⚠️ |
| `skills/library/self-audit.md` | definition | ✅ |
| `skills/library/spec-clarifier.md` | definition | ✅ |
| `skills/library/universal-thinking.md` | definition | ✅ |
| `skills/router.js` | tool | ✅ |
| `skills/tools/ai-classifier.js` | tool | ⚠️ |
| `skills/tools/applier.js` | tool | ✅ |
| `skills/tools/audit.js` | tool | ✅ |
| `skills/tools/capability-check.js` | tool | ✅ |
| `skills/tools/cost-tracker.js` | tool | ✅ |
| `skills/tools/drift-control.js` | tool | ✅ |
| `skills/tools/engine-check.js` | tool | ✅ |
| `skills/tools/image-gen.js` | tool | ✅ |
| `skills/tools/insight-generator.js` | tool | ✅ |
| `skills/tools/insights-command.js` | tool | ✅ |
| `skills/tools/intent-parser.js` | tool | ✅ |
| `skills/tools/learn-command.js` | tool | ✅ |
| `skills/tools/learner.js` | tool | ✅ |
| `skills/tools/memory-summarizer.js` | tool | ✅ |
| `skills/tools/negotiator.js` | tool | ✅ |
| `skills/tools/observer.js` | tool | ✅ |
| `skills/tools/postmortem.js` | tool | ✅ |
| `skills/tools/proposal-manager.js` | tool | ✅ |
| `skills/tools/scorer.js` | tool | ✅ |
| `skills/tools/self-critique.js` | tool | ✅ |
| `skills/tools/self-research.js` | tool | ✅ |
| `skills/tools/semantic-memory.js` | tool | ✅ |
| `skills/tools/session-end.js` | tool | ✅ |
| `skills/tools/snapshot.js` | tool | ✅ |

---

## 8 — Undocumented Capability Candidates

Vectors: V1=CLI V2=ConfigKey V3=Provider V4=DBTable V5=Skill V6=OrphanExport V7=EnvVar V8=ChainType
**HIGH** = 3+ vectors · **MEDIUM** = 2 · **LOW** = 1

### LOW — 35 candidates

| Name | Type | Vectors | Detail |
|---|---|---|---|
| `_session_id` | Config Key | V2 | orchestrator/orchestrator.js |
| `ai-classifier` | Skill (tool) | V5 | skills/tools/ai-classifier.js |
| `blackboard_db_path` | Config Key | V2 | orchestrator/sub-agent-manager.js |
| `bodies` | Orphaned Export | V6 | hooks/rules.js |
| `capability-classifier` | Skill (definition) | V5 | skills/library/capability-classifier.md |
| `closeBlackboard` | Orphaned Export | V6 | orchestrator/blackboard.js |
| `createProject` | Orphaned Export | V6 | orchestrator/pipeline.js |
| `getEmbeddingCandidates` | Orphaned Export | V6 | memory/memory-db.js |
| `getInteractionHistory` | Orphaned Export | V6 | orchestrator/blackboard.js |
| `getPipelineTasks` | Orphaned Export | V6 | orchestrator/blackboard.js |
| `getSessionContext` | Orphaned Export | V6 | orchestrator/blackboard.js |
| `interaction_history` | Database Table | V4 | cols: id,session_id,role (memory/blackboard-db.js) |
| `isAmbiguous` | Orphaned Export | V6 | skills/tools/intent-parser.js |
| `memory_entries` | Database Table | V4 | cols: id,session_id,role (memory/memory-db.js) |
| `model-deepseek-coder` | Skill (definition) | V5 | skills/library/model-deepseek-coder.md |
| `model-phi4-mini` | Skill (definition) | V5 | skills/library/model-phi4-mini.md |
| `model-qwen2.5` | Skill (definition) | V5 | skills/library/model-qwen2.5.md |
| `model-qwen2.5-coder` | Skill (definition) | V5 | skills/library/model-qwen2.5-coder.md |
| `model-qwen3.5` | Skill (definition) | V5 | skills/library/model-qwen3.5.md |
| `parseIntent` | Orphaned Export | V6 | skills/tools/intent-parser.js |
| `pipeline_tasks` | Database Table | V4 | cols: id,session_id,task_slug (memory/blackboard-db.js) |
| `pruneOld` | Orphaned Export | V6 | memory/memory-db.js |
| `pruneThinkChains` | Orphaned Export | V6 | orchestrator/blackboard.js |
| `readThinkChains` | Orphaned Export | V6 | orchestrator/blackboard.js |
| `retrieveMemory` | Orphaned Export | V6 | skills/tools/semantic-memory.js |
| `session_context` | Database Table | V4 | cols: id,session_id,context_json (memory/blackboard-db.js) |
| `session_summaries` | Database Table | V4 | cols: id,session_id,summary (memory/memory-db.js) |
| `sessionSummary` | Orphaned Export | V6 | memory/memory-db.js |
| `STAGES` | Orphaned Export | V6 | orchestrator/pipeline.js |
| `stats` | Orphaned Export | V6 | memory/memory-db.js |
| `stripThinkBlock` | Orphaned Export | V6 | orchestrator/orchestrator.js |
| `stripTriStructure` | Orphaned Export | V6 | orchestrator/post-chain.js |
| `task_solutions` | Database Table | V4 | cols: id,session_id,task_slug (memory/blackboard-db.js) |
| `timeout_ms` | Config Key | V2 | orchestrator/orchestrator.js |
| `updateEmbedding` | Orphaned Export | V6 | memory/memory-db.js |

---

## 9 — Orphaned Exports

| Name | Source | In Docs |
|---|---|---|
| `bodies` | `hooks/rules.js` | ❌ |
| `classifyComplexity` | `orchestrator/chains.js` | ✅ |
| `close` | `memory/memory-db.js` | ✅ |
| `closeBlackboard` | `orchestrator/blackboard.js` | ❌ |
| `compressPrompt` | `orchestrator/orchestrator.js` | ✅ |
| `createProject` | `orchestrator/pipeline.js` | ❌ |
| `embedNewEntry` | `skills/tools/semantic-memory.js` | ✅ |
| `generateImagePrompt` | `skills/tools/image-gen.js` | ✅ |
| `generateSnapshot` | `skills/tools/snapshot.js` | ✅ |
| `getEmbeddingCandidates` | `memory/memory-db.js` | ❌ |
| `getInteractionHistory` | `orchestrator/blackboard.js` | ❌ |
| `getPipelineTasks` | `orchestrator/blackboard.js` | ❌ |
| `getSessionContext` | `orchestrator/blackboard.js` | ❌ |
| `isAmbiguous` | `skills/tools/intent-parser.js` | ❌ |
| `parseIntent` | `skills/tools/intent-parser.js` | ❌ |
| `pruneOld` | `memory/memory-db.js` | ❌ |
| `pruneThinkChains` | `orchestrator/blackboard.js` | ❌ |
| `readThinkChains` | `orchestrator/blackboard.js` | ❌ |
| `retrieveMemory` | `skills/tools/semantic-memory.js` | ❌ |
| `retrieveReasoningChain` | `skills/tools/semantic-memory.js` | ✅ |
| `RULES` | `hooks/rules.js` | ✅ |
| `sessionSummary` | `memory/memory-db.js` | ❌ |
| `STAGES` | `orchestrator/pipeline.js` | ❌ |
| `stats` | `memory/memory-db.js` | ❌ |
| `stripThinkBlock` | `orchestrator/orchestrator.js` | ❌ |
| `stripTriStructure` | `orchestrator/post-chain.js` | ❌ |
| `updateEmbedding` | `memory/memory-db.js` | ❌ |

---

## 10 — Spec-to-Code Drift

| Type | Reference | Status |
|---|---|---|
| file | `orchestrator.js` | NOT FOUND ON DISK |
| file | `main.js` | NOT FOUND ON DISK |
| file | `chains.js` | NOT FOUND ON DISK |
| file | `tools/capability-check.js` | NOT FOUND ON DISK |
| file | `tools/negotiator.js` | NOT FOUND ON DISK |
| file | `tools/self-research.js` | NOT FOUND ON DISK |
| file | `tools/image-gen.js` | NOT FOUND ON DISK |
| file | `skills/tools/mentor-router.js` | NOT FOUND ON DISK |
| file | `roadmap.json` | NOT FOUND ON DISK |
| file | `post-chain.js` | NOT FOUND ON DISK |
| file | `validator.js` | NOT FOUND ON DISK |
| file | `router.js` | NOT FOUND ON DISK |
| file | `registry.json` | NOT FOUND ON DISK |
| file | `system.json` | NOT FOUND ON DISK |
| file | `adapter.json` | NOT FOUND ON DISK |
| file | `pipeline.js` | NOT FOUND ON DISK |
| file | `colors.js` | NOT FOUND ON DISK |
| file | `orchestrator/chat.js` | NOT FOUND ON DISK |
| file | `skills/tools/file-reader.js` | NOT FOUND ON DISK |
| file | `skills/tools/verified-researcher.js` | NOT FOUND ON DISK |
| file | `skills/tools/source-fetcher.js` | NOT FOUND ON DISK |
| file | `resource-log.json` | NOT FOUND ON DISK |
| file | `constraints.json` | NOT FOUND ON DISK |
| file | `contract.json` | NOT FOUND ON DISK |
| file | `state.json` | NOT FOUND ON DISK |
| file | `efficiency-1777224694467.json` | NOT FOUND ON DISK |
| file | `RESTORE.md` | NOT FOUND ON DISK |

---

## 11 — verify.sh Coverage

**Checks found in verify.sh:** 10
**Count in CAPABILITIES.md:** 109 ⚠️ MISMATCH — actual: 10

| # | Line | Description |
|---|---|---|
| 1 | 19 | [ -f "$HOME/sdd/$f" ] && pass "$f" || fail "$f MISSING" |
| 2 | 26 | if [ -f "$dir/identity.txt" ] && [ -f "$dir/strategy.txt" ]  |
| 3 | 37 | if [ -f "$dir/contract.json" ] && [ -f "$dir/prompt.txt" ];  |
| 4 | 80 | [ -f "$HOME/sdd/$f" ] && pass "$f" || warn "$f — not yet bui |
| 5 | 82 | [ -d "$HOME/sdd/skills/library" ] && pass "skills/library/"  |
| 6 | 83 | [ -f "$HOME/sdd/memory/embeddings.json" ] && pass "memory/em |
| 7 | 84 | [ -f "$HOME/sdd/skills/library/universal-thinking.md" ] && p |
| 8 | 104 | [ -f "$HOME/sdd/$f" ] && pass "$f" || fail "$f MISSING" |
| 9 | 106 | [ -f "$HOME/sdd/scripts/verify.sh" ] && pass "scripts/verify |
| 10 | 107 | [ -f "$HOME/sdd/scripts/sync-version.js" ] && pass "scripts/ |

---

## 12 — Documentation Integrity

| Doc | Type | Detail |
|---|---|---|
| SPEC.md | `DUPLICATE_SECTION` | "## REASONING INTELLIGENCE ROADMAP (Established v5.9.1)" appears 2 times — delete all but one. |
| SPEC.md | `MISPLACED_END_MARKER` | End of SPEC.md marker appears with content after it — move to EOF. |
| CAPABILITIES.md | `PLANNED_IN_ACTIVE` | 3 Active capabilities with "(planned)" labels: 55 — Cross-Session Pattern Synthesis, 56 — Versioned System Snapshots, 59 — Insights Command |
| CAPABILITIES.md | `HARDCODED_VERIFY_COUNT` | Found: "109/109 checks pass" — verify matches actual check count. |

---

## Notes

Static analysis only — no code is executed. Results are approximations; verify before acting.
*Run again after refactoring to verify post-refactor state.*