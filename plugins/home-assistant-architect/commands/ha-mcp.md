---
name: home-assistant-architect:ha-mcp
intent: Home Assistant MCP Command
tags:
  - home-assistant-architect
  - command
  - ha-mcp
inputs: []
risk: medium
cost: medium
description: Configure and manage MCP server integration for Claude with Home Assistant.
---

# Home Assistant MCP Command

Configure and manage MCP server integration for Claude with Home Assistant.

## Usage

```
/ha-mcp <action> [options]
```

## Actions

| Action | Description |
|--------|-------------|
| setup | Setup MCP server for Claude |
| status | Check MCP server status |
| test | Test MCP connection |
| tools | List available MCP tools |
| config | Show/update configuration |

## Examples

```bash
# Setup MCP server
/ha-mcp setup

# Check status
/ha-mcp status

# Test connection
/ha-mcp test

# List tools
/ha-mcp tools
```

## Implementation

```markdown
You are an MCP Integration Specialist. Configure MCP server for Claude Desktop integration with Home Assistant.

## Environment
- HA_URL: ${HA_URL}
- HA_TOKEN: ${HA_TOKEN}

## Setup Options

### Option 1: Official HA MCP Server (HA 2025.2+)

1. Install MCP Server integration in HA
2. Configure Claude Desktop connector
3. Authorize with OAuth or token

Configuration in Settings > Devices & Services > Add Integration > Model Context Protocol Server

### Option 2: hass-mcp (Community)

```bash
# Using Docker
docker pull voska/hass-mcp:latest
```

Claude Desktop config:
```json
{
  "mcpServers": {
    "hass-mcp": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-e", "HA_URL", "-e", "HA_TOKEN", "voska/hass-mcp"],
      "env": {
        "HA_URL": "http://homeassistant.local:8123",
        "HA_TOKEN": "YOUR_TOKEN"
      }
    }
  }
}
```

### Option 3: Claude Code CLI

```bash
claude mcp add hass-mcp \
  -e HA_URL=http://homeassistant.local:8123 \
  -e HA_TOKEN=YOUR_TOKEN \
  -- docker run -i --rm -e HA_URL -e HA_TOKEN voska/hass-mcp
```

## Available MCP Tools

| Tool | Description |
|------|-------------|
| get_entity | Get entity state |
| entity_action | Control entity (on/off/toggle) |
| list_entities | List entities by domain |
| search_entities | Search for entities |
| call_service | Call any HA service |
| get_history | Get entity history |
| list_automations | List automations |
| get_error_log | Get error logs |

## Testing

1. Verify HA connection
2. Test entity listing
3. Test device control
4. Check error handling
```

## Output

MCP configuration and connection status.
