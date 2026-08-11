---
name: gh:triage
intent: Triage issues by deduplicating, classifying, labeling, sizing, and routing or decomposing them
tags:
  - github-orchestrator
  - command
  - issues
inputs:
  - scope
  - flags
risk: medium
cost: medium
description: Deduplicate against existing issues, classify type and severity, apply labels, estimate size, and either route to an owner or decompose into sub-issues
---

# /gh:triage

## Usage

```
/gh:triage                          # triage everything untriaged
/gh:triage 214                      # triage one issue
/gh:triage --label needs-triage     # triage a labeled queue
/gh:triage --since 7d               # issues opened in the last week
/gh:triage --dry-run                # propose, do not apply
/gh:triage --decompose 214          # break an epic into sub-issues
```

## Pipeline

### 1. Deduplicate

[`dedup-detective`](../agents/dedup-detective.md) searches open **and closed**
issues before anything else. Closed matters: a bug reported three times and
closed twice as "cannot reproduce" is a different signal from a new bug.

Matching is semantic, not keyword — same symptom described differently is still a
duplicate. A match posts a link and closes as duplicate only at high confidence;
at medium confidence it links as "possibly related" and leaves it open.

### 2. Classify

| Axis | Values |
| --- | --- |
| Type | `bug` · `feature` · `docs` · `chore` · `question` · `security` |
| Severity | `critical` (data loss, outage, security) · `high` · `medium` · `low` |
| Surface | inferred from stack traces, file paths, and mentioned components |

A report with a stack trace pointing into `src/billing/` gets the billing
component label from the trace, not from the title.

### 3. Assess completeness

A bug report is actionable when it has reproduction steps, expected vs actual,
and version/environment. Missing pieces get **one** comment asking for exactly
what is missing — specific questions, not a template dump. Issues stuck waiting
on the reporter for longer than `staleAfter` are labeled `needs-info` and
excluded from the actionable backlog.

### 4. Size

Rough size from comparable closed issues: `xs` (< 1h), `s` (< 1d), `m` (< 3d),
`l` (< 1w), `xl` (needs decomposition). `xl` automatically routes to step 6.

### 5. Route

[`ownership-mapper`](../agents/ownership-mapper.md) picks an owner from
CODEOWNERS plus recent authorship of the implicated files — weighted toward
recent authorship, since CODEOWNERS goes stale.

### 6. Decompose

`xl` issues and epics go to [`epic-decomposer`](../agents/epic-decomposer.md),
which produces sub-issues that are each independently shippable, linked with
`mcp__github__sub_issue_write`, and ordered by dependency.

## Security issues

Anything classified `security` **stops the pipeline**. It is not labeled
publicly, not commented on with details, and not decomposed. It is routed to
`/gh:security` and the human is told. Publicly narrating an unpatched
vulnerability in an issue thread is the failure mode this guards against.

## Output

```
Triaged 14 issues

  3 duplicates closed        → #201→#188, #209→#188, #212→#195
  2 possibly related linked  → #215, #217
  1 security → routed        → #219 (not labeled publicly)
  4 needs-info               → one targeted question each
  3 routed                   → @alice (billing ×2), @bob (ingest)
  1 decomposed               → #214 → 5 sub-issues, dependency-ordered

Backlog now: 9 actionable, 4 blocked on reporter, 1 escalated
```

## Related

- [`issue-triage`](../workflows/issue-triage.json) — declarative form
- [`/gh:backlog`](backlog.md) — prioritize what triage produced
- [`/gh:security`](security.md) — where security issues go
