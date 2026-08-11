---
name: gh:plan-prs
intent: Decompose a goal into a dependency-ordered stack of independently reviewable and shippable pull requests
tags:
  - github-orchestrator
  - command
  - planning
inputs:
  - goal
  - flags
risk: low
cost: medium
description: Turn a goal or issue into a PR delivery plan — a sequence of slices that each build, test, and ship on their own, sized under the review budget
---

# /gh:plan-prs

Planning only. No branches, no code, no PRs. The output is a plan you can
execute with `/gh:ship --stack` or by hand.

## Usage

```
/gh:plan-prs "migrate sessions from Redis to Postgres"
/gh:plan-prs --issue 214
/gh:plan-prs --branch                # plan a split of the current branch
/gh:plan-prs --max-size 300          # override the PR size budget
```

## What makes a good slice

Each PR in the plan must satisfy all four:

1. **Builds and passes tests on its own.** A slice that only compiles once the
   next one lands is not a slice — it is half a commit.
2. **Is independently revertible.** If it turns out to be wrong, reverting it
   does not break the ones already merged.
3. **Fits the review budget.** Default 400 changed lines excluding lockfiles,
   generated files, and vendored paths. Reviewers stop finding defects past
   roughly that size — the budget is about review quality, not tidiness.
4. **Has a single reviewable claim.** "Adds the table" and "uses the table" are
   two claims. Splitting them lets a reviewer verify each without holding both
   in their head.

## Standard seams

In preference order, because each one produces slices that satisfy the four
rules with the least friction:

| Seam | Example |
| --- | --- |
| Data → service → API → UI | schema migration, then repository, then handler, then component |
| Additive → cutover → cleanup | add the new path behind a flag, flip the flag, delete the old path |
| Pure refactor → behavior change | move/rename with no behavior delta, then change behavior |
| New module → call sites | land the module with its tests, then adopt it |
| Dependency bump → adaptation | upgrade the package, then change the code that uses it |

The additive → cutover → cleanup seam is the one that makes risky migrations
safe: each step is revertible on its own, and the risky moment (the flip) is a
one-line diff a reviewer can actually reason about.

## Output

```
Plan: migrate sessions from Redis to Postgres — 5 PRs, 3 levels

1. feat(sessions): add sessions table + migration          ~120 lines   [root]
   Ships: schema, migration, rollback migration, migration test
   Revert: drop table — nothing depends on it yet

2. feat(sessions): postgres session repository             ~180 lines   ⇠ 1
   Ships: PgSessionStore implementing the existing SessionStore interface + tests
   Revert: delete the class — nothing calls it yet

3. feat(sessions): dual-write behind SESSIONS_PG flag      ~90 lines    ⇠ 2
   Ships: write to both stores, read from Redis. Flag default off.
   Revert: remove the flag branch

4. feat(sessions): read from postgres                      ~40 lines    ⇠ 3
   Ships: flip read path when the flag is on
   Revert: flip back — the one-line risky change, isolated on purpose

5. chore(sessions): remove redis session store             ~150 lines   ⇠ 4
   Ships: delete the old store, the flag, and its config
   Revert: restore — safe once 4 has soaked

Risk: step 4 is the cutover. Soak 4 for one release before merging 5.
Human review required: step 1 (migration — matches humanReviewPaths).

Execute: /gh:ship --stack --plan-id <id>
```

## Related

- [`/gh:ship`](ship.md) — execute the plan
- [`/gh:pr`](pr.md) — `split` an existing oversized branch
- [`stacked-prs`](../skills/stacked-prs/SKILL.md) — stack mechanics
