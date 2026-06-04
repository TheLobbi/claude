# Writing Plans Enhanced — Plugin Guide

## Purpose
Enhanced writing-plans skill: 5-phase structure, task metadata (Type/Depends-on/Parallel-safe/Risk), non-TDD task templates, automated plan linter with self-tests. Standalone hub-hosted fork of superpowers:writing-plans.

## What's inside
- Commands: 0 (see `commands/`)
- Agents: 0 (see `agents/`)
- Skills: 1 (see `skills/`)

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
