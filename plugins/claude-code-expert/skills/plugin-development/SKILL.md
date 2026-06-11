---
name: plugin-development
description: Build, validate, and publish Claude Code plugins — manifest schema, skill/command/agent/hook authoring, MCP server integration, marketplace publishing, version management. Use this skill whenever creating a new plugin, adding a skill/command/agent to an existing plugin, validating plugin.json, debugging plugin load failures, or publishing to a marketplace. Triggers on: "create plugin", "plugin.json", "add skill to plugin", "publish plugin", "plugin validation", "marketplace", "plugin manifest", "my plugin isn't loading".
---

# Plugin Development

Claude Code plugins are git-versioned bundles of skills, commands, agents, hooks, and MCP servers installable via `.claude/marketplaces/`. This skill covers the full authoring lifecycle.

## Anatomy

```
my-plugin/
├── .claude-plugin/
│   └── plugin.json           # manifest (required)
├── CLAUDE.md                  # plugin-level instructions
├── skills/
│   └── {skill-name}/
│       ├── SKILL.md
│       └── references/
├── commands/
│   └── {command-name}.md
├── agents/
│   └── {agent-name}.md
├── hooks/
│   └── {hook-name}.sh
├── mcp-server/               # optional
│   ├── src/index.js
│   └── package.json
└── README.md
```

## plugin.json — the manifest

Minimum required fields:

```json
{
  "$schema": "https://claude.local/schemas/plugin.schema.json",
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "Short description under 200 chars.",
  "author": { "name": "You" },
  "license": "MIT"
}
```

Recommended additions:

```json
{
  "repository": "https://github.com/you/my-plugin",
  "keywords": ["claude-code", "..."],
  "permissions": { "requires": ["read", "write"], "optional": ["bash", "network"] },
  "capabilities": { "provides": ["..."], "requires": [] },
  "context": {
    "entry": "CONTEXT_SUMMARY.md",
    "title": "My Plugin",
    "summary": "≤400 words",
    "maxTokens": 700
  }
}
```

## Authoring a skill

Follow the skill-creator canonical spec:

1. **Frontmatter description is the trigger** — be specific and "pushy" (name ≥3 contexts where it should fire).
2. **Body ≤ 500 lines** (per skill-creator guidance).
3. **Deep reference content** goes in `references/` subdir — Claude loads on demand.
4. **MCP delegation table**: if your skill has heavy reference data, move it to an MCP tool.

Template in `plugin-architect` agent.

## Authoring a command

Commands live in `commands/{name}.md`. Frontmatter:

```yaml
---
description: What the command does, under 200 chars.
---

# /command-name

## Usage
...

## Flags
...
```

The command body is plain markdown executed as a prompt when the user runs `/plugin-name:command-name`.

## Authoring an agent

```yaml
---
name: agent-name
description: When to invoke; ≥3 trigger phrases.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
---

# Agent Name

## Role
...

## Approach
...

## Output format
...
```

Tool restrictions enforce agent scope — an auditor agent shouldn't be able to `Write`, a research agent doesn't need `Bash`.

## Validation

Run `plugin-validator` agent on any new/modified plugin. Checks:
- Manifest JSON schema conformance
- Required fields present
- Version is semver
- All referenced skills/commands/agents/hooks exist
- Skill descriptions non-empty and specific
- Agent `allowed-tools` are real tool names
- Hook scripts have shebang + are executable

## Publishing

Plugins live in git repos. Users install via marketplace:

```bash
/plugin marketplace add https://github.com/org/marketplace-repo
/plugin install my-plugin
```

For personal plugins, skip the marketplace — `git clone` into `~/.claude/plugins/` directly.

## Version management

Semver. Breaking changes = major bump. New capabilities = minor. Bug fixes = patch.

Include `CHANGELOG.md` with a section per version. `plugin.json` version must match the top CHANGELOG entry.

## MCP delegation

| Need | Tool |
|---|---|
| Settings schema for plugin config | `cc_docs_settings_schema` |
| Plugin-development troubleshooting | `cc_docs_troubleshoot("plugin")` |
| Model for authoring | `cc_docs_model_recommend("write plugin skill")` |

## Anti-patterns

- Skills with empty or template-leaked descriptions → don't trigger; dead weight.
- Manifests that reference missing files → plugin fails to load silently.
- Hooks without `set -euo pipefail` → mask errors.
- Agents with `allowed-tools: ["*"]` → defeats tool restriction.
- Version number not bumped on a release → users don't pick up updates.

## Reference

- [manifest-schema.md](references/manifest-schema.md) — full plugin.json schema with examples
