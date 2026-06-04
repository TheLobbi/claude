---
name: linear:sla
intent: Manage SLA policies, monitor breach risk, and surface escalations
tags:
  - linear-orchestrator
  - command
  - sla
inputs:
  - action
risk: medium
cost: low
description: SLA management (linear.app/docs/sla)
---

# /linear:sla

Linear SLA tracks how long issues spend in specific states (typically Triage and In Progress) against per-priority deadlines.

## Actions

### `policies --team <key>`
Returns active SLA policies for the team (e.g. P1: 4h triage / 1d resolution).

### `configure --team <key>`
- Interactive: walks through priority × state matrix
- Persists to `team.slaConfiguration` via `teamUpdate`

### `status [--issue <id>] [--cycle current]`
- Shows time remaining / time over for each in-scope issue
- Color-coded: green (>50% budget), yellow (10-50%), red (<10% or breached)

### `breaches`
- `--since <duration>` (default 7d)
- Returns breached issues with: priority, time over, owner, last activity
- Used by `linear-sla-monitor` agent to file escalations

## Escalation policy
The `linear-sla-monitor` agent (haiku, polled every 15min):
1. Reads breach list
2. For each new breach, posts a comment tagging the assignee + team lead
3. If breach is >2× SLA, escalates to triage queue with `sla-breach` label
4. Aggregates daily and posts to project status updates

## Bridge behaviour
- Critical breaches (P1, >2× SLA) trigger a Harness pipeline pause (if `harness-sync` configured) on any deploys touching the breached issue's repo
