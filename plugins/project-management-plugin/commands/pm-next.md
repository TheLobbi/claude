---
name: project-management-plugin:pm-next
intent: Show next actionable tasks based on dependencies and priority
tags:
  - project-management-plugin
  - command
  - pm-next
inputs: []
risk: medium
cost: medium
description: Show next actionable tasks based on dependencies and priority
---

# /pm:next — Show Next Actionable Tasks

**Usage**: `/pm:next {project-id} [--count N]`

## Purpose

Shows the next 3–5 highest-priority, currently unblocked, PENDING tasks ready for execution. This is a lightweight, read-only command — it makes no state changes, invokes no execution agents, and writes nothing to disk. Use it at the start of a session for quick orientation, or before running `/pm:work` to preview what will be selected.

## Pre-Conditions

Load `project.json` and `tasks.json`. If either is missing: appropriate error ("Project not found" or "Project not planned yet").

Check for active focus scope in `project.json`. If `focus_scope` is set: filter candidate tasks to only those within the scoped boundary. Announce the active scope at the top of the output.

## Task Selection

Apply the same prioritization logic as `/pm:work` Phase 1 and Phase 2, but without executing:

1. Collect all tasks with `status: PENDING` (and, if scope is set, within the scoped boundary).
2. Filter to only unblocked tasks: all tasks listed in their `dependencies` array must have status `COMPLETE` or `SKIPPED`.
3. Score each task: `score = priority_weight × critical_path_multiplier`
   - `priority_weight`: CRITICAL=4, HIGH=3, MEDIUM=2, LOW=1
   - `critical_path_multiplier`: 2.0 if `on_critical_path: true`, 1.0 otherwise
4. Sort descending by score, then ascending by `estimate_minutes` for ties.
5. Take the top N tasks, where N = `--count` (default 3, min 1, max 10).

## Output

For each selected task, show:

```
Next {n} tasks for {project-name}
{If focus scope active: "Scope: {type} — {name}"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. T-{n}: {title}
   Priority: {priority}  |  Score: {score}  |  Est: {estimate_minutes} min
   Phase: {phase-name} → Epic: {epic-name} → Story: {story-name}
   Critical path: {yes | no}
   Research: {Cached ({age}h old) | Not researched | Skipped}
   HITL required: {yes | no}
   Dependencies: {satisfied (all complete) | none}

2. T-{n}: {title}
   ...

{n} more tasks pending after these.
```

## Research Status Field

For each task, check whether `research/{task-id}.md` exists:
- Exists and `cached_at` within 24 hours → "Cached ({age}h old)" — task can go straight to execution
- Exists but older than 24 hours → "Stale ({age}h old) — research will refresh before execution"
- Does not exist → "Not researched — will research before execution"
- Task is low-complexity (estimate < 10 min) → "Skipped — task is simple enough for direct execution"

## HITL Flag

For each task where `requires_hitl: true`: display `HITL required: yes` prominently. This tells the user that `/pm:work` will pause and ask for confirmation before executing this task.

## Footer

After the task list:

```
Total unblocked PENDING tasks: {n}
Blocked tasks: {n} (run /pm:task block-report {id} for details)
Run /pm:work {id} to execute the top {batch-size} tasks.
Run /pm:work {id} --task T-{n} to execute a specific task.
```

If zero unblocked PENDING tasks exist:

```
No unblocked tasks available.

{If all tasks are COMPLETE or SKIPPED}:
  Project is complete! Run /pm:review {id} for quality council review.

{If blocked tasks exist}:
  {n} tasks are blocked. Run /pm:task block-report {id} to review blockers.

{If all PENDING tasks have unmet dependencies}:
  All pending tasks are waiting on {n} blocked or in-progress tasks.
  Run /pm:status {id} for a full dependency view.
```
