# Fleet Orchestration — Plugin Guide

## Purpose
Run many Claude Code sessions on one codebase without them lying to each
other. Ships the session protocol, the evidence rules, the heartbeat/staleness
monitor and replacement policy, descending-model role definitions, and three
commands (start a fleet, take a census, produce the founder decision sheet).

## What's inside
- Commands: 6 (see `commands/`)
- Agents: 10 (see `agents/`)
- Skills: 4 (see `skills/`)
- Config: `config/fleet.config.example.json`, `config/fleet.schema.json`
- CLI: `scripts/fleet.mjs` — the protocol as a tool, 11 subcommands, zero
  dependencies, `--self-test` on fixtures. Commands and agents call it.
- Scripts: `scripts/validate-heartbeat.mjs` (gate for the heartbeat line
  format), `scripts/heartbeat.ps1`, `scripts/heartbeat.sh`
- Docs: `docs/platform-notes.md`, `docs/optional-hooks.md`

## The invariant that makes this plugin reusable
**No repository, lane, path, organisation or person is named anywhere in this
plugin.** All of it is configuration. Before adding any example, ask whether
it names something specific to one fleet; if it does, it belongs in
`fleet.config.example.json` with a placeholder value.

Machine-absolute paths are never committed here — not in a doc, not in an
example, not in a script default.

## Three design decisions, so they are not undone by accident
- **`fleet.mjs` has zero dependencies and shells out only to `gh`.** Every
  forge call checks the exit code before reading stdout and never parses an
  error body as data. Keep it that way; a dependency here is a dependency
  for every fleet that installs the plugin.
- **No `hooks/hooks.json`.** A plugin hook is active the moment the plugin is
  enabled, and these rules are too opinionated to impose on every repository
  a user has. The hooks live in `docs/optional-hooks.md` as opt-in.
- **Management and lane agent files say they normally run as their own
  session.** They must heartbeat and be woken by messages, and a subagent can
  do neither — a foreground subagent call blocks the caller's turn entirely.
  Only `fleet-worker` and `fleet-verifier` are meant for direct dispatch.
  Keep that line in each file if you edit it.

## Working in this plugin
- Every command/agent/skill `.md` needs YAML frontmatter (`name` +
  `description` at minimum; commands take `description`, not `name`).
- Every agent file sets `model:`. That is the plugin's own descending-model
  rule applied to itself.
- Keep `CONTEXT_SUMMARY.md` under **120 lines and ~3000 characters** — the
  repo's `check:plugin-context` gate enforces both — and keep its
  "when to open deeper docs" table, which the same gate greps for.
- Update `CONTEXT_SUMMARY.md` and this file's counts when you add or remove a
  command, agent or skill.

## Validation
From the repo root:

```
pnpm check:marketplace
pnpm check:plugin-context
pnpm build:site && pnpm check:site
claude plugin validate ./plugins/fleet-orchestration --strict
node plugins/fleet-orchestration/scripts/validate-heartbeat.mjs --self-test
node plugins/fleet-orchestration/scripts/fleet.mjs --self-test
```

The site data file is generated and tracked: adding a plugin without
regenerating it fails `check:site` on an exact count comparison.

## See also
- `README.md` — what the system is for, and what it cost to learn.
- `CONTEXT_SUMMARY.md` — bootstrap context summary.
