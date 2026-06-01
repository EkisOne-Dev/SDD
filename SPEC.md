# SDD LIVING SPEC — Authoritative Reference Document
> Paste this file at the start of every session to maintain coherency.
> Update the CHANGELOG section after every meaningful decision or change.
> This document is the single source of truth for the entire SDD lifecycle.

---

## DOCUMENT METADATA

| Field | Value |
|---|---|
| Document Version | 5.1.0 |
| System Version | v5.1.0 — Fully Verified + Universal Thinking Protocol |
| Last Updated | 2026-05-30 |
| Status | Active Development |
| Platform | Android / Termux |
| Runtime | Node.js |
| Primary AI Engine | Gemini (swappable — see Engine Adapter) |
| Free-Only Constraint | ACTIVE — no paid tools or APIs until explicitly lifted |

---

## SYSTEM IDENTITY

**Name:** Structured Development System (SDD)
**Nature:** Portable general-purpose professional AI platform running on mobile hardware
**Primary Objective:** To establish a robust platform capable of executing and delivering all requested tasks with the utmost quality and efficiency — encompassing system design, data analysis, mentorship, programming project development, and high-quality multimedia content creation — while maintaining a streamlined and user-friendly approach.

**System Behaviors:**
- Multi-agent execution system (single-agent in MVP, full roster post-MVP)
- Structured workflow engine (phase-based)
- Persistent knowledge system (file-based memory)
- Self-improving environment with user-controlled approval gates
- Capability-aware execution (validates competence before acting)
- Interactive negotiation layer (proposes better alternatives to user)
- Skills execution layer (routes tasks to skills, injects context into prompt)
- Task complexity classifier (signals simple vs complex to control model selection and optional steps)
- Self-critique layer (optional focused quality pass after chain completion)
- Context compression (caps inter-agent context at 500 tokens for efficiency)
- Execution mode system (fast/strict/flexible via config/mode.json — current: fast — validation:false, evaluation:false, agents:1; strict enables full multi-agent chains and validator pass)

---

## CANONICAL DIRECTORY STRUCTURE

```
~/sdd/
├── SPEC.md                        ← THIS FILE — living spec anchor
├── CAPABILITIES.md                ← Full feature registry with verification tests
├── README.md                      ← Human-readable system state summary
├── start.sh                       ← SOLE entry point (do not call internals directly)
├── logs/                          ← System-level execution logs (root debug layer)
│   └── YYYY-MM-DD.log
├── orchestrator/
│   ├── main.js                    ← Core entry logic
│   ├── chains.js                  ← Phase 5 — multi-agent chain runner
│   ├── orchestrator.js            ← All system functions
│   ├── pipeline.js                ← Phase 3 — 7-stage pipeline runner
│   └── menu.js                    ← Phase 12 — CLI navigation (help, status, interactive menu)
├── agents/
│   ├── basic/                     ← MVP fallback agent ✅
│   │   ├── identity.txt
│   │   ├── strategy.txt
│   │   └── constraints.json
│   ├── architect/                 ← System design, structure, planning
│   ├── developer/                 ← Programming, code review, debugging
│   ├── analyst/                   ← Data analysis, reports, insights
│   ├── researcher/                ← Knowledge gathering, fact validation
│   ├── reviewer/                  ← QA and critique across all outputs
│   ├── mentor/                    ← Teaching, guidance, learning paths
│   ├── creator/                   ← Multimedia content, structured prompts
│   ├── strategist/                ← Planning, roadmaps, decisions
│   └── validator/                 ← ✅ Active — Phase 47b (logical coherence, contradiction detection)
├── phases/
│   └── basic/                     ← MVP execution phase ✅
│       ├── contract.json
│       ├── prompt.txt
│       └── schema.json
├── skills/
│   ├── router.js                  ← ✅ Active — Phase 4
│   ├── registry.json              ← ✅ Active — Phase 4
│   └── tools/
│       ├── capability-check.js    ← ✅ Active — Phase 1
│       ├── negotiator.js          ← ✅ Active — Phase 1
│       ├── self-research.js       ← ✅ Active — Phase 4
│       ├── self-critique.js       ← ✅ Active — Phase 5
│       ├── scorer.js              ← ✅ Active — Phase 6
│       ├── observer.js             ← ✅ Active — Phase 7
│       ├── proposal-manager.js     ← ✅ Active — Phase 7
│       ├── applier.js              ← ✅ Active — Phase 7
│       ├── postmortem.js           ← ✅ Active — Phase 8
│       ├── drift-control.js        ← ✅ Active — Phase 9
│       ├── cost-tracker.js         ← ✅ Active — Phase 10
│       ├── image-gen.js            ← ✅ Active — Phase 11
│       ├── learner.js              ← ✅ Active — Phase 12 (mentorship)
│       ├── learn-command.js        ← ✅ Active — Phase 12 (mentorship)
│       ├── semantic-memory.js       ← ✅ Active — Phase 49 (semantic retrieval)
│       ├── audit.js                   ← ✅ Active — Phase 50 (self-audit command)
│       ├── engine-check.js        ← ✅ Active — Phase 15 (engine health check)
│       ├── memory-summarizer.js   ← ✅ Active — Phase 18 (memory summarization)
│       ├── session-end.js         ← ✅ Active — Phase 48 (session-end command)
│       └── intent-parser.js       ← ✅ Active — Phase 44 (intent normalization)
│   └── library/                   ← ✅ Active — skill instruction files (Phase 47+)
├── memory/
│   ├── core/
│   ├── patterns/
│   ├── projects/
│   ├── temporary/
│   ├── summaries/
│   ├── memory.txt                 ← Active flat file memory
│   └── embeddings.json            ← Phase 49 — semantic embedding store (768-dim, nomic-embed-text)
├── projects/
│   └── <project-name>/
│       ├── context/
│       ├── outputs/
│       ├── logs/
│       ├── decisions.json
│       ├── state.json
│       └── objective.md
├── meta/
│   ├── logs/
│   ├── insights/                  ← ✅ Active — Phase 52 (cross-session pattern synthesis)
│   ├── postmortems/
│   ├── baselines/
│   ├── proposals/
│   ├── costs/
│   │   └── costs.jsonl            ← Cost tracking data
│   └── scores/
│       └── scores.jsonl           ← Score history data
├── capability/
│   ├── knowledge-map.json         ← ✅ Active — domain competence index
│   └── resource-log.json          ← ✅ Active — logs external resource fetches
├── learning/
│   ├── roadmaps/              ← User-provided field roadmaps (JSON)
│   ├── progress/              ← Per-roadmap learner state and position
│   └── sessions/              ← Session logs with topic, response, assessment
├── scripts/
│   ├── verify.sh                  ← ✅ Active — full system verification (62 checks)
│   └── sync-version.js            ← ✅ Active — version sync across all architectural files
├── versions/                      ← ✅ Active — Phase 53 (structured version snapshots)
├── engine/
│   └── adapter.json               ← ✅ Active — Gemini / OpenRouter / Ollama
└── config/
    ├── focus.json                 ← ✅ Created
    ├── mode.json                  ← ✅ Created
    └── system.json                ← ✅ Created
```

**RULE:** `start.sh` is the only permitted entry point. No subsystem file should be invoked directly from the CLI.

---

## SUBSYSTEM SPECIFICATIONS

---

### ORCHESTRATOR
**Files:** `orchestrator/main.js` + `orchestrator/orchestrator.js`
**Status:** ✅ Fully implemented and live

**`orchestrator.js` exports:**
- `loadConfig()` — reads `config/system.json`
- `loadEngineAdapter()` — reads `engine/adapter.json`
- `loadMemory(config)` — reads memory file
- `saveMemory(config, entry)` — appends to memory file
- `loadAgent(name)` — reads identity, strategy, constraints from agent folder
- `loadPhase(name)` — reads contract and prompt template from phase folder
- `buildPrompt(template, contract, agent, memory, task)` — assembles full prompt
- `logExecution(entry)` — writes to daily log file
- `runEngine(prompt, adapter)` — routes to Gemini, OpenRouter, or Ollama

**`main.js` execution order:**
1. Parse task from CLI
2. Load config and adapter
3. Log task received
4. Run capability check (if enabled)
5. Run negotiation check (if enabled)
6. Load memory, agent, phase
7. Build prompt
8. Call AI engine
9. Print and save result
10. Log completion

---


---

### MULTI-AGENT CHAINS
**File:** `orchestrator/chains.js`
**Status:** ✅ Active — Phase 5

**Purpose:** For single-shot tasks (`sdd "task"`), selects the right agent sequence based on task classification. Each agent in the chain receives the original task + the previous agent's full output. The pipeline (`sdd project`) is unaffected.

**Default chains:**

| Task type | Chain | Trigger keywords |
|---|---|---|
| Research | researcher → reviewer | research, find, explain, what is, how does, summarize |
| Development | developer → reviewer | code, build, fix, implement, debug, script |
| Architecture | researcher → architect → reviewer | design, architecture, system, plan, structure |
| Analysis | researcher → analyst | analyze, data, compare, report, insights |
| Review | reviewer | review, check, critique, audit, evaluate |
| Simple | basic | (no keyword match) |

**Per-agent model routing:**
Each agent role maps to a model in `engine/adapter.json`. Heavy-reasoning agents (architect, developer) use the most capable available model. Fast agents (researcher, reviewer, basic) use the lightest model. This is the primary token efficiency mechanism — model power is matched to task complexity.

**RULE:** Reviewer always runs last in any multi-agent chain. It never runs in isolation as a chain-closer if the chain has only one agent.
**RULE:** Chain selection is keyword-based by default. No extra API call is made to plan the chain.
**RULE:** `sdd project` bypasses chains entirely — pipeline.js handles its own agent assignment.
**RULE:** Prior agent output passed to the next agent is always compressed to 500 tokens max.
**RULE:** Task complexity is classified before chain selection — complex tasks may activate heavier models and self-critique.

**Task complexity classifier:**
A simple function in `chains.js` evaluates task length, chain length, and keyword density to assign `simple` or `complex`. No API call. Complex tasks activate per-agent model upgrades (DeepSeek-R1 for architect/developer/mentor) and make self-critique eligible.

**Context compression:**
Before passing output from agent N to agent N+1, the system truncates to 500 tokens with a summary header. This keeps prompt size predictable regardless of how verbose prior agents are.


### AGENTS
**Path:** `agents/<agent-name>/`
**Structure (always use folder, even when empty):**
```
agents/<n>/
├── identity.txt      ← Who the agent is
├── strategy.txt      ← How it thinks
└── constraints.json  ← What it must not do
```

**Full Agent Roster:**

| Agent | Role | Status |
|---|---|---|
| `basic` | General fallback, unclassified tasks | ✅ Active |
| `architect` | System design, structure, technical planning | Phase 2 |
| `developer` | Programming assistance, code review, debugging | Phase 2 |
| `analyst` | Data analysis, reports, insights, structured data | Phase 2 |
| `researcher` | Knowledge gathering, source validation, fact-checking | Phase 2 |
| `reviewer` | Quality control and critique across all output types | Phase 2 |
| `mentor` | Socratic teaching, adaptive pacing, assessment, job-readiness coaching | Phase 5 (mentorship) |
| `creator` | Multimedia content, exhaustive structured prompts | Phase 3 |
| `strategist` | Planning, roadmaps, prioritization, decision frameworks | Phase 3 |

**RULE:** Agents perform thinking only. They do NOT control execution flow.
**RULE:** `researcher` and `reviewer` serve all other agents — prioritize their implementation.
**RULE:** All agent folders exist in the directory structure from initial scaffold.

---

### PHASES
**Path:** `phases/<phase-name>/`

**Prompt template placeholders:**
- `{goal}`, `{constraints}`, `{success_criteria}`, `{output_format}` — from contract.json
- `{memory}` — persistent memory context
- `{identity}`, `{strategy}` — from agent files
- `{task}` — the user task
- `{prior_output}` — previous agent output in a chain (empty on first agent)

**TRI-STRUCTURE output mandate (all specialist agents):**
All non-basic agents are required to structure output as:
1. [INTERNAL REASONING] — break down task, identify constraints, list dependencies
2. [ARTIFACT] — the actual deliverable (code, analysis, design, explanation)
3. [VERIFICATION] — 3 specific criteria proving the output is correct

**MVP Phase (`phases/basic/`) — ✅ Active:**
```json
{
  "goal": "Execute the task clearly and efficiently",
  "constraints": ["Avoid overcomplication", "No hallucination", "No filler text"],
  "success_criteria": "Output is accurate, structured, and actionable",
  "output_format": "structured text"
}
```

**Future Phases (ordered):** propose → spec → design → tasks → apply → verify → archive

---

### SKILLS
**Path:** `skills/`

| Skill | File | Status |
|---|---|---|
| Capability Check | `tools/capability-check.js` | ✅ Active |
| Negotiator | `tools/negotiator.js` | ✅ Active |
| Self-Research | `tools/self-research.js` | Phase 4 |
| Image Generation | `tools/image-gen.js` | Phase 11 |

**RULE:** Skills must be specific, validated, and non-redundant. Router is always the gatekeeper.

---

### CAPABILITY VALIDATION SYSTEM
**Path:** `capability/` + `skills/tools/capability-check.js`
**Status:** ✅ Active
**Trigger:** Before every task execution.

**Domain confidence levels:**

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

**Behavior:**
- high → proceed silently
- medium → warn user, offer to proceed or cancel
- low → hard stop, explain gap, require user decision
- All decisions logged to `capability/resource-log.json`

---

### INTERACTIVE NEGOTIATION LAYER
**Path:** `skills/tools/negotiator.js`
**Status:** ✅ Active
**Trigger:** After capability check, before prompt construction.

**Current triggers:**
- Request for a plain list → suggest structured categorized document
- "Explain simply / explain like" → suggest analogy-based explanation
- "Fix this code/bug" with no code included → ask for code and error
- "What is/are the best" → suggest criteria-based comparison
- Translation request with no tone specified → ask for tone context

**Options always presented:** A (original) / B (suggested) / C (cancel)
**RULE:** User decision is always final. No override.
**Known limitation:** Choosing B does not yet modify the prompt — scheduled for Phase 2 improvement.

---

### CONTROLLED SELF-IMPROVEMENT SYSTEM
**Path:** `meta/proposals/`
**Status:** Structure created. Active from Phase 7.

**CRITICAL RULE:** The system NEVER applies improvements automatically. Every improvement requires explicit user approval.

**Proposal options:** Y (apply) / N (reject) / S (snooze) / D (dismiss permanently)

---

### MULTIMEDIA STRATEGY
**Path A:** Hugging Face Inference API — `skills/tools/image-gen.js` (Phase 11)
**Path B:** Structured brief output from `creator` agent (active when agent is built)

**Structured Output Format:**
```
[MULTIMEDIA BRIEF]
Type / Target tool / Style / Subject / Composition /
Color palette / Lighting / Mood / Technical specs /
Negative constraints / Reference style
```

**RULE:** Structured brief is always the primary deliverable regardless of API availability.

---

### SELF-CRITIQUE SKILL
**File:** `skills/tools/self-critique.js`
**Status:** ✅ Active — Phase 5
**Activation:** `self_critique_enabled: true` in `config/system.json` AND task classified as complex

**Purpose:** After the final agent in a multi-agent chain produces output, runs a focused second pass asking the model to identify gaps, errors, or missed requirements against the original task. Costs one extra API call. Off by default.

**Prompt structure:**
```
Original task: {task}
Output produced: {output}
Identify any gaps, errors, or missed requirements in 3 bullet points.
If the output fully satisfies the task, respond only with: PASS
```

**Behavior:**
- Response is PASS → output delivered as-is
- Response contains critique → critique appended to output as [SELF-CRITIQUE] block
- User sees both the output and the critique — never hidden

**RULE:** Self-critique never rewrites the output. It surfaces issues — the user decides what to do.
**RULE:** Self-critique only runs on complex tasks. Simple single-agent tasks skip it entirely.

---
### MENTORSHIP SYSTEM
**Path:** `learning/` + `agents/mentor/` + `skills/tools/mentor-router.js`
**Status:** 🔲 Phase 5 (mentorship)
**Entry point:** `sdd learn "topic"` or `sdd learn` (auto-advances to next topic)

**What makes it exceptional:**

**1. Roadmap-driven curriculum**
User provides a `roadmap.json` defining a field of study with topics, subtopics, prerequisites, and job-readiness criteria. The system tracks exact position and never repeats mastered material.

**2. Adaptive pacing**
After each explanation, the mentor asks a verification question. Based on the response, it either advances, re-explains with a different approach, or flags the topic for review. Pacing adjusts to demonstrated comprehension, not a fixed schedule.

**3. Socratic identity**
The mentor agent never just lectures. It asks, challenges, and guides. It uses analogies matched to the user's existing knowledge base (stored in memory). It teaches how to think, not just what to know.

**4. Persistent progress state**
`learning/progress/<roadmap-name>.json` tracks: current topic, completed topics, weak spots, session count, and estimated job-readiness score (0-100).

**5. Assessment and job-readiness**
At defined milestones, the mentor runs a structured assessment: concept questions, a practical challenge, and a mock interview question for that domain. Score is logged. Job-readiness is declared when all milestones pass at threshold.

**6. Session memory**
Every session is logged to `learning/sessions/` with topic, explanation given, question asked, and user response. The mentor reads recent sessions before each new session to maintain continuity.

**Roadmap format (`learning/roadmaps/<name>.json`):**
```json
{
  "name": "backend-engineering",
  "field": "Backend Engineering",
  "job_readiness_criteria": ["REST APIs", "databases", "auth", "deployment"],
  "milestones": [3, 6, 9],
  "topics": [
    {
      "id": 1,
      "title": "How the web works",
      "subtopics": ["HTTP", "DNS", "request-response cycle"],
      "prerequisites": [],
      "assessment_question": "Explain what happens when you type a URL and hit enter"
    }
  ]
}
```

**Progress state (`learning/progress/<name>.json`):**
```json
{
  "roadmap": "backend-engineering",
  "current_topic_id": 4,
  "completed": [1, 2, 3],
  "weak_spots": [2],
  "session_count": 7,
  "job_readiness_score": 31,
  "last_session": "2026-04-24"
}
```

**RULE:** The mentor never skips assessment. Advancement requires a correct or sufficiently complete response.
**RULE:** Weak spots are revisited before milestone assessments.
**RULE:** Job-readiness is never declared by the user — only earned through milestone completion.

---

### MEMORY SYSTEM
**MVP:** `memory/memory.txt` — flat file, append-only
**Retrieval:** Keyword-based semantic filter — last 5 exchanges always injected verbatim, top 3 relevant older exchanges scored by word overlap with current task, total capped at 2000 chars.
**Compression:** Auto-summarization when file exceeds 40KB (Phase 18)

| Layer | Path | Status |
|---|---|---|
| Core | `memory/core/` | Future |
| Patterns | `memory/patterns/` | Future |
| Projects | `memory/projects/` | Future |
| Temporary | `memory/temporary/` | Future |
| Summaries | `memory/summaries/` | Future |

---

### ENGINE ADAPTER
**Path:** `engine/adapter.json`
**Status:** ✅ Active

**Provider priority (7-provider online cascade):**
1. `primary` — Gemini 2.5 Flash-Lite · 1000 RPD, 15 RPM
2. `fallback` — Gemini 2.5 Flash · 250 RPD, 10 RPM · complex agents
3. `fallback2` — Groq / Llama 3.3 70B · 1000 RPD, 30 RPM · permanent free
4. `fallback3` — OpenRouter / Gemma 4 31B · free model
5. `fallback4` — OpenRouter / GPT-OSS 120B · free model
6. `fallback5` — Cerebras / GPT-OSS 120B · 8192 token cap · simple tasks only
7. `local_fallback` — Ollama / qwen2.5:7b · emergency offline only
8. `mistral_codestral` — Mistral Codestral · 1B tokens/month · developer agent override (not in main cascade)

**To switch provider:** Change `"active"` value in `engine/adapter.json` — no code changes needed.
**RULE:** No hardcoded API references anywhere in code. Always read from this file.

---

### CONFIG SYSTEM
**Path:** `config/` — Status: ✅ All three files active

**`config/system.json` key flags:**
- `capability_check_enabled: true`
- `negotiation_enabled: true`
- `auto_improvement: false`
- `free_only_mode: true`

---

### LOGS
**Path:** `logs/YYYY-MM-DD.log`
**Status:** ✅ Active — writing correctly
**Note:** Log date reflects device timezone, not UTC. This is expected behavior.

---

### VERSIONING
Git-based at `~/sdd/`. Run `git init && git add . && git commit -m "Phase 1 complete"` to create first checkpoint.

---

## EXECUTION FLOW

```
1.  sdd "task" → start.sh → orchestrator/main.js
2.  Load config/system.json, engine/adapter.json
3.  Log: TASK RECEIVED
4.  [✅ Active] CAPABILITY CHECK:
      → Classify domain → check knowledge-map.json
      → high: proceed silently
      → medium: warn + ask user
      → low: hard stop + ask user
5.  [✅ Active] NEGOTIATION CHECK:
      → Pattern match against triggers
      → Match found: present A/B/C options → user decides
      → No match: proceed silently
6.  [✅ Active] SKILLS CHECK:
      → router.js matches task to registry triggers
      → Match found: run self-research → inject context into memory block
      → No match or no context: proceed silently
7.  Load memory (+ skill context if present), agent, phase
8.  Build prompt from template
9.  Send to AI engine (Gemini by default)
10. Print result + save to memory + log TASK COMPLETED
11. [Phase 6] Scoring
12. [Phase 7] Meta observation → stage proposal if improvement found
13. [Phase 8] Postmortem
```

---

## MVP IMPLEMENTATION CHECKLIST

### Environment
```bash
pkg update && pkg upgrade -y
pkg install nodejs git -y
```

### Directory Scaffold (already complete)
```bash
mkdir -p ~/sdd/{orchestrator,agents/{basic,architect,developer,analyst,researcher,reviewer,mentor,creator,strategist},phases/basic,memory/{core,patterns,projects,temporary,summaries},projects,skills/tools,meta/{logs,insights,postmortems,baselines,proposals},capability,versions,engine,config,logs}
```

### Entry Point (`start.sh`)
```bash
#!/data/data/com.termux/files/usr/bin/bash
cd ~/sdd/orchestrator
node main.js "$@"
```

### Global Alias
```bash
echo 'alias sdd="bash ~/sdd/start.sh"' >> ~/.bashrc
source ~/.bashrc
```

### API Keys
```bash
echo 'export GEMINI_API_KEY="your-key"' >> ~/.bashrc
echo 'export OPENROUTER_API_KEY="your-key"' >> ~/.bashrc
source ~/.bashrc
```

### Dependencies
```bash
cd ~/sdd && npm install @google/generative-ai
```

---

## DESIGN PRINCIPLES (Non-Negotiable)

1. **Single entry point.** Only `start.sh` is called directly.
2. **No hardcoded engine references.** Always use `engine/adapter.json`.
3. **Agent folder structure is always respected**, even when minimally populated.
4. **Config drives behavior.** Mode, focus, engine, and all feature flags are config-controlled.
5. **Logs exist from day one.** Root `logs/` is active before meta system is built.
6. **Git is the versioning system** at MVP stage.
7. **Memory compression is mandatory** before `memory.txt` exceeds 50KB.
8. **SPEC.md is always updated** after any structural or design decision.
9. **Capability is always checked before execution.** The system never proceeds blindly.
10. **The system never applies improvements automatically.** All changes require explicit user approval.
11. **The negotiator never overrides the user.** It proposes — the user decides — then executes without further comment.
12. **Free-only constraint is active** until explicitly lifted by the user.
13. **The `creator` agent always produces a structured brief** regardless of API availability.
14. **Model power is matched to task complexity.** Heavy agents use capable models. Fast agents use light models. Per-agent routing is always config-driven via `engine/adapter.json`.
15. **Mentorship advancement is earned, never assumed.** The system never marks a topic complete without a verified correct response from the learner.
16. **Multi-domain tasks use the lowest confidence level found.** The capability check never ignores a weak domain because another domain matched first.
17. **Self-critique surfaces issues — it never rewrites.** The user always sees both the output and the critique and decides what to do next.

---

## DEVELOPMENT ROADMAP

| Phase | Feature | Status |
|---|---|---|
| 0 | MVP baseline (CLI, orchestrator, single agent, memory, config) | ✅ Complete |
| 1 | Preflight + Capability Validation + Negotiation Layer | ✅ Complete |
| 2 | Full agent roster (architect, developer, researcher, reviewer) + negotiator prompt injection | ✅ Complete |
| 3 | Real phase system (propose→spec→design→tasks→apply→verify→archive) | ✅ Complete |
| 4 | Skills execution layer (router + self-research) | ✅ Complete |
| 5 | Multi-agent chains + per-agent model routing + Mentorship System | ✅ Complete |
| 6 | Scoring system (clarity, usefulness, efficiency, redundancy) | ✅ Complete |
| 7 | Meta system + Controlled self-improvement proposal system | ✅ Complete |
| 8 | Postmortem system | ✅ Complete |
| 9 | Drift control (baseline comparison) | ✅ Complete |
| 10 | Cost awareness (token + API call tracking) | ✅ Complete |
| 11 | creator + strategist agents + image-gen skill (mentor already built in Phase 5) | ✅ Complete |
| 12 | CLI navigation layer | ✅ Complete |
| 13 | sdd learn session loop — continuous multi-turn mentor sessions | ✅ Complete |
| 14 | sdd projects + sdd postmortems — pipeline visibility commands | ✅ Complete |
| 15 | sdd check-engines — live provider status and latency check | ✅ Complete |
| 16 | TRI-STRUCTURE suppression on simple tasks — basic agent routing + post-chain strip | ✅ Complete |
| 17 | Score drift ASCII chart — rolling 10-run trend after every scored task | ✅ Complete |
| 18 | Memory summarization — auto-compress at 40KB, keep last 5 exchanges verbatim | ✅ Complete |
| 19 | main.js decomposition — extract post-chain pipeline into post-chain.js | ✅ Complete |
| 20 | Schema validation — validate system.json and adapter.json on load with clean error messages | ✅ Complete |
| 21 | Fix pipeline logExecution — passes objects instead of strings, corrupts every log entry | ✅ Complete |
| 22 | Fix pipeline loadMemory — task not passed, semantic filter bypassed in all pipeline stages | ✅ Complete |
| 23 | Fix chain routing — first-match replaced with scored best-match across all trigger sets | ✅ Complete |
| 24 | Fix pipeline duplication — runPipeline and resumePipeline share 80% logic, extract runStageLoop() | ✅ Complete |
| 25 | Fix router.js — registry.json read from disk on every call, add module-level cache | ✅ Complete |
| 26 | Expand negotiator — 5 rigid regex triggers replaced with broader pattern coverage | ✅ Complete |
| 27 | Visual spinner — animated progress indicator during AI engine calls | ✅ Complete |
| 28 | Pre-commit git hook — auto-validate committed code against Code Quality Standards | ✅ Complete |
| 29 | Fix STD-3 + STD-4 violations in chains.js — dead code alias and variable shadowing | ✅ Complete |
| 30 | Role-specific memory injection — only first agent receives full memory context | ✅ Complete |
| 31 | 3-tier complexity — add moderate tier between simple and complex | ✅ Complete |
| 32 | Structured agent handoff — replace blob context with summary/findings/artifact schema | ✅ Complete |
| 33 | Chain-specific phase contracts — dev/research/analysis get their own contracts | ✅ Complete |
| 34 | Task-aware reviewer + skill router best-match fix | ✅ Complete |
| 35 | sdd chat — interactive persistent conversation mode with any agent | 🔲 Planned |
| 36 | File reading — --file flag injects file content as prompt context | 🔲 Planned |
| 37 | sdd skills — AI-described skill list with examples | 🔲 Planned |
| 38 | Autocomplete + UX improvements — bash completion, welcome banner, help redesign | 🔲 Planned |
| 39 | Verified RAG researcher — confidence check + tiered web research + cross-verification | 🔲 Planned |
| 40 | Multi-language support — language detection + per-session language config | 🔲 Planned |
| 41 | Harness foundation — constitution.md, featurelist.json, history.md | 🔲 Planned |
| 42 | Auto-update protocol + start.sh calibration upgrade | 🔲 Planned |
| 43 | skills/library/ — markdown skill files replacing flat JSON triggers | 🔲 Planned |
| 44 | Intent parser — phi4-mini JSON normalization of ambiguous tasks | 🔲 Planned |
| 45 | Per-model skill files + task-aware local model router | 🔲 Planned |
| 46 | Per-model context budget — prompt length enforcement per model | 🔲 Planned |
| 47 | Spec-clarifier + guardian-angel skills | ✅ Complete |
| 47c | Context + hallucination hardening — num_ctx, compressPrompt, qwen3.5 budget fix | ✅ Complete |
| 47c-prime | Universal Thinking Protocol — harness-engineered reasoning scaffold for all models | 🔲 Planned |
| 48 | sdd session-end — structured session summary appended to history.md | ✅ Complete |
| 49 | Semantic memory retrieval — nomic-embed-text replaces keyword injection | 🔲 Planned |
| 50 | sdd audit — self-audit with gap detection and improvement proposals | 🔲 Planned |
| 51 | Full verification pass — all phases 0-51 confirmed | 🔲 Planned |

---

## CODE QUALITY STANDARDS

These standards apply to ALL code in the SDD system — new features, fixes, and refactors. No code is merged that violates these principles. This is the permanent engineering contract for the project.

---

### 1. Single Responsibility Principle (SRP)
Every file, module, and function has exactly one reason to change. Functions do one thing. Files own one domain.

- ✅ `post-chain.js` — owns post-result processing only
- ✅ `validator.js` — owns config validation only
- ❌ A function that both runs an engine call AND writes to a log file

**Rule:** If you cannot describe a function's purpose in one sentence without using "and", split it.

---

### 2. Explicit over Implicit
No silent failures. No assumptions about state. Every error must be catchable and produce a human-readable message with the specific field, file, or operation that failed.

- ✅ `validator.js` — names the exact missing field and file path
- ❌ `JSON.parse(raw)` with no try/catch — crashes with a raw Node.js stack trace
- ❌ Passing `null` silently instead of throwing

**Rule:** Every I/O operation (file read, API call, JSON parse) must have explicit error handling.

---

### 3. No Dead Code
No unused variables, no alias assignments, no unreachable branches.

- ❌ `const finalPrompt = prompt;` — identical alias, zero purpose
- ❌ 50KB memory warning that can never fire because compression triggers at 40KB
- ❌ `deepseek` model branch in runEngine — no deepseek provider exists in adapter.json

**Rule:** If a variable or branch cannot be justified by a specific line in SPEC.md, remove it.

---

### 4. No Variable Shadowing
Inner scope variables must never share names with outer scope variables in the same call chain.

- ❌ `const agents = effectiveAgents` inside a loop that already has `agents` in scope
- ❌ Reusing `config`, `adapter`, or `task` as local variable names inside functions that receive them as parameters

**Rule:** If ESLint `no-shadow` would flag it, rename it.

---

### 5. DRY — No Copy-Paste Logic
Identical logic blocks must be extracted into shared functions. If the same code appears in two places, it belongs in a third file that both import.

- ❌ `runPipeline` and `resumePipeline` sharing 80% identical stage-loop logic
- ❌ Duplicate readline `prompt()` helpers defined in both pipeline.js and negotiator.js

**Rule:** If you find yourself copying more than 3 lines from one function to another, extract it.

---

### 6. Best-Match over First-Match
When routing or selecting from a set of options (chains, skills, negotiator triggers), always score all candidates and pick the highest-scoring match — never stop at the first hit.

- ❌ Chain selector stops at first trigger match — "write a strategy" routes to creative instead of strategy
- ✅ Score all chains by trigger overlap count, return the chain with the highest score

**Rule:** Any selection algorithm that uses a `for...of` loop with an early `return` inside is a candidate for scoring instead.

---

### 7. I/O Caching
Files that are read on every function call but never change at runtime must be cached at module level.

- ❌ `router.js` reads `registry.json` from disk on every skill lookup
- ✅ Read once at module load, reuse the parsed object

**Rule:** If a `readFileSync` call is inside a function that is called more than once per session, cache it.

---

### 8. Consistent Logging Contract
`logExecution()` accepts a string only. Never pass an object. Log entries must be human-readable in the log file without a JSON parser.

- ❌ `logExecution({ stage: "PIPELINE", status: "STARTED" })` → writes `[object Object]`
- ✅ `logExecution("PIPELINE:propose STARTED — project: my-project")`

**Rule:** All logExecution calls must be string literals or template literals. No objects.

---

### 9. Context Completeness
Every function that builds or passes context (memory, task, prior output) must pass the full context required by the downstream consumer. No partial context.

- ❌ `loadMemory(config)` in pipeline — omits task, bypasses semantic filter
- ✅ `loadMemory(config, task)` — full context, filter activates

**Rule:** When calling any context-building function, verify all parameters are supplied. Omitted parameters that have defaults are a code smell — investigate why the default exists.

---

### 10. Spec-to-Code Traceability
Every function, file, and feature must map to a phase or capability in SPEC.md or CAPABILITIES.md. Code without a spec entry is not production-ready.

**Rule:** Before committing any new function or file, confirm it is documented in SPEC.md. The spec is always updated in the same commit as the code.

---

## REFACTOR ROADMAP

### Phase 19 — main.js Decomposition
**Problem:** `main.js` currently handles 7 responsibilities — CLI routing, preflight checks, chain execution, TRI-STRUCTURE stripping, self-critique, post-processing (score/drift/meta/cost/memory), and logging. This violates Single Responsibility Principle and makes the file hard to maintain, test, or extend.

**Target architecture:**
```
main.js         → CLI routing + preflight only
post-chain.js   → strip + critique + memory + score + drift + meta + cost + log
validator.js    → schema validation for config files on load
```

**Files to create:**
- `orchestrator/post-chain.js` — owns everything after the chain result returns
- `orchestrator/validator.js` — validates system.json and adapter.json schemas

**Files to modify:**
- `orchestrator/main.js` — imports and delegates to post-chain.js after runChain()
- `orchestrator/orchestrator.js` — calls validator.js in loadConfig() and loadEngineAdapter()

**Success criteria:**
- main.js task execution block reduced from ~60 lines to ~15 lines
- All post-chain logic testable in isolation via post-chain.js
- Any malformed config file produces a clear human-readable error instead of a crash

---

### Phase 20 — Schema Validation
**Problem:** If `config/system.json` or `engine/adapter.json` are malformed or missing required fields, the system crashes with a raw Node.js error that gives no actionable guidance. A production-grade system must fail loudly and clearly.

**Required fields to validate:**

`system.json` required: version, memory_file, default_agent, default_phase, capability_check_enabled, negotiation_enabled, scoring_enabled, cost_tracking_enabled, meta_observation_enabled, self_research_enabled, self_research_mode

`adapter.json` required: primary.provider, primary.model, primary.api_key_env, primary.base_url, active

**Behavior on validation failure:**
- Print specific field name that is missing or invalid
- Print the file path that failed
- Exit with code 1 — never proceed with a broken config

**RULE:** Validation runs before any other system operation. No task executes against an unvalidated config.

---

### Phase 21 — Fix pipeline logExecution (Critical Bug)
**Problem:** `pipeline.js` calls `logExecution()` with plain objects instead of strings. Every pipeline log entry writes `[object Object]` — completely unreadable. Violates Code Quality Standard #8.

**Fix:** Convert all `logExecution()` calls in pipeline.js to template literal strings.

**Files:** `orchestrator/pipeline.js`

---

### Phase 22 — Fix pipeline loadMemory (Active Bug)
**Problem:** All 7 pipeline stage calls use `loadMemory(config)` without passing `task`. The semantic filter built in Fix #1 is fully bypassed. Violates Code Quality Standard #9.

**Fix:** Pass `state.original_task` as second argument to `loadMemory()` in `runStage()`.

**Files:** `orchestrator/pipeline.js`

---

### Phase 23 — Fix chain routing (Structural)
**Problem:** `selectChain()` returns on the first trigger match. "write a strategy" routes to `creative` instead of `strategy` because "write" appears first. Violates Code Quality Standard #6.

**Fix:** Score all chains by trigger overlap count, return highest scorer. Tie-break by chain order.

**Files:** `orchestrator/chains.js`

---

### Phase 24 — Fix pipeline duplication (Structural)
**Problem:** `runPipeline()` and `resumePipeline()` share ~80% identical logic. Violates Code Quality Standard #5.

**Fix:** Extract shared `runStageLoop(state, deps)` function. Both entry points call it.

**Files:** `orchestrator/pipeline.js`

---

### Phase 25 — Fix router.js caching (Optimization)
**Problem:** `routeSkill()` reads and parses `registry.json` from disk on every call. Violates Code Quality Standard #7.

**Fix:** Cache parsed registry at module level. Read once on first call, reuse thereafter.

**Files:** `skills/router.js`

---

### Phase 26 — Expand negotiator coverage (Structural)
**Problem:** Only 5 rigid regex triggers. The vast majority of real-world tasks bypass negotiation entirely. Violates Code Quality Standard #6.

**Fix:** Expand to 15+ triggers covering vague requests, missing context, ambiguous scope, and multi-intent tasks. Replace pure regex with keyword+pattern hybrid matching.

**Files:** `skills/tools/negotiator.js`

---

### Phase 27 — Visual Spinner
**Problem:** When SDD makes an AI engine call, there is no visual feedback. The terminal appears frozen for 3-15 seconds depending on provider. This is a poor user experience, especially on slower providers like Gemini or when the cascade triggers.

**Inspiration:** Gentleman Guardian Angel (gga) implements a configurable spinner with timeout that shows animated progress during AI calls. Adapted for SDD's Node.js architecture.

**Design:**
- Spinner runs as a `setInterval` loop in Node.js while `runEngine()` awaits
- Uses ANSI escape codes from `colors.js` to animate in place (no new lines)
- Shows current provider name while waiting
- Clears cleanly when result arrives — no leftover characters
- Stops immediately on error or timeout

**Spinner frames:** `⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏` (braille dot animation)

**Files:**
- `orchestrator/spinner.js` — spinner utility (SRP: owns spinner only)
- `orchestrator/orchestrator.js` — wraps `runEngine()` with spinner

**Success criteria:**
- Spinner appears immediately when engine call starts
- Spinner clears cleanly when result arrives
- Provider name visible while waiting
- Works correctly in cascade — shows each provider switch

---

### Phase 28 — Pre-Commit Git Hook
**Problem:** Code Quality Standards exist in SPEC.md but are not enforced at commit time. A developer (or future session) could commit code that violates the 10 standards and it would only be caught in a later review.

**Inspiration:** Gentleman Guardian Angel's pre-commit hook pattern — runs AI validation on every `git commit`. Adapted for SDD's own codebase.

**Design:**
- `hooks/pre-commit` bash script installs as `.git/hooks/pre-commit`
- On every `git commit`, scans staged `.js` files in the SDD repo
- Checks against SDD's own Code Quality Standards (the 10 rules in SPEC.md)
- Validates: no dead code aliases, no object-style logExecution calls, no variable shadowing patterns, no readFileSync inside exported functions without cache
- Pass → commit proceeds normally
- Fail → commit blocked with specific violation listed
- `sdd hook-install` command installs the hook
- `sdd hook-uninstall` command removes it

**Files:**
- `hooks/pre-commit` — the git hook script
- `hooks/rules.js` — machine-readable version of the 10 Code Quality Standards
- `orchestrator/main.js` — routes `sdd hook-install` and `sdd hook-uninstall`

**Success criteria:**
- `sdd hook-install` creates `.git/hooks/pre-commit` and makes it executable
- Committing a file with `logExecution({...})` is blocked with a clear message
- Committing clean code proceeds without interruption
- `sdd hook-uninstall` removes the hook cleanly

---

### Phase 29 — Fix STD Violations in chains.js
**Problem:** Two Code Quality Standard violations remain in `chains.js` from before the pre-commit hook existed:
- STD-3: `const finalPrompt = prompt` — dead alias, zero purpose, adds confusion
- STD-4: `const agents = effectiveAgents` inside the loop body — shadows the outer `agents` destructured from chain

**Fix:**
- Remove `const finalPrompt = prompt` — use `prompt` directly in `totalPromptChars +=` and `runEngine()` calls
- Remove `const agents = effectiveAgents` inside loop — use `effectiveAgents[i]` and `effectiveAgents[i-1]` directly

**Files:** `orchestrator/chains.js`

**Standards:** STD-3 (No Dead Code), STD-4 (No Variable Shadowing)

---

### Phase 30 — Role-Specific Memory Injection
**Problem:** Every agent in a multi-agent chain receives the same full memory block. The reviewer gets the same 2000-char memory context as the researcher, even though the reviewer only needs the prior agent output and the original task. This wastes tokens on every multi-agent run and dilutes the reviewer's focus.

**Fix:** Memory injection is now role-aware:
- Agent index 0 (first agent): receives full semantic memory as before
- Agent index 1+ (subsequent agents): receives NO memory injection — only prior agent output and task

**Why this is correct:** Subsequent agents in a chain already have full context from the prior agent's output. Injecting additional memory adds noise, not signal.

**Files:** `orchestrator/chains.js` — `runChain()` function

**Standard:** STD-9 (Context Completeness) — only inject context that is actually needed

---

### Phase 31 — 3-Tier Complexity Classification
**Problem:** The complexity classifier is binary — simple or complex. This creates a false equivalence: "explain recursion in depth" and "build a complete JWT authentication system with refresh tokens and rate limiting" both get classified as complex and receive identical treatment.

**3-tier design:**
- `simple` — single keyword or short task, no complex keywords → basic agent only, no TRI-STRUCTURE, no self-critique
- `moderate` — multi-agent chain triggered but task is short + single-intent → specialist agents run, TRI-STRUCTURE active, self-critique skipped
- `complex` — multi-agent chain + long task OR multiple complex keywords → full treatment, self-critique eligible

**Classification logic:**
- simple: chain.agents.length === 1 OR (task.length < 80 AND !hasComplexKeyword)
- complex: isMultiAgent AND isLong AND hasComplexKeyword (all three)
- moderate: everything else

**Impact:** Moderate tasks no longer trigger self-critique unnecessarily. Complex tasks receive the full pipeline they deserve.

**Files:** `orchestrator/chains.js` — `classifyComplexity()`

---

### Phase 32 — Structured Agent Handoff
**Problem:** When agent N passes its output to agent N+1, the entire raw output blob is compressed and injected. The next agent receives everything — reasoning sections, formatting artifacts, verbose explanations — mixed into its context. This is the biggest workflow gap: unstructured context passing degrades every multi-agent chain.

**Root cause:** Agents produce TRI-STRUCTURE output ([INTERNAL REASONING] / [ARTIFACT] / [VERIFICATION]) but the handoff only uses the raw text, not the structured sections.

**Fix — Structured handoff extraction:**
When passing output from agent N to agent N+1, extract only:
1. The [ARTIFACT] section — the actual deliverable
2. A 2-sentence summary of [INTERNAL REASONING] key conclusions
3. The original task (always re-injected for grounding)

The [VERIFICATION] section is never passed forward — it is for the user, not downstream agents.

**Handoff format:**
```
[PRIOR AGENT: {agentName}]
Summary: {2-sentence conclusion from reasoning}
Deliverable: {extracted ARTIFACT content}
```

**Fallback:** If no TRI-STRUCTURE markers found (e.g. basic agent output), fall back to current compressContext() behavior.

**Files:** `orchestrator/chains.js` — new `extractHandoff()` function, replaces `compressContext()` in agent loop

**Standard:** STD-9 (Context Completeness) — pass exactly what is needed, nothing more

---

### Phase 33 — Chain-Specific Phase Contracts
**Problem:** All tasks — development, research, analysis, creative — use the same `phases/basic/contract.json`. This generic contract has a generic success criteria ("Output is accurate, structured, and actionable") and generic output format ("structured text"). A developer agent is constrained by the same contract as a researcher.

**Fix — Per-chain contracts:**
Create specialized contracts for each chain type:

| Chain | Contract focus | Success criteria | Output format |
|---|---|---|---|
| development | Correct, runnable code | Code executes, handles edge cases, no security issues | Code blocks with explanation |
| research | Accurate, cited facts | Claims are verifiable, sources are credible | Structured summary with key findings |
| analysis | Data-driven insights | Conclusions follow from evidence, no unsupported claims | Report with findings and recommendations |
| architecture | Sound system design | Components are cohesive, dependencies are minimal | Diagram description + component specs |
| strategy | Actionable plan | Steps are concrete, prioritized, and time-bound | Roadmap with milestones |
| creative | Engaging, on-brand content | Content matches brief, tone is consistent | Final content piece |

**Files:**
- `phases/development/contract.json` + `prompt.txt`
- `phases/research/contract.json` + `prompt.txt`
- `phases/analysis/contract.json` + `prompt.txt`
- `phases/architecture/contract.json` + `prompt.txt`
- `phases/strategy/contract.json` + `prompt.txt`
- `phases/creative/contract.json` + `prompt.txt`
- `orchestrator/chains.js` — pass chain type to `loadPhase()`
- `orchestrator/orchestrator.js` — `loadPhase()` accepts chain type, falls back to basic

---

### Phase 34 — Task-Aware Reviewer + Skill Router Best-Match
**Two improvements in one phase (both are small, both touch routing):**

**34A — Task-aware reviewer directive:**
The reviewer currently applies a generic QA lens to all output. A code review and a research review need different criteria.
Fix: Pass chain type as a variable into the reviewer prompt. The prompt template includes a `{review_focus}` placeholder that maps to chain-specific criteria:
- development → "Check for correctness, edge cases, and security issues"
- research → "Check for accuracy, unsupported claims, and logical consistency"
- analysis → "Check for data-driven reasoning and absence of unsupported conclusions"
- default → "Check for clarity, completeness, and accuracy"

**Files:** `orchestrator/chains.js` — pass `type` to reviewer prompt, `agents/reviewer/strategy.txt` — add `{review_focus}` placeholder support

**34B — Skill router best-match:**
`router.js` still uses first-match for skill selection (returns on first trigger hit). Identical gap to what we fixed in chains.js (Phase 23). Fix: score all enabled skills by trigger overlap count, return highest scorer.

**Files:** `skills/router.js` — `routeSkill()` function

**Standard:** STD-6 (Best-Match over First-Match)

---

### Phase 35 — sdd chat (Interactive Conversation Mode)
**Problem:** SDD is currently one-shot only — every task requires a new command. There is no way to have a back-and-forth conversation with an agent without re-running `sdd` each time. This is the single biggest UX gap between SDD and a real AI assistant.

**Design:**
- `sdd chat` opens an interactive REPL loop with the basic agent by default
- `sdd chat researcher` opens a session with a specific agent
- `sdd chat --chain development` opens a session using the full development chain
- Each exchange in the session is sent to the AI with the full conversation history as context
- Session history is stored in memory as a single conversation block
- `exit` or `quit` closes the session and saves the conversation to memory
- `clear` resets the session context without closing
- `agent <name>` switches agent mid-session

**Files:**
- `orchestrator/chat.js` — REPL loop, session manager, history accumulator
- `orchestrator/main.js` — routes `sdd chat` command

**Success criteria:**
- Session opens immediately with a prompt indicator (e.g. `[chat:basic] >`)
- Each response maintains context from all prior exchanges in the session
- `exit` saves the full conversation to memory and exits cleanly
- Spinner shows during each AI call
- Colors applied consistently with the rest of the UI

---

### Phase 36 — File Reading (--file flag)
**Problem:** There is no way to provide a file to SDD for analysis, summarization, or review. You cannot say "review this code" and provide a file. This is a significant missing capability.

**Design:**
- `sdd "summarize this" --file ~/notes.txt` injects file content as prompt context
- `sdd "review this code" --file ~/myapp.js` passes code to the developer+reviewer chain
- File type detection routes content correctly:
  - `.txt .md .json .js .py .sh .csv` → read directly as UTF-8
  - `.pdf` → extract text via `pdftotext` (Termux package)
  - Binary/unknown → warn user, skip injection
- File content is injected into the prompt the same way skill context is injected — clean, no new architecture
- File size cap: 50KB — larger files are truncated with a warning

**Files:**
- `skills/tools/file-reader.js` — file type detection, reading, truncation
- `orchestrator/main.js` — parses `--file` flag before task execution
- `orchestrator/chains.js` — passes file context alongside skill context

**Success criteria:**
- `sdd "what does this do" --file ~/sdd/orchestrator/chains.js` returns an accurate description
- PDF reading works if `pdftotext` is installed
- Files over 50KB produce a clear truncation warning
- Binary files produce a clear unsupported format message

---

### Phase 37 — sdd skills (AI-Described Skill List)
**Problem:** No command exists to discover what skills the system has. The registry is machine-readable JSON but not user-friendly. Users cannot explore SDD's capabilities conversationally.

**Design:**
- `sdd skills` asks the AI to describe each skill in the registry conversationally
- Output format: skill name, what it does, when to use it, example trigger phrase
- `sdd skills <name>` gives a detailed description of a specific skill
- The AI reads the actual registry data — not hallucinated descriptions

**Files:**
- `orchestrator/main.js` — routes `sdd skills` command
- `skills/registry.json` — read at runtime and injected into the prompt

**Success criteria:**
- `sdd skills` lists all enabled skills with plain-English descriptions
- `sdd skills self-research` gives a detailed explanation of that specific skill
- Descriptions come from the AI synthesizing the registry, not hardcoded strings

---

### Phase 38 — Autocomplete + UX Improvements
**Problem:** The terminal UX has several low-effort, high-impact gaps: no command autocomplete, no welcome banner, and `sdd help` is unformatted.

**Design — four improvements:**

**38A — Bash autocomplete:**
- Add a bash completion script to `.bashrc`
- Completes: `sdd chat`, `sdd learn`, `sdd project`, `sdd resume`, `sdd image`, `sdd skills`, `sdd backup`, `sdd check-engines`, `sdd baseline`, `sdd costs`, `sdd status`, `sdd hook-install`, `sdd hook-uninstall`
- Tab-completion works immediately after `source ~/.bashrc`

**38B — Welcome banner:**
- `sdd` with no args shows a welcome banner before the menu
- Banner shows: SDD version, active provider, last score, pending proposals
- Rendered in color using colors.js

**38C — Redesigned sdd help:**
- Grouped by category: Conversation, Pipeline, Learning, System, Dev Tools
- Each command shows: name, usage, one-line description
- Color-coded by category

**38D — Session start indicator:**
- Every `sdd "task"` run shows the date/time and active provider at the top
- Single dim line — not intrusive

**Files:**
- `~/.bashrc` — completion script added
- `orchestrator/menu.js` — welcome banner + redesigned help
- `orchestrator/main.js` — session start indicator

---

### Phase 39 — Verified RAG Researcher
**Problem:** The current researcher agent relies entirely on the LLM's training data, which may be outdated, biased, or hallucinated. There is no mechanism to verify claims against real sources, no confidence assessment before answering, and no cross-verification of facts from multiple sources.

**This is the highest-value research improvement in the system.**

**Design — 4-stage verified research pipeline:**

**Stage 1 — Self-confidence assessment:**
Before any web search, the researcher evaluates its own knowledge and assigns a confidence level:
- `high` → answer from training knowledge, no web search needed
- `medium` → supplement training knowledge with web verification
- `low` → full web research pipeline, training knowledge used only as framing

**Stage 2 — Tiered web research (low/medium confidence only):**
Source hierarchy (searched in order, stops when sufficient verified content found):
- Tier 1: Official documentation, .gov, .edu, peer-reviewed (highest trust)
- Tier 2: MDN, official language/framework docs, IEEE, established references
- Tier 3: Reputable journalism, known expert sources
- Search via DuckDuckGo Instant Answer API (free, no key) + direct URL fetch
- Each source is fetched and its content extracted (first 1000 chars)

**Stage 3 — Cross-verification:**
- Every key claim must appear in at least 2 independent sources to be marked `[confirmed]`
- Claims from only 1 source are marked `[single-source]`
- Claims not found in any source are marked `[model-knowledge]`
- Contradicting sources are flagged as `[disputed]`

**Stage 4 — Verified synthesis:**
- Synthesizes confirmed facts into a structured response
- Every claim carries its verification marker
- Sources cited inline
- Uncertainty is explicit, never hidden

**Files:**
- `skills/tools/verified-researcher.js` — 4-stage pipeline
- `skills/tools/source-fetcher.js` — tiered URL fetcher with trust scoring
- `agents/researcher/strategy.txt` — updated to use verified-researcher when confidence is low/medium
- `config/system.json` — new flag: `verified_research_enabled: true`

**Success criteria:**
- Factual question returns answer with explicit confidence markers
- Low-confidence topic triggers web research automatically
- Claims marked `[confirmed]` appear in 2+ fetched sources
- Response includes source citations
- Hallucinated facts are caught and marked `[model-knowledge]` not presented as confirmed

---

### Phase 40 — Multi-Language Support
**Problem:** SDD has no language configuration. The mentor and all agents respond in English regardless of user preference. Users who prefer to work in Spanish, French, Portuguese, or any other language have no way to configure this.

**Design:**
- `sdd lang <code>` sets the session language (e.g. `sdd lang es`, `sdd lang fr`, `sdd lang pt`)
- Language preference is saved to `config/system.json` as `language: "es"`
- Every agent prompt gets a language directive prepended: "Respond entirely in Spanish."
- Language detection: if the user's task is written in a non-English language, auto-detect and respond in that language regardless of config
- `sdd lang reset` reverts to English (default)

**Files:**
- `config/system.json` — new field: `language: "en"`
- `orchestrator/orchestrator.js` — `buildPrompt()` prepends language directive
- `orchestrator/main.js` — routes `sdd lang` command
- `orchestrator/validator.js` — validates language code is a known ISO 639-1 code

**Success criteria:**
- `sdd lang es` + `sdd "qué es una variable"` returns Spanish response
- Mentor sessions respond entirely in the configured language
- Auto-detection works for Spanish, French, Portuguese, German inputs
- `sdd lang reset` returns system to English

---

## KNOWN LIMITATIONS (Current)

- ~~Heuristic scorer bias~~ — **Fixed:** base clarity raised to 60, formatting is bonus not requirement, length bonus removed from usefulness, efficiency penalty threshold tightened. Short precise answers now score fairly.
- OpenRouter free tier models change without notice — `sdd check-engines` detects failures before use
- Gemini free tier hard limit: 20 requests/day on gemini-2.5-flash-lite — mitigated by 5-provider cascade
- ~~Self-research local mode only~~ — **Fixed:** web mode added. Wikipedia REST API fetched via two-step search+summary. Activated via self_research_mode="web" in system.json. Fails silently if offline.
- ~~Memory has no semantic retrieval~~ — **Fixed:** keyword-based filter injects last 5 exchanges verbatim + top 3 relevant older exchanges, capped at 2000 chars (88% token reduction on a 17KB file)
- ~~TRI-STRUCTURE stripping edge cases~~ — **Fixed:** regex now extracts content between [ARTIFACT] and [VERIFICATION] markers cleanly. Line-based heuristic kept as fallback only.
- ~~Cost tracker underestimates input tokens~~ — **Fixed:** full compiled prompt chars passed from chains.js, input tokens now accurate (~1184 vs ~9 on real task)
- Video and audio: structured output only — no local processing on mobile
- Log date reflects device timezone (expected behavior)
- Ollama installed and active — tinyllama pulled. `ollama serve` auto-starts via .bashrc

---

## FREE TOOLS REGISTRY

| Tool | Purpose | Access | Limit | Notes |
|---|---|---|---|---|
| Gemini 2.5 Flash Lite | LLM engine (primary) | GEMINI_API_KEY | Quota-based | Active |
| OpenRouter Llama 3.3 70B | LLM engine (fallback) | OPENROUTER_API_KEY | Free tier | Active — replaces Llama 4 Scout (removed) |

| Groq / Llama 3.3 70B Versatile | LLM engine (fallback3) | GROQ_API_KEY | Free tier | ✅ Active — ~315 TPS on LPU |
| Cerebras / Qwen 3 235B | LLM engine (fallback4) | CEREBRAS_API_KEY | 1M tokens/day | ✅ Active — largest free model |
| Ollama / TinyLlama | LLM engine (local) | Pre-installed | Unlimited | ✅ Active — tinyllama pulled |
| Wikipedia REST API | Web research context | No key required | Unlimited | Active — self_research_mode=web |
| Pollinations.ai | Image generation | No key required | Free | Active — sdd image command |
| Gemini (consumer app) | Image generation | Google account | 20/day | Manual — no API |
| Bing Image Creator | Image generation | Microsoft account | Generous | Watermarked |
| Ideogram | Image + text-in-image | Free daily credits | Daily limit | Best for text in images |
| Git | Versioning | Pre-installed | Unlimited | Core tool |
| Node.js | Runtime | `pkg install nodejs` | Unlimited | Core tool |

---

## CHANGELOG

| Date | Version | Change | Reason |
|---|---|---|---|
| 2026-06-01 | 5.0.0 | Phase 53 complete — versioned system snapshots live | snapshot.js captures config flags, agent roster, capability count, score averages, provider cascade; writes versions/vX.Y.Z.json on each backup; idempotent — skips if version already snapshotted |
| 2026-05-31 | 4.10.0 | Phase 52 complete — cross-session pattern synthesis live | insight-generator.js derives dimension weakness, score trend, improvement frequency from scores.jsonl + self-improvements.jsonl; appends structured JSON to meta/insights/insights.jsonl; auto-runs on sdd session-end |
| 2026-04-04 | 1.0.0 | Initial living spec from ChatGPT-generated design | Review and optimization by Claude Sonnet 4.6 |
| 2026-04-04 | 1.0.0 | Added `engine/adapter.json` abstraction | Decouple AI engine from orchestrator |
| 2026-04-04 | 1.0.0 | Added root `logs/` directory | Debug layer before meta system exists |
| 2026-04-04 | 1.0.0 | Added `config/mode.json` and `config/system.json` | Config-driven behavior |
| 2026-04-04 | 1.0.0 | Enforced agent folder structure in MVP | Prevent schema drift on expansion |
| 2026-04-04 | 1.0.0 | Adopted git as versioning strategy | Simpler than custom versioning at MVP |
| 2026-04-04 | 1.0.0 | Added skills execution layer to roadmap | Was absent from original design |
| 2026-04-04 | 1.0.0 | Defined `config/focus.json` schema | Prevent ad-hoc config sprawl |
| 2026-04-04 | 1.1.0 | Expanded system scope to general-purpose professional AI platform | User primary objective defined |
| 2026-04-04 | 1.1.0 | Added full 9-agent roster with phased implementation | Scope requires specialized agents |
| 2026-04-04 | 1.1.0 | Added Capability Validation System + knowledge-map.json | System must verify competence before executing |
| 2026-04-04 | 1.1.0 | Added Interactive Negotiation Layer (negotiator.js) | System proposes better alternatives before executing |
| 2026-04-04 | 1.1.0 | Added Self-Research Skill (self-research.js) | Autonomous knowledge acquisition |
| 2026-04-04 | 1.1.0 | Added Controlled Self-Improvement with user approval gate | Improvements proposed, never auto-applied |
| 2026-04-04 | 1.1.0 | Added meta/proposals/ and full proposal lifecycle | Staging area for user-gated improvements |
| 2026-04-04 | 1.1.0 | Added capability/ directory | Structured competence tracking |
| 2026-04-04 | 1.2.0 | Defined multimedia dual-path strategy | Free-only constraint with Hugging Face as API layer |
| 2026-04-04 | 1.2.0 | Added Free Tools Registry | Document all approved free tools and limits |
| 2026-04-04 | 1.2.0 | Set free_only_mode: true in system.json | Enforce free-only constraint at config level |
| 2026-04-04 | 1.2.0 | Defined creator agent structured output format | Tool-agnostic professional multimedia briefs |
| 2026-04-04 | 1.2.0 | Added design principles 9–13 | Codify new behavioral rules |
| 2026-04-05 | 1.3.0 | Phase 1 complete — capability check, negotiation layer, full orchestrator rewrite, Gemini live | All Phase 1 features built and verified in Termux |
| 2026-04-05 | 1.3.0 | Added OpenRouter and Ollama to engine adapter | Multi-provider fallback chain with free-only compliance |
| 2026-04-05 | 1.3.0 | Removed all old flat agent/phase files and duplicate memory module | Clean structure matching spec exactly |
| 2026-04-05 | 1.3.0 | Known limitation noted: negotiator B does not yet modify prompt | Scheduled for Phase 2 |

---

| 2026-04-06 | 1.4.0 | Phase 2 complete — architect, developer, researcher, reviewer agents built | Full agent file set with identity, strategy, constraints |
| 2026-04-06 | 1.4.0 | Agent routing added to main.js | Keyword-based selection, falls back to basic |
| 2026-04-24 | 1.5.0 | Phase 3 complete — 7-stage pipeline system built and verified | propose→spec→design→tasks→apply→verify→archive all live |
| 2026-04-24 | 1.5.0 | pipeline.js — new stage runner with auto-advance, pause, resume, abort | stateful project execution with artifact chaining |
| 2026-04-24 | 1.5.0 | sdd project \ "idea\" and sdd resume <name> commands added to main.js | backward compatible — single-shot mode unchanged |
| 2026-04-06 | 1.4.0 | Negotiator prompt injection implemented | Choosing B now rewrites the task before execution — known limitation resolved |
| 2026-04-24 | 1.6.0 | Phase 4 complete — skills router, registry, and self-research tool live | Task-to-skill matching with context injection into prompt |
| 2026-04-24 | 1.6.0 | skills/registry.json — skill manifest with trigger keywords | Extensible registry for future skills |
| 2026-04-24 | 1.6.0 | skills/router.js — keyword-based skill matcher | Routes tasks to skills before agent execution |
| 2026-04-24 | 1.6.0 | skills/tools/self-research.js — local + optional AI synthesis mode | Scans memory, knowledge map, projects for relevant context |
| 2026-04-24 | 1.6.0 | self_research_enabled and self_research_mode added to system.json | Config-controlled skill activation |
| 2026-04-24 | 1.7.0 | Phase 5 designed — multi-agent chains + per-agent model routing | Dynamic chain selection replaces single-agent routing for single-shot tasks |
| 2026-04-24 | 1.7.0 | orchestrator/chains.js defined — keyword-based chain selector | No extra API call — rule-based by default, reviewer always closes multi-agent chains |
| 2026-04-24 | 1.7.0 | Per-agent model routing added to engine/adapter.json spec | Match model capability to agent role — primary token efficiency mechanism |
| 2026-04-24 | 1.7.0 | Mentorship System defined as first-class goal in Phase 5 | Roadmap-driven, adaptive pacing, Socratic teaching, assessment, job-readiness scoring |
| 2026-04-24 | 1.7.0 | learning/ directory added to canonical structure | Stores roadmaps, progress state, and session logs |
| 2026-04-24 | 1.7.0 | mentor agent elevated from Phase 11 to Phase 5 with full Socratic identity | Exceptional mentorship requires dedicated architecture, not a simple agent swap |
| 2026-04-24 | 1.7.0 | Design principles 14 and 15 added | Codify per-agent model routing and mentorship advancement rules |
| 2026-04-25 | 1.8.0 | Pre-build hardening — 9 improvements identified before Phase 5 code | Analysis of current system + Gemini recommendations |
| 2026-04-25 | 1.8.0 | DeepSeek-R1 added to per-agent model routing for architect, developer, mentor | Native chain-of-thought reasoning on heavy tasks at zero cost |
| 2026-04-25 | 1.8.0 | TRI-STRUCTURE output mandate added to all specialist agent strategies | Forces reasoning before delivery — highest leverage prompt change |
| 2026-04-25 | 1.8.0 | Context compression (500 token cap) defined for inter-agent passing | Keeps prompt size predictable regardless of prior agent verbosity |
| 2026-04-25 | 1.8.0 | Self-critique skill defined — optional post-chain quality pass | Off by default, on for complex tasks when self_critique_enabled |
| 2026-04-25 | 1.8.0 | Task complexity classifier defined in chains.js | Controls model selection and optional steps without extra API calls |
| 2026-04-25 | 1.8.0 | capability-check.js bug: multi-domain tasks now use lowest confidence | First-match-wins was silently skipping low-confidence domains |
| 2026-04-25 | 1.8.0 | capability-check.js bug: resource-log.json missing now handled safely | Previously crashed if file absent or malformed |
| 2026-04-25 | 1.8.0 | prompt.txt chain awareness added — prior_output placeholder defined | Prior agent output was buried in memory with no explicit signal |
| 2026-04-25 | 1.8.0 | Memory compression warning trigger added to saveMemory spec | Enforces 50KB limit defined in SPEC but never implemented |
| 2026-04-25 | 1.8.0 | Design principles 16 and 17 added | Multi-domain capability and self-critique behavioral rules |
| 2026-04-25 | 1.9.0 | Phase 5 complete — multi-agent chains live and verified | REST API design test passed all three agents in sequence |
| 2026-04-25 | 1.9.0 | orchestrator/chains.js — chain selector, complexity classifier, context compressor | Keyword routing, simple/complex signal, 6000 char compression |
| 2026-04-25 | 1.9.0 | skills/tools/self-critique.js — optional post-chain quality pass | Off by default, activated by self_critique_enabled in system.json |
| 2026-04-25 | 1.9.0 | TRI-STRUCTURE mandate added to all specialist agent strategy files | Forces reasoning-first output across all specialist agents |
| 2026-04-25 | 1.9.0 | max_tokens raised to 8192 — architect truncation bug resolved | 2048 limit was cutting complex responses mid-output |
| 2026-04-25 | 1.9.0 | capability-check.js — multi-domain lowest-confidence fix applied | First-match-wins bug silently skipped low-confidence domains |
| 2026-04-25 | 1.9.0 | capability-check.js — resource-log.json safe fallback applied | Crash on missing file resolved with structured fallback |
| 2026-04-25 | 1.9.0 | memory compression 50KB warning active in saveMemory | Warning fires correctly when memory.txt exceeds threshold |
| 2026-04-25 | 1.9.0 | learning/ directory scaffolded — roadmaps, progress, sessions | Ready for Phase 6 mentorship implementation |

| 2026-04-25 | 2.0.0 | Phase 6 complete — scoring system live | Post-execution quality signal for all single-shot tasks |
| 2026-04-25 | 2.0.0 | skills/tools/scorer.js — rule-based scorer, no API call | Scores clarity, usefulness, efficiency, redundancy — overall out of 100 |
| 2026-04-25 | 2.0.0 | meta/scores/scores.jsonl — append-only score log | Feeds Phase 7 meta observation system |
| 2026-04-25 | 2.0.0 | scoring_enabled flag added to system.json | Config-controlled — off by default disables panel and logging |

| 2026-04-26 | 2.1.0 | Phase 7 complete — meta observer and proposal manager live | Pattern detection across score log, staged proposals with Y/N/S/D user gate |
| 2026-04-26 | 2.1.0 | skills/tools/observer.js — detects weak dimensions across last 5 runs | Stages proposals to meta/proposals/ when 3+ of 5 runs fall below threshold |
| 2026-04-26 | 2.1.0 | skills/tools/proposal-manager.js — surfaces proposals after each run | Y=accept, N=dismiss, S=snooze, D=dismiss permanently — user always decides |
| 2026-04-26 | 2.1.0 | meta_observation_enabled flag added to system.json | Config-controlled — disable to silence observer entirely |
| 2026-04-26 | 2.1.0 | Pre-Phase 7 audit — analyst and mentor agents created, missing dirs scaffolded | Gaps found vs SPEC: analyst/mentor had no files, learning/ and meta/ dirs absent |

| 2026-04-26 | 2.1.1 | Phase 7 upgrade — auto-apply on Y, self-commits with git | applier.js applies concrete file edits per dimension on user approval |
| 2026-04-26 | 2.1.1 | skills/tools/applier.js created | Edits agent files, commits with git, logs to meta/logs/self-improvements.jsonl |
| 2026-04-26 | 2.1.1 | proposal-manager.js updated — calls applier on Y | Prints what changed and commit hash after every self-improvement |

| 2026-04-26 | 2.2.0 | Phase 8 complete — postmortem system live | Auto-generates structured postmortem after every pipeline archive stage |
| 2026-04-26 | 2.2.0 | skills/tools/postmortem.js created | Reads project artifacts, generates markdown report to meta/postmortems/ |
| 2026-04-26 | 2.2.0 | pipeline.js patched — calls generatePostmortem after archive in both runPipeline and resumePipeline | Postmortem filepath printed and logged on completion |

| 2026-04-26 | 2.3.0 | Phase 9 complete — drift control and baseline system live | checkDrift compares rolling avg vs baseline, flags regressions of 10+ points |
| 2026-04-26 | 2.3.0 | skills/tools/drift-control.js created | captureBaseline, checkDrift, displayDrift — sdd baseline command locks in current averages |
| 2026-04-26 | 2.3.0 | Self-improvement confirmed working end-to-end | Observer detected efficiency drift, proposal fired, Y applied anti-filler to all 7 agents, auto-committed ebad777 |
| 2026-04-26 | 2.3.0 | meta/logs/self-improvements.jsonl live | Every auto-applied improvement logged with timestamp, proposal ID, and commit hash |

| 2026-04-26 | 2.3.1 | GitHub remote configured — EkisOne-Dev/SDD | Full commit history pushed, git push syncs future changes, git clone restores on new device |
| 2026-04-26 | 2.3.1 | Proposal manager N/S/D options verified | S snoozed efficiency proposal to 2026-05-01, D dismissed test clarity proposal permanently |

| 2026-04-26 | 2.4.0 | Phase 10 complete — cost awareness live | Per-run API call and token tracking, cost panel after each result |
| 2026-04-26 | 2.4.0 | skills/tools/cost-tracker.js created | logCost, displayCost, showTotals — logs to meta/costs/costs.jsonl |
| 2026-04-26 | 2.4.0 | sdd costs command — shows running totals across all tracked runs | Known limitation: input tokens estimated from task string only, not full compiled prompt |

| 2026-04-26 | 2.5.0 | Phase 11 complete — creator and strategist agents live | creator routes on write/generate/draft/content, strategist on strategy/roadmap/plan |
| 2026-04-26 | 2.5.0 | image-gen.js stub created | Pollinations.ai integration planned, returns structured prompt for now |
| 2026-04-26 | 2.5.0 | Chain routing bug fixed — "ad" substring matched inside "roadmap" | Removed "ad" from creative triggers |
| 2026-04-26 | 2.5.0 | Chain order: creative first, then strategy, architecture, development, research, analysis, review | Order matters for keyword priority |

| 2026-04-27 | 2.6.0 | Phase 12 complete — CLI navigation layer live | sdd with no args shows interactive menu, sdd help shows command reference, sdd status shows system snapshot |
| 2026-04-27 | 2.6.0 | orchestrator/menu.js created — showHelp, showStatus, runMenu | readline-based, no new deps, menu passes control back to run() |
| 2026-04-27 | 2.6.0 | run() refactored to accept injectedTask param | menu can call run() directly with user input |

| 2026-04-27 | 2.7.0 | sdd learn command live — mentorship system wired | Roadmap gen via Gemini, Socratic mentor sessions, progress + session persistence, 429 graceful handling |
| 2026-04-27 | 2.7.0 | skills/tools/learner.js — roadmap, progress, session, context builder | All learning state management in one module |
| 2026-04-27 | 2.7.0 | skills/tools/learn-command.js — full learn command handler | Generates roadmap if absent, loads mentor, saves session, advances on "next" |
| 2026-04-27 | 2.7.0 | OpenRouter fallback model updated to llama-3.3-70b-instruct:free | llama-4-scout and llama-3.1-8b removed from free tier |
| 2026-04-27 | 2.7.0 | Score display fixed — reads scores.overall correctly in sdd status | Was reading last.overall, corrected to last.scores.overall |
| 2026-04-27 | 2.7.0 | Image gen live — Pollinations.ai wired, sdd image command added, menu option 8 | URL generated and confirmed loading in browser |

| 2026-04-27 | 2.8.0 | Phase 13 complete — sdd learn session loop live | Session stays open across multiple exchanges until user types "quit" — no re-run required |
| 2026-04-27 | 2.8.0 | quit command fix — no longer saved as learner response | quit/next checked before session save |
| 2026-04-27 | 2.8.0 | Mentor correction directive added to learner.js context | Mentor now calls out wrong answers directly instead of diplomatically accepting them |
| 2026-04-27 | 2.8.0 | quit command fix — no longer saved as learner response | quit/next checked before session save |
| 2026-04-27 | 2.8.0 | Mentor correction directive added to learner.js context | Mentor now calls out wrong answers directly instead of diplomatically accepting them |
| 2026-04-27 | 2.9.0 | Phase 14 complete — sdd projects and sdd postmortems live | Projects listed with stage and completion count, postmortems display latest report |
| 2026-04-27 | 2.9.0 | showProjects and showPostmortems added to menu.js | Menu options 9 and 10 added, help text updated |
| 2026-04-27 | 2.9.0 | showProjects and showPostmortems added to menu.js | Menu options 9 and 10 added, help text updated |
| 2026-04-27 | 3.0.0 | Phase 15 complete — sdd check-engines live | Pings all three providers, reports status, latency, and active provider |
| 2026-04-27 | 3.0.0 | skills/tools/engine-check.js created | Per-provider check functions for Gemini, OpenRouter, Ollama |
| 2026-04-27 | 3.0.0 | OpenRouter fallback corrected to llama-3.3-70b-instruct:free | Was left on llama-3.2-3b from troubleshooting session |
| 2026-04-27 | 3.1.0 | Phase 16 complete — TRI-STRUCTURE suppressed on simple tasks | Complexity classifier injects plain-response directive for simple tasks on specialist agents |
| 2026-04-27 | 3.2.0 | Phase 17 complete — score drift ASCII chart live | 10-run rolling bar chart printed after every scored task, per dimension with average |
| 2026-04-27 | 3.2.0 | displayChart() added to drift-control.js | Pure ASCII, no deps, reads last 10 scores.jsonl entries |
| 2026-04-27 | 3.3.0 | Phase 18 — memory-summarizer.js created | Compresses memory.txt at 40KB threshold, keeps last 5 exchanges verbatim, groups older by topic |
| 2026-04-27 | 3.3.0 | Simple tasks now route to basic agent directly | Avoids TRI-STRUCTURE bleed from specialist agents on simple queries |
| 2026-04-27 | 3.3.0 | TRI-STRUCTURE injection moved to prompt template | buildPrompt() receives complexity and injects correct block via {tri_structure} placeholder |
| 2026-04-27 | 3.3.0 | Reviewer skipped for simple tasks | effectiveAgents collapses to basic for simple complexity |
| 2026-04-27 | 3.3.0 | Phase 18 complete — memory summarization live | Triggers at 40KB, compresses to ~6KB, keeps last 5 exchanges verbatim, backup saved |
| 2026-04-27 | 3.3.0 | TRI-STRUCTURE stripped post-chain for simple tasks | main.js extracts clean answer from model output when reasoning sections present |
| 2026-04-27 | 3.3.0 | Memory summarizer path and call fixed | memAbsPath passed correctly, existsSync guard added |

| 2026-04-29 | 3.3.1 | OpenRouter fallback upgraded to gpt-oss-120b:free | 6x larger than gpt-oss-20b, near-parity with o4-mini on reasoning benchmarks |
| 2026-04-29 | 3.3.1 | Ollama local fallback fully operational | tinyllama installed, serve auto-starts via .bashrc, model name match fixed |
| 2026-04-29 | 3.3.1 | Ollama model override bug fixed | per-agent routing only applies when provider is Gemini |
| 2026-04-29 | 3.3.1 | sdd check-engines Ollama URL and model match fixed | double /api path corrected, tinyllama:latest suffix handled |
| 2026-04-29 | 3.3.1 | Gemma 4 31B added as primary fallback | google/gemma-4-31b-it:free — 256K context, fast instruction following |
| 2026-04-29 | 3.3.1 | gpt-oss-120b demoted to fallback2 | 4-provider cascade: Gemini → Gemma 4 31B → gpt-oss-120b → Ollama |
| 2026-04-29 | 3.3.1 | Automatic provider cascade implemented | runEngine cascades to next provider on 429 or 503, displays model name |
| 2026-04-29 | 3.3.1 | sdd check-engines updated to show all 4 providers | fallback2 row added, filter handles missing providers |
| 2026-05-03 | 3.7.4 | Re-audit fix: orchestrator.js — STD-3 deepseek branch removed, STD-7 loadAgent() cached, STD-2 saveMemory error logged | All 3 issues caught in double-audit |
| 2026-05-02 | 3.7.3 | Phase 35-40 specced — chat mode, file reading, skills command, UX, verified RAG, multi-language | All high-priority improvements roadmapped |
| 2026-05-02 | 3.7.2 | Phase 34 complete — chain-type review_focus injected per reviewer call, routeSkill() best-match | All 6 audit phases complete |
| 2026-05-02 | 3.7.1 | Phase 33 complete — 6 chain contracts, loadPhase() cached (STD-7 fix caught by pre-commit hook) | Hook working as designed |
| 2026-05-02 | 3.7.0 | Phase 32 complete — extractHandoff() active, agents receive Summary+Deliverable not raw blob | Biggest workflow gap closed |
| 2026-05-02 | 3.6.4 | Phase 31 complete — 3-tier complexity: simple/moderate/complex, isLong threshold 60 chars | Moderate runs specialists but skips self-critique |
| 2026-05-02 | 3.6.3 | Phase 30 complete — role-specific memory injection, subsequent agents skip memory block | Token efficiency improved on all multi-agent chains |
| 2026-05-02 | 3.6.2 | Phase 29 complete — STD-3 and STD-4 violations removed from chains.js | finalPrompt alias and agents shadow both eliminated |
| 2026-05-02 | 3.6.1 | Phase 29-34 specced — multi-agent workflow audit complete, 6 improvement phases added to roadmap | Covers STD fixes, memory injection, complexity tiers, structured handoff, chain contracts, reviewer focus |
| 2026-05-01 | 3.6.0 | Phase 28 complete — pre-commit hook blocks STD violations, sdd hook-install/uninstall commands added | hooks/pre-commit + hooks/check.js + hooks/rules.js |
| 2026-05-01 | 3.5.3 | Phase 27 complete — braille spinner animates during engine calls, clears cleanly on result | spinner.js created |
| 2026-05-01 | 3.5.2 | Phase 27-28 specced — visual spinner and pre-commit hook added to roadmap | Inspired by Gentleman Guardian Angel gga architecture |
| 2026-05-01 | 3.5.1 | Add terminal color UI — colors.js utility with semantic scheme | Magenta=skill, Cyan=status, Green=result, Yellow=metrics, Red=warnings, Dim=cost |
| 2026-05-01 | 3.5.0 | Phase 26 complete — negotiator expanded to 15 triggers with best-match scoring | Coverage of real-world tasks dramatically improved |
| 2026-05-01 | 3.4.7 | Phase 25 complete — router.js registry cached at module level | Eliminates redundant disk read on every task |
| 2026-05-01 | 3.4.6 | Phase 24 complete — runStageLoop() extracted, 49 duplicate lines removed from pipeline.js | DRY compliant |
| 2026-05-01 | 3.4.5 | Phase 23 complete — selectChain uses scored best-match, "write a strategy" now correctly routes to strategist | Eliminates first-match misrouting |
| 2026-05-01 | 3.4.4 | Phase 22 complete — pipeline loadMemory now passes task, semantic filter active in all stages | Fix #1 now applies to pipeline runs too |
| 2026-05-01 | 3.4.3 | Phase 21 complete — pipeline logExecution fixed, all calls now template literals | Eliminates [object Object] in pipeline logs |
| 2026-05-01 | 3.4.2 | Code Quality Standards added — 10 permanent engineering principles | Phase 21-26 audit fixes added to roadmap |
| 2026-05-01 | 3.4.1 | Add backup.sh + sdd backup command — git push, SD card .bashrc backup, RESTORE.md | Full system recoverable after Termux uninstall |
| 2026-04-30 | 3.4.0 | Phase 19 complete — post-chain.js extracted from main.js, SRP restored | main.js task block reduced from 60 lines to 3 lines |
| 2026-04-30 | 3.4.0 | Phase 20 complete — validator.js wired into orchestrator.js | Missing/invalid config fields now produce clear error messages and exit cleanly |
| 2026-04-30 | 3.4.0 | Phase 19 complete — post-chain.js extracted from main.js, SRP restored | main.js task block reduced from 60 lines to 3 lines |
| 2026-04-30 | 3.4.0 | Phase 20 complete — validator.js wired into orchestrator.js | Missing/invalid config fields now produce clear error messages and exit cleanly |
| 2026-04-30 | 3.3.9 | Phase 19 + 20 planned — main.js decomposition and schema validation added to roadmap | Code quality audit identified SRP violation and missing runtime validation |
| 2026-04-30 | 3.3.8 | Fix #5: web search layer added to self-research — Wikipedia REST API, no key required | Two-step search+summary, 500 char cap, silent fail if offline |
| 2026-04-30 | 3.3.7 | Fix #4: TRI-STRUCTURE strip upgraded to regex [ARTIFACT] extraction — heuristic as fallback | Eliminates stray bullet/header lines in simple task output |
| 2026-04-30 | 3.3.6 | Improve: score trend chart — bars replaced with number grid | Compact, precise, shows exact values not approximations |
| 2026-04-30 | 3.3.5 | Fix #3: scorer bias removed — short precise answers score fairly | Clarity base 60, formatting optional bonus, length bias removed from usefulness and efficiency |
| 2026-04-30 | 3.3.4 | Fix #2: cost tracker now measures full compiled prompt — input tokens accurate | Was counting task string only (~9 tokens) — now counts full prompt chars (~1184 tokens) |
| 2026-04-30 | 3.3.3 | Fix #1: semantic memory retrieval — keyword filter, last 5 verbatim + top 3 relevant, 2000 char cap | Eliminates full flat-file injection — 88% token reduction on real memory file |
| 2026-04-29 | 3.3.2 | Groq added as fallback3 — llama-3.3-70b-versatile | Independent rate limit pool, ~315 TPS on LPU hardware |
| 2026-04-29 | 3.3.2 | Cerebras added as fallback4 — qwen-3-235b-a22b-instruct-2507 | 1M tokens/day free, 235B model |
| 2026-04-29 | 3.3.2 | runOpenAICompatible() added to orchestrator.js | Single runner for all OpenAI-compatible providers |
| 2026-04-29 | 3.3.2 | sdd check-engines updated to show all 6 providers | Groq and Cerebras rows added |
| 2026-04-29 | 3.3.2 | 6-provider cascade active — Gemini → Gemma 4 31B → gpt-oss-120b → Groq → Cerebras → Ollama | Auto-cascades on 429/503, displays model name on switch |

| 2026-05-30 | 4.5.0 | Cascade restructure — 7-provider online cascade live | Gemini Flash-Lite (primary) → Gemini Flash → Groq → OR Gemma4 → OR GPT-OSS → Cerebras → Ollama |
| 2026-05-30 | 4.5.0 | Groq restored as fallback2 — llama-3.3-70b-versatile | Independent rate limit pool from OpenRouter |
| 2026-05-30 | 4.5.0 | Gemini Flash added as fallback — complex agent tier | 250 RPD, 10 RPM — higher capability than Flash-Lite |
| 2026-05-30 | 4.5.0 | Mistral Codestral added — developer agent override | mistral_codestral key in adapter.json; agent_models.developer all tiers → codestral-latest |
| 2026-05-30 | 4.5.0 | runEngine() agent override logic upgraded | Full provider config swap (not model-only); agentOverrideKey starts providerChain at override slot |
| 2026-05-30 | 4.5.0 | fallback5 added to providerChain — was missing from cascade | Cerebras now reachable; gpt-oss-120b used (qwen3-235b-a22b not available on account) |
| 2026-05-30 | 4.5.0 | engine-check.js rebuilt for 8-provider display | All providers correctly labeled and routed to matching check function |
| 2026-05-30 | 4.5.0 | GROQ_API_KEY + MISTRAL_API_KEY added to .bashrc | Both keys loaded and verified active |

*End of SPEC.md — Update this document before ending any session that produces a structural or design decision.*
| 2026-05-25 | 3.8.0 | Phase 41 complete — constitution.md, featurelist.json, history.md created | Harness foundation established |
| 2026-05-25 | 3.8.0 | Phase 42 complete — start.sh calibration upgrade, backup.sh extended | Calibration checks Node.js, git, required files, Ollama. Backup now stages SPEC.md, CAPABILITIES.md, constitution.md, featurelist.json, history.md |
| 2026-05-25 | 3.9.0 | Phase 43 complete — skills/library/ created with 6 markdown skill files | intent-parser, spec-clarifier, guardian-angel, git-delivery, context-compaction, self-audit |
| 2026-05-25 | 3.9.0 | registry.json expanded to 7 skills with library_file references | Future skills load full markdown instructions dynamically |
| 2026-05-25 | 3.9.0 | router.js extended — loadSkillContent() loads markdown when skill matched | Skills now carry full instruction content alongside metadata |
| 2026-05-25 | 3.9.1 | Phase 44 complete — intent parser wired | phi4-mini normalizes ambiguous tasks (>15 words or vague language) to structured JSON before agent execution |
| 2026-05-25 | 3.9.1 | intent_parser_enabled flag added to system.json | Default false — enabled true after verification |
| 2026-05-25 | 4.0.0 | Phase 45 complete — task-aware local model router live | local_first routes by chain type: development→qwen2.5-coder, creative→qwen2.5, strategy→qwen3.5, review→deepseek-coder, others→qwen2.5 |
| 2026-05-25 | 4.0.0 | Per-model skill files created — 5 model-specific instruction files in skills/library/ | phi4-mini, qwen2.5-coder, deepseek-coder, qwen2.5, qwen3.5 |
| 2026-05-25 | 4.0.0 | OLLAMA_MAX_LOADED_MODELS=1 set — single model in RAM at a time for peak performance | tryLocalFirst falls through to online cascade on failure |
| 2026-05-27 | 4.1.0 | Phase 46 complete — per-model context budget active | context_limit added to all providers in adapter.json; trimToContextBudget() trims oldest memory first; silent when under limit, warns when trim fires |

---

## PHASE 47–47c ROADMAP: COGNITIVE UPGRADE SUITE

### Phase 47 — Skill Architecture Rebuild
| Item | Description |
|---|---|
| spec-clarifier.md | Schema Alpha — pre-chain: forces assumption surfacing, ranked clarifying questions, stated working intent before execution |
| guardian-angel.md | Schema Alpha — post-chain: checks output answers actual task, flags unverified claims, identifies failure modes. Never rewrites — flags only |
| assumption-extractor.md | Schema Beta sub-skill — atomic: extracts every unstated assumption from a task statement, returns structured list |
| failure-mode-scanner.md | Schema Beta sub-skill — atomic: identifies top 3 failure modes in a proposed solution, returns ranked list |
| registry.json upgrade | Add priority, conflict_resolution, dependencies fields to all entries |
| router.js Alpha/Beta composition | System-layer skill composition — router assembles Alpha + Beta content before buildPrompt(); no model token-emission required |
| Wire spec-clarifier | main.js — triggers pre-chain on complex/ambiguous tasks |
| Wire guardian-angel | post-chain.js — triggers post-result before display |

### Phase 47b — Agent Cognitive Upgrades
| Item | Description |
|---|---|
| architect/strategy.txt | Explicit decomposition algorithm: component isolation → dependency mapping → failure surface analysis |
| developer/strategy.txt | Root-cause protocol: symptom → cause chain → side-cause scan → solution ranked by risk |
| reviewer/strategy.txt | Assumption audit + failure mode analysis: list assumptions → invert each → identify what breaks |
| strategist/strategy.txt | Multi-dimensional evaluation: feasibility × risk × resource × timeline × second-order effects |
| All agents | Add confidence/uncertainty declaration: rate every factual claim HIGH/MEDIUM/LOW, flag MEDIUM and LOW explicitly |
| All skill library files | Enforce imperative voice (YOU MUST / NEVER) and ≤1500 char cap across all 11 files |

### Phase 47c — Context and Hallucination Hardening
| Item | Description |
|---|---|
| num_ctx per model | Add num_ctx to adapter.json per Ollama model; pass in runOllama() API call — unlocks full model context (currently defaults to 2048) |
| qwen3.5:0.8b budget fix | Correct context_limit from 32000 → 4000 in adapter.json |
| compressPrompt() | Strip redundant whitespace and markdown formatting from injected blocks before buildPrompt(); recovers ~10-15% context budget |
| Uncertainty enforcement | Guardian-angel explicitly checks for unverified MEDIUM/LOW confidence claims and routes them to self-research |

### Design Principles Anchored by This Suite
- Alpha skills own a full execution phase. Beta skills do one atomic thing and return clean output.
- System layer composes Alpha+Beta — models never emit structural routing tokens.
- Hallucination defense is layered: confidence declaration (agent) → claim flagging (guardian-angel) → grounding (self-research).
- Context budget is enforced at three levels: per-model limit (Phase 46), prompt compression (Phase 47c), semantic retrieval (Phase 49).
- Every strategy.txt file uses hard imperatives — no conversational guidance.

| 2026-05-27 | 4.1.0 | Phase 47 complete — skill architecture rebuild live | spec-clarifier + guardian-angel wired (Alpha); assumption-extractor + failure-mode-scanner (Beta); registry.json upgraded with priority/conflict_resolution/dependencies; composeSkillBlock() active in router.js |
| 2026-05-29 | 4.3.0 | Routing: online-first architecture adopted | local_first: false; Groq + tinyllama removed; Cerebras model string corrected; local_fallback → qwen2.5:7b; ollama_model_config added with num_ctx per model |
| 2026-05-29 | 4.4.0 | Phase 48 complete — sdd session-end live | AI-generated session summary from git log + SPEC changelog appended to history.md; skills/tools/session-end.js created; command wired in main.js |
| 2026-05-29 | 4.3.0 | Phase 47c complete — context + hallucination hardening live | num_ctx per Ollama model in adapter.json; runOllama() passes num_ctx via options{}; compressPrompt() strips markdown/whitespace from memory/strategy/identity/prior_output blocks before buildPrompt(); qwen3.5:0.8b context_limit corrected 32000→4000 |
| 2026-05-29 | 4.3.0 | Phase 47c-prime scoped — Universal Thinking Protocol | Harness-engineering approach: model-agnostic analytical scaffold injected into all buildPrompt() calls regardless of provider. Deferred to dedicated phase. |
| 2026-05-27 | 4.2.0 | Phase 47b complete — agent cognitive upgrades live | architect/developer/reviewer/strategist strategy.txt rewritten with explicit algorithms: decomposition, root-cause, assumption-inversion, 5-dimension evaluation |
| 2026-05-27 | 4.2.0 | Confidence declaration added to all 9 agent strategy.txt files | HIGH/MEDIUM/LOW rating required before every factual claim; MEDIUM and LOW must be flagged explicitly |
| 2026-05-27 | 4.2.0 | Imperative voice enforced across all 13 skill library files | YOU MUST / NEVER conventions applied; all files verified ≤1500 chars |

---

## PLANNED PHASES — Post-51 Roadmap

### Phase 52 — Cross-Session Pattern Synthesis (meta/insights/)
| Item | Description |
|---|---|
| meta/insights/ | Directory for synthesized cross-session patterns derived from postmortems + score trends |
| insight-generator.js | Reads meta/logs/ + meta/scores/scores.jsonl; derives patterns: agent underperformance, task-type score trends, cascade failure rates |
| Wire to meta observer | Observer appends raw insight candidates; generator synthesizes on sdd session-end |
| Output format | Structured JSON per insight: pattern, evidence, confidence, recommended_action |

**Value:** Makes self-improvement loop data-driven. Currently the meta observer logs events but never synthesizes. Insights directly inform proposal generation.

### Phase 53 — Versioned System Snapshots (versions/)
| Item | Description |
|---|---|
| versions/ | Directory for structured per-version JSON snapshots |
| snapshot.js | On each version bump: captures active config, agent roster, capability count, score averages, known issues, active flags |
| Wire to backup.sh | Snapshot generated automatically on sdd backup when version changed |
| Output format | versions/v4.8.0.json etc — enables structured regression comparison |

**Value:** Not redundant with git. Git stores file diffs; snapshots store processed system state at a point in time. Enables: "compare current behavior to v4.5.0" without parsing git history.

### Phase 54 — Insights Command (sdd insights)
| Item | Description |
|---|---|
| sdd insights | Reads meta/insights/insights.jsonl; prints all active signals with confidence + recommended_action |
| Stale detection | Flags insights older than 10 sessions as stale — prevents acting on outdated patterns |
| Observer feed | Observer reads insights.jsonl as additional proposal context — enables pattern-driven proposals instead of single-event reactions |
| session-end context | Active insights injected as context into the AI session summary prompt |

**Value:** Closes the insight loop. Currently insight-generator writes findings that nothing reads back. This command surfaces signals on demand and feeds them into the proposal generation cycle — turning pattern detection into pattern-driven self-improvement.

---

## COGNITIVE FIT MODEL ARCHITECTURE (Established Phase 47b)

### Design Priority Order
1. Cognitive fit — model behavioral profile matched to agent's reasoning requirement
2. RAM economy — model size relative to 12GB device RAM
3. Swap minimization — same-model agents grouped to reduce load events

### Model Roster (Cleaned)
| Model | Size | Cognitive Profile |
|---|---|---|
| qwen3:8b | ~5GB | Strong reasoner, agentic, complex synthesis — pending pull |
| qwen2.5-coder:7b | ~4.5GB | Code-specific, deterministic, strict formatting |
| qwen2.5:7b | ~4.5GB | Stable, factual, low creative drift — research/fallback |
| gemma3:4b | ~2.6GB | Fluent, natural language, ideation |
| phi4-mini:3.8b-q4_K_M | ~2.4GB | Analytical decomposition, logical coherence, contradiction detection |
| qwen3.5:0.8b | ~0.6GB | Fast classifier, routing, intent parsing only |
| nomic-embed-text | ~0.3GB | Embeddings only — Phase 49 semantic retrieval |

### Cognitive Role Assignments
| Role | Model | Reason |
|---|---|---|
| Router / classifier | qwen3.5:0.8b | Speed + classification only |
| Architect | qwen3:8b | Best local reasoner, multi-step planning |
| Strategist | qwen3:8b | Same profile as architect — zero swap |
| Developer | qwen2.5-coder:7b | Code-trained, deterministic output |
| Researcher | qwen2.5:7b | Stable, factual, minimal drift |
| Reviewer | phi4-mini:3.8b-q4_K_M | Logical coherence, assumption detection |
| Validator | phi4-mini:3.8b-q4_K_M | Same model as reviewer — zero swap |
| Creator | gemma3:4b | Fluency and natural language generation |
| Embeddings | nomic-embed-text | Purpose-built, no substitution |

### Swap Minimization Strategy
- Architect + Strategist: both qwen3:8b — no swap between passes
- Reviewer + Validator: both phi4-mini — no swap between passes
- Net swap events per complex chain: 2–3 (down from 4–5)

### OLLAMA_MAX_LOADED_MODELS=1 Policy
One model loaded in RAM at a time. Models swap sequentially between agent calls.
Swap cost: ~15–30 seconds load spike per model change. Acceptable tradeoff for cognitive quality.
Thermal impact: controlled — vapor chamber handles sequential load spikes safely.

### Pending Changes (Phase 47b)
- Pull qwen3:8b — replaces qwen2.5:7b in architect/strategist slots
- Update local_model_routing in adapter.json to match role table
- Add validator chain type to chains.js (phi4-mini analytical pass after reviewer)
- Remove phi4-mini:latest tag (keep q4_K_M only)
| 2026-05-27 | 4.2.0 | Phase 47b complete — cognitive fit model architecture live | qwen3:8b pulled; local_model_routing updated to cognitive fit table; validator agent created; validator injected post-reviewer on complex chains; phi4-mini assigned to review/validate/analysis roles |

---

## ENGINE ADAPTER — agent_models Key

The `agent_models` block in `engine/adapter.json` maps specific agent roles to provider override configs. When an agent name matches a key in `agent_models`, `runEngine()` performs a full provider config swap before the API call — replacing the cascade default with the agent-specific provider. Currently active override: developer → mistral_codestral (codestral-latest). This is the mechanism that powers the Mistral Codestral developer override (Capability #51).

```json
"agent_models": {
  "developer": "mistral_codestral"
}
```

---

## KNOWN ISSUES — Pending Phase 51 Review

| ID | Issue | Discovered | Fix Scope |
|---|---|---|---|
| C-001 | ~~registry.json: intent-parser has enabled:false~~ | Audit 2026-05-30 | ✅ Fixed — registry.json enabled: true but system.json has intent_parser_enabled:true — router never fires intent parser despite config | Audit 2026-05-30 | Fix registry.json |
| C-002 | ~~registry.json: context-compaction has enabled:false~~ | Audit 2026-05-30 | ✅ Fixed — registry.json enabled: true — Phase 48 complete and active, session-end never skill-routed | Audit 2026-05-30 | Fix registry.json |
| C-003 | ~~registry.json: self-audit entry points to tools/self-audit.js~~ | Audit 2026-05-30 | ✅ Fixed — corrected to tools/audit.js — actual file is tools/audit.js | Audit 2026-05-30 | Fix registry.json |
| C-004 | ~~registry.json: semantic-memory (Phase 49) not registered~~ | Audit 2026-05-30 | ✅ Fixed — entry added to registry.json — router cannot match or compose it | Audit 2026-05-30 | Add to registry.json |
| C-006 | ~~Pre-commit hook exists at hooks/pre-commit but not installed~~ | Audit 2026-05-30 | ✅ Fixed — installed to .git/hooks/pre-commit to .git/hooks/ — never fires on commits | Audit 2026-05-30 | Copy/symlink to .git/hooks/pre-commit |
| I-005 | ~~engine/adapter.json: agent_models key present but undocumented~~ | Audit 2026-05-30 | ✅ Fixed — documented in ENGINE ADAPTER section in SPEC.md or CAPABILITIES.md | Audit 2026-05-30 | Document in SPEC.md engine adapter section |
| I-006 | ~~mode.json: active_mode is fast~~ | Audit 2026-05-30 | ✅ Fixed — documented in System Behaviors — disables validation, evaluation, multi-agent chains. Not documented as active system behavior | Audit 2026-05-30 | Document in System Behaviors section |
| I-007 | ~~skills/library/: model-gemma3.md missing~~ | Audit 2026-05-30 | ✅ Fixed — model-gemma3.md created — gemma3:4b assigned to creator agent but has no per-model skill file | Audit 2026-05-30 | Create model-gemma3.md |
| M-001 | ~~skills/registry.json: spec-clarifier + guardian-angel library_file paths~~ | Audit 2026-05-30 | ✅ Fixed — paths normalized use inconsistent prefix format | Audit 2026-05-30 | Normalize paths |
| KI-001 | ~~Validator receives reviewer's audit output rather than synthesized design~~ | Phase 47b test | ✅ Fixed Phase 51 — preReviewerOutput tracker + structured [DESIGN TO VALIDATE] handoff |

### KI-001 Detail
**Symptom:** On complex chains, the validator agent receives the reviewer's critique/audit
as its input rather than the final synthesized design artifact. Guardian-angel flagged this
as TASK MISALIGNMENT — "the output is an audit of a design, not the design itself."

**Root cause:** extractHandoff() passes the reviewer's full output to the next agent.
The reviewer produces a structured audit (INTERNAL REASONING + ARTIFACT + VERIFICATION)
but the handoff summary captures the critique layer, not the clean ARTIFACT block.

**Expected behavior:** Validator should receive the ARTIFACT section of the reviewer's
output only — the synthesized, corrected design — not the surrounding audit commentary.

**Fix direction:** extractHandoff() should extract [ARTIFACT] block specifically when
handing off to validator, rather than passing the full reviewer output summary.

**Files to inspect:** orchestrator/chains.js → extractHandoff()
