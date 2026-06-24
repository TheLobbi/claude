---
name: cc-context-budgeting
description: Manage Claude Code's context window — token arithmetic, /compact strategy, anchor preservation, progressive loading, session analytics. Use this skill whenever a session gets long, context approaches limits, after /compact, when deciding what to load into CLAUDE.md vs leave in references, or when analyzing session cost/token usage. Triggers on: "context full", "compact", "too many tokens", "budget", "session analytics", "save tokens", "context window", "/compact strategy".
---

# Context Budgeting

Every token in context is a cost you pay every turn. This skill is the discipline that keeps long sessions cheap and coherent.

## Token arithmetic

Rough budget on a 200K-context model:

| Consumer | Typical | Budget |
|---|---|---|
| System prompt + CLAUDE.md | 3–8 K | ≤ 10 K |
| Skills frontmatter (all active) | 2–6 K | ≤ 8 K |
| MCP tool schemas (passive) | 5–25 K | ≤ 15 K |
| Hook definitions | <1 K | <1 K |
| Conversation history | variable | ~120 K |
| Working headroom | — | ≥ 20 K |

If passive context (everything before conversation history) exceeds 30 K, optimize.

## Three-tier loading (skill-creator canonical)

| Tier | What | Size | Loaded |
|---|---|---|---|
| 1 — Frontmatter | `name` + `description` | ~50 tokens | always |
| 2 — Body | `SKILL.md` after frontmatter | ≤ 500 lines | on activation |
| 3 — References | `references/*.md`, MCP KB artifacts | unlimited | on demand |

Rule: if content doesn't change Claude's behavior every session, it belongs in tier 3.

## /compact strategy

`/compact` condenses conversation history when it's filling up. It does NOT touch system prompt, CLAUDE.md, or skills.

When to `/compact`:
- Conversation > 60 K tokens.
- About to start a new phase (logical break).
- Many long tool outputs in history.

When NOT to `/compact`:
- Mid-debugging where specific earlier context matters.
- Right before an important decision — the lost nuance might bite.
- After a fresh `/clear` (nothing to compact).

**Anchor preservation**: before `/compact`, save anything you'd lose to engram via `mem_save`. After compact, the `post-compact-context-restoration` hook re-loads memory rules and recent context.

## /clear vs /compact

| Command | What it does |
|---|---|
| `/compact` | Summarize history, keep system prompt + CLAUDE.md |
| `/clear` | Wipe everything including CLAUDE.md — fresh session |

Use `/clear` between unrelated tasks. Use `/compact` mid-task.

## Subagent delegation for context pressure

When a single subtask would consume too much context (e.g. scanning a huge codebase), delegate to a subagent. The agent gets a fresh window; you only see its report.

```
Agent({
  description: "Inventory all API endpoints",
  prompt: "Scan src/api/ recursively, list every route with method, auth requirement, and response schema. Report under 500 words."
})
```

Net: the scan consumes agent tokens; your session only pays for the 500-word summary.

## Session analytics

Track cost patterns:

| Metric | Target |
|---|---|
| Passive context (pre-conversation) | ≤ 30 K |
| Cost per turn | ≤ $0.05 (Sonnet), ≤ $0.15 (Opus) |
| Tools loaded but never called per session | 0 (prune unused MCPs) |
| /compact frequency | every 20–30 exchanges on long sessions |
| Subagent delegation rate | ~1 per 5 substantive turns |

Session analytics isn't automatic — periodically review what's consuming tokens and trim.

## MCP delegation

| Need | Tool |
|---|---|
| Settings schema for compact config | `cc_docs_settings_schema` |
| Compact/budget troubleshooting | `cc_docs_troubleshoot("context")` |
| Model cost for budgeting | `cc_docs_model_recommend(task, budget)` |

## Anti-patterns

- Loading every skill body "just in case" → tier-2 explosion.
- Massive CLAUDE.md with all conventions inline → routing fails + budget bloat.
- Never compacting → session hits wall, Claude forgets the plan.
- Compacting mid-critical-reasoning → loses the thread.
- Global MCPs for project-specific work → 15 K tokens for tools you never call.

## Reference

- [compact-strategies.md](references/compact-strategies.md) — when to compact, anchor checklist, post-compact recovery
