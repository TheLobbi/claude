---
name: ui-porting-migration
description: This skill should be used when migrating an agent UI between protocols or SDKs — OpenAI Apps SDK to portable MCP Apps, mcp-ui legacy actions to the ui/* bridge, MCP Apps to A2UI, adding AG-UI to an existing app, the adapter layer that makes ports cheap, and the field-by-field mapping tables.
version: 1.0.0
trigger_phrases: [migrate openai app, port to mcp apps, outputTemplate to resourceUri, mcp-ui to ext-apps, window.openai to app bridge, migrate a2ui v0.9, protocol migration ui]
categories: [migration, architecture, ui]
author: mcp-apps-studio
created: 2026-08-13
updated: 2026-08-13
---

# Porting between agent-UI protocols

Most ports are mechanical if the app was built with an adapter, and a rewrite if
it was not. Establish the adapter first, then port.

## The adapter layer

Every host interaction goes through one module. Components never touch
`window.openai`, `app.*`, or `postMessage` directly.

```ts
// bridge.ts — the only file that knows which protocol you are on
export interface HostBridge {
  onToolInput(cb: (input: unknown) => void): void;
  onToolResult(cb: (result: ToolResult) => void): void;
  callTool(name: string, args: unknown): Promise<ToolResult>;
  sendMessage(text: string): Promise<void>;
  updateModelContext(ctx: unknown): Promise<void>;
  openLink(url: string): Promise<void>;
  setSize(w: number, h: number): void;
  requestDisplayMode(mode: DisplayMode): Promise<DisplayMode>;
  getContext(): HostContext | undefined;
  capabilities(): Capabilities;
}
```

With this in place a port is: write a new `HostBridge` implementation, swap the
import, adjust the server registration. Without it, every component is a
migration site.

Building an app that must reach two protocols at once? Implement both and select
at init by probing (`app.getHostCapabilities()`, then `window.openai`, then
mcp-ui `postMessage` liveness).

## 1. OpenAI Apps SDK → portable MCP Apps

The most common port, and the cheapest — ChatGPT already implements MCP Apps, so
this is de-risking, not rewriting.

### Server

| From | To |
|---|---|
| `_meta["openai/outputTemplate"]` | `_meta.ui.resourceUri` |
| `_meta["openai/widgetCSP"]` | `_meta.ui.csp` |
| `_meta["openai/widgetPrefersBorder"]` | `_meta.ui.prefersBorder` |
| `_meta["openai/widgetDomain"]` | `_meta.ui.domain` |
| `_meta["openai/visibility"]` | `_meta.ui.visibility` |
| `_meta["openai/widgetAccessible"]` | `_meta.ui.visibility: ["model","app"]` |
| `connect_domains` / `resource_domains` / `frame_domains` | `connectDomains` / `resourceDomains` / `frameDomains` |
| `text/html+skybridge` | `text/html;profile=mcp-app` (`RESOURCE_MIME_TYPE`) |

Keep the `openai/*` aliases alongside the standard fields during rollout —
ChatGPT honors both, and dual-writing means no flag day.

### View

| From | To |
|---|---|
| `window.openai.toolInput` | `app.ontoolinput` |
| `window.openai.toolOutput` | `app.ontoolresult` |
| `window.openai.toolResponseMetadata` | `app.ontoolresult` → `params._meta` |
| `window.openai.callTool(name, args)` | `app.callServerTool({ name, arguments })` |
| `window.openai.sendFollowUpMessage({ prompt })` | `app.sendMessage({ … })` |
| `window.openai.requestDisplayMode(…)` | `app.requestDisplayMode({ mode })` |
| `window.openai.notifyIntrinsicHeight(…)` | `app.sendSizeChanged({ width, height })` |
| `window.openai.openExternal({ href })` | `app.openLink({ url })` |
| `window.openai.theme` | `app.getHostContext()?.theme` |
| `window.openai.displayMode` | `app.getHostContext()?.displayMode` |
| `window.openai.maxHeight` | `app.getHostContext()?.viewport?.maxHeight` |
| `window.openai.safeArea` | `app.getHostContext()?.safeAreaInsets` |
| `window.openai.locale` | `app.getHostContext()?.locale` |
| `window.openai.userAgent` | `app.getHostContext()?.userAgent` |

**No standard equivalent — keep these feature-detected:**
`requestCheckout`, `uploadFile`, `selectFiles`, `getFileDownloadUrl`,
`requestModal`, `widgetState` / `setWidgetState`.

For `setWidgetState`, the portable substitute is `app.updateModelContext()` for
the model-visible slice. There is no portable durable-state mechanism — that
slice moves to your server.

### Order of operations

1. Introduce the adapter; components stop touching `window.openai`.
2. Dual-write server `_meta` (standard + aliases).
3. Swap the View to the `App` class, keeping `window.openai` fallbacks for the
   six extension APIs.
4. Verify in ChatGPT (nothing should change) **and** in basic-host (it should
   now work at all).
5. Drop the aliases once no host you support needs them.

## 2. mcp-ui legacy actions → the `ui/*` bridge

| From (mcp-ui) | To (MCP Apps) |
|---|---|
| `postMessage({type:'tool', payload:{toolName, params}})` | `app.callServerTool({ name, arguments })` |
| `postMessage({type:'prompt', payload:{prompt}})` | `app.sendMessage({ … })` |
| `postMessage({type:'link', payload:{url}})` | `app.openLink({ url })` |
| `postMessage({type:'intent', payload:{intent, params}})` | No direct equivalent — map to a tool call, or keep on hosts that support it |
| `postMessage({type:'notify', payload:{message}})` | `app.updateModelContext(…)` or an app-only tool |
| `ui-lifecycle-iframe-ready` | `app.connect()` / `ui/initialize` |
| `ui-lifecycle-iframe-render-data` | `ui/notifications/tool-input` + host context |
| `ui-message-received` / `ui-message-response` | JSON-RPC response to `tools/call` |

`intent` is the one real loss. Its value was letting the host route a
user-expressed intent without the View knowing the tool name. Replacements, in
order of preference: a generic server-side `handle_intent` tool; or keep the
`intent` post as a fallback branch for mcp-ui hosts.

`externalUrl` and `remoteDom` have **no MCP Apps equivalent**. An `externalUrl`
resource ports by inlining the app or serving it as the resource HTML (and
declaring its origins in CSP). A `remoteDom` resource is a genuine rewrite —
consider A2UI instead, which is what `remoteDom` was reaching toward.

## 3. MCP Apps → A2UI

Not a port. A reimplementation, because the model inverts: you stop shipping
markup and start describing components the client owns.

What survives:
- The tool/data layer, essentially unchanged.
- `structuredContent` becomes the A2UI **data model** (JSON Pointer paths).
- Your server logic and authorization.

What is rewritten:
- HTML/CSS/JS → a component **catalog** plus `updateComponents` messages.
- Event handlers → `action.event` (agent round trip) or `action.functionCall`
  (local).
- Client-side validation → `CheckRule` objects.
- Styling → deleted. A2UI v1.0 defers all visuals to the renderer's theme.

Do this when the client must render natively (Flutter, SwiftUI), when a design
system must own every pixel, or when executing model-influenced markup is
unacceptable.

### A2UI v0.9 → v1.0

- Function calls are now bidirectional and explicit (`callRendererFunction` /
  `callAgentFunction`), verified against catalog definitions.
- `createSurface` may carry `components` and `dataModel` in one message.
- **Theme properties removed** — strip every hardcoded color; move design intent
  into the catalog's `instructions` field.
- Catalog `functions` become object maps with `$schema` / `$id`.
- Identifiers must satisfy UAX #31; `@` is reserved.

## 4. Adding AG-UI to an existing app

Additive, not a replacement. Keep MCP Apps for the final artifact and add AG-UI
for the run.

1. Wrap the agent so it emits `RunStarted` → content events → `RunFinished`/`RunError`.
2. Map existing progress logs to `StepStarted`/`StepFinished` and `Activity*`.
3. Emit `StateSnapshot` on connect, `StateDelta` (RFC 6902) thereafter.
4. Point CopilotKit or your own subscriber at the endpoint.
5. Keep the MCP tools intact — the widget still renders the result.

Preserve `rawEvent` while wrapping. It is the only way to debug a translated
stream.

## Port checklist

- [ ] Adapter layer in place; no component touches a host API directly
- [ ] Field mapping applied server-side; aliases dual-written during rollout
- [ ] Every non-portable API feature-detected with a working fallback
- [ ] Resource URI bumped if the UI changed in a breaking way
- [ ] Text-only path (`content`) still completes the workflow
- [ ] Verified on the origin host (no regression) **and** the new host (works)
- [ ] CSP re-derived — origins often change with delivery mode
- [ ] Old aliases removed only after every supported host is confirmed

Run `/ui:port --from <protocol> --to <protocol>` to apply the mechanical parts
and produce a report of what needs human judgment.

## Related

- `protocol-selection` — whether the port is the right move at all.
- `host-capability-matrix` — what the destination host supports.
- `openai-apps-sdk`, `mcp-apps-protocol`, `a2ui-protocol`, `ag-ui-protocol`.
