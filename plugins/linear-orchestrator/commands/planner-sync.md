---
name: linear:planner-sync
intent: Two-way sync between Linear issues and Microsoft Planner tasks via Microsoft Graph delta queries
tags:
  - linear-orchestrator
  - command
  - planner
  - microsoft-graph
  - bridge
  - two-way-sync
inputs:
  - action
risk: high
cost: medium
description: Two-way MS Planner ↔ Linear sync via Microsoft Graph
---

# /linear:planner-sync

Bridges Linear ↔ Microsoft Planner using **Microsoft Graph delta queries** for efficient incremental sync.

## Sync matrix

| Linear → Planner | Planner → Linear |
|------------------|------------------|
| Issue created → Planner task in mapped bucket | Task created in mapped bucket → Linear issue in target team |
| Title / description / due date change → task update | Task title / description / due date change → issue update |
| Assignee change → `assignments` update (resolves Linear user → AAD user via email) | Assignment change → Linear assignee (resolves AAD user → Linear by email) |
| State → `percentComplete` (Triage:0, Started:50, Done:100) | `percentComplete` 100 → state="Done" |
| Comment → task comment via `chatThread` | Task comment → Linear comment |
| Label → category mapping (Planner has 25 named categories) | Category → Linear label (autocreate) |

## Actions

### `enable --plan-id <plan> [--bucket-map <yaml>]`
Initial setup:
- Validates Graph access (`Tasks.ReadWrite.All`, `Group.ReadWrite.All`)
- Initialises delta tokens for `/planner/plans/{id}/tasks/delta`
- Stores bucket → Linear team mapping
- Default bucket map (overridable):
  ```yaml
  buckets:
    Triage: { team: ENG, state: Triage }
    "In Progress": { team: ENG, state: "In Progress" }
    Done: { team: ENG, state: Done }
  ```

### `disable`
- Stops polling delta tokens; preserves mapping for future re-enable

### `status`
- Shows: delta token age, last successful sync, drift count, error rate

### `reconcile [--dry-run]`
- Full re-scan of plan tasks vs Linear issues
- Reports orphans (Planner task without Linear, or vice versa)
- With `--apply`, creates missing items

### `map --planner-bucket <id> --linear-team <key> [--linear-state <name>]`
- Adds/updates a bucket → team/state mapping

### `delta`
- Manually trigger one delta poll cycle (debugging)

## Microsoft Graph specifics
- Endpoints: `/planner/plans/{id}/tasks/delta`, `/planner/tasks/{id}`, `/planner/tasks/{id}/details`
- Delta token TTL: 30 days; bridge re-bootstraps if stale
- Authentication: client credentials (app-only) flow with `Tasks.ReadWrite.All`, `Group.Read.All`
- See: https://learn.microsoft.com/en-us/graph/api/resources/planner-overview
- Throttling: 600 req / 30s per app / per tenant — bridge implements token-bucket pacing

## Limitations
- Planner has **no native sub-tasks** (only checklist items) — Linear sub-issues map to `details.checklist` entries
- Planner has **no priority** field — Linear priority is encoded in category color: Urgent=red, High=orange, Medium=yellow, Low=blue
- Planner cannot store Linear cycle membership — encoded as a `[Cycle: <name>]` prefix in title
- Linear initiatives have no Planner equivalent — not synced
