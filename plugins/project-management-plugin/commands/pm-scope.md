---
name: project-management-plugin:pm-scope
intent: Manage the file/command allowlist that blocks out-of-scope edits during the active task
tags:
  - project-management-plugin
  - command
  - pm-scope
inputs: []
risk: medium
cost: medium
description: Manage the file/command allowlist that blocks out-of-scope edits during the active task
---

# /pm:scope — Scope Lock with Drift Ledger

**Usage**:
- `/pm:scope add <pattern> [<pattern> ...]` — append glob patterns to the allowlist
- `/pm:scope remove <pattern> [...]` — drop patterns
- `/pm:scope set <pattern> [...]` — replace the allowlist
- `/pm:scope show` — print the current allowlist and drift ledger
- `/pm:scope clear` — deactivate scope enforcement
- `/pm:scope override <path> --because "<reason>"` — record a justified one-off

## Purpose

Declares which paths Claude is allowed to edit. A `PreToolUse` hook
(`scope-guard.sh`) blocks `Write`, `Edit`, and `MultiEdit` calls whose
target file falls outside the allowlist, forcing Claude to either revise
its approach or explicitly expand scope — leaving a paper trail.

This implements the `.claude/rules/review.md` stance that "only files
relevant to the PR scope" should be modified, at tool-call time.

## Behavior

1. **add**: call `mcp__pm-mcp__pm_scope_add` with `{patterns}`.
2. **remove**: call `mcp__pm-mcp__pm_scope_remove`.
3. **set**: call `mcp__pm-mcp__pm_scope_set`.
4. **show**: call `mcp__pm-mcp__pm_scope_status`.
5. **clear**: call `mcp__pm-mcp__pm_scope_set` with `patterns: []`.
6. **override**: call `mcp__pm-mcp__pm_scope_override` with `{path, reason}` —
   appends to the drift ledger but does not permanently widen scope. Use
   when Claude genuinely needs a one-off touch outside its current lane.

## Glob syntax

Minimal glob: `*` matches within a single path segment, `**` matches any
number of segments. Patterns are relative to `CLAUDE_PROJECT_DIR` (or
`cwd`). Examples:

- `src/auth/**` — any file under src/auth at any depth
- `tests/*.test.mjs` — test files directly under tests/
- `plugins/project-management-plugin/**` — everything in this plugin

## Storage

`scope.json` in the active guardrail context (project dir or
`.claude/pm-session/`). Overrides live in the same file under `overrides`.

## Enforcement

- **PreToolUse(Write|Edit|MultiEdit)** blocks out-of-scope writes with a
  structured refusal that names the allowlist and the two escape hatches
  (override with reason, or expand with `/pm:scope add`).
- Read-only tools (Read, Grep, Glob) are **never** blocked — scope locks
  writes only, never exploration.

## Example session

```
/pm:scope add src/auth/** tests/auth/**
  Scope active. Allowlist:
    - src/auth/**
    - tests/auth/**

/pm:scope show
  Active. 2 patterns, 0 overrides.

# Claude tries to edit src/ui/Login.tsx — hook blocks.

/pm:scope override src/ui/Login.tsx --because "auth endpoint requires new login form button"
  Override logged. Proceed with the single file.
```
