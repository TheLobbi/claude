# __APP_TITLE__

An MCP App: an interactive UI that renders inline in Claude, ChatGPT, Microsoft
365 Copilot, or any other MCP Apps-compliant host.

## Run it

```bash
npm install
npm run build     # bundles the View to dist/mcp-app.html (single file)
npm run serve     # MCP server on http://localhost:3001/mcp
```

Rebuild after **every** UI change — the server reads `dist/mcp-app.html` from
disk, so a stale bundle silently serves the old View.

## See it render

### Local host harness

```bash
git clone https://github.com/modelcontextprotocol/ext-apps.git
cd ext-apps/examples/basic-host && npm install
SERVERS='["http://localhost:3001/mcp"]' npm start     # http://localhost:8080
```

PowerShell: `$env:SERVERS='["http://localhost:3001/mcp"]'; npm start`

### A real host

```bash
npx cloudflared tunnel --url http://localhost:3001
```

Then register the generated URL — Claude: Settings → Connectors → Add custom
connector (paid plan required). ChatGPT: connect the MCP server in developer
mode. M365 Copilot: Agents Toolkit 6.12.0+, and add the widget host CORS URL
and redirect URIs first.

### Protocol shape only

```bash
npx @modelcontextprotocol/inspector
```

Confirm `resources/list` shows `ui://__APP_SLUG__/v1.html`, the mimeType is
`text/html;profile=mcp-app`, and `_meta.ui.resourceUri` is on the render tool
and **not** on the data tools.

## Layout

```
server.ts          tool + resource registration, Express + StreamableHTTP
mcp-app.html       View entry point
src/main.tsx       the View — four states, feature-detected affordances
src/bridge.ts      HostBridge adapter; the only file that knows the protocol
src/schema.ts      zod shapes for the tool contract and the View boundary
src/styles.css     host-theme-aware, WCAG AA, reduced-motion aware
vite.config.ts     single-file bundle
```

## The tool topology

| Tool | `resourceUri` | Called by | Why |
|---|---|---|---|
| `search___APP_SNAKE__` | no | model | Data. Chainable — the model can filter before rendering. |
| `render___APP_SNAKE__` | **yes** | model | Render only. No I/O. |
| `refresh___APP_SNAKE__` | no (`visibility: ["app"]`) | the View | Local refresh without remounting or polluting context. |

Attaching a template to a tool the model calls repeatedly makes the host remount
the iframe every time, destroying local state. Keep the split.

## Things that will bite you

- **Register every handler before `app.connect()`.** Reversed, the first
  `tool-result` is dropped and the widget renders empty.
- **CSP goes in the resource `contents._meta`**, not in `registerAppResource`'s
  config argument. Misplaced, every network call is blocked at runtime with no
  visible error.
- **Add an origin to `connectDomains` only when the code proves it needs one.**
  Each entry is somewhere the View can send rendered data.
- **`structuredContent` is untrusted.** It is parsed through `schema.ts` before
  it reaches the DOM. Keep it that way — no `innerHTML`, ever.
- **Breaking UI change ⇒ new `ui://` URI.** Hosts treat it as a cache key, so a
  reused URI leaves stale Views in live conversations.
- **Every tool returns `content`.** That is what makes the workflow complete in a
  host that does not render UI.

## Deploy

Host over HTTPS at a stable URL. Add OAuth 2.1 or Entra SSO before production —
anonymous auth is a development affordance only. Then re-run:

```bash
node <plugin>/scripts/validate-mcp-app.mjs --strict .
node <plugin>/scripts/host-capability-check.mjs --host chatgpt,m365-copilot .
```
