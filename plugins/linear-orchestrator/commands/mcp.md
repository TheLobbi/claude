---
name: linear:mcp
intent: Install, configure, and operate the Linear MCP server for Claude Code
tags:
  - linear-orchestrator
  - command
  - mcp
inputs:
  - action
risk: low
cost: low
description: Linear MCP integration (linear.app/docs/mcp)
---

# /linear:mcp

Linear publishes an official MCP server. This command wraps install + tool routing.

## Actions

### `install [--scope user|project]`
- Adds Linear MCP to `.mcp.json` (project) or `~/.claude/mcp.json` (user)
- Server runs via `npx @linear/mcp` with `LINEAR_API_KEY` from env or `LINEAR_OAUTH_*` for actor mode

### `configure`
- Sets allow-list of tools to expose (default: all)
- Configures rate-limit hints (passes complexity-budget header)

### `tools`
- Lists tools provided by Linear's MCP server (issues, comments, cycles, projects, etc.)
- Useful for verifying installation

### `call <tool> [--args <json>]`
- Direct invocation passthrough — for scripting / testing

## Routing strategy
Many operations have **two paths**: this plugin's commands (which use the GraphQL client directly) OR the Linear MCP tools.

| Use this plugin's commands when... | Use Linear MCP when... |
|------------------------------------|------------------------|
| Need bridge behaviour (Harness/Planner) | Plain CRUD with no fan-out |
| Need bulk ops with rate-limit awareness | Single-shot actions |
| Need OAuth actor mode | API-key auth is fine |
| Custom GraphQL queries | Standard CRUD |

The plugin defaults to its own commands when both bridges are enabled, and falls back to MCP otherwise.
