---
name: gh:ownership
intent: Synthesize CODEOWNERS from real authorship, find coverage gaps and bus-factor risk, and route reviewers
tags:
  - github-orchestrator
  - command
  - intel
inputs:
  - scope
  - flags
risk: medium
cost: medium
description: Compare declared CODEOWNERS against actual authorship to find drift, uncovered paths, and bus-factor-one modules, and route reviewers on open PRs accordingly
---

# /gh:ownership

## Usage

```
/gh:ownership                        # coverage, drift, and bus-factor report
/gh:ownership --synthesize           # propose a CODEOWNERS file from authorship
/gh:ownership --gaps                 # paths with no owner
/gh:ownership --bus-factor           # modules with a single knowledgeable author
/gh:ownership --route-unassigned     # assign reviewers to open PRs missing them
/gh:ownership --route 482            # route reviewers for one PR
```

## Coverage

Every path in the repository is classified:

| State | Meaning |
| --- | --- |
| **Covered** | A CODEOWNERS rule matches and the owner has recent authorship |
| **Drifted** | A rule matches, but the owner has not touched the path in `driftWindow` (default 180d) while someone else has |
| **Uncovered** | No rule matches — review falls to whoever notices |
| **Orphaned** | Rule matches a team or user that no longer exists or has no repo access |

Orphaned rules are the dangerous ones: GitHub treats an unresolvable owner as
*no* required reviewer on some configurations, so a path that looks protected
is not.

## Bus factor

For each module, the number of authors holding ≥ 20% of its recent commits:

```
src/billing/          bus factor 1   @alice  (94% of last 90d commits)
src/ingest/pipeline/  bus factor 1   @bob    (88%)
src/api/              bus factor 4   healthy
```

Bus-factor-1 on a path that also appears in `/gh:insights --hotspots` is the
highest-value pairing this plugin surfaces: a fragile file only one person
understands.

## Reviewer routing

Routing weighs, in order:

1. **CODEOWNERS** — respect declared ownership first; it exists for a reason.
2. **Recent authorship** of the specific changed files (last 90 days),
   weighted by lines touched.
3. **Current review load** — do not route a fifth PR to someone holding four.
4. **Availability** — skip reviewers with no activity in the last 7 days.

Routing never assigns the PR author to their own PR, and never routes a
security-sensitive path (`config/policies.json:humanReviewPaths`) to an
automated reviewer alone.

## `--synthesize`

Proposes a CODEOWNERS file from actual authorship, ordered most-specific-last
(CODEOWNERS uses last-match-wins, which is the opposite of `.gitignore` and the
single most common source of broken ownership rules).

Output is a **proposal**, written to `CODEOWNERS.proposed`. It is never written
to `CODEOWNERS` directly — ownership is a people decision.

```
# proposed — review before adopting
*                          @org/platform
/src/api/                  @org/api-team
/src/billing/              @alice @org/payments
/src/billing/charge.ts     @alice          # bus factor 1 — consider adding a second owner
/.github/workflows/        @org/platform
/migrations/               @org/data @org/platform   # humanReviewPaths
```

## Related

- [`/gh:insights`](insights.md) — hotspots that pair with bus factor
- [`/gh:audit`](audit.md) — broader repo hygiene
