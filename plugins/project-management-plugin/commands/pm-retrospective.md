---
name: project-management-plugin:pm-retrospective
intent: Post-completion retrospective analysis with lessons learned
tags:
  - project-management-plugin
  - command
  - pm-retrospective
inputs: []
risk: medium
cost: medium
description: Post-completion retrospective analysis with lessons learned
---

# /pm:retrospective — Post-Completion Analysis

**Usage**: `/pm:retrospective {project-id}`

## Purpose

Runs a post-project analysis after a project reaches COMPLETE status. Extracts patterns from the execution history, evaluates what worked and what did not, measures estimate accuracy, assesses research effectiveness, and generates a retrospective report that is saved for use as learning input for future projects.

This is the final command in a typical project lifecycle: `/pm:init` → `/pm:plan` → `/pm:auto` → `/pm:review` → `/pm:retrospective`.

## Pre-Conditions

Load `project.json`. If status is not `COMPLETE`: warn "Project is not complete (status: {status}). Run retrospective only after project completion. Proceed anyway? (yes / no)" On no: stop. On yes: proceed with available data.

If `review_passed_at` is not set in project.json: warn "Quality council review has not been run. Retrospective findings may be incomplete. Run `/pm:review {id}` first, then re-run retrospective."

## Data Collection

Gather all available data before invoking agents:

- `tasks.json` — all task records with statuses, validation histories, and blocked_reason fields
- `sessions/*.md` — session summaries with duration and task counts
- `artifacts/*/execution-notes.md` — actual durations and deviations from plan
- `research/*.md` — research brief metadata (sources used, cache hits)
- `checkpoints/*.json` — timeline of progress over the project lifetime
- `sessions/council-review-*.md` — quality council findings (if available)

## Invoke pattern-recognizer Agent

Invoke the `pattern-recognizer` agent with all collected data. It analyzes:

### What Went Well

- Tasks completed faster than estimated (estimate accuracy > 100%): list the top 5 by time saved
- Tasks with zero validation failures on first attempt: count and percentage
- Epics completed without any BLOCKED tasks
- Research briefs that the executor explicitly cited as highly useful (from execution-notes.md)
- Agents that performed particularly well on certain task types (based on pass rates)

### What Was Hard

- Tasks that required 2+ validation retries: list with failure reasons
- High-risk tasks (risk_score > 7) and whether HITL interventions were effective
- Tasks where actual duration exceeded estimate by more than 50%
- Epics with the most BLOCKED tasks
- Spike tasks and whether their resolutions unblocked downstream work effectively

### Estimation Accuracy

For all COMPLETE micro-tasks that have actual duration data in their execution-notes.md:
- Compute per-task accuracy: `(estimate / actual) × 100`
- Group by task level, phase, and epic
- Identify systematic over- or under-estimation patterns (e.g., "API integration tasks were consistently underestimated by 40%")
- Overall accuracy: mean and median across all tasks

### Research Effectiveness

- What percentage of tasks had research briefs at execution time?
- Which research sources were cited most often by executors?
- Tasks that were BLOCKED because research was insufficient or missing: how many?
- Cache hit rate: how often did tasks reuse research from within the 24h window?

### Patterns for Future Projects

The pattern-recognizer extracts generalizable lessons:
- Task type patterns: "Database migration tasks always need double the estimate"
- Research patterns: "External API tasks need Context7 research — codebase-only research was insufficient"
- Risk patterns: "Tasks touching the payment flow had 3× higher retry rate — always HITL-flag payment tasks"
- Team/agent patterns: "task-executor handled auth tasks well; architectural tasks needed quality-reviewer feedback loop"

## Retrospective Report

Display and write to `sessions/retrospective.md`:

```markdown
# Retrospective: {project-name}

**Completed**: {completed_at relative-time}
**Total duration**: {hours}h across {n} sessions
**Tasks**: {n} complete, {n} skipped, {n} remaining
**Quality**: {n} council BLOCK findings, {n} WARN findings

## What Went Well

### Fast Completions (top 5)
- T-{n}: {title} — estimated {m} min, done in {k} min ({pct}% faster)

### Zero-Retry Tasks
{n} of {total} tasks ({pct}%) completed validation on first attempt.

### Most Effective Research
- Research brief for T-{n} was cited as highly useful by {k} subsequent tasks.

## What Was Hard

### High-Retry Tasks
- T-{n}: {title} — {n} retries. Root cause: {blocked_reason}

### Estimation Misses
- T-{n}: {title} — estimated {m} min, actual {k} min ({pct}% over)

### Blockers That Stalled Progress
{description of the most impactful blockages}

## Estimation Accuracy

| Category          | Estimated | Actual | Accuracy |
|-------------------|-----------|--------|----------|
| Overall           | {n}h      | {n}h   | {pct}%   |
| Phase 1 tasks     | ...       | ...    | ...      |
| API integration   | ...       | ...    | ...      |

Systematic bias: {over-estimated | under-estimated | accurate} by {pct}% on average.

## Research Effectiveness

- Tasks with research at execution: {n}/{total} ({pct}%)
- Research cache hit rate: {pct}%
- Tasks blocked by insufficient research: {n}

## Patterns Extracted

### For Future Similar Projects
1. {pattern description}
2. {pattern description}
...

### Agent Performance Notes
- {agent-name}: {performance observation}

## Recommended Template Updates

{If patterns suggest template changes}:
- Add these task types to the {template} template: {list}
- Increase estimate by {pct}% for {task type}
- Always create a spike task for {pattern}
```

After writing: announce "Retrospective complete. Report saved to sessions/retrospective.md. Consider running `/pm:template create {id} --name {suggested-name}` to save this project structure as a reusable template."
