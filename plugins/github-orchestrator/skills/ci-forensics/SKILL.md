---
name: ci-forensics
description: This skill should be used when reading CI logs and diagnosing failures — fetching Actions logs through the GitHub MCP, classifying failures by cause, and distinguishing flaky tests from real regressions.
version: 1.0.0
trigger_phrases: [CI failing, read CI logs, why is the build red, flaky test, classify failure, drive to green]
categories: [ci, debugging, github-actions, testing]
author: github-orchestrator
created: 2026-08-11
updated: 2026-08-11
---

# CI Forensics

## Fetching logs — the correct sequence

```
1. mcp__github__actions_list   method: "list_workflow_runs", branch: <head ref>
2. mcp__github__get_job_logs   run_id: <run>, failed_only: true
3. mcp__github__get_job_logs   job_id: <job>, return_content: true, tail_lines: 200
```

Known pitfalls in these tools:

- `actions_list` and `actions_get` are multiplexed behind a `method`
  discriminator. Calling either without `method` errors.
- `actions_get` also needs `resource_id` (not `run_id`) and returns metadata,
  not logs. It is the wrong tool for log triage.
- `get_check_run` fetches **one** check run by `checkRunId`; it has no list mode.
  For "is CI green on this sha", use `actions_list` → `list_workflow_runs` and
  filter by `head_sha`.
- `list_workflow_runs` can exceed the token limit and be spilled to a file.
  Parse that file with `node -e`, do not read it inline.

## Failure taxonomy

Classify before changing anything. Fixing an infra flake by editing source code
produces a red PR with extra churn.

| Class | Signals | Action |
| --- | --- | --- |
| **Real regression** | Traces to a file/line in the diff; reproduces locally; the test is new or newly touched | Fix + regression test |
| **Flaky** | Same commit sha, different result; timing/ordering/port/network in the trace | Confirm across ≥3 runs, then quarantine |
| **Infra** | Runner OOM, disk full, image pull failure, registry 5xx, action download timeout | Re-run. Escalate after 2. Never edit code |
| **Base broken** | Same job red on the base at a commit predating the branch point | Report once, wait for recovery |
| **Config drift** | Failure in workflow YAML, action inputs, or a missing secret | Fix the workflow |
| **Dependency** | Appeared with no source change; a transitive package published | Pin or roll back |

## Establishing "base broken"

Do not infer it from error text. Check the base branch's own runs for the same
job at a commit predating this branch's point of divergence. Red there too →
base breakage. Otherwise it is yours.

## Flaky vs real

| Evidence | Strength |
| --- | --- |
| Same commit sha, different results | Conclusive |
| Passed on a neighbouring run, no relevant change | Strong |
| Fails only under parallel execution | Strong — ordering or shared state |
| Fails only on one OS or runtime version | Medium — environment dependence |
| "It passed when I re-ran it" | Weak — never sufficient alone |

A test that has **never** passed is not flaky. It is broken.

Failure rate hints at mechanism: ~50% is usually an async race; ~2% is usually
resource pressure or a real-time dependency.

## Sources of nondeterminism

Real time · unseeded randomness · test ordering and shared module state · fixed
ports · shared database rows · reused temp paths · missing awaits · real network
calls · resource pressure.

## Never

- Never disable, skip, or `.only` a test to make CI pass. `.only` silently
  disables the rest of the file.
- Never re-run a job to make a failure disappear without recording why it failed.
- Never claim CI is fixed without a green run to point at.

## See also

- `actions-authoring` — fixing the workflow itself
- `../commands/ci.md` — the drive-to-green loop
