---
name: claude-code-expert:cc-memory
intent: Wrap engram for CC-scoped memory operations — search, export, consolidate, edit-always, review. Bridges engram (tier 1) and Obsidian vault (tier 2) via the memory-consolidator agent.
tags:
  - claude-code-expert
  - command
  - cc-memory
inputs: []
risk: medium
cost: medium
description: Wrap engram for CC-scoped memory operations — search, export, consolidate, edit-always, review. Bridges engram (tier 1) and Obsidian vault (tier 2) via the memory-consolidator agent.
---

# /cc-memory — Second-Brain Operations

Operates on the three-tier memory system documented in [`skills-v8/cc-second-brain/SKILL.md`](../skills-v8/cc-second-brain/SKILL.md) and [`memory/conventions.md`](../memory/conventions.md).

## Subcommands

### `/cc-memory search <query>`

Searches engram for CC-scoped observations. Scoped to `cc/*` topic_keys only. Returns top 5 matches.

Under the hood: `mem_search` with a prefix filter. If no `cc/*` matches, falls back to broader search with a note.

### `/cc-memory consolidate`

Runs the `memory-consolidator` agent. Reads engram CC observations, groups by topic_key, promotes reinforced patterns (≥3×) into:

1. Obsidian vault at `Research/Claude-Code/Patterns/{slug}.md` (with `auto_generated: true` frontmatter — user-protection invariant respected).
2. `memory/rules/cc-patterns.md` as one-line pointers with wikilinks.

Conflicts go to `memory/rules/DRAFT.md` for user review. Log entry written to `memory/consolidate.log`.

**The consolidator never writes to engram** — read-only on `mem_search`, `mem_get_observation`, `mem_context`.

Flags:
- `--dry-run` — report what would be promoted; no writes
- `--since <date>` — only consolidate observations after this date

### `/cc-memory export [--domain <area>]`

Generates a human-readable digest of recent engram activity. Writes to `memory/digests/{YYYY-MM-DD}.md`.

Useful for weekly review alongside the Obsidian inbox at `Projects/Claude-Code-Inbox/`.

Domains: `hooks`, `autonomy`, `topology`, `workflow`, `mcp`, `channels`, `lsp`, `repo`, `plugin`, `agent`, `cost`, `lesson`, or omit for all.

### `/cc-memory edit-always`

Opens `memory/rules/cc-always.md` for editing. This file is user-curated only — consolidator never touches it. Changes here propagate to every consumer repo on next `/cc-setup` or `/cc-sync`.

### `/cc-memory review`

Opens `memory/rules/DRAFT.md` — consolidator-surfaced conflicts awaiting human resolution.

### `/cc-memory status`

Shows:
- Last consolidation timestamp + outcome
- Pattern count in `memory/rules/cc-patterns.md`
- Draft count in `memory/rules/DRAFT.md`
- Total `cc/*` observations in engram
- Obsidian vault accessibility (MCP or direct path)

## Safety

- Consolidator: read-only on engram, respects user-protection invariant on Obsidian, never edits user-curated files.
- All writes in `/cc-memory` are scoped to the plugin's `memory/` directory or the Obsidian vault under `Research/Claude-Code/Patterns/` and `Projects/Claude-Code-Inbox/`.
- `/cc-memory edit-always` is the only way to modify `cc-always.md` — ensures user intent is explicit.

## See also

- `skills-v8/cc-second-brain` — the skill this command delegates to
- `agents/memory-consolidator` — the consolidator agent
- `memory/conventions.md` — three-tier write discipline
