# Changelog

## v8.1.1 (2026-06-04) — Complete the Claude Code modernization (June 2026)

Follow-up to v8.1.0: closes the gaps that pass left open against current Claude Code.
No agent logic changed.

### Models (a generation behind → current)
- Updated the model-routing reference in `agents/agent-router.md` to current IDs:
  `claude-opus-4-5` → `claude-opus-4-8`, `claude-sonnet-4-5` → `claude-sonnet-4-6`,
  `claude-haiku-4-0` → `claude-haiku-4-5-20251001` (shown alongside the `opus`/`sonnet`/`haiku`
  aliases the agent frontmatter already uses).
- `commands/setup.md` frontmatter `model: claude-sonnet-4-5` → `model: sonnet` (future-proof alias,
  matching the convention used by the other agents).
- `examples/self-reflection-integration.ts` API call `claude-sonnet-4-5-20251101` → `claude-sonnet-4-6`.
- Normalized every model-version-pinned author/co-author trailer (`Claude Opus 4.5`,
  `Claude Sonnet 4.5`, `Claude Code (Haiku 4.5)`) across the WORKSTREAM/summary docs and the
  commit/PR templates (`commands/commit.md`, `templates/github/PULL_REQUEST_TEMPLATE.md`,
  `docs/DEVELOPMENT-STANDARDS.md`) to the canonical version-less form
  `Co-Authored-By: Claude <noreply@anthropic.com>` — accurate and never stale.

### Tooling terminology
- Renamed the `Task tool` → `Agent tool` in the orchestration agents
  (`parallel-sub-issue-worker`, `advanced-orchestration-patterns`, `completion-flow-orchestrator`,
  `triage-agent`, `completion-orchestrator`) to match the current built-in tool name.

### Hook schema correctness
- `hooks/schema/hook-config.schema.json` had `additionalProperties: false` but only defined 5 events,
  while `hooks.json` actually uses `SubagentStop` and `PostToolUseFailure` (added in v8.1.0's telemetry
  work) — so the plugin's own hook config failed its own schema. Added `PostToolUseFailure`,
  `SubagentStop`, plus the rest of the current lifecycle surface (`SessionEnd`, `PreCompact`,
  `SubagentStart`, `Notification`). `hooks.json` now validates.

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
