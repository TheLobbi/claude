---
name: linear:initiative
intent: Manage Linear initiatives and sub-initiatives — strategic groupings of projects with their own status updates
tags:
  - linear-orchestrator
  - command
  - initiative
inputs:
  - action
risk: medium
cost: low
description: Initiatives + sub-initiatives + updates (linear.app/docs/initiatives, sub-initiatives, initiative-and-project-updates)
---

# /linear:initiative

Initiatives are above projects in the hierarchy: company-wide goals composed of multiple projects. Sub-initiatives nest underneath.

## Actions

### `create`
- `--name <str>` (required)
- `--owner <user>`, `--target-date <date>`, `--description <md>`
- Mutation: `initiativeCreate`

### `update <initiativeId>`
- `--state <draft|planned|active|completed|canceled>`
- Same fields as create
- Mutation: `initiativeUpdate`

### `sub-create --parent <initiativeId>`
- Same flags as `create` plus `--parent`
- Mutation: `initiativeCreate` with `parentInitiativeId` (https://linear.app/docs/sub-initiatives)

### `sub-link --child <id> --parent <id>`
- Re-parents an existing initiative (calls `initiativeUpdate` setting `parentInitiativeId`)

### `status <initiativeId>`
- `--post --health <on-track|at-risk|off-track> --body <md>` → `initiativeUpdateCreate`
- Without `--post`, returns recent updates with rolled-up project statuses

### `list`
- Shows tree (initiative → sub-initiative → projects → issues) with depth limit

## Roll-up logic
- Initiative health is the worst of its sub-initiatives + direct projects
- Initiative target date is auto-warned if any child is past its target

## Bridge behaviour
- Initiatives don't sync to Harness or Planner directly (too coarse-grained)
- However, the `linear-initiative-planner` agent uses initiative roll-ups when generating quarterly Planner plans
