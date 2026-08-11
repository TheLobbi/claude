---
name: gh:backlog
intent: Groom and prioritize the issue backlog by value, risk, staleness, and unblocking potential
tags:
  - github-orchestrator
  - command
  - planning
inputs:
  - scope
  - flags
risk: low
cost: medium
description: Rank the backlog by what actually unblocks work, close what will never be done, and surface the small set worth committing to next
---

# /gh:backlog

## Usage

```
/gh:backlog                          # groom and rank the whole backlog
/gh:backlog --label ingest           # scope to a component
/gh:backlog --stale 90d              # what has gone cold
/gh:backlog --commit 10              # propose the next 10 to commit to
/gh:backlog --dry-run
```

## Ranking

Ranked by **unblocking value**, not age or vote count. An issue that unblocks
four others outranks a higher-severity issue nothing depends on.

| Factor | Weight | Signal |
| --- | --- | --- |
| Unblocks other work | 0.30 | Sub-issue/parent graph, `blocked` labels, PR dependencies |
| Severity | 0.25 | Triage severity; `critical` short-circuits to the top |
| Reach | 0.20 | Distinct reporters, linked support threads, duplicate count |
| Confidence | 0.15 | Reproduction quality, size estimate certainty |
| Effort (inverse) | 0.10 | Triage size estimate |

Weights are configurable in `config/policies.json:backlogWeights`.

## Grooming actions

| Condition | Action |
| --- | --- |
| No activity, no assignee, no reproduction for > `staleAfter` | Propose close as `not_planned` with a one-line reason |
| Duplicate discovered late | Close as duplicate, link canonical |
| Fixed but never closed (linked PR merged) | Close as `completed`, link the PR |
| Missing size or severity | Route back to `/gh:triage` |
| `xl` and never decomposed | Route to `epic-decomposer` |
| Blocked by a closed blocker | Remove `blocked`, surface as newly actionable |

The last row is the one that pays for itself — issues that silently became
unblocked when their blocker merged are the most common source of stale backlogs.

## Closing is a proposal

Nothing is closed automatically. `/gh:backlog` proposes closures with reasons;
`--apply` executes the proposals after you have seen them. Closing someone's bug
report is a social act, and getting it wrong costs more than a stale issue.

## Output

```
Backlog: 87 open · 34 actionable · 41 stale · 12 blocked

Next 10 (by unblocking value)
 1. #188  critical  ingest drops events > 10k/s        unblocks #201 #209 #212 #214
 2. #219  high      auth token refresh race            reach 6 reporters
 3. #176  high      migration rollback is not tested   unblocks the sessions stack
 ...

Newly actionable (blocker merged) — 4
 #145 #152 #167 #171

Proposed closures — 11
 #98   not_planned  no activity 214d, no repro, original reporter gone
 #103  duplicate    → #188
 #121  completed    fixed by #402, never closed
 ...
 Apply with: /gh:backlog --apply
```

## Related

- [`/gh:triage`](triage.md) — the pipeline that feeds the backlog
- [`/gh:advise`](advise.md) — what to do next across everything, not just issues
