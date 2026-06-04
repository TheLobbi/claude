---
name: project-management-plugin:pm-work
intent: /pm:work — Research-First Task Execution
tags:
  - project-management-plugin
  - command
  - pm-work
inputs: []
risk: medium
cost: medium
---

# /pm:work — Research-First Task Execution

**Usage**: `/pm:work {project-id} [--task T-001] [--serial] [--batch-size N] [--skip-research] [--dry-run] [--gate]`

## Purpose

The main execution engine. Runs one full cycle of the 8-phase work loop: prioritize → select batch → research → decompose check → execute → validate → checkpoint → loop decision. Each invocation processes a batch of tasks and either recurses automatically or surfaces a decision point.

If `--task T-001` is specified: skip prioritization and execute only that task through the full pipeline.
If `--serial`: batch size forced to 1 (one task at a time, sequential).
If `--batch-size N`: override default batch size (default 3, max 5).
If `--skip-research`: skip Phase 3 for all tasks in this cycle (use only if research was done manually).
If `--dry-run`: show the selected batch and planned actions but do not execute, write state, or invoke sub-agents.
If `--gate`: pause after each phase and ask user to confirm before proceeding.

## Phase 0 — Load State

Read `.claude/projects/{project-id}/tasks.json` and the latest checkpoint from `checkpoints/`. If neither exists, error: "Project {project-id} not found or not planned. Run `/pm:plan {project-id}` first."

Check project status in `project.json`:
- If `status: COMPLETE` → report: "Project {name} is already complete. Run `/pm:review {id}` or `/pm:retrospective {id}`." Stop.
- If `status: PAUSED` → report: "Project {name} is paused. Run `/pm:resume {id}` to continue." Stop.
- If `status: BLOCKED` → show the blocking reason and ask the user how to proceed.

Check loop safety counters (stored in project.json under `loop_stats`):
- If `consecutive_zero_progress >= 3` → pause and report: "Three consecutive cycles completed with no progress. Review BLOCKED tasks with `/pm:task block-report {id}`."
- If `total_loop_count >= 50` → pause: "50 execution loops reached — pausing to prevent runaway execution. Run `/pm:status {id}` to review."

## Phase 1 — Prioritize

Invoke the `dependency-resolver` agent to get the set of currently unblocked PENDING tasks. A task is unblocked when all tasks listed in its `dependencies` array have status `COMPLETE` or `SKIPPED`.

Score each unblocked task:
```
score = priority_weight × critical_path_multiplier
priority_weight: CRITICAL=4, HIGH=3, MEDIUM=2, LOW=1
critical_path_multiplier: on_critical_path=2.0, otherwise=1.0
```

Sort all unblocked tasks descending by score. Tasks with the same score sort by estimate_minutes ascending (prefer shorter tasks to make faster progress visible).

If zero tasks are unblocked: check if any PENDING tasks exist whose dependencies are all COMPLETE or SKIPPED. If so, the dependency graph has a problem — invoke dependency-resolver repair mode. If no PENDING tasks exist at all: jump to Phase 8 (all tasks done).

## Phase 2 — Select Batch

Take the top N tasks by score, where N = `--batch-size` (default 3, max 5, 1 if `--serial`).

From the candidate set, remove any pair of tasks where task A depends on task B or vice versa. The final batch must be a set of tasks with no direct dependencies among themselves — they are safe for parallel execution.

If `focus_scope` is set in project.json (from `/pm:focus`): filter the candidate pool to only include tasks within the scoped phase, epic, or story before scoring.

Announce: "Selected batch: {task IDs and titles}. Proceeding to research phase."

## Phase 3 — Research

For each task in the batch (run in parallel if `--serial` is not set):

1. Set task `status: IN_RESEARCH` in tasks.json.
2. Check if a research brief already exists at `research/{task-id}.md` and its `cached_at` timestamp is within 24 hours. If cached and not `--force-refresh`: skip research, use cached brief.
3. Invoke `research-dispatcher` agent with the task record and project context. The dispatcher decides: `DISPATCH` (full research needed) or `SKIP` (task is simple enough to execute directly from the task description).
4. If `DISPATCH`: invoke `deep-researcher` agent with a 4-source research protocol: (a) search existing codebase artifacts and completed task outputs, (b) search project documentation and plan.md, (c) check for relevant research from related completed tasks, (d) if external library/API is involved and MCP is available, query Context7 or Perplexity for current documentation.
5. Save research output to `research/{task-id}.md` with a `cached_at` timestamp.
6. Set task `status: RESEARCHED`.

If `--skip-research` is set: set all tasks in batch directly to `RESEARCHED` status without invoking any research agents.

## Phase 4 — Decompose Check

For each RESEARCHED task: re-read the task record and research brief together. Re-estimate the task given what is now known.

If revised estimate > 30 minutes AND the task has no subtasks: invoke `task-decomposer` to break this task into 2–5 subtasks. Insert the subtasks into tasks.json with `parent_id` pointing to the current task. Set the parent task `status: PARENT` (it will complete when all children complete). Return the new subtasks to Phase 2 as the new batch for this cycle, replacing the parent.

If revised estimate <= 30 minutes or subtasks already exist: proceed to Phase 5.

## Phase 5 — Execute

Set each task `status: IN_PROGRESS`.

Invoke `task-executor` agent per task. If multiple tasks in the batch have no cross-dependencies, invoke them in parallel. Each `task-executor` receives:
- Full task record (title, description, completion_criteria, estimate_minutes)
- Research brief from `research/{task-id}.md` (if it exists)
- Project context (tech stack, phase, epic context from project.json)
- List of artifacts from completed tasks in the same story (for context continuity)

The executor must:
1. Implement the task according to its completion_criteria
2. Write all output artifacts to `artifacts/{task-id}/`
3. Document what was done and any deviations from the plan in `artifacts/{task-id}/execution-notes.md`
4. Return a structured result: `{status: "DONE" | "FAILED", output_summary, artifacts_written, deviations}`

## Phase 6 — Validate

For each completed task, invoke `quality-reviewer` agent with:
- Task record (especially completion_criteria)
- Executor output and artifacts
- Research brief

The reviewer checks each completion criterion explicitly. It must produce:
- `{verdict: "PASS" | "FAIL", criteria_results: [{criterion, met: bool, evidence}], issues: [...]}`

On PASS: set task `status: COMPLETE`, record `completed_at` timestamp, append criterion evidence to `validation_results`.

On FAIL: set task `status: BLOCKED`, set `blocked_reason` to the reviewer's issue list. Increment `validation_failure_count`. Do not proceed to checkpoint for this task — it enters the loop-decision blocked path.

## Phase 7 — Checkpoint

Invoke `checkpoint-manager` to:
1. Write `checkpoints/{iso-timestamp}.json` with: task IDs completed, tasks blocked, current progress counts, session duration so far.
2. Append a one-line summary to `progress/log.md`: `[{timestamp}] Completed: {n}, Blocked: {n}, Total progress: {pct}%`
3. Invoke `progress-monitor` to update all progress counters in project.json.

## Phase 8 — Loop Decision

Evaluate the current project state:

**Any BLOCKED tasks**: Attempt auto-resolution — re-queue the task with `status: PENDING` and append a remediation note to its description (e.g., "Previous attempt failed: {reason}. Retry with fresh approach."). If the same task has been blocked 3 consecutive times: surface it to the user with the specific question that needs a human decision. Do not re-queue a task that has been blocked 3+ times without user input.

**PENDING tasks remain (and no HITL trigger fires)**: Recurse automatically — invoke Phase 1 again without waiting for user input. Increment `total_loop_count` in loop_stats. If zero tasks completed in this cycle, increment `consecutive_zero_progress`; else reset it to 0.

**All tasks are COMPLETE or SKIPPED**: Update `project.json` with `status: COMPLETE`, `completed_at`. Invoke `project-reporter` for a final completion summary. Report: "Project {name} is complete! {n} tasks done. Run `/pm:review {id}` for quality council review, or `/pm:retrospective {id}` for post-completion analysis."

**3 consecutive zero-progress loops**: Pause and report: "No progress in 3 consecutive loops. Blocked tasks need attention. Run `/pm:task show {id}` on each blocked task."

**Loop count > 50**: Pause and report: "Execution loop limit reached (50). This may indicate a structural issue. Run `/pm:debug {id} --inspect` to examine state."

## HITL Triggers

Always pause execution and ask the user for explicit confirmation before continuing when ANY of the following apply to a task about to enter Phase 5 (Execute):

- Task `risk_score > 7`
- Task title or description contains keywords: "delete", "drop table", "migration", "irreversible", "production", "wipe"
- This is the first task in an Epic that has not been touched before (first task with `status` transitioning out of `PENDING` in a new epic)
- The same task has failed quality validation 3 consecutive times

When a HITL trigger fires: show the trigger reason, the task title, and the task's completion criteria. Ask: "Proceed with this task? (yes / no / skip)". On "skip": set task `status: SKIPPED` and unlock its dependents. On "no": pause the project.
