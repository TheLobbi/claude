---
name: project-management-plugin:pm-delegate
intent: Delegate a task to a specific specialized agent
tags:
  - project-management-plugin
  - command
  - pm-delegate
inputs: []
risk: medium
cost: medium
description: Delegate a task to a specific specialized agent
---

# /pm:delegate — Delegate to Specialized Agent

**Usage**: `/pm:delegate {project-id} T-{n} --agent {agent-name}`

## Purpose

Explicitly assigns and immediately dispatches a specific task to a named agent, bypassing the automatic agent selection logic used by `/pm:work`. Use this when the automatic routing selects the wrong specialist, when you want to force a specific agent for a sensitive or high-risk task, or when testing how a particular agent handles a task type.

Unlike `/pm:work`, which runs the full 8-phase loop, `/pm:delegate` focuses on a single task and runs only the research → execute → validate pipeline for that task.

## Pre-Conditions

1. Load `project.json` and the task record for T-{n} from `tasks.json`. If the task does not exist: error with available task IDs.
2. Verify the task is not already COMPLETE or IN_PROGRESS. If COMPLETE: "Task T-{n} is already complete. Run `/pm:debug {id} --reset-task T-{n}` if you want to re-execute it." If IN_PROGRESS: "Task T-{n} is currently in-progress. Wait for it to complete or check if a previous execution cycle stalled."
3. If the task is BLOCKED: warn "Task T-{n} is blocked: {blocked_reason}. Delegating anyway will attempt execution despite the block. Continue? (yes / no)"

## Agent Name Resolution

Look up the agent name in `plugins/project-management-plugin/agents/`. Available agents include: `task-executor`, `deep-researcher`, `quality-reviewer`, `task-decomposer`, `dependency-resolver`, `risk-assessor`, `progress-monitor`, `checkpoint-manager`, `council-reviewer`, `pm-integrator`, `project-orchestrator`, `project-reporter`, `pattern-recognizer`, and `research-dispatcher`.

If the agent name does not match any known agent: warn "'{agent-name}' is not in the known agent registry. Proceeding anyway — verify the agent name is correct before expecting meaningful results." Do not block — allow delegating to any named agent, including those outside the plugin's own registry (e.g., platform-level agents from `.claude/agents/`).

## Execution Pipeline

### Step 1 — Research

Check for a cached research brief at `research/{task-id}.md`. If the cache is fresh (within 24 hours) and the task description has not changed since the cache was written: use the cached brief and skip new research.

Otherwise: invoke `deep-researcher` (regardless of the `--agent` flag, which applies only to the execution step). Research is always handled by `deep-researcher`. Save the brief to `research/{task-id}.md`.

Set task `status: RESEARCHED`.

### Step 2 — Execute

Set task `status: IN_PROGRESS`. Update `agent_assignment` in the task record to `{agent-name}`.

Invoke the specified agent (`--agent {agent-name}`) with:
- Full task record (title, description, completion_criteria, estimate_minutes, level, phase/epic/story context)
- Research brief (if available)
- Project context (tech stack, goal, and phase description from project.json)
- Artifacts from completed tasks in the same story (for continuity)

The agent must:
1. Implement the task according to its completion_criteria.
2. Write output artifacts to `artifacts/{task-id}/`.
3. Write `artifacts/{task-id}/execution-notes.md` documenting what was done, any deviations from the plan, and actual time taken.
4. Return: `{status: "DONE" | "FAILED", output_summary, artifacts_written, deviations}`

If the agent returns FAILED: set task `status: BLOCKED`, `blocked_reason: "{agent-name} reported failure: {output_summary}"`. Invoke `checkpoint-manager`.

### Step 3 — Validate

Invoke `quality-reviewer` on the task and its artifacts (same as the validation phase in `/pm:work`).

On PASS: set task `status: COMPLETE`, `completed_at`. Record validation results. Invoke `checkpoint-manager`. Invoke `dependency-resolver` to unlock downstream tasks.

On FAIL: set task `status: BLOCKED`, `blocked_reason` to the reviewer's issue list. Invoke `checkpoint-manager`.

## Output

```
Delegation complete: T-{n}

Agent:   {agent-name}
Status:  {COMPLETE | BLOCKED}
Result:  {output_summary from executor}

{If COMPLETE}:
Artifacts: {list of files written}
Unlocked:  {list of task IDs now unblocked, or "none"}

{If BLOCKED}:
Reason: {blocked_reason}
Run /pm:research {id} T-{n} --force-refresh to refresh research, then retry.
```

## After Delegation

Update `agent_assignment` in `tasks.json` permanently to record which agent handled this task. This data feeds into the session analytics and pattern recognizer for future agent routing improvements.
