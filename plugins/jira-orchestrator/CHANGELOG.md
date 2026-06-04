# Changelog

## v8.1.0 (2026-06-04) — Workflows, Advisor & Claude Code modernization

Brings jira-orchestrator up to current Claude Code conventions without rewriting
agent logic.

### New: declarative workflows
- Added `workflows/` with 5 schema-validated definitions — `issue-delivery`
  (sequential), `bug-triage` (conditional), `epic-decomposition` (hierarchical),
  `sprint-planning` (sequential), `pr-review-board` (parallel).
- Bundled `workflows/schema/workflow.schema.json` and `workflows/validate.mjs`
  (ajv) so every definition is checked against the Claude Code workflow schema.
- New `/jira:workflow` command — `list` / `show` / `run` / `validate`. Workflows
  reference only agents and commands that exist in this plugin.

### New: advisor
- Added the read-only `jira-advisor` agent (Opus) — analyzes Jira/sprint/PR/CI
  state and returns prioritized, evidence-backed next actions, the workflow to
  launch, and the agents to deploy. `disallowedTools` enforce no mutations.
- New `/jira:advise` command to invoke it.

### Modernized (logic unchanged)
- **Agent frontmatter**: filled gaps (7 missing `description`, 2 `model`, 3
  `tools`), normalized the legacy `claude-haiku-4` model to `haiku`, and added a
  model-derived `effort` to all 81 existing agents. The new advisor carries the
  full modern field set (`effort`, `maxTurns`, `disallowedTools`, `skills`,
  `memory`, `background`, `isolation`).
- **Skills**: rewrote 10 skill descriptions to the pushy "≥3 trigger" format and
  added frontmatter to `agentic-patterns` (previously had none — a cache-load risk
  that also failed marketplace validation).
- **Hooks**: added `SubagentStop` telemetry (`capture-agent-telemetry.sh`) and
  `PostToolUseFailure` lessons capture (`lessons-capture.sh`). Both are hardened
  (`set -euo pipefail`, `jq`, `flock`, input sanitization, writable-dir fallback)
  and advisory-only (never block the session).
- **Manifest**: added the required `permissions` and `capabilities`, completed
  `context.excludeGlobs` (now passes the plugin schema and context checks), added
  the `advisor` capability/keyword, refreshed counts, and bumped to 8.1.0.
- **Tooling**: `scripts/generate-plugin-indexes.mjs` now preserves modern agent
  frontmatter fields when present (additive; plugins without them are unaffected).

### Counts
- Agents 81 → 82 · Commands 46 → 48 · Skills described 4/14 → 14/14 · Workflows 0 → 5.
