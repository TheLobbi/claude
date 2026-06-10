# Project Instructions

## Overview
Claude Code Plugin Marketplace — curated collection of 41 Claude Code plugins
(35 in `plugins/`, 6 sub-plugins in `.claude/plugins/`) with marketplace-wide
validation and developer tooling. Pure marketplace repository; no application
frontend.

## Workflow Protocol
EXPLORE → PLAN → CODE → TEST → FIX → DOCUMENT

## Build & Validate
- Install: `pnpm install`
- **Primary check:** `pnpm check:marketplace` — validates marketplace.json and every plugin (runs in CI)
- Type-check scripts and types: `npx tsc --noEmit`
- Validate an archetype example: `pnpm validate-archetype <path>`
- Profile per-plugin context cost: `pnpm profile:plugin-context`

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20+, ES modules |
| Language | TypeScript 5.3 strict (for scripts only) |
| Validation | Ajv + JSON Schema (Draft 7) |
| Package Manager | pnpm |
| CI | GitHub Actions (marketplace-ci runs scripts/validate-marketplace.mjs + tsc + archetype validation) |
| MCP | 5 custom (code-quality-gate, deploy-intelligence, lessons-learned, project-metrics, workflow-bridge) + perplexity + firecrawl + context7 |

## Key Paths
- Marketplace manifest: `.claude-plugin/marketplace.json`
- Installed plugins: `plugins/` (35 plugins)
- Sub-marketplace plugins: `.claude/plugins/` (6 plugins)
- Rules: `.claude/rules/` (modular, path-scoped instructions)
- Platform skills: `.claude/skills/`
- Platform agents: `.claude/agents/`
- Hooks: `.claude/hooks/` (lifecycle scripts)
- Templates: `.claude/templates/` (PR, design doc, test plan, incident)
- Plugin registries: `.claude/registry/`
- Dev tooling: `scripts/` (validation, indexing, context profiling)
- Schemas: `schemas/` (plugin, archetype, marketplace)
- Docs: `docs/context/` (architecture, data model, security, testing)
- MCP config: `.mcp.json`

## Reference Documents
Read these before making major changes:
- Architecture: `@docs/context/architecture.md`
- Data model: `@docs/context/data-model.md`
- API contracts: `@docs/context/api-contracts.md`
- Security: `@docs/context/security-rules.md` + `@.claude/rules/security.md`
- Testing: `@docs/context/testing-strategy.md` + `@.claude/rules/testing.md`
- Glossary: `@docs/context/domain-glossary.md`
- Decisions: `@docs/context/decisions/`

## Rules
- Code style: `@.claude/rules/code-style.md`
- Testing: `@.claude/rules/testing.md`
- Security: `@.claude/rules/security.md`
- Git: `@.claude/rules/git-workflow.md`
- Docker/K8s: `@.claude/rules/docker-k8s.md`
- Infrastructure: `@.claude/rules/infra.md`
- PR review: `@.claude/rules/review.md`
- Product/UX: `@.claude/rules/product.md`

## Decision Trees
- Auth/identity tasks → check `plugins/aws-eks-helm-keycloak/` + `docs/context/security-rules.md`
- Plugin development → check `plugins/claude-code-expert/` + `.claude/rules/architecture.md`
- Frontend-authoring plugins → check `plugins/frontend-design-system/` + `plugins/react-animation-studio/`
- Infrastructure tasks → check `.github/workflows/` + `.claude/rules/infra.md`
- Agent/skill creation → check `.claude/agents/` + `.claude/skills/` + `docs/context/domain-glossary.md`
- New plugin scaffold → check `plugins/claude-code-templating-plugin/` + `schemas/plugin.schema.json`

## Plugin Cache Errors (common root causes)
Every file listed in a `plugin.json`'s `commands`, `skills`, `agents`, or `hooks`
sections MUST have YAML frontmatter (at minimum `description:`). Missing
frontmatter is the most common source of cache errors on plugin load. MCP
servers declared in the manifest must point to files that exist in git — do
not reference gitignored build artifacts (`dist/`, `build/`) in `mcpServers`
unless the plugin includes a postinstall build hook.

## Key Commands
- Use subagents for research (preserves main context)
- Use `/compact` every 20-30 exchanges
- Use `/clear` between unrelated tasks
- Use `/cc-setup` for first-time configuration
- Use `/cc-sync` to update configuration after changes

## Research
- Use Perplexity MCP for web knowledge queries
- Use Firecrawl MCP for scraping specific URLs
- Use Context7 MCP for library documentation
- Check lessons-learned before starting: `.claude/rules/lessons-learned.md`

## Models
| Model | Use |
|-------|-----|
| fable | Hardest long-horizon autonomous runs, problems Opus failed on (Claude 5 tier above Opus) |
| opus | Architecture, complex decisions, security review |
| sonnet | Development, implementation, test writing |
| haiku | Research, fast lookups, docs |

## Self-Healing
When you encounter an error:
1. Fix the issue
2. Update `.claude/rules/lessons-learned.md` with the fix
3. If it reveals a pattern, update the appropriate rule in `.claude/rules/`

## Conventions
- TypeScript strict mode for `scripts/` (all strict flags enabled)
- ES modules (`"type": "module"`)
- Commit format: `type(scope): description`
- Plugin manifests: `.claude-plugin/plugin.json` (per-plugin)
- Marketplace manifest: `.claude-plugin/marketplace.json` (repo root)

## Don't Touch
- `node_modules/`, `dist/`, `build/`, `coverage/`
- `.claude/worktrees/` (git worktree managed)
- Plugin `node_modules/` and `dist/` directories

## Lockfile
- `pnpm-lock.yaml` IS committed (required for CI `--frozen-lockfile`). Regenerate via `pnpm install` when you change `package.json`, then commit the lockfile update.
