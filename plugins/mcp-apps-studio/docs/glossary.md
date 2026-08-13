# Glossary

Terms across the five agent-UI protocols. The **collisions** section at the end
is the part worth reading twice — several words mean different things depending
on which spec you are in.

## MCP Apps

**App** — the SDK class the View instantiates (`new App({ name, version })`).
Also, loosely, the whole thing: server + UI.

**App-only tool** — `_meta.ui.visibility: ["app"]`. Callable by the View,
hidden from the model. Context hygiene, **not** access control.

**Bridge** — the JSON-RPC 2.0 channel between View and host, carried on
`postMessage`.

**CSP metadata** — `_meta.ui.csp` on the resource *contents*, declaring
`connectDomains`, `resourceDomains`, `frameDomains`, `baseUriDomains`.
Deny-by-default.

**Data tool** — fetches, computes, or mutates. Returns `structuredContent`.
Carries **no** `resourceUri`.

**Display mode** — `inline`, `fullscreen`, or `pip`. Request with
`requestDisplayMode`; render from what was **granted**.

**Host** — the chat client (Claude, ChatGPT, M365 Copilot). Owns the iframe and
mediates every call.

**Host context** — theme, display mode, available modes, viewport, safe-area
insets, locale, user agent. From `ui/initialize`, refreshed by
`host-context-changed`.

**Render tool** — takes prepared data, returns the template. The **only** kind
that carries `_meta.ui.resourceUri`.

**`RESOURCE_MIME_TYPE`** — `text/html;profile=mcp-app`.

**Resource URI** — a `ui://…` string. Hosts treat it as a **cache key**: a
breaking UI change means publishing a new one.

**`structuredContent`** — the typed data a tool returns. The View renders it and
the model can inspect it. **Untrusted input.**

**View** — your HTML/JS running in the sandboxed iframe. Never talks to the
server directly; the host proxies everything.

## mcp-ui

**Action** — a `postMessage` from the iframe: `tool`, `prompt`, `link`,
`intent`, or `notify`.

**`createUIResource`** — the server-side factory taking `rawHtml`,
`externalUrl`, or `remoteDom` content.

**`externalUrl`** — the host iframes a URL you already serve. A `<base>` tag is
injected so relative paths resolve.

**`intent`** — names *what the user wants* and lets the host route it, rather
than naming a tool. Preferred when one UI ships to several hosts.

**`notify`** — the iframe already acted locally and is telling the host to run
side effects. Must not be load-bearing.

**`remoteDom`** — a DOM description the **host** renders with its own
components.

**Sandbox proxy** — the dedicated origin (`sandbox.url`) that isolates the
iframe. Never point it at your application origin.

## OpenAI Apps SDK

**Component** — the React bundle inlined into the resource HTML.

**Decoupled pattern** — data tools separate from render tools. Prevents remounts
and lets the model refine data before anything renders.

**`openai/outputTemplate`** — legacy alias for `_meta.ui.resourceUri`. Still
honored; new code uses the standard field.

**Skybridge** — `text/html+skybridge`, the legacy mimeType. Superseded by
`text/html;profile=mcp-app`.

**Widget state** — `window.openai.widgetState` / `setWidgetState`. Ephemeral,
scoped to one rendered instance. Not storage, not a source of truth.

**`window.openai`** — the ChatGPT extension surface. Use only for capability the
MCP Apps standard does not cover.

## A2UI

**Adjacency list** — the flat component representation. Parents reference
children by ID. What makes streaming and incremental patching work.

**Catalog** — the JSON Schema document defining the components and functions
**the client** implements. The agent may only reference what is in it.

**`catalogId`** — a unique string, conventionally a URI, **not required to
resolve**.

**`CheckRule`** — a renderer-side validation condition returning
`{ valid, code, message, severity }`. Invalid input never costs an agent turn.

**Data model** — the surface's data, addressed by JSON Pointer, strictly
separate from component structure.

**Local action** — `action.functionCall`. Handled by the renderer, no agent
round trip.

**Surface** — one UI region with its own ID, component set, and data model. Also
the name of the reserved root container component.

**Two-way binding** — input components update the local model immediately;
changes reach the agent only when an action dispatches.

## AG-UI

**`AbstractAgent`** — the TypeScript base class for a custom agent emitting
`Observable<BaseEvent>`.

**Chunk event** — the compact form (`TextMessageChunk`, `ToolCallChunk`).
Middleware synthesizes start/content/end. Never mix with the explicit triple for
one message.

**`RunAgentInput`** — the request: thread and run IDs, message history, available
tools, context, forwarded properties.

**`rawEvent`** — the original framework event, preserved when AG-UI is a
translation layer. The only way to debug a wrapped stream.

**State delta** — `StateDelta`, RFC 6902 JSON Patch. Paired with
`StateSnapshot`; handle both.

**Terminal event** — `RunFinished` or `RunError`. A stream without one leaves the
frontend spinning forever.

## Collisions

Words that mean different things depending on which spec you are in.

| Term | Here | And here |
|---|---|---|
| **Resource** | MCP Apps: the `ui://` UI document | MCP generally: any readable content |
| **App** | MCP Apps: the View SDK class | Apps SDK: the whole ChatGPT integration |
| **Surface** | A2UI: a UI region **and** the reserved root component | Elsewhere: a platform or entry point |
| **State** | MCP Apps: widget state — one instance, ephemeral | AG-UI: shared state, agent ⇄ frontend, event-sourced |
| **Action** | mcp-ui: a `postMessage` from the iframe | A2UI: `event` or `functionCall` on a component |
| **Tool** | MCP: a server capability the model invokes | mcp-ui: also an *action type* naming one |
| **Template** | Apps SDK: the UI resource | A2UI: an iterating component rendering a collection |
| **Intent** | mcp-ui: an action type the host routes | Elsewhere: what the user meant |
| **Catalog** | A2UI: the client's component schema | Elsewhere: a product listing |
| **Partial** | MCP Apps: healed, possibly truncated tool input | AG-UI: `ToolCallArgs` streaming incomplete JSON |

## Cross-protocol equivalents

| Concept | MCP Apps | Apps SDK | mcp-ui | A2UI | AG-UI |
|---|---|---|---|---|---|
| Deliver data to UI | `ui/notifications/tool-result` | `window.openai.toolOutput` | tool result / render data | `updateDataModel` | `StateSnapshot` / `StateDelta` |
| UI invokes server | `tools/call` | `window.openai.callTool` | `type:'tool'` action | `action.event` | frontend tool call |
| UI speaks to model | `ui/message` | `sendFollowUpMessage` | `type:'prompt'` action | `action.event` | `TextMessage*` |
| Model-visible context | `ui/update-model-context` | `setWidgetState.modelContent` | `type:'notify'` action | `sendDataModel` | shared state |
| Navigation | `ui/open-link` | `openExternal` | `type:'link'` action | `functionCall: openUrl` | frontend-handled |
| Size reporting | `ui/size-changed` | `notifyIntrinsicHeight` | frame-size metadata | renderer-native | frontend-handled |
