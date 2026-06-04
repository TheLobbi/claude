---
name: project-management-plugin:pm-handoff
intent: Snapshot active task state for post-/compact resume, or display the current handoff
tags:
  - project-management-plugin
  - command
  - pm-handoff
inputs: []
risk: medium
cost: medium
description: Snapshot active task state for post-/compact resume, or display the current handoff
---

# /pm:handoff — Compaction-Safe Task Handoff

**Usage**:
- `/pm:handoff write` — force-snapshot right now
- `/pm:handoff show` — print the current handoff.md

## Purpose

When Claude Code compacts the context window or the user resumes a
session hours later, the in-memory understanding of the active task
evaporates. This command (and the `Stop` / `SessionStart` hooks that
call it automatically) keeps a structured markdown snapshot of what
was being worked on so resuming never means "re-plan from scratch."

## What the handoff contains

`handoff.md` includes, in order:

1. The most recent user prompt verbatim.
2. The active focus anchor (`DO` / `DON'T`).
3. The scope allowlist + any logged overrides.
4. The done-when contract with each criterion's met/unmet status and
   evidence line.
5. Budget status (used / max / percent).
6. Up to 20 recently-touched files.
7. Up to 15 recent breadcrumbs (tool + target).
8. A short "how to resume" checklist.

## Automatic writes + reads

- **Stop hook** (`handoff-write.sh`) writes a fresh handoff every time
  the session ends. This covers both natural stops and the window just
  before `/compact`.
- **SessionStart hook** (`handoff-read.sh`) surfaces the handoff as a
  notification so the resumed session sees it before doing anything
  else.

Manual invocation is rarely needed — but the command exists for the
case where you want to force a snapshot mid-run or inspect the current
handoff directly.

## Behavior

1. **write**: call `mcp__pm-mcp__pm_handoff_write`. Returns the file
   path that was written.
2. **show**: call `mcp__pm-mcp__pm_handoff_read`. Prints the markdown
   body as-is.

## Storage

`handoff.md` in the active guardrail context (project dir or
`.claude/pm-session/`). Overwritten on every Stop — not versioned; if
you want history use checkpoints or git.

## Example

```
/pm:anchor "refresh-token rotation" "no UI"
/pm:done-when "pnpm test passes" "endpoint returns 200"
# ...work...
# Session ends (Stop hook fires handoff-write.sh)

# New session or /compact
# SessionStart hook surfaces:
#
#   TASK HANDOFF FROM PREVIOUS SESSION:
#   ## Last user ask
#   > ship refresh-token rotation
#
#   ## Focus anchor
#   - DO: refresh-token rotation
#   - DON'T: no UI
#
#   ## Done-when progress
#   1/2 criteria met.
#   - [x] c1 — pnpm test passes → `pnpm test → exit 0`
#   - [ ] c2 — endpoint returns 200
#
#   ...
```
