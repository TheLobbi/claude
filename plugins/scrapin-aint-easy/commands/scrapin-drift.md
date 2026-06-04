---
name: scrapin-aint-easy:scrapin-drift
intent: Run drift detection — codebase API drift and agent prompt drift
tags:
  - scrapin-aint-easy
  - command
  - scrapin-drift
inputs: []
risk: medium
cost: medium
description: Run drift detection — codebase API drift and agent prompt drift
model: opus
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# /scrapin-drift

Run comprehensive drift detection across codebase and agents.

## Usage

```
/scrapin-drift              # Run both code + agent drift
/scrapin-drift --code       # Code drift only
/scrapin-drift --agents     # Agent drift only
/scrapin-drift --ack <id>   # Acknowledge agent drift as intentional
```

## Behavior

### Code Drift
1. Call `scrapin_code_drift_scan` to scan imports vs knowledge graph
2. Report missing documentation, deprecated usage, and stale references
3. Suggest actions: queue crawls for missing docs, flag deprecated usage for review

### Agent Drift
1. Call `scrapin_agent_drift_status` for overview
2. For any agent with drift score > 3, call `scrapin_agent_drift_detail`
3. For any agent with drift score > 7, **HALT and alert user**
4. If cross-agent contradictions detected, list them with severity

### Acknowledge Drift
1. Call `scrapin_agent_drift_acknowledge` to update baseline
2. Optionally include notes explaining why the drift was intentional

## Critical Rules

- **NEVER ignore drift scores above 7** — always report to user
- **NEVER proceed past cross-agent contradictions** without user resolution
- After any edit to `.claude/agents/*.md`, run agent drift scan immediately
