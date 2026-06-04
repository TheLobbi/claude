---
name: project-management-plugin:pm-checkpoint
intent: Save or restore project state checkpoints
tags:
  - project-management-plugin
  - command
  - pm-checkpoint
inputs: []
risk: medium
cost: medium
description: Save or restore project state checkpoints
---

# /pm:checkpoint — State Management

**Usage**: `/pm:checkpoint {subcommand} {project-id}`

## Purpose

Manages project state checkpoints. Checkpoints are snapshots of `tasks.json` and project progress counters at a point in time. They are the mechanism for disaster recovery and state inspection. The `/pm:work` loop writes checkpoints automatically; this command lets you save them manually, list them, restore from them, or diff between them.

## Subcommands

### save

`/pm:checkpoint save {project-id} [--note "description"]`

Write an explicit checkpoint right now. Useful before performing risky operations (manual task edits, bulk status changes, deleting tasks).

Invoke `checkpoint-manager` to:
1. Read the current `tasks.json` in full.
2. Compute a progress snapshot: tasks by status (PENDING, IN_RESEARCH, RESEARCHED, IN_PROGRESS, COMPLETE, BLOCKED, SKIPPED, PARENT) and counts for each level (phase, epic, story, task, micro-task).
3. Write to `checkpoints/{iso-timestamp}.json`:

```json
{
  "checkpoint_id": "{iso-timestamp}",
  "project_id": "{project-id}",
  "saved_at": "{iso-timestamp}",
  "note": "{user note or empty string}",
  "trigger": "manual",
  "progress": {
    "total": {n},
    "by_status": { "COMPLETE": {n}, "PENDING": {n}, ... },
    "pct_complete": {float}
  },
  "tasks_snapshot": {copy of all tasks from tasks.json}
}
```

4. Append a line to `progress/log.md`: `[{timestamp}] Manual checkpoint saved: {note or "(no note)"}`

Announce: "Checkpoint saved: {timestamp}. {pct}% complete ({n}/{total} tasks)."

### list

`/pm:checkpoint list {project-id}`

Show all checkpoints with timestamps and summary stats, sorted newest to oldest:

```
Checkpoints for {project-name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {timestamp}  auto     42%  (127/302)  "After T-033 completed"
  {timestamp}  manual   38%  (115/302)  "Before Stripe integration"
  {timestamp}  auto     31%  (94/302)   ""
  ...

Total: {n} checkpoints spanning {duration}
```

List the `trigger` (manual or auto), progress percentage, task counts, and the user note (if any). If no checkpoints exist: "No checkpoints found. The project may not have been executed yet."

### restore

`/pm:checkpoint restore {project-id} {timestamp}`

Restore project state to the given checkpoint. This is destructive — it overwrites the current `tasks.json` with the checkpoint snapshot.

Steps:
1. Load the checkpoint file from `checkpoints/{timestamp}.json`. If it does not exist, list available timestamps and error.
2. Show the diff between the current state and the checkpoint state:
   - Tasks that would revert from COMPLETE to earlier statuses
   - Tasks that would gain or lose statuses
   - Net progress change (e.g., "This restores to 38% complete, losing 4% of progress")
3. Ask for confirmation: "Restore to {timestamp}? This will rewrite tasks.json. Current state will be backed up to checkpoints/{now}-pre-restore.json. (yes / no)"
4. On yes: write a backup checkpoint first, then overwrite `tasks.json` with `checkpoint.tasks_snapshot`. Update `project.json` with `restored_from: {timestamp}`, `restored_at`. Append to `progress/log.md`.
5. Announce: "Restored to checkpoint {timestamp}. {pct}% complete. Run `/pm:status {id}` to verify."

### diff

`/pm:checkpoint diff {project-id} {timestamp1} {timestamp2}`

Show what changed between two checkpoints. If only one timestamp is provided, diff that checkpoint against the current state.

Output:
```
Diff: {timestamp1} → {timestamp2}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Progress: 38% → 42% (+4%, +12 tasks)

Status changes:
  T-033: PENDING → COMPLETE
  T-034: PENDING → COMPLETE
  T-035: PENDING → IN_PROGRESS
  T-036: PENDING → BLOCKED ("dependency on external API unavailable")
  T-037: PENDING → PENDING (unchanged)
  ...

New tasks (added between checkpoints):
  T-098: "Fix: Missing authentication on admin endpoints" (CRITICAL)

Deleted tasks: none
```

### health

`/pm:checkpoint health {project-id}`

Check state file integrity without modifying anything.

Run these checks:
1. `tasks.json` valid JSON: parse and report error location if invalid.
2. All task IDs unique: report duplicates.
3. All dependency references valid: report any `dependencies` entry that points to a non-existent task ID.
4. All parent_id references valid: report orphaned tasks.
5. Status consistency: tasks marked COMPLETE but with empty `completion_criteria`; tasks marked PARENT but with no children; tasks with status COMPLETE but `completed_at` null.
6. Checkpoint count and age: report how many checkpoints exist and when the newest one was written.

Output: each check as PASS or FAIL with details. If all pass: "State is healthy. {n} checkpoints, newest: {relative-time}." If any fail: list issues and suggest `/pm:debug {id} --repair`.
