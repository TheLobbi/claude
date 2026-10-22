# Frontend Design System Plugin Guide

## Purpose
- Operational guide for working safely in `plugins/frontend-design-system`.
- Keep edits scoped, minimal, and aligned with this plugin's existing architecture.

## Supported Commands
- `audit` (see `commands/audit.md`)
- `component` (see `commands/component.md`)
- `convert` (see `commands/convert.md`)
- `keycloak` (see `commands/keycloak.md`)
- `palette` (see `commands/palette.md`)
- `style` (see `commands/style.md`)
- `theme` (see `commands/theme.md`)
- `tokens` (see `commands/tokens.md`)

## Chakra UI v3 Rules
- `skills/chakra-ui-v3/SKILL.md` is the single source of truth for Chakra facts; other files link to it instead of restating APIs.
- Never emit Chakra v2 patterns (`extendTheme`, `colorScheme`, `isOpen`, `ColorModeScript`, flat `Modal`); see the skill's banned list.
- Prefer MCP lookups (`chakra-ui` `get_component_props`, `design-styles` `check_contrast`) over recalled props or eyeballed contrast.
- Keep `mcp-server/` dependency-free and its entry point tracked in git (plugin-cache rule).

## Prohibited Actions
- Do not delete or rename `.claude-plugin/plugin.json`.
- Do not introduce secrets, credentials, or tenant-specific IDs in tracked files.
- Do not modify unrelated plugins from this plugin workflow unless explicitly requested.

## Required Validation Checks
- Run `pnpm check:plugin-context`.
- Run `pnpm check:plugin-schema`.
- Run `pnpm check:marketplace` (verifies the `mcpServers` entry points exist in git).
- If `mcp-server/` changed, run `node --test mcp-server/test/*.test.js` and `node mcp-server/scripts/build-catalog.mjs --check`.

## Context Budget
Load in this order and stop when you have enough context:
1. `CONTEXT_SUMMARY.md`
2. `commands/index` (or list files in `commands/`)
3. `README.md` and only the specific docs needed for the current task

## Escalation Path
- If requirements conflict with plugin guardrails, pause implementation and document the conflict.
- If validation fails and root cause is unclear, escalate with failing command output and touched files.
- For production-impacting changes, request maintainer review before release/publish steps.
