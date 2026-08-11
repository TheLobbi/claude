---
name: github-orchestration
description: This skill should be used when coordinating multi-agent GitHub delivery work — dispatching teams, holding a blackboard, enforcing merge gates, and deciding what to run in parallel versus in sequence.
version: 1.0.0
trigger_phrases: [orchestrate github, coordinate agents, delivery loop, merge gate, dispatch team]
categories: [github, orchestration, multi-agent, delivery]
author: github-orchestrator
created: 2026-08-11
updated: 2026-08-11
---

# GitHub Orchestration

Coordination patterns for multi-agent GitHub delivery.

## Choosing a coordination pattern

| Pattern | Use when | Cost |
| --- | --- | --- |
| **Sequential** | Each step needs the previous step's output | Sum of steps |
| **Parallel + barrier** | You need *all* results together — dedup across findings, an early exit on zero | Slowest step |
| **Pipeline (no barrier)** | Each item flows through all stages independently | Slowest single chain |
| **Hierarchical** | A coordinator delegates and synthesizes | Slowest worker + synthesis |
| **Adaptive loop** | Repeat until a convergence condition (drive-to-green) | Unbounded — always cap rounds |

Default to **pipeline** over barrier. A barrier is justified only when a stage
genuinely needs cross-item context. "I need to flatten the array first" is not a
justification — do the transform inside a stage.

## What parallelizes in GitHub work

Independent, run concurrently:
- Review lenses over the same diff
- Security scans across alert classes
- Metric collection across dimensions
- Per-PR triage across open PRs

Genuinely sequential:
- Branch → implement → PR (each needs the last)
- Landing a stack (each landing changes the next base)
- Migration → code → cleanup

## The blackboard

Agents write findings to a shared structure; the coordinator reads and decides.

- **Contradiction is information.** Two agents disagreeing means one has context
  the other lacks. Investigate; do not average their confidence.
- **Deduplicate by root cause**, not by text. Two lenses describing the same
  defect differently is one finding.
- **Record what was dropped** and why. A board that reports only survivors is
  indistinguishable from a board that found nothing.

## Delegation

- Narrow mandate plus an explicit return contract. "Review this PR" produces
  mush; "find correctness defects, return file/line/failure-scenario" produces
  findings.
- Keep subagent prompts under ~400 words — subagents inherit a large context
  chain before your prompt, and long prompts raise rejection rates.
- Prefer a named specialist over a general-purpose agent.
- Never spawn duplicate agents hoping one succeeds. Spawn them with **different
  lenses** so disagreement carries signal.

## Merge gates

These are absolute. An agent may not route around them:

1. Every required check green at the **current** head sha
2. Review quorum met, no outstanding `CHANGES_REQUESTED`
3. No unresolved threads when protection requires resolution
4. Clean mergeability against the base
5. No branch-protection bypass or admin override
6. Human approval for `humanReviewPaths`

Re-verify against live state immediately before merging. A gate that passed ten
minutes ago is not evidence about now.

## Reporting

Report per phase, with a marker per phase, and never claim a phase you skipped.
A summary that reads complete while a step was silently dropped is the worst
possible output — it converts a partial result into a false one.

## See also

- `merge-queue` — queue and protection semantics
- `review-protocols` — the adversarial board
- `../workflows/README.md` — declarative workflow authoring
