#!/usr/bin/env node
/**
 * design-styles MCP server (stdio, newline-delimited JSON-RPC 2.0, zero dependencies).
 *
 * Tools: list_style_categories, search_styles, get_style, generate_chakra_system,
 *        generate_tokens, check_contrast.
 * Env:   DESIGN_STYLES_PATH  optional JSON extending the catalog and profiles.
 *
 * stdout carries protocol messages only; diagnostics go to stderr.
 */
import { createInterface } from "node:readline";
import { loadCatalog } from "./catalog.js";
import { TOOL_DEFS, createHandlers } from "./tools.js";

const SERVER_INFO = { name: "design-styles", version: "1.0.0" };
const SUPPORTED_PROTOCOLS = ["2025-06-18", "2025-03-26", "2024-11-05"];

export function createServer(catalog = loadCatalog()) {
  const handlers = createHandlers(catalog);

  const callTool = (params) => {
    const handler = handlers[params?.name];
    if (!handler) return { content: [{ type: "text", text: `Unknown tool: ${params?.name}` }], isError: true };
    try {
      const out = handler(params.arguments ?? {});
      const text = typeof out === "string" ? out : JSON.stringify(out, null, 2);
      return { content: [{ type: "text", text }] };
    } catch (e) {
      return { content: [{ type: "text", text: e.message }], isError: true };
    }
  };

  /** Returns a response object for requests, undefined for notifications. */
  return function handle(msg) {
    const isRequest = msg && typeof msg === "object" && msg.id !== undefined && msg.id !== null;
    const ok = (result) => ({ jsonrpc: "2.0", id: msg.id, result });
    const fail = (code, message) => ({ jsonrpc: "2.0", id: msg.id ?? null, error: { code, message } });
    if (!msg || typeof msg.method !== "string") return isRequest ? fail(-32600, "Invalid request") : undefined;
    if (!isRequest) return undefined;

    switch (msg.method) {
      case "initialize": {
        const asked = msg.params?.protocolVersion;
        return ok({
          protocolVersion: SUPPORTED_PROTOCOLS.includes(asked) ? asked : SUPPORTED_PROTOCOLS[0],
          capabilities: { tools: {} },
          serverInfo: SERVER_INFO,
        });
      }
      case "ping":
        return ok({});
      case "tools/list":
        return ok({ tools: TOOL_DEFS });
      case "tools/call":
        return ok(callTool(msg.params));
      default:
        return fail(-32601, `Method not found: ${msg.method}`);
    }
  };
}

function main() {
  const handle = createServer();
  const send = (obj) => process.stdout.write(JSON.stringify(obj) + "\n");
  const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
  rl.on("line", (line) => {
    if (!line.trim()) return;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
      return;
    }
    const batch = Array.isArray(msg) ? msg : [msg];
    const replies = batch.map(handle).filter(Boolean);
    if (replies.length) send(Array.isArray(msg) ? replies : replies[0]);
  });
  rl.on("close", () => process.exit(0));
}

import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) main();
