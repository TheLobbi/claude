# Work Automation — Plugin Guide

## Purpose
Universal internal work-automation kit. ULTRA-mode constitution, Work Unit Protocol, Claude Code automation patterns (hooks, skills, plugins, agents, schedules, MCP, SDK, headless, fullscreen), and Harness pipeline ops. Project-agnostic. Glues existing plugins (harness-platform, claude-code-expert, tenant-management-kit) with reusable workflows.

## What's inside
- Commands: 4 (see `commands/`)
- Agents: 2 (see `agents/`)
- Skills: 3 (see `skills/`)

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
