---
name: mcp-apps-protocol
description: This skill should be used when implementing or debugging the MCP Apps extension — ui:// resource URIs, the text/html;profile=mcp-app mimeType, every _meta.ui field, the full ui/* JSON-RPC bridge over postMessage, tool visibility, host context, display modes, and the five lifecycle phases.
version: 1.0.0
trigger_phrases: [mcp apps, ui:// resource, resourceUri, _meta.ui, ui/initialize, ui/notifications/tool-result, ui/update-model-context, mcp-app mimeType, app bridge, sandboxed iframe widget]
categories: [protocol, mcp, ui, reference]
author: mcp-apps-studio
created: 2026-08-13
updated: 2026-08-13
---

# MCP Apps — the extension specification

MCP Apps lets an MCP server ship an interactive UI alongside its tools. The UI
renders in a sandboxed iframe inside the host (Claude, ChatGPT, M365 Copilot)
and talks to the host over JSON-RPC 2.0 carried on `postMessage`.

Three entities, always:

- **Server** — registers the tool and the UI resource.
- **Host** — the chat client. Owns the iframe, mediates every call.
- **View** (also called the App) — your HTML/JS running inside the iframe.

The View never talks to the server directly. Every server call is proxied by
the host, which is what makes the security model auditable.

## 1. The two registrations

A working MCP App is always exactly two registrations tied by one URI.

### The resource

```
uri:      ui://<anything>/<anything>      e.g. ui://weather/forecast.html
mimeType: text/html;profile=mcp-app       (exported as RESOURCE_MIME_TYPE)
text:     the complete HTML document
```

The `ui://` scheme is the signal to the host that this resource is renderable
UI rather than model-readable content. The path after the scheme is arbitrary —
organize it however you like, but see *Versioning* below.

### The tool

```json
{
  "name": "render_forecast",
  "title": "Render forecast",
  "description": "…",
  "inputSchema": { "…": "…" },
  "_meta": { "ui": { "resourceUri": "ui://weather/forecast.html" } }
}
```

When the host calls a tool carrying `_meta.ui.resourceUri`, it fetches that
resource, mounts the iframe, and pushes the tool result into it.

## 2. Every `_meta.ui` field

`_meta.ui` appears in two places with different valid keys. Putting a resource
field on a tool (or vice versa) silently does nothing — this is the single most
common wiring bug.

### On the **tool** descriptor

| Field | Type | Meaning |
|---|---|---|
| `resourceUri` | `string` | The `ui://` resource to render for this tool. |
| `visibility` | `string[]` | Who may call this tool. `["model","app"]` (default), `["app"]` (UI-only, hidden from the model), `["model"]` (never callable from the View). |

### On the **resource contents**

| Field | Type | Meaning |
|---|---|---|
| `csp.connectDomains` | `string[]` | Origins the View may `fetch`/WebSocket to. |
| `csp.resourceDomains` | `string[]` | Origins for scripts, styles, images, fonts. |
| `csp.frameDomains` | `string[]` | Origins the View may nest in a child iframe. Blocked by default. |
| `csp.baseUriDomains` | `string[]` | Allowed `<base href>` origins. |
| `permissions` | `object` | Host-mediated capability requests (camera, clipboard, …). |
| `prefersBorder` | `boolean` | Ask the host to draw a container border. |
| `domain` | `string` | The origin the View is served as, for APIs that allowlist by `Origin`. |

CSP goes in the **resource contents `_meta`**, not in the third `config`
argument of `registerAppResource`. Getting this wrong produces a View that
loads but whose every network call is blocked with no obvious error.

### App-only tools

`visibility: ["app"]` is the mechanism for UI-driven side effects that should
not pollute the model's tool list or context — cart mutations, pagination,
polling, chunked file transfer. Use it liberally; a View that calls a
model-visible tool on every keystroke will wreck the conversation.

## 3. The bridge — every method

JSON-RPC 2.0 messages on `window.parent.postMessage(msg, "*")`, responses
delivered back on the View's `message` event. Ignore any message whose
`event.source !== window.parent` and whose `jsonrpc !== "2.0"`.

### View → Host (requests)

| Method | Params | Returns |
|---|---|---|
| `ui/initialize` | app name/version, supported capabilities | host context (see below) |
| `tools/call` | `{ name, arguments }` | the full `CallToolResult` |
| `resources/read` | `{ uri }` | the resource contents |
| `ui/message` | `{ … }` message to inject into the conversation | ack |
| `ui/update-model-context` | structured context the model should now see | ack |
| `ui/size-changed` | `{ width, height }` | ack |
| `ui/open-link` | `{ url }` | ack — the *host* navigates, not the View |
| `ui/request-display-mode` | `{ mode }` | granted mode (may differ from requested) |

### Host → View (notifications)

| Method | Params |
|---|---|
| `ui/notifications/tool-input` | the arguments the tool was called with |
| `ui/notifications/tool-input-partial` | streaming, JSON-healed partial arguments |
| `ui/notifications/tool-result` | `{ content, structuredContent, _meta }` |
| `ui/notifications/initialized` | handshake complete |
| `ui/notifications/tool-cancelled` | the in-flight call was aborted |
| `ui/notifications/teardown` | unmount imminent — flush and clean up |
| `ui/notifications/host-context-changed` | theme, display mode, or viewport changed |

`tool-input` arrives **before** `tool-result`. Render a skeleton from the input,
then fill it from the result — that is the whole latency story for an MCP App.

### Host context

Returned from `ui/initialize` and refreshed by `host-context-changed`:

```ts
{
  theme: "light" | "dark",
  displayMode: "inline" | "fullscreen" | "pip",
  availableDisplayModes: string[],
  viewport: { maxHeight: number, … },
  safeAreaInsets: { top, right, bottom, left },
  locale: string,          // also mirrored to document.documentElement.lang
  userAgent: string,
  toolInfo: { name, … }
}
```

Read it, do not assume it. `availableDisplayModes` is the only honest answer to
"can I go fullscreen here".

## 4. Lifecycle

```
Discovery      host lists tools, reads _meta.ui, learns which tools render UI
     ↓
Initialization host mounts iframe → View sends ui/initialize → host replies
               with host context → host sends ui/notifications/initialized
     ↓
Data delivery  ui/notifications/tool-input  (args)
               ui/notifications/tool-result (content + structuredContent)
     ↓
Interactive    View ⇄ host: tools/call, ui/message, ui/update-model-context,
               ui/size-changed, ui/open-link, ui/request-display-mode
     ↓
Teardown       ui/notifications/teardown → View flushes state → host unmounts
```

**Register every handler before calling `connect()`.** Handlers attached after
the handshake miss the first `tool-result`, which is the one that matters.

## 5. Security model

- The View runs in a sandboxed iframe: no access to host DOM, cookies, or storage.
- `postMessage` is the only channel, so every capability is enumerable.
- CSP is deny-by-default. Anything you did not declare in `csp` is blocked.
- Nested frames are blocked unless `frameDomains` says otherwise.
- `structuredContent` is **untrusted**. It came from a server, through a model,
  into your DOM. Render it as text; never `innerHTML`, never `eval`.
- `ui/open-link` exists so the host — not your iframe — decides navigation.
  Never `window.open` or set `top.location`.

## 6. Versioning and caching

Hosts treat the resource URI as a cache key. A user with a live conversation may
hold an old View indefinitely.

- Breaking change to HTML/JS/CSS ⇒ **publish a new `ui://` URI** and repoint
  every tool that references it.
- Non-breaking change ⇒ same URI is fine.
- Never mutate the semantics of an existing URI in place.

## 7. Graceful degradation

Not every host renders MCP Apps. Every tool must return real `content` (text)
and `structuredContent` in addition to triggering UI, so that:

- a text-only host still completes the workflow, and
- the model can still reason about what happened.

A tool whose only useful output is the rendered pixels is a broken tool.

## Related

- `mcp-apps-sdk` — the `@modelcontextprotocol/ext-apps` API surface.
- `host-capability-matrix` — which of the above each host actually implements.
- `ui-security-sandbox` — CSP authoring and threat model.
- `openai-apps-sdk` — the ChatGPT extensions layered on this bridge.
