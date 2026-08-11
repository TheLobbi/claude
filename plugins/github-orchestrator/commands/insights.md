---
name: gh:insights
intent: Report DORA four keys, change-failure hotspots, review latency, and flake rate with attribution to specific causes
tags:
  - github-orchestrator
  - command
  - intel
inputs:
  - scope
  - flags
risk: low
cost: medium
description: Compute delivery metrics from real repository history — deployment frequency, lead time, change failure rate, restore time, review latency, hotspots, and flake rate — each attributed to a concrete cause
---

# /gh:insights

Metrics only earn their cost if they name a cause. Every number here comes with
the specific PRs, files, or jobs behind it.

## Usage

```
/gh:insights                       # full report, last 90 days
/gh:insights --window 30d
/gh:insights --dora                # four keys only
/gh:insights --hotspots            # change-failure hotspots only
/gh:insights --review              # review latency and throughput
/gh:insights --flake               # test flake rate and worst offenders
/gh:insights --compare 90d:180d    # this window vs the previous one
```

## DORA four keys

| Metric | How it is computed here |
| --- | --- |
| **Deployment frequency** | Releases + merges to the default branch, whichever the repo actually deploys from (`config/policies.json:deploysFrom`) |
| **Lead time for changes** | First commit on the branch → merge, per PR. Reported as median and p90 — the mean hides the tail that people actually feel |
| **Change failure rate** | Merges followed within `failureWindow` by a revert, a hotfix branch, or an incident-labeled issue referencing them |
| **Time to restore** | Incident-labeled issue opened → the PR that closed it merged |

Lead time is decomposed, because "lead time is up" is not actionable:

```
Lead time p50: 2.9d   (was 1.4d)
  ├ first commit → PR opened     0.4d   (was 0.3d)
  ├ PR opened → first review     1.8d   (was 0.4d)   ← the regression
  ├ first review → approved      0.5d   (was 0.5d)
  └ approved → merged            0.2d   (was 0.2d)

Cause: 4 of 6 PRs older than 48h have no assigned reviewer.
Do: /gh:ownership --route-unassigned
```

## Change-failure hotspots

Files ranked by **defect density weighted by change frequency** — a file that
changes often and is often followed by a revert or hotfix:

```
src/billing/charge.ts      churn 41  reverts 3  hotfixes 2   risk 0.87
  Last 5 changes: 3 followed by a fix within 72h
  Owner: @alice (CODEOWNERS) / @bob (7 of last 10 commits)   ← ownership drift
```

Ownership drift — CODEOWNERS says one person, recent authorship says another —
is surfaced explicitly because it predicts slow reviews.

## Review latency

Per-reviewer and per-team: time to first review, review round count, and the
share of PRs that get exactly one round (a proxy for review depth — a repo where
every PR passes first time is usually not being reviewed).

## Flake rate

```
Flake rate: 4.2% of runs (was 1.1%)

Worst offenders
  e2e/checkout.spec.ts "completes"     11 flakes / 90 runs   quarantined #492
  api/user.test.ts "concurrent update"  6 flakes / 90 runs   not quarantined
```

Flake cost is reported in wall-clock CI minutes wasted, which is the number that
gets flakes fixed.

## Data sources

`mcp__github__list_commits`, `list_pull_requests`, `list_releases`,
`search_issues`, `actions_list` (`method: list_workflow_runs`), plus local
`git log` for authorship and churn. No external service required.

## Related

- [`/gh:advise`](advise.md) — the recommendations these metrics drive
- [`/gh:ownership`](ownership.md) — fixing ownership drift
- [`repo-intelligence`](../skills/repo-intelligence/SKILL.md) — metric definitions
