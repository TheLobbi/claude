---
name: linear:issue
intent: Create, edit, select, delete Linear issues with full feature support — sub-issues, templates, labels, priority, estimates, due dates
tags:
  - linear-orchestrator
  - command
  - issue
inputs:
  - action
risk: medium
cost: low
description: Full issue lifecycle covering creating-issues, editing-issues, select-issues, parent-and-sub-issues, issue-templates, labels, priority, due-dates, estimates
---

# /linear:issue

Unified entry point for issue CRUD. Each action maps to GraphQL mutations.

## Actions

### `create`
Inputs (CLI args or interactive):
- `--title <str>` (required)
- `--team <key>` (e.g. `ENG`)
- `--description <md>` — supports Linear's markdown editor syntax (https://linear.app/docs/editor)
- `--parent <id|key>` — sub-issue (https://linear.app/docs/parent-and-sub-issues)
- `--template <id>` — apply issue template (https://linear.app/docs/issue-templates)
- `--labels <a,b,c>` — by name (https://linear.app/docs/labels)
- `--priority <0-4>` — 0=none, 1=urgent, 2=high, 3=med, 4=low (https://linear.app/docs/priority)
- `--estimate <int>` — fibonacci by default (https://linear.app/docs/estimates)
- `--due <YYYY-MM-DD>` (https://linear.app/docs/due-dates)
- `--assignee <email|name>` (https://linear.app/docs/assigning-issues)
- `--state <name>` — workflow state (https://linear.app/docs/configuring-workflows)
- `--project <id>` — link to project
- `--cycle <id>` — link to cycle
- `--customer <id>` — link to customer request

Calls `issueCreate(input: IssueCreateInput!)` mutation. If `--parent` given, sets `parentId`.

### `edit`
- `--id <id|key>` (required) e.g. `ENG-123`
- Same flags as create; only set fields are updated
- Calls `issueUpdate(id, input)`

### `select`
Returns issues matching a filter (https://linear.app/docs/select-issues, https://linear.app/developers/filtering):
- `--team <key>`, `--state <name>`, `--assignee <email>`, `--label <name>`, `--cycle <current|next|id>`, `--project <id>`, `--priority <int>`, `--query <free-text>`
- `--limit <int>` default 50, max 250
- `--cursor <opaque>` for pagination

### `delete`
- `--id <id|key>` — soft archive via `issueArchive`; pass `--hard` to call `issueDelete`

### `bulk`
- Reads JSONL from stdin, one issue per line, applies to mutation in chunks of 50 (rate-limit aware)

## Notes
- Templates are applied client-side: fetch template body, merge with overrides, then create
- Sub-issue depth is enforced by Linear (no extra checks needed)
- Labels are matched by name within the team scope; missing labels can be auto-created with `--auto-create-labels`

## See also
- `agents/linear-issue-curator.md`
- `skills/linear-graphql/SKILL.md`
- `lib/queries/issues.graphql.ts`
