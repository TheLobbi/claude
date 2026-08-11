---
name: merge-queue
description: This skill should be used when working with GitHub merge queues and branch protection — queue semantics, required checks, strict status checks, auto-merge, and why a merge is blocked.
version: 1.0.0
trigger_phrases: [merge queue, branch protection, required checks, auto-merge, cannot merge, mergeable state]
categories: [github, merge, policy, ci]
author: github-orchestrator
created: 2026-08-11
updated: 2026-08-11
---

# Merge Queue & Branch Protection

## Strict status checks

"Require branches to be up to date before merging" is the difference between a
green check that means something and one that does not.

Without it, a PR can merge on a green run against a base from three days ago —
the checks passed against code that no longer exists. With it, the head must be
current, so every merge is gated on a run against the real post-merge state.

The cost is rebase churn on busy repositories. That is what merge queues solve.

## What a merge queue actually does

The queue builds a **speculative merge** of your PR on top of the queue ahead of
it, runs checks against that combination, and merges only if it passes. This
gives strict-check correctness without every author manually rebasing.

Consequences worth knowing:

- Your PR's own green checks are not the queue's checks. The queue re-runs
  against the speculative merge.
- A PR can be **ejected** from the queue when the speculative merge fails —
  even though nothing about your PR changed. The conflict is with what landed
  ahead of you.
- Repeated ejection for the same check means a genuine interaction, not bad
  luck. After two ejections on the same check, pull the PR out and triage rather
  than re-queueing a third time.

Prefer `enable_pr_auto_merge` over merging directly in queue repositories, so
the queue owns ordering.

## `mergeable_state` values

| Value | Meaning |
| --- | --- |
| `clean` | Ready |
| `blocked` | A required check is failing or a required review is missing |
| `behind` | Head is behind the base and strict checks are required |
| `dirty` | Merge conflict |
| `unstable` | A non-required check is failing — mergeable, but look at why |
| `draft` | Draft PR |
| `has_hooks` | Clean, with a pre-receive hook that may still reject |

`unstable` is the one that gets misread. It means mergeable; it does not mean
fine.

## Protection settings that matter

| Setting | Why |
| --- | --- |
| Required status checks, **strict** | Green means green against the current base |
| Dismiss stale approvals on push | Otherwise an approval survives a rewrite of the diff it approved |
| Require conversation resolution | Unresolved blocking feedback cannot merge |
| Restrict force push and deletion | |
| `enforce_admins` | A bypass available to admins is a bypass |
| Required linear history | Forces squash or rebase; simplifies revert |

`enforce_admins: false` is the most common silent gap — the protection looks
complete on the settings page and is bypassable by anyone with admin.

## Diagnosing a blocked merge

Check in this order and stop at the first hit:

1. Is a required check failing at the **current** head sha?
2. Is a required check *missing* — never reported, not failed? A renamed job is
   a required check that will never arrive.
3. Is the review quorum unmet, or is a `CHANGES_REQUESTED` outstanding?
4. Are there unresolved conversations?
5. Is the head behind with strict checks required?
6. Is there a conflict?
7. Is the PR a draft?

Point 2 is the one that wastes the most time — a required check that was renamed
in the workflow leaves the PR waiting forever for a job that no longer exists.

## Never

Never merge with a red required check. Never use admin bypass. Never re-run a
check to turn it green without classifying why it was red.

## See also

- `stacked-prs` — landing dependent PRs through a queue
- `github-orchestration` — the gate list enforced before merging
