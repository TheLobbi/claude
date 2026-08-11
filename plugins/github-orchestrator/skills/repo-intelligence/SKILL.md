---
name: repo-intelligence
description: This skill should be used when computing or interpreting repository delivery metrics — DORA four keys, lead time decomposition, change-failure hotspots, ownership drift, bus factor, and flake cost.
version: 1.0.0
trigger_phrases: [DORA, lead time, deployment frequency, change failure rate, hotspot, bus factor, review latency, repo metrics]
categories: [metrics, analysis, delivery, intel]
author: github-orchestrator
created: 2026-08-11
updated: 2026-08-11
---

# Repo Intelligence

A metric that does not name a cause is decoration. Every number comes with the
PRs, jobs, or files behind it.

## DORA four keys

| Metric | Computation from repository data |
| --- | --- |
| Deployment frequency | Releases, or merges to the branch the repo actually deploys from |
| Lead time for changes | First commit on the branch → merge, per PR |
| Change failure rate | Merges followed within the failure window by a revert, hotfix branch, or incident-labeled issue referencing them |
| Time to restore | Incident issue opened → the PR closing it merged |

**Report p50 and p90, never means.** A mean lead time is dominated by a few PRs
that sat for a month, and it hides everyone else's experience. p90 is what the
team actually feels.

## Decompose lead time

"Lead time is up" is not actionable. Split it so the regression has an address:

```
first commit → PR opened
PR opened    → first review      ← usually the regression
first review → approved
approved     → merged
```

Then attribute the moving stage. Time-to-first-review regressions are almost
always one of: reviewers unassigned, one reviewer holding a queue while away,
PRs got bigger, or a team boundary changed. Check each before naming a cause.

## Change failure attribution

A rate alone is not usable. List the failing changes and what they share:

```
Change failure rate: 14% (7 of 51)
  5 of 7 touched src/billing/**       ← concentrated
  6 of 7 merged with exactly one approval
  4 of 7 were > 800 lines
```

Concentrated failure is a fixable problem. Diffuse failure is a process problem.
Say which you are looking at.

## Hotspots

```
risk = normalized_churn × normalized_defect_density × complexity_factor
```

Churn alone is not risk — a config file changes constantly and breaks nothing.
Exclude generated files, lockfiles, and vendored paths, or they drown the signal.

Diagnose the mechanism, do not just rank: god file · central registry · missing
abstraction · implicit coupling · under-tested · ownership drift.

## Ownership

**Drift** — CODEOWNERS names one person, recent commits are someone else's.
Predicts slow reviews.

**Bus factor** — authors holding ≥ 20% of a module's recent commits.

The pairing that matters most: a file that is **both a hotspot and
bus-factor-1**. Fragile code only one person understands is the highest-risk
object in a repository. Always surface that combination explicitly.

**CODEOWNERS is last-match-wins** — the opposite of `.gitignore`. A broad `*`
placed after a specific rule silently overrides it. Check order before
concluding a path is covered.

## Flake cost

Report flake cost in **wasted CI minutes**, not just a percentage. Minutes get
flakes fixed; percentages get them tolerated.

## Honesty about data quality

State limits explicitly. No release tags → deployment frequency is a proxy.
Unlabeled incidents → time-to-restore is unmeasurable; say so rather than
computing from a bad proxy. Under ~50 commits in a window, a hotspot ranking is
noise — widen the window instead of reporting a confident order.

A confidently wrong metric is worse than a missing one, because someone will
plan with it.

## See also

- `../commands/insights.md` · `../commands/ownership.md`
