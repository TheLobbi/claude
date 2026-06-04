---
name: linear:triage
intent: Manage the Linear triage queue — list, route, accept, decline, and configure auto-triage rules
tags:
  - linear-orchestrator
  - command
  - triage
inputs:
  - action
risk: medium
cost: low
description: Triage workflow (linear.app/docs/triage)
---

# /linear:triage

Linear's triage state is a special inbox for new issues that need routing.

## Actions

### `list`
- `--team <key>` filter
- Returns issues with `triagedAt: null` and `state.type = "triage"`

### `accept <id> [--state <name>] [--assignee <user>] [--cycle <id>]`
- Mutation: `issueTriageAccept(id)` then `issueUpdate(...)` for further fields

### `decline <id> --reason <text>`
- Mutation: `issueArchive(id, trashed:true)` + comment with reason

### `route <id> --team <key>`
- Moves issue between teams via `issueUpdate(id, { teamId })`
- Re-applies team's default label / state where applicable

### `rules`
Configure auto-triage rules (Linear's "Triage Responsibility" + label-based routing):
- `--rules-file <path>` — yaml file with `match` patterns and `actions`
- Example:
  ```yaml
  rules:
    - match: { label: "bug", priority: 1 }
      actions: { team: "ENG", assignee: "oncall@acme.com" }
    - match: { source: "customer-request" }
      actions: { team: "SUPPORT" }
  ```
- The `linear-triage-officer` agent applies rules to incoming issues via the webhook handler

## Notes
- Triage queue ordering follows Linear: Priority → Created date
- SLA timers may already be running — see `/linear:sla` to inspect
