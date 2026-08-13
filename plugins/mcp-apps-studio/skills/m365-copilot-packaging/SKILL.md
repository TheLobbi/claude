---
name: m365-copilot-packaging
description: This skill should be used when shipping an MCP app into Microsoft 365 Copilot as a declarative agent — prerequisites, the widget host CORS URL, OAuth 2.1 and Entra SSO redirect URIs, Agents Toolkit sideloading, dynamic tool discovery, and the Copilot-specific capability gaps to design around.
version: 1.0.0
trigger_phrases: [m365 copilot, declarative agent, agents toolkit, widget-renderer.usercontent.microsoft.com, entra sso, oauth redirect copilot, sideload agent, dynamic tool discovery, copilot mcp plugin]
categories: [deployment, microsoft, mcp, ui]
author: mcp-apps-studio
created: 2026-08-13
updated: 2026-08-13
---

# Shipping to Microsoft 365 Copilot

Copilot renders MCP apps as interactive widgets inside **declarative agents**.
You attach an MCP server-based plugin whose tools return UI. Copilot supports
both MCP Apps and the OpenAI Apps SDK, with the coverage documented in
`host-capability-matrix`.

## Prerequisites

- A **remote** MCP server (local stdio is not an option here).
- Visual Studio Code.
- **Microsoft 365 Agents Toolkit 6.12.0 or later.**
- MCP Inspector for verifying server responses before wiring Copilot up.
- The general Copilot extensibility requirements (tenant, licensing).

## Allowed URLs — the step everyone misses

Both your MCP server *and* your identity provider must allowlist these.

### Widget host URL (CORS)

Copilot renders widget UI under a server-specific host:

```
{hashed-mcp-domain}.widget-renderer.usercontent.microsoft.com
```

where `{hashed-mcp-domain}` is the **SHA-256 hash of your MCP server's domain**.
Generate it with the Widget Host URL Generator at `https://aka.ms/mcpwidgeturlgenerator`,
then add the result to your server's CORS allowlist.

Skip this and the symptom is a widget that works perfectly in the basic-host and
renders blank in Copilot with no useful error.

### OAuth 2.1 redirect URIs

```
https://teams.microsoft.com/api/platform/v1.0/oAuthRedirect     ← Copilot
https://vscode.dev/redirect                                     ← VS Code / Agents Toolkit tool fetch
```

### Microsoft Entra SSO redirect URIs

```
https://teams.microsoft.com/api/platform/v1.0/oAuthConsentRedirect
```

VS Code does not currently support SSO for fetching tools — use OAuth 2.1 or
anonymous during development, then switch.

## Authentication

| Mode | Use |
|---|---|
| **None** (anonymous) | Development only. Select it in Agents Toolkit while iterating. |
| **OAuth 2.1** | Standard production path. |
| **Microsoft Entra SSO** | Production, when the agent should act as the signed-in user. |

Anonymous **must** be removed before deployment. It is a development affordance,
not a shipping configuration.

## Building and sideloading

Creating a declarative agent from an MCP server, configuring auth, and
sideloading are identical whether or not the server returns UI. Follow the
standard "build a plugin for a declarative agent from an MCP server" flow, with
three MCP-apps-specific notes:

1. The server must return UI resources per the MCP Apps or Apps SDK requirements.
2. **Dynamic tool discovery is the default** — the agent resolves your tools,
   including UI tools, at runtime. You do not need to enumerate them.
3. If you pin a fixed tool set instead, **include at least one tool that returns
   a UI widget**, or nothing will ever render.

### Test

1. Go to `https://m365.cloud.microsoft/chat`.
2. Select your agent in the sidebar (**All agents** if it is not pinned).
3. Ask something that invokes your server.
4. Allow the connection when prompted.
5. Confirm the widget renders.

## Design around Copilot's gaps

From the support matrix, the constraints that change design rather than just
code:

| Gap | Consequence | Work around it by |
|---|---|---|
| `frameDomains` unsupported | No nested iframes at all | Inline maps/players, or degrade to `openLink` |
| Only fullscreen alternate mode | No PiP, no carousel-specific mode | Design inline + fullscreen only |
| `onteardown` unsupported | No flush signal at unmount | Persist on every meaningful change |
| `onhostcontextchanged` unsupported | Theme changes do not reach you | Read theme at init; back it with `prefers-color-scheme` |
| `ontoolinputpartial` unsupported | No streaming skeleton | Build the loading state from `ontoolinput` only |
| `sendLog` unsupported | No host-side logging | `?debug` flag with an on-screen log pane |
| `availableDisplayModes` unsupported | Cannot enumerate modes | Default to `["inline"]` and feature-detect `requestDisplayMode` |
| `prefersBorder`, `widgetDescription`, `widgetDomain` unsupported | Ignored silently | Do not depend on them visually |
| `toolInvocation/invoking` and `invoked` unsupported | No custom progress text | Put status in the widget itself |
| `destructiveHint` / `idempotentHint` / `openWorldHint` ignored | No host confirmation prompt | Build confirmation into your UI |
| `uploadFile` / `getFileDownloadUrl` unsupported | No file round-trip | Server-side upload endpoint + `openLink` |
| `requestModal` unsupported | No host modal | In-widget overlay |

`setWidgetState` **is** supported, so remount survival works. `getHostCapabilities()`
is supported, so probe it at startup rather than assuming this table is current.

## Verify API availability — Microsoft's own guidance

```typescript
if (window.openai.callTool) {
  const result = await window.openai.callTool({ name: "myTool", params: {} });
} else {
  // Show fallback UI, skip the feature, etc.
}
```

```typescript
function FullScreenButton() {
  if (!window.openai.requestDisplayMode) return null;   // don't render what won't work
  return (
    <button onClick={() => window.openai.requestDisplayMode({ mode: "fullscreen" })}>
      Enter Fullscreen
    </button>
  );
}
```

Startup probe:

```typescript
interface PlatformCapabilities {
  canCallTools: boolean;
  canChangeDisplayMode: boolean;
  canSendMessages: boolean;
}

function detectCapabilities(): PlatformCapabilities {
  return {
    canCallTools: !!window.openai.callTool,
    canChangeDisplayMode: !!window.openai.requestDisplayMode,
    canSendMessages: !!window.openai.sendMessage,
  };
}
```

## Reference samples

Microsoft publishes `microsoft/mcp-interactiveUI-samples` — pattern-focused
samples in `mcp-apps/` (Node.js and Python) and `oai-apps-sdk/` (Node.js),
covering expense submission with Graph + Entra SSO, field service dispatch with
maps, bulk approvals, HR consultant dashboards in Fluent UI v9, insurance
claims, training recommendations with embedded video, and Python LOB
integrations for Salesforce, ServiceNow, and HubSpot. Fluent UI v9, FastMCP, and
Azure Container Apps deployment are the recurring stack.

## Pre-ship checklist

- [ ] Server reachable over HTTPS at a stable URL
- [ ] Widget host URL generated and added to CORS
- [ ] OAuth 2.1 redirect URIs registered (Copilot + VS Code)
- [ ] Entra SSO consent redirect registered, if using SSO
- [ ] Anonymous auth removed
- [ ] At least one tool returns a UI widget (if tools are pinned)
- [ ] No dependency on any `❌` row above
- [ ] Widget renders and functions at `m365.cloud.microsoft/chat`
- [ ] Text-only fallback verified — the workflow completes without the widget

## Related

- `host-capability-matrix` — the full support tables.
- `mcp-apps-protocol` — the standard being implemented.
- `ui-testing-harness` — the local loop before you reach Copilot.
