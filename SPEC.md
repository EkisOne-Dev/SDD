| 2026-04-29 | 3.3.2 | Groq added as fallback3 — llama-3.3-70b-versatile | Independent rate limit pool, ~315 TPS on LPU hardware, no credit card |
| 2026-04-29 | 3.3.2 | Cerebras added as fallback4 — qwen-3-235b-a22b-instruct-2507 | 1M tokens/day free, 235B model, OpenAI-compatible |
| 2026-04-29 | 3.3.2 | runOpenAICompatible() added to orchestrator.js | Single runner for Groq, Cerebras, and any future OpenAI-compatible provider |
| 2026-04-29 | 3.3.2 | 6-provider cascade active — Gemini → Gemma 4 31B → gpt-oss-120b → Groq → Cerebras → Ollama | Auto-cascades on 429/503, displays model name on switch |
| 2026-04-29 | 3.3.2 | sdd check-engines updated to show all 6 providers | Groq and Cerebras rows added with checkOpenAICompatible function |
| 2026-04-29 | 3.3.2 | Document version updated to 3.3.2 | Reflects provider stack expansion |
