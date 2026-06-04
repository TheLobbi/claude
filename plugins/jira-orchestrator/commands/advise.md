---
name: jira:advise
intent: Get prioritized, evidence-backed recommendations for the next best actions across Jira, sprints, PRs, and CI
tags:
  - jira-orchestrator
  - command
  - advisor
inputs:
  - scope
risk: low
cost: medium
description: Invoke the jira-advisor agent to analyze current Jira/sprint/PR/CI state and recommend the next best actions, which workflow to launch, and which agents to deploy — read-only, no mutations
---

# /jira:advise

Dispatch the [`jira-advisor`](../agents/jira-advisor.md) agent to look at the current
state of your work and tell you **what to do next** — read-only, no Jira mutations.

## Usage

```
/jira:advise                       # advise on the active issue/sprint context
/jira:advise issue PROJ-123        # focus on one issue
/jira:advise sprint 42             # focus on a sprint/board
/jira:advise pr 1234               # focus on a pull request
/jira:advise project PROJ          # portfolio-level advice
```

## What it does

1. Gathers evidence read-only via Atlassian MCP (issue fields, JQL queries, links,
   transitions) and any available PR/CI signals.
2. Builds an evidence table, then scores candidate actions by **impact / effort / risk**.
3. Returns the **top 3 next actions**, each mapped to a concrete next step:
   - a workflow to launch (`/jira:workflow run <name>`),
   - a command to run (e.g. `/jira:work`, `/jira:review`),
   - or an agent to deploy (e.g. `escalation-manager`, `epic-decomposer`).
4. Surfaces the biggest current **risks and bottlenecks** (stale issues, SLA breaches,
   blocked dependencies, oversized PRs).

The advisor never writes — it only recommends. Act on its output with
[`/jira:workflow`](workflow.md) or the individual commands.
