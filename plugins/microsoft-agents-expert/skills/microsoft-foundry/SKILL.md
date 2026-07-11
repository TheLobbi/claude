---
description: Run agents on Microsoft Foundry (formerly Azure AI Foundry) Agent Service — prompt agents vs hosted agents, threads/runs and the Responses API, built-in tools (Bing grounding, code interpreter, file search, MCP, OpenAPI, A2A), connected agents, Entra agent identity, SDKs, and observability/evaluations.
model: sonnet
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Microsoft Foundry — Agent Service

Azure's managed agent runtime. Now branded **Microsoft Foundry** (portal ai.azure.com; docs
under `/azure/foundry/`, previous generation under `/azure/foundry-classic/`; RBAC roles
renamed "Foundry User/Owner/…"). The classic Agent Service went **GA May 2025** (REST
api-version `2025-05-01`) with the OpenAI-Assistants-style **agents / threads / runs /
messages** model; the current service centers on the **Responses API** as the single entry
point. Overview: https://learn.microsoft.com/azure/foundry/agents/overview

## Two agent types

| Type | What it is | When |
|---|---|---|
| **Prompt agents** | Config-only: instructions + model + tools, authored in portal or SDK/REST. Fully managed runtime — no code or compute to manage. | Tool-using assistants where instructions + built-in tools suffice |
| **Hosted agents** (preview) | *Your* code — built with **Agent Framework, LangGraph, OpenAI Agents SDK, Anthropic SDK, GitHub Copilot SDK, or custom** — shipped as a container or zip. Foundry provides the managed endpoint, autoscale, **dedicated Entra identity per agent**, session-state persistence, and observability. Your code calls the Responses API for models + platform tools. | Custom agent loops that still want managed hosting/identity/observability |

Classic threads/runs semantics: run states `queued → in_progress → requires_action →
completed/failed/cancelled/expired`; threads up to 100K messages; optional BYO Cosmos DB
for thread storage.

## Tools

- **Built-in:** web search / Grounding with Bing (+ Bing Custom Search), Code Interpreter,
  File Search (vector stores), function calling, Azure AI Search, Azure Functions, Logic
  Apps (event triggers), Microsoft Fabric, SharePoint, Deep Research (o3-deep-research),
  Browser Automation, Computer Use, Image Generation, memory.
- **Custom:** **MCP** servers, **OpenAPI 3.0/3.1** specs, **A2A** (preview).
- **Connected agents** — compose multi-agent systems without an external orchestrator.
- Publishing targets include Teams / M365 Copilot and the **Entra Agent Registry**.

## SDKs and CLI

| Surface | Names |
|---|---|
| Python | **`azure-ai-projects` (>=2.0.0, `AIProjectClient`)** + `azure-identity`; classic threads/runs library `azure-ai-agents`; hosted-agent server libs `azure-ai-agentserver-responses` / `azure-ai-agentserver-invocations` |
| .NET | `Azure.AI.Projects` (`AgentAdministrationClient`) |
| Agent Framework hosting | `pip install agent-framework agent-framework-foundry-hosting` → `ResponsesHostServer` |
| CLI | `azd ext install microsoft.foundry`; `azd ai agent show \| invoke \| monitor` |

```python
import os
from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient

project_client = AIProjectClient(
    endpoint=os.environ["FOUNDRY_PROJECT_ENDPOINT"],
    credential=DefaultAzureCredential(),
)
agent = project_client.agents.get("<your-agent-name>")
client = project_client.get_openai_client()   # Responses API access
```

```bash
# Classic threads/runs REST (GA api-version 2025-05-01)
curl -X POST "$ENDPOINT/threads/thread_abc123/runs?api-version=2025-05-01" \
  -H "Authorization: Bearer $AGENT_TOKEN" -H "Content-Type: application/json" \
  -d '{"assistant_id": "asst_abc123"}'
```

## Identity, observability, evaluation

- **Identity:** hosted agents get a dedicated **Microsoft Entra identity**; grant that
  identity least-privilege access to downstream resources instead of sharing app secrets.
- **Observability:** server-side traces for prompt and hosted agents in the portal
  (90 days); Application Insights auto-injection for hosted agents; OpenTelemetry via the
  **Microsoft OpenTelemetry Distro** (`microsoft-opentelemetry`). External agents can be
  registered for trace/eval scoping.
- **Evaluations:** agent evaluators (Task Adherence, Intent Resolution) and
  `AIAgentConverter` in `azure-ai-evaluation` — run evaluations as a pre-deploy gate
  (see `/msagent-deploy`).

## Practices

- Prefer prompt agents until you actually need a custom loop; hosted agents add container
  lifecycle you must own.
- Use connected agents before reaching for an external orchestrator; reserve Agent
  Framework workflows for logic Foundry can't express.
- Ground on your data via File Search/Azure AI Search rather than stuffing context into
  instructions.
- BYO thread storage (Cosmos DB) when compliance requires data in your subscription.
- Reaching M365 channels: publish from the portal (auto-provisions Azure Bot Service +
  Entra) or front with the M365 Agents SDK — see `skills/agent-interop`.
