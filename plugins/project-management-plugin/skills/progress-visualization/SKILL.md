---
intent: "Render ASCII progress dashboards with phase/epic/task breakdown and velocity metrics"
description: "Rendering ASCII progress dashboards with phase/epic/task breakdown and velocity metrics"
---

# Progress Visualization Skill

## The ASCII Dashboard Format

The progress dashboard is rendered as a self-contained ASCII block using box-drawing characters. It is designed to be legible in any terminal, in markdown code blocks, and in plain-text environments where rich formatting is unavailable. The dashboard is regenerated on demand and after every phase completion; it is not stored to disk (the progress log captures events; the dashboard is a computed view over tasks.json).

The outermost container uses heavy box-drawing characters:

```
╔══════════════════════════════════════════════════════════════════╗
║  PROJECT: {project-name}                      v{version}        ║
║  Goal: {goal-text truncated to 55 chars}                        ║
╠══════════════════════════════════════════════════════════════════╣
║  STATUS: {status}    PHASE: {current-phase-name}                ║
║  Started: {created_at date}    Loop #: {loop_count}             ║
╠══════════════════════════════════════════════════════════════════╣
║  OVERALL PROGRESS                                               ║
║  [{progress-bar-50-chars}] {pct}%  ({complete}/{total} tasks)   ║
╠══════════════════════════════════════════════════════════════════╣
║  PHASES                                                         ║
║  ...phase rows...                                               ║
╠══════════════════════════════════════════════════════════════════╣
║  VELOCITY & ETA                                                 ║
║  ...metrics rows...                                             ║
╠══════════════════════════════════════════════════════════════════╣
║  PM SYNC                                                        ║
║  ...sync status row...                                          ║
╚══════════════════════════════════════════════════════════════════╝
```

The total dashboard width is fixed at 68 characters (including the two border characters). All inner content is padded to exactly 66 characters. Lines that exceed 66 characters are truncated with an ellipsis at character 63 (`...`). Lines shorter than 66 characters are right-padded with spaces.

## Progress Bar Formula

The overall progress percentage is computed exclusively from leaf tasks — tasks that have no entries in their `subtasks` array. This correctly handles the hierarchical task tree: a story with 4 subtasks contributes 0 to the numerator until its subtasks complete; each completed subtask contributes 1/4 of the story's weight to the overall count.

```
progress_pct = (count of leaf tasks with status == "COMPLETE") /
               (count of all leaf tasks) * 100
```

Leaf tasks in BLOCKED status are counted in the denominator but not the numerator. They are displayed separately in the blocked task section rather than being excluded from the denominator (which would artificially inflate the percentage).

The progress bar itself is 50 characters wide. The number of filled characters is `floor(progress_pct / 100 * 50)`. Filled characters are rendered as `█`; empty characters are rendered as `░`. The bar always shows the boundary between filled and empty to make small progress visible even at low percentages.

## Phase Completion Bars

Each phase is rendered as a row in the PHASES section. The row format is:

```
║  {phase-name padded to 20}  [{bar-20-chars}] {pct}%  {status-icon}  ║
```

The 20-character phase progress bar uses the same `█`/`░` fill formula as the overall bar but computed only over leaf tasks belonging to that phase. The status icon is a single character: `✓` for COMPLETE, `▶` for IN_PROGRESS, `○` for PENDING, `⊘` for SKIPPED. If phase-name exceeds 20 characters, it is truncated with no ellipsis (the bar is more important than the full name).

Phases are listed in their natural order from the `phases` array. The current active phase (the first phase with status IN_PROGRESS) is highlighted by replacing the outer `║` characters on its row with `▌` on the left and `▐` on the right, making it visually distinct without requiring color.

## Nested Epic/Story/Task Indentation

Below the phase overview, the dashboard renders a detailed breakdown for the current active phase only (rendering all phases would exceed practical terminal height for large projects). The breakdown uses a 2-space indent per level:

```
║  PHASE DETAIL: {current-phase-name}                            ║
║                                                                ║
║    EPIC: {epic-title}  [{bar-15}] {pct}%                       ║
║      Story: {story-title}  [{bar-10}] {pct}%                   ║
║        ▶ Task: {task-title}  {estimate}m  {status}             ║
║          · Subtask: {subtask-title}  {status-icon}             ║
║        ✓ Task: {completed-task-title}  ({actual}m)             ║
║        ⚠ Task: {blocked-task-title}  BLOCKED                   ║
```

Epics are rendered with a 15-character bar and their own percentage. Stories are rendered with a 10-character bar. Individual tasks and subtasks are rendered as text-only rows with status indicators. A task row shows its estimate in minutes while PENDING/IN_PROGRESS, and shows its actual time in parentheses once COMPLETE.

If the current phase has more than 30 leaf tasks, the detail section is abbreviated: only epics with at least one non-COMPLETE task are shown, and stories within those epics are collapsed to a single summary line ("N tasks: X complete, Y in-progress, Z pending").

## Blocked Task Display

Blocked tasks are surfaced in a dedicated section placed between the PHASES section and the VELOCITY section. This placement ensures they cannot be missed — they interrupt the natural flow of the dashboard rather than appearing in a footer that might be scrolled past.

```
╠══════════════════════════════════════════════════════════════════╣
║  BLOCKED ({count})                                              ║
║  ⚠ {task-id}: {task-title truncated to 45}                     ║
║    └─ {blocked_reason truncated to 58}                         ║
```

Each blocked task gets two lines: the task identifier and title, then the blocked reason indented with a tree connector. If `blocked_reason` is null (which should not happen but may occur in corrupted state), the reason line reads "No reason recorded — review tasks.json." If there are no blocked tasks, the BLOCKED section is omitted entirely rather than showing a zero count.

## Velocity and ETA Calculation

Velocity is computed as the rolling average of `actual_minutes` over the last 10 completed leaf tasks. If fewer than 10 leaf tasks are complete, velocity is computed over all completed leaf tasks. If no leaf tasks are complete, velocity is displayed as "—" (not yet established).

```
║  VELOCITY & ETA                                                 ║
║  Velocity: {velocity}m/task (rolling 10)                        ║
║  Completed today: {count} tasks ({total-minutes}m)              ║
║  Remaining: {remaining-leaf-count} tasks                        ║
║  ETA: {eta-date} ({hours}h at current velocity)                 ║
```

ETA is computed as: `remaining_leaf_count * velocity_minutes / 60` hours from now, displayed as a wall-clock date. The ETA does not account for parallelism — it is a pessimistic single-threaded estimate. When velocity is not yet established, ETA is displayed as "Insufficient data (< 3 tasks complete)."

The "Completed today" row resets at midnight UTC. It uses the `completed_at` timestamps in tasks.json rather than the progress log, so it reflects only formally validated completions.

## PM Sync Status Line

The final section of the dashboard shows the integration status with the connected PM platform (if any):

```
╠══════════════════════════════════════════════════════════════════╣
║  PM SYNC: {platform-name}                                       ║
║  Last sync: {last_sync_at or "Never"}                           ║
║  Synced tasks: {count-with-external-id} / {total-tasks}         ║
╚══════════════════════════════════════════════════════════════════╝
```

If `pm_integration` is null, the PM SYNC section is replaced with:

```
║  PM SYNC: Not configured (use /pm-init to connect a platform)  ║
```

The sync section is always the last element before the bottom border, making it easy to find regardless of how long the phase detail section is.
