---
name: linear:workflow
intent: Configure team workflow states, transitions, and SLA-driven escalations
tags:
  - linear-orchestrator
  - command
  - workflow
inputs:
  - action
risk: high
cost: low
description: Configure workflows (linear.app/docs/configuring-workflows)
---

# /linear:workflow

Workflow states are per-team. Each state has a `type` (one of: `triage`, `backlog`, `unstarted`, `started`, `completed`, `canceled`) which controls Linear UI behaviour.

## Actions

### `list --team <key>`
Returns ordered states with type, color, position.

### `add-state --team <key>`
- `--name <str>`, `--type <triage|backlog|unstarted|started|completed|canceled>`
- `--color <hex>`, `--position <int>` (optional)
- Mutation: `workflowStateCreate`

### `update-state <stateId>`
- Mutation: `workflowStateUpdate`

### `reorder --team <key> --order <id1,id2,id3>`
- Calls `workflowStateUpdate` for each with new `position`

### `export --team <key> --to <file.yaml>`
- Dumps workflow as YAML for review/migration

### `import --team <key> --from <file.yaml>`
- Diffs current vs file, applies create/update/delete (asks confirmation per change)

## Risk warning
**Workflow changes are risky** — they affect every issue in the team. Always run `--dry-run` first. Prefer `add-state` over renaming existing states.

## Bridge behaviour
- Workflow state changes are mirrored to Harness PR labels (`linear:in-progress`, `linear:done`) and to Planner task `percentComplete` (0/50/100 mapping)
