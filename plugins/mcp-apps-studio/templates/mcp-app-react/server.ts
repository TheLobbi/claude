/**
 * __APP_TITLE__ — MCP Apps server.
 *
 * Two registrations, tied by one ui:// URI:
 *   · a UI resource serving the bundled single-file View
 *   · a RENDER tool whose _meta.ui.resourceUri points at it
 *
 * Data tools deliberately carry NO resourceUri. Attaching a template to a tool
 * the model calls repeatedly makes the host remount the iframe on every call,
 * which destroys local state and wastes a round trip.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  registerAppTool,
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from '@modelcontextprotocol/ext-apps/server';
import cors from 'cors';
import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';

import { ItemSchema, type Item } from './src/schema.js';

const PORT = Number(process.env.PORT ?? 3001);

/**
 * Hosts treat this URI as a cache key. A breaking change to the HTML, JS, or CSS
 * means publishing a NEW URI and repointing every tool — otherwise live
 * conversations keep rendering the old View indefinitely.
 */
const RESOURCE_URI = 'ui://__APP_SLUG__/v1.html';

const server = new McpServer({ name: '__APP_TITLE__', version: '1.0.0' });

// ---------------------------------------------------------------------------
// Data layer — replace with your real source.
// ---------------------------------------------------------------------------

async function fetchItems(query: string, limit: number): Promise<Item[]> {
  return Array.from({ length: Math.min(limit, 8) }, (_, i) => ({
    id: `item-${i + 1}`,
    title: `${query} result ${i + 1}`,
    subtitle: 'Replace fetchItems() with your real data source.',
    status: i % 3 === 0 ? 'pending' : 'ready',
  }));
}

// ---------------------------------------------------------------------------
// 1. Data tool — no resourceUri. Chainable; the model can inspect and refine.
// ---------------------------------------------------------------------------

registerAppTool(
  server,
  'search___APP_SNAKE__',
  {
    title: 'Search __APP_TITLE__',
    description:
      'Search __APP_TITLE__ and return matching items as structured data. ' +
      'Use when the user asks to find, list, or filter items. ' +
      'Returns ids and metadata only — call render___APP_SNAKE__ afterwards to display them. ' +
      'Do not call again for follow-up filtering you can perform on the results you already have.',
    inputSchema: {
      query: z.string().min(1).max(200).describe('Free-text search query.'),
      limit: z.number().int().min(1).max(50).default(20).describe('Maximum items to return.'),
    },
    outputSchema: {
      query: z.string(),
      items: z.array(ItemSchema),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  },
  async ({ query, limit }) => {
    const items = await fetchItems(query, limit);
    return {
      structuredContent: { query, items },
      // `content` is what a text-only host and the model read. Never omit it —
      // a tool whose only useful output is rendered pixels is a broken tool.
      content: [
        {
          type: 'text',
          text: `Found ${items.length} item(s) for "${query}": ${items.map((i) => i.title).join(', ')}.`,
        },
      ],
    };
  },
);

// ---------------------------------------------------------------------------
// 2. Render tool — owns the template, does no I/O.
// ---------------------------------------------------------------------------

registerAppTool(
  server,
  'render___APP_SNAKE__',
  {
    title: 'Render __APP_TITLE__',
    description:
      'Render the __APP_TITLE__ widget from already-prepared items. ' +
      'Always call search___APP_SNAKE__ first and pass its items here, ' +
      'optionally filtered down to what the user actually asked about. ' +
      'Use when the user should visually scan or act on the results.',
    inputSchema: {
      query: z.string().max(200),
      items: z.array(ItemSchema).max(50),
    },
    outputSchema: {
      query: z.string(),
      items: z.array(ItemSchema),
    },
    annotations: { readOnlyHint: true },
    _meta: { ui: { resourceUri: RESOURCE_URI } },
  },
  async ({ query, items }) => ({
    structuredContent: { query, items },
    content: [{ type: 'text', text: `Showing ${items.length} item(s) for "${query}".` }],
  }),
);

// ---------------------------------------------------------------------------
// 3. App-only tool — the View calls this directly for local interactions so the
//    widget updates in place instead of remounting, and it stays out of the
//    model's tool list and the conversation context.
// ---------------------------------------------------------------------------

registerAppTool(
  server,
  'refresh___APP_SNAKE__',
  {
    title: 'Refresh items',
    description: 'Re-fetch items for the current query. Called by the widget, not by the model.',
    inputSchema: {
      query: z.string().min(1).max(200),
      limit: z.number().int().min(1).max(50).default(20),
    },
    outputSchema: {
      query: z.string(),
      items: z.array(ItemSchema),
    },
    annotations: { readOnlyHint: true, idempotentHint: true },
    _meta: { ui: { visibility: ['app'] } },
  },
  async ({ query, limit }) => {
    const items = await fetchItems(query, limit);
    return {
      structuredContent: { query, items },
      content: [{ type: 'text', text: `Refreshed: ${items.length} item(s).` }],
    };
  },
);

// ---------------------------------------------------------------------------
// 4. The UI resource.
// ---------------------------------------------------------------------------

registerAppResource(
  server,
  '__APP_SLUG__-ui',
  RESOURCE_URI,
  { mimeType: RESOURCE_MIME_TYPE },
  async () => {
    const html = await fs.readFile(
      path.join(import.meta.dirname, 'dist', 'mcp-app.html'),
      'utf-8',
    );
    return {
      contents: [
        {
          uri: RESOURCE_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: html,
          // CSP belongs HERE, in the contents _meta — not in the config argument
          // above. Misplaced, it silently blocks every network call at runtime.
          // Deny-by-default: add an origin only when the View provably needs it.
          _meta: {
            ui: {
              prefersBorder: true,
              csp: {
                connectDomains: [],
                resourceDomains: [], // everything is inlined by vite-plugin-singlefile
                frameDomains: [],
                baseUriDomains: [],
              },
            },
          },
        },
      ],
    };
  },
);

// ---------------------------------------------------------------------------
// Transport.
// ---------------------------------------------------------------------------

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

app.listen(PORT, () => {
  console.log(`__APP_TITLE__ MCP server on http://localhost:${PORT}/mcp`);
  console.log(`UI resource: ${RESOURCE_URI}`);
});
