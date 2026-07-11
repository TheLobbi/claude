---
description: Build and host custom engine agents with the Microsoft 365 Agents SDK — AgentApplication, the Activity protocol, channel reach via Azure Bot Service, hosting Agent Framework or Semantic Kernel engines, and the Agents Toolkit/Playground workflow. Successor to the Bot Framework SDK.
model: sonnet
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Microsoft 365 Agents SDK

The channel and hosting layer for **custom engine agents**: receives and sends messages
across Microsoft 365 Copilot, Teams, web, and 10+ third-party channels (Slack, Facebook
Messenger, Twilio, SMS, email) via **Azure Bot Service**, which translates channel traffic
into Activities. It is the **successor to the Bot Framework SDK** (BF SDK and Emulator are
archived; support ended 2025-12-31). AI-agnostic: host Microsoft Agent Framework, Semantic
Kernel, LangChain, OpenAI Agents, or Foundry agents inside it.
Docs: https://learn.microsoft.com/microsoft-365/agents-sdk/agents-sdk-overview

**Status (mid-2026):** GA — .NET v1.6.x (.NET 8+), JavaScript v1.6.x (Node 18+), Python v1.1.x.

## Packages

| Language | Packages |
|---|---|
| .NET | **`Microsoft.Agents.Builder`** (AgentApplication, routing, middleware, turn context), `Microsoft.Agents.Core` (Activity models), `Microsoft.Agents.Storage`, `Microsoft.Agents.Authentication`, `Microsoft.Agents.Connector`, `Microsoft.Agents.Storage.Transcript` |
| JS/TS | **`@microsoft/agents-hosting`**, `@microsoft/agents-hosting-express`, `@microsoft/agents-activity` |
| Python | `microsoft-agents-hosting-core`, `microsoft-agents-activity`, `microsoft-agents-hosting-aiohttp`, `microsoft-agents-authentication-msal`, `microsoft-agents-storage-blob` / `-cosmos`, `microsoft-agents-hosting-teams` (imports from `microsoft_agents`) |

## Core concepts

- **Activity Protocol** — the standard JSON message format shared across channels; typed
  models live in `Microsoft.Agents.Core` / `@microsoft/agents-activity`.
- **`AgentApplication`** — your entry point. Pipeline: Channel → hosting layer (HTTP auth)
  → AgentApplication routing → your handlers, with turn state loaded before and saved after
  each handler. Route ranking (`RouteRank.Last`) orders catch-alls.
- **`CloudAdapter`** processes `/api/messages`; agents are stateless with pluggable storage
  (memory, Blob, Cosmos).
- **Tooling:** **Microsoft 365 Agents Toolkit** (formerly Teams Toolkit — VS, VS Code, CLI)
  for scaffolding/manifests/publishing, and the **Microsoft 365 Agents Playground** — a
  local Teams-like sandbox needing no tenant, tunnel, or bot registration.
- **Agent 365 SDK** (`@microsoft/agents-a365-*`) layers on enterprise observability
  (OpenTelemetry), notifications, MCP tool-server management, and Entra-based agent identity.

## Minimal agents

```csharp
public class EchoAgent : AgentApplication
{
    public EchoAgent(AgentApplicationOptions options) : base(options)
        => OnActivity(ActivityTypes.Message, OnMessageAsync, rank: RouteRank.Last);

    private async Task OnMessageAsync(ITurnContext tc, ITurnState ts, CancellationToken ct)
        => await tc.SendActivityAsync($"You said: {tc.Activity.Text}", cancellationToken: ct);
}
```

```typescript
import { AgentApplication, MemoryStorage, TurnContext, TurnState } from '@microsoft/agents-hosting'
import { startServer } from '@microsoft/agents-hosting-express'

const app = new AgentApplication<TurnState>({ storage: new MemoryStorage() })
app.onActivity('message', async (ctx: TurnContext) => ctx.sendActivity(`You said: ${ctx.activity.text}`))
startServer(app)
```

## Hosting an AI engine inside

The SDK is plumbing; the intelligence is whatever you host. The documented pattern for
Agent Framework / Semantic Kernel: instantiate the engine agent once, then call it from the
message handler and relay the result as an activity.
Guide: https://learn.microsoft.com/microsoft-365/agents-sdk/using-semantic-kernel-agent-framework

Keep the layers separate: channel/UX concerns (activities, cards, auth) in the
AgentApplication handler; reasoning/tools in the engine (see `skills/agent-framework`).

## Bot Framework migration

Coming from Bot Framework v4 (see `/msagent-migrate`):

- The Activity protocol carries over — message shapes and channel semantics are familiar.
- `ActivityHandler`/adapter wiring becomes `AgentApplication` routing; middleware moves to
  the new pipeline.
- Dialogs have no direct successor — replace waterfall dialogs with an LLM engine + tools,
  or explicit state machines for strictly deterministic flows.
- Re-register the messaging endpoint against Azure Bot Service; update auth to the current
  `Microsoft.Agents.Authentication` / MSAL configuration.

## Practices

- Develop against the Agents Playground first; only stand up tunnels/bot registrations when
  channel-specific behavior needs testing.
- Store per-conversation state via the SDK's storage abstractions, not process memory, so
  scale-out works.
- One agent codebase, many channels: guard Teams-only affordances (cards, meetings) behind
  channel checks — see `skills/teams-agents` for the Teams-native layer.
- Publishing to M365 Copilot/Teams flows through app manifests and the Agents Toolkit —
  see `/msagent-deploy`.
