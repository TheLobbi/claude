---
description: Choose and combine Microsoft agent stacks — the Copilot Studio vs Teams SDK vs M365 Agents SDK vs Agent Framework vs Foundry decision matrix, plus interop patterns - MCP as the tool fabric, A2A as the agent protocol, hosting matrices, and Agent 365 identity/observability.
model: opus
allowed-tools:
  - Read
  - Glob
  - Grep
---

# Microsoft Agent Stack — Selection and Interop

The five pieces solve different layers of the same problem. Most production systems combine
a **build layer** (Copilot Studio or Agent Framework) with a **hosting/channel layer**
(Foundry Agent Service or M365 Agents SDK/Teams SDK).

## Decision matrix

Source: https://learn.microsoft.com/microsoft-365/copilot/extensibility/overview-custom-engine-agent

| | Copilot Studio | Teams SDK | M365 Agents SDK | Foundry |
|---|---|---|---|---|
| Approach | Low-code SaaS | Pro-code | Pro-code | Low-code or pro-code PaaS |
| Orchestrator | Copilot Studio | Bring your own | Bring your own (Agent Framework, SK, LangChain) | Bring your own / managed |
| Channels | M365 Copilot, Teams, web, custom (Direct Line) | M365 Copilot, Teams | M365 Copilot, Teams + 10+ channels via Azure Bot Service | M365 Copilot, Teams (others via custom integration) |
| Languages | n/a | C#, TS/JS, Python (preview) | C#, JS, Python | Python, C# |

**Rules of thumb**

- Maker-built, governed, Power-Platform-integrated, department scale → **Copilot Studio**
  (Copilot Credits abstract LLM token pricing).
- Code-level control of the agent loop, multi-agent workflows, provider flexibility →
  **Agent Framework** (it's the library, not the host).
- Azure-managed runtime, model catalog, enterprise identity/observability → **Foundry
  Agent Service** (CAF decision tree: SaaS → Copilot Studio; PaaS pro-code → Foundry).
- Same agent on many channels (the Bot Framework succession path) → **M365 Agents SDK**.
- Deeply Teams-native collaborative experience → **Teams SDK**.

## Interop patterns

| Pattern | How |
|---|---|
| Agent Framework inside M365 Agents SDK | AgentApplication turn handler calls `agent.run(...)`; SDK owns channels/auth, framework owns reasoning |
| Agent Framework on Foundry | Hosted agent via `agent-framework-foundry-hosting` (`ResponsesHostServer`) — managed endpoint, Entra agent identity |
| Foundry agent in M365/Teams | Publish from the Foundry portal (auto-provisions Azure Bot Service + Entra) or an Agents Toolkit proxy app |
| Copilot Studio → Foundry | Connect an external Foundry agent as a **child agent** (preview; new-portal agents only) |
| Code → Copilot Studio | `CopilotStudioAgent` (`agent-framework-copilotstudio`); M365 Agents SDK OBO-auth samples |
| Humans in the loop from any stack | Teams as an MCP server: `notify` / `ask` / `request_approval` |

## The two protocols

- **MCP is the common tool fabric** — Copilot Studio adds MCP servers as tools, Foundry has
  an MCP tool type, Agent Framework ships MCP clients (`MCPStreamableHTTPTool` et al.), and
  Teams itself can be exposed as an MCP server. Build a capability once as an MCP server
  and every stack can consume it.
- **A2A is the common agent-to-agent protocol** — Agent Framework `A2AAgent` /
  `Microsoft.Agents.AI.A2A`, Foundry's A2A tool (preview), Teams SDK bot-to-bot A2A.
  Use A2A when two *agents* converse; use MCP when an agent calls a *capability*.

## Cross-cutting: Agent 365

The Agent 365 SDK (`@microsoft/agents-a365-*`) provides Entra-based **agent identity**, an
agent **registry**, and **OpenTelemetry observability** for agents from any framework —
including agents registered from Google Vertex AI or Amazon Bedrock. Reach for it when an
organization needs one governance plane over heterogeneous agents.

## Architecture review checklist

When reviewing a proposed multi-stack design:

1. Exactly one owner per layer — conversation/channel, orchestration, tools, hosting,
   identity. Two components owning the same layer is the #1 design smell.
2. Every cross-stack hop uses MCP or A2A (or a documented connector) — no bespoke HTTP
   bridges that bypass identity and telemetry.
3. Identity flows end-to-end: user → channel → agent (Entra agent identity) → downstream
   scopes, with on-behalf-of where user context must survive.
4. One telemetry plane (OpenTelemetry / Agent 365) across all stacks in the design.
5. Cost model named per layer: Copilot Credits, Foundry consumption, model tokens.
