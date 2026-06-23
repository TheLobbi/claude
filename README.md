# Claude Code Plugin Marketplace

![License](https://img.shields.io/badge/License-MIT-green)
![Node](https://img.shields.io/badge/Node-20+-339933?logo=node.js)
![Plugins](https://img.shields.io/badge/Plugins-35-blue)

A curated marketplace of Claude Code plugins covering cloud infrastructure, enterprise SaaS, documentation intelligence, project management, frontend design systems, and more. Each plugin ships its own commands, skills, agents, and (where relevant) MCP servers.

**🌐 Browse the marketplace → [markus41.github.io/claude](https://markus41.github.io/claude/)** — a searchable catalog with live counts, category filters, and per-plugin detail. The site is generated directly from `marketplace.json` and deployed via GitHub Pages.

## Installation

Install the marketplace and then enable individual plugins through Claude Code:

```bash
# In Claude Code
/plugin install <plugin-name>
```

Or point Claude Code at this repository's `.claude-plugin/marketplace.json`:

```bash
/plugin marketplace add <url-to-this-repo>
```

## Plugins

| Plugin | Description |
|---|---|
| [`aws-eks-helm-keycloak`](./plugins/aws-eks-helm-keycloak) | AWS EKS deployments with Helm, Keycloak authentication, and Harness CI/CD |
| [`claude-code-expert`](./plugins/claude-code-expert) | Second brain for Claude Code — 22-tool MCP server, three-tier memory, orchestration patterns |
| [`claude-code-templating`](./plugins/claude-code-templating-plugin) | Scaffold new Claude Code projects from vetted templates |
| [`cowork-marketplace`](./plugins/cowork-marketplace) | Marketplace bundle for the Cowork platform |
| [`deployment-pipeline`](./plugins/deployment-pipeline) | Generic CI/CD pipeline generator with quality gates |
| [`dotnet-blazor`](./plugins/dotnet-blazor) | .NET and Blazor application development toolkit |
| [`drawio-diagramming`](./plugins/drawio-diagramming) | Generate and edit draw.io diagrams from code or specs |
| [`exec-automator`](./plugins/exec-automator) | Executive-director automation for trade associations and nonprofits |
| [`fastapi-backend`](./plugins/fastapi-backend) | Production FastAPI with MongoDB/Beanie, Keycloak, Docker, K8s |
| [`frontend-design-system`](./plugins/frontend-design-system) | 263+ design styles with multi-tenant Keycloak theming |
| [`fullstack-iac`](./plugins/fullstack-iac) | FastAPI + React + Ansible + Terraform + Kubernetes stack |
| [`jira-orchestrator`](./plugins/jira-orchestrator) | Enterprise Jira orchestration — 81 agents, 46 commands, Atlassian MCP |
| [`lobbi-platform-manager`](./plugins/lobbi-platform-manager) | Development on the-lobbi/keycloak-alpha with service orchestration |
| [`marketplace-pro`](./plugins/marketplace-pro) | Marketplace tooling, federation, and composition engine |
| [`mui-expert`](./plugins/mui-expert) | Material UI component expertise |
| [`project-management-plugin`](./plugins/project-management-plugin) | Interview-first PM with micro-task decomposition across 9 PM platforms (GitHub, Jira, Linear, Notion, Asana, Trello, ClickUp, Monday, Todoist) |
| [`react-animation-studio`](./plugins/react-animation-studio) | 12 animation skills: GSAP, Framer Motion, 3D, scroll, text, SVG |
| [`scrapin-aint-easy`](./plugins/scrapin-aint-easy) | Documentation intelligence, algorithm library, drift detection |
| [`team-accelerator`](./plugins/team-accelerator) | DevOps, code quality, and workflow automation for teams |
| [`tvs-microsoft-deploy`](./plugins/tvs-microsoft-deploy) | Microsoft Fabric, Dataverse, Power Platform deployments |
| [`upgrade-suggestion`](./plugins/upgrade-suggestion) | Intelligent dependency and framework upgrade recommendations |

Plus six sub-marketplace plugins available under `./.claude/plugins/`: `langgraph-architect`, `code-quality-orchestrator`, `api-integration-helper`, `dev-environment-bootstrap`, `migration-wizard`, `testforge`.

## CI Validation

Every pull request runs the `Marketplace CI` workflow, which validates:

- `.claude-plugin/marketplace.json` parses cleanly and every `source` resolves to a plugin manifest
- Every plugin's `plugin.json` has required fields (`name`, `version`, `description`, `author`)
- Every command/agent/skill/hook file referenced from a manifest exists and has YAML frontmatter
- No MCP server entry point references a gitignored build artifact (e.g., `dist/cli.js`)
- Every auto-discovered `.md` file under `commands/`, `agents/`, `hooks/`, and every `skills/*/SKILL.md` has YAML frontmatter
- TypeScript strict check passes on `scripts/` and `types/`
- Every archetype example in `examples/archetypes/` validates against the schema

Missing frontmatter is the most common cause of Claude Code cache errors — the CI validator catches this for every plugin before merge.

## Repository Layout

```
.
├── .claude-plugin/
│   └── marketplace.json        # Marketplace manifest (27 plugins)
├── plugins/                    # 22 installed plugins
├── .claude/
│   ├── plugins/                # 6 sub-marketplace plugins
│   ├── agents/                 # Platform-level agents
│   ├── skills/                 # Platform-level skills
│   ├── hooks/                  # Lifecycle hook scripts
│   ├── rules/                  # Behavioral rules (always loaded)
│   ├── registry/               # Plugin index and search metadata
│   └── mcp-servers/            # Custom MCP servers
├── scripts/                    # Plugin-dev tooling (validation, indexing)
├── schemas/                    # JSON Schemas for plugins and archetypes
├── docs/                       # Context and architecture documentation
└── examples/                   # Reference archetypes
```

## Plugin Development

Validate every plugin and the marketplace manifest before committing:

```bash
pnpm install
pnpm check:marketplace         # Validate marketplace + every plugin (the primary check)
npx tsc --noEmit               # Type-check scripts/ and types/
pnpm validate-archetype <file> # Validate an archetype example against the schema
pnpm profile:plugin-context    # Measure per-plugin context overhead
```

See [`plugins/claude-code-expert`](./plugins/claude-code-expert) for in-depth plugin authoring guidance.

## Marketplace Site

The public catalog at [markus41.github.io/claude](https://markus41.github.io/claude/) is a
self-contained static site under [`site/`](./site). Its plugin data is generated from
`.claude-plugin/marketplace.json` and the per-plugin manifests — counts never drift from the
source of truth.

```bash
pnpm build:site        # regenerate site/data/plugins.json from the manifest
# preview locally
npx serve site         # or: python3 -m http.server -d site 8080
```

The `Deploy GitHub Pages` workflow (`.github/workflows/pages.yml`) rebuilds the data and
publishes `site/` whenever the manifest, a plugin manifest, or the site changes on `main`.

**First-time setup (one-time):** enable Pages at
**Settings → Pages → Build and deployment → Source: _GitHub Actions_**. The workflow's
`GITHUB_TOKEN` can _deploy_ to Pages (`pages: write`) but cannot _create_ the Pages site —
that needs repo-admin, so the initial enablement must be done in the UI. Until then the
workflow detects the missing Pages site and **skips the deploy with a notice instead of
failing**, so `main` stays green. Once Pages is enabled, every push to `main` deploys
automatically (or re-run the workflow to publish immediately).

## Contributing

1. Scaffold a new plugin with the [`claude-code-templating`](./plugins/claude-code-templating-plugin) generator or copy an existing plugin as a template.
2. Add frontmatter (`description:` at minimum) to every command, skill, agent, and hook file — missing frontmatter produces cache errors when Claude Code loads the plugin.
3. If the plugin declares an `mcpServers` entry point, commit the built artifact or wire it to a postinstall hook — gitignored `dist/` paths will fail validation.
4. Update `.claude-plugin/marketplace.json` with your plugin entry.
5. Run `pnpm check:marketplace` before opening a PR — this is the same check CI runs.

## License

MIT — see [LICENSE](./LICENSE).
