---
name: project-management-plugin:pm-backlog
intent: /pm:backlog — Backlog Management
tags:
  - project-management-plugin
  - command
  - pm-backlog
inputs: []
risk: medium
cost: medium
---

# /pm:backlog — Backlog Management

**Usage**: `/pm:backlog {project-id} [--groom | --prioritize | --reestimate]`

## Purpose

Provides tools for maintaining the health and quality of the task backlog. Use these operations periodically — especially when the project has evolved, many new tasks have been added manually, or estimates are drifting from actuals. These are all read-analyze-write operations that invoke agents to reason about the backlog and then update `tasks.json`.

When called with no flag: show a backlog health summary (number of tasks by status, tasks failing INVEST criteria, tasks over the estimate threshold) without modifying anything.

## No-Flag Health Summary

`/pm:backlog {project-id}`

Display:

```
Backlog Health: {project-name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Task counts by status:
  PENDING:      {n}
  IN_PROGRESS:  {n}
  COMPLETE:     {n}
  BLOCKED:      {n}
  SKIPPED:      {n}

INVEST health (PENDING tasks only):
  Missing completion_criteria:       {n} tasks
  Vague criteria (forbidden phrase): {n} tasks
  Over estimate threshold (>30 min): {n} tasks
  Too many dependencies (>5):        {n} tasks

Priority distribution:
  CRITICAL: {n}  HIGH: {n}  MEDIUM: {n}  LOW: {n}

Run --groom to fix INVEST issues.
Run --prioritize to re-score priorities.
Run --reestimate to refresh estimates.
```

## --groom

`/pm:backlog {project-id} --groom`

Runs INVEST validation on all PENDING tasks and flags or fixes issues.

Invoke the `task-decomposer` agent in grooming mode. It reviews each PENDING task and applies these checks:

**Missing completion_criteria**: Tasks with zero or one criterion. The groomer must generate 2–3 measurable criteria for each. Present the generated criteria to the user before writing: "Generated criteria for T-{n}: {list}. Apply? (yes / no / edit)"

**Vague criteria**: Criteria containing forbidden phrases ("works correctly", "is done", "looks good", "is implemented", "is complete", "functions as expected"). For each vague criterion: generate a replacement. Present to user before writing.

**Over-threshold tasks**: Tasks with `estimate_minutes > 30` and no subtasks. Ask: "T-{n} ({title}) is estimated at {n} min. Decompose into subtasks? (yes / no / later)" On yes: invoke task-decomposer to create subtasks and set the parent to PARENT status.

**Too many dependencies**: Tasks with more than 5 entries in their `dependencies` array. Show the dependency list and ask: "T-{n} has {n} dependencies. Review and remove unnecessary ones? (yes / no)" On yes: present the list for the user to prune, then write the updated list.

After grooming: report the number of tasks reviewed, issues fixed, and changes pending user confirmation.

Invoke `checkpoint-manager` after all confirmed changes.

## --prioritize

`/pm:backlog {project-id} --prioritize`

Re-scores task priorities based on the current project state. Priority scores should evolve as the project progresses: completing dependencies should increase the urgency of downstream tasks, and discovering new risks should elevate previously low-priority tasks.

Invoke the `risk-assessor` in priority-scoring mode. It evaluates each PENDING task considering:

- **Dependency completion factor**: If all but one dependency is complete, this task is now imminent and priority should rise.
- **Epic completion factor**: If this task is the last blocking task in an epic, increase its priority to unblock downstream epics.
- **Critical path factor**: Recalculate `on_critical_path` status based on current COMPLETE/PENDING state (the critical path changes as tasks complete).
- **Time pressure factor**: If the project has been running longer than the estimated critical path duration, increase priority on all critical path tasks.

Present a summary of priority changes before writing:

```
Priority changes to apply:
  T-{n}: MEDIUM → HIGH (last blocker in Auth System epic)
  T-{n}: HIGH → CRITICAL (on critical path, project overrunning estimate)
  T-{n}: LOW → MEDIUM (2 of 3 dependencies now complete)
  ...

Apply these changes? (yes / no / review each)
```

On yes: write updated priorities and `on_critical_path` flags to `tasks.json`. Invoke `checkpoint-manager`.

## --reestimate

`/pm:backlog {project-id} --reestimate`

Re-runs estimation on all PENDING tasks using current research context. Useful after: scope changes, discovering that a technology is more complex than expected, or after completing similar tasks that revealed accurate baseline times.

Invoke the `task-decomposer` in estimation mode. For each PENDING micro-task, it:
1. Reads the task description and completion_criteria.
2. Reads the research brief if one exists in `research/{task-id}.md`.
3. Reads execution-notes.md from similar completed tasks (same epic or similar task types) for actuals as calibration.
4. Produces a revised estimate and a one-line rationale.

Present changes before writing:

```
Estimate revisions:
  T-{n}: 15 min → 25 min  "More complex than initial estimate; requires auth middleware integration"
  T-{n}: 30 min → 15 min  "Similar pattern already established in T-044 artifacts"
  T-{n}: 20 min → 20 min  (unchanged)
  ...

Net change: +{n} min total estimated remaining scope.
Apply all? (yes / no / review each)
```

On yes: write updated `estimate_minutes` values to `tasks.json`. Recalculate and update the `critical_path_minutes` in `dependencies.json`. Invoke `checkpoint-manager`.
