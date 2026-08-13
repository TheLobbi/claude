---
name: mcp-apps-sdk
description: This skill should be used when writing code against @modelcontextprotocol/ext-apps — registerAppTool, registerAppResource, RESOURCE_MIME_TYPE, the App class and its handlers, the React useApp hook, the app-bridge entry point, and the Vite single-file build that MCP Apps expect.
version: 1.0.0
trigger_phrases: [ext-apps, registerAppTool, registerAppResource, RESOURCE_MIME_TYPE, app.connect, ontoolresult, callServerTool, useApp, vite-plugin-singlefile, basic-host]
categories: [sdk, mcp, typescript, reference]
author: mcp-apps-studio
created: 2026-08-13
updated: 2026-08-13
---

# `@modelcontextprotocol/ext-apps` — the SDK

One package, four entry points:

| Import | Side | Contains |
|---|---|---|
| `@modelcontextprotocol/ext-apps` | View | `App` class |
| `@modelcontextprotocol/ext-apps/server` | Server | `registerAppTool`, `registerAppResource`, `RESOURCE_MIME_TYPE` |
| `@modelcontextprotocol/ext-apps/react` | View | `useApp` and React bindings |
| `@modelcontextprotocol/ext-apps/app-bridge` | View | low-level bridge for non-JS frameworks |

```bash
npm install @modelcontextprotocol/ext-apps @modelcontextprotocol/sdk
npm install -D typescript vite vite-plugin-singlefile express cors tsx \
               @types/express @types/cors
```

Always `npm install` by name. Do not hand-pin versions in `package.json` — the
View SDK and server SDK must move together.

## Server side

```ts
// server.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  registerAppTool,
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import express from "express";
import cors from "cors";
import fs from "node:fs/promises";
import path from "node:path";

const server = new McpServer({ name: "Weather", version: "1.0.0" });
const resourceUri = "ui://weather/forecast.html";

registerAppTool(
  server,
  "render_forecast",
  {
    title: "Render forecast",
    description: "Render the 7-day forecast widget. Call get_forecast first.",
    inputSchema: { city: z.string(), days: z.array(DayShape) },
    _meta: { ui: { resourceUri } },
  },
  async ({ city, days }) => ({
    // structuredContent is what the View renders …
    structuredContent: { city, days },
    // … content is what a text-only host and the model read.
    content: [{ type: "text", text: `7-day forecast for ${city}.` }],
  }),
);

registerAppResource(
  server,
  "forecast-ui",            // human-readable name
  resourceUri,              // the ui:// URI
  { mimeType: RESOURCE_MIME_TYPE },
  async () => ({
    contents: [
      {
        uri: resourceUri,
        mimeType: RESOURCE_MIME_TYPE,
        text: await fs.readFile(
          path.join(import.meta.dirname, "dist", "mcp-app.html"),
          "utf-8",
        ),
        // CSP belongs HERE, in the contents _meta — not in the config arg above.
        _meta: {
          ui: {
            prefersBorder: true,
            csp: {
              connectDomains: ["https://api.weather.example"],
              resourceDomains: ["https://static.weather.example"],
            },
          },
        },
      },
    ],
  }),
);

const app = express();
app.use(cors());
app.use(express.json());
app.post("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  res.on("close", () => transport.close());
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});
app.listen(3001, () => console.log("http://localhost:3001/mcp"));
```

`registerAppTool`/`registerAppResource` are thin wrappers over the base SDK's
`registerTool`/`registerResource` that enforce the MCP Apps shape. Using the
base functions directly works too — you just have to spell `_meta` and the
mimeType yourself.

## View side — vanilla

```ts
import { App } from "@modelcontextprotocol/ext-apps";

const app = new App({ name: "Forecast", version: "1.0.0" });

// ⚠ Every handler BEFORE connect().
app.ontoolinput   = (params) => renderSkeleton(params);
app.ontoolresult  = (result) => render(result.structuredContent);
app.onteardown    = () => flush();
app.onhostcontextchanged = (ctx) => applyTheme(ctx.theme);

app.connect();
```

### `App` surface

| Member | Kind | Notes |
|---|---|---|
| `connect()` | method | Performs `ui/initialize`. Call once, last. |
| `callServerTool({ name, arguments })` | method | Full round-trip to the server. Returns `CallToolResult`. |
| `readResource({ uri })` | method | Read another server resource. |
| `sendMessage({ … })` | method | Inject a follow-up message into the conversation. |
| `updateModelContext(ctx)` | method | Tell the model what the user is now looking at. |
| `requestDisplayMode({ mode })` | method | `"inline" \| "fullscreen" \| "pip"`. Check availability first. |
| `sendSizeChanged({ width, height })` | method | Drives host iframe resizing. |
| `openLink({ url })` | method | Host-mediated navigation. |
| `sendLog({ level, data })` | method | Logs to the host — survives when devtools do not. |
| `getHostContext()` | method | Theme, display mode, viewport, locale, safe area. |
| `getHostCapabilities()` | method | What this host actually implements. |
| `getHostVersion()` | method | Host name/version. |
| `ontoolinput` | handler | Arguments, before the result. |
| `ontoolinputpartial` | handler | Streaming healed-JSON args. May be incomplete. |
| `ontoolresult` | handler | The `CallToolResult`. |
| `ontoolcancelled` | handler | Abort in-flight rendering. |
| `onteardown` | handler | Last chance to persist. |
| `onhostcontextchanged` | handler | Theme/mode/viewport change. |

Not every host implements every member — see `host-capability-matrix`. Guard
with `getHostCapabilities()` or a plain truthiness check.

## View side — React

```tsx
import { useApp } from "@modelcontextprotocol/ext-apps/react";

export function Forecast() {
  const { app, toolInput, toolResult, hostContext } = useApp({
    name: "Forecast",
    version: "1.0.0",
  });

  if (!toolResult) return <Skeleton city={toolInput?.city} />;

  const { city, days } = toolResult.structuredContent as ForecastData;

  return (
    <div data-theme={hostContext?.theme}>
      <h1>{city}</h1>
      {days.map((d) => <Day key={d.date} {...d} />)}
      <button onClick={() => app.callServerTool({
        name: "get_forecast", arguments: { city, refresh: true },
      })}>Refresh</button>
    </div>
  );
}
```

`useApp` handles connect/teardown for you. Do not also call `app.connect()`.

Vue, Svelte, Preact, and Solid work — they just use the `App` class or
`app-bridge` directly and manage the lifecycle themselves.

## Build: single-file is the path of least resistance

The View is served as one HTML string. Either bundle everything inline, or
declare every asset origin in `csp.resourceDomains`. Inline is simpler.

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [viteSingleFile()],
  build: { outDir: "dist", rollupOptions: { input: process.env.INPUT } },
});
```

```json
{
  "type": "module",
  "scripts": {
    "build": "INPUT=mcp-app.html vite build",
    "serve": "npx tsx server.ts"
  }
}
```

`"type": "module"` is required. Run the TypeScript server with `tsx`, not `node`.

## Testing

```bash
npm run build && npm run serve                  # your server on :3001

# In the ext-apps checkout:
cd examples/basic-host && npm install
SERVERS='["http://localhost:3001/mcp"]' npm start   # host on :8080
```

For a real host, tunnel and register a custom connector:

```bash
npx cloudflared tunnel --url http://localhost:3001
```

Then Claude → Settings → Connectors → Add custom connector. Custom connectors
require a paid plan.

Debug with `app.sendLog({ level: "info", data })` rather than `console.log` —
the iframe's console is frequently not where you are looking.

## Failure modes, ranked by frequency

1. **Handlers registered after `connect()`** → the first `tool-result` is lost.
2. **CSP in the config arg instead of the contents `_meta`** → all fetches blocked.
3. **Assets not inlined and not in `resourceDomains`** → blank View.
4. **`_meta.ui.resourceUri` on the data tool** → widget remounts on every fetch.
5. **Missing `"type": "module"`** → `import` syntax errors at serve time.
6. **Same `ui://` URI after a breaking change** → stale Views in live conversations.

## Related

- `mcp-apps-protocol` — the wire format these functions produce.
- `ui-testing-harness` — the local host loop in detail.
- `ui-performance` — bundling, partial input, offscreen pausing.
