# SDD — Structured Development System
**Version:** 2.7.0 | **Platform:** Android / Termux | **Runtime:** Node.js

## What it is
A portable general-purpose AI platform running entirely on mobile hardware using free tools and APIs.

## Commands
| Command | Description |
|---|---|
| `sdd "task"` | Run a single task through the agent chain |
| `sdd project "idea"` | Start a 7-stage pipeline project |
| `sdd resume <name>` | Resume a paused project |
| `sdd learn "topic"` | Start or continue a Socratic learning session |
| `sdd learn` | List active roadmaps and progress |
| `sdd image "description"` | Generate an image via Pollinations.ai |
| `sdd costs` | Show API cost totals |
| `sdd baseline` | Lock current score averages for drift tracking |
| `sdd status` | System snapshot (score, proposals, costs, git) |
| `sdd help` | Full command reference |
| `sdd` | Interactive menu |

## Agent Roster
`basic` `architect` `developer` `analyst` `researcher` `reviewer` `mentor` `creator` `strategist`

## Active Systems
- Multi-agent chains with per-agent model routing
- Capability check + negotiation layer
- Skills router + self-research
- Scoring → observer → proposals → auto-apply
- Postmortem (pipeline), drift control, cost tracking
- Mentorship system (roadmap-driven, Socratic)
- Image generation (Pollinations.ai, no key required)
- CLI navigation layer

## Entry Point
Always use `start.sh` — never call internal files directly.

## Spec
See `SPEC.md` for full architecture, design principles, and changelog.
