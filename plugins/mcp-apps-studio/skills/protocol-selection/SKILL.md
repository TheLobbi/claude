---
name: protocol-selection
description: This skill should be used when choosing between MCP Apps, mcp-ui, the OpenAI Apps SDK, A2UI, and AG-UI for a given requirement — the decision tree, the axes that actually discriminate, valid combinations, anti-patterns, and how to keep a migration path open.
version: 1.0.0
trigger_phrases: [which protocol, mcp apps vs mcp-ui, a2ui vs mcp apps, ag-ui vs mcp apps, should i use apps sdk, agent ui protocol choice, generative ui options]
categories: [architecture, decision, ui]
author: mcp-apps-studio
created: 2026-08-13
updated: 2026-08-13
---

# Choosing a protocol

Five options, three genuinely different problems. Most bad choices come from
answering the wrong question.

## The three problems

1. **"A tool result should render as a widget inside someone else's chat host."**
   → MCP Apps family (MCP Apps, mcp-ui, OpenAI Apps SDK).
2. **"An agent should describe UI that my client renders with its own native
   components."** → A2UI.
3. **"My frontend needs to show what a long-running agent is doing, share state
   with it, and let the user interrupt."** → AG-UI.

If the answer is more than one, you need more than one. They compose cleanly.

## Decision tree

```
Do you own the frontend that renders the UI?
├─ NO — a chat host renders it (Claude, ChatGPT, M365 Copilot, Goose)
│  └─ Start with MCP Apps. Then:
│     ├─ Need externalUrl or remoteDom delivery, or a pre-MCP-Apps host?
│     │  └─ mcp-ui (it implements MCP Apps and keeps its own action protocol)
│     └─ Need ChatGPT-only capability — checkout, uploadFile, requestModal?
│        └─ MCP Apps + the OpenAI Apps SDK extensions on top
│
└─ YES — you own the client
   ├─ The client must render with its OWN native widgets
   │  (Flutter/SwiftUI/design-system React), or executing model-authored
   │  markup is unacceptable
   │  └─ A2UI
   └─ The agent is long-running and the UI must show progress, shared state,
      thinking steps, and support interrupts
      └─ AG-UI  (and render individual results with A2UI or your own components)
```

## The axes that discriminate

| Axis | MCP Apps | mcp-ui | Apps SDK | A2UI | AG-UI |
|---|---|---|---|---|---|
| Who renders | Chat host, sandboxed iframe | Chat host, sandboxed iframe | ChatGPT, sandboxed iframe | Your client, native widgets | Your frontend |
| UI is | HTML/JS you author | HTML/JS/URL/DOM script | HTML/JS you author | JSON data | Events → your components |
| Portability | High — any compliant host | High + legacy hosts | ChatGPT-first | Very high — any renderer | You own it |
| Design control | Total | Total | Total, within ChatGPT rules | The client's, not yours | Total |
| Injection surface | Sandboxed script | Sandboxed script | Sandboxed script | **None — data only** | None |
| Non-web surfaces | No | No | No | **Yes** | Depends on frontend |
| Streaming granularity | Tool input → result | Tool input → result | Tool input → result | Per component/data path | Per token/event |
| Long-running agents | Poor fit | Poor fit | Poor fit | Partial | **Purpose-built** |
| Human-in-the-loop | Via tool calls | Via actions | Via tool calls | Via actions | **First-class interrupts** |

## Valid combinations

- **MCP Apps + Apps SDK extensions** — the standard recommendation for anything
  shipping to ChatGPT. Portable core, ChatGPT-only affordances feature-detected.
- **MCP Apps + mcp-ui** — one server, both resource shapes, when you must reach
  hosts on either side of the extension's adoption.
- **AG-UI + A2UI** — AG-UI carries the event stream; A2UI payloads ride inside
  it as the UI description. This is the strongest fully-owned-frontend stack.
- **AG-UI + MCP Apps** — an MCP Apps View that opens an AG-UI stream for a
  long-running sub-task inside the widget.

## Anti-patterns

**Reaching for `window.openai` first.** It ties you to one host for capability
that MCP Apps already covers. Use the standard field; layer extensions only for
checkout, files, and modals.

**A2UI for a ChatGPT widget.** ChatGPT renders MCP Apps resources, not A2UI
surfaces. You would be writing a renderer nobody asked for.

**AG-UI to render a single tool result.** The event machinery buys you nothing
if the interaction is one request and one card. Use MCP Apps.

**MCP Apps for a 20-minute research agent.** You get one `tool-result` and no
vocabulary for progress, reasoning steps, or interrupts. Use AG-UI, or split:
AG-UI for the run, MCP Apps for the final artifact.

**`externalUrl` as the default.** It costs an origin in CSP, a network hop, and
an independent deploy to keep in sync. Take it when you genuinely have an
existing app; not to avoid learning the bundler.

**Attaching a UI resource to every tool.** See the decoupled data/render pattern
in `openai-apps-sdk`. This is the most common performance defect in shipped apps.

## Keeping the migration path open

Whatever you choose, these keep the exit cheap:

1. **Tools work without UI.** Always return real `content` and
   `structuredContent`. This is what lets the same server serve a text-only
   host, a different protocol, or an API consumer.
2. **Keep rendering logic in one module.** The bridge (`app.*` / `window.openai.*`
   / postMessage) should be behind a thin adapter, not sprayed through
   components. Porting then means rewriting one file.
3. **Feature-detect, never host-detect.** A host-name branch is a permanent fork.
4. **Version resource URIs.** `ui://x/v1.html` → `ui://x/v2.html` makes a
   protocol change a deploy, not a migration.

`/ui:port` automates the mechanical part of moving between protocols once these
hold.

## Quick answers

| Requirement | Choice |
|---|---|
| "Show a chart when my MCP tool returns data" | MCP Apps |
| "Ship an app in the ChatGPT directory" | MCP Apps + Apps SDK |
| "Add a widget to a Microsoft 365 Copilot declarative agent" | MCP Apps (check the Copilot matrix) |
| "Render agent UI in our Flutter app" | A2UI |
| "Our design system must own every pixel" | A2UI |
| "Show the agent's progress and let users approve steps" | AG-UI |
| "We already host the dashboard as a web app" | mcp-ui `externalUrl` |
| "The host should render it with its own components" | mcp-ui `remoteDom` or A2UI |
| "Model output must never become executable markup" | A2UI |

## Related

- `mcp-apps-protocol`, `mcp-ui-sdk`, `openai-apps-sdk`, `a2ui-protocol`,
  `ag-ui-protocol` — the specs behind each column.
- `host-capability-matrix` — what the target host actually implements.
