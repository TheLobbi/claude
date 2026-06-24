---
name: cc-stack-setup
description: Deploy or audit the full 5-layer Claude Code stack (CLAUDE.md + skills + hooks + agents + memory) in a repository. Use this skill whenever the user runs /cc-setup, asks to "set up Claude Code on this repo", "configure a new repo for Claude", "audit my Claude Code setup", "generate CLAUDE.md", "install hooks", "wire up the 4-layer stack", or starts work in a repo that lacks .claude/. Also triggers on "bootstrap Claude Code", "add claude setup", or whenever a fresh repo needs Claude Code configuration.
---

# Claude Code Setup

Deploys all five layers of the modern Claude Code stack. Detects the project's shape, picks defaults from the detection matrix, and generates configuration that hits the ground running.

## The 5-layer stack

| Layer | Artifact | Loaded |
|---|---|---|
| L0 — MCP reference | plugin's MCP tools (queryable) | on demand |
| L1 — CLAUDE.md | `CLAUDE.md` (≤120 lines, routing) | always |
| L2 — Skills | `.claude/skills/*/SKILL.md` | frontmatter always; body on trigger |
| L3 — Hooks | `.claude/hooks/*.sh` + `.claude/settings.json` | on lifecycle events |
| L4 — Agents | `.claude/agents/*.md` | on invocation |
| L5 — Memory | engram (tier 1) + Obsidian vault (tier 2) + `.claude/rules/` (tier 3) | tier 3 always; others on demand |

## Detection — what the skill looks for

Run in order; short-circuit on first hit per category.

| Category | Checks | MCP tool for config |
|---|---|---|
| Language | `package.json`, `tsconfig.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `*.csproj`, `pom.xml` | `cc_kb_lsp_config(language)` |
| Framework | `next.config.*`, `nuxt.config.*`, `vite.config.*`, `fastapi`/`flask` imports, `manage.py` | — |
| Infra | `Dockerfile`, `docker-compose*`, `kubernetes/`, `helm/`, `terraform/`, `.github/workflows/` | — |
| DB | `prisma/`, `drizzle.config.*`, `knexfile.*`, `.env*DATABASE_URL*`, `supabase/` | — |
| Test | `jest.config*`, `vitest.config*`, `pytest.ini`, `cypress.config*`, `playwright.config*` | — |
| Monorepo | `turbo.json`, `nx.json`, `pnpm-workspace.yaml`, `lerna.json`, `rush.json` | — |

## Workflow

### 1. Scan (read-only)

Build a project fingerprint. Count LOC, list detected stacks, identify existing `.claude/` contents.

### 2. Pick a preset (or --auto)

| Preset | Profile |
|---|---|
| `developer` (default) | Permissive for local dev, 4 layers configured, standard hooks |
| `power-user` | Full 5 layers, all detected MCPs, comprehensive hooks, model cascading |
| `ci-cd` | Restrictive, audit-only hooks, Haiku model |
| `secure` | Strict read-only default, deny network tools |
| `minimal` | CLAUDE.md only |
| `team` | Shared conventions, no local overrides |

### 3. Generate Layer 1 — CLAUDE.md

Template: routing table + build commands + "don't touch" list. ≤120 lines. See MCP `cc_docs_resolve_task` for task-routing rows.

Add an Obsidian routing block if the vault is detected (existing Obsidian MCP or path `C:/Users/MarkusAhling/obsidian/` readable). Content from `memory/rules/cc-obsidian-intro.md`.

### 4. Generate Layer 2 — skills

Small set of skills tied to detected stack. Prefer delegating to the plugin's MCP KB rather than inlining large skill bodies.

### 5. Generate Layer 3 — hooks

Install 2-3 baseline hooks from MCP KB:
- Always: `protect-sensitive-files` (fetch via `cc_kb_hook_recipe`)
- If formatter detected: `auto-format-after-edit`
- Optional per preset: `session-init`, `on-stop`, `lessons-learned-capture`

### 6. Generate Layer 4 — agents

Copy role-based agents that match the repo's work type. Always include `audit-reviewer`. Include `security-compliance-advisor` if auth/payment detected.

### 7. Generate Layer 5 — memory bootstrap

Copy plugin baseline rules into target:
```
.claude/rules/cc-always.md         ← plugin memory/rules/cc-always.md
.claude/rules/cc-obsidian-intro.md ← plugin memory/rules/cc-obsidian-intro.md
.claude/rules/cc-patterns.md       ← plugin memory/rules/cc-patterns.md (latest snapshot)
```

CLAUDE.md references all three via `@.claude/rules/*.md` notation (auto-loaded every session).

### 8. Score and report

Phase 10 audit: 0–100 score across 5 layers + MCP + LSP + memory + cost optimization. Output markdown report.

## Audit mode (`/cc-setup --audit`)

Skips generation; scores the existing setup. Reports gaps and suggests next steps. Does not modify any file.

## MCP delegation table

| Need | Tool |
|---|---|
| Hook recipe | `cc_kb_hook_recipe(name)` |
| LSP config | `cc_kb_lsp_config(language)` |
| Topology kit | `cc_kb_topology_kit(name)` |
| Workflow pack | `cc_kb_workflow_pack(name)` |
| Autonomy profile | `cc_kb_autonomy_profile(profile)` |
| Pattern template | `cc_kb_pattern_template(name)` |
| Channel server | `cc_kb_channel_server(name)` |
| Model recommendation | `cc_docs_model_recommend(task, budget?)` |
| Hook pack shortlist | `cc_docs_hook_pack_recommend(signals)` |
| Topology shortlist | `cc_docs_team_topology_recommend(task, complexity, team_size)` |

## Anti-patterns

- Generating a 500-line CLAUDE.md with all conventions inline → routing fails; user can't scan it.
- Installing every hook pack "just in case" → hooks fight each other and slow feedback.
- Skipping the Obsidian intro when the vault exists → durable knowledge rots in engram.
- Copying last-session skills without re-scanning → stack may have changed.

## Reference

- [detection-matrices.md](references/detection-matrices.md) — full language/framework/infra/DB/test/monorepo detection tables
