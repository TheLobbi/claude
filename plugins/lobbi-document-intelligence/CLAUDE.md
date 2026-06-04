# Lobbi Document Intelligence — Plugin Guide

## Purpose
AI-powered document processing for insurance and financial services. PDF extraction, form classification, OCR pipelines, data validation, intelligent routing, and extraction auditing. 6 skills, 3 agents.

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
