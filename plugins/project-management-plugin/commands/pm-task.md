---
name: project-management-plugin:pm-task
intent: /pm:task — Task Management CRUD
tags:
  - project-management-plugin
  - command
  - pm-task
inputs: []
risk: medium
cost: medium
---

# /pm:task — Task Management CRUD

**Usage**: `/pm:task {subcommand} {project-id} [options]`

## Purpose

Full create, read, update, and delete interface for individual tasks. Use this when you need to manually intervene in the task backlog: adding tasks that were missed during decomposition, editing fields that need correction, marking tasks complete or blocked by hand, or inspecting a specific task's full record.

All write operations invoke `checkpoint-manager` after mutation to preserve state.

## Subcommands

### add

`/pm:task add {project-id}`

Prompt for all required fields interactively (ask one at a time):
1. Title (imperative mood, e.g., "Add rate limiting to the API gateway")
2. Description (2–5 sentences: what, why, and any relevant constraints)
3. Phase (list available phases from project.json and ask the user to choose)
4. Epic (list epics within the chosen phase)
5. Story (list stories within the chosen epic, or "new" to create one)
6. Priority (CRITICAL / HIGH / MEDIUM / LOW)
7. Estimate in minutes (integer, or "?" to leave unestimated)
8. Completion criteria (ask for criteria one at a time, until the user types "done"; minimum 2 required)
9. Dependencies (list task IDs this task must wait for, or "none")
10. Agent assignment (name a specific agent, or "auto" for automatic selection)

Validation before writing:
- Title must not be empty or duplicate an existing task title.
- Completion criteria: minimum 2, must not contain forbidden phrases: "works correctly", "is done", "looks good", "is implemented", "is complete", "functions as expected". If a criterion contains a forbidden phrase, explain why and ask for a rewrite.
- Estimate must be a positive integer or left blank.

Assign a new task ID: find the highest existing T-{n} and increment by 1.

After writing: invoke `dependency-resolver` to recompute unblocked state and check for new cycles. If a cycle is introduced by the new task's dependencies, reject the write and explain the cycle.

Announce: "Task T-{n} added: '{title}'. Run `/pm:work {id}` to include it in the next execution cycle."

### edit

`/pm:task edit {project-id} T-{n} [--field {field-name}] [--value {value}]`

If `--field` and `--value` are provided: update that field directly without interactive prompting.

If only `--field` is provided without `--value`: prompt the user for the new value.

If neither is provided: show the current task record and ask which field to edit. Repeat until the user says "done".

Editable fields: `title`, `description`, `priority`, `estimate_minutes`, `completion_criteria`, `dependencies`, `agent_assignment`, `status`.

Non-editable via this command (use dedicated subcommands instead): `validation_results`, `blocked_reason` (use `block`), `status` when transitioning from COMPLETE back to PENDING (use `reset-task` in `/pm:debug`).

After any edit, invoke `checkpoint-manager`.

### complete

`/pm:task complete {project-id} T-{n}`

Mark the task COMPLETE manually, bypassing the quality-reviewer validation. Warn: "This bypasses quality validation. Are you sure? (yes / no)" On yes: set `status: COMPLETE`, `completed_at`, and append to `validation_results`: `{bypassed: true, bypassed_at: {timestamp}, reason: "manual complete"}`.

Invoke `checkpoint-manager`. Invoke `dependency-resolver` to unlock any tasks that were waiting on this one.

### block

`/pm:task block {project-id} T-{n} "{reason}"`

Set task `status: BLOCKED` with the given reason string. If the task is currently IN_PROGRESS, warn: "Task is currently in-progress. Blocking it will halt execution. Confirm? (yes / no)"

On confirm: set `status: BLOCKED`, `blocked_reason: "{reason}"`.

Invoke `checkpoint-manager`. Note in the progress log: `[{timestamp}] Task T-{n} manually blocked: {reason}`.

### skip

`/pm:task skip {project-id} T-{n}`

Skip this task. Warn: "Skipping a task will mark it SKIPPED and unlock its dependents. Tasks that depend on skipped tasks will proceed as if this task completed. Are you sure? (yes / no)"

On confirm: set `status: SKIPPED`, `skipped_at`. Invoke `dependency-resolver` to update unblocked state for all downstream tasks.

Invoke `checkpoint-manager`.

### assign

`/pm:task assign {project-id} T-{n} --agent {agent-name}`

Set `agent_assignment` field to the given agent name. Valid agent names are listed in `plugins/project-management-plugin/agents/`. If the agent name does not match a known agent, warn but allow: "Agent '{name}' is not in the known agent list. Setting anyway. Verify the name is correct."

Invoke `checkpoint-manager`.

### show

`/pm:task show {project-id} T-{n}`

Display the full task record in a structured, human-readable format:

```
Task T-{n}: {title}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status:     {status}
Priority:   {priority}
Estimate:   {estimate_minutes} min
Level:      {level}
Phase:      {phase title}
Epic:       {epic title}
Story:      {story title}

Description:
{description}

Completion Criteria:
  1. {criterion}
  2. {criterion}
  ...

Dependencies: {list of T-{n} IDs, or "none"}
Dependents:   {tasks that depend on this one}
Agent:        {agent_assignment or "auto"}
On critical path: {yes | no}
Risk score:   {risk_score}/10 {requires_hitl ? "[HITL required]" : ""}

Research: {research/{task-id}.md exists ? "Cached (age: {hours}h)" : "Not researched"}
Artifacts: {list of files in artifacts/{task-id}/, or "none"}

Validation History:
  {validation_results list, or "No validations run yet"}

Blocked Reason: {blocked_reason or "N/A"}
```

### block-report

`/pm:task block-report {project-id}`

List all tasks currently in BLOCKED status with their reasons. Group by epic. Show the dependency chain for each blocked task (what is waiting on it). This is a diagnostic tool to understand why the project is stalled.
