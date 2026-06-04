---
name: claude-code-expert:cc-setup
intent: Deploy or audit the full 5-layer Claude Code stack (CLAUDE.md + skills + hooks + agents + memory) in the current repository. Absorbs the legacy cc-bootstrap command via --audit.
tags:
  - claude-code-expert
  - command
  - cc-setup
inputs: []
risk: medium
cost: medium
description: Deploy or audit the full 5-layer Claude Code stack (CLAUDE.md + skills + hooks + agents + memory) in the current repository. Absorbs the legacy cc-bootstrap command via --audit.
---

# /cc-setup — Full 5-Layer Deploy

Scans the repo, picks a preset (or best-guess defaults in `--auto`), and deploys CLAUDE.md, skills, hooks, agents, and the three-tier memory bootstrap.

## Usage

```bash
/cc-setup                     # Interactive
/cc-setup --auto              # Non-interactive, best-guess
/cc-setup --dry-run           # Show plan without writing
/cc-setup --audit             # Score existing setup; suggest improvements (no writes)
/cc-setup --preset power-user # Use preset (see skills-v8/claude-code-setup)
/cc-setup --mcp-only          # Configure MCP servers only
/cc-setup --hooks-only        # Install hook packs only
/cc-setup --memory-only       # Copy memory/rules/ into .claude/rules/
```

## Flow

Detailed workflow lives in [`skills-v8/claude-code-setup/SKILL.md`](../skills-v8/claude-code-setup/SKILL.md). Short version:

1. **Scan** — fingerprint the repo (language, framework, infra, DB, tests, monorepo).
2. **Ask** (unless `--auto`) — confirm stack and preset.
3. **Generate L1** — CLAUDE.md (≤120 lines) with Obsidian routing block if vault detected.
4. **Generate L2** — stack-specific skills (minimal, most via plugin MCP KB).
5. **Generate L3** — baseline hooks from `cc_kb_hook_recipe` (protect-sensitive-files always; auto-format if formatter detected).
6. **Generate L4** — role-based agents (always `audit-reviewer`; add specialists per detected signals).
7. **Generate L5** — copy `memory/rules/cc-always.md`, `cc-obsidian-intro.md`, `cc-patterns.md` into `.claude/rules/`.
8. **Configure MCP** — install detected servers; recommend `context7` and this plugin's MCP.
9. **Configure LSP** — report + install.
10. **Wire agentic patterns** — deploy artifacts per project scale.
11. **Score** — 0–100 audit rubric; output report.

## Presets

| Preset | Best for |
|---|---|
| `developer` (default) | Local dev, all 4 layers, standard hooks |
| `power-user` | Everything, all MCPs, model cascading, agent teams |
| `ci-cd` | Restrictive, Haiku, audit-only hooks |
| `secure` | Strict deny-default, no network |
| `minimal` | CLAUDE.md only |
| `team` | Shared conventions, no local overrides |

## Memory bootstrap (v8)

`/cc-setup` always copies the three-tier baseline into the target:

- `.claude/rules/cc-always.md` — hard rules (user-editable)
- `.claude/rules/cc-obsidian-intro.md` — vault integration instructions
- `.claude/rules/cc-patterns.md` — snapshot of plugin-managed patterns

CLAUDE.md references all three via `@.claude/rules/*.md` so they load every session.

## Output

After generation, prints a report with:
- 0–100 score across 5 layers + MCP + LSP + memory + cost
- Gaps and next steps
- Sync cadence recommendation

## Audit mode (`--audit`)

Skips generation. Reads existing `.claude/` and scores it. Writes nothing. Output is the score report plus a prioritized list of improvements the user can act on with a follow-up `/cc-setup` run.
