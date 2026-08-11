---
name: gh:advise
intent: Get prioritized, evidence-backed recommendations for the next best actions across PRs, CI, issues, alerts, and releases
tags:
  - github-orchestrator
  - command
  - advisor
inputs:
  - scope
risk: low
cost: medium
description: Invoke the gh-advisor agent to analyze current PR, CI, issue, security-alert, and release state and recommend what to do next, which workflow to launch, and which agents to deploy — read-only, no GitHub mutations
---

# /gh:advise

Dispatch the [`gh-advisor`](../agents/gh-advisor.md) agent to look at everything
currently in flight and tell you **what to do next** — read-only, no mutations.

## Usage

```
/gh:advise                      # advise across the whole repo
/gh:advise pr 482               # focus on one pull request
/gh:advise ci                   # focus on failing CI
/gh:advise security             # focus on open security alerts
/gh:advise release              # focus on release readiness
/gh:advise --top 3              # only the top 3 recommendations
```

## What it looks at

| Signal | Source |
| --- | --- |
| Open PRs, age, review state, mergeability | `mcp__github__list_pull_requests`, `pull_request_read` |
| CI status and failing jobs | `mcp__github__actions_list` (`method: list_workflow_runs`), `get_job_logs` |
| Open issues, labels, staleness | `mcp__github__list_issues`, `search_issues` |
| Security alerts | `mcp__github__run_secret_scanning`, CodeQL/Dependabot alerts |
| Release drift | `mcp__github__list_releases`, `list_commits` since last tag |
| Local branch state | `git status`, `git log`, `git diff --stat` |

## Output contract

A ranked list. Every recommendation carries evidence and a concrete next command:

```
## Next best actions

1. [BLOCKER] PR #482 has been red for 3 days on `test (ubuntu, 20)`
   Evidence: run 1849302 — `TypeError: cannot read 'id' of undefined` at src/api/user.ts:114
   Why now: it blocks #484 and #487, which are stacked on it
   Do: /gh:ci 482 --drive-to-green

2. [HIGH] 6 PRs awaiting review > 48h; median review latency is 3.1d (was 0.9d)
   Evidence: #470 #473 #476 #479 #481 #483 — 4 of 6 have no assigned reviewer
   Why now: review latency is the top DORA lead-time contributor this window
   Do: /gh:ownership --route-unassigned

3. [MEDIUM] `lodash` advisory GHSA-… is reachable from src/billing/invoice.ts
   Evidence: 2 call paths, both in the payment code path
   Do: /gh:security --triage GHSA-…
```

Each entry states **severity**, **evidence** (with a concrete artifact reference),
**why it matters now**, and **the exact command to run**.

## Rules

- **Read-only.** The advisor has `Write`, `Edit`, `Bash`, and every mutating
  `mcp__github__*` tool in its `disallowedTools`. It cannot open, merge, close,
  or comment on anything.
- **Evidence or silence.** A recommendation without a concrete artifact
  reference (run id, file:line, PR number, alert id) is dropped.
- **Ranked by unblocking value**, not by age. A red PR with three stacked
  children outranks an older PR nothing depends on.
- **No more than 7 recommendations** unless `--all` is passed — an unranked wall
  of advice is the same as no advice.

## Related

- [`/gh:insights`](insights.md) — the metrics behind the advice
- [`/gh:workflow`](workflow.md) — run the workflow the advisor recommends
- [`gh-advisor`](../agents/gh-advisor.md) — the agent itself
