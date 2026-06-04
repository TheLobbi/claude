---
name: project-management-plugin:pm-report
intent: Generate a full project report with progress, risks, and artifacts
tags:
  - project-management-plugin
  - command
  - pm-report
inputs: []
risk: medium
cost: medium
description: Generate a full project report with progress, risks, and artifacts
---

# /pm:report — Project Report Generation

**Usage**: `/pm:report {project-id} [--format markdown|json] [--output {filepath}]`

## Purpose

Generates a comprehensive project report covering all aspects of the project: status, progress, quality metrics, velocity, and next steps. Useful for stakeholder communication, retrospectives, or archiving the state of a project. The report is generated from all available data: `project.json`, `tasks.json`, `dependencies.json`, `checkpoints/`, `sessions/`, `research/`, and `artifacts/`.

## Invocation

Invoke the `project-reporter` agent with the full project data package. The reporter reads and aggregates:
- `project.json` for goal, tech stack, and status
- `tasks.json` for all task statuses and validation histories
- `checkpoints/*.json` for timeline reconstruction
- `sessions/*.md` for session durations and velocity data
- `artifacts/*/execution-notes.md` for actual vs estimated times
- `research/*.md` for research coverage statistics

Default format is `markdown`. If `--format json` is specified, produce a machine-readable JSON report instead of the narrative markdown report.

## Report Structure (Markdown Format)

```markdown
# Project Report: {project-name}

**Generated**: {date and time}
**Status**: {status}
**Project ID**: {project-id}

## Executive Summary

**Goal**: {one-sentence goal}
**Started**: {created_at relative-time}
**Duration**: {total time across all sessions}
**Completion**: {pct}% ({n} of {total} micro-tasks)

{2–3 sentence narrative summary of what was accomplished, what is remaining, and overall health}

## Progress by Phase

### Phase 1: {name} — {pct}% ({n}/{total})

#### Epic: {name} — {pct}%
- {story title}: {n}/{total} tasks ({status})
- {story title}: {n}/{total} tasks ({status})

{repeat for all phases and epics}

## Completed Tasks

| Task ID | Title | Phase | Epic | Est (min) | Actual (min) | Accuracy |
|---------|-------|-------|------|-----------|--------------|----------|
| T-001   | ...   | ...   | ...  | 15        | 12           | 125%     |
...

## Blocked Tasks

| Task ID | Title | Blocked Reason | Since |
|---------|-------|---------------|-------|
| T-088   | ...   | ...           | ...   |

## Quality Metrics

- Total validation passes on first attempt: {n} ({pct}%)
- Tasks requiring retry: {n} ({pct}%)
- Average retries per failed task: {avg}
- Tasks requiring HITL: {n}
- Council review findings: {n} BLOCK, {n} WARN, {n} NOTE (if review run)

## Velocity Metrics

- Total tasks completed: {n}
- Total execution time: {hours}h {min}m across {n} sessions
- Average velocity: {tasks/hour}
- Fastest session: {n} tasks in {duration}
- Estimate accuracy: {overall pct} (estimated vs actual, where data available)

## Research Coverage

- Tasks with research briefs: {n}/{total} ({pct}%)
- Research cache hits (24h window): {n} ({pct}%)
- External sources queried: {n} (Context7, Perplexity)

## Session Log

| Date | Duration | Tasks Completed | Tasks Blocked | Stopping Reason |
|------|----------|----------------|---------------|-----------------|
| ...  | ...      | ...            | ...           | ...             |

## Risk Register

| Task ID | Title | Risk Score | HITL Required | Notes |
|---------|-------|-----------|---------------|-------|
...

## Next Steps

{If project is COMPLETE}:
- Run `/pm:review {id}` for quality council sign-off
- Run `/pm:retrospective {id}` for post-completion analysis

{If project is IN_PROGRESS}:
- Next task: T-{n} — {title} (est. {min} min)
- Blocked tasks requiring attention: {list}
- Estimated completion: {rough estimate based on velocity}
```

## JSON Format

When `--format json` is specified, produce:
```json
{
  "report_generated_at": "{iso-timestamp}",
  "project": { ...project.json contents... },
  "summary": {
    "pct_complete": 42.3,
    "tasks_complete": 127,
    "tasks_total": 302,
    "tasks_blocked": 3,
    "sessions_count": 3,
    "total_minutes": 262
  },
  "phases": [ ...phase-level rollup objects... ],
  "completed_tasks": [ ...task records with actual durations... ],
  "blocked_tasks": [ ...task records with blocked_reason... ],
  "quality": { ...quality metrics... },
  "velocity": { ...velocity metrics... },
  "session_log": [ ...session summary objects... ]
}
```

## Output Behavior

If `--output {filepath}` is provided: write the report to that path. Create parent directories if needed. Confirm: "Report written to {filepath}."

If no `--output` is given: display the report inline in the conversation.

After displaying or writing: if the project is COMPLETE and no council review has been run (check `project.json` for `review_passed_at` field): suggest "Run `/pm:review {id}` to run the quality council review before archiving."
