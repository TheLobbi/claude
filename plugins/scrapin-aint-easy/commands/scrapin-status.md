---
name: scrapin-aint-easy:scrapin-status
intent: Show overall system status — graph health, cron jobs, drift summary
tags:
  - scrapin-aint-easy
  - command
  - scrapin-status
inputs: []
risk: medium
cost: medium
description: Show overall system status — graph health, cron jobs, drift summary
model: haiku
allowed-tools:
  - Read
---

# /scrapin-status

Show the overall health and status of the scrapin-aint-easy system.

## Usage

```
/scrapin-status
```

## Behavior

1. Call `scrapin_graph_stats` — show node/edge counts
2. Call `scrapin_cron_status` — show cron job health
3. Call `scrapin_agent_drift_status` — quick drift overview
4. Call `scrapin_code_drift_report` — latest code drift summary
5. Present a unified dashboard:
   - Knowledge graph: X nodes, Y edges, Z sources
   - Vector store: X entries
   - Cron: X/Y jobs healthy
   - Agent drift: X agents, Y drifted, Z high-severity
   - Code drift: X missing docs, Y deprecated, Z stale
