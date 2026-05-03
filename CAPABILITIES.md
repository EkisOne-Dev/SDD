# SDD CAPABILITIES REGISTRY
> Authoritative reference for all system features and abilities.
> Maintained alongside SPEC.md. Updated after every phase that adds, modifies, or removes a capability.
> Intended audience: technical reviewers, external auditors, and the system owner.

**System:** Structured Development System (SDD)
**Version:** 3.7.0
**Platform:** Android / Termux
**Runtime:** Node.js
**Last Updated:** 2026-04-30 (rev 2)

---

## HOW TO USE THIS FILE

Each capability entry defines:
- **What it does** — precise behavior in plain language
- **Trigger** — exactly how it is activated
- **Files responsible** — implementation location
- **Config flag** — what enables or disables it (if applicable)
- **Verification test** — exact command to confirm it is working and expected output
- **Known limitations** — honest statement of current constraints

To verify the full system: run each verification test in order and compare output to expected result.

---

## CAPABILITY INDEX

| # | Capability | Status | Phase |
|---|---|---|---|
| 1 | CLI Entry Point | ✅ Active | 0 |
| 2 | Single-Shot Task Execution | ✅ Active | 0 |
| 3 | Persistent Memory | ✅ Active | 0 |
| 4 | Execution Logging | ✅ Active | 0 |
| 5 | Multi-Provider Engine Adapter | ✅ Active | 0 |
| 6 | Config-Driven Behavior | ✅ Active | 0 |
| 7 | Capability Validation System | ✅ Active | 1 |
| 8 | Interactive Negotiation Layer | ✅ Active | 1 |
| 9 | Multi-Agent Chain Execution | ✅ Active | 5 |
| 10 | Per-Agent Model Routing | ✅ Active | 5 |
| 11 | Task Complexity Classifier | ✅ Active | 5 |
| 12 | Context Compression | ✅ Active | 5 |
| 13 | Pipeline Project System | ✅ Active | 3 |
| 14 | Skills Router | ✅ Active | 4 |
| 15 | Self-Research Skill | ✅ Active | 4 |
| 16 | Self-Critique Layer | ✅ Active | 5 |
| 17 | TRI-STRUCTURE Output Mandate | ✅ Active | 5 |
| 18 | Scoring System | ✅ Active | 6 |
| 19 | Meta Observer | ✅ Active | 7 |
| 20 | Proposal Manager | ✅ Active | 7 |
| 21 | Auto-Applier | ✅ Active | 7 |
| 22 | Postmortem System | ✅ Active | 8 |
| 23 | Drift Control | ✅ Active | 9 |
| 24 | Cost Tracker | ✅ Active | 10 |
| 25 | Image Generation | ✅ Active | 11 |
| 26 | Creator Agent | ✅ Active | 11 |
| 27 | Strategist Agent | ✅ Active | 11 |
| 28 | CLI Navigation Layer | ✅ Active | 12 |
| 29 | Mentorship System | ✅ Active | 12 |
| 30 | Learn Session Loop | ✅ Active | 13 |
| 31 | Pipeline Visibility Commands | ✅ Active | 14 |
| 32 | Engine Health Check | ✅ Active | 15 |
| 33 | TRI-STRUCTURE Suppression | ✅ Active | 16 |
| 34 | Score Drift ASCII Chart | ✅ Active | 17 |
| 35 | Memory Summarization | ✅ Active | 18 |

---

## CAPABILITY DETAILS

---

### 1 — CLI Entry Point

**What it does:**
All user interaction with SDD occurs through a single shell alias `sdd`. The alias calls `start.sh`, which changes into the orchestrator directory and runs `node main.js` with all arguments forwarded. No internal file is ever called directly by the user.

**Trigger:** Any `sdd` command from the terminal.

**Files responsible:**
- `start.sh` — sole permitted entry point
- `~/.bashrc` — alias definition

**Config flag:** None. Always active.

**Verification test:**
```bash
cat ~/sdd/start.sh
```
Expected output:
```
#!/data/data/com.termux/files/usr/bin/bash
cd ~/sdd/orchestrator
node main.js "$@"
```

**Known limitations:** None.

---

### 2 — Single-Shot Task Execution

**What it does:**
When the user runs `sdd "task"`, the system executes a full pipeline: capability check → negotiation → skill routing → self-research → agent chain selection → prompt construction → AI engine call → result display → memory save → scoring → drift check → meta observation → cost tracking.

**Trigger:** `sdd "any task string"`

**Files responsible:**
- `orchestrator/main.js` — execution controller
- `orchestrator/orchestrator.js` — all system functions (loadConfig, loadAgent, runEngine, buildPrompt, saveMemory, logExecution)

**Config flag:** Always active. Individual sub-steps are config-controlled (see their respective entries).

**Verification test:**
```bash
sdd "what is a REST API"
```
Expected: A structured explanation printed to terminal, followed by score panel, cost panel, and memory saved.

**Known limitations:**
- Rate limits on free API tiers can interrupt execution mid-run.
- Error messages for API safety filter rejections are generic.

---

### 3 — Persistent Memory

**What it does:**
After every single-shot task, the user's task and the system's full response are appended to `memory/memory.txt`. This file is injected into every subsequent prompt, giving the AI engine context from prior sessions. Memory is flat-file, append-only.

**Trigger:** Automatic after every successful single-shot task.

**Files responsible:**
- `orchestrator/orchestrator.js` → `saveMemory()`, `loadMemory()`
- `memory/memory.txt` — active memory store

**Config flag:** None. Always active. Controlled only by `memory_file` path in `config/system.json`.

**Verification test:**
```bash
tail -20 ~/sdd/memory/memory.txt
```
Expected: The most recent task and response appended as `User: ... / Assistant: ...` entries.

**Known limitations:**
- Keyword-based retrieval active — last 5 exchanges verbatim + top 3 relevant older exchanges by word overlap, capped at 2000 chars. Web mode: Wikipedia REST API fetched and injected as additional context block when self_research_mode="web".
- A 50KB warning fires in `saveMemory()` but no automatic compression occurs yet. Manual intervention required when file grows large.
- Memory is injected in full — no filtering or relevance ranking.

---

### 4 — Execution Logging

**What it does:**
Every significant system event is written to a daily log file in `logs/YYYY-MM-DD.log`. Events include: TASK RECEIVED, CAPABILITY CHECK result, NEGOTIATION result, SKILL MATCHED, TASK COMPLETED, SCORE, COST, and any ERROR. Each entry is timestamped.

**Trigger:** Automatic throughout every execution via `logExecution()`.

**Files responsible:**
- `orchestrator/orchestrator.js` → `logExecution()`
- `logs/YYYY-MM-DD.log` — daily rotating log

**Config flag:** `log_level` in `config/system.json`. Currently `"info"`.

**Verification test:**
```bash
cat ~/sdd/logs/$(date +%Y-%m-%d).log | tail -20
```
Expected: Timestamped entries for the most recent task run.

**Known limitations:**
- Log date reflects device timezone, not UTC. Expected behavior on Android/Termux.
- No log rotation or archival beyond the daily file.

---

### 5 — Multi-Provider Engine Adapter

**What it does:**
All AI engine calls are routed through a single adapter layer. The active provider is set by `"active"` in `engine/adapter.json`. Three providers are configured: Gemini (primary), OpenRouter (fallback), and Ollama (local fallback). Switching provider requires only a config change — no code modification.

**Trigger:** Every `runEngine()` call reads `engine/adapter.json` to determine provider.

**Files responsible:**
- `engine/adapter.json` — provider config and model definitions
- `orchestrator/orchestrator.js` → `loadEngineAdapter()`, `runEngine()`

**Config flag:** `"active"` field in `engine/adapter.json`. Values: `"primary"` | `"fallback"` | `"local_fallback"`.

**Verification test:**
```bash
cat ~/sdd/engine/adapter.json | grep '"active"'
```
Expected: `"active": "primary"` (or whichever provider is currently selected).

**Current provider configuration:**
| Priority | Role | Provider | Model | Notes |
|---|---|---|---|---|
| 1 | Primary | Gemini | gemini-2.5-flash-lite | 20 req/day |
| 2 | Fallback 1 | OpenRouter | google/gemma-4-31b-it:free | 256K context |
| 3 | Fallback 2 | OpenRouter | openai/gpt-oss-120b:free | 120B model |
| 4 | Fallback 3 | Groq | llama-3.3-70b-versatile | ~315 TPS |
| 5 | Fallback 4 | Cerebras | qwen-3-235b-a22b-instruct-2507 | 1M tokens/day |
| 6 | Local | Ollama | tinyllama | Offline, unlimited |

**Cascade behavior:** Automatic — on 429 or 503, system tries next provider in order. Model name displayed on switch.

**Known limitations:**
- Free tier Gemini has a 20 requests/day hard limit on gemini-2.5-flash-lite.
- OpenRouter free models change without notice — a model may disappear between sessions.
- Automatic cascade active — on 429/503 system tries next provider automatically. Manual switch via `adapter.json` still supported.
- Ollama installed via `pkg install ollama`. Run `ollama serve` before switching to local_fallback. tinyllama model pulled and ready.

---

### 6 — Config-Driven Behavior

**What it does:**
All system feature flags, file paths, and behavioral defaults are stored in `config/system.json`. No behavior is hardcoded in execution logic. Enabling or disabling any feature requires only a JSON edit.

**Trigger:** `loadConfig()` is called at the start of every execution.

**Files responsible:**
- `config/system.json` — all flags
- `orchestrator/orchestrator.js` → `loadConfig()`

**Config flag:** N/A — this is the config system itself.

**Current active flags:**
| Flag | Value | Effect |
|---|---|---|
| `capability_check_enabled` | `true` | Domain validation before every task |
| `negotiation_enabled` | `true` | Task improvement proposals before execution |
| `self_research_enabled` | `true` | Local memory scan for relevant context |
| `self_research_mode` | `"local"` | No AI synthesis — file scan only |
| `self_critique_enabled` | `false` | Post-chain quality pass (off by default) |
| `scoring_enabled` | `true` | Rule-based output quality scoring |
| `meta_observation_enabled` | `true` | Pattern detection and proposal staging |
| `cost_tracking_enabled` | `true` | Per-run API call and token logging |
| `auto_improvement` | `false` | System never self-modifies without user approval |
| `free_only_mode` | `true` | Constrains all tool choices to free tier |

**Verification test:**
```bash
cat ~/sdd/config/system.json
```

**Known limitations:** None.

---

### 7 — Capability Validation System

**What it does:**
Before executing any task, the system classifies the task into one or more domains and checks each against a confidence map in `capability/knowledge-map.json`. If any domain scores `low`, execution stops and the user is informed. If any domain scores `medium`, the user is warned and asked to confirm. If all domains score `high`, execution proceeds silently. For multi-domain tasks, the lowest confidence found is used — no silent skipping.

**Trigger:** Automatic before every single-shot task. Controlled by `capability_check_enabled`.

**Files responsible:**
- `skills/tools/capability-check.js` — domain classifier and confidence checker
- `capability/knowledge-map.json` — domain confidence index
- `capability/resource-log.json` — log of all capability decisions

**Config flag:** `capability_check_enabled` in `config/system.json`.

**Domain confidence map:**
| Domain | Confidence |
|---|---|
| system_design | high |
| programming | high |
| data_analysis | high |
| mentorship | high |
| technical_writing | high |
| strategic_planning | high |
| research | high |
| multimedia_content | medium |
| legal | low |
| medical | low |
| financial_advice | low |

**Verification test:**
```bash
sdd "give me legal advice on my contract"
```
Expected: Hard stop with explanation that legal domain is below capability threshold. No AI call made.

**Known limitations:**
- Domain classification is keyword-based, not semantic. Edge cases may misclassify.
- `resource-log.json` has safe fallback if file is absent or malformed.

---

### 8 — Interactive Negotiation Layer

**What it does:**
After capability check and before prompt construction, the system pattern-matches the task against a set of improvement triggers. If a match is found, it presents the user with three options: A (original task as-is), B (suggested improved version), C (cancel). If the user selects B, the task is rewritten before execution. If no pattern matches, execution proceeds silently.

**Trigger:** Automatic after capability check. Controlled by `negotiation_enabled`.

**Files responsible:**
- `skills/tools/negotiator.js` — pattern matching and prompt rewrite

**Config flag:** `negotiation_enabled` in `config/system.json`.

**Current negotiation triggers:**
| Pattern | Suggestion |
|---|---|
| Request for a plain list | Structured categorized document |
| "Explain simply / explain like" | Analogy-based explanation |
| "Fix this code/bug" with no code | Ask for code and error first |
| "What is/are the best" | Criteria-based comparison |
| Translation with no tone | Ask for tone context |

**Verification test:**
```bash
sdd "give me a list of programming languages"
```
Expected: Negotiator presents A/B/C options. Selecting B rewrites the task to request a structured categorized document.

**Known limitations:**
- Pattern matching is string-based — not AI-powered. Complex phrasings may not trigger.
- User decision is always final. No override under any condition.

---

### 9 — Multi-Agent Chain Execution

**What it does:**
Single-shot tasks are not processed by a single agent. Instead, `chains.js` selects an ordered sequence of agents based on keyword classification. Each agent in the chain receives the original task plus the previous agent's compressed output. The reviewer agent always closes any multi-agent chain.

**Trigger:** Automatic for every single-shot task. Chain selection is keyword-based — no extra API call.

**Files responsible:**
- `orchestrator/chains.js` → `selectChain()`, `runChain()`
- `agents/<name>/identity.txt`, `strategy.txt`, `constraints.json`

**Config flag:** None. Always active for single-shot tasks.

**Chain routing table:**
| Task type | Agent sequence | Trigger keywords |
|---|---|---|
| Creative | creator → reviewer | write, generate, draft, content, post, script, story, caption, copy, email, blog |
| Strategy | strategist → reviewer | strategy, roadmap, plan, prioritize, framework, decision |
| Architecture | researcher → architect → reviewer | design, architecture, system, structure |
| Development | developer → reviewer | code, build, fix, implement, debug, script |
| Research | researcher → reviewer | research, find, explain, what is, how does, summarize |
| Analysis | researcher → analyst | analyze, data, compare, report, insights |
| Review | reviewer | review, check, critique, audit, evaluate |
| Default | basic | (no keyword match) |

**Verification test:**
```bash
sdd "write a short blog post about productivity"
```
Expected: Output shows creator chain running, followed by reviewer. No `[INTERNAL REASONING]` block visible if task is classified simple.

**Known limitations:**
- Keyword routing can misfire on ambiguous tasks (e.g., "plan" can match both strategy and development).
- Chain order is fixed — no dynamic reordering based on task content.

---

### 10 — Per-Agent Model Routing

**What it does:**
Each agent role is mapped to a specific AI model in `engine/adapter.json`. Heavy-reasoning agents (architect, developer, mentor) use the most capable available model. Fast agents (researcher, reviewer, basic) use lightweight models. This is the primary token efficiency mechanism — model power is matched to task and agent complexity.

**Trigger:** Automatic — resolved inside `runChain()` for each agent.

**Files responsible:**
- `engine/adapter.json` → `agent_models` section
- `orchestrator/chains.js` → `runChain()`

**Config flag:** `agent_models` in `engine/adapter.json`.

**Verification test:**
```bash
cat ~/sdd/engine/adapter.json | grep -A3 '"architect"'
```
Expected: Shows model assignment for simple and complex architect tasks.

**Known limitations:**
- DeepSeek-R1 (originally planned for architect/developer/mentor) is currently unavailable on OpenRouter free tier. Falls back to gemini-2.5-flash.

---

### 11 — Task Complexity Classifier

**What it does:**
Before chain execution, the system evaluates task length, chain length, and keyword density to classify the task as `simple` or `complex`. This signal controls: which models are selected per agent, whether self-critique is eligible, and (in a future phase) whether TRI-STRUCTURE formatting is suppressed. No extra API call is made — rule-based only.

**Trigger:** Automatic inside `selectChain()` for every single-shot task.

**Files responsible:**
- `orchestrator/chains.js` → complexity classifier function

**Config flag:** None. Always active.

**Verification test:**
```bash
sdd "what is a variable"
```
Expected: Fast execution, basic agent, no multi-step chain reasoning blocks.

**Known limitations:**
- Classification is heuristic — task length and keyword count, not semantic understanding.
- TRI-STRUCTURE suppression active — simple tasks route to basic agent, output stripped post-chain. (Phase 16 complete)

---

### 12 — Context Compression

**What it does:**
When passing output from one agent to the next in a chain, the prior output is truncated to a maximum of 6000 characters with a summary header prepended. This keeps prompt size predictable regardless of how verbose any single agent is, preventing runaway token costs.

**Trigger:** Automatic between every agent handoff in a multi-agent chain.

**Files responsible:**
- `orchestrator/chains.js` → context compressor function

**Config flag:** None. Always active in multi-agent chains.

**Verification test:**
Run any multi-agent task and check that the second agent receives compressed context. No direct CLI test — visible only in logs.
```bash
grep "CONTEXT COMPRESSED\|SKILL CONTEXT" ~/sdd/logs/$(date +%Y-%m-%d).log
```

**Known limitations:**
- Truncation is character-based, not semantic. May cut mid-sentence on verbose outputs.
- 6000 character limit is fixed — not config-controlled.

---

### 13 — Pipeline Project System

**What it does:**
`sdd project "idea"` launches a 7-stage structured project pipeline. Each stage produces an artifact saved to disk. Stages run sequentially and can be paused and resumed. `sdd resume <project-name>` restores a paused pipeline from its last completed stage.

**Stages (in order):** propose → spec → design → tasks → apply → verify → archive

**Trigger:** `sdd project "idea"` / `sdd resume <project-name>`

**Files responsible:**
- `orchestrator/pipeline.js` → `runPipeline()`, `resumePipeline()`
- `phases/pipeline/<stage>/prompt.txt` and `contract.json` — one folder per stage
- `projects/<name>/state.json` — tracks current stage
- `projects/<name>/outputs/<stage>.md` — stage artifacts

**Config flag:** None. Always active.

**Verification test:**
```bash
ls ~/sdd/projects/
```
Expected: One or more project folders. Each contains `state.json` and `outputs/`.

```bash
cat ~/sdd/projects/$(ls ~/sdd/projects/ | head -1)/state.json
```
Expected: JSON with `stage`, `status`, and `completed_stages` fields.

**Known limitations:**
- `sdd projects` live — lists all projects with stage and completion count. (Phase 14 complete)
- Project name is auto-generated from task string — can be long and hard to type for resume.
- `sdd postmortems` live — lists and displays latest postmortem from CLI. (Phase 14 complete)

---

### 14 — Skills Router

**What it does:**
Before agent chain execution, the task is matched against `skills/registry.json` — a manifest of available skills with trigger keywords. If a match is found, the relevant skill is noted and its context is injected into the prompt. If no match, execution proceeds silently.

**Trigger:** Automatic for every single-shot task. Controlled by `self_research_enabled`.

**Files responsible:**
- `skills/router.js` → `routeSkill()`
- `skills/registry.json` — skill manifest and trigger definitions

**Config flag:** `self_research_enabled` in `config/system.json`.

**Verification test:**
```bash
cat ~/sdd/skills/registry.json
```
Expected: JSON array of skill entries each with `id`, `name`, and `triggers` array.

**Known limitations:**
- Keyword-based matching only. No semantic skill selection.

---

### 15 — Self-Research Skill

**What it does:**
After skill routing, the system scans local files — `memory/memory.txt`, `capability/knowledge-map.json`, and all project files in `projects/` — for content relevant to the current task. Any relevant content found is injected into the prompt as additional context before the AI engine call.

**Trigger:** Automatic after skill routing. Controlled by `self_research_enabled` and `self_research_mode`.

**Files responsible:**
- `skills/tools/self-research.js` → `runSelfResearch()`

**Config flag:** `self_research_enabled` and `self_research_mode` in `config/system.json`. Mode `"local"` = file scan only. Mode `"ai"` = AI synthesis of findings (costs one extra API call).

**Verification test:**
```bash
sdd "summarize what I have built so far"
```
Expected: Response references content from memory or projects, not just generic knowledge.

**Known limitations:**
- Local mode only — no web search, no external knowledge retrieval.
- Relevance matching is keyword-based. May miss relevant context on paraphrased tasks.

---

### 16 — Self-Critique Layer

**What it does:**
After the final agent in a multi-agent chain produces output, a focused second pass is made asking the model to identify gaps, errors, or missed requirements against the original task. If the critique returns `PASS`, output is delivered as-is. If it contains critique, the critique is appended to the output as a visible `[SELF-CRITIQUE]` block. The critique never rewrites output — it surfaces issues only.

**Trigger:** Automatic after chain completion — only when `self_critique_enabled: true` AND task classified as `complex` AND chain has more than one agent.

**Files responsible:**
- `skills/tools/self-critique.js` → `runSelfCritique()`
- `orchestrator/main.js` — calls self-critique after `runChain()`

**Config flag:** `self_critique_enabled` in `config/system.json`. Currently `false`.

**Verification test:**
```bash
# Enable temporarily
sed -i 's/"self_critique_enabled": false/"self_critique_enabled": true/' ~/sdd/config/system.json
sdd "design a REST API for a task management system"
# Then re-disable
sed -i 's/"self_critique_enabled": true/"self_critique_enabled": false/' ~/sdd/config/system.json
```
Expected: Output includes a `[SELF-CRITIQUE]` section after the main result (or nothing added if PASS).

**Known limitations:**
- Costs one additional API call per complex task.
- Off by default to conserve free tier quota.

---

### 17 — TRI-STRUCTURE Output Mandate

**What it does:**
All specialist agents (architect, developer, analyst, researcher, reviewer, mentor, creator, strategist) are required to structure every response as three sections: `[INTERNAL REASONING]` (task breakdown, constraints, dependencies), `[ARTIFACT]` (the actual deliverable), and `[VERIFICATION]` (three criteria proving the output is correct). The basic agent is exempt.

**Trigger:** Embedded in each specialist agent's `strategy.txt`. Active on every specialist agent invocation.

**Files responsible:**
- `agents/<name>/strategy.txt` — TRI-STRUCTURE mandate for each specialist

**Config flag:** None. Simple tasks automatically suppressed via complexity classifier. (Phase 16 complete)

**Verification test:**
```bash
sdd "design a database schema for a blog"
```
Expected: Response contains `[INTERNAL REASONING]`, `[ARTIFACT]`, and `[VERIFICATION]` sections in that order.

**Known limitations:**
- Simple tasks suppressed — basic agent used directly, TRI-STRUCTURE stripped from output. (Phase 16 complete)

---

### 18 — Scoring System

**What it does:**
After every single-shot task, the output is scored on four dimensions using rule-based heuristics — no extra API call. Score is displayed in a panel and appended to `meta/scores/scores.jsonl`.

**Dimensions:**
| Dimension | What it measures | Range |
|---|---|---|
| Clarity | Sentence length, structure markers | 0–100 |
| Usefulness | Keyword relevance to task | 0–100 |
| Efficiency | Output length vs task complexity | 0–100 |
| Redundancy | Repeated phrase detection | 0–100 (lower = more redundant) |
| Overall | Weighted composite | 0–100 |

**Trigger:** Automatic after every single-shot task result. Controlled by `scoring_enabled`.

**Files responsible:**
- `skills/tools/scorer.js` → `scoreOutput()`, `saveScore()`, `displayScore()`
- `meta/scores/scores.jsonl` — append-only score log

**Config flag:** `scoring_enabled` in `config/system.json`.

**Verification test:**
```bash
tail -1 ~/sdd/meta/scores/scores.jsonl
```
Expected: JSON object with `timestamp`, `task`, and `scores` fields including `clarity`, `usefulness`, `efficiency`, `redundancy`, `overall`.

**Known limitations:**
- Heuristic scoring — not semantic. Scorer updated to remove length bias: clarity base raised to 60, formatting is a bonus not a requirement, usefulness no longer rewards length over keyword precision.
- Overall score formula is a fixed weighted average — not tunable from config.

---

### 19 — Meta Observer

**What it does:**
After every scored task, the observer scans the last 5 scores in `meta/scores/scores.jsonl`. If any single dimension scores below 60 in 3 or more of the last 5 runs, a proposal is staged to `meta/proposals/` recommending a specific improvement for that dimension.

**Trigger:** Automatic after every scored task. Controlled by `meta_observation_enabled`.

**Files responsible:**
- `skills/tools/observer.js` → `observe()`
- `meta/proposals/` — staged proposals

**Config flag:** `meta_observation_enabled` in `config/system.json`.

**Verification test:**
```bash
ls ~/sdd/meta/proposals/
```
Expected: Zero or more JSON files named by dimension and timestamp (e.g., `efficiency-1777224694467.json`).

**Known limitations:**
- Proposals are driven by the scoring system's heuristics — if scores are inaccurate, proposals may be misdirected.
- Threshold (3 of 5 runs below 60) is fixed — not config-tunable.

---

### 20 — Proposal Manager

**What it does:**
After meta observation, if any proposals are staged, they are presented to the user one at a time with four options: Y (apply now), N (reject), S (snooze until a future date), D (dismiss permanently). The system never applies any improvement without explicit user selection of Y.

**Trigger:** Automatic after meta observation on every single-shot task. Controlled by `meta_observation_enabled`.

**Files responsible:**
- `skills/tools/proposal-manager.js` → `runProposalManager()`
- `meta/proposals/` — staged proposals read and updated here

**Config flag:** `meta_observation_enabled` in `config/system.json`.

**Verification test:**
```bash
ls ~/sdd/meta/proposals/
cat ~/sdd/meta/proposals/$(ls ~/sdd/meta/proposals/ | head -1)
```
Expected: JSON with `dimension`, `suggestion`, `status`, and `staged_at` fields.

**Known limitations:**
- Proposals remain in `meta/proposals/` even after D (dismiss permanently) until manually cleaned up.

---

### 21 — Auto-Applier

**What it does:**
When the user selects Y on a proposal, the applier reads the proposal's dimension and applies a concrete pre-defined edit to the relevant agent files. For example, an `efficiency` proposal adds anti-filler instructions to all agent strategy files. Every applied improvement is committed to git automatically and logged to `meta/logs/self-improvements.jsonl`.

**Trigger:** User selects Y in the proposal manager.

**Files responsible:**
- `skills/tools/applier.js` → `applyProposal()`
- `meta/logs/self-improvements.jsonl` — improvement log
- `agents/<name>/strategy.txt` — files modified by improvements

**Config flag:** `auto_improvement` in `config/system.json`. Currently `false` — this flag controls fully automatic application (which is disabled). Y in the proposal manager is explicit user approval, not auto-improvement.

**Verification test:**
```bash
cat ~/sdd/meta/logs/self-improvements.jsonl
```
Expected: One JSON entry per applied improvement with `timestamp`, `proposal_id`, `dimension`, and `commit` fields.

**Known limitations:**
- Edits are pre-defined per dimension — the system cannot generate novel edits autonomously.
- Git commit is automatic on Y — no confirmation step before commit.

---

### 22 — Postmortem System

**What it does:**
When a pipeline project reaches the archive stage (final stage), the system automatically generates a structured markdown postmortem report. The report reads all stage artifacts from `projects/<name>/outputs/` and summarizes: objective, what was produced at each stage, key decisions, and suggested improvements for future projects. Report is saved to `meta/postmortems/`.

**Trigger:** Automatic at pipeline archive stage — no user action required.

**Files responsible:**
- `skills/tools/postmortem.js` → `generatePostmortem()`
- `orchestrator/pipeline.js` — calls postmortem after archive in both `runPipeline()` and `resumePipeline()`
- `meta/postmortems/` — report output

**Config flag:** None. Always runs at archive stage.

**Verification test:**
```bash
ls ~/sdd/meta/postmortems/
```
Expected: One `.md` file per completed pipeline project.

**Known limitations:**
- `sdd postmortems` live — prints latest postmortem directly in terminal. (Phase 14 complete)
- Reports require manual `cat` to read.

---

### 23 — Drift Control

**What it does:**
After every scored task, the current rolling averages across all four scoring dimensions are compared against a locked baseline. If any dimension has dropped 10 or more points below its baseline, a drift warning is printed. The baseline is captured manually with `sdd baseline` and locked in `meta/baselines/baseline.json`.

**Trigger:** Automatic after every scored task. Baseline capture requires manual `sdd baseline` command.

**Files responsible:**
- `skills/tools/drift-control.js` → `captureBaseline()`, `checkDrift()`, `displayDrift()`, `displayBaseline()`
- `meta/baselines/baseline.json` — locked baseline averages
- `orchestrator/main.js` — `sdd baseline` command route

**Config flag:** `scoring_enabled` in `config/system.json` (drift check only runs when scoring is active).

**Verification test:**
```bash
sdd baseline
```
Expected: Prints current averages across all four dimensions and confirms baseline locked.

```bash
cat ~/sdd/meta/baselines/baseline.json
```
Expected: JSON with `clarity`, `usefulness`, `efficiency`, `redundancy` average values and `captured_at` timestamp.

**Known limitations:**
- Rolling 10-run ASCII chart displayed after every scored task across all 4 dimensions. (Phase 17 complete)
- Baseline must be manually recaptured after deliberate system improvements.

---

### 24 — Cost Tracker

**What it does:**
After every single-shot task, the system estimates API call count and token usage, logs the entry to `meta/costs/costs.jsonl`, and displays a cost panel. Running totals across all tracked runs are available via `sdd costs`.

**Trigger:** Automatic after every single-shot task. Controlled by `cost_tracking_enabled`.

**Files responsible:**
- `skills/tools/cost-tracker.js` → `logCost()`, `displayCost()`, `showTotals()`, `estimateTokens()`
- `meta/costs/costs.jsonl` — append-only cost log

**Config flag:** `cost_tracking_enabled` in `config/system.json`.

**Verification test:**
```bash
sdd costs
```
Expected: Running totals of API calls and estimated tokens across all logged runs.

**Known limitations:**
- Input token count is estimated from task string length only — not the full compiled prompt (which includes agent identity, strategy, memory context, skill context, and prior agent output). Real token usage is likely 5–10x higher than displayed.
- No per-provider cost breakdown.

---

### 25 — Image Generation

**What it does:**
`sdd image "description"` generates a Pollinations.ai URL for the described image. The URL is printed and can be opened in any browser to view or download the generated image. No API key required — Pollinations.ai is fully free.

**Trigger:** `sdd image "description"`

**Files responsible:**
- `skills/tools/image-gen.js` → `generateImage()`, `generateImagePrompt()`
- `orchestrator/main.js` — image command route

**Config flag:** None. Always active.

**Verification test:**
```bash
sdd image "a mountain landscape at sunrise"
```
Expected: Prints a `Prompt:` line and a `URL:` line beginning with `https://image.pollinations.ai/prompt/`. Opening the URL in a browser loads the generated image.

**Known limitations:**
- No local image download — URL must be opened in a browser manually.
- Image quality and style are not configurable beyond the text prompt.
- Pollinations.ai availability depends on their external service uptime.

---

### 26 — Creator Agent

**What it does:**
The `creator` agent handles multimedia content, structured creative briefs, and content generation tasks. It uses the TRI-STRUCTURE mandate and always produces a structured multimedia brief as the primary deliverable, regardless of whether an image API is available.

**Trigger:** Routed by chain selector when task keywords match: write, generate, draft, content, post, script, story, caption, copy, email, blog.

**Files responsible:**
- `agents/creator/identity.txt`, `strategy.txt`, `constraints.json`
- `orchestrator/chains.js` — creative chain definition

**Config flag:** None. Active whenever chain routing selects the creative chain.

**Verification test:**
```bash
sdd "write a product description for a coffee maker"
```
Expected: Response follows creator agent identity with a structured content output. Chain log shows `creator → reviewer`.

**Known limitations:** None beyond general chain routing edge cases.

---

### 27 — Strategist Agent

**What it does:**
The `strategist` agent handles planning, roadmaps, prioritization, and decision frameworks. It applies structured strategic thinking — frameworks, trade-off analysis, and phased plans — rather than generic advice.

**Trigger:** Routed by chain selector when task keywords match: strategy, roadmap, plan, prioritize, framework, decision.

**Files responsible:**
- `agents/strategist/identity.txt`, `strategy.txt`, `constraints.json`
- `orchestrator/chains.js` — strategy chain definition

**Config flag:** None. Active whenever chain routing selects the strategy chain.

**Verification test:**
```bash
sdd "create a strategy to grow a small YouTube channel"
```
Expected: Response follows strategist agent identity with a structured framework output. Chain log shows `strategist → reviewer`.

**Known limitations:** None beyond general chain routing edge cases.

---

### 28 — CLI Navigation Layer

**What it does:**
Three navigation commands make the system usable without memorizing syntax. `sdd help` prints a formatted command reference. `sdd status` prints a system snapshot (last score, pending proposals, API calls logged, git HEAD). `sdd` with no arguments launches an interactive menu with numbered options for all major commands.

**Trigger:** `sdd help` / `sdd status` / `sdd` (no arguments)

**Files responsible:**
- `orchestrator/menu.js` → `showHelp()`, `showStatus()`, `runMenu()`
- `orchestrator/main.js` — routes to menu functions

**Config flag:** None. Always active.

**Verification test:**
```bash
sdd help
sdd status
```
Expected:
- `sdd help` prints a formatted table of all commands.
- `sdd status` prints last score (e.g., `61/100`), pending proposals count, API calls logged, and git HEAD commit hash.

**Known limitations:**
- `sdd status` reads from `meta/scores/scores.jsonl` — if no tasks have been scored yet, last score shows `—/100`.

---

### 29 — Mentorship System

**What it does:**
`sdd learn "topic"` launches a Socratic learning session. If no roadmap exists for the topic, one is generated via the AI engine (6–10 topics in logical progression). The mentor agent then teaches the current topic using the Socratic method — asking questions, challenging responses, and guiding discovery. Progress is saved after every exchange. `sdd learn` with no topic lists all active roadmaps with completion percentage.

**Stages per topic:**
1. Roadmap load or generation
2. Progress state load
3. Last session context load
4. Mentor agent execution with full context
5. User response capture
6. Session save
7. Progress advance (on "next") or continue (on any other response)

**Commands:**
- `sdd learn "topic"` — start or continue a topic
- `sdd learn` — list all roadmaps and progress
- During session: type a response to continue, `next` to advance topic, `quit` to exit

**Files responsible:**
- `skills/tools/learn-command.js` → `runLearnCommand()` — full session handler
- `skills/tools/learner.js` → roadmap, progress, session, and context management
- `agents/mentor/identity.txt`, `strategy.txt`, `constraints.json` — Socratic mentor identity
- `learning/roadmaps/<slug>.json` — generated curriculum
- `learning/progress/<slug>.json` — learner position and weak spots
- `learning/sessions/<slug>/` — per-session logs

**Config flag:** None. Always active.

**Mentor agent rules (from constraints):**
- Never advance a topic without a verified correct response
- Never lecture without asking a question
- Never skip TRI-STRUCTURE format
- Never declare job-readiness — earned through milestone completion only
- Never repeat the same explanation twice — always try a different angle
- Never use filler phrases

**Verification test:**
```bash
sdd learn
```
Expected: Lists all active roadmaps with `slug`, `done/total` topics, and percentage.

```bash
sdd learn "JavaScript for beginners"
```
Expected: Loads existing roadmap, prints current topic (Topic 1/8), runs mentor session, waits for user response.

```bash
cat ~/sdd/learning/roadmaps/javascript-for-beginners.json
```
Expected: JSON with `topic` and `topics` array of 8 progressive learning topics.

**Known limitations:**
- Session runs as a continuous loop — stays open until user types "quit" or "next" advances all topics. (Phase 13 complete)
- Gemini free tier (20 req/day) can be exhausted before a session completes.
- OpenRouter free tier models change without notice — fallback may fail if model is removed.

---

### 30 — Learn Session Loop

**What it does:**
`sdd learn "topic"` keeps the mentor session open across multiple exchanges until the user types "quit". No re-run required between responses. The "next" command advances to the next topic and saves progress.

**Trigger:** `sdd learn "topic"` — session stays open via readline loop.

**Files responsible:**
- `skills/tools/learn-command.js` → session loop handler
- `skills/tools/learner.js` → progress and session persistence

**Config flag:** None. Always active.

**Verification test:**
```bash
sdd learn "JavaScript for beginners"
```
Expected: Mentor session opens, waits for response. Typing a reply continues the session without re-running the command. Typing "quit" exits cleanly.

**Known limitations:**
- Gemini free tier (20 req/day) can be exhausted before a session completes.

---

### 31 — Pipeline Visibility Commands

**What it does:**
`sdd projects` lists all pipeline projects with their current stage and artifact count. `sdd postmortems` displays the most recent postmortem report for completed projects.

**Trigger:** `sdd projects` / `sdd postmortems`

**Files responsible:**
- `orchestrator/menu.js` → `showProjects()`, `showPostmortems()`
- `orchestrator/main.js` — routes commands

**Config flag:** None. Always active.

**Verification test:**
```bash
sdd projects
sdd postmortems
```
Expected: `sdd projects` lists project names, stages, and artifact counts. `sdd postmortems` prints the latest postmortem markdown report.

**Known limitations:** None.

---

### 32 — Engine Health Check

**What it does:**
`sdd check-engines` pings all 6 configured providers with a real minimal API call, reports live/down status, latency in ms, and marks the currently active provider.

**Trigger:** `sdd check-engines`

**Files responsible:**
- `skills/tools/engine-check.js` → per-provider check functions
- `orchestrator/main.js` — routes command

**Config flag:** None. Always active.

**Verification test:**
```bash
sdd check-engines
```
Expected: Table showing ✅/❌ for all 6 providers (Gemini, Gemma 4 31B, gpt-oss-120b, Groq, Cerebras, Ollama) with latency and active marker.

**Known limitations:**
- A 429 on a provider shows ❌ even though the provider is healthy — quota exhaustion, not a failure.

---

### 33 — TRI-STRUCTURE Suppression

**What it does:**
Simple tasks bypass TRI-STRUCTURE formatting entirely. The basic agent is used directly, skipping specialist agents and the reviewer. If a specialist agent does run on a simple task and includes reasoning sections, they are stripped from the final output before display.

**Trigger:** Automatic — complexity classifier in `chains.js` sets `simple` flag before chain selection.

**Files responsible:**
- `orchestrator/chains.js` → complexity classifier
- `orchestrator/main.js` → post-chain strip logic

**Config flag:** None. Always active.

**Verification test:**
```bash
sdd "what is a variable"
```
Expected: Clean plain-text answer with no [INTERNAL REASONING] or [VERIFICATION] blocks. Chain log shows `basic` agent only.

**Known limitations:**
- Strip uses regex to extract content between [ARTIFACT] and [VERIFICATION] markers. Line-based heuristic retained as fallback. Edge cases eliminated.

---

### 34 — Score Drift ASCII Chart

**What it does:**
After every scored task, a rolling 10-run number grid is printed showing exact per-dimension scores (Clarity, Usefulness, Efficiency, Redundancy) with averages. Columns are aligned oldest → newest for easy trend reading. Allows immediate visual detection of scoring drift without any external tools.

**Trigger:** Automatic after every scored task.

**Files responsible:**
- `skills/tools/drift-control.js` → `displayChart()`
- `orchestrator/main.js` — calls displayChart after score

**Config flag:** `scoring_enabled` in `config/system.json`. Chart only displays when scoring is active.

**Verification test:**
```bash
sdd "what is a loop in programming"
```
Expected: After score panel, a 4-row ASCII bar chart prints with last 10 runs per dimension and row averages.

**Known limitations:** Requires at least 1 prior scored run to display meaningful trend.

---

### 35 — Memory Summarization

**What it does:**
When `memory/memory.txt` exceeds 40KB, the system automatically compresses it. The last 5 exchanges are kept verbatim. Older exchanges are grouped by topic and summarized. A backup of the original file is saved before compression.

**Trigger:** Automatic — checked on every `saveMemory()` call.

**Files responsible:**
- `skills/tools/memory-summarizer.js` → compression logic
- `orchestrator/orchestrator.js` → `saveMemory()` triggers check

**Config flag:** None. Always active when memory file exceeds threshold.

**Verification test:**
```bash
ls -lh ~/sdd/memory/memory.txt ~/sdd/memory/memory.backup.txt
```
Expected: Both files exist. If compression has triggered, `memory.txt` is significantly smaller than `memory.backup.txt`.

**Known limitations:**
- Summarization quality depends on the AI engine — Ollama (TinyLlama) produces weaker summaries than Gemini.

---

### 39 — Pre-Commit Hook (Phase 28)

**What it does:**
On every `git commit`, scans staged `.js` files and validates them against SDD's Code Quality Standards. Blocks the commit if any violation is found and prints the exact rule ID, file, and fix instruction.

**Trigger:** Automatic on every `git commit` after `sdd hook-install`

**Commands:**
- `sdd hook-install` — installs the hook into `.git/hooks/pre-commit`
- `sdd hook-uninstall` — removes the hook

**Files responsible:**
- `hooks/pre-commit` — bash hook script
- `hooks/check.js` — Node.js validator (5 rules: STD-3, STD-4, STD-7, STD-8, STD-9)
- `hooks/rules.js` — machine-readable rule definitions
- `orchestrator/main.js` — routes hook-install/uninstall commands

**Verification test:**
```bash
echo 'logExecution({ stage: "test" });' > test.js
git add test.js && git commit -m "test"
```
Expected: commit blocked with [STD-8] violation message.

**Known limitations:**
- Only checks 5 of the 10 standards — the remaining 5 require AST parsing to detect reliably.

---

### 38 — Backup System

**What it does:**
`sdd backup` commits all runtime files (memory, scores, costs, config) to git, pushes to GitHub, copies `.bashrc` to SD card, and writes a `RESTORE.md` with step-by-step recovery instructions. Entire system is recoverable after Termux uninstall.

**Trigger:** `sdd backup`

**Files responsible:**
- `backup.sh` → full backup logic
- `orchestrator/main.js` → routes `sdd backup` command

**SD card output:** `/sdcard/sdd-backup/`
- `.bashrc.backup` — API keys and aliases
- `backup.sh` — the script itself
- `RESTORE.md` — recovery instructions

**Verification test:**
```bash
sdd backup
```
Expected: runtime files committed if changed, pushed to GitHub, SD card files written, all steps show ✅.

**Known limitations:**
- Requires GitHub auth to be cached (HTTPS token). If token expires, push will prompt for credentials.

---

### 36 — Post-Chain Pipeline (Phase 19)

**What it does:**
All post-chain processing (TRI-STRUCTURE stripping, self-critique, memory save, scoring, drift, meta, cost) is handled by `orchestrator/post-chain.js`. main.js delegates entirely after runChain() returns.

**Files responsible:**
- `orchestrator/post-chain.js` → owns all post-result processing
- `orchestrator/main.js` → calls runPostChain() with result context

**Verification test:**
```bash
sdd "what is encapsulation"
```
Expected: full pipeline runs — result, score, drift, cost all display correctly.

---

### 37 — Schema Validation (Phase 20)

**What it does:**
On every startup, `system.json` and `adapter.json` are validated against required field schemas. Any missing or invalid field produces a clear error message with the field name and file path, then exits with code 1.

**Files responsible:**
- `orchestrator/validator.js` → validateSystemConfig(), validateAdapterConfig()
- `orchestrator/orchestrator.js` → calls validators in loadConfig() and loadEngineAdapter()

**Verification test:**
Delete any field from system.json, run `sdd "test"`, confirm error names the missing field exactly.

**Known limitations:** None.

---

### 36 — Post-Chain Pipeline (Phase 19)

**What it does:**
All post-chain processing (TRI-STRUCTURE stripping, self-critique, memory save, scoring, drift, meta, cost) is handled by `orchestrator/post-chain.js`. main.js delegates entirely after runChain() returns.

**Files responsible:**
- `orchestrator/post-chain.js` → owns all post-result processing
- `orchestrator/main.js` → calls runPostChain() with result context

**Verification test:**
```bash
sdd "what is encapsulation"
```
Expected: full pipeline runs — result, score, drift, cost all display correctly.

---

### 37 — Schema Validation (Phase 20)

**What it does:**
On every startup, `system.json` and `adapter.json` are validated against required field schemas. Any missing or invalid field produces a clear error message with the field name and file path, then exits with code 1.

**Files responsible:**
- `orchestrator/validator.js` → validateSystemConfig(), validateAdapterConfig()
- `orchestrator/orchestrator.js` → calls validators in loadConfig() and loadEngineAdapter()

**Verification test:**
Delete any field from system.json, run `sdd "test"`, confirm error names the missing field exactly.

**Known limitations:** None.

---

## SYSTEM-WIDE DESIGN RULES

These rules apply across all capabilities. Any capability that violates one of these is a bug.

1. `start.sh` is the only permitted CLI entry point. No internal file is called directly.
2. No hardcoded engine references anywhere in code. Always read from `engine/adapter.json`.
3. Agent folder structure is always respected — three files per agent minimum.
4. Config drives all behavior. No feature flag is hardcoded.
5. Logs exist from day one and write to `logs/YYYY-MM-DD.log`.
6. Git is the versioning system. Every completed phase produces a commit.
7. Memory compression is automated — triggers at 40KB, compresses to ~6KB, keeps last 5 exchanges verbatim. Backup saved automatically.
8. SPEC.md and CAPABILITIES.md are updated after every structural decision.
9. Capability is checked before every execution. The system never proceeds blindly.
10. The system never applies improvements automatically. All changes require explicit user approval.
11. The negotiator never overrides the user. It proposes — the user decides.
12. Free-only constraint is active until explicitly lifted by the user.
13. The creator agent always produces a structured brief regardless of API availability.
14. Model power is matched to task complexity via per-agent routing in `engine/adapter.json`.
15. Mentorship advancement is earned — never assumed. A topic is not marked complete without a verified correct user response.
16. Multi-domain tasks use the lowest confidence level found. No silent skipping of weak domains.
17. Self-critique surfaces issues — it never rewrites output. User sees both and decides.

---

## IMPLEMENTED PHASES 13–18

| Phase | Capability | Description |
|---|---|---|
| 13 | Learn session loop | ✅ Complete — session stays open until "quit" typed |
| 14 | `sdd projects` + `sdd postmortems` | ✅ Complete — both commands live |
| 15 | `sdd check-engines` | ✅ Complete — pings all providers with latency |
| 16 | TRI-STRUCTURE suppression on simple tasks | ✅ Complete — basic agent routing + post-chain strip |
| 17 | Score drift ASCII chart | ✅ Complete — 10-run rolling chart after every scored task |
| 18 | Memory summarization | ✅ Complete — triggers at 40KB, compresses to ~6KB |

---

*End of CAPABILITIES.md — Update after every phase that adds, modifies, or removes a capability.*
