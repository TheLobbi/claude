---
name: linear:setup
intent: Configure Linear authentication (API key + OAuth 2.0 + actor authorization), install Linear MCP server, register webhooks, and wire up Harness/Planner bridges
tags:
  - linear-orchestrator
  - command
  - setup
  - auth
  - oauth
inputs:
  - mode
risk: medium
cost: low
description: One-shot Linear setup — auth, MCP, webhooks, and bridges to Harness Code and Microsoft Planner
---

# /linear:setup

Configures the plugin end-to-end. Idempotent — re-runnable.

## Modes

### `--mode apikey`
- Prompts for `LINEAR_API_KEY` (Personal API key from https://linear.app/settings/api)
- Stores via `secrets:set` (never written to disk)
- Validates with a `viewer { id name email }` query

### `--mode oauth`
- Registers OAuth client at https://linear.app/settings/api/applications
- Sets `LINEAR_OAUTH_CLIENT_ID` + `LINEAR_OAUTH_CLIENT_SECRET`
- Walks user through redirect flow (`https://linear.app/oauth/authorize?...`)
- Exchanges code → access + refresh tokens
- Optionally requests `actor=user` or `actor=app` scope
- See: https://linear.app/developers/oauth-2-0-authentication and https://linear.app/developers/oauth-actor-authorization

### `--mode mcp`
- Installs Linear's official MCP server: https://linear.app/docs/mcp
- Adds entry to `~/.claude/mcp.json` (or project `.mcp.json`):
  ```json
  {
    "mcpServers": {
      "linear": {
        "command": "npx",
        "args": ["-y", "@linear/mcp"],
        "env": { "LINEAR_API_KEY": "${LINEAR_API_KEY}" }
      }
    }
  }
  ```

### `--mode webhook`
- Generates a fresh `LINEAR_WEBHOOK_SECRET`
- Registers webhook via GraphQL `webhookCreate` mutation
- Subscribes to: `Issue`, `IssueLabel`, `Comment`, `Cycle`, `Project`, `ProjectUpdate`, `Initiative`, `Customer`, `Reaction`
- Returns webhook ID + verification status

### `--mode bridges`
- Asks for Harness Code creds (`HARNESS_API_TOKEN`, `HARNESS_ACCOUNT_ID`, optional `HARNESS_ORG_ID`, `HARNESS_PROJECT_ID`)
- Asks for MS Graph creds (`GRAPH_CLIENT_ID`, `GRAPH_CLIENT_SECRET`, `GRAPH_TENANT_ID`)
- Tests both with a read call before storing
- Persists bridge config to `lib/state.ts` (cursor + plan/repo IDs)

### `--mode all` (default)
Runs the above in order, with confirmations.

## Outputs
- A `setup-report.json` summarising what was configured + any failures
- A short markdown summary printed to the user

## Failure modes
- 401 from Linear → token wrong; re-prompt
- 403 from Linear webhook create → OAuth scope missing `webhook:create`
- Harness 401 → token expired or wrong account
- Graph 403 → app lacks `Tasks.ReadWrite.All` admin consent

Always degrade gracefully — bridges are optional; Linear-only mode still works.
