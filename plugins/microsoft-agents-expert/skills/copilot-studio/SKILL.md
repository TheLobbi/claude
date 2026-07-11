---
description: Design, govern, and extend Microsoft Copilot Studio agents — topics, generative orchestration, knowledge, tools and MCP, agent flows, autonomous triggers, publishing channels, Copilot Credits pricing, and solution-based ALM on Power Platform.
model: sonnet
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Microsoft Copilot Studio

SaaS low-code agent platform on Power Platform (copilotstudio.microsoft.com). GA.
Docs hub: https://learn.microsoft.com/microsoft-copilot-studio/

## Building blocks

- **Topics** — deterministic dialogs with trigger phrases and slot filling; still the right
  tool for flows that must behave identically every time.
- **Generative orchestration** — the LLM planner interprets intent (multi-intent, last 10
  turns of history) and builds a plan across **topics, tools, knowledge sources, child
  agents, and triggers**. This is the default architecture for new agents.
  Guidance: https://learn.microsoft.com/microsoft-copilot-studio/guidance/generative-orchestration
- **Knowledge / generative answers** — RAG over attached sources with citations.
- **Tools** — Power Platform **connectors** (1,400+), **prompts**, **agent flows**
  (flow-style automation), and **MCP servers**.
- **Autonomous agents** — event/scheduled triggers (e.g., Dataverse events) run the agent
  without a human in the loop; scope permissions tightly and use the built-in guardrails.
  Custom triggers like On Plan Complete; computer use; multi-agent via child/connected agents.

## MCP integration

Tools tab → **+ Add a tool** → *Model Context Protocol* wizard (server name/URL, OAuth).
Supports MCP **tools and resources**; server-side changes reflect dynamically. Requires
generative orchestration.
Docs: https://learn.microsoft.com/microsoft-copilot-studio/agent-extend-action-mcp

## Publishing channels

Teams, Microsoft 365 Copilot, SharePoint, Power Pages, demo/custom websites, mobile apps,
and custom clients via the **Direct Line API** (REST + WebSocket). Entra ID auth is the
default for organizational channels.

## Pricing — Copilot Credits

**Copilot Credits** are the common currency (renamed from "messages", effective 2025-09-01).
Representative rates: classic answer 1 · generative answer 2 · agent action 5 · tenant graph
grounding 10 · agent flow actions 13/100 actions · tiered AI-tool rates · voice 10/35/75 per
minute. Purchase via prepaid packs, the Azure pay-as-you-go meter, or Copilot Credit
prepurchase (CCCUs). M365 Copilot-licensed users are no-charge for most features. Monthly
enforcement, no rollover — budget autonomous triggers especially, since nobody is watching
the meter mid-run.

## ALM and governance

Agents are Dataverse **solution** components:

- In-app solution manager: preferred solutions, export/import managed solutions
- **Power Platform pipelines** for dev → test → prod promotion; environment variables +
  connection references for per-environment config
- Native Git integration; Azure DevOps/GitHub CI/CD
- Governance via Power Platform admin center: DLP policies, RBAC, Purview integration

Never edit prod agents in place — all changes travel as solutions.

## Pro-code extensibility

- **Call Copilot Studio from code:** Agent Framework's `agent-framework-copilotstudio`
  package provides `CopilotStudioAgent` (see `skills/agent-framework`); the M365 Agents SDK
  has on-behalf-of auth samples calling Copilot Studio agents.
- **Call Foundry from Copilot Studio:** connect an external **Microsoft Foundry agent** as
  a child agent (preview; new-Foundry-portal agents only).
- **Custom clients:** Direct Line API.

## Practices

- Start from the instruction + knowledge + tools triad; add explicit topics only where
  determinism is required.
- Give every tool a crisp description with *when to use it* — the orchestrator's plan
  quality tracks tool-description quality.
- Watch credit burn per conversation in analytics before and after each change; generative
  answers and graph grounding dominate cost.
- For maker/pro-code hybrids, define the boundary explicitly: Copilot Studio owns the
  conversation and governance; code-side agents (Foundry/Agent Framework) own deep logic,
  reached as child agents or MCP tools. See `skills/agent-interop`.
