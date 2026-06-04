---
name: linear:harness-sync
intent: Two-way sync between Linear issues and Harness Code repositories — branches, PRs, deploys, and reviews
tags:
  - linear-orchestrator
  - command
  - harness
  - bridge
  - two-way-sync
inputs:
  - action
risk: high
cost: medium
description: Two-way Harness Code ↔ Linear sync (https://apidocs.harness.io/tag/Code-Repositories)
---

# /linear:harness-sync

Bridge layer between Linear issues and Harness Code. Implements bidirectional state mirroring.

## Sync matrix

| Linear event | → Harness Code action |
|--------------|------------------------|
| Issue created with `branch:` label | Create branch in repo from default branch |
| Issue moves to "In Progress" | Set PR draft → ready when PR exists |
| Issue moves to "In Review" | Add `linear:in-review` label to PR |
| Issue moves to "Done" | Add `linear:done` label, ready-to-merge |
| Issue archived | Close PR if open |

| Harness event | → Linear action |
|---------------|-----------------|
| PR opened referencing `ENG-123` in title/body | Link PR to issue, transition to "In Review" |
| PR review requested-changes | Comment on issue with reviewer + summary |
| PR merged | Transition issue to "Done" |
| Deploy succeeded | Comment on linked issues + add `deployed:<env>` label |
| Deploy failed | Re-open issue, transition to "In Progress" |

## Actions

### `enable --org <id> --project <id> [--repo <name>]`
- Stores Harness coords; creates webhook subscriptions on both sides
- Validates with a no-op read

### `disable`
- Unregisters webhooks; preserves historical links

### `status`
- Shows: webhook health, last successful sync, error count, DLQ depth, mapped repos

### `reconcile [--dry-run]`
- Walks all "In Progress" issues; checks each has a corresponding open PR
- Walks all open PRs in mapped repos; checks each references a Linear issue
- Reports drift; with `--apply`, creates missing links

### `branch <issueId> [--repo <name>] [--prefix <str>]`
- Creates branch `<prefix>/<issue-key>-<slug>` (default prefix: `linear`)
- Posts comment on issue with branch URL

### `deploy <deploymentId>`
- Manual trigger to fan out a Harness deploy event to all referenced Linear issues

## Idempotency
- Each Harness event has an `event.id` — stored in DLQ table, re-delivery is no-op
- Linear webhook events keyed by `delivery.id`
- Bridge state kept in `lib/state.ts` (SQLite) — survives restarts

## Failure modes
- Harness 5xx → backoff up to 3 retries → DLQ
- Linear API rate-limited → wait for budget reset, then retry
- Webhook signature mismatch → reject + alert (potential attack)
