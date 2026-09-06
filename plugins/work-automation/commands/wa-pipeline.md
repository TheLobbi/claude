---
name: wa-pipeline
intent: Harness pipeline operations — list, get, execute, status, diagnose.
tags:
  - harness
  - ci-cd
  - pipeline
inputs: []
risk: medium
cost: low
description: Universal Harness pipeline ops. Uses mcpharness tools.
flags:
  - name: follow
    type: boolean
    description: For `execute`, poll status until terminal
---

# /wa-pipeline

Universal Harness pipeline ops. Uses `mcp__harness__*` tools.

## Actions

### `list`
`mcp__harness__harness_list resource=pipelines project=<project>`

### `get`
`mcp__harness__harness_get resource=pipeline project=<project> identifier=<pipeline>`

### `execute`
1. `mcp__harness__harness_execute project=<project> pipeline=<pipeline> inputs={...}`.
2. If `--follow`, poll `harness_status` every 10s until terminal (`Success` / `Failed` / `Aborted`).
3. On `Failed`, auto-run `harness_diagnose`.

### `status`
`mcp__harness__harness_status execution-id=<execution>`

### `diagnose`
`mcp__harness__harness_diagnose execution-id=<execution>`

## Account/org resolution

Reads `HARNESS_ACCOUNT` and `HARNESS_ORG` from env. Never hard-code — fail loudly if unset.

## Safety

- `execute` against prod-deploy pipelines requires explicit user confirmation.
- Never `delete` a pipeline via this command — use marketplace plugin `harness-platform` with explicit auth.

## Recipes

```
/wa-pipeline list --project thelobbi
/wa-pipeline execute --project thelobbi --pipeline cisvcmembership --follow
/wa-pipeline diagnose --execution <id>
```

## See also

- `skill: harness-automation` — the pattern library.
- `plugin: harness-platform` — richer operations.
