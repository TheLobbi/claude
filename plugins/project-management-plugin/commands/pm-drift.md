---
name: project-management-plugin:pm-drift
intent: Audit the breadcrumb trail for scope drift, over-engineering, and criterion advancement
tags:
  - project-management-plugin
  - command
  - pm-drift
inputs: []
risk: medium
cost: medium
description: Audit the breadcrumb trail for scope drift, over-engineering, and criterion advancement
---

# /pm:drift — Session Drift Auditor

**Usage**: `/pm:drift [--since <iso-timestamp>] [--verbose]`

## Purpose

Replays the breadcrumb trail captured by the `breadcrumb-logger.sh` hook
and classifies each tool call against the active anchor, scope, and
done-when contract. Use it:

- **Mid-task** to self-audit before continuing ("am I still on-task?").
- **After an autonomous run** as a cheap post-mortem.
- **During PR review** to understand what Claude actually touched vs what
  was asked.

## Behavior

Call `mcp__pm-mcp__pm_drift_report` with `{since?}`. The tool returns:

- `context` — `{kind, id, dir}` showing whether the active context is a
  project or the ephemeral session.
- `anchor` — the current focus anchor (null if unset).
- `scope_active`, `done_criteria_total`, `done_criteria_met`.
- `totals` — `{turns, drift_turns, advancing_turns, drift_ratio}`.
- `entries` — per-turn list with `drift: [reasons]` and `advances: bool`.

Render the result as a short table by default:

```
Task context: project foo-bar (52 turns)
Anchor: DO refresh-token; DON'T touch UI
Scope: active (3 patterns)
Done-when: 2/3 criteria met

Drift analysis:
  turn  1-8   advanced c1 (token generation)
  turn  9-12  advanced c2 (endpoint wiring)
  turn 13     ⚠ out-of-scope: src/ui/Login.tsx (override logged)
  turn 14-17  ⚠ overengineering: added 6-line docstring in refresh.ts
  turn 18-22  advanced c3 (tests)

Drift ratio: 19% (10 of 52 turns did not advance a criterion)
```

With `--verbose`: print every breadcrumb individually (tool + target).

## Drift reasons

- `out-of-scope` — a PreToolUse block fired (or should have).
- `overengineering: <tags>` — PostToolUse detector flagged a pattern.
- `no-criterion` — call did not plausibly advance any done-when criterion
  (heuristic; may be a false positive for exploratory Grep/Read calls).

## When to escalate

A drift ratio > 30% usually means one of:

1. The anchor is too narrow (Claude genuinely needs to touch adjacent
   files). Widen it with `/pm:anchor` or `/pm:scope add`.
2. The task was under-decomposed. Run `/pm:plan --force-redecompose`.
3. Claude is actually drifting. Interrupt, `/pm:anchor --clear`, and redo.

## Privacy note

Breadcrumbs log *tool name* and *target path / command excerpt* only. No
file contents, no secrets.
