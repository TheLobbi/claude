# Claude Code Capability Baseline — June 2026

Authoritative snapshot of what Claude Code can do as of **June 10, 2026**, used to keep this
plugin's skills, commands, and agents current. When a skill or command contradicts this file,
this file wins — update the skill. Sourced from `code.claude.com/docs` plus the live runtime
tool surface.

> Maintenance: re-verify model IDs and the tool list each time the plugin is refreshed.
> Prefer **aliases** (`opus`/`sonnet`/`haiku`) over pinned IDs in agent/skill frontmatter so a
> model refresh doesn't strand config.

---

## Models (current generation)

| Alias | Latest ID | Use |
|---|---|---|
| `fable` | `claude-fable-5` | Hardest long-horizon agentic runs, overnight builds, deepest reasoning — the Claude 5 / Mythos-class tier above Opus |
| `opus` | `claude-opus-4-8` | Architecture, hard debugging, security review, planning/review gates |
| `sonnet` | `claude-sonnet-4-6` | Implementation, code review, refactoring, test writing |
| `haiku` | `claude-haiku-4-5-20251001` | Retrieval, research, docs, bulk mechanical edits |

Helper aliases: `best` (most capable available), `opusplan` (Opus reasoning → Sonnet execution),
`opus[1m]` / `sonnet[1m]` (extended 1M-token context). `default` resolves per plan tier.
The `Agent` tool's `model` override accepts `fable` alongside `sonnet`/`opus`/`haiku`.

### Claude Fable 5 / Mythos 5 (new tier, June 2026)

**Fable 5** (`claude-fable-5`) is the first Claude 5 model — a Mythos-class tier *above* Opus
in capability, not an Opus replacement. **Mythos 5** (`claude-mythos-5`) is the same underlying
model without Fable's additional dual-use safety measures, available only to approved
organizations (Project Glasswing). See https://www.anthropic.com/news/claude-fable-5-mythos-5.

What changes in practice when routing to Fable 5:

- **1M context by default** (128K max output); `claude-fable-5[1m]` is the long-context ID form.
- **Thinking is always on** — there is no thinking toggle; depth is controlled purely by
  `effort` (`low` → `max`, including `xhigh`). Even `low` effort on Fable often beats `max` on
  prior models for routine work.
- **Longer turns** — single hard-task turns can run many minutes; plan for async check-ins and
  background agents rather than blocking.
- **Dependable parallel/async delegation** — sustains long-running subagents and teammate
  messaging well; prior-model guardrails that suppressed delegation should be relaxed.
- **~3.3× Sonnet pricing** ($10/$50 per MTok) vs Opus 4.8's ~1.7× ($5/$25) — reserve it for
  work above what Opus handles, not as a blanket default.
- Safety classifiers may refuse research-bio / most cybersecurity content (`refusal` stop
  reason); requires 30-day data retention (not available under ZDR).

- **Effort levels** (reasoning depth, independent of model): `low` · `medium` · `high` · `xhigh` · `max`.
  Opus 4.7/4.8 and Fable 5 support `xhigh`. Set with `/effort`, `--effort <level>`, or `effort:` in
  skill/agent frontmatter. Bumping effort is cheaper than jumping a model tier when you only need
  deeper thinking.
- **Fast mode** (`/fast`, `--fast`): keeps you on Opus (4.6/4.7/4.8) with faster output — it does
  **not** downgrade to a smaller model. Not available on Fable 5.

---

## Tools (built-in surface)

The runtime exposes more than the classic `Read/Write/Edit/Bash/Glob/Grep`. Current additions worth
knowing when writing skills, agents, and `allowed-tools` lists:

| Tool | What it does |
|---|---|
| `Agent` | Spawns a subagent / teammate (the tool formerly called `Task`). Supports `subagent_type`, `model`, `run_in_background`, `isolation: "worktree"`, `mode` (permission mode), and `team_name`. |
| `ToolSearch` | Discovers **deferred** MCP tool schemas on demand so sessions can connect to thousands of tools without context bloat. Default-on. |
| `AskUserQuestion` | Presents the user 1–4 structured multiple-choice questions mid-task. Use for genuine decisions you can't resolve from the code or sensible defaults — not for confirmations. |
| `Monitor` | Watches a log/file/condition in the background and wakes Claude on change. See `skills/cc-monitor-tool/`. |
| `SendUserFile` | Surfaces a file to the user as a first-class deliverable (diagram, report, build artifact, screenshot). |
| `EnterPlanMode` / `ExitPlanMode` | Enter/leave read-only planning (also `Shift+Tab` interactively). In plan mode only Read/Grep/Glob/LSP run — no mutations. |
| `EnterWorktree` / `ExitWorktree` | Create/enter an isolated git worktree (parallel agents without file contention). |
| `NotebookEdit` | Edit Jupyter notebook cells. |
| `PushNotification` | Desktop notification (and mobile push if a remote-control session is connected) for long-running work. |
| `WebFetch` / `WebSearch` | Built-in web access (project rules here prefer Perplexity/Firecrawl/Context7 MCP instead). |

**Renames / deprecations:** `Task` → `Agent`; "Claude Code SDK" → **Agent SDK**; MCP `sse` transport →
prefer `http`.

---

## Subagents, agent teams & background work

- **Subagents** run in a fresh, isolated context; only the final message returns to the parent.
  A built-in `general-purpose` agent is always available.
- **Background agents**: `run_in_background: true` (tool) / `background: true` (frontmatter) runs an
  agent non-blocking; you're notified on completion.
- **Worktree isolation**: `isolation: "worktree"` pins an agent to its own git worktree (auto-cleaned
  if unchanged). See `skills/cc-worktree-management/`.
- **Agent teams**: multiple named agents coordinate and message each other via **`SendMessage`**
  (address by name or ID to continue a teammate with its context intact). A new `Agent` call starts
  fresh. See `skills/cc-agent-teams/`.
- **Plan mode for spawned agents**: pass `mode: "plan"` to require a plan before a teammate acts.

Agent frontmatter fields (filesystem + SDK): `name`, `description`, `model`, `effort`, `tools`,
`disallowedTools`, `skills`, `memory` (`user|project|local`), `maxTurns`, `background`, `isolation`.

---

## Hooks (lifecycle)

Practical working set of events (full contract in `skills/cc-hook-authoring/references/hook-event-matrix.md`):

`PreToolUse` · `PostToolUse` · `PostToolUseFailure` · `UserPromptSubmit` · `Notification` · `Stop` ·
`SessionStart` · `SessionEnd` · `PreCompact` · `SubagentStart` · `SubagentStop` · `TeammateIdle` ·
`PermissionRequest` · `Setup`.

Every hook receives common stdin fields: `session_id`, `transcript_path`, `cwd`, `permission_mode`,
`hook_event_name` (+ `agent_id`/`agent_type` in subagents). `PreToolUse` and `PermissionRequest`
return a `hookSpecificOutput.permissionDecision` (`allow|deny|ask|defer`) and can rewrite input or add
permission rules.

---

## Permissions & settings

Permission modes: `default` (ask) · `acceptEdits` · `plan` (read-only) · `auto` (auto-classify with
hard deny rules; per-session opt-in) · `dontAsk` · `bypassPermissions`.

`permissions` rules use `allow` / `deny` / `ask` lists with tool-scoped patterns, e.g.
`Bash(npm run *)`, `Read(.env*)`, `WebFetch(domain:example.com)`, `Edit(src/**)`.

Settings precedence (high → low): managed → CLI args → `.claude/settings.local.json` →
`.claude/settings.json` → `~/.claude/settings.json`. Relevant fields include `model`, `effortLevel`,
`permissions`, `hooks`, `env`, `outputStyle`, `availableModels`, `autoMemoryEnabled`.

---

## Memory

- **`CLAUDE.md`** — project instructions, loaded in full at session start; supports `@path` imports.
- **File-based auto memory** — durable facts as individual files under the session's memory dir, with a
  `MEMORY.md` index loaded each session. `/memory` manages it.
- **Scoped rules** — `.claude/rules/*.md`, optionally gated by a `paths:` frontmatter glob.
- `/context` shows what's consuming the window; `/compact` summarizes (pair with a `PreCompact` hook to
  preserve anchors).

This plugin layers its own three-tier model on top: engram (working) + Obsidian vault (durable) +
plugin `memory/rules/` (baseline). See `CLAUDE.md` and `skills/cc-second-brain/`.

---

## Claude Code on the web / remote execution

- Runs in the terminal, desktop app, IDE extensions, **and the web** (claude.ai/code) on
  Anthropic-managed cloud VMs.
- Cloud sessions clone the repo fresh into an ephemeral container — commit/push anything worth keeping.
- **Network policy** is chosen per environment; setup scripts install dependencies once per environment.
- Move between environments: continue a web session locally, or push a local session to the cloud.
- **GitHub integration**: cloud sessions can watch a PR and respond to CI failures / review comments,
  driven by PR-activity events (subscribe/unsubscribe). See the platform docs for the GitHub MCP surface.
- Also available via the **Agent SDK** (Python + TypeScript) and `--print`/headless mode for CI.

Reference: https://code.claude.com/docs
