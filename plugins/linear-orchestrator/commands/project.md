---
name: linear:project
intent: Manage Linear projects — create, milestone planning, status updates, templates, overview, and documents
tags:
  - linear-orchestrator
  - command
  - project
inputs:
  - action
risk: medium
cost: low
description: Projects + milestones + status + templates + overview (linear.app/docs/projects, project-milestones, project-status, project-templates, project-overview)
---

# /linear:project

Projects span issues across teams, have milestones, and produce status updates.

## Actions

### `create`
- `--name <str>`, `--lead <user>`, `--target-date <YYYY-MM-DD>`
- `--teams <a,b,c>` — auto-share with these teams
- `--template <id>` — apply project template (https://linear.app/docs/project-templates)
- Mutation: `projectCreate`

### `update <projectId>`
- `--state <backlog|planned|started|paused|completed|canceled>`
- `--lead <user>`, `--target-date <date>`, `--description <md>`
- Mutation: `projectUpdate`

### `milestone --project <id> [--add | --remove | --list]`
- `add --name <str> --target-date <date>` → `projectMilestoneCreate`
- `remove <milestoneId>` → `projectMilestoneDelete`
- `list` → returns milestones with completion %
- See: https://linear.app/docs/project-milestones

### `status --project <id>`
- `--post --health <on-track|at-risk|off-track> --body <md>` → `projectUpdateCreate` (https://linear.app/docs/initiative-and-project-updates, https://linear.app/docs/project-status)
- Without `--post`, returns recent updates

### `overview <projectId>`
- Renders project overview (https://linear.app/docs/project-overview): scope, milestones, recent updates, deploy events from Harness, Planner mirror status

### `template`
- `template list`
- `template apply <templateId> --to <projectId>` → instantiates issues defined in the template

### `list`
- `--team <key>`, `--state <state>`, `--lead <user>`, `--limit`
- Cursor-paginated

## Bridge behaviour
- Project status updates are posted to a Slack channel via Harness Notifications (if configured)
- Project completion triggers Planner plan archival (one-shot; user-confirmed)
