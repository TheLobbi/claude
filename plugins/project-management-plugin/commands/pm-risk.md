---
name: project-management-plugin:pm-risk
intent: Assess project risks with severity scoring and mitigation suggestions
tags:
  - project-management-plugin
  - command
  - pm-risk
inputs: []
risk: medium
cost: medium
description: Assess project risks with severity scoring and mitigation suggestions
---

# /pm:risk — Risk Assessment

**Usage**: `/pm:risk {project-id} [--task T-001] [--phase {phase-id}] [--rescore]`

## Purpose

Displays risk scores across the project, identifies the highest-risk tasks, shows HITL-flagged tasks, and lists any spike tasks created to resolve known unknowns. When `--rescore` is used, re-runs the risk-assessor agent to update all risk scores based on the project's current state (useful when the project has evolved significantly since initial planning).

## Loading Data

Read `project.json` and `tasks.json`. If tasks.json is missing or has no tasks: "Project not planned yet. Run `/pm:plan {id}` first."

If `--task T-001`: scope the report to only that single task.
If `--phase {phase-id}`: scope to all tasks in that phase.
If neither: report covers the full project.

## When --rescore is Set

Invoke the `risk-assessor` agent on all PENDING, IN_PROGRESS, and BLOCKED tasks within scope. The assessor re-evaluates each task using:

- **Technical complexity** (0–3): How much uncertainty exists in the implementation? Does it touch unfamiliar systems or APIs? Are there competing approaches with unclear trade-offs?
- **External dependency** (0–2): Does success depend on a third-party service, API, or system outside team control?
- **Security sensitivity** (0–2): Does this task touch authentication, authorization, secret handling, or user data?
- **Reversibility** (0–2): Is this task reversible if it goes wrong? File deletion, database migrations, and published API changes score highest.
- **Estimate size** (0–1): Tasks estimated over 25 min score 1 (larger tasks carry more execution risk).

`risk_score = technical_complexity + external_dependency + security_sensitivity + reversibility + estimate_size` (max: 10)

Re-set `requires_hitl: true` on tasks where `risk_score > 7`.

After rescoring, write updated scores back to `tasks.json`. Invoke `checkpoint-manager`.

## Risk Report

Display a structured risk report:

```
Risk Assessment: {project-name}
Scope: {full project | Phase {n} | Task T-{n}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUMMARY
  Total tasks assessed:    {n}
  High-risk (score 8–10):  {n} tasks
  Medium-risk (score 5–7): {n} tasks
  Low-risk (score 0–4):    {n} tasks
  HITL-flagged:            {n} tasks
  Spike tasks:             {n} tasks

TOP 5 HIGHEST-RISK TASKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. T-{n}: {title}                         [Score: 9/10] [HITL]
   Phase: {name} | Epic: {name}
   Status: {status}
   Breakdown: complexity=3 external=2 security=2 reversibility=2 size=0
   Why it's risky: {1-2 sentence explanation}

2. T-{n}: {title}                         [Score: 8/10] [HITL]
   ...

{repeat for top 5}

HITL-FLAGGED TASKS (require human confirmation before execution)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  T-{n}: {title} (score: {n}/10)
  T-{n}: {title} (score: {n}/10)
  ...

SPIKE TASKS (unresolved known unknowns)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  T-{n}: Spike: {description}    Status: {status}
  T-{n}: Spike: {description}    Status: {status}
  ...
```

## Single Task Detail

When `--task T-{n}` is provided, show the full risk breakdown for that task:

```
Risk Detail: T-{n} — {title}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Overall score: {n}/10  {risk_level: LOW|MEDIUM|HIGH|CRITICAL}
HITL required: {yes | no}

Breakdown:
  Technical complexity:  {0-3} — {reason}
  External dependency:   {0-2} — {reason}
  Security sensitivity:  {0-2} — {reason}
  Reversibility:         {0-2} — {reason}
  Estimate size:         {0-1} — {estimate_minutes} min

Status: {status}
Agent assigned: {agent or "auto"}

Mitigation suggestions:
  {2-3 specific actions that would reduce this task's risk score}
```

## After Report

If `--rescore` was used and any task's risk score changed by more than 2 points: note: "Significant score changes detected. Review HITL-flagged tasks before next execution cycle. Run `/pm:work {id}` — HITL triggers will fire automatically."

Offer: "To re-run the full assessment with updated scores: `/pm:risk {id} --rescore`"
