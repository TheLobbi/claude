---
name: stacked-prs
description: This skill should be used when working with stacked or dependent pull requests — resolving topology, retargeting and rebasing after a parent lands, splitting an oversized branch, and force-push safety.
version: 1.0.0
trigger_phrases: [stacked PR, PR stack, dependent PRs, rebase stack, retarget base, split branch]
categories: [github, pull-request, git, delivery]
author: github-orchestrator
created: 2026-08-11
updated: 2026-08-11
---

# Stacked PRs

## Topology comes from base branches

PR *B* is a child of PR *A* when `B.base.ref == A.head.ref`. Never infer the
stack from titles, labels, or description conventions — those drift, base
branches do not.

Halt and report on:

- **Cycles** — two PRs based on each other's heads.
- **Orphans** — the base branch no longer exists, usually because a parent
  merged and its branch was deleted while a grandchild still pointed at it.
- **Cross-stack dependencies** — PR X logically needs PR Y, but Y is not X's
  ancestor. This cannot be expressed in base branches; record it as a
  landing-order constraint instead.

## After a parent lands

GitHub auto-retargets **direct children only**. Deeper stacks need explicit
handling, in this order:

```
1. retarget every descendant's base → the merged PR's base
2. rebase descendant heads onto the new base
3. push --force-with-lease
4. wait for CI to re-run before touching the next level
```

Doing (2) before (1) rebases onto a branch about to be deleted. Skipping (4)
stacks a rebase on top of an unverified rebase, and when it breaks you cannot
tell which one did it.

## Force-push safety

**`--force-with-lease`, always. Never plain `--force`.**

If the lease fails, someone else pushed to that branch. Stop and report — do not
retry with `--force`. That is the operation that destroys a colleague's work.

Never force-push a protected branch under any circumstance.

## Deleting the parent branch

Check for descendants **before** deleting a merged parent's branch. Deleting it
out from under a stack orphans everything above it, and recovering requires
manually retargeting each one.

## Splitting a branch

Seams, in preference order:

| Seam | Why it works |
| --- | --- |
| Data → service → API → UI | Each layer's tests run without the layer above |
| Additive → cutover → cleanup | The risky moment is isolated to a one-line flip |
| Pure refactor → behavior change | A reviewer can verify the refactor changed nothing |
| New module → call sites | The module lands with its tests before anything depends on it |
| Dependency bump → adaptation | Separates "the upgrade broke it" from "our change broke it" |

Every slice must **independently build and pass tests**. Verify this per slice
before opening its PR — discovering it during the merge train is expensive.

## Landing order

Land the PR whose descendants need the least rebasing. Land in-place edits
**before** renames of the same file: a rename over an edited file is cheap, an
edit over a moved file is a delete/modify conflict.

## Recovering a merged designated branch

A merged PR is finished; it cannot track new work. Restart the branch from the
latest default branch, keeping the name:

```bash
git fetch origin <default>
git checkout -B <branch> origin/<default>
```

If the branch carries unmerged commits beyond the merged history, keep them —
rebase them onto the new base rather than discarding them.

## See also

- `merge-queue` — queue interaction
- `pr-craft` — size budgets and splitting rationale
