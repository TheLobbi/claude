---
name: gh:merge-train
intent: Land a stack or merge queue of pull requests in dependency order with automatic rebasing between landings
tags:
  - github-orchestrator
  - command
  - delivery
inputs:
  - flags
risk: high
cost: high
description: Order a stacked PR series or merge queue by dependency, land them one at a time, and rebase the remainder after each landing so the stack never breaks mid-train
---

# /gh:merge-train

Landing a stack is not "merge them in order". Every landing rewrites the base of
everything above it, invalidates their CI, and can introduce conflicts that did
not exist when the stack was opened. This command handles that.

## Usage

```
/gh:merge-train --stack 482            # land the stack rooted at PR #482
/gh:merge-train --queue                # land everything mergeable, in dependency order
/gh:merge-train --dry-run              # show the landing order and predicted conflicts
/gh:merge-train --stack 482 --pause-on-red
/gh:merge-train status                 # where is the train right now
```

## How it works

### 1. Build the dependency graph

`stack-manager` resolves the topology from PR base branches, not from titles or
labels. A PR whose base is another PR's head branch is a child of it. Cycles and
orphans (base branch deleted) are reported and halt the train.

```
#482  schema           base: main          ← root
 └── #484  service     base: feat/schema
      ├── #487  api    base: feat/service
      └── #489  worker base: feat/service
```

### 2. Predict conflicts before starting

`conflict-resolver` diffs every pair in the stack against the post-landing state
of its ancestors. Predicted conflicts are reported **before** the first merge,
so you find out at minute zero rather than three landings in.

### 3. Land one, rebase the rest

For each PR in topological order:

```
a. merge-marshal re-verifies every gate (green checks, quorum, no conflicts,
   protection satisfied without bypass)
b. merge (squash by default)
c. for every descendant: retarget base → the just-merged PR's base
d. rebase descendant heads onto the new base
e. force-push descendants with --force-with-lease  (never plain --force)
f. wait for the descendants' CI to re-run
g. next PR
```

Retargeting before rebasing matters: GitHub auto-retargets children when a
parent merges, but only one level. Deeper stacks need explicit retargeting or
the grandchildren end up basing on a deleted branch.

### 4. Handle a red descendant

If a descendant goes red after rebasing, the train **pauses** — it does not skip
ahead. `/gh:ci <pr> --drive-to-green` is invoked for that PR, and the train
resumes when it recovers. `--pause-on-red` makes the pause require explicit
human resume instead of auto-fixing.

## Merge queue mode

With `--queue`, the command works with GitHub's native merge queue rather than
against it:

- Respects `merge_group` events and queue ordering.
- Never enables auto-merge on a PR whose required checks are not yet defined.
- Uses `mcp__github__enable_pr_auto_merge` rather than merging directly, so the
  queue owns the ordering.
- Detects queue thrash: if a PR is ejected from the queue twice for the same
  check, it is pulled out and routed to CI triage rather than re-queued a third
  time.

## Safety

- `--force-with-lease` always, never `--force`. If the lease fails, someone else
  pushed — stop and report, do not retry with `--force`.
- Never rebase or force-push a **protected** branch.
- Never merge with a red required check, and never use admin bypass.
- A stack that cannot be landed cleanly is reported with the exact blocking PR
  and reason — it is not partially landed and abandoned.

## Output

```
Train: #482 → #484 → {#487, #489}   (4 PRs, 2 levels)

Predicted conflicts: 1
  #487 ↔ #489 both modify src/api/routes.ts:40-58 — will conflict after #484 lands

✓ #482  merged a1b2c3d   → retargeted 1 child, rebased, CI green
✓ #484  merged d4e5f6a   → retargeted 2 children, rebased
⏸ #487  paused — CI red after rebase (test: routes contract)
        → /gh:ci 487 --drive-to-green
  #489  waiting
```

## Related

- [`merge-train`](../workflows/merge-train.json) — declarative form
- [`stacked-prs`](../skills/stacked-prs/SKILL.md) — stack mechanics
- [`merge-queue`](../skills/merge-queue/SKILL.md) — GitHub merge queue semantics
- [`/gh:conflict`](conflict.md) — conflict prediction on its own
