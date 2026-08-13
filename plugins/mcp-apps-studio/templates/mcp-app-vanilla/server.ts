/**
 * __APP_TITLE__ — MCP Apps server (vanilla View, no framework).
 *
 * Same two-registration pattern as the React template; only the View differs.
 * See ../mcp-app-react/server.ts for the fully annotated version.
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

const PORT = Number(process.env.PORT ?? 3001);
const RESOURCE_URI = 'ui://__APP_SLUG__/v1.html';

const server = new McpServer({ name: '__APP_TITLE__', version: '1.0.0' });

// Data tool — no resourceUri, so calling it never remounts the widget.
registerAppTool(
  server,
  'get___APP_SNAKE__',
  {
    title: 'Get __APP_TITLE__ data',
    description:
      'Fetch the current __APP_TITLE__ data as structured content. ' +
      'Use when the user asks for the current value or state. ' +
      'Call render___APP_SNAKE__ afterwards to display it.',
    inputSchema: {},
    outputSchema: { value: z.string(), updatedAt: z.string() },
    annotations: { readOnlyHint: true, idempotentHint: true },
  },
  async () => {
    const value = new Date().toISOString();
    return {
      structuredContent: { value, updatedAt: value },
      content: [{ type: 'text', text: `Current value: ${value}` }],
    };
  },
);

// Render tool — owns the template, performs no I/O.
registerAppTool(
  server,
  'render___APP_SNAKE__',
  {
    title: 'Render __APP_TITLE__',
    description:
      'Render the __APP_TITLE__ widget from prepared data. ' +
      'Call get___APP_SNAKE__ first and pass its value here.',
    inputSchema: { value: z.string().max(500) },
    outputSchema: { value: z.string() },
    annotations: { readOnlyHint: true },
    _meta: { ui: { resourceUri: RESOURCE_URI } },
  },
  async ({ value }) => ({
    structuredContent: { value },
    content: [{ type: 'text', text: `Showing: ${value}` }],
  }),
);

registerAppResource(
  server,
  '__APP_SLUG__-ui',
  RESOURCE_URI,
  { mimeType: RESOURCE_MIME_TYPE },
  async () => ({
    contents: [
      {
        uri: RESOURCE_URI,
        mimeType: RESOURCE_MIME_TYPE,
        text: await fs.readFile(path.join(import.meta.dirname, 'dist', 'mcp-app.html'), 'utf-8'),
        // CSP lives in the contents _meta, never in the config argument above.
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
