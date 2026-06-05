# SDD — Structured Development System
**Version:** 5.11.0 | **Platform:** Android / Termux | **Runtime:** Node.js

## What it is
A portable general-purpose AI orchestration platform running entirely on mobile hardware using free tools and APIs. Executes multi-agent AI workflows for system design, development, research, analysis, mentorship, and creative tasks.

## Architecture
- **7-provider online cascade:** Gemini Flash-Lite → Gemini Flash → Groq Llama 3.3 70B → OR Gemma4 31B → OR GPT-OSS 120B → Cerebras GPT-OSS 120B → Ollama (emergency fallback)
- **10 specialist agents:** basic, architect, developer, analyst, researcher, reviewer, mentor, creator, strategist, validator
- **Mistral Codestral override:** developer agent always routes to codestral-latest
- **Semantic memory:** nomic-embed-text embeddings via Ollama — top-5 cosine similarity retrieval per task
- **Universal Thinking Protocol:** analytical scaffold injected into every prompt — silent confidence calibration, assumption surfacing, failure mode detection
- **Skill architecture:** spec-clarifier (pre-chain), guardian-angel (post-chain), Alpha/Beta composition
- **KI-001 resolved:** validator receives pre-reviewer design artifact + reviewer findings, not audit alone

## Entry point
```bash
sdd "your task"          # single-shot execution
sdd audit <keyword>      # audit capability by name or number
sdd session-end          # generate session summary → history.md
sdd index-memory         # batch embed memory entries for semantic retrieval
sdd check-engines        # verify all provider connectivity
```

## System state
| Item | Value |
|---|---|
| Phases complete | 0–51 + 47b/47c/47c-prime/48 |
| Capabilities | 57 active, 2 planned (52, 53) |
| Verified checks | 62/62 |
| Known issues | 0 open |
| Last session | 2026-06-05 |

## Key files
| File | Role |
|---|---|
| SPEC.md | Living spec — single source of truth |
| CAPABILITIES.md | Full capability registry (57 entries) |
| constitution.md | Inviolable system rules |
| featurelist.json | Phase + feature tracking |
| engine/adapter.json | Provider cascade config |
| config/system.json | All behavioral flags |
