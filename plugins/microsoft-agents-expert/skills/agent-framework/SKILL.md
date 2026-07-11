---
description: Build agents and multi-agent workflows with Microsoft Agent Framework — the open-source successor to Semantic Kernel and AutoGen. Covers agents, sessions, tools, orchestration patterns, middleware, memory, MCP, and observability in C#, Python, and Go.
model: sonnet
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Microsoft Agent Framework

Open-source, multi-language SDK for AI agents and graph-based workflows — the **direct
successor to both Semantic Kernel and AutoGen**, built by the same teams. AutoGen's simple
agent abstractions + SK's enterprise features (sessions, type safety, middleware,
telemetry), plus typed workflows. Docs: https://learn.microsoft.com/agent-framework/overview/
· Repo: github.com/microsoft/agent-framework (Go: agent-framework-go).

**Status (mid-2026):** C#/.NET core is stable v1.x; Python is primary alongside it. Many
provider/integration packages are still preview (Mem0/Redis/Neo4j providers, AG-UI, Dev UI).
Go is public preview. Check package status before promising GA to a user.

## Packages

| Language | Install |
|---|---|
| .NET | `Microsoft.Agents.AI` (core), `.Abstractions`, `.OpenAI`, `.Foundry`, `.A2A` (NuGet) |
| Python | `pip install agent-framework` (meta) → `agent-framework-core` + providers: `agent-framework-foundry`, `agent-framework-openai`, `agent-framework-copilotstudio`, `agent-framework-mem0`, `agent-framework-foundry-hosting` |
| Go | `go get github.com/microsoft/agent-framework-go` (preview) |

Python imports come from `agent_framework` (e.g. `from agent_framework.foundry import FoundryChatClient`).

## Core abstractions

- **.NET:** `AIAgent` (base), `ChatClientAgent` (wraps any `Microsoft.Extensions.AI.IChatClient`),
  `AgentSession` for multi-turn state, `RunAsync` / `RunAsync<T>` (structured output →
  `AgentResponse<T>`).
- **Python:** `Agent`, `BaseAgent`, `SupportsAgentRun`, `AgentSession`, `@tool` decorator.
- **Special agents:** `CopilotStudioAgent` (call a Copilot Studio agent from code),
  `A2AAgent` (remote agent over the A2A protocol).
- **Three pillars:** *Agents* (single agent loop), *Harness* (opinionated long-task agent:
  planning/todo tracking, context compaction, file access/memory, don't-ask-again tool
  approval), *Workflows* (typed graphs).

```python
from agent_framework import Agent
from agent_framework.foundry import FoundryChatClient
from azure.identity import AzureCliCredential

agent = Agent(
    client=FoundryChatClient(credential=AzureCliCredential()),
    instructions="You are a helpful assistant",
)
result = await agent.run("Help me with this task")
```

```csharp
using Azure.AI.Projects;
using Azure.Identity;
using Microsoft.Agents.AI;

AIAgent agent = new AIProjectClient(new Uri("<project-endpoint>"), new DefaultAzureCredential())
    .AsAIAgent(model: "gpt-4o-mini", name: "Joker", instructions: "You are good at telling jokes.");
AgentSession session = await agent.CreateSessionAsync();
Console.WriteLine(await agent.RunAsync("Tell me a joke.", session));
```

## Workflows and orchestration

Typed graphs of **executors** connected by **edges** (direct, conditional, switch-case,
fan-out, fan-in), with checkpointing and human-in-the-loop pauses. High-level builders in
`agent_framework.orchestrations` / the .NET equivalents:

| Pattern | Builder | Use when |
|---|---|---|
| Sequential | `SequentialBuilder` | Pipeline: research → write → review |
| Concurrent | fan-out/fan-in edges | Independent subtasks in parallel |
| Handoff | `HandoffBuilder` | Triage agent routes to specialists |
| Group Chat | `GroupChatBuilder` | Agents debate/collaborate on shared thread |
| Magentic | Magentic orchestration | Manager dynamically plans and coordinates specialists |

A workflow can itself be exposed as an agent: `workflow.as_agent(name="Content Pipeline Agent")`.

```python
from agent_framework.orchestrations import SequentialBuilder
workflow = SequentialBuilder(participants=[researcher, writer, reviewer]).build()
```

## Middleware, memory, tools

- **Middleware** (function- or class-based) intercepts agent actions — logging, guardrails,
  caching, tool-call gating. Prefer middleware over prompt hacks for policy enforcement.
- **Memory:** context providers (chat-history memory is released; Mem0/Redis/Neo4j are
  preview) and chat-history providers (Cosmos DB, Redis) for persistence.
- **Tools:** native functions (`@tool` / `AIFunctionFactory`), plus **MCP** clients —
  `MCPStreamableHTTPTool`, `MCPStdioTool`, `MCPWebsocketTool` — and hosted MCP via
  `get_mcp_tool(...)` on Foundry/OpenAI/Anthropic chat clients.

## Observability

OpenTelemetry per the GenAI semantic conventions — `configure_otel_providers()` in Python;
exports to Azure Monitor or the Aspire Dashboard. MCP trace context propagates automatically
via `_meta`. Instrument from day one; agent bugs are trace-shaped.

## Practices

- Wrap any `IChatClient`-compatible model — the framework is provider-agnostic; don't hard-code
  a single vendor path when the user needs flexibility.
- Use `AgentSession` for multi-turn state instead of hand-rolled history lists.
- Structured outputs via `RunAsync<T>` beat string parsing for machine-consumed results.
- Migrating from Semantic Kernel or AutoGen? Agent Framework is the successor — map SK
  planners/agents and AutoGen group chats onto the orchestration builders above
  (see `/msagent-migrate`).
- Deploy targets: self-host (any ASP.NET/ASGI app), inside the **M365 Agents SDK** for
  channel reach (`skills/m365-agents-sdk`), or as a **Foundry hosted agent**
  (`agent-framework-foundry-hosting`, `ResponsesHostServer` — see `skills/microsoft-foundry`).
