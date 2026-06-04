---
name: model-routing
description: Pick the right Claude model (Opus, Sonnet, Haiku) for a task and manage cost — decision matrix, cost tables, budget planning, cascading strategy. Use this skill whenever choosing a model, setting a token budget, optimizing session cost, or deciding whether to upgrade/downgrade mid-task. Triggers on: "which model", "cost", "budget", "haiku vs sonnet", "opus for this", "save tokens", "model cascading", "/cc-budget".
---

# Model Routing

Claude model choice is the biggest cost lever in Claude Code. Match the model to the work.

## Decision matrix

| Task type | Model | Why |
|---|---|---|
| Architecture decision | Opus | Multi-step reasoning; hidden-cost detection |
| Root-cause debugging (hard) | Opus | Hypothesis trees, multi-source evidence |
| Security review | Opus | Risk sensitivity; knowledge of OWASP/CWE |
| Feature implementation | Sonnet | Standard generation; good reasoning |
| Code review (routine PR) | Sonnet | Fast; catches most issues |
| Test writing | Sonnet | Pattern-based |
| Research / docs lookup | Haiku | Fast; cheap; sufficient for retrieval |
| Bulk file edits (rename, reformat) | Haiku | Mechanical work |
| Dependency audit | Haiku | Running commands, parsing output |
| Simple Q&A | Haiku | One-shot factual answers |

## Cost table (approximate, check `cc_docs_model_recommend` for current)

| Model | Alias / ID | Input $/M | Output $/M | Relative |
|---|---|---|---|---|
| Opus 4.8 | `opus` / `claude-opus-4-8` | ~$15 | ~$75 | 5× |
| Sonnet 4.6 | `sonnet` / `claude-sonnet-4-6` | ~$3 | ~$15 | 1× |
| Haiku 4.5 | `haiku` / `claude-haiku-4-5-20251001` | ~$0.80 | ~$4 | 0.3× |

Output tokens are the dominant cost in most Claude Code sessions. Opus is ~5× the cost but ~2× the capability on hard tasks — use it where the capability matters.

**Aliases auto-resolve to the latest generation** — prefer `opus`/`sonnet`/`haiku` over pinned IDs so a model refresh doesn't strand your config. Use `opusplan` for Opus-reasoning + Sonnet-execution, or `best` for "most capable available". Extended 1M-token context: `opus[1m]` / `sonnet[1m]`.

**Fast mode** (`/fast` in-session, `--fast` at launch) keeps you on Opus (4.6/4.7/4.8) but optimizes for faster output — it does **not** downgrade to a smaller model. Toggle it when you want Opus-level reasoning without the usual latency.

**Effort levels** scale reasoning depth independently of model: `low` · `medium` · `high` · `xhigh` · `max` (Opus 4.7/4.8 add `xhigh`). Set via `/effort`, `--effort <level>`, or `effort:` in skill/agent frontmatter — cheaper than jumping a model tier when you just need deeper thinking.

## Model cascading

The high-leverage pattern: start with a cheap model for planning, delegate implementation to cheap, reserve Opus for review gates.

| Phase | Model |
|---|---|
| Plan mode (Shift+Tab) | Opus |
| Implementation | Sonnet |
| Subagent research | Haiku |
| Code review gate | Opus |
| Final sign-off | Opus |

Net effect: most tokens are on Sonnet/Haiku; Opus tokens are where they matter most.

## Budget planning

For a task estimated at N turns:

- Rough floor: 2k input + 2k output per turn = 4k tokens.
- Sonnet cost: 4k × $3/M = $0.012 per turn.
- 20-turn session on Sonnet: ~$0.24.
- Add 3 Opus review passes: +$0.45.
- Total: ~$0.70.

Use `cc_docs_model_recommend(task, budget)` to get a specific recommendation with cost projection.

## Downgrade/upgrade triggers

**Downgrade to Haiku when**:
- Doing pure retrieval (grep results, file reads).
- Running a known command and parsing output.
- Rate-limited on Sonnet budget.

**Upgrade to Opus when**:
- Sonnet gets it wrong twice on the same subtask.
- Task is security-critical.
- Stakeholder cost of error is ≥ days of engineer time.
- You're designing something new (vs. implementing something known).

## /plan mode

`Shift+Tab` toggles plan mode — uses Opus to think deeper without producing code. Use for:
- New feature scoping
- Debugging a tough bug before trying fixes
- Architecture choice before committing

Don't use plan mode for: known patterns, mechanical work, small tweaks.

## MCP delegation

| Need | Tool |
|---|---|
| Model recommendation for a task | `cc_docs_model_recommend(task, budget?)` |
| Compare two model choices | `cc_docs_compare(["opus", "sonnet"])` |
| Check cost of an autonomy profile | `cc_kb_autonomy_profile(profile)` |

## Anti-patterns

- Defaulting to Opus everywhere → 5× cost, rarely 5× value.
- Haiku on hard tasks → gets it wrong, then you re-run on Opus = 6× cost.
- Ignoring `/plan` on new work → code-first on unfamiliar problems wastes tokens.
- Not estimating budget → costs creep; you notice on the monthly bill.

## Reference

- [cost-table.md](references/cost-table.md) — detailed cost breakdown by task type
