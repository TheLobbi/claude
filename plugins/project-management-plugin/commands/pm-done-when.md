---
name: project-management-plugin:pm-done-when
intent: Declare the binary-testable criteria Claude must verify before the session may end
tags:
  - project-management-plugin
  - command
  - pm-done-when
inputs: []
risk: medium
cost: medium
description: Declare the binary-testable criteria Claude must verify before the session may end
---

# /pm:done-when — Completion Contract

**Usage**:
- `/pm:done-when "criterion 1" "criterion 2" [...]` — declare criteria
- `/pm:done-when --met <id> --evidence "<proof>"` — mark one criterion met
- `/pm:done-when --show` — show the current contract + status
- `/pm:done-when --drop <id>` — remove a criterion (user escape hatch)
- `/pm:done-when --clear` — deactivate the contract

## Purpose

Records the list of completion criteria that MUST have recorded evidence
before Claude may declare the session finished. A `Stop` hook
(`done-gate.sh`) returns `{ok:false, reason:"..."}` while any criterion is
unmet — naming the specific outstanding items.

This turns the `completion_criteria` concept from `task.schema.json` into a
session-wide gate that works with or without a full `/pm:init` project.

## Good criteria

Criteria must be specific and *verifiable* — a binary pass/fail with
observable evidence. Good examples:

- `pnpm test:pm-plugin exits 0`
- `GET http://localhost:3000/refresh returns 200 with JSON {token:...}`
- `src/auth/refresh.ts exports a function rotateRefreshToken`
- `pnpm check:marketplace passes for all 27 plugins`

Avoid vague criteria like "works correctly", "is done", "looks good" — the
decomposer and the schema already reject these, and the Stop gate would
too because you can't attach evidence to them.

## Behavior

1. **Declare**: call `mcp__pm-mcp__pm_done_when_set` with `{criteria}`. Each
   criterion is assigned an id `c1`, `c2`, … so they can be referenced by
   the hook and the `--met` flag.
2. **Mark met**: run the verification (usually a `Bash` call that runs a
   test or `curl`), then call `mcp__pm-mcp__pm_done_when_met` with
   `{id, evidence}`. The evidence string must be non-trivial — the tool
   rejects blank or 2-character inputs.
3. **Show**: call `mcp__pm-mcp__pm_done_when_status`.
4. **Drop**: (human escape hatch) edit the `done-when.json` directly to
   remove a criterion, then re-show.

## Storage

`done-when.json` in the active guardrail context (project dir or
`.claude/pm-session/`).

## Enforcement

- **Stop hook** (`done-gate.sh`) reads `done-when.json` and, if any
  criterion has no `met_at`, returns a structured `{ok:false}` response
  listing exactly which criteria are missing evidence.

## Example

```
/pm:done-when "pnpm test:pm-plugin passes" "pm-mcp exposes pm_anchor_set" "README describes /pm:anchor"
  Recorded 3 criteria.

# Claude does the work.
# Run tests → "# pass 19 / # fail 0"
/pm:done-when --met c1 --evidence "pnpm test:pm-plugin -> # pass 19 # fail 0"

# Sanity-check tool listing.
/pm:done-when --met c2 --evidence "tools/list response contains pm_anchor_set"

# Confirm the doc edit.
/pm:done-when --met c3 --evidence "grep -c '/pm:anchor' README.md = 4"

# Now the Stop hook will let the session end cleanly.
```
