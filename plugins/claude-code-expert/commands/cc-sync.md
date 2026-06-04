---
name: claude-code-expert:cc-sync
intent: Idempotent update of an existing Claude Code setup — re-fingerprint, propagate to sub-repos, refresh docs, section-merge CLAUDE.md. Absorbs legacy cc-config via --fix-drift.
tags:
  - claude-code-expert
  - command
  - cc-sync
inputs: []
risk: medium
cost: medium
description: Idempotent update of an existing Claude Code setup — re-fingerprint, propagate to sub-repos, refresh docs, section-merge CLAUDE.md. Absorbs legacy cc-config via --fix-drift.
---

# /cc-sync — Update Existing Setup

For repos that already have `/cc-setup` applied. Safe to run weekly or from a scheduled task.

## Usage

```bash
/cc-sync                    # Standard idempotent update
/cc-sync --fix-drift        # Find and repair drift from plugin baseline
/cc-sync --dry-run          # Plan without writing
/cc-sync --sub-repos        # Also propagate to monorepo children
/cc-sync --memory-only      # Only refresh .claude/rules/ from plugin
```

## What it does

Full workflow in [`skills-v8/claude-code-sync/SKILL.md`](../skills-v8/claude-code-sync/SKILL.md). Summary:

1. **Re-fingerprint** — scan for stack changes since last sync.
2. **Delta propagation** — push plugin rule updates into `.claude/rules/`.
3. **Section-merge CLAUDE.md** — update managed sections, preserve user content.
4. **Fix drift** (`--fix-drift`) — repair missing hooks, dead registrations, stale config.
5. **Propagate** (`--sub-repos`) — walk monorepo children, sync their `.claude/`.
6. **Scaffold docs/context/** if absent.
7. **Auto-install LSPs** from detected stack.
8. **Persist state** to `.claude/sync-state.json`.

## Section-merge safety

CLAUDE.md sections marked `<!-- plugin:cc-setup managed -->` get rewritten. Unmarked sections are preserved as-is. User customizations are safe.

## Output

- Summary of changes made
- Drift findings if `--fix-drift`
- Next sync recommendation date
