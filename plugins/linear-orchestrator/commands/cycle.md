---
name: linear:cycle
intent: Plan, update, and report on Linear cycles (sprints) — velocity, scope changes, carry-over
tags:
  - linear-orchestrator
  - command
  - cycle
inputs:
  - action
risk: medium
cost: low
description: Cycle management (linear.app/docs/use-cycles, linear.app/docs/update-cycles)
---

# /linear:cycle

Cycles are time-boxed work containers. Each team has its own cycle cadence.

## Actions

### `current --team <key>`
Returns the active cycle: name, dates, completion %, issue counts.

### `next --team <key>`
Returns the upcoming cycle.

### `plan --team <key> --target-velocity <int> [--carry-over]`
- Pulls the team's velocity history
- Suggests issues from backlog ordered by Priority → Estimate
- If `--carry-over`, includes incomplete issues from current cycle
- Emits a plan as JSON; user confirms with `--apply` to call `issueUpdate(id, { cycleId })` on each

### `update <cycleId>`
- `--name <str>`, `--starts-at <date>`, `--ends-at <date>`
- Calls `cycleUpdate`

### `report --cycle <id|current|previous>`
- Burn-down: scope-added, scope-removed, completed-per-day
- Velocity vs. target
- Carry-over rate
- Renders as ASCII table + optional `--format json|md|csv`

### `carryover --from <cycleId> --to <cycleId>`
- Moves all incomplete issues; updates completion stats; tags carried issues with a `carried-over` label

## Bridge interactions
- Harness deploy events tagged with `cycleId` (extracted from issue) get aggregated into the cycle report under "deploys per cycle"
- Planner buckets are not cycle-aware; the bridge maps Linear cycle → Planner bucket prefix `[Cycle: <name>]`
