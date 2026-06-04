---
name: project-management-plugin:pm-review
intent: Multi-agent quality council review of completed work
tags:
  - project-management-plugin
  - command
  - pm-review
inputs: []
risk: medium
cost: medium
description: Multi-agent quality council review of completed work
---

# /pm:review — Quality Council Review

**Usage**: `/pm:review {project-id} [--phase {phase-id}] [--epic {epic-id}]`

## Purpose

Runs a structured multi-perspective quality council review across the entire project (or a scoped subset). The council evaluates completed work from four distinct angles and produces a structured report with categorized findings. BLOCK-level findings must be resolved before the project can be officially marked COMPLETE.

This command is typically run after `/pm:auto` reports completion, or at the end of each phase for incremental quality gates.

## Pre-Conditions

Load `project.json` and `tasks.json`. If the project status is not `COMPLETE`, `IN_PROGRESS`, or `PLANNED`: error. If `--phase` or `--epic` is provided: scope the review to only tasks within that boundary. Otherwise: review the entire project.

Collect all artifacts from `artifacts/` for COMPLETE tasks within scope. If no tasks are COMPLETE within scope: "No completed tasks to review in the specified scope."

## Council Invocation

Invoke the `council-reviewer` agent with:
- All COMPLETE task records (with completion_criteria and validation_results)
- All artifacts from `artifacts/{task-id}/` directories
- The project's tech stack, security requirements, and compliance requirements from project.json
- The project's risk register

The council-reviewer evaluates from 4 perspectives simultaneously:

### Perspective 1 — Quality and Correctness
Review whether each task's completion criteria were genuinely met, not just claimed to be met. Look for: gaps between what the criteria say and what the artifacts show, missing edge case handling, incomplete error handling, hardcoded values that should be configurable, and functions or modules that are present but clearly untested.

### Perspective 2 — Security
Review all artifacts for OWASP Top 10 vulnerabilities, credential exposure, injection risks (SQL, shell, template), insecure defaults, missing input validation, improper error messages that leak internal details, and missing authentication or authorization checks where they are required by the project spec.

### Perspective 3 — Architecture and Maintainability
Review for: violations of the project's stated tech stack and conventions, circular dependencies, missing abstractions (code duplication that should be extracted), modules that are too large (suggest splitting), missing documentation for non-obvious decisions, and structural patterns that will be hard to extend.

### Perspective 4 — UX and Completeness
Review for: missing user-facing error messages, incomplete happy-path flows, missing loading or empty states, accessibility gaps (if the project is a UI), and gaps between what the project goal promised and what the artifacts actually deliver.

## Finding Categories

Each finding must be categorized:

**BLOCK**: Must be fixed before the project can be marked COMPLETE. Examples: authentication bypass, data loss risk, critical path feature that is absent, security vulnerability.

**WARN**: Should be addressed but does not prevent completion. Examples: missing tests for edge cases, architectural smell that won't cause immediate problems, minor UX gap.

**NOTE**: Observation worth recording but not requiring action. Examples: a pattern that works but a better approach exists, a dependency that may become a problem in a future phase.

Each finding record includes:
- `category`: BLOCK | WARN | NOTE
- `perspective`: quality | security | architecture | ux
- `task_id`: the task this finding relates to (or null for project-level findings)
- `title`: one-line description
- `description`: 2–5 sentences explaining the problem and its impact
- `recommendation`: specific action to fix or address it

## Output Report

Display the council review report:

```
Quality Council Review: {project-name}
Scope: {Full project | Phase {n} | Epic {epic-title}}
Reviewed: {n} tasks, {n} artifacts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VERDICT: {PASS (no BLOCKs) | BLOCKED ({n} issues must be fixed)}

BLOCK findings: {n}
WARN findings:  {n}
NOTE findings:  {n}

BLOCKS (must fix before completion):
  [BLOCK-1] {title} (perspective: {name}, task: T-{n})
    {description}
    Recommendation: {recommendation}

WARNINGS:
  [WARN-1] {title} (perspective: {name})
    {description}

NOTES:
  [NOTE-1] {title}
    {description}
```

## Post-Review Actions

After displaying the report:

**If no BLOCK findings**:
Offer: "No blocking issues found. Mark project COMPLETE? (yes / no)"
On yes: update `project.json` `status: COMPLETE`, `completed_at`, `review_passed_at`.
Write the full report to `sessions/council-review-{date}.md`.

**If BLOCK findings exist**:
Automatically create a fix task for each BLOCK finding:
- Title: "Fix: {finding title}"
- Priority: CRITICAL
- Description: finding description + recommendation
- Completion criteria: 2 criteria derived from the recommendation
- Phase: current last phase (or a new "Quality Fixes" phase if needed)
- Dependencies: all previously COMPLETE tasks in the affected area

Announce: "{n} fix tasks created (T-{first} to T-{last}). Run `/pm:work {id}` or `/pm:auto {id}` to resolve them. Re-run `/pm:review {id}` after fixes are complete."

Write the report to `sessions/council-review-{date}.md` regardless of verdict.
