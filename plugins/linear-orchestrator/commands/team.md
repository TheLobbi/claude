---
name: linear:team
intent: Manage Linear teams, members, default team pages, and team settings
tags:
  - linear-orchestrator
  - command
  - team
inputs:
  - action
risk: medium
cost: low
description: Teams + default team pages (linear.app/docs/teams, default-team-pages)
---

# /linear:team

## Actions

### `list`
- Returns all teams the auth principal can access

### `create`
- `--key <KEY>` (e.g. `ENG`), `--name <str>`
- `--description <md>`, `--private <bool>`
- Mutation: `teamCreate`

### `update <teamId>`
- All optional fields plus `--cycle-enabled <bool>`, `--cycle-duration <weeks>`, `--triage-enabled <bool>`
- Mutation: `teamUpdate`

### `members <teamId>`
- `--add <email>` / `--remove <email>` / `--list`
- Mutations: `teamMembershipCreate`, `teamMembershipDelete`

### `pages <teamId>`
- Default team pages (https://linear.app/docs/default-team-pages) configure which views team members see by default (e.g. "Active issues", "My issues")
- `--list` shows current default
- `--set <pageId>` updates the default landing page for new team members
- Mutations: `teamUpdate(input: { defaultIssueViewId, defaultProjectViewId })`

## Onboarding flow
The `/linear:setup` command's `--onboard-team` flag chains: create team → enable cycles → add members → set default pages → create starter triage rules.
