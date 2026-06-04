---
name: wa-schedule
intent: Create a Claude Desktop scheduled task via mcp__scheduled-tasks.
tags:
  - scheduled-tasks
  - automation
  - desktop
inputs:
  - task name
risk: medium
cost: low
flags:
  - name: dry-run
    type: boolean
    description: Show what would be created without committing
---

# /wa-schedule

Create a recurring Claude task that runs on a cron. Uses `mcp__scheduled-tasks__create_scheduled_task`.

## Flow

1. **Validate** — cron expression parseable, prompt non-empty, name unique (check `mcp__scheduled-tasks__list_scheduled_tasks`).
2. **Dry-run print** — show the full task spec (name, cron, prompt, permission mode).
3. **Create** — call `create_scheduled_task` with the validated spec.
4. **Confirm** — read back via `list_scheduled_tasks` and show the registered entry.
5. **Audit** — append to `state/change-log.jsonl`.

## Prompt discipline

The prompt must be self-contained — the scheduled run has no session context:
- Include file paths, not "the file we just changed".
- Include resource IDs, not "that pipeline".
- Include expected outputs, not "report back".

## Common recipes

```
# Daily Harness pipeline health
name: harness-daily-health
cron: "0 9 * * *"
prompt: "/wa-pipeline status all; summarize failures with mcp__harness__harness_diagnose"

# Weekly compliance drift
name: weekly-policy-drift
cron: "0 8 * * 1"
prompt: "Run tools/validate-all-policies.ps1; post drift to #compliance via Teams MCP"

# Nightly test run
name: nightly-tenant-tests
cron: "0 2 * * *"
prompt: "Run tools/run-all-tests.ps1; if any FAIL, file Jira issue via mcp__...__createJiraIssue"
```

## Safety

- Scheduled tasks inherit permission mode — default `default`. Use `acceptEdits` only with narrow `--allowed-tools`.
- Tasks that push to prod, deploy, or delete require explicit user confirmation in the prompt itself.

## See also

- `skill: claude-code-automation` — the decision matrix.
- `/wa-pipeline` — the target for most Harness schedules.
