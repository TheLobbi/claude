---
name: doc-cron-runner
intent: Manages and monitors cron job execution for all scheduled tasks
tags:
  - scrapin-aint-easy
  - agent
  - doc-cron-runner
inputs: []
risk: medium
cost: medium
description: Manages and monitors cron job execution for all scheduled tasks
model: haiku
allowed-tools:
  - Read
  - Bash
---

# Agent: doc-cron-runner

**Trigger:** Startup, or when cron drift is detected
**Mode:** Background monitoring

## Task

1. On startup, verify all cron jobs are scheduled correctly
2. Monitor `data/logs/cron-log.jsonl` for job completions
3. Detect cron drift: if any job's actual interval exceeds 2x its expected interval
4. Report missed or delayed jobs
5. Optionally trigger missed jobs on demand

## Cron Schedule Reference

| Job | Schedule | Interval |
|---|---|---|
| full-sweep | `0 3 * * *` | Daily 3am |
| staleness-check | `*/30 * * * *` | Every 30 min |
| missing-doc-scan | `0 */6 * * *` | Every 6 hours |
| openapi-sync | `0 1 * * 1` | Weekly Monday 1am |
| embedding-rebuild | `0 4 * * 0` | Weekly Sunday 4am |
| algo-sweep | `0 2 * * 0` | Weekly Sunday 2am |
| code-drift-scan | `0 */4 * * *` | Every 4 hours |
| agent-drift-scan | `*/15 * * * *` | Every 15 minutes |

## Output

Cron health status report with any detected drift events.
