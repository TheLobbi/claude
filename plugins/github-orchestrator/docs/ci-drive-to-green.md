# CI Drive-to-Green

The failure taxonomy and the loop contract.

## The rule

**Classify before you fix.**

Editing source code in response to a runner OOM produces a red PR with extra
churn and a confused author. Re-running a job in response to a real regression
produces a red PR and a lost hour. The class determines the action, and getting
the class wrong makes everything downstream worse.

## Taxonomy

| Class | Signals | Action |
| --- | --- | --- |
| **Real regression** | Traces to a file/line in this diff · reproduces locally · the test is new or newly touched | Fix + regression test |
| **Flaky** | Same commit sha, different results · timing, ordering, port binding, or network in the trace | Confirm across ≥3 runs → quarantine → issue with an owner |
| **Infra** | Runner OOM or disk full · image pull failure · registry 5xx · action download timeout · cancelled by the runner | Re-run the job. Escalate after 2. **Never edit code** |
| **Base broken** | The same job fails on the base branch at a commit predating this branch's divergence | Say so **once**, wait for base recovery |
| **Config drift** | Failure is in workflow YAML, action inputs, or a missing secret | Route to `actions-optimizer` |
| **Dependency** | Appeared with no source change; a transitive package published | Pin or roll back |

## The loop

```
  ┌──────────────────────────────────────────────┐
  │ 1. fetch failing jobs (failed_only: true)    │
  │ 2. pull each failed job's log tail           │
  │ 3. classify (taxonomy above)                  │
  │ 4. fix    → real regression, config drift     │
  │ 5. re-run → infra                             │
  │ 6. quarantine → confirmed flaky               │
  │ 7. push, wait for the new run                 │
  │ 8. green? done : round += 1 → step 1          │
  └──────────────────────────────────────────────┘
```

### Three exit conditions

1. **Green.** Required checks pass. Report the round count.
2. **`maxRounds` reached** (default 4). Report what remains red and why.
3. **The same failure survives two consecutive fix attempts.** This is the
   important one: it means the *diagnosis* is wrong, not the fix. A third guess
   at a wrong diagnosis does not converge — it burns a round and adds churn.
   Stop and escalate with both attempted fixes and why each failed.

## Reading logs

```
1. mcp__github__actions_list   method: "list_workflow_runs", branch: <head ref>
2. mcp__github__get_job_logs   run_id: <run>, failed_only: true
3. mcp__github__get_job_logs   job_id: <job>, return_content: true, tail_lines: 200
```

Step 2 exists so you find the failed job ids without pulling every log in the
run. Pulling all logs first is the most common way this step blows the context
budget.

`actions_get` is **not** the log tool — it needs `method` plus `resource_id` and
returns run metadata. `list_workflow_runs` can exceed the token limit and be
spilled to a file; parse that file with `node -e` rather than reading it inline.

## Establishing "base broken"

Do not infer it from the error text. Check the base branch's own recent runs for
the **same job** at a commit predating this branch's point of divergence.

- Red there too → base breakage. Report once in the PR thread and stop. Saying
  it every round is noise, and the author cannot act on it either way.
- Green there → it is yours.

When the base recovers, merge it into the PR and push so CI re-runs against the
fixed base. If it is still red after that, it is your PR's failure now.

## Flaky vs real

The distinction that most often goes wrong. Calling a real regression "flaky"
ships the bug *and* burns trust in CI.

| Evidence | Strength |
| --- | --- |
| Same commit sha, different results | Conclusive |
| Passed on a neighbouring run with no relevant change | Strong |
| Fails only under parallel execution | Strong — ordering or shared state |
| Fails only on one OS or runtime version | Medium — environment dependence |
| Fails intermittently over a long window | Medium |
| "It passed when I re-ran it" | Weak — never sufficient alone |

**A test that has never passed is not flaky. It is broken.**

Failure rate hints at the mechanism: around 50% is usually an async race; around
2% is usually resource pressure or a real-time dependency.

## Quarantine is tracked, never silent

1. Mark the test quarantined with the mechanism the runner supports.
2. File an issue: the test, the diagnosed mechanism, the failure rate, the CI
   minutes it costs, the runs that prove it, and an owner.
3. Link the issue in a comment on the quarantine change.
4. Set an expiry. Quarantine older than 30 days is escalated, not renewed —
   permanent quarantine is deletion with extra steps.

Never quarantine a test on a critical path (auth, payments, data integrity)
without human approval. There, a flaky test is telling you something about the
system, not about the test.

## Never

- Never disable, skip, or `.only` a test to make CI pass. `.only` silently
  disables the rest of the file, so it quietly drops coverage well beyond the
  one test.
- Never re-run a job to make a failure disappear without recording why it failed.
- Never edit code in response to an infra failure.
- Never claim CI is fixed without a green run to point at.
