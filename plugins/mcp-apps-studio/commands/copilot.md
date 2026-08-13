---
name: ui:copilot
intent: Package and ship an MCP app into Microsoft 365 Copilot as a declarative agent, covering CORS, redirect URIs, auth, sideloading, and the Copilot capability gaps
tags:
  - mcp-apps-studio
  - command
  - microsoft
inputs:
  - target
  - flags
risk: high
cost: medium
description: Get a widget rendering in M365 Copilot — generate the widget host CORS URL, register OAuth 2.1 and Entra SSO redirect URIs, sideload via Agents Toolkit, and design around every unsupported API
---

# /ui:copilot

Copilot renders MCP apps inside declarative agents. The code is standard MCP
Apps; the friction is entirely configuration and capability gaps.

## Usage

```
/ui:copilot                     # readiness check against the Copilot matrix
/ui:copilot --urls              # compute the widget host CORS URL and redirect URIs
/ui:copilot --auth entra-sso
/ui:copilot --package           # emit the declarative agent + Agents Toolkit config
/ui:copilot --gaps              # list every unsupported API this app depends on
```

## Flags

| Flag | Effect |
|---|---|
| `--urls` | Compute the SHA-256 widget host URL and print every redirect URI to register. |
| `--auth` | `none` (dev only), `oauth2.1`, `entra-sso`. |
| `--package` | Generate the declarative agent manifest and Agents Toolkit config. |
| `--gaps` | Cross-reference every host API used against Copilot's support matrix. |
| `--server-url <url>` | The MCP server domain, for URL computation. |

## Prerequisites it verifies

- A **remote** MCP server over HTTPS at a stable URL (local stdio will not work).
- Microsoft 365 Agents Toolkit **6.12.0 or later** in VS Code.
- Copilot extensibility tenant requirements met.

## The URL step everyone misses

Copilot renders widgets under a server-specific host:

```
{sha256(mcp-server-domain)}.widget-renderer.usercontent.microsoft.com
```

`--urls` computes it and prints exactly what to add where:

```
WIDGET HOST (add to your server's CORS allowlist)
  https://a3f9…c21.widget-renderer.usercontent.microsoft.com
  (verify against https://aka.ms/mcpwidgeturlgenerator)

OAUTH 2.1 REDIRECT URIS
  https://teams.microsoft.com/api/platform/v1.0/oAuthRedirect     ← Copilot
  https://vscode.dev/redirect                                     ← Agents Toolkit tool fetch

ENTRA SSO CONSENT REDIRECT
  https://teams.microsoft.com/api/platform/v1.0/oAuthConsentRedirect
```

Miss the CORS entry and the symptom is a widget that renders perfectly in
basic-host and blank in Copilot, with no useful error. VS Code does not
currently support SSO for fetching tools — use OAuth 2.1 or anonymous while
developing.

## Auth

| Mode | Use |
|---|---|
| `none` | Development only. Must be removed before deploy. |
| `oauth2.1` | Standard production path. |
| `entra-sso` | Production, when the agent acts as the signed-in user. |

## Capability gaps

`--gaps` reports every API the app uses that Copilot does not support, with the
design consequence rather than just the flag:

```
COPILOT GAPS  6 dependencies on unsupported APIs

BLOCKING
  ✗ requestModal          src/confirm.tsx:31   → build an in-widget overlay
  ✗ frameDomains          server.ts:74         → no nested map embed; use openLink
  ✗ uploadFile            src/attach.tsx:19    → server-side upload endpoint + openLink

ADVISORY
  ⚠ onteardown            src/app.tsx:52       → persist on change, not at unmount
  ⚠ onhostcontextchanged  src/theme.ts:12      → read theme at init + prefers-color-scheme
  ⚠ ontoolinputpartial    src/skeleton.tsx:8   → ensure ontoolinput alone produces a skeleton

SUPPORTED, NO ACTION
  ✓ setWidgetState   ✓ callTool   ✓ sendMessage   ✓ openLink
  ✓ requestDisplayMode (fullscreen only)   ✓ getHostCapabilities
  ✓ csp.connectDomains / resourceDomains   ✓ readOnlyHint

ALSO NOTE
  · destructiveHint is ignored — build confirmation into your own UI
  · prefersBorder / widgetDescription / widgetDomain silently ignored
  · toolInvocation invoking/invoked text unsupported — put status in the widget
```

## Sideload and test

1. Create the declarative agent from the MCP server via Agents Toolkit.
2. Leave **dynamic tool discovery** on — the agent resolves UI tools at runtime.
   If you pin a fixed tool set instead, include at least one tool that returns a
   widget or nothing will ever render.
3. Go to `https://m365.cloud.microsoft/chat`, select the agent (**All agents**
   if unpinned), ask something that invokes the server, allow the connection.
4. Confirm the widget renders.

## Pre-ship checklist

- [ ] Server on HTTPS at a stable URL
- [ ] Widget host URL in CORS
- [ ] OAuth 2.1 redirect URIs registered
- [ ] Entra SSO consent redirect registered, if used
- [ ] Anonymous auth removed
- [ ] At least one UI tool reachable (if tools are pinned)
- [ ] No blocking gap from `--gaps` remains
- [ ] Text-only fallback verified — the workflow completes without the widget

## Related

- Skill `m365-copilot-packaging` — the full deployment guide.
- Skill `host-capability-matrix` — the support tables behind `--gaps`.
- `/ui:audit --host m365-copilot` — the broader review.
