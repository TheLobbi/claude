---
name: linear:assign
intent: Assign or reassign Linear issues; supports single, bulk, and round-robin assignment strategies
tags:
  - linear-orchestrator
  - command
  - assign
inputs:
  - id
  - assignee
risk: low
cost: low
description: Issue assignment with single/bulk/round-robin modes (linear.app/docs/assigning-issues)
---

# /linear:assign

Reassign one or many issues. Maps to `issueUpdate(id, { assigneeId })`.

## Usage
- `/linear:assign ENG-123 alice@acme.com` — single
- `/linear:assign ENG-1,ENG-2,ENG-3 @me` — bulk
- `/linear:assign --query 'state:Triage' --strategy round-robin --pool alice,bob,carol` — distribute matching issues across a pool
- `/linear:assign ENG-99 unassigned` — clear assignee

## Strategies
- `direct` (default) — set to specified user
- `round-robin` — distribute across `--pool` members evenly
- `least-loaded` — fetch each pool member's open count and pick the lowest

## Resolution rules
1. If `assignee` is an email, GraphQL `users(filter:{email:{eq}})` lookup
2. If `assignee` matches `@me`, use `viewer { id }`
3. If `assignee` is a UUID, use directly
4. Otherwise treat as displayName / name lookup; fail loudly if ambiguous (>1 match)

## Side effects
- If issue is in a "Triage" state, also calls `issueTriageAccept` to remove from triage queue
- Emits a `linear.assign` event consumed by Harness/Planner bridges if either is enabled
