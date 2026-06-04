---
name: claude-code-expert:cc-channels
intent: Install event-driven channel servers — CI webhook receiver, mobile approval relay, Discord bridge, fakechat dev profile. Integrates with MCP cc_kb_channel_server.
tags:
  - claude-code-expert
  - command
  - cc-channels
inputs: []
risk: medium
cost: medium
description: Install event-driven channel servers — CI webhook receiver, mobile approval relay, Discord bridge, fakechat dev profile. Integrates with MCP cc_kb_channel_server.
---

# /cc-channels — Event-Driven MCP Channels

Channels are MCP servers that receive external events (webhooks, messages) and expose them to Claude as tools.

## Usage

```bash
/cc-channels list                   # Installed + available patterns
/cc-channels bootstrap <pattern>    # Install a channel server
/cc-channels status                 # Running channel status
/cc-channels test <name>            # Send test event through a channel
/cc-channels pair <code>            # Confirm device pairing (mobile/Discord)
/cc-channels security               # Audit registered channels
```

## Patterns

Fetch full source via `cc_kb_channel_server(pattern)`:

| Pattern | Use |
|---|---|
| `ci-webhook` | Receive GitHub Actions events — HMAC-verified, severity-tagged |
| `mobile-approval` | Telegram permission relay (Claude Code v2.1.81+) |
| `discord-bridge` | Two-way Discord ↔ Claude with discord_reply tool |
| `fakechat` | Local dev channel; test flows without external setup |

## Bootstrap flow

1. Pick a pattern.
2. `bootstrap <pattern>`:
   - Fetches server source via MCP.
   - Writes to `.claude/channels/{pattern}/src/index.ts`.
   - Writes `package.json` with deps.
   - Updates `.mcp.json` to register the server.
   - Prints per-pattern setup instructions (ngrok / Cloudflare Tunnel / bot tokens / etc.).

## Security audit (`security`)

Checks each registered channel for:
- Allowlist configured (ALLOWLIST env var or file-based)
- Secrets in env vars, not in `.mcp.json`
- HMAC verification enabled where applicable
- `.gitignore` covers secrets, logs
- Port binding: localhost only unless tunneled

## Pairing flow

For mobile/Discord channels:

1. User initiates pairing in the channel client (send a pair code).
2. Channel server displays pairing code on stderr.
3. User runs `/cc-channels pair <code>` to confirm.
4. Channel server persists the paired chat/channel ID.

Pairing codes expire in 5 minutes by default.

## Cost note

Channel servers add always-loaded MCP tools. Each tool's schema consumes context tokens every turn. Only enable channels you actually use.
