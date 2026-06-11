---
intent: "Manage project and task state in .claude/projects/{id}/ with atomic writes and session continuity"
description: "Managing project and task state in .claude/projects/{id}/ with atomic writes and session continuity"
---

# Task State Management Skill

## State Directory Structure

All project state lives under `.claude/projects/{project-id}/` relative to the repository root. This location is chosen deliberately: it is inside the `.claude/` directory (which is already gitignored in most Claude Code configurations), it is scoped to the project by ID (supporting multiple concurrent projects), and it is readable by all hook scripts and skills without any path resolution logic.

The full directory layout is:

```
.claude/projects/{project-id}/
  project.json          — Top-level project record (validates against project.schema.json)
  tasks.json            — Master list of all task objects (validates against task.schema.json per item)
  progress/
    log.md              — Append-only human-readable execution log
    velocity.json       — Rolling velocity metrics updated after each task completes
  research/
    {task-id}.md        — Research brief per task (written by research-protocol skill)
  checkpoints/
    checkpoint-{n}.json — Numbered snapshots of tasks.json at key milestones
  temp/
    .write-{uuid}       — Temporary files used during atomic write operations
```

The `temp/` directory is transient. Any file matching `.write-*` that is older than 5 minutes can be safely deleted — it is a failed atomic write that was abandoned mid-operation. The checkpoint and research directories grow over time; they are never pruned automatically. The progress log is append-only and must never be truncated or overwritten.

## Atomic Write Protocol

All writes to `project.json` and `tasks.json` follow a strict atomic write protocol to prevent partial-write corruption that would leave the project in an unrecoverable state.

The protocol has three steps. First, compute the new JSON content in memory and validate it against the relevant schema. If validation fails, the write is aborted and an error is appended to `progress/log.md` — the existing file is never touched. Second, write the validated content to a temporary file at `temp/.write-{uuid}` where the UUID is generated fresh for each write operation. Third, rename the temporary file to the target path using an atomic filesystem rename. On POSIX systems this is a single `mv` operation. On Windows (where the project currently runs), the rename must replace an existing file, which requires deleting the target first and then renaming — this brief window is acceptable because the previous valid state is recoverable from the most recent checkpoint.

Under no circumstances should the target file be opened for direct write. Line-by-line or in-place edits to state files are forbidden. The entire file is always regenerated from the in-memory state object, serialized to JSON, and written atomically.

## Tasks.json Master List Format

The `tasks.json` file is a JSON object with a single key `tasks` containing an array of task objects. The array is the canonical source of truth for all task state. The order of tasks in the array reflects the order they were created, not their execution order (which is determined dynamically by the scheduler based on dependencies and priority).

Each task object in the array conforms to `task.schema.json`. The `id` field is the primary key. Lookups by ID should iterate the array; no secondary index is maintained in this file. The tasks array includes tasks at all levels of the hierarchy — epics, stories, tasks, subtasks, and micro-tasks are all represented as peers in the flat list, with parent-child relationships expressed through the `subtasks` array on parent tasks.

When a task is decomposed into subtasks, the parent task's `subtasks` field is updated with the child IDs, and the new child tasks are appended to the `tasks` array. The parent task's status transitions to `IN_PROGRESS` at this point — a parent task is never directly executed; it is COMPLETE only when all its subtasks are COMPLETE.

## Checkpoint Rolling Window

After every phase completion and after every 10 task completions (whichever comes first), the current state of `tasks.json` is written as a numbered checkpoint to `checkpoints/checkpoint-{n}.json`. The checkpoint number increments monotonically from 1. Only the last 10 checkpoints are retained; when checkpoint-11 is written, checkpoint-1 is deleted.

Checkpoints serve as recovery points. If `tasks.json` becomes corrupted or inconsistent (e.g., due to an interrupted atomic write), the most recent valid checkpoint is used to reconstruct the state. A checkpoint is considered valid if it can be parsed as JSON and at least one task object passes schema validation. The recovery logic does not require full schema compliance — partial recovery is preferable to no recovery.

Checkpoints are named with zero-padded numbers (`checkpoint-001.json` through `checkpoint-010.json`) so that lexicographic sort correctly identifies the newest checkpoint.

## Progress Log Format

The `progress/log.md` file is append-only. Nothing is ever deleted or overwritten in this file. Each entry is a markdown block beginning with a timestamp line in the format `## YYYY-MM-DDTHH:MM:SSZ — {event-type}`.

Standard event types are: `TASK_STARTED`, `TASK_COMPLETE`, `TASK_BLOCKED`, `TASK_RESEARCHED`, `PHASE_COMPLETE`, `CHECKPOINT_WRITTEN`, `ERROR`, `SYNC_TO_{PLATFORM}`, and `LOOP_ITERATION`. Each event block includes the task ID (where applicable), the previous status, the new status, and any relevant detail (e.g., for TASK_COMPLETE, the actual_minutes spent; for ERROR, the full error message; for SYNC, the external ID assigned).

The log is not parsed by the autonomous loop for scheduling decisions — those are made from `tasks.json`. The log exists for human audit and post-mortem analysis. It is also the source of data for the velocity calculation.

## Reconciling Checkpoint vs Tasks.json on Resume

When the autonomous loop is resumed after an interrupted session, it performs a reconciliation step before executing any tasks. The reconciliation compares the in-progress tasks recorded in `tasks.json` with the last checkpoint to determine whether any tasks were left in a transitional state.

A task is considered transitional if its status is `IN_RESEARCH` or `IN_PROGRESS` at the time the session ended. These statuses indicate the executor was mid-work when the session terminated. For each transitional task, the reconciler applies the following heuristic: if the task's research file exists and is recent (written after the task's `created_at`), transition the status to `RESEARCHED`; otherwise, reset it to `PENDING`. This is conservative — it prefers re-doing work over asserting false completion.

Tasks in `VALIDATING` status are treated as if they are `IN_PROGRESS` — validation did not complete, so the task must be re-executed and re-validated.

Tasks in `COMPLETE`, `BLOCKED`, or `CANCELLED` status are never reset during reconciliation regardless of checkpoint state. These terminal (or intentionally paused) states are respected across sessions.

## Stale Detection

A task is considered stale when it has been in `IN_PROGRESS` status for longer than 4 times its `estimate_minutes` without a `TASK_COMPLETE` event appearing in the progress log. The stale threshold is generous to account for research overhead and validation retries, but it is bounded to prevent infinitely hung tasks from blocking the entire project.

When a stale task is detected on loop resume, it is automatically reset to `PENDING` and an `ERROR` entry is written to the progress log explaining the stale reset. The task's estimate is not modified — the original estimate is preserved so that velocity calculations remain accurate. If the same task becomes stale twice, it is transitioned to `BLOCKED` with a `blocked_reason` of "Stale twice — requires human review" and the loop skips it entirely until a human intervenes.

Research files associated with a stale-reset task are not deleted — they may contain valid findings even if the execution did not complete. The next execution pass will find the existing research file, check its timestamp against the 24-hour TTL, and reuse it if still fresh.
