---
name: mcp-ui-sdk
description: This skill should be used when working with mcp-ui — createUIResource and its rawHtml/externalUrl/remoteDom content types, the five UI action types (tool, prompt, link, intent, notify), the messageId async response flow, iframe lifecycle events, and the client-side UIResourceRenderer/AppRenderer components.
version: 1.0.0
trigger_phrases: [mcp-ui, mcpui, createUIResource, UIResourceRenderer, AppRenderer, onUIAction, rawHtml, externalUrl, remoteDom, ui-lifecycle-iframe-ready, ui-message-response]
categories: [sdk, mcp, ui, reference]
author: mcp-apps-studio
created: 2026-08-13
updated: 2026-08-13
---

# mcp-ui

mcp-ui pioneered interactive UI over MCP before the MCP Apps extension existed.
It now implements MCP Apps *and* keeps its original action protocol, which is
what many deployed hosts (Goose, Postman, internal tools) still speak.

Two reasons to choose mcp-ui over plain `ext-apps`:

1. **Delivery modes `ext-apps` does not have** — `externalUrl` (point at a live
   app you already host) and `remoteDom` (stream a DOM description the client
   renders with its own components).
2. **Host reach** — a host that predates the MCP Apps extension will accept
   mcp-ui resources and its `type:'tool'`-style actions.

Packages: `@mcp-ui/server`, `@mcp-ui/client`. Ruby: `mcp_ui_server`.

## Server: `createUIResource`

```ts
import { createUIResource } from "@mcp-ui/server";

// 1. rawHtml — a complete HTML string, inlined into the resource
const inline = createUIResource({
  uri: "ui://my-server/widget",
  content: { type: "rawHtml", htmlString: "<h1>Widget</h1>" },
  encoding: "text",                       // or "blob" for base64
});

// 2. externalUrl — the host iframes a URL you already serve.
//    A <base> tag is injected so relative paths resolve.
const external = createUIResource({
  uri: "ui://analytics/dashboard",
  content: { type: "externalUrl", iframeUrl: "https://my.analytics.com/dashboard/123" },
  encoding: "text",
});

// 3. remoteDom — a script describing DOM the client builds with ITS components
const remote = createUIResource({
  uri: "ui://catalog/list",
  content: { type: "remoteDom", script: remoteDomScript, framework: "react" },
  encoding: "text",
});
```

Ruby:

```ruby
resource = McpUiServer.create_ui_resource(
  uri: 'ui://my-tool/dashboard',
  content: { type: :raw_html, htmlString: '<h1>Dashboard</h1>' },
  encoding: :text
)
```

### Which content type

| Type | Rendered as | Choose when |
|---|---|---|
| `rawHtml` | Sandboxed iframe with `srcdoc` | Self-contained widget. The default. |
| `externalUrl` | Sandboxed iframe with `src` | You already host a web app; you want independent deploys. Costs you an extra origin in CSP and a network hop. |
| `remoteDom` | Host's own component library | The host should own the look. Maximum visual consistency, least control. |

### Optional metadata

```ts
createUIResource({
  uri: "ui://x/y",
  content: { /* … */ },
  encoding: "text",
  metadata: { title, description, author, preferredRenderContext },
  uiMetadata: {
    "preferred-frame-size": ["600px", "400px"],
    "initial-render-data": { theme: "dark" },
  },
  embeddedResourceProps: { annotations: { audience: ["user"], priority: 0.9 } },
});
```

## The five UI actions

Posted by the iframe to its parent. This is mcp-ui's own protocol, distinct
from (and usable alongside) the MCP Apps `ui/*` JSON-RPC bridge.

```js
// tool — ask the host to run a named tool
window.parent.postMessage({
  type: "tool",
  payload: { toolName: "get-weather", params: { city: "Tokyo" } },
}, "*");

// prompt — ask the host to run a model prompt
window.parent.postMessage({
  type: "prompt",
  payload: { prompt: "What is the weather in Tokyo?" },
}, "*");

// link — ask the host to navigate
window.parent.postMessage({
  type: "link",
  payload: { url: "https://www.google.com" },
}, "*");

// intent — the user expressed an intent; the host decides how to fulfil it
window.parent.postMessage({
  type: "intent",
  payload: { intent: "create-task", params: { title: "Buy groceries" } },
}, "*");

// notify — the iframe already acted; tell the host to run side effects
window.parent.postMessage({
  type: "notify",
  payload: { message: "cart-updated" },
}, "*");
```

`intent` vs `tool`: `tool` names the exact tool and binds you to the server's
API. `intent` names *what the user wants* and lets the host route it. Prefer
`intent` when the same UI ships against multiple hosts.

`notify` vs `tool`: `notify` is fire-and-forget after the iframe already did the
work locally. It must not be load-bearing.

## Async responses

Attach a `messageId` and the host will answer.

```js
// iframe → host
window.parent.postMessage({
  type: "ui-request-data",
  messageId: "123",
  payload: { requestType: "get-payment-methods", params: {} },
}, "*");
```

```js
// host → iframe: acknowledgement
iframe.contentWindow.postMessage({ type: "ui-message-received", messageId: "123" }, "*");

// host → iframe: result
iframe.contentWindow.postMessage({
  type: "ui-message-response",
  messageId: "123",
  payload: { response: { /* data */ }, error: null },
}, "*");
```

Always check `payload.error` before `payload.response`. A `ui-message-received`
without a following `ui-message-response` means the host accepted the request
and then failed — time out and degrade.

## Iframe lifecycle

```js
// iframe announces readiness
window.parent.postMessage({ type: "ui-lifecycle-iframe-ready" }, "*");

// host pushes render data
iframe.contentWindow.postMessage({
  type: "ui-lifecycle-iframe-render-data",
  payload: { renderData: { theme: "dark" } },
}, "*");

// iframe can also pull it
window.parent.postMessage({ type: "ui-request-render-data", messageId: "render-data-123" }, "*");
```

Send `ui-lifecycle-iframe-ready` as early as possible — before hydration, not
after — or the host's render data races your listener.

## Client rendering

```tsx
import { AppRenderer } from "@mcp-ui/client";

<AppRenderer
  client={mcpClient}
  toolName={toolName}
  toolInput={toolInput}
  toolResult={toolResult}
  sandbox={{ url: new URL("http://localhost:8765/sandbox_proxy.html") }}
  onOpenLink={async ({ url }) => {
    if (url.startsWith("https://") || url.startsWith("http://")) window.open(url);
  }}
  onMessage={async (params) => {
    console.log("Message from UI:", params);
    return { isError: false };
  }}
/>
```

For the legacy action protocol, `UIResourceRenderer` with `onUIAction`:

```tsx
<UIResourceRenderer
  resource={resource}
  onUIAction={async (action) => {
    switch (action.type) {
      case "tool":   return callTool(action.payload.toolName, action.payload.params);
      case "prompt": return sendPrompt(action.payload.prompt);
      case "link":   return openLink(action.payload.url);
      case "intent": return routeIntent(action.payload.intent, action.payload.params);
      case "notify": return handleNotification(action.payload.message);
    }
  }}
/>
```

The `sandbox` proxy origin matters: it is what isolates the iframe from your
host's origin. Never point it at your own origin to "make things work" — that
hands untrusted markup your cookies.

## Interop with MCP Apps

The same server can serve both. Use `RESOURCE_MIME_TYPE`
(`text/html;profile=mcp-app`) and `_meta.ui.resourceUri` for MCP Apps hosts,
and mcp-ui's `createUIResource` output for hosts that expect it. The
`@mcp-ui/server` helpers compose with `registerAppTool`/`registerAppResource`
from `@modelcontextprotocol/ext-apps/server`.

When targeting both, write the View against the MCP Apps bridge and add the
mcp-ui action posts as a fallback when `app.getHostCapabilities()` comes back
empty.

## Related

- `mcp-apps-protocol` — the standard mcp-ui now implements.
- `protocol-selection` — mcp-ui vs ext-apps vs Apps SDK decision matrix.
- `ui-security-sandbox` — why the sandbox proxy origin matters.
