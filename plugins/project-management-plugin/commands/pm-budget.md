---
name: project-management-plugin:pm-budget
intent: Cap the number of tool calls allowed for the current task; nudges Claude at 80% and 120%
tags:
  - project-management-plugin
  - command
  - pm-budget
inputs: []
risk: medium
cost: medium
description: Cap the number of tool calls allowed for the current task; nudges Claude at 80% and 120%
---

# /pm:budget — Turn Budget

**Usage**:
- `/pm:budget set <N>` — cap the current task at N tool calls
- `/pm:budget show` — print used / max / percent / status
- `/pm:budget clear` — deactivate the cap

## Purpose

Keeps a long autonomous run from silently blowing through hundreds of
tool calls. A `PostToolUse` hook (`budget-warn.sh`) reads the current
status after every call and injects a notification when:

- **80% consumed** — "turn budget approaching" soft warn.
- **120% consumed** — "OVER turn budget" loud warn, asking Claude to stop,
  summarize, and ask the user whether to raise the cap or close out.

The hook never **blocks** tool calls — only notifies. Blocking is a
deliberate human decision (via `/pm:budget clear` or raising the cap).

## Behavior

1. **Set**: call `mcp__pm-mcp__pm_budget_set` with `{max_turns}`. The
   baseline is the current breadcrumb count — consumption is measured
   from the moment the budget was set.
2. **Show**: call `mcp__pm-mcp__pm_budget_status`. Returns
   `{active, used, max_turns, pct, status}` where status is
   `ok|warn|over`.
3. **Clear**: call `mcp__pm-mcp__pm_budget_clear`. The budget record is
   retained with `active:false` for audit purposes.

## Storage

`budget.json` in the active guardrail context (project dir or
`.claude/pm-session/`). Consumption is derived from `breadcrumbs.jsonl`
so the budget honors the same trail that `/pm:drift` reads.

## Good default caps

- Tight fix: 20
- Feature slice: 40
- Migration / refactor: 80
- Green-field spike: 120

Raise the cap if the task truly needs it — but only after asking "why"
and logging an explicit reason in the anchor or an execution note.

## Example

```
/pm:anchor "refresh-token rotation" "no UI"
/pm:budget set 50

# ...Claude works...
# after ~40 tool calls the PostToolUse hook emits:
#   "Turn budget approaching: 40/50 (80%). Consider wrapping up."

/pm:budget show
  active: yes, used: 43, max: 50, pct: 86%, status: warn
```
