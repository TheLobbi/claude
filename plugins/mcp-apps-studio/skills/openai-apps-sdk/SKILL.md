---
name: openai-apps-sdk
description: This skill should be used when building ChatGPT apps with the OpenAI Apps SDK — the window.openai bridge, openai/* _meta fields and their MCP Apps equivalents, widget state, display modes, the decoupled data/render tool pattern, checkout, file handling, and the esbuild component bundle.
version: 1.0.0
trigger_phrases: [openai apps sdk, window.openai, openai/outputTemplate, setWidgetState, requestDisplayMode, requestCheckout, sendFollowUpMessage, chatgpt app, skybridge, pizzaz]
categories: [sdk, openai, ui, reference]
author: mcp-apps-studio
created: 2026-08-13
updated: 2026-08-13
---

# OpenAI Apps SDK

ChatGPT implements MCP Apps. The Apps SDK is **MCP Apps plus ChatGPT-only
extensions**. Build on the standard first; reach for `window.openai` only for
capabilities the standard does not cover.

## Prefer the shared field, every time

| Goal | MCP Apps standard (use this) | ChatGPT alias (legacy) |
|---|---|---|
| Link tool → UI resource | `_meta.ui.resourceUri` | `_meta["openai/outputTemplate"]` |
| Receive tool input | `ui/initialize` + `ui/notifications/tool-input` | `window.openai.toolInput` |
| Receive tool result | `ui/notifications/tool-result` | `window.openai.toolOutput` |
| Call a tool from the UI | `tools/call` | `window.openai.callTool` |
| Send a follow-up message | `ui/message` | `window.openai.sendFollowUpMessage` |
| Update model-visible context | `ui/update-model-context` | *(no alias — use the standard)* |

The aliases still work for existing integrations. New code uses the middle
column, which also runs in Claude and M365 Copilot unchanged.

## ChatGPT-only extensions

These have no MCP Apps equivalent. They are the *only* legitimate reason to
touch `window.openai`.

| API | Purpose |
|---|---|
| `requestCheckout(session)` | Embedded ChatGPT payment sheet (private beta). |
| `uploadFile(file)` | User file upload. |
| `selectFiles()` | Prompt the user to pick files. |
| `getFileDownloadUrl({ fileId })` | Resolve a file ID to a URL. |
| `requestModal(opts)` | Host-controlled modal. |
| `widgetState` / `setWidgetState(state)` | Widget-scoped ephemeral persistence. |

### Feature-detect, never host-detect

```ts
const openai = typeof window !== "undefined" ? window.openai : undefined;

if (openai?.requestModal) {
  await openai.requestModal({ /* … */ });
} else {
  // Inline fallback that works everywhere.
}
```

Branching on host name (`if (isChatGPT)`) breaks the moment another host adds
the capability, or ChatGPT ships it to a subset of surfaces. Test for the
capability you need.

## Tool descriptor `_meta`

```ts
_meta: {
  ui: { resourceUri: TEMPLATE_URI },              // portable
  "openai/toolInvocation/invoking": "Rolling…",   // ChatGPT status text
  "openai/toolInvocation/invoked": "Rolled.",
  "openai/widgetAccessible": true,                // UI may call this tool
  "openai/visibility": ["model", "app"],
  "openai/fileParams": ["attachment"],            // params that accept file IDs
}
```

## Resource `_meta`

```ts
_meta: {
  ui: {
    prefersBorder: true,
    domain: "https://example.com",
    csp: {
      connectDomains: ["https://api.example.com"],
      resourceDomains: ["https://static.example.com"],
      frameDomains: [],                            // nested frames blocked by default
    },
  },
  "openai/widgetDescription": "Shows the project board.",
}
```

## The decoupled data/render pattern

This is the single highest-leverage design decision in an Apps SDK server.

**Problem:** attach a template to every tool and ChatGPT re-renders (and
remounts) the iframe on every call, destroying local state and burning latency.

**Solution:** split the tools.

- **Data tools** — fetch/compute/mutate. Return `structuredContent` only.
  **No `resourceUri`.**
- **Render tools** — take already-prepared data and return the template.
  **Only these carry `_meta.ui.resourceUri`.**

```ts
const TEMPLATE_URI = "ui://widget/dice.html";

// 1) Data tool — chainable, no template.
server.registerTool("roll_dice", {
  title: "Roll dice",
  description: "Roll an N-sided die and return { sides, value }.",
  inputSchema: { sides: z.number().int().min(2) },
  outputSchema: { sides: z.number().int().min(2), value: z.number().int().min(1) },
  _meta: {
    "openai/toolInvocation/invoking": "Rolling…",
    "openai/toolInvocation/invoked": "Rolled.",
  },
}, async ({ sides }) => {
  const value = 1 + Math.floor(Math.random() * sides);
  return {
    structuredContent: { sides, value },
    content: [{ type: "text", text: `Rolled ${value} on ${sides} sides.` }],
  };
});

// 2) Render tool — owns the template, depends on the data tool.
server.registerTool("render_dice_widget", {
  title: "Render dice widget",
  description:
    "Render the dice widget from roll data. First call roll_dice, then pass its sides and value here.",
  inputSchema: { sides: z.number().int().min(2), value: z.number().int().min(1) },
  _meta: { ui: { resourceUri: TEMPLATE_URI } },
}, async ({ sides, value }) => ({
  structuredContent: { sides, value },
  content: [{ type: "text", text: `Showing a ${sides}-sided roll: ${value}.` }],
}));
```

Call flow: model calls `roll_dice` → inspects `structuredContent` → refines →
calls `render_dice_widget` → widget renders once with model-checked data.

The payoff is more than performance. When the user asks a follow-up the server
cannot express as a filter ("which of these are in the Richmond school zone?"),
the model narrows the candidate set itself and renders only the survivors.

Rules:
- State the dependency in the render tool's description explicitly.
- Keep data tools reusable — return complete `structuredContent` for chaining.
- No business logic in render handlers.
- Let the View call data tools directly for local interactions ("Re-roll") so
  the widget never remounts.

## Widget state

```tsx
const [state, setState] = useState(
  window.openai?.widgetState ?? { selectedId: null },
);

function select(selectedId: string) {
  const next = { ...state, selectedId };
  setState(next);
  window.openai?.setWidgetState?.(next);   // synchronous — nothing to await
}
```

Structured form, when images must reach the model:

```ts
window.openai.setWidgetState({
  modelContent: "Review the currently selected images.",   // model sees this
  privateContent: { currentView: "image-viewer" },         // model does not
  imageIds: ["file_123", "file_456"],                      // model receives these
});
```

`imageIds` may only contain IDs from `uploadFile`, `selectFiles`, tool input
file params, or tool result file references.

Widget state is **not** durable storage and **not** a source of truth. It
belongs to one rendered instance. `localStorage` is likewise unreliable — the
iframe is isolated and gives you no cross-device or cross-session guarantee.

## Display modes

| Mode | Use for | Constraints |
|---|---|---|
| Inline card | One focused result, confirmation, ≤2 primary actions | No deep nav, no nested scroll |
| Inline carousel | Scanning similar visual options | 3–8 items; ≤3 lines of metadata each |
| Fullscreen | Maps, editing canvases, deep browsing | Composer stays overlaid — design around it |
| Picture-in-picture | Live sessions, games, video | Minimal controls; auto-closes with the session |

Start inline. Request more space only when the workflow demands it.

```ts
if (window.openai?.requestDisplayMode) {
  await window.openai.requestDisplayMode({ mode: "fullscreen" });
}
```

## Bundling and embedding

```json
{ "scripts": { "build": "esbuild src/component.tsx --bundle --format=esm --outfile=dist/component.js" } }
```

```ts
const component = readFileSync("web/dist/component.js", "utf8");

registerAppResource(server, "project-board", "ui://project-board/v1.html", {}, async () => ({
  contents: [{
    uri: "ui://project-board/v1.html",
    mimeType: RESOURCE_MIME_TYPE,                       // text/html;profile=mcp-app
    text: `<div id="root"></div><script type="module">${component}</script>`,
    _meta: { ui: { prefersBorder: true, csp: { connectDomains: ["https://api.example.com"] } } },
  }],
}));
```

Suggested layout — keep component code out of the server:

```
plugin-ui/
  server/                 # MCP server (Node or Python)
  web/
    src/component.tsx
    dist/component.js     # build output, inlined by the server
```

The optional `@openai/apps-sdk-ui` component library provides buttons, cards,
inputs, and layout primitives that match ChatGPT's container.

## Localization

The host mirrors locale to `document.documentElement.lang`.

```tsx
const locale = document.documentElement.lang || "en-US";
<IntlProvider locale={locale} messages={messages[locale]}>…</IntlProvider>
```

## Checkout

External checkout (link to your own domain) is the generally available path and
the default recommendation. Approval is currently limited to physical goods.

The embedded payment sheet (`requestCheckout`) is private beta. Its session must
carry a unique session ID, line items and quantities, totals in **integer minor
currency units**, payment-provider and merchant metadata, and legal/privacy/
refund/support links. Use `payment_mode: "test"` while developing.

The server is the source of truth: verify the payment token, make
`complete_checkout` idempotent, persist the order, return an authoritative
receipt. Never trust a total computed in the component.

## Related

- `mcp-apps-protocol` — the standard underneath all of this.
- `host-capability-matrix` — what M365 Copilot does and does not support.
- `widget-ux-patterns` — the full design guidelines.
- `ui-state-architecture` — where each kind of state belongs.
