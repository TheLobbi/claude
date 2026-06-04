---
name: wa-work-unit
intent: Start a new work unit under ULTRA governance. Defines scope + completion criterion + pre-flight checklist.
tags:
  - ultra
  - work-unit
  - planning
inputs: []
risk: low
cost: low
flags:
  - name: skip-survey
    type: boolean
    description: Skip the existing-tooling survey (use only when you've already surveyed this session)
---

# /wa-work-unit

Begin a work unit per ULTRA §13.

## Flow

1. **Capture scope** — one sentence. Rewrite until it is measurable.
2. **Completion criterion** — explicit success condition (e.g., "24/24 Pester tests green + idempotent re-run"), not a feeling.
3. **Tooling survey** (unless `--skip-survey`) — list applicable installed plugins, skills, commands, MCPs. Declare what will be reused.
4. **Dependencies** — blocks-by / blocks, with paths to the blocking artifacts.
5. **Plan artifacts** — files to create/modify with one-line purpose each.
6. **Plan tests** — Pester / equivalent suite names + scenarios (success / WhatIf / idempotent / error).
7. **Write stub** — seed `docs/WORK-UNIT-<NN>-<slug>.md` with all of the above.

## Output

A Work Unit stub the user can review and confirm before execution begins.

## When to use

- Any implementation task expected to produce 3+ artifacts.
- Any change with live blast radius (tenant, pipeline, prod deploy).
- Any refactor of an existing script that has tests.

## When NOT to use

- One-line edits.
- Pure questions.
- Exploratory reads.

## See also

- `skill: work-unit-protocol`
- `rules/ultra-mode.md`
- `/wa-report` — close the work unit.
