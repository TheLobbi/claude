/**
 * __APP_TITLE__ — mcp-ui server.
 *
 * Serves the same UI three ways so you can see the trade-offs side by side:
 *
 *   rawHtml      self-contained widget in a sandboxed iframe. The default.
 *   externalUrl  the host iframes an app you already deploy. Costs an origin in
 *                CSP, a network hop, and an independent deploy to keep in sync.
 *   remoteDom    the HOST renders it with its own components. Maximum visual
 *                consistency, least control.
 *
 * The tool registrations use @modelcontextprotocol/ext-apps/server so the same
 * server also satisfies MCP Apps hosts.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { registerAppTool, registerAppResource, RESOURCE_MIME_TYPE }
  from '@modelcontextprotocol/ext-apps/server';
import { createUIResource } from '@mcp-ui/server';
import cors from 'cors';
import express from 'express';
import { z } from 'zod';

const PORT = Number(process.env.PORT ?? 3001);
const INLINE_URI = 'ui://__APP_SLUG__/inline/v1';
const EXTERNAL_URI = 'ui://__APP_SLUG__/external/v1';

const server = new McpServer({ name: '__APP_TITLE__', version: '1.0.0' });

/**
 * The View. mcp-ui's own action protocol is used here because it reaches hosts
 * that predate the MCP Apps extension; on an MCP Apps host you would use the
 * ui/* JSON-RPC bridge instead. `intent` is preferred over `tool` when the same
 * UI ships to multiple hosts — it names what the user wants and lets the host
 * route it, instead of hardcoding a tool name.
 */
const INLINE_HTML = `
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" />
<style>
  body { margin:0; padding:16px; font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
         font-size:14px; color:#1a1a1a; background:transparent; }
  @media (prefers-color-scheme: dark) { body { color:#f4f4f5; } }
  .card { border:1px solid #d4d4d8; border-radius:10px; padding:16px; display:flex;
          flex-direction:column; gap:12px; }
  button { min-height:36px; padding:0 14px; font:inherit; font-weight:500; border-radius:8px;
           border:1px solid #d4d4d8; background:transparent; color:inherit; cursor:pointer; }
  button:focus-visible { outline:2px solid #2563eb; outline-offset:2px; }
</style></head>
<body>
  <div class="card">
    <h1 style="margin:0;font-size:16px">__APP_TITLE__</h1>
    <p id="out" aria-live="polite">Ready.</p>
    <div style="display:flex;gap:8px">
      <button type="button" id="act">Do the thing</button>
      <button type="button" id="docs">Open docs</button>
    </div>
  </div>
<script>
  // Announce readiness as early as possible, or the host's render data races
  // this listener.
  window.parent.postMessage({ type: 'ui-lifecycle-iframe-ready' }, '*');

  const out = document.getElementById('out');
  const pending = new Map();
  let nextId = 1;

  window.addEventListener('message', (event) => {
    if (event.source !== window.parent) return;      // required
    const msg = event.data;
    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'ui-lifecycle-iframe-render-data') {
      document.documentElement.dataset.theme = msg.payload?.renderData?.theme ?? 'light';
      return;
    }
    if (msg.type === 'ui-message-received' && pending.has(msg.messageId)) {
      out.textContent = 'Working…';
      return;
    }
    if (msg.type === 'ui-message-response' && pending.has(msg.messageId)) {
      const entry = pending.get(msg.messageId);
      pending.delete(msg.messageId);
      // Always check error before response.
      if (msg.payload?.error) entry.reject(msg.payload.error);
      else entry.resolve(msg.payload?.response);
    }
  }, { passive: true });

  function send(type, payload) {
    const messageId = String(nextId++);
    window.parent.postMessage({ type, messageId, payload }, '*');
    return new Promise((resolve, reject) => {
      pending.set(messageId, { resolve, reject });
      // A ui-message-received with no following response means the host accepted
      // and then failed. Degrade rather than hang.
      setTimeout(() => {
        if (pending.delete(messageId)) reject(new Error('Host did not respond.'));
      }, 15000);
    });
  }

  document.getElementById('act').onclick = async () => {
    try {
      // intent, not tool: the host routes it, so this View is not bound to one
      // server's tool names.
      const res = await send('intent', { intent: 'do-the-thing', params: {} });
      out.textContent = typeof res === 'string' ? res : 'Done.';
    } catch (e) {
      out.textContent = 'Could not complete that. ' + (e?.message ?? '');
    }
  };

  // Navigation is host-mediated. Never window.open from inside the iframe.
  document.getElementById('docs').onclick = () => {
    window.parent.postMessage(
      { type: 'link', payload: { url: 'https://mcpui.dev/' } }, '*');
  };
</script>
</body></html>`.trim();

const inlineResource = createUIResource({
  uri: INLINE_URI,
  content: { type: 'rawHtml', htmlString: INLINE_HTML },
  encoding: 'text',
  uiMetadata: {
    'preferred-frame-size': ['520px', '260px'],
    'initial-render-data': { theme: 'light' },
  },
});

const externalResource = createUIResource({
  uri: EXTERNAL_URI,
  // A <base> tag is injected so relative paths resolve inside the iframe.
  content: { type: 'externalUrl', iframeUrl: 'https://example.com/__APP_SLUG__/embed' },
  encoding: 'text',
});

// --- registrations ---------------------------------------------------------

// Registered one by one rather than in a loop: the URI literal has to be
// visible at the registration site, both for readers and for static validators
// that check every referenced ui:// resolves to a registered resource.

registerAppResource(
  server,
  '__APP_SLUG__-inline-ui',
  INLINE_URI,
  { mimeType: RESOURCE_MIME_TYPE },
  async () => ({
    contents: [
      {
        ...inlineResource.resource,
        // CSP for MCP Apps hosts. The inline View bundles everything, so both
        // allowlists stay empty; the external variant below cannot.
        _meta: {
          ui: {
            prefersBorder: true,
            csp: { connectDomains: [], resourceDomains: [], frameDomains: [] },
          },
        },
      },
    ],
  }),
);

// Registered for comparison only — no tool points at it, so a validator will
// (correctly) call it an orphan. Point `show___APP_SNAKE__` here instead of at
// INLINE_URI to try the externalUrl delivery mode, or delete this block.
registerAppResource(
  server,
  '__APP_SLUG__-external-ui',
  EXTERNAL_URI,
  { mimeType: RESOURCE_MIME_TYPE },
  async () => ({
    contents: [
      {
        ...externalResource.resource,
        // externalUrl costs you an origin in every allowlist — one of the real
        // trade-offs against inlining.
        _meta: {
          ui: {
            csp: {
              connectDomains: ['https://example.com'],
              resourceDomains: ['https://example.com'],
              frameDomains: [],
            },
          },
        },
      },
    ],
  }),
);

registerAppTool(
  server,
  'show___APP_SNAKE__',
  {
    title: 'Show __APP_TITLE__',
    description:
      'Display the __APP_TITLE__ widget. Use when the user should see or act on ' +
      '__APP_TITLE__ directly rather than reading a summary.',
    inputSchema: {},
    outputSchema: { ready: z.boolean() },
    annotations: { readOnlyHint: true },
    _meta: { ui: { resourceUri: INLINE_URI } },
  },
  async () => ({
    content: [{ type: 'text', text: '__APP_TITLE__ is ready.' }],
    structuredContent: { ready: true },
  }),
);

// App-only: the View reaches this through an `intent` the host routes here. It
// stays out of the model's tool list and out of conversation context.
registerAppTool(
  server,
  'do_the_thing',
  {
    title: 'Do the thing',
    description: 'Perform the widget action. Called by the widget, not the model.',
    inputSchema: { note: z.string().max(500).optional() },
    outputSchema: { ok: z.boolean() },
    _meta: { ui: { visibility: ['app'] } },
  },
  async ({ note }) => ({
    structuredContent: { ok: true },
    content: [{ type: 'text', text: note ? `Done: ${note}` : 'Done.' }],
  }),
);

const app = express();
app.use(cors());
app.use(express.json());
app.post('/mcp', async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  res.on('close', () => transport.close());
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});
app.listen(PORT, () => console.log(`__APP_TITLE__ on http://localhost:${PORT}/mcp`));
