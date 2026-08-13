/**
 * __APP_TITLE__ — OpenAI Apps SDK server (Node/TypeScript).
 *
 * Standards-first: the portable MCP Apps fields carry the contract, and the
 * `openai/*` aliases are dual-written so existing ChatGPT integrations keep
 * working during rollout. The View layers ChatGPT-only capabilities on top,
 * always feature-detected.
 *
 * Build the component first:
 *   npm --prefix web run build      # esbuild → web/dist/component.js
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { registerAppResource, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
import cors from 'cors';
import express from 'express';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

const PORT = Number(process.env.PORT ?? 3001);

/** Treat this as a cache key: breaking change to HTML/JS/CSS ⇒ new URI. */
const TEMPLATE_URI = 'ui://__APP_SLUG__/v1.html';

const server = new McpServer(
  { name: '__APP_TITLE__', version: '1.0.0' },
  { capabilities: { tools: {}, resources: {} } },
);

const ItemSchema = z.object({
  id: z.string().max(128),
  title: z.string().max(200),
  subtitle: z.string().max(400).optional(),
});

// ---------------------------------------------------------------------------
// Data tool — no template. Returns chainable structuredContent so the model can
// refine the set before anything renders.
// ---------------------------------------------------------------------------

server.registerTool(
  'search___APP_SNAKE__',
  {
    title: 'Search __APP_TITLE__',
    description:
      'Search __APP_TITLE__ and return matching items with ids and metadata. ' +
      'Use when the user wants to find or list items. ' +
      'Returns data only — call render___APP_SNAKE__ to display it.',
    inputSchema: {
      query: z.string().min(1).max(200),
      limit: z.number().int().min(1).max(50).default(20),
    },
    outputSchema: { query: z.string(), items: z.array(ItemSchema) },
    annotations: { readOnlyHint: true, idempotentHint: true },
    _meta: {
      // ChatGPT-only progress text; unsupported elsewhere, so the widget also
      // carries its own status.
      'openai/toolInvocation/invoking': 'Searching…',
      'openai/toolInvocation/invoked': 'Found results.',
    },
  },
  async ({ query, limit }) => {
    const items = Array.from({ length: Math.min(limit, 8) }, (_, i) => ({
      id: `item-${i + 1}`,
      title: `${query} result ${i + 1}`,
      subtitle: 'Replace with your real data source.',
    }));
    return {
      structuredContent: { query, items },
      content: [{ type: 'text', text: `Found ${items.length} item(s) for "${query}".` }],
    };
  },
);

// ---------------------------------------------------------------------------
// Render tool — the ONLY tool carrying the template.
// ---------------------------------------------------------------------------

server.registerTool(
  'render___APP_SNAKE__',
  {
    title: 'Render __APP_TITLE__',
    description:
      'Render the __APP_TITLE__ widget from prepared items. ' +
      'Always call search___APP_SNAKE__ first and pass its items here, ' +
      'filtered down to what the user actually asked about.',
    inputSchema: { query: z.string().max(200), items: z.array(ItemSchema).max(50) },
    outputSchema: { query: z.string(), items: z.array(ItemSchema) },
    annotations: { readOnlyHint: true },
    _meta: {
      ui: { resourceUri: TEMPLATE_URI },        // portable — every MCP Apps host
      'openai/outputTemplate': TEMPLATE_URI,    // ChatGPT compatibility alias
      'openai/visibility': ['model', 'app'],
    },
  },
  async ({ query, items }) => ({
    structuredContent: { query, items },
    content: [{ type: 'text', text: `Showing ${items.length} item(s) for "${query}".` }],
  }),
);

// ---------------------------------------------------------------------------
// Component resource — the esbuild bundle inlined into one HTML document.
// ---------------------------------------------------------------------------

const component = readFileSync(
  path.join(import.meta.dirname, 'web', 'dist', 'component.js'),
  'utf8',
);

registerAppResource(server, '__APP_SLUG__-ui', TEMPLATE_URI, {}, async () => ({
  contents: [
    {
      uri: TEMPLATE_URI,
      mimeType: RESOURCE_MIME_TYPE,
      text: `<div id="root"></div><script type="module">${component}</script>`,
      _meta: {
        ui: {
          prefersBorder: true,
          // Declare the exact origins the component uses. Nested frames are
          // blocked by default and unsupported on some hosts — leave empty.
          csp: { connectDomains: [], resourceDomains: [], frameDomains: [] },
        },
        'openai/widgetDescription': 'Displays __APP_TITLE__ results.',
      },
    },
  ],
}));

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
