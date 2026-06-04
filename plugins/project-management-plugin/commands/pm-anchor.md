---
name: project-management-plugin:pm-anchor
intent: Set or clear the focus anchor that keeps Claude on task across every turn
tags:
  - project-management-plugin
  - command
  - pm-anchor
inputs: []
risk: medium
cost: medium
description: Set or clear the focus anchor that keeps Claude on task across every turn
---

# /pm:anchor — Focus Receipt

**Usage**: `/pm:anchor "{do ...}" ["{don't ...}"]`
**Clear**: `/pm:anchor --clear`
**Inspect**: `/pm:anchor --show`

## Purpose

Writes a two-line commitment ("DO X", "DON'T Y") to the active guardrail
context. Every subsequent user turn and session start injects this
commitment as a system reminder so Claude literally cannot forget what was
agreed. Pairs with `/pm:scope`, `/pm:done-when`, and `/pm:drift`.

Use this when you want Claude to stick to a narrow task over a long
autonomous run. The anchor is *not* a substitute for `/pm:scope` (which
enforces file allowlists) — it's the prose contract Claude reads on every
turn.

## Behavior

1. **Set**: parse the two arguments as plain prose. Call
   `mcp__pm-mcp__pm_anchor_set` with `{do, dont}`. Both strings are stored
   in `anchor.json` and mirrored to `focus.md` for easy manual edits.
2. **Clear**: call `mcp__pm-mcp__pm_anchor_clear`.
3. **Show**: call `mcp__pm-mcp__pm_anchor_get` and print the current
   contract.

## Where it's stored

- `.claude/projects/{id}/anchor.json` when an IN_PROGRESS project exists,
  else `.claude/pm-session/anchor.json` (ephemeral, created on demand).
- `focus.md` is written alongside `anchor.json` as the human-readable copy.

## Enforcement

- `SessionStart` hook (`anchor-inject.sh`) injects the anchor at the start
  of a new session.
- `UserPromptSubmit` hook (same script) echoes the anchor on every new user
  message so Claude re-reads the contract before acting on a fresh prompt.

## Examples

```
/pm:anchor "Implement refresh token rotation on /auth/refresh" "Don't touch the UI or add new deps"

/pm:anchor --show
  DO: Implement refresh token rotation on /auth/refresh
  DON'T: Don't touch the UI or add new deps
  (set 3 min ago)

/pm:anchor --clear
  Cleared focus anchor.
```

## When NOT to use

- Tiny tasks that complete in one or two turns — the injection overhead
  isn't worth the ceremony.
- When a full `/pm:init` → `/pm:plan` project is the right container;
  the anchor is for *sessions*, not *projects*.
