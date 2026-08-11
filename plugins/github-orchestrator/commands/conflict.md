---
name: gh:conflict
intent: Predict which in-flight pull requests will conflict and resolve conflicts with intent-preserving merges
tags:
  - github-orchestrator
  - command
  - delivery
inputs:
  - pr
  - flags
risk: medium
cost: medium
description: Compare in-flight PR diffs to predict collisions before they happen, and resolve existing conflicts by reconciling both sides' intent rather than picking a side
---

# /gh:conflict

## Usage

```
/gh:conflict --predict              # which open PRs will collide with each other
/gh:conflict --predict 482          # what will #482 collide with
/gh:conflict resolve                # resolve conflicts in the current working tree
/gh:conflict resolve 482            # fetch, merge base, resolve, push
/gh:conflict --hotspots             # files that conflict repeatedly
```

## Prediction

Conflicts are discovered late by default — GitHub only tells you after a merge
lands. Prediction closes that gap by comparing the *changed hunk ranges* of every
open PR pairwise:

```
Overlap risk between PR A and PR B:
  HIGH    same file, overlapping line ranges
  MEDIUM  same file, adjacent ranges (< 10 lines apart) or same function body
  LOW     same file, distant ranges
  RENAME  one side renames/moves a file the other side edits  ← always HIGH
```

Rename/move overlaps are ranked HIGH regardless of distance: git's rename
detection often fails when both sides also edit content, producing a
delete/modify conflict that is much worse than a line conflict.

```
/gh:conflict --predict

3 predicted collisions among 11 open PRs

HIGH   #487 ↔ #489   src/api/routes.ts
       #487 +40-58 (adds /limits), #489 +44-61 (adds /quota)
       Both insert into the same route table block.
       Suggest: land #487 first, rebase #489 (smaller diff).

HIGH   #470 ↔ #483   src/models/user.ts → src/domain/user.ts
       #470 moves the file; #483 edits it in place.
       Suggest: land #483 first — a rename over an edited file is cheap,
       an edit over a moved file is a delete/modify conflict.

MEDIUM #476 ↔ #481   package.json
       Dependency block, adjacent lines. Lockfile will conflict; regenerate
       rather than merge (pnpm-lock.yaml is not hand-mergeable).
```

## Resolution

Conflicts are resolved by reconciling intent, not by picking `--ours` or
`--theirs`:

1. **Read both sides' commits and PR descriptions** to establish what each side
   was trying to do.
2. **Reconstruct a result that satisfies both intents.** If both sides added a
   route, the result has both routes. If both sides changed the same guard
   clause for different reasons, the result satisfies both conditions.
3. **If the intents genuinely conflict** — the same behavior changed in
   incompatible directions — stop and ask. That is a product decision, not a
   merge decision.
4. **Run the tests from both sides** after resolving. A resolution that compiles
   but drops one side's test is a silent regression.

### Files that are never hand-merged

| File | Resolution |
| --- | --- |
| `pnpm-lock.yaml`, `package-lock.json`, `yarn.lock` | Take the base version, re-run the install, commit the regenerated lockfile |
| Generated code, snapshots, `*.pb.go`, OpenAPI bundles | Take base, re-run the generator |
| `CHANGELOG.md` | Keep both entries, order by version then date |
| Binary assets | Ask — there is no correct automatic answer |

## Hotspots

`--hotspots` correlates conflict history from merge commits and reverts to find
files that conflict repeatedly. A file that conflicts every week is a design
signal, not a merge problem — usually a god-file, a central registry, or a
config table that wants to be split.

```
src/api/routes.ts        11 conflicts / 90d   ← central route table
src/config/features.ts    8 conflicts / 90d   ← flag registry
pnpm-lock.yaml           27 conflicts / 90d   (expected — regenerated)
```

## Related

- [`/gh:merge-train`](merge-train.md) — landing order that avoids collisions
- [`/gh:insights`](insights.md) — hotspot analysis in the broader metric context
