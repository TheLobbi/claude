---
name: msagent-migrate
intent: Migrate legacy Microsoft bots and agents to the current SDKs
tags:
  - microsoft-agents-expert
  - migration
  - modernization
inputs:
  - source stack (bot-framework|semantic-kernel|autogen|teams-toolkit|power-virtual-agents)
  - path to existing code or solution
  - target stack (optional — recommended if omitted)
risk: medium
cost: high
description: Assess a legacy Bot Framework, Semantic Kernel, AutoGen, or Teams Toolkit project and produce (or execute) a migration plan to Agent Framework, M365 Agents SDK, or Copilot Studio
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# /msagent-migrate — Migrate to the Current Microsoft Agent SDKs

The legacy-to-current map:

| From | To | Notes |
|---|---|---|
| Bot Framework SDK (v4) | **M365 Agents SDK** | Activity protocol carries over; adapter/hosting model changes |
| Semantic Kernel agents | **Agent Framework** | Agent Framework is the SK successor for agentic work |
| AutoGen | **Agent Framework** | Multi-agent patterns map to Agent Framework workflows/orchestrations |
| Teams Toolkit projects | **M365 Agents Toolkit** + Teams AI Library | Toolkit was renamed; project structure updates |
| Power Virtual Agents | **Copilot Studio** | PVA was superseded; topics migrate, new generative features available |

## Process

1. **Inventory the source**: Glob/Grep the project for SDK packages, adapter/host wiring,
   dialogs or planners, tool/skill registrations, state/memory usage, and channel surface.
2. **Classify each component** as: direct mapping / needs redesign / obsolete (feature now
   built into the target).
3. **Load the target skill** for current shapes; consult `skills/agent-interop` when the
   migration also changes hosting (e.g., self-hosted bot → Foundry Agent Service).
4. **Produce the migration plan**: ordered steps, per-component mapping table, risk notes
   (auth changes, state migration, channel re-registration), and a verification checklist.
5. **Execute only when asked** — default deliverable is the plan. When executing, migrate
   one vertical slice first (one dialog/agent end-to-end) and validate before fanning out.

## Guardrails

- Never delete legacy code during migration — leave the old path in place until the new
  slice is verified.
- Call out behavior differences that testing must cover (streaming, proactive messages,
  auth flows), not just compile-level changes.
