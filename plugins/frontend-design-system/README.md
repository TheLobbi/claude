# frontend-design-system

**Version:** 2.1.0 | **License:** MIT | **Callsign:** Stylist
**Author:** Markus Ahling

## Purpose

This plugin provides an AI-powered frontend design system toolkit with design
styles, multi-tenant Keycloak theming, and Chakra UI v3 output. It exists because enterprise applications
serving multiple tenants need consistent design language that can be customized per
tenant -- from design tokens and component patterns through to Keycloak login pages --
without duplicating effort across each tenant theme.

The plugin bridges an Obsidian vault containing 263+ curated design styles with
automated CSS generation, component scaffolding, and Keycloak theme deployment. Its
agents cover strategic design architecture, implementation, theming, accessibility,
and responsive layout work across the full frontend lifecycle.

## Directory Structure

```
frontend-design-system/
  .claude-plugin/plugin.json
  CLAUDE.md / CONTEXT_SUMMARY.md
  agents/                        # 6 agents
  commands/                      # 8 commands
  skills/                        # 6 skills (subdirectories with SKILL.md)
  mcp-server/                    # design-styles MCP server (zero dependencies)
  hooks/                         # Style consistency, accessibility, theme sync
```

## Agents

| Agent | Model | Description |
|-------|-------|-------------|
| design-architect | sonnet | Strategic design system architecture and token taxonomy |
| style-implementer | sonnet | Convert design vocabulary to CSS and apply to components |
| theme-engineer | sonnet | Multi-tenant Keycloak theme development |
| component-designer | sonnet | Reusable UI component design and implementation |
| accessibility-auditor | sonnet | WCAG 2.1 compliance and accessibility testing |
| responsive-specialist | sonnet | Mobile-first responsive design across breakpoints |

## Commands

| Command | Description |
|---------|-------------|
| `/ds:style` | Search and apply design styles from 263+ vocabulary |
| `/ds:theme` | Generate or customize Keycloak tenant themes |
| `/ds:tokens` | Manage design tokens (colors, spacing, typography) |
| `/ds:component` | Generate UI components with design patterns |
| `/ds:palette` | Generate color palettes and theme variations |
| `/ds:audit` | Audit accessibility and design consistency |
| `/ds:convert` | Convert design tokens between formats |
| `/ds:keycloak` | Manage Keycloak theme integration and deployment |

## Skills

- **design-styles** -- 263+ curated design style vocabulary with semantic search
- **keycloak-theming** -- Multi-tenant theme generation, realm config, login customization
- **css-generation** -- CSS Variables, Tailwind config, styled-components generation
- **component-patterns** -- Reusable component patterns, composition, hooks, accessibility
- **chakra-ui-v3** -- Verified Chakra UI v3 reference: createSystem, tokens, recipes, color mode, v2 banned list
- **agentic-patterns** -- Agent orchestration patterns used by the plugin agents

## CSS Output Formats

| Format | Use Case |
|--------|----------|
| CSS Variables | Native custom properties |
| Tailwind Config | Tailwind CSS integration |
| Sass/SCSS | Token generation with variables |
| styled-components | Theme provider integration |
| Emotion | CSS-in-JS theme support |
| Chakra UI v3 | `createSystem` + `defineConfig` tokens, semantic tokens (light/dark), `colorPalette` contract |

## MCP Servers

Declared in `plugin.json` under `mcpServers`:

| Server | Source | Purpose |
|--------|--------|---------|
| `design-styles` | `mcp-server/` (this plugin, Node 20+, no install step) | `list_style_categories`, `search_styles`, `get_style`, `generate_chakra_system`, `generate_tokens` (chakra / css / tailwind / json), `check_contrast` (WCAG) |
| `chakra-ui` | official `@chakra-ui/react-mcp` via `npx` | Live Chakra v3 component props, examples, tokens, `v2_to_v3_code_review` |

The bundled catalog holds the 95 styles listed in `skills/design-styles/SKILL.md` (19 categories) with visual profiles: 15 hand-tuned styles plus per-category defaults. The full 263+ style vocabulary lives in the Obsidian vault; export it as JSON (`{ styles, categories, profiles }`) and set `DESIGN_STYLES_PATH` to extend the catalog. `generate_chakra_system` emits tokens, semantic tokens, and `globalCss`; per-component recipes stay hand-authored. Generated values are starting points: review the "Review notes" footer and run `check_contrast`.

Regenerate the catalog after editing the design-styles skill: `node mcp-server/scripts/build-catalog.mjs`. Tests: `node --test mcp-server/test/*.test.js`.

## Prerequisites

- Obsidian MCP server (for design style vocabulary access)
- Keycloak instance (for theme deployment)
- Context7 MCP server (optional, for library documentation)

**Environment variables:**
- `KEYCLOAK_URL` -- Keycloak server URL
- `KEYCLOAK_REALM` -- Default realm name

## Quick Start

```
/ds:style search "modern card with shadow"
/ds:tokens generate --format=css-vars --output=src/tokens/colors.css
/ds:component create Button --variant=primary,secondary,ghost
/ds:theme create tenant-a --realm=tenant-a --palette=blue
/ds:audit check --wcag=AA
/ds:keycloak deploy --realm=tenant-a
```
