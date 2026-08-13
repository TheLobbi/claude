---
name: ui-testing-harness
description: This skill should be used when testing or debugging an agent UI locally — the basic-host loop, MCP Inspector, cloudflared tunnels into Claude or ChatGPT, sendLog, the bridge-level assertions worth writing, and a triage table mapping every common symptom to its cause.
version: 1.0.0
trigger_phrases: [test mcp app, basic-host, mcp inspector, cloudflared tunnel, widget blank, widget not rendering, sendLog, debug widget iframe, SERVERS env]
categories: [testing, debugging, mcp, ui]
author: mcp-apps-studio
created: 2026-08-13
updated: 2026-08-13
---

# Testing agent UIs

Four rungs. Climb only as far as the bug requires.

## 1. Protocol level — MCP Inspector

Before any rendering question, confirm the server emits the right shapes.

```bash
npx @modelcontextprotocol/inspector
```

Check, in order:

- `resources/list` includes your `ui://…` URI.
- The resource's `mimeType` is exactly `text/html;profile=mcp-app`.
- The resource `contents[0]._meta.ui.csp` is present and narrow.
- `tools/list` shows `_meta.ui.resourceUri` on the **render** tool and **not**
  on data tools.
- Calling the tool returns both `content` (text) and `structuredContent`.

Most "the widget doesn't show up" reports die here. If Inspector does not show
`_meta.ui.resourceUri`, no host will render anything.

## 2. Render level — the basic-host

The `ext-apps` repo ships a minimal host that mounts the iframe and speaks the
real bridge.

```bash
# your server
npm run build && npm run serve            # → http://localhost:3001/mcp

# the host, from an ext-apps checkout
cd examples/basic-host && npm install
SERVERS='["http://localhost:3001/mcp"]' npm start   # → http://localhost:8080
```

Pick your tool from the dropdown, call it, and watch the View mount. This is
where you catch bridge bugs, CSP blocks, and lifecycle-ordering mistakes.

Windows PowerShell:

```powershell
$env:SERVERS='["http://localhost:3001/mcp"]'; npm start
```

Rebuild after every UI change — the server reads `dist/mcp-app.html` from disk,
so a stale bundle silently serves the old View.

## 3. Real host — tunnel in

```bash
npx cloudflared tunnel --url http://localhost:3001
```

Take the generated `https://<name>.trycloudflare.com` URL and register it:

- **Claude** — Settings → Connectors → Add custom connector. Requires a paid
  plan (Pro, Max, or Team).
- **ChatGPT** — connect the MCP server in developer mode.
- **M365 Copilot** — Agents Toolkit in VS Code (6.12.0+), then
  `https://m365.cloud.microsoft/chat`. See `m365-copilot-packaging` for the CORS
  and redirect-URI allowlists you must add first.

Only real hosts surface host-specific gaps — a `window.openai` API that is
`undefined`, a `frameDomains` entry ignored, a display mode not granted.

## 4. Instrumentation

The iframe console is often not where you are looking, and in some hosts it is
not reachable at all.

```ts
app.sendLog({ level: "info", data: { phase: "tool-result", keys: Object.keys(sc) } });
```

`sendLog` is unsupported in M365 Copilot — keep a fallback:

```ts
function log(level: string, data: unknown) {
  try { app.sendLog?.({ level, data }); } catch { /* noop */ }
  if (new URLSearchParams(location.search).has("debug")) console.log(level, data);
}
```

A `?debug` query flag that reveals an on-screen log pane pays for itself the
first time you debug inside a host with no devtools.

## Assertions worth automating

Unit-testable without a host:

- **Server shape.** Call the tool handler directly; assert `structuredContent`
  matches its schema and `content[0].text` is non-empty (the text-only fallback).
- **Resource shape.** Assert mimeType, `ui://` scheme, and that `csp` lists only
  expected origins.
- **Tool/resource wiring.** Assert exactly the render tools carry
  `resourceUri`, and every referenced URI resolves to a registered resource.
- **Payload validation.** Feed the View's parser malformed and oversized
  `structuredContent`; assert it renders an error state, not a crash.
- **Capability degradation.** Stub `window.openai` as `{}` and assert no
  host-dependent affordance renders.

`scripts/validate-mcp-app.mjs` in this plugin performs the first three
statically over a server source tree — run it in CI.

Bridge-level integration tests: drive a headless iframe, post
`ui/notifications/tool-result` at it, and assert the DOM. Worth it once the
widget has more than one state.

## Triage table

| Symptom | Likely cause | Check |
|---|---|---|
| No widget at all | Tool lacks `_meta.ui.resourceUri` | Inspector `tools/list` |
| No widget, tool has the field | URI does not match a registered resource | Inspector `resources/list` |
| Blank iframe | Assets not inlined, not in `resourceDomains` | Network tab / CSP violations |
| Loads, then no data | Handler registered after `connect()` | Move handlers above `connect()` |
| All fetches fail | CSP in the config arg, not contents `_meta` | Read the resource in Inspector |
| Widget remounts constantly | Data tool carries `resourceUri` | Decouple data/render tools |
| Works locally, blank in Copilot | Widget host URL not CORS-allowed | Widget Host URL Generator |
| Button does nothing | Host API is `undefined` | `getHostCapabilities()` / truthiness guard |
| Fullscreen ignored | Mode not in `availableDisplayModes` | Render from the granted mode |
| Old UI in a live conversation | Resource URI reused after a breaking change | Publish a new `ui://` URI |
| `import` syntax error at serve | `"type": "module"` missing | `package.json` |
| Nested embed blank | `frameDomains` unsupported on that host | Inline it or degrade to a link |

## Related

- `mcp-apps-sdk` — build config and the failure-modes list.
- `host-capability-matrix` — what to expect per host.
- `m365-copilot-packaging` — Copilot's prerequisites.
