---
name: fleet-orchestration:fleet-checks
intent: Read a pull request's check state the way the merge gate must - typename-aware, grouped by run, two independent readings printed raw beside the verdict
tags:
  - fleet-orchestration
  - command
  - merge-gate
inputs:
  - repo
  - pr
risk: low
cost: low
description: Read a pull request's check state the way the merge gate must - typename-aware, grouped by run, two independent readings printed raw beside the verdict
model: haiku
allowed-tools: Bash
---

# Checks

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/fleet.mjs" checks $ARGUMENTS
```

One command replaces the five-step ritual the merge gate used to perform by
hand, and it cannot skip any of the steps:

1. **Head read fresh** from the remote and stamped `POINT-IN-TIME`.
2. **Entries read by type.** `CheckRun` through `status`/`conclusion`;
   `StatusContext` through `state`. Reading the wrong field returns `null`
   and turns a green PR into "0 passing" — measured, on a fully green PR.
3. **Grouped by run id, newest run wins.** Two runs at one head produce 30
   entries for 15 checks; an ungrouped tally reports the superseded run's
   failure. The tell is entries exceeding distinct checks, and the tool says
   so.
4. **Two readings, different mechanisms**, printed raw: the rollup and
   `gh pr checks`. If their counts disagree it says `STOP`.
5. **Skipped lanes named.** A green over a set that skips the lane exercising
   your change is a right answer to a different question — the output asks
   you to name which lane covers it.

Exit 0 only when the verdict is `GREEN` **and** the two readings agree.

## What it deliberately does not do

- It does not read `mergeable`/`mergeStateStatus` as readiness. It prints the
  field and labels it *textual/structural only*. Readiness is **base-tip
  absorption** — invalidation, not distance — and that is a different
  question.
- It does not merge. Run it as the **literal last action before the merge
  command**, in the same message, and never reuse an earlier result.

## The rule it embodies

> Here is the current best predicate, and it is not what protects you. The
> raw print beside the decision is.

The predicate inside this tool broke four times in one evening before it was
right, and every break was caught by two readings disagreeing. That is why
the output is the raw list, not a summary.
