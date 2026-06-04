---
name: project-management-plugin:pm-auto
intent: Autonomous project execution loop that runs until completion or block
tags:
  - project-management-plugin
  - command
  - pm-auto
inputs: []
risk: medium
cost: medium
description: Autonomous project execution loop that runs until completion or block
---

# /pm:auto — Autonomous Project Execution Loop

**Usage**: `/pm:auto {project-id} [--budget-tasks N] [--budget-minutes N] [--serial] [--pause-on-epic]`

## Purpose

Runs the `/pm:work` execution loop continuously and autonomously until the project is COMPLETE, all remaining tasks are BLOCKED, a budget limit is reached, or a HITL trigger fires. This is the "set it and go" mode — invoke it when you want the system to work through the entire project without manual triggering between cycles.

## Pre-Conditions

1. Load `project.json` for `{project-id}`. If not found: "Project not found. Run `/pm:init` first."
2. If `status` is not `PLANNED` or `IN_PROGRESS`: error with the appropriate message (complete → suggest review, paused → suggest resume).
3. Confirm the session start: "Starting autonomous execution for '{project-name}'. {n} tasks pending. {budget_message}." Set `project.json` `status: IN_PROGRESS` if not already set.

## Invocation

Invoke the `project-orchestrator` agent to manage the full autonomous loop. The orchestrator receives:
- Full project.json
- Current tasks.json
- All flag values (`--budget-tasks`, `--budget-minutes`, `--serial`, `--pause-on-epic`)
- The current session start timestamp

The orchestrator runs the `/pm:work` logic internally in a continuous loop, tracking:
- `session_tasks_completed` — tasks completed since this `/pm:auto` invocation
- `session_start_time` — for duration tracking and `--budget-minutes` enforcement
- `current_epic_id` — for `--pause-on-epic` detection

## Epic Boundary Reporting

At the start of each new Epic (the first PENDING task in an Epic that was previously untouched), announce before executing:

```
─────────────────────────────────────────────────────
Starting Epic: {epic-title}
Phase {n} of {total} · {n} tasks · est. {hours}h
─────────────────────────────────────────────────────
```

If `--pause-on-epic` is set: pause after announcing, before executing any tasks in the new Epic. Report: "Epic boundary reached. Paused (--pause-on-epic). Run `/pm:auto {id}` to continue into this epic."

## Budget Controls

`--budget-tasks N`: After each completed task, check `session_tasks_completed`. If it has reached N: pause and report: "Task budget reached ({N} tasks completed this session). Run `/pm:auto {id}` to continue."

`--budget-minutes N`: After each work cycle checkpoint, check elapsed session duration. If it has exceeded N minutes: pause and report: "Time budget reached ({N} min). Run `/pm:auto {id}` to continue."

If both budgets are specified, pause when either is reached first.

## HITL Handling Inside auto

When any HITL trigger fires (as defined in `/pm:work`), the orchestrator must:
1. Pause the loop immediately — do not execute the triggering task.
2. Surface the trigger reason, task ID, title, and completion criteria.
3. Ask: "This task requires human review before proceeding. Proceed? (yes / no / skip)"
4. On yes: execute the task and continue the loop.
5. On no: pause the project (`status: PAUSED`) and write a session summary.
6. On skip: mark the task SKIPPED, unlock dependents, and continue the loop.

## Session Summary

When the loop exits for any reason (completion, budget, HITL, all-blocked), write a session summary to `sessions/{date}T{time}.md`:

```markdown
# Session {date}

**Duration**: {minutes} min
**Tasks completed**: {n}
**Tasks blocked**: {n}
**Stopping reason**: {COMPLETE | BUDGET_TASKS | BUDGET_MINUTES | HITL_PAUSE | ALL_BLOCKED}

## Tasks Completed
- T-{n}: {title}
...

## Tasks Blocked
- T-{n}: {title} — {blocked_reason}
...

## Velocity
Average task duration: {avg} min
Estimate accuracy: {actual/estimated}%
```

Update `project.json` with `last_session_at`, `total_session_count`, and accumulated `total_tasks_completed`.

## Completion

When all tasks reach COMPLETE or SKIPPED status:
1. Set `project.json` `status: COMPLETE`, `completed_at`.
2. Write the final session summary.
3. Report:

```
Project complete: {project-name}

{n} tasks done in {duration} ({n} sessions)
{n} tasks skipped
Quality failures resolved: {n}

Run /pm:review {id} for quality council review.
Run /pm:retrospective {id} for post-completion analysis.
```

## All-Blocked State

If the orchestrator completes a loop with zero tasks making progress and all remaining PENDING tasks are in BLOCKED or IN_RESEARCH status: pause and report:

```
All remaining tasks are blocked. Cannot continue autonomously.

Blocked tasks:
- T-{n}: {title} — {reason}
...

Run /pm:task block-report {id} for full details.
Run /pm:work {id} --task T-{n} after resolving each blocker.
```

## Behavior with --serial

When `--serial` is set: pass this flag through to each `/pm:work` cycle. The orchestrator executes one task per cycle. Useful for projects where parallelism causes interference (e.g., shared database schema migrations where order matters strictly).
