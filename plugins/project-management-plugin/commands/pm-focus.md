---
name: project-management-plugin:pm-focus
intent: Narrow execution scope to a specific phase, epic, or story
tags:
  - project-management-plugin
  - command
  - pm-focus
inputs: []
risk: medium
cost: medium
description: Narrow execution scope to a specific phase, epic, or story
---

# /pm:focus — Scope Narrowing

**Usage**: `/pm:focus {project-id} --phase {phase-id} | --epic {epic-id} | --story {story-id} | clear`

## Purpose

Narrows the execution scope so `/pm:work` and `/pm:auto` only process tasks within the specified boundary. The focus scope is stored in `project.json` and persists across sessions until explicitly cleared. Use this to tackle one area of the project at a time, unblock a specific team's work, or prioritize a critical epic before returning to the full backlog.

When a focus scope is active, all commands that select tasks — `/pm:work` (Phase 1 prioritization), `/pm:auto`, `/pm:next`, `/pm:backlog` — filter their candidate task pools to only include tasks within the scoped boundary. Tasks outside the scope are neither executed nor shown as next-up.

## Setting a Focus

### Phase Focus

`/pm:focus {project-id} --phase {phase-id}`

1. Load `project.json`. Find the phase with ID matching `{phase-id}`. If not found, list available phase IDs and error.
2. Count PENDING tasks within the phase.
3. Write `focus_scope: { type: "phase", id: "{phase-id}", name: "{phase-name}", set_at: "{iso-timestamp}" }` to `project.json`.
4. Announce: "Focus set to Phase: '{phase-name}'. {n} pending tasks in scope. `/pm:work {id}` and `/pm:auto {id}` will only process this phase."

### Epic Focus

`/pm:focus {project-id} --epic {epic-id}`

1. Load `project.json` and `tasks.json`. Find the epic task record matching `{epic-id}`.
2. Collect all task IDs that are children of this epic (direct children and all descendants).
3. Write `focus_scope: { type: "epic", id: "{epic-id}", name: "{epic-title}", phase_id: "{parent-phase-id}", set_at: "{iso-timestamp}" }` to `project.json`.
4. Announce: "Focus set to Epic: '{epic-title}' (in Phase: '{phase-name}'). {n} pending tasks in scope."

### Story Focus

`/pm:focus {project-id} --story {story-id}`

1. Find the story task record matching `{story-id}`.
2. Collect all task and micro-task IDs that descend from this story.
3. Write `focus_scope: { type: "story", id: "{story-id}", name: "{story-title}", epic_id: "{parent-epic-id}", phase_id: "{parent-phase-id}", set_at: "{iso-timestamp}" }` to `project.json`.
4. Announce: "Focus set to Story: '{story-title}'. {n} pending tasks in scope."

## Clearing the Focus

`/pm:focus {project-id} clear`

1. Read current `focus_scope` from `project.json`. If it is already null, report: "No focus scope active. Nothing to clear."
2. Set `focus_scope: null` in `project.json`.
3. Count total PENDING tasks across the whole project.
4. Announce: "Focus cleared. Back to full project scope. {n} pending tasks across all phases."

## Showing Current Focus

`/pm:focus {project-id}`

When called with no flag and no "clear" argument: show the current focus scope status.

```
Focus scope for {project-name}:
  Active: YES
  Type:   Epic
  Name:   Auth System
  Phase:  Phase 2: Core Features
  Set at: {relative-time}
  Scope:  {n} tasks ({m} PENDING, {k} COMPLETE)

To clear: /pm:focus {id} clear
To change: /pm:focus {id} --phase | --epic | --story {id}
```

If no focus is active:
```
Focus scope for {project-name}: NONE (full project scope)
All {n} pending tasks are eligible for execution.
```

## Interaction with Dependency Resolution

The focus scope narrows the selection pool, but does NOT bypass dependency ordering. A task inside the scope cannot be executed if it depends on a task outside the scope that is not yet COMPLETE. If this situation arises during `/pm:work`:

Report the blocking dependency: "Task T-{n} ({title}) is in scope but depends on T-{m} ({outside-scope title}), which is outside the current focus scope and not COMPLETE. Expand scope or complete the dependency first."

Do not automatically expand the scope — require the user to explicitly run `/pm:focus clear` or adjust the scope boundary.

## Focus and HITL

Focus scope does not disable HITL triggers. HITL conditions (risk_score > 7, destructive operations, epic boundaries) still apply to tasks within the focused scope.

## Persistence

The focus_scope field in `project.json` persists across sessions. At the start of each `/pm:work` or `/pm:auto` invocation, announce if a focus scope is active: "Note: Focus scope active — Phase: '{name}'. Run `/pm:focus {id} clear` to disable."
