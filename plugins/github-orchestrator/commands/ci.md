---
name: gh:ci
intent: Triage CI failures by class and loop fix-push-recheck until required checks are green
tags:
  - github-orchestrator
  - command
  - ci
inputs:
  - pr
  - flags
risk: high
cost: high
description: Classify every failing check as real regression, flaky test, infra failure, or pre-existing base breakage, then fix what belongs to this diff and loop until CI is green
---

# /gh:ci

CI triage that classifies before it fixes, and loops until green rather than
declaring success after one round.

## Usage

```
/gh:ci 482                        # triage failures on PR #482 and report
/gh:ci 482 --drive-to-green       # fix, push, re-check — loop until green
/gh:ci --run 1849302              # triage a specific workflow run
/gh:ci --flaky                    # flake report across recent runs
/gh:ci 482 --max-rounds 5         # cap the loop (default 4)
/gh:ci --base-check               # is the base branch itself red?
```

## Failure taxonomy

Nothing is changed until the failure is classified. Fixing an infra flake by
editing source code is how a red PR becomes a red PR with extra churn.

| Class | Signal | Action |
| --- | --- | --- |
| **Real regression** | Failure reproduces locally or is traceable to a hunk in this diff | Fix, add a regression test, push |
| **Flaky** | Same test passed on an unrelated re-run; timing/ordering/network in the trace | `flake-detective` confirms across ≥3 runs, quarantines, files an issue with the owner |
| **Infra** | Runner OOM, image pull failure, registry 5xx, network timeout in setup steps | Re-run the job. Escalate after 2 failed re-runs — do not edit code |
| **Base-branch broken** | Same job fails on the base branch at a commit predating this PR | Say so **once** in the PR thread, then wait for the base to recover |
| **Config drift** | Failure is in workflow YAML, not test code | Route to `actions-optimizer` |

## The drive-to-green loop

```
  ┌─────────────────────────────────────────────┐
  │ 1. Fetch failing jobs (get_job_logs,        │
  │    failed_only: true)                        │
  │ 2. Pull log tail for each failed job         │
  │ 3. Classify each failure (taxonomy above)    │
  │ 4. Fix only "real regression" + "config"     │
  │ 5. Re-run only "infra"                       │
  │ 6. Quarantine "flaky"                        │
  │ 7. Push, wait for the new run                │
  │ 8. Green? done. Red? round += 1 → step 1     │
  └─────────────────────────────────────────────┘
              exit on green, max-rounds, or unclassifiable
```

The loop stops early and escalates if the same failure survives two consecutive
fix attempts — that means the diagnosis is wrong, and a third guess will not help.

## Reading logs correctly

Use the GitHub MCP in this order — `actions_get` is the wrong tool for log triage:

```
1. mcp__github__actions_list   method: "list_workflow_runs", branch: <head>
   → find the run for the PR head sha
2. mcp__github__get_job_logs   run_id: <run>, failed_only: true
   → identify failed job ids without pulling every log
3. mcp__github__get_job_logs   job_id: <job>, return_content: true, tail_lines: 200
   → the actual error
```

`list_workflow_runs` can return payloads over the token limit and get spilled to
a file — parse that file with `node -e`, do not read it inline.

## Output

```
PR #482 — 2 failing checks, round 1/4

✗ test (ubuntu-latest, node-20)     REAL REGRESSION
    TypeError: cannot read 'id' of undefined  — src/api/user.ts:114
    Traced to hunk @@ -108,6 +108,9 @@ in this diff
    → fix + regression test

✗ e2e (chromium)                     FLAKY  (confidence 0.86)
    "checkout completes" — timeout waiting for #submit
    Passed on runs 1849290, 1849255, 1849201 with no relevant change
    → quarantine + issue

  build, lint, typecheck              green

Applied 1 fix, quarantined 1 test, pushed 9f3a21c. Waiting for run…
```

## Rules

- **Never** mark CI "fixed" without a green run to point at.
- **Never** disable, skip, or `.only` a test to make CI pass. Quarantine goes
  through `flake-detective`, which files a tracked issue with an owner.
- **Never** edit code in response to an infra failure.
- If the base branch is broken, report it once and stop — repeating it every
  round is noise.

## Related

- [`ci-drive-to-green`](../workflows/ci-drive-to-green.json) — declarative form
- [`ci-forensics`](../skills/ci-forensics/SKILL.md) — log-reading and classification knowledge
- [`/gh:actions`](actions.md) — fix the workflow itself
