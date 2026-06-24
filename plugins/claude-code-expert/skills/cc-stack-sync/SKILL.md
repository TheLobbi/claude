---
name: cc-stack-sync
description: Idempotent update of an existing Claude Code setup — re-fingerprint the repo, propagate updates to sub-repos, refresh docs/context, section-merge CLAUDE.md/README.md, fix configuration drift. Use this skill whenever the user runs /cc-sync, asks to "update the claude setup", "propagate to sub-repos", "fix drift", "resync", or reports that the .claude/ directory has gone stale.
---

# Claude Code Sync

Updates an existing setup without blowing away user customizations. Idempotent — safe to run weekly, monthly, or on a schedule.

## What sync does

1. **Re-fingerprint**: scan the repo for stack changes since last setup. New framework? New DB? New CI/CD tool?
2. **Delta propagation**: push plugin rule updates (`cc-always.md`, `cc-patterns.md`) into the repo's `.claude/rules/`.
3. **Section-merge CLAUDE.md**: update the "Build & Test", "Tech Stack", "Key Paths" sections if stack changed; leave custom sections alone.
4. **Fix drift** (`--fix-drift` flag): find config that drifted from plugin defaults — missing hooks, missing MCP servers, outdated skill versions — and repair.
5. **Propagate to sub-repos**: for monorepos, walk workspace children and apply changes to their `.claude/` dirs.
6. **Scaffold docs/context/** (if absent): create the 22-template knowledge base that complements `.claude/`.
7. **Auto-install LSPs**: detect missing LSP servers from the stack and offer install commands.
8. **Persist sync state**: write `.claude/sync-state.json` with timestamp, plugin version, delta summary.

## Section-merge protocol for CLAUDE.md

CLAUDE.md sections are identified by `## ` headings. Sync protocol:

| Section | Action |
|---|---|
| `## Build & Test` | Replace (regenerated from fingerprint) |
| `## Tech Stack` | Replace |
| `## Key Paths` | Replace |
| `## Architecture` | Preserve (user-curated) |
| `## Conventions` | Merge (preserve user additions, update detected items) |
| `## Don't Touch` | Merge (preserve user additions) |
| `## Knowledge Library` (Obsidian) | Replace if managed-by-plugin marker present |
| Any other section | Preserve as-is |

Managed sections carry a `<!-- plugin:cc-setup managed -->` marker. Unmarked sections are never touched.

## Drift detection (`--fix-drift`)

Compares current state to plugin baseline:

| Check | Fix |
|---|---|
| Missing `.claude/rules/cc-always.md` | Copy from plugin |
| Missing `.claude/rules/cc-obsidian-intro.md` | Copy from plugin |
| `cc-patterns.md` older than plugin's | Offer update (user confirms) |
| Hook script path doesn't match registered hook | Reconcile or remove dead registration |
| Settings allowlist has entries for removed tools | Prune |
| MCP server in `.mcp.json` has no backing install | Warn |
| Skills in `.claude/skills/` belong to old plugin version | Offer replacement |

Never deletes user-added config. All destructive fixes require explicit confirmation.

## Sub-repo propagation

For monorepos (turbo/nx/lerna/pnpm-workspaces), sync walks workspace packages and:

1. If package has its own `.claude/` → sync it (same protocol as root).
2. If package has no `.claude/` → create a minimal one that references the root's CLAUDE.md.
3. Generate per-package CLAUDE.md stubs for LOC > 10k packages.

## docs/context/ scaffolding

If `docs/context/` does not exist, create from 22 templates:
- `docs/context/README.md`
- `docs/context/architecture/overview.md`
- `docs/context/architecture/modules.md`
- `docs/context/conventions/code-style.md`
- `docs/context/conventions/git-workflow.md`
- `docs/context/conventions/testing.md`
- `docs/context/decisions/0001-use-claude-code.md`
- `docs/context/runbooks/deploy.md`
- `docs/context/runbooks/rollback.md`
- `docs/context/glossary.md`
- ... (full list via `cc_kb_docs_context_templates`)

## Sync state file

`.claude/sync-state.json`:

```json
{
  "version": "1.0",
  "last_synced": "2026-04-16T14:00:00Z",
  "plugin_version": "8.0.0",
  "stack_fingerprint": "node-ts-nextjs-postgres-prisma-jest-vercel",
  "sub_repos_synced": 0,
  "drift_fixed": ["added missing cc-obsidian-intro.md", "pruned 2 dead hook registrations"],
  "next_check_due": "2026-05-16"
}
```

## MCP delegation

| Need | Tool |
|---|---|
| Hook pack recommendations after stack change | `cc_docs_hook_pack_recommend(signals)` |
| LSP config for newly detected language | `cc_kb_lsp_config(language)` |
| Topology for new work patterns | `cc_docs_team_topology_recommend(...)` |

## Anti-patterns

- Running sync without reading `.claude/sync-state.json` → can't tell what changed since last sync.
- `--fix-drift` without user confirmation → destroys custom config that looks like drift.
- Syncing sub-repos without their owners' awareness → surprises.
- Re-running setup instead of sync → overwrites user customizations.

## Reference

- [drift-rubric.md](references/drift-rubric.md) — what counts as drift vs. valid customization
