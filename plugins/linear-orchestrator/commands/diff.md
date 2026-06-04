---
name: linear:diff
intent: Compute and render diffs of Linear issues, projects, or cycles between two points in time
tags:
  - linear-orchestrator
  - command
  - diff
  - audit
inputs:
  - scope
risk: low
cost: medium
description: Linear diffs (linear.app/docs/diffs)
---

# /linear:diff

Linear surfaces "diffs" — change history views — for issues, projects, cycles, and initiatives. This command extracts and renders them programmatically.

## Usage

### Issue diff
```
/linear:diff issue ENG-123 [--since 7d] [--format md|json|patch]
```
Returns: state changes, assignee changes, label add/remove, priority changes, estimate changes, parent/sub changes, comment count delta.

### Project diff
```
/linear:diff project <projectId> --from <date> --to <date>
```
Returns: scope additions/removals (issues), state transitions, milestone changes, status updates count, lead changes.

### Cycle diff
```
/linear:diff cycle <cycleId> [--vs previous]
```
Compares to previous cycle of same team — velocity Δ, completion Δ, scope-creep Δ.

### Initiative diff
```
/linear:diff initiative <initiativeId> --from <date>
```
Roll-up across child projects.

## Implementation notes
- Issue history comes from `issue { history { ... } }` GraphQL connection
- Project/cycle history is derived by snapshotting nightly to local SQLite (`lib/state.ts`) and computing Δ on demand
- Initiative diffs aggregate child diffs

## Use cases
- Standup notes generation
- Audit trail for compliance (SOC 2, ISO 27001)
- Sprint retros (cycle diff vs previous)
- Deploy correlation: pair `/linear:diff issue` with Harness deploy timeline
