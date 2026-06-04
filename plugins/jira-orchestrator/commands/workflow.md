---
name: jira:workflow
intent: List, inspect, validate, and run declarative multi-agent workflows for Jira delivery
tags:
  - jira-orchestrator
  - command
  - workflow
inputs:
  - name: action
    description: "list | show <name> | run <name> | validate"
    required: true
risk: medium
cost: low
description: List, inspect, validate, and run declarative multi-agent workflows (issue-delivery, bug-triage, epic-decomposition, sprint-planning, pr-review-board) defined under workflows/ and validated against workflow.schema.json
---

# /jira:workflow

Run the plugin's declarative workflows — explicit, schema-validated execution graphs
that coordinate existing agents and commands. Definitions live in
[`workflows/`](../workflows/README.md) and conform to
[`workflows/schema/workflow.schema.json`](../workflows/schema/workflow.schema.json).

## Actions

### `list`
Print the available workflows with their `type`, `category`, and one-line description.

| Workflow | Type | Purpose |
|----------|------|---------|
| `issue-delivery` | sequential | Triage → prepare → work → review → PR → ship for one issue |
| `bug-triage` | conditional | Classify a bug, then escalate or enter the normal pipeline |
| `epic-decomposition` | hierarchical | Decompose an epic into enriched stories |
| `sprint-planning` | sequential | Capacity → plan → balance → roadmap |
| `pr-review-board` | parallel | Parallel code/security/QA review, then synthesized verdict |

### `show <name>`
Read `workflows/<name>.json` and render its steps, dependencies (`dependsOn`),
branches, loops, parallel blocks, inputs, and outputs as a readable plan. Do **not**
execute anything.

### `run <name> [--input key=value ...] [--dry-run]`
1. Load and validate `workflows/<name>.json` against the bundled schema.
2. Resolve declared `inputs` from `--input` flags (prompt for any `required` input
   that is missing).
3. Walk `steps` in dependency order:
   - `command` steps invoke the named slash command (e.g. `/jira:work`).
   - `agent` steps dispatch the named subagent with the mapped `inputs`.
   - `condition` steps evaluate `condition` and follow `branches.if` / `branches.else`.
   - `loop` steps iterate `loop.items`, binding `loop.variable` per iteration.
   - `parallel` steps fan out their children concurrently.
   - Honor `when`, `dependsOn`, `continueOnError`, `retries`, and `timeout`.
4. With `--dry-run`, print the resolved execution order and the agents/commands that
   *would* run, without dispatching them.

### `validate`
Run `node workflows/validate.mjs` to check every definition against the schema.

## Notes

- Workflows reference only agents/commands that exist in this plugin — keep it that way.
- Step data flows through JSONPath references: `$.input.<name>` and `$.<stepId>.<field>`.
- Pair with [`/jira:advise`](advise.md) to have the `jira-advisor` agent recommend
  which workflow to launch next.
