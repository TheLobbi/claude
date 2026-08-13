---
name: ui:preview
intent: Run the local test loop for an agent UI — build, serve, mount in a host harness, and triage whatever fails to render
tags:
  - mcp-apps-studio
  - command
  - testing
inputs:
  - target
  - flags
risk: low
cost: low
description: See the widget actually render — Inspector for protocol shape, basic-host for the real bridge, cloudflared into Claude or ChatGPT, plus a symptom-to-cause triage table
---

# /ui:preview

Four rungs, climbed only as far as the bug requires. Most failures die on rung one.

## Usage

```
/ui:preview                      # build, serve, and mount in the local harness
/ui:preview --inspect            # protocol shape only (MCP Inspector checks)
/ui:preview --tunnel             # expose via cloudflared for a real host
/ui:preview --host claude        # print the exact connector setup steps
/ui:preview --triage "blank iframe"
/ui:preview --watch              # rebuild and reload on change
```

## Flags

| Flag | Effect |
|---|---|
| `--inspect` | Verify `resources/list`, `tools/list`, mimeType, and `_meta` wiring. No rendering. |
| `--tunnel` | Start `cloudflared` and print the public URL. |
| `--host <name>` | `claude`, `chatgpt`, `m365-copilot` — prints that host's connector steps. |
| `--triage <symptom>` | Map a symptom to its cause and the check that confirms it. |
| `--watch` | Rebuild the View and restart the server on change. |
| `--port <n>` | Server port. Default 3001. |

## Rung 1 — protocol shape

```bash
npx @modelcontextprotocol/inspector
```

Confirms, in order:
- `resources/list` includes the `ui://…` URI.
- mimeType is exactly `text/html;profile=mcp-app`.
- `contents[0]._meta.ui.csp` present and narrow.
- `_meta.ui.resourceUri` on render tools only, never on data tools.
- Calling the tool returns both `content` and `structuredContent`.

If `_meta.ui.resourceUri` is absent here, no host will ever render anything.
Stop and fix.

## Rung 2 — the real bridge

```bash
npm run build && npm run serve                       # :3001

cd <ext-apps>/examples/basic-host && npm install
SERVERS='["http://localhost:3001/mcp"]' npm start    # :8080
```

PowerShell: `$env:SERVERS='["http://localhost:3001/mcp"]'; npm start`

This is where lifecycle-ordering bugs, CSP blocks, and capability guards surface.
**Rebuild after every UI change** — the server reads `dist/mcp-app.html` from
disk, so a stale bundle silently serves the old View.

## Rung 3 — a real host

```bash
npx cloudflared tunnel --url http://localhost:3001
```

- **Claude** — Settings → Connectors → Add custom connector. Paid plan required.
- **ChatGPT** — connect the MCP server in developer mode.
- **M365 Copilot** — Agents Toolkit (6.12.0+), then `m365.cloud.microsoft/chat`.
  Add the widget host CORS URL and redirect URIs first — see `/ui:copilot`.

Only real hosts surface host-specific gaps: an API that is `undefined`, a
`frameDomains` entry ignored, a display mode not granted.

## Rung 4 — instrumentation

```ts
app.sendLog?.({ level: "info", data: { phase: "tool-result" } });
```

Unsupported in M365 Copilot, so `--watch` also injects a `?debug` flag that
reveals an on-screen log pane — worth its weight the first time you debug inside
a host with no devtools.

## Triage

| Symptom | Cause | Check |
|---|---|---|
| No widget at all | Tool lacks `_meta.ui.resourceUri` | Inspector `tools/list` |
| Field present, still nothing | URI matches no registered resource | Inspector `resources/list` |
| Blank iframe | Assets neither inlined nor in `resourceDomains` | Network / CSP violations |
| Loads, no data | Handler registered after `connect()` | `/ui:bridge --lifecycle` |
| All fetches fail | CSP in the config arg, not contents `_meta` | `/ui:csp` |
| Remounts constantly | Data tool carries `resourceUri` | `/ui:tool --decouple` |
| Works locally, blank in Copilot | Widget host URL not CORS-allowed | `/ui:copilot` |
| Button does nothing | Host API is `undefined` | `/ui:bridge --capabilities` |
| Fullscreen ignored | Mode not in `availableDisplayModes` | render from the granted mode |
| Old UI in a live chat | Resource URI reused after a breaking change | publish a new `ui://` URI |
| `import` syntax error | `"type": "module"` missing | `package.json` |

## Related

- Skill `ui-testing-harness` — the loop and assertions in full.
- `/ui:copilot` — Copilot prerequisites.
- `/ui:audit` — static checks that catch most of this before you run anything.
