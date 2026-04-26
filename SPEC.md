# SDD LIVING SPEC — Authoritative Reference Document
> Paste this file at the start of every session to maintain coherency.
> Update the CHANGELOG section after every meaningful decision or change.
> This document is the single source of truth for the entire SDD lifecycle.

---

## DOCUMENT METADATA

| Field | Value |
|---|---|
| Document Version | 1.9.0 |
| System Version | MVP → Phase 5 Complete |
| Last Updated | 2026-04-25 |
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

---

## CANONICAL DIRECTORY STRUCTURE

```
~/sdd/
├── SPEC.md                        ← THIS FILE — living spec anchor
├── README.md                      ← Human-readable system state summary
├── start.sh                       ← SOLE entry point (do not call internals directly)
├── logs/                          ← System-level execution logs (root debug layer)
│   └── YYYY-MM-DD.log
├── orchestrator/
│   ├── main.js                    ← Core entry logic
│   ├── chains.js                  ← Phase 5 — multi-agent chain runner
│   └── orchestrator.js            ← All system functions
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
│   └── strategist/                ← Planning, roadmaps, decisions
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
│       ├── self-critique.js      ← ✅ Active — Phase 5
│       └── image-gen.js           ← Phase 11
├── memory/
│   ├── core/
│   ├── patterns/
│   ├── projects/
│   ├── temporary/
│   ├── summaries/
│   └── memory.txt                 ← Active flat file memory
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
│   ├── insights/
│   ├── postmortems/
│   ├── baselines/
│   ├── proposals/
│   └── costs.json
├── capability/
│   ├── knowledge-map.json         ← ✅ Active — domain competence index
│   └── resource-log.json          ← ✅ Active — logs external resource fetches
├── learning/
│   ├── roadmaps/              ← User-provided field roadmaps (JSON)
│   ├── progress/              ← Per-roadmap learner state and position
│   └── sessions/              ← Session logs with topic, response, assessment
├── versions/
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
**Compression:** Manual summarization when file exceeds ~50KB

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

**Provider priority:**
1. `primary` — Gemini 2.5 Flash Lite (default)
2. `fallback` — OpenRouter / Llama 4 Scout (free)
3. `local_fallback` — Ollama / TinyLlama (offline, install when needed)

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
| 8 | Postmortem system | 🔲 Planned |
| 9 | Drift control (baseline comparison) | 🔲 Planned |
| 10 | Cost awareness (token + API call tracking) | 🔲 Planned |
| 11 | creator + strategist agents + image-gen skill (mentor already built in Phase 5) | 🔲 Planned |
| 12 | CLI navigation layer | 🔲 Future |

---

## KNOWN LIMITATIONS (Current)

- Mentorship system (sdd learn) not yet implemented (Phase 6)
- No scoring, meta learning, or improvement proposals
- Self-research local mode only surfaces what already exists in memory/projects
- No versioning UI (git only)
- Limited error handling (API safety filter rejections show generic error)
- DeepSeek-R1 endpoint temporarily unavailable on OpenRouter — falls back to gemini-2.5-flash for complex agents

- Memory is a single flat file — no semantic retrieval
- Multimedia: structured output only until Phase 11
- Video and audio: structured output only — no local processing on mobile
- Log date reflects device timezone (expected behavior)

---

## FREE TOOLS REGISTRY

| Tool | Purpose | Access | Limit | Notes |
|---|---|---|---|---|
| Gemini 2.5 Flash Lite | LLM engine (primary) | GEMINI_API_KEY | Quota-based | Active |
| DeepSeek-R1 (via OpenRouter) | Heavy reasoning — architect, developer, mentor | OPENROUTER_API_KEY | Free tier | Phase 5 — per-agent routing |
| OpenRouter / Llama 4 Scout | LLM engine (fallback) | OPENROUTER_API_KEY | Free tier | Active in adapter |
| Ollama / TinyLlama | LLM engine (local) | `pkg install ollama` | Unlimited | Install when needed |
| Hugging Face Inference API | Image generation | Free account + HF_TOKEN | Rate limited | Phase 11 |
| Gemini (consumer app) | Image generation | Google account | 20/day | Manual — no API |
| Bing Image Creator | Image generation | Microsoft account | Generous | Watermarked |
| Ideogram | Image + text-in-image | Free daily credits | Daily limit | Best for text in images |
| Git | Versioning | Pre-installed | Unlimited | Core tool |
| Node.js | Runtime | `pkg install nodejs` | Unlimited | Core tool |

---

## CHANGELOG

| Date | Version | Change | Reason |
|---|---|---|---|
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

*End of SPEC.md — Update this document before ending any session that produces a structural or design decision.*
