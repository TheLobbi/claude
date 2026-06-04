---
name: project-management-plugin:pm-status
intent: ASCII progress dashboard for the active project
tags:
  - project-management-plugin
  - command
  - pm-status
inputs: []
risk: medium
cost: medium
description: ASCII progress dashboard for the active project
---

# /pm:status — Project Progress Dashboard

**Usage**: `/pm:status [{project-id}] [--phase {phase-id}] [--verbose]`

## Purpose

Renders an ASCII progress dashboard showing the current state of a project. Read-only: this command never modifies any project files. Use it at the start of a session to orient yourself, or any time you want a quick overview of where things stand.

## When No project-id is Provided

List all projects found in `.claude/projects/`. For each, show a single-line summary:
```
{project-id} | {status} | {pct}% | {tasks-complete}/{tasks-total} | Last active: {relative-time}
```
Sort by last-active descending (most recently active first). If no projects exist: "No projects found. Run `/pm:init` to create your first project."

## When project-id is Provided

Invoke the `project-reporter` agent to generate the full dashboard. The agent reads `project.json`, `tasks.json`, `dependencies.json`, and the latest checkpoint from `checkpoints/`. It renders:

```
╔══════════════════════════════════════════════════════════════╗
║  PROJECT: {name}                                             ║
║  Goal: {goal_truncated_to_60_chars}                          ║
╠══════════════════════════════════════════════════════════════╣
║  Overall: ████████░░░░░░░░░░ 42% (127/302 micro-tasks)       ║
║  Status: IN_PROGRESS · Phase 2                               ║
╠══════════════════════════════════════════════════════════════╣
║  PHASES                                                      ║
║  [✓] Phase 1: Foundation           100%  (48/48)             ║
║  [►] Phase 2: Core Features         38%  (52/138)            ║
║      [✓] Epic: Auth System         100%  (23/23)             ║
║      [►] Epic: Product Catalog      68%  (17/25)             ║
║      [  ] Epic: Shopping Cart        0%  (0/30)              ║
║  [  ] Phase 3: Testing               0%  (0/67)              ║
╠══════════════════════════════════════════════════════════════╣
║  NEXT: [T-072] Product image upload (10 min est.)            ║
║  BLOCKED: [T-088] Stripe webhook (spike task pending)        ║
║  PM SYNC: Linear · Last sync 3 min ago                       ║
╚══════════════════════════════════════════════════════════════╝
```

## Progress Bar Rendering

The progress bar is exactly 20 characters wide:
- Each `█` represents 5% completion (1 char = 5%)
- Each `░` represents 5% remaining
- A partially-filled block (for non-multiples of 5%) rounds to nearest whole block

Examples:
- 0%:   `░░░░░░░░░░░░░░░░░░░░`
- 25%:  `█████░░░░░░░░░░░░░░░`
- 42%:  `████████░░░░░░░░░░░░`
- 100%: `████████████████████`

## Status Indicators

Phase/epic status icons:
- `[✓]` — 100% complete
- `[►]` — in progress (any tasks complete or in-progress)
- `[!]` — has blocked tasks
- `[  ]` — not started (0% complete)

## Metrics Section (shown with --verbose)

When `--verbose` is set, append an additional section after the phase tree:

```
╠══════════════════════════════════════════════════════════════╣
║  METRICS                                                     ║
║  Velocity: 8.3 tasks/hour (last session)                     ║
║  Est. accuracy: 87% (actual vs. estimated)                   ║
║  Validation failures: 4 (retry rate: 3.1%)                   ║
║  Research cache hits: 72%                                    ║
║  Sessions: 3 · Total time: 4h 22m                            ║
║  Critical path: 18 tasks remaining (est. 6h 40m)             ║
╚══════════════════════════════════════════════════════════════╝
```

Velocity is computed from `sessions/` files: total tasks completed / total session minutes × 60.

Estimate accuracy: for all COMPLETE micro-tasks, compute (sum of estimates) / (sum of actual durations from execution notes) × 100. If actual duration data is not available, omit this metric.

## Phase Filter

When `--phase {phase-id}` is provided: show only the dashboard rows for that phase and its epics. The overall progress bar still shows the full project percentage. The "NEXT" and "BLOCKED" lines show only tasks from the specified phase.

## NEXT Task Selection

The "NEXT" line shows the single highest-priority unblocked PENDING task (using the same scoring formula as `/pm:work` Phase 1). Show: task ID, title, and estimate_minutes.

## BLOCKED Line

Show the highest-risk blocked task: task ID, title, and a brief blocked_reason excerpt (max 40 chars). If no tasks are blocked, omit this line.

## PM Sync Line

If `project.json` has a `pm_integration` field with a platform and `last_sync_at` timestamp: show "PM SYNC: {platform} · Last sync {relative-time}". If never synced: show "PM SYNC: {platform} · Never synced". If no PM integration: omit this line entirely.

## Error Cases

- Project not found → "Project '{id}' not found. Available projects: {list}. Run `/pm:init` to create a new one."
- tasks.json missing → "Project exists but has not been planned yet. Run `/pm:plan {id}`."
- tasks.json is corrupt (JSON parse error) → "State file corrupt. Run `/pm:debug {id} --repair`."
