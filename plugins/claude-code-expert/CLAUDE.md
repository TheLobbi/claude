# Claude Code Expert v8 — Routing

Modern second brain for Claude Code. Five-layer stack deploy + three-tier memory + 22-tool MCP reference spine.

> **Capability baseline:** what current Claude Code can do (models, tools, hooks, agent teams,
> permissions, web/remote, memory) is tracked in [`docs/CC-CAPABILITIES-2026-06.md`](docs/CC-CAPABILITIES-2026-06.md).
> It is the source of truth — when a skill or command disagrees with it, fix the skill. Latest models:
> Fable 5 (`claude-fable-5`, new Mythos-class tier above Opus), Opus 4.8 (`claude-opus-4-8`),
> Sonnet 4.6 (`claude-sonnet-4-6`), Haiku 4.5 (`claude-haiku-4-5-20251001`).

## Fast routing

| Intent | Open |
|---|---|
| Set up or audit a repo's CC stack | [`commands/cc-setup.md`](commands/cc-setup.md) |
| Update an existing setup | [`commands/cc-sync.md`](commands/cc-sync.md) |
| Deep analysis of a hard problem | [`commands/cc-intel.md`](commands/cc-intel.md) + [`skills/deep-code-intelligence/SKILL.md`](skills/deep-code-intelligence/SKILL.md) |
| Multi-agent review | [`commands/cc-council.md`](commands/cc-council.md) |
| Launch a pattern-based workflow | [`commands/cc-orchestrate.md`](commands/cc-orchestrate.md) |
| Enable autonomous mode | [`commands/cc-autonomy.md`](commands/cc-autonomy.md) + [`skills/autonomy/SKILL.md`](skills/autonomy/SKILL.md) |
| Hooks install/list/debug | [`commands/cc-hooks.md`](commands/cc-hooks.md) |
| Event-driven channels | [`commands/cc-channels.md`](commands/cc-channels.md) |
| Memory operations (search/consolidate/export) | [`commands/cc-memory.md`](commands/cc-memory.md) + [`skills/cc-second-brain/SKILL.md`](skills/cc-second-brain/SKILL.md) |
| Diagnose a CC setup issue | [`commands/cc-debug.md`](commands/cc-debug.md) |
| Plugin help / routing table | [`commands/cc-help.md`](commands/cc-help.md) |

## Three-tier memory

Claude in this plugin works with **three memory tiers**:

1. **engram** (tier 1, working) — ALWAYS ACTIVE globally. Save decisions/bugs/discoveries proactively with CC `topic_key` prefix (`cc/hooks/*`, `cc/autonomy/*`, etc.).
2. **Obsidian vault** at `C:/Users/MarkusAhling/obsidian/` (tier 2, durable) — user's central knowledge hub. Write reusable patterns to `Research/Claude-Code/Patterns/`, repo docs to `Repositories/{org}/{repo}.md`, ADRs to `Decisions/NNNN-title.md`.
3. **Plugin rules** in `memory/rules/` (tier 3, baseline) — auto-copied into consumer repos by `/cc-setup`.

Details and write discipline: [`memory/conventions.md`](memory/conventions.md).

## Operating rules

1. **Evidence before advice** — build an evidence table for non-trivial claims.
2. **Repo facts beat generic best practices** — read the code first.
3. **Route to the right layer** — reference material lives in MCP KB tools; behavior lives in skills; knowledge lives in Obsidian.
4. **Memory discipline** — engram writes are free (proactive); Obsidian writes only with `auto_generated: false` unless you are the consolidator; `memory/rules/cc-always.md` is user-only.
5. **Cost awareness** — Opus for reasoning gates, Sonnet for implementation, Haiku for retrieval. See [`skills/model-routing/SKILL.md`](skills/model-routing/SKILL.md).

## MCP reference spine

Plugin MCP server exposes 22 tools. Use them instead of loading heavy reference content into skills.

- `cc_docs_*` — 15 tools for search, topics, model recommendations, autonomy planning, topology recommendations.
- `cc_kb_*` — 7 tools for hook recipes, topology kits, workflow packs, channel servers, LSP configs, pattern templates, autonomy profiles.

Full reference in [`docs/MCP_TOOLS.md`](docs/MCP_TOOLS.md).

## Plugin architecture

- `skills/` (21) — behavior-triggering, ≤ 500 lines each, `references/` for heavy content.
- `commands/` (11) — single-intent, route to skills and MCP tools.
- `agents/` (18) — role-scoped, model-deliberate, tool-restricted.
- `memory/` — three-tier baseline rules + consolidator audit.
- `mcp-server/` — 22-tool reference server (port via stdio).
- `hooks/` — (consumer-repo hooks are in `memory/rules/cc-always.md` and MCP KB).
- `archive/v7.6.0/` — pre-redesign snapshot, kept through v8.1.
