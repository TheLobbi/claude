# Claude Code Expert v8 Context Summary

Modern Claude Code second brain. Deploys the 5-layer stack (CLAUDE.md + skills + hooks + agents + memory) and bridges engram (tier-1 working memory) with the user's Obsidian vault (tier-2 durable knowledge) via a `memory-consolidator` agent. Ships 14 behavior-triggering skills, 11 single-intent commands, 18 role-scoped agents, and a 22-tool MCP reference server with 66 lazy-loaded KB artifacts (hooks, topologies, workflows, channels, LSP, patterns, autonomy) each ≤ 2 KB.

## What this plugin is best at

- Deploying and auditing the 5-layer Claude Code stack in any repo (`/cc-setup`, `/cc-sync`).
- Three-tier memory: engram + Obsidian + plugin rules. Consolidator (Opus, read-only on engram) promotes reinforced patterns to Obsidian with `auto_generated: true`, respecting the user-protection invariant.
- Deep evidence-driven analysis on hard problems (`/cc-intel`, `principal-engineer-strategist`).
- Multi-agent orchestration by pattern (`/cc-orchestrate`, `pattern-router`), council review (`/cc-council`), autonomy profiles with gate agents (`/cc-autonomy`).
- Progressive disclosure: MCP KB tools return single artifacts on demand — never load the full reference corpus.

## Core assets

- `CLAUDE.md`: routing OS (≤120 lines).
- `commands/cc-help.md`: routing table for all `/cc-*` intents.
- `commands/cc-memory.md`: engram wrapper — search, consolidate, export, edit-always, status.
- `skills/cc-second-brain/SKILL.md`: three-tier routing + CC `topic_key` taxonomy.
- `agents/memory-consolidator.md`: Opus, read-only engram; writes Obsidian + `memory/rules/cc-patterns.md`.
- `mcp-server/src/index.js`: 22 tools (15 `cc_docs_*` + 7 `cc_kb_*`), every artifact ≤ 2 KB.
- `memory/conventions.md`: three-tier write discipline.

## When to open deeper docs

| Signal | Open docs | Why |
|---|---|---|
| Setting up or auditing a repo | `commands/cc-setup.md` | 5-layer deploy + `--audit` scoring. |
| Updating an existing CC setup | `commands/cc-sync.md` | Idempotent update with `--fix-drift`. |
| Deep reasoning on hard problem | `skills/deep-code-intelligence/SKILL.md` | Evidence-driven workflow, hypothesis trees. |
| Multi-agent review | `commands/cc-council.md` | Parallel specialists with blackboard coordinator. |
| Memory operations | `skills/cc-second-brain/SKILL.md` | Three-tier discipline, `topic_key` taxonomy. |
| Autonomous mode | `skills/autonomy/SKILL.md` | 4 profiles + planner/verifier/reviewer gates. |
| Memory architecture design | `docs/MEMORY_ARCHITECTURE.md` | Engram+Obsidian+rules; consolidator flow; FAQ. |
| v7 → v8 migration | `docs/MIGRATION.md` | Rename table, deprecations, rollback plan. |
| MCP tool reference | `docs/MCP_TOOLS.md` | 22-tool contract + 66-artifact KB inventory. |

## Non-goals

Not replacing engram; not building a parallel memory MCP; not modifying user-level global CLAUDE.md. The plugin sits on top of engram and the user's Obsidian vault without duplicating either.
