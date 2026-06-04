# Jira Orchestrator — Declarative Workflows

Multi-step, agent-coordinated workflows expressed as data and validated against the
Claude Code workflow schema. Launch them with the [`/jira:workflow`](../commands/workflow.md)
command or compose them from the [`jira-advisor`](../agents/jira-advisor.md) agent.

## Why declarative workflows

The plugin already ships 81 agents and 48 commands. Workflows give those building
blocks an explicit, reviewable execution graph — steps, dependencies, branches,
loops, parallel fan-out, retries, and error handling — instead of relying on prose
in a command body. Each file conforms to
[`schema/workflow.schema.json`](schema/workflow.schema.json)
(`type: sequential | parallel | hierarchical | mesh | adaptive | group-chat | conditional`).

## Bundled workflows

| File | Type | Purpose |
|------|------|---------|
| `issue-delivery.json` | sequential | Triage → prepare → work → review → PR → ship for one issue. |
| `bug-triage.json` | conditional | Classify a bug, then escalate (critical) or enter the normal pipeline. |
| `epic-decomposition.json` | hierarchical | Break an epic into stories and enrich each child. |
| `sprint-planning.json` | sequential | Capacity → plan → balance → roadmap alignment. |
| `pr-review-board.json` | parallel | Code + security + QA reviews in parallel, then a synthesized verdict. |

## Step types

`agent` · `command` · `bash` · `workflow` · `condition` · `loop` · `parallel` · `wait`.
Steps reference real plugin agents (e.g. `triage-agent`, `epic-decomposer`,
`council-coordinator`) and commands (e.g. `/jira:work`, `/jira:pr`). Inter-step data
flows through `inputs`/`outputs` JSONPath references (`$.input.*`, `$.<stepId>.*`).

## Validate

```bash
node workflows/validate.mjs
```

Every definition is checked against the bundled schema on each marketplace validation
run. Keep new workflows kebab-case-named, give them a 10–500 char `description`, and
reference only agents/commands that exist in this plugin.
