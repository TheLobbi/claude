---
name: host-capability-matrix
description: This skill should be used when deciding which MCP Apps or window.openai APIs are safe to depend on for a given host — the verified M365 Copilot support matrix for the component bridge, tool descriptor _meta, annotations, resource _meta, CSP properties, and client _meta, plus the feature-detection patterns that keep a widget portable.
version: 1.0.0
trigger_phrases: [host capability, supported in copilot, does chatgpt support, feature detection widget, window.openai undefined, getHostCapabilities, availableDisplayModes, portable widget]
categories: [compatibility, reference, mcp, ui]
author: mcp-apps-studio
created: 2026-08-13
updated: 2026-08-13
---

# Host capability matrix

Every host implements a subset. An API that exists in ChatGPT may be `undefined`
in M365 Copilot and absent in a custom host. **Unsupported APIs are `undefined`,
not throwing** — so a missing guard produces a silent dead button, not an error
you will notice in testing.

The tables below are the published Microsoft 365 Copilot support matrix, which
is the most complete public statement of any host's coverage. Treat ChatGPT as
full support for the `window.openai` column (it defines it) and Claude as full
support for the MCP Apps column. Verify at runtime regardless.

## Component bridge

| OpenAI Apps SDK | MCP Apps equivalent | M365 Copilot |
|---|---|---|
| `window.openai.toolInput` | `app.ontoolinput` | ✅ |
| `window.openai.toolOutput` | `app.ontoolresult` | ✅ |
| `window.openai.toolResponseMetadata` | `app.ontoolresult` → `params._meta` | ✅ |
| `window.openai.widgetState` | — | ✅ |
| `window.openai.setWidgetState(state)` | no direct equivalent; use `app.updateModelContext()` | ✅ |
| `window.openai.callTool(name, args)` | `app.callServerTool({ name, arguments })` | ✅ |
| `window.openai.sendFollowUpMessage({ prompt })` | `app.sendMessage({ … })` | ✅ |
| `window.openai.uploadFile(file)` | — | ❌ |
| `window.openai.getFileDownloadUrl({ fileId })` | — | ❌ |
| `window.openai.requestDisplayMode(…)` | `app.requestDisplayMode({ mode })` | ✅ **fullscreen only** |
| `window.openai.requestModal(…)` | — | ❌ |
| `window.openai.notifyIntrinsicHeight(…)` | `app.sendSizeChanged({ width, height })` | ✅ |
| `window.openai.openExternal({ href })` | `app.openLink({ url })` | ✅ |
| `window.openai.setOpenInAppUrl({ href })` | — | ✅ |
| `window.openai.theme` | `app.getHostContext()?.theme` | ✅ |
| `window.openai.displayMode` | `app.getHostContext()?.displayMode` | ✅ |
| `window.openai.maxHeight` | `app.getHostContext()?.viewport?.maxHeight` | ✅ |
| `window.openai.safeArea` | `app.getHostContext()?.safeAreaInsets` | ✅ |
| `window.openai.view` | — | ✅ |
| `window.openai.userAgent` | `app.getHostContext()?.userAgent` | ✅ |
| `window.openai.locale` | `app.getHostContext()?.locale` | ✅ |
| — | `app.ontoolinputpartial` | ❌ |
| — | `app.ontoolcancelled` | ❌ |
| — | `app.getHostContext()?.availableDisplayModes` | ❌ |
| — | `app.getHostContext()?.toolInfo` | ❌ |
| — | `app.onhostcontextchanged` | ❌ |
| — | `app.onteardown` | ❌ |
| — | `app.sendLog({ level, data })` | ❌ |
| — | `app.getHostVersion()` | ❌ |
| — | `app.getHostCapabilities()` | ✅ |

The four `❌` rows that hurt most in practice:

- **`onteardown` unsupported** → you get no flush signal. Persist on every
  meaningful change rather than at unmount.
- **`onhostcontextchanged` unsupported** → theme changes mid-session will not
  reach you. Read theme once at init and accept the staleness, or use CSS
  `prefers-color-scheme` as a backstop.
- **`ontoolinputpartial` unsupported** → no streaming skeleton. Design the
  loading state around `ontoolinput` only.
- **`sendLog` unsupported** → fall back to `console` plus a visible debug pane
  behind a query flag.

## Tool descriptor `_meta`

| OpenAI Apps SDK | MCP Apps equivalent | M365 Copilot |
|---|---|---|
| `_meta["openai/outputTemplate"]` | `_meta.ui.resourceUri` | ✅ |
| `_meta["openai/widgetAccessible"]` | `_meta.ui.visibility` (string[]) | ❌ |
| `_meta["openai/visibility"]` | `_meta.ui.visibility` (string[]) | ✅ |
| `_meta["openai/toolInvocation/invoking"]` | — | ❌ |
| `_meta["openai/toolInvocation/invoked"]` | — | ❌ |
| `_meta["openai/fileParams"]` | — | ❌ |
| `_meta["securitySchemes"]` | — | ❌ |

## Tool descriptor annotations

| Annotation | M365 Copilot |
|---|---|
| `readOnlyHint` | ✅ |
| `destructiveHint` | ❌ |
| `openWorldHint` | ❌ |
| `idempotentHint` | ❌ |

Only `readOnlyHint` is honored. Do not rely on `destructiveHint` to produce a
confirmation prompt — build the confirmation into your own UI.

## Component resource `_meta`

| OpenAI Apps SDK | MCP Apps equivalent | M365 Copilot |
|---|---|---|
| `_meta["openai/widgetDescription"]` | — | ❌ |
| `_meta["openai/widgetPrefersBorder"]` | `_meta.ui.prefersBorder` | ❌ |
| `_meta["openai/widgetCSP"]` | `_meta.ui.csp` | ✅ |
| `_meta["openai/widgetDomain"]` | `_meta.ui.domain` | ❌ |
| — | `_meta.ui.permissions` | ❌ |

## CSP object properties

| OpenAI Apps SDK | MCP Apps equivalent | M365 Copilot |
|---|---|---|
| `connect_domains` | `connectDomains` | ✅ |
| `resource_domains` | `resourceDomains` | ✅ |
| `frame_domains` | `frameDomains` | ❌ |
| `redirect_domains` | — | ❌ |
| — | `baseUriDomains` | ❌ |

Nested iframes are not available in Copilot at all. If your design embeds a
third-party frame (a map, a video player), it will not render there — inline the
capability or degrade to a link.

## Host-provided tool result `_meta`

| Field | M365 Copilot |
|---|---|
| `_meta["openai/widgetSessionId"]` | ❌ |

## Client-provided `_meta`

| Field | M365 Copilot |
|---|---|
| `_meta["openai/locale"]` | ✅ |
| `_meta["openai/userAgent"]` | ✅ |
| `_meta["openai/userLocation"]` | ✅ |
| `_meta["openai/subject"]` | ❌ |

## Feature detection patterns

Minimal guard:

```ts
if (window.openai?.callTool) {
  const result = await window.openai.callTool({ name: "myTool", params: {} });
} else {
  // fallback UI
}
```

Conditional affordance — never render a control the host cannot honor:

```tsx
function FullScreenButton() {
  if (!window.openai?.requestDisplayMode) return null;
  return (
    <button onClick={() => window.openai.requestDisplayMode({ mode: "fullscreen" })}>
      Enter Fullscreen
    </button>
  );
}
```

Startup capability probe — the pattern to prefer for anything non-trivial:

```ts
interface PlatformCapabilities {
  canCallTools: boolean;
  canChangeDisplayMode: boolean;
  canSendMessages: boolean;
  canPersistState: boolean;
}

function detectCapabilities(): PlatformCapabilities {
  const o = typeof window !== "undefined" ? window.openai : undefined;
  return {
    canCallTools: !!o?.callTool,
    canChangeDisplayMode: !!o?.requestDisplayMode,
    canSendMessages: !!o?.sendMessage,
    canPersistState: !!o?.setWidgetState,
  };
}

const caps = detectCapabilities();
if (!caps.canCallTools) renderReducedFunctionality();
```

On the MCP Apps side, ask the host directly:

```ts
const caps = await app.getHostCapabilities();
const modes = app.getHostContext()?.availableDisplayModes ?? ["inline"];
```

`availableDisplayModes` is itself unsupported in Copilot, so the `?? ["inline"]`
default is doing real work.

## Rules

1. Never branch on host name or user agent. Test for the capability.
2. Never render an affordance whose API is missing — hide it.
3. Every host API call needs a defined fallback path, not a `try/catch` that
   swallows.
4. Re-verify this matrix against the vendor docs before shipping; host coverage
   moves.

## Related

- `openai-apps-sdk` — what each `window.openai` API does.
- `mcp-apps-protocol` — the standard equivalents.
- `m365-copilot-packaging` — Copilot's other requirements (CORS, redirect URIs).
