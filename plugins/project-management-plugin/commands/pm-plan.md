---
name: project-management-plugin:pm-plan
intent: Recursive task decomposition from phases to stories to micro-tasks (5-15 min)
tags:
  - project-management-plugin
  - command
  - pm-plan
inputs: []
risk: medium
cost: medium
description: Recursive task decomposition from phases to stories to micro-tasks (5-15 min)
---

# /pm:plan — Ultra-Granular Task Decomposition

**Usage**: `/pm:plan {project-id} [--depth quick|standard|thorough] [--phase {phase-id}] [--force-redecompose]`

## Purpose

Decomposes the project into a full 5-level task hierarchy: Phases → Epics → Stories → Tasks → Micro-tasks. The result is a complete, sequenced, dependency-linked task graph written to `tasks.json` and `dependencies.json`. Every subsequent command — `/pm:work`, `/pm:auto`, `/pm:status` — depends on this file.

## Pre-Conditions

Before running decomposition:
1. Load `.claude/projects/{project-id}/project.json`. If it does not exist, error: "Project {project-id} not found. Run `/pm:init` first."
2. If `tasks.json` already has tasks and `--force-redecompose` is not set: warn "Project already has {n} tasks. Pass `--force-redecompose` to overwrite." Stop.
3. If `--phase {phase-id}` is set: decompose only that phase, merging results into the existing tasks.json without touching other phases.

## Step 1 — Load Context

Read the full `project.json`: goal, tech stack, phases array, known unknowns, risks, and depth setting. If `--depth` is provided on the command line, it overrides the depth stored in project.json for this run.

## Step 2 — Invoke task-decomposer Agent

Invoke the `task-decomposer` agent with this context package:
- Full project goal and description
- All phases with their names and descriptions
- Tech stack (languages, frameworks, databases, external services)
- Security and compliance requirements
- Known unknowns (these must become spike tasks)
- Depth setting (`quick | standard | thorough`)

The task-decomposer must produce ALL tasks in a single pass, organized as:

**Level 1 — Phase**: Top-level grouping, matches the phases from project.json.
**Level 2 — Epic**: Major feature area or component within a phase. Target: 3–8 epics per phase.
**Level 3 — Story**: Deliverable user-facing or system capability within an epic. Target: 3–8 stories per epic.
**Level 4 — Task**: Concrete technical work item within a story. Target: 2–5 tasks per story.
**Level 5 — Micro-task**: Smallest executable unit, assigned to a single agent in a single execution cycle.

Micro-task size targets by depth:
- `quick`: 20–30 min per micro-task
- `standard`: 10–20 min per micro-task (default)
- `thorough`: 5–15 min per micro-task

Each task record must include:
- `id` (format: `T-{zero-padded-number}`, e.g., `T-001`)
- `title` (imperative mood, e.g., "Implement JWT validation middleware")
- `description` (2–5 sentences explaining what must be done and why)
- `level` (`phase | epic | story | task | micro-task`)
- `parent_id` (ID of the parent task, null for phases)
- `phase_id`, `epic_id`, `story_id` (for quick navigation)
- `status` (`PENDING`)
- `priority` (`CRITICAL | HIGH | MEDIUM | LOW`)
- `estimate_minutes` (integer, micro-tasks only)
- `completion_criteria` (array of 2–5 specific, measurable statements)
- `dependencies` (array of task IDs that must complete before this task)
- `agent_assignment` (suggested agent name, or null for auto-selection)
- `risk_score` (placeholder 0, filled by risk-assessor)
- `on_critical_path` (placeholder false, filled by dependency-resolver)
- `requires_hitl` (placeholder false, filled by risk-assessor)
- `validation_results` (empty array)
- `blocked_reason` (null)
- `research_cache_key` (null)

Completion criteria rules:
- Must be specific and verifiable
- Forbidden phrases: "works correctly", "is done", "looks good", "is implemented", "is complete", "functions as expected"
- Each criterion must describe a concrete, checkable outcome

For each known unknown in the project: create a spike task (priority: HIGH, estimate: 60–120 min) with title "Spike: Investigate {unknown}" and completion criteria describing the decision or prototype that resolves the unknown.

## Step 3 — Invoke dependency-resolver Agent

Pass all tasks to the `dependency-resolver` agent. It must:
1. Validate the dependency graph for cycles (using topological sort). If a cycle is found, report it and refuse to write the file.
2. Compute the critical path (longest path through the DAG by total estimated minutes).
3. Set `on_critical_path: true` on all tasks in the critical path.
4. Set `on_critical_path: false` on all other tasks.
5. Compute `parallelizable_pct` — the percentage of micro-tasks that can run in parallel (not on critical path and no direct cross-dependencies).
6. Write `dependencies.json` with the adjacency list and critical path sequence.

## Step 4 — Invoke risk-assessor Agent

Pass all tasks to the `risk-assessor` agent. It must:
1. Score each task `risk_score` (0–10) based on: technical complexity, external dependencies, security sensitivity, reversibility (file deletion, migrations = high risk), and estimate size.
2. Set `requires_hitl: true` on tasks where `risk_score > 7` or task involves file deletion, database migration, or irreversible external API call.
3. Add a `risk_breakdown` field to each task with the component scores.
4. Return the top 5 highest-risk tasks for the summary report.

## Step 5 — Write Output Files

Write atomically (write to `.tmp` file, then rename):

`tasks.json`:
```json
{
  "version": 1,
  "project_id": "{project-id}",
  "generated_at": "{iso-timestamp}",
  "depth": "{depth}",
  "tasks": [ ...all task records... ]
}
```

`dependencies.json`:
```json
{
  "version": 1,
  "adjacency": { "T-001": ["T-003", "T-004"], ... },
  "critical_path": ["T-001", "T-003", "T-007", ...],
  "critical_path_minutes": 840,
  "parallelizable_pct": 62
}
```

Update `project.json`: set `status: "PLANNED"`, `planned_at: "{iso-timestamp}"`, `task_counts: {phases, epics, stories, tasks, micro_tasks, total}`.

## Step 6 — Output Summary

After all files are written, display this decomposition summary:

```
Decomposition complete for {project-name}

Hierarchy:
  Phases:      {n}
  Epics:       {n}
  Stories:     {n}
  Tasks:       {n}
  Micro-tasks: {n}

Scope:
  Total estimated hours: {sum of all micro-task estimates ÷ 60}
  Parallelizable:        {pct}% of micro-tasks
  Critical path:         {n} tasks, {hours}h

Risk:
  HITL-flagged:   {n} tasks
  High-risk (>7): {n} tasks
  Spike tasks:    {n}

Run /pm:work {project-id} to begin execution.
```

## Error Handling

- If the task-decomposer returns fewer than 10 tasks for a non-trivial project, warn and ask if the user wants to re-run with `--depth thorough`.
- If the dependency-resolver finds a cycle, display the cycle path and stop. Do not write partial files.
- If any task is missing required fields, log the issue and abort before writing.
