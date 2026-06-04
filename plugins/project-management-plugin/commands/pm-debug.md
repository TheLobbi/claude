---
name: project-management-plugin:pm-debug
intent: Inspect or repair project state files and caches
tags:
  - project-management-plugin
  - command
  - pm-debug
inputs: []
risk: medium
cost: medium
description: Inspect or repair project state files and caches
---

# /pm:debug — State Inspection and Repair

**Usage**: `/pm:debug {project-id} [--inspect | --repair | --reset-task T-001]`

## Purpose

Diagnostic and repair tooling for project state files. Use when: task state appears inconsistent, `/pm:work` is behaving unexpectedly, a JSON parse error prevents commands from loading, or you need to understand the raw state of a project without the dashboard abstraction layer. All operations are transparent — they describe what they find and what they will change before writing anything.

## --inspect

`/pm:debug {project-id} --inspect`

Read and analyze all project state files without modifying anything. Show a complete diagnostic report.

### File Existence Check

For each expected file, report whether it exists and its file size:
- `.claude/projects/{project-id}/project.json`
- `.claude/projects/{project-id}/tasks.json`
- `.claude/projects/{project-id}/dependencies.json`
- `.claude/projects/{project-id}/progress/log.md`

Report count of:
- Checkpoints in `checkpoints/`
- Research briefs in `research/`
- Artifact directories in `artifacts/`
- Session summaries in `sessions/`

### JSON Validity

Attempt to parse `project.json` and `tasks.json`. Report:
- PASS (valid JSON)
- FAIL with the parse error message and line/column number

If `tasks.json` is invalid JSON: note "tasks.json cannot be parsed. No further analysis possible. Use `--repair` to attempt recovery from the latest checkpoint."

### tasks.json Analysis (if valid)

```
tasks.json analysis:
  Total tasks:          {n}
  Unique task IDs:      {n} ({duplicates ? "WARN: {n} duplicate IDs found" : "OK"})
  Status distribution:  {PENDING: n, COMPLETE: n, BLOCKED: n, ...}

  Structural issues:
    Orphaned tasks (parent_id points to non-existent task): {n} {list}
    Missing parent tasks (PARENT status but no children):   {n} {list}
    Circular dependencies detected:                         {yes (cycle: T-n → T-m → T-n) | no}
    Invalid dependency refs (point to non-existent IDs):    {n} {list}

  Status consistency issues:
    COMPLETE tasks with empty completion_criteria:   {n} {list}
    COMPLETE tasks with null completed_at:           {n} {list}
    BLOCKED tasks with null blocked_reason:          {n} {list}
    IN_PROGRESS tasks (suggests stalled execution):  {n} {list}

  Research coverage:
    Tasks with fresh research brief (<24h):          {n}/{pending-count}
    Tasks with stale research brief (>24h):          {n}
    Tasks with no research brief:                    {n}
```

### Loop Safety Status

Read `loop_stats` from `project.json`. Report:
- `total_loop_count`
- `consecutive_zero_progress`
- `last_loop_at`

Warn if `consecutive_zero_progress >= 2` or `total_loop_count >= 40`.

### Raw project.json

Show the raw content of `project.json` (formatted). This gives a complete view of all metadata fields.

## --repair

`/pm:debug {project-id} --repair`

Attempt to fix common state corruption issues. Before writing anything, show a repair plan and ask for confirmation.

### Step 1 — Checkpoint Recovery

If `tasks.json` cannot be parsed: find the most recent valid checkpoint in `checkpoints/` and propose restoring from it. Show which checkpoint would be used and its progress stats. Ask: "Restore tasks.json from checkpoint {timestamp}? ({n} tasks, {pct}% complete) (yes / no)"

### Step 2 — Dependency Rebuild

If `dependencies.json` is missing or invalid: rebuild it from scratch by reading all `dependencies` arrays in `tasks.json`. Re-run cycle detection and critical path computation. Propose writing the rebuilt file. Ask: "Rebuild dependencies.json from task dependency fields? (yes / no)"

### Step 3 — Orphan Cleanup

For any task whose `parent_id` points to a non-existent task: set `parent_id: null` and set the task level based on its position in the task ID sequence. Report each change.

### Step 4 — Status Consistency Fixes

- Tasks with status COMPLETE but empty `completion_criteria`: add a placeholder criterion "Task completed (criteria not recorded)". Note: do not change status — this preserves completion history.
- Tasks with status COMPLETE but null `completed_at`: set `completed_at` to the timestamp of the nearest checkpoint where the task first appeared as COMPLETE.
- Tasks with status BLOCKED but null `blocked_reason`: set `blocked_reason: "Reason not recorded"`.
- Tasks with status IN_PROGRESS: ask for each: "T-{n} is marked IN_PROGRESS but no execution cycle is running. Reset to PENDING? (yes / no / block)"

### Step 5 — Duplicate ID Resolution

If duplicate task IDs exist: for each duplicate set, display the two records and ask the user to choose which to keep, which to rename (with a new ID), and which to delete.

After all confirmed repairs: invoke `checkpoint-manager` to save the repaired state as a new checkpoint. Report: "Repair complete. {n} issues fixed. New checkpoint written."

## --reset-task

`/pm:debug {project-id} --reset-task T-{n}`

Resets a specific task to PENDING status, clearing all execution history for that task. This allows re-executing a task from scratch without rebuilding the entire project.

Steps:
1. Load the task record. Show all fields that will be cleared.
2. Ask: "Reset T-{n} ({title}) to PENDING? This will clear: status, completed_at, validation_results, blocked_reason, and cached research. (yes / no)"
3. On yes: set fields to their initial values:
   - `status: "PENDING"`
   - `completed_at: null`
   - `blocked_reason: null`
   - `validation_results: []`
   - `validation_failure_count: 0`
   - `research_cache_key: null`
4. If a research brief exists at `research/{task-id}.md`: ask "Also delete the research cache? (yes / no / keep)"
5. If an artifacts directory exists at `artifacts/{task-id}/`: ask "Also delete artifacts? (yes / no / keep)" Warn that this is irreversible.
6. Re-run `dependency-resolver` to recompute blocked/unblocked state for tasks that depend on this one. Tasks downstream of T-{n} that were PENDING (waiting on it being COMPLETE) remain PENDING — resetting T-{n} does not block them.
7. Invoke `checkpoint-manager`. Announce: "T-{n} reset to PENDING. Run `/pm:work {id} --task T-{n}` to re-execute."
