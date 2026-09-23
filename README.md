# Claude Code plugin marketplace

Installable plugins for Claude Code, with commands, agents, skills, hooks, and
MCP integrations. Browse the current entries in
[the marketplace manifest](.claude-plugin/marketplace.json) or the generated
[catalog](site/); each plugin's README explains its capabilities and setup.

## Install

In Claude Code:

```text
/plugin marketplace add TheLobbi/claude
/plugin install <plugin-name>@claude-orchestration
```

## Develop

Use Node.js 20+ and pnpm:

```sh
pnpm install --frozen-lockfile
pnpm check:marketplace
pnpm check:site
pnpm exec tsc --noEmit
pnpm validate-archetype examples/archetypes/<name>/archetype.json
```

Add plugin sources to [the marketplace manifest](.claude-plugin/marketplace.json).
Validate manifest references, frontmatter, and MCP entry points with
`check:marketplace`; run the affected plugin's tests separately.
[AGENTS.md](AGENTS.md) records repository contracts and validation scope.

| Path | Purpose |
| --- | --- |
| [plugins/](plugins/) | Published plugin sources and their documentation |
| [.claude/](.claude/) | Local commands, skills, agents, hooks, and supporting tooling |
| [scripts/](scripts/) | Validation, indexing, routing, and catalog generation |
| [schemas/](schemas/) and [examples/](examples/) | Schemas and archetype examples |
| [docs/](docs/) | Cross-plugin references and decisions |
| [site/](site/) | Static catalog; `pnpm build:site` regenerates its data |

[Marketplace CI](.github/workflows/marketplace-ci.yml) defines checks and path
filters. [Pages](.github/workflows/pages.yml) publishes catalog changes from
`main`. First-time Pages setup requires a repository administrator to select
**Settings → Pages → Source: GitHub Actions**; the workflow skips deployment
until Pages is enabled.

## License

[MIT](LICENSE). Preserve any additional licenses shipped inside plugins.
