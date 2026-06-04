# Upgrade Suggestion — Plugin Guide

## Purpose
AI-powered upgrade intelligence platform. Multi-agent council analyzes your codebase across 8 dimensions, produces confidence-scored suggestions with visual impact heatmaps, upgrade roadmaps, framework-specific deep dives, and before/after impact previews. Features innovation radar, tech debt forecasting, and coordinated upgrade bundles.

## What's inside
- Commands: 3 (see `commands/`)
- Agents: 7 (see `agents/`)
- Skills: 4 (see `skills/`)

## Working in this plugin
- Keep edits scoped and aligned with the plugin's existing architecture.
- Every command/agent/skill `.md` must have YAML frontmatter (at minimum `name` + `description`).
- Do not introduce secrets, credentials, or tenant-specific IDs in tracked files.
- Update `CONTEXT_SUMMARY.md` when you add or remove commands, agents, or skills.

## Validation
- From the repo root: `pnpm check:marketplace` (and `pnpm check:plugin-schema`).

## See also
- `README.md` — full plugin documentation.
- `CONTEXT_SUMMARY.md` — bootstrap context summary.
