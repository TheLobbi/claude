---
name: mcp
description: Configure MCP servers for Claude Code — stdio vs HTTP, authentication, Tools/Resources/Prompts distinction, channels (CI webhook, mobile relay, Discord bridge, fakechat), and cost of always-loaded tools. Use this skill whenever adding an MCP server, debugging connection issues, choosing between MCP Tools vs Prompts vs Resources, installing channel servers, or managing .mcp.json. Triggers on: "MCP server", "mcp config", "add Obsidian MCP", "install context7", "channels", "webhook receiver", "mobile approval", "Discord bridge", "mcp not connecting".
---

# MCP

Model Context Protocol servers extend Claude Code with tools, resources, and prompts. This skill covers selection, configuration, and the three server primitives.

## The three primitives

| Primitive | Loaded when | Use for |
|---|---|---|
| **Tools** | Always (metadata in context) | Actions Claude can take (read/write/query) |
| **Resources** | On request | Static content Claude can list and fetch |
| **Prompts** | On request | Pre-composed conversation starters for complex workflows |

**Cost model:** historically every tool's name + description + JSON schema consumed context every turn. As of 2026, Claude Code **defers tool schemas by default** and discovers them via `ToolSearch` (see below), so the per-turn drain is mostly limited to built-ins and `alwaysLoad` servers. Still prefer **MCP Prompts/Resources** for heavy reference material Claude loads only when asked.

## Configuration files

| File | Scope | When |
|---|---|---|
| `~/.claude/mcp.json` (or equivalent) | Global | Servers you want in every project |
| `.mcp.json` (in repo root) | Project | Servers specific to this repo |
| `.mcp.local.json` | Personal override | User-local, gitignored |

Project-scoped is almost always better — avoids global context cost when you're not in that project.

## Transports

| Transport | When |
|---|---|
| `stdio` | Local servers; fastest; the default for plugin/child-process servers |
| `http` | Remote servers — **recommended** for cloud-hosted MCPs; supports OAuth and async reconnection |
| `sse` | Legacy remote transport, **deprecated** in favor of `http`; no OAuth |

Declare the transport explicitly with `"type": "http" | "stdio" | "sse"` in the server entry. HTTP/SSE servers use `url` (+ optional `headers`/`oauth`); stdio servers use `command`/`args`/`env`.

## Tool Search & deferred tools

As of 2026, Claude Code **defers MCP tool schemas by default** instead of loading every tool's name + description + JSON schema into context up front. Claude discovers tools on demand via the built-in **`ToolSearch`** tool, then calls them normally. This is what lets a session connect to dozens of MCP servers (thousands of tools) without drowning the context window.

- **Default behavior**: a connecting server's tools appear by *name only*; their schemas load when `ToolSearch` matches them to the task.
- **Force a server's tools to always load** (skip deferral): set `"alwaysLoad": true` on the server entry — use only for small, always-needed servers.
- **Disable globally**: `ENABLE_TOOL_SEARCH=false` (rarely worth it — you trade context for eager loading). With deferral off, `WaitForMcpServers` is available to block until background servers finish connecting.
- **Output caps**: large tool results are truncated at a default token ceiling; raise it per session with `MAX_MCP_OUTPUT_TOKENS`.

Implication for this plugin's design: the old "every tool costs context every turn" math is now mostly paid only for `alwaysLoad` servers and built-ins. Still prefer **MCP Prompts/Resources** for heavy reference material, but the deferral default means a few extra servers are no longer the liability they once were.

## Top recommendations (every project)

| Server | Why |
|---|---|
| `context7` | Library documentation lookup — always up-to-date |
| `engram` (already global) | Persistent memory across sessions |
| This plugin's MCP (15 docs + 7 KB tools) | Claude Code expertise |

## Recommendations by stack

Use `cc_docs_hook_pack_recommend` / `cc_docs_team_topology_recommend` style logic:

| Stack signal | Server |
|---|---|
| PostgreSQL | `@modelcontextprotocol/server-postgres` |
| GitHub Actions / .github/ | `@modelcontextprotocol/server-github` |
| Playwright config | `@playwright/mcp` |
| Sentry DSN | sentry MCP |
| Slack token | slack MCP |
| Obsidian vault | Obsidian MCP (Local REST API) |

## Obsidian MCP — first-class integration

The user's vault is at `C:/Users/MarkusAhling/obsidian/`. If the Local REST API plugin is installed in Obsidian, expose it via:

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "npx",
      "args": ["-y", "obsidian-mcp-server"],
      "env": { "OBSIDIAN_API_URL": "http://127.0.0.1:27123", "OBSIDIAN_API_KEY": "..." }
    }
  }
}
```

Claude then reads/writes vault notes via `mcp__obsidian__*` tools — used extensively by the memory-consolidator (tier 2 writes).

## Channels (event-driven MCPs)

Channels are MCP servers that receive external events (webhooks, messages) and expose them to Claude. Four patterns:

| Pattern | Use |
|---|---|
| `ci-webhook` | Receive GitHub Actions events via webhook with HMAC verification |
| `mobile-approval` | Telegram-based permission relay (requires Claude Code v2.1.81+) |
| `discord-bridge` | Two-way Discord ↔ Claude with discord_reply tool |
| `fakechat` | Built-in local dev channel for testing channel flows |

Fetch implementation via `cc_kb_channel_server(name)` — returns full TypeScript source.

## Debugging connection issues

1. **Server doesn't start**: check stdin/stdout isn't polluted by logging. MCP servers must write logs to stderr only.
2. **Server crashes silently**: run the command manually (`npx -y server-name`) to see stderr.
3. **Tools not visible to Claude**: check `capabilities.tools` is declared in server init, and `ListToolsRequestSchema` handler exists.
4. **Slow tool calls**: check for synchronous file I/O or network calls in hot paths.

## MCP delegation

| Need | Tool |
|---|---|
| Fetch channel server code | `cc_kb_channel_server(pattern)` |
| Settings schema reference | `cc_docs_settings_schema` |
| General MCP troubleshooting | `cc_docs_troubleshoot("mcp")` |

## Anti-patterns

- 20+ MCP servers globally → 50k+ tokens passive context cost.
- Putting secrets in `.mcp.json` → commits leak keys. Use env vars.
- stdin logging in an MCP server → breaks the protocol framing.
- Same MCP server installed globally AND project-scoped → duplicate tool definitions.
- Skipping HMAC verification on webhook channels → anyone can spam your Claude.
