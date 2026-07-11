# microsoft-agents-expert Context Summary

## Plugin purpose
Expert for Microsoft's agent stack: Microsoft Agent Framework (Semantic Kernel + AutoGen
successor), Microsoft 365 Agents SDK (Bot Framework successor), Teams SDK (formerly Teams
AI Library), Copilot Studio, and Microsoft Foundry Agent Service. Stack selection,
scaffolding, migration, review, deployment, and cross-stack interop over MCP and A2A.

## Skill index
- `skills/agent-framework/SKILL.md` — agents, sessions, tools, workflows, middleware, MCP, OTel
- `skills/m365-agents-sdk/SKILL.md` — AgentApplication, Activity protocol, channels, hosting engines
- `skills/teams-agents/SKILL.md` — Teams SDK: cards, streaming, AI labels, Teams-as-MCP-server
- `skills/copilot-studio/SKILL.md` — topics, generative orchestration, tools/MCP, credits, ALM
- `skills/microsoft-foundry/SKILL.md` — prompt vs hosted agents, tools, identity, evaluations
- `skills/agent-interop/SKILL.md` — decision matrix, MCP/A2A interop, Agent 365

## Agent index
- `agents/msagent-architect.md` — cross-stack architecture (opus)
- `agents/agent-framework-engineer.md` — Agent Framework implementation
- `agents/m365-teams-agent-engineer.md` — M365 Agents SDK + Teams SDK channel layer
- `agents/copilot-studio-specialist.md` — low-code design, governance, credits
- `agents/foundry-operations-engineer.md` — Foundry provisioning, identity, observability

## Command index
`/msagent-choose` (stack selection) · `/msagent-scaffold` (starter project) ·
`/msagent-migrate` (legacy → current SDKs) · `/msagent-review` (quality/security review) ·
`/msagent-deploy` (hosting, identity, publishing)

## When to open deeper docs

| Signal | Open docs | Why |
|---|---|---|
| "Which agent tech should we use?" | `skills/agent-interop/SKILL.md` | Decision matrix |
| Agent Framework code | `skills/agent-framework/SKILL.md` | Packages, abstractions, orchestrations |
| Channels, Activity protocol, Bot Framework migration | `skills/m365-agents-sdk/SKILL.md` | AgentApplication pipeline, Toolkit |
| Teams-native UX | `skills/teams-agents/SKILL.md` | Teams SDK packages, required agent UX |
| Low-code, connectors, autonomous triggers | `skills/copilot-studio/SKILL.md` | Orchestration, MCP, ALM, pricing |
| Azure-hosted agents, evals | `skills/microsoft-foundry/SKILL.md` | Prompt vs hosted, SDKs, identity |
| Combining stacks | `skills/agent-interop/SKILL.md` | MCP/A2A patterns, review checklist |

Load this summary first; open only the matching skill for single-stack questions.
