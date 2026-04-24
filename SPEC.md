# SDD LIVING SPEC — Authoritative Reference Document
> Paste this file at the start of every session to maintain coherency.
> Update the CHANGELOG section after every meaningful decision or change.
> This document is the single source of truth for the entire SDD lifecycle.

---

## DOCUMENT METADATA

| Field | Value |
|---|---|
| Document Version | 1.6.0 |
| System Version | MVP → Phase 4 Complete |
| Last Updated | 2026-04-24 |
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
| `mentor` | Teaching, structured learning, guidance, explanations | Phase 3 |
| `creator` | Multimedia content, exhaustive structured prompts | Phase 3 |
| `strategist` | Planning, roadmaps, prioritization, decision frameworks | Phase 3 |

**RULE:** Agents perform thinking only. They do NOT control execution flow.
**RULE:** `researcher` and `reviewer` serve all other agents — prioritize their implementation.
**RULE:** All agent folders exist in the directory structure from initial scaffold.

---

### PHASES
**Path:** `phases/<phase-name>/`

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

---

## DEVELOPMENT ROADMAP

| Phase | Feature | Status |
|---|---|---|
| 0 | MVP baseline (CLI, orchestrator, single agent, memory, config) | ✅ Complete |
| 1 | Preflight + Capability Validation + Negotiation Layer | ✅ Complete |
| 2 | Full agent roster (architect, developer, researcher, reviewer) + negotiator prompt injection | ✅ Complete |
| 3 | Real phase system (propose→spec→design→tasks→apply→verify→archive) | ✅ Complete |
| 4 | Skills execution layer (router + self-research) | ✅ Complete |
| 5 | Multi-agent orchestration | 🔲 Planned |
| 6 | Scoring system (clarity, usefulness, efficiency, redundancy) | 🔲 Planned |
| 7 | Meta system + Controlled self-improvement proposal system | 🔲 Planned |
| 8 | Postmortem system | 🔲 Planned |
| 9 | Drift control (baseline comparison) | 🔲 Planned |
| 10 | Cost awareness (token + API call tracking) | 🔲 Planned |
| 11 | Full agent roster expansion (mentor, creator, strategist) + image-gen skill | 🔲 Planned |
| 12 | CLI navigation layer | 🔲 Future |

---

## KNOWN LIMITATIONS (Current)

- Single-agent execution only (no multi-agent coordination yet)
- No scoring, meta learning, or improvement proposals
- Self-research local mode only surfaces what already exists in memory/projects
- No versioning UI (git only)
- Limited error handling (API safety filter rejections show generic error)
- Memory is a single flat file — no semantic retrieval
- Multimedia: structured output only until Phase 11
- Video and audio: structured output only — no local processing on mobile
- Log date reflects device timezone (expected behavior)

---

## FREE TOOLS REGISTRY

| Tool | Purpose | Access | Limit | Notes |
|---|---|---|---|---|
| Gemini 2.5 Flash Lite | LLM engine (primary) | GEMINI_API_KEY | Quota-based | Active |
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

*End of SPEC.md — Update this document before ending any session that produces a structural or design decision.*
