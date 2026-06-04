---
name: project-management-plugin:pm-sync
intent: Bidirectional sync between local project state and integrated PM platform
tags:
  - project-management-plugin
  - command
  - pm-sync
inputs: []
risk: medium
cost: medium
description: Bidirectional sync between local project state and integrated PM platform
---

# /pm:sync — Bidirectional Platform Sync

**Usage**: `/pm:sync {project-id} [--push-only | --pull-only] [--dry-run]`

## Purpose

Synchronizes task status between local `tasks.json` and the connected PM platform. Handles both directions: pushing local completion status to the platform, and pulling new tasks or status changes from the platform. Conflicts are resolved with a defined precedence rule and shown to the user when they require judgment.

## Pre-Conditions

Load `project.json`. If `pm_integration` is null or missing: error "No PM integration configured. Run `/pm:integrate {id} --platform {name}` first."

Verify the platform credential env vars are still present (same check as `/pm:integrate`). If any are missing: error with the missing key names.

## Invoke pm-integrator

Invoke the `pm-integrator` agent in sync mode. The integrator receives:
- Full `tasks.json`
- `pm_integration` config (platform, external_project_id, credential key names)
- Sync direction flags (`--push-only`, `--pull-only`, or both)
- `--dry-run` flag

## Push Phase (local → external platform)

For each COMPLETE or SKIPPED task in `tasks.json` that has an `external_id` field (set during a previous sync or import):
1. Check the current status on the external platform.
2. If the external status does not match the local COMPLETE/SKIPPED: push the update.
   - COMPLETE → mark as "Done" (or platform equivalent)
   - SKIPPED → mark as "Won't Do" or "Cancelled" (or platform equivalent)
3. Update the external task's description with: "Last synced by PM plugin at {timestamp}. Local task ID: T-{n}."

For COMPLETE tasks with no `external_id`: create a new item in the external platform. Set `external_id` in the local task record.

For IN_PROGRESS tasks with an `external_id`: update external status to "In Progress."

Track: `{tasks_pushed}` count.

## Pull Phase (external platform → local)

Fetch all open/in-progress items from the external platform. For each:
1. Check if a local task with a matching `external_id` exists.
2. If yes: compare statuses.
3. If no: this is a new task — create a local task record with PENDING status.

Status mapping from external to local:
- "Done" / "Completed" → COMPLETE
- "In Progress" → (do not auto-set IN_PROGRESS; leave as PENDING — execution sets this)
- "Cancelled" / "Won't Do" → SKIPPED
- Any other status → PENDING

Track: `{tasks_pulled}` (new tasks created) and `{status_updates_pulled}`.

## Conflict Resolution

A conflict occurs when both the local and external status have changed since the last sync. Resolution rules:

- **Status conflict**: Local wins for status fields. External status is ignored if the local task has progressed beyond what the external system knows.
- **Title/description conflict**: External wins if the external `updated_at` timestamp is newer than `last_sync_at`. Show the conflict to the user as a diff and apply automatically, but list it in the conflict report.
- **Completion criteria conflict**: Do not overwrite local completion criteria with external content. External description changes are appended to the task description with a "Updated from {platform}:" prefix.

Any conflict that cannot be resolved automatically is shown to the user as a diff:

```
Conflict: T-{n} — {title}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Local:    status=COMPLETE, completed_at={ts}
External: status=In Progress, updated_at={ts}

Resolution: Local wins (local is further along). External status will be updated.
Action taken: Will push COMPLETE to {platform}.
```

## Dry Run

When `--dry-run` is set: compute all push and pull actions but do not apply any changes. Show the full list of planned changes:

```
Dry run — no changes will be applied

Would push:
  T-033: COMPLETE → {platform} "Done"
  T-034: COMPLETE → {platform} "Done" (new item, no external_id yet)

Would pull:
  EXT-099: New task "Update privacy policy" → T-099 PENDING
  EXT-045: Status "Cancelled" → T-045 SKIPPED

Conflicts that would require resolution:
  T-{n}: {description of conflict}

Remove --dry-run to apply.
```

## Sync Report

After sync completes (not dry-run):

```
Sync complete: {platform}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pushed:  {n} tasks
Pulled:  {n} new tasks, {n} status updates
Conflicts auto-resolved: {n}
Conflicts requiring review: {n}

{If conflicts requiring review:}
Review these conflicts:
  T-{n}: {title} — {conflict summary}
  ...
```

Update `pm_integration.last_sync_at` in `project.json` with the current timestamp.

Invoke `checkpoint-manager` if any local tasks were created or modified.
