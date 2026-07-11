# Microsoft Agents Expert Plugin Guide

## Purpose
- Operational guide for working safely in `plugins/microsoft-agents-expert`.
- Keep edits scoped, minimal, and aligned with this plugin's existing architecture.

## Supported Commands
- `msagent-choose` (see `commands/msagent-choose.md`) — pick the right Microsoft agent stack
- `msagent-scaffold` (see `commands/msagent-scaffold.md`) — scaffold an agent project
- `msagent-migrate` (see `commands/msagent-migrate.md`) — migrate legacy bots/agents to current SDKs
- `msagent-review` (see `commands/msagent-review.md`) — review an agent implementation
- `msagent-deploy` (see `commands/msagent-deploy.md`) — deployment and channel publishing guidance

## Skill Map
| Skill | Covers |
|---|---|
| `agent-framework` | Microsoft Agent Framework (SK + AutoGen successor): agents, workflows, middleware, memory, observability |
| `m365-agents-sdk` | Microsoft 365 Agents SDK: AgentApplication, Activity protocol, channels, hosting custom engines |
| `teams-agents` | Teams AI Library and Teams-specific agent surface (cards, streaming, meetings) |
| `copilot-studio` | Copilot Studio: topics, generative orchestration, tools/connectors, agent flows, autonomous triggers, ALM |
| `microsoft-foundry` | Foundry Agent Service: hosted agents, threads/runs, built-in tools, identity, observability |
| `agent-interop` | Cross-stack decision matrix, MCP + A2A interop, multi-agent orchestration across stacks |

## Prohibited Actions
- Do not delete or rename `.claude-plugin/plugin.json`.
- Do not introduce secrets, credentials, or tenant-specific IDs in tracked files.
- Do not modify unrelated plugins from this plugin workflow unless explicitly requested.
- Do not present preview features as GA — check the status notes in each skill.

## Required Validation Checks
- Run `npm run check:plugin-context`.
- Run `npm run check:plugin-schema`.
- Run `npm run generate:plugin-indexes` after adding/removing commands or agents.

## Context Budget
Load in this order and stop when you have enough context:
1. `CONTEXT_SUMMARY.md`
2. The one skill matching the stack in question
3. `agent-interop` only when the task spans multiple stacks

## Escalation Path
- If requirements conflict with plugin guardrails, pause implementation and document the conflict.
- If Microsoft SDK surface appears to have changed since the skills were written, verify against Microsoft Learn (`mcp__Microsoft_Learn__microsoft_docs_search`) before answering, and update the skill.
