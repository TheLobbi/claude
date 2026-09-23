# Repository configuration

[AGENTS.md](../AGENTS.md) holds contributor guidance;
[CLAUDE.md](CLAUDE.md) imports it for Claude Code.

The commands, agents, skills, and nested plugins here are callable product
content. Inspect their registries and consumers before changing them.

| Path | Purpose |
| --- | --- |
| [commands/](commands/) | Local slash commands |
| [agents/](agents/) | Agent definitions |
| [skills/](skills/) | Reusable task procedures |
| [plugins/](plugins/) | Nested plugin sources |
| [registry/](registry/) | Lookup metadata |
| [hooks/](hooks/) | Lifecycle scripts |
| [mcp-servers/](mcp-servers/) | Local MCP implementations |
| [rules/](rules/) | Scoped rules and hook-backed memory |

[settings.json](settings.json) registers lifecycle hooks.
[../.mcp.json](../.mcp.json) registers MCP servers. The
`lessons-learned-capture.sh` hook and lessons-learned server use
`rules/lessons-learned.md`; it is a live data input, not a static instruction
catalog. See [hooks/README.md](hooks/README.md) for hook details.
