# Microsoft Agents Expert

Comprehensive expert plugin for Microsoft's agent development stack — **Microsoft Agent
Framework** (the open-source Semantic Kernel + AutoGen successor), **Microsoft 365 Agents
SDK** (the Bot Framework successor), **Teams SDK** (formerly Teams AI Library), **Copilot
Studio**, and **Microsoft Foundry Agent Service** — plus the cross-stack story: when to use
which, and how they compose over MCP and A2A.

## What's inside

| | Count | Highlights |
|---|---|---|
| Skills | 6 | One per stack + a cross-stack selection/interop skill with the decision matrix |
| Agents | 5 | Architect (opus), Agent Framework engineer, M365/Teams channel engineer, Copilot Studio specialist, Foundry operations engineer |
| Commands | 5 | `/msagent-choose` · `/msagent-scaffold` · `/msagent-migrate` · `/msagent-review` · `/msagent-deploy` |

## Quick start

- "Which Microsoft agent tech should we use?" → `/msagent-choose`
- "Start a new Agent Framework project in Python" → `/msagent-scaffold`
- "We have a Bot Framework v4 bot" → `/msagent-migrate`
- "Is our Teams agent production-ready?" → `/msagent-review`
- "Ship it to M365 Copilot" → `/msagent-deploy`

## Coverage notes

- Package names, GA/preview statuses, and API shapes were verified against Microsoft Learn
  (mid-2026): Agent Framework `Microsoft.Agents.AI` / `agent-framework`; M365 Agents SDK
  `Microsoft.Agents.Builder` / `@microsoft/agents-hosting` / `microsoft-agents-hosting-core`;
  Teams SDK `@microsoft/teams.apps`; Foundry `azure-ai-projects` (>=2.0.0).
- Preview surfaces are labeled preview in the skills (Foundry hosted agents, A2A tool,
  Copilot Studio → Foundry child agents, Teams SDK Python, Agent Framework Go).
- When Microsoft's surface moves, verify against Microsoft Learn
  (`mcp__Microsoft_Learn__microsoft_docs_search`) and update the affected skill.

## Related plugins

- `tvs-microsoft-deploy` — Microsoft ecosystem deployment (Graph, Dataverse, Fabric, Planner)
- `lobbi-m365-automator` — M365 workspace automation (SharePoint, Teams provisioning, Power Automate)

This plugin is specifically about **building agents** on the Microsoft stack; those two
cover the surrounding M365/Azure operations.
