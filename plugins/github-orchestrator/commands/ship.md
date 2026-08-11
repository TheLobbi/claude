---
name: gh:ship
intent: Drive a change end to end from goal to merged commit through plan, branch, implement, PR, review, green CI, and merge
tags:
  - github-orchestrator
  - command
  - delivery
inputs:
  - goal
  - flags
risk: high
cost: high
description: One command to ship — decompose the goal, branch, implement, open a PR, run the adversarial review board, drive CI to green, and merge once every policy gate passes
---

# /gh:ship

The full delivery loop. Takes a goal and does not stop until the change is
merged or it hits a gate that genuinely needs a human.

## Usage

```
/gh:ship "add per-tenant rate limiting to the ingest API"
/gh:ship --issue 214                    # ship the work described by issue #214
/gh:ship --stack                        # split into a stacked PR series
/gh:ship --draft                        # stop after opening a draft PR
/gh:ship --no-merge                      # stop after CI is green, leave merge to a human
/gh:ship --review-only                   # skip implementation, review what's on the branch
```

## Phases

The orchestrator runs these in order and reports a checkpoint after each.

### 1. Understand
Resolve the goal into a concrete scope. If `--issue` is given, read the issue,
its comments, and its linked PRs. Ask questions **only** if two readings of the
goal would produce materially different code. Otherwise state the assumption
and proceed.

### 2. Plan
`epic-decomposer` + `branch-strategist` produce a delivery plan: one PR, or a
stack. A PR is too big if it exceeds the `prSizeBudget` in
`config/policies.json` (default 400 changed lines excluding lockfiles and
generated files). Oversized plans are split before any code is written.

### 3. Branch
`branch-strategist` creates the branch off the correct base:
- Single PR → the repository default branch.
- Stacked PR → the parent PR's head branch.
Naming follows `config/policies.json:branchNaming` (default
`<type>/<scope>-<slug>`).

### 4. Implement
Write the change. Tests are part of the change, not a follow-up:
- New behavior → at least one test that fails without the change.
- Bug fix → a regression test that reproduces the bug.

### 5. Open PR
`pr-author` fills `templates/pr-description.md` from the actual diff — what
changed, why, risk, and how it was verified. If the repository has its own
`.github/pull_request_template.md`, that layout wins and the sections are
populated from the diff.

### 6. Review
Runs the [`review-board`](../workflows/review-board.json) workflow: six
independent lenses in parallel, then adversarial verification of every finding.
Findings that survive are applied; findings that do not are dropped silently.

### 7. Drive to green
Runs [`ci-drive-to-green`](../workflows/ci-drive-to-green.json). Each failure is
classified before anything is changed:

| Class | Action |
| --- | --- |
| Real regression from this diff | Fix and push |
| Flaky test | `flake-detective` confirms across runs, quarantines, files an issue |
| Infra/runner failure | Re-run the job; escalate after 2 failed re-runs |
| Pre-existing on base branch | Say so once in the PR thread, wait for base recovery |

The loop repeats until green. One round is not the task.

### 8. Merge
`merge-marshal` re-verifies every gate immediately before merging:
- All required checks green
- Review quorum satisfied (`config/policies.json:reviewQuorum`)
- No merge conflicts against the base
- No unresolved review threads
- Branch protection satisfied without bypass

Then merges using the configured method (default `squash`) and deletes the head
branch if `deleteBranchOnMerge` is set.

## Gates that stop and ask

`/gh:ship` is autonomous, but these always pause for a human:

- The change touches a path in `config/policies.json:humanReviewPaths`
  (default: migrations, auth, billing, infra).
- Merging would require bypassing branch protection.
- CI is red for a reason the triage agent cannot classify after 3 rounds.
- The diff exceeds 3× the PR size budget and cannot be split automatically.

## Output

```
✓ Plan          3 PRs (stacked): schema → service → api
✓ Branch        feat/ingest-rate-limit-schema off main
✓ Implement     7 files, +284 −31, 4 new tests
✓ PR            #491 opened — "feat(ingest): per-tenant rate limit schema"
✓ Review        6 lenses, 9 raw findings → 4 confirmed → 4 applied
✓ CI            green after 2 rounds (1 real fix, 1 flake quarantined → #492)
✓ Merge         squashed as a1b2c3d, branch deleted
→ Next          /gh:ship --stack-continue   (PR 2 of 3)
```

## Related

- [`/gh:plan-prs`](plan-prs.md) — planning only, no implementation
- [`/gh:review`](review.md) — review board on its own
- [`/gh:ci`](ci.md) — drive-to-green on its own
- [`/gh:merge-train`](merge-train.md) — land an existing stack
