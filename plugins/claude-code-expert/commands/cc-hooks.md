---
name: claude-code-expert:cc-hooks
intent: Install, list, remove, and debug Claude Code hook packs. Integrates with the 8 security-hardened packs in the plugin's MCP KB.
tags:
  - claude-code-expert
  - command
  - cc-hooks
inputs: []
risk: medium
cost: medium
description: Install, list, remove, and debug Claude Code hook packs. Integrates with the 8 security-hardened packs in the plugin's MCP KB.
---

# /cc-hooks — Manage Hook Packs

Wraps the hooks skill and MCP `cc_kb_hook_recipe` tool.

## Usage

```bash
/cc-hooks list                      # Show installed + available packs
/cc-hooks install <pack>            # Install a pack (script + settings.json merge)
/cc-hooks remove <pack>             # Remove pack (script + settings.json unmerge)
/cc-hooks recommend                 # Recommend packs based on repo signals
/cc-hooks test <pack>               # Run pack against a fixture — see decision output
/cc-hooks debug <event> <matcher>   # Show what fires when, execution order
```

## Installable packs

Fetch details via `cc_kb_hook_recipe(name)`:

| Pack | Event | Purpose |
|---|---|---|
| `protect-sensitive-files` | PreToolUse (Write\|Edit) | Block writes to .env / credentials / keys |
| `auto-format-after-edit` | PostToolUse (Write\|Edit) | Prettier / black / rustfmt / gofmt |
| `stop-until-tests-pass` | Stop | Block Stop until test suite green |
| `post-compact-context-restoration` | (after /compact) | Reload memory rules + recent context |
| `direnv-reload-on-cwd-change` | (cwd change) | Reload .envrc for direnv users |
| `task-created-governance` | Notification | Log new task creation |
| `task-completed-quality-gate` | Stop | Enforce lint + test before task completion |
| `teammate-idle-enforcement` | (periodic) | Kill idle teammate processes |

## Installation flow

1. `install <pack>`:
   - Fetches script via MCP (`cc_kb_hook_recipe(pack)`).
   - Writes `.claude/hooks/{pack}.sh` with `chmod +x`.
   - Merges `settings_snippet` into `.claude/settings.json` under `hooks.{Event}`.
   - Runs verify step (from KB) to confirm pack is wired.

2. `remove <pack>`:
   - Unmerges settings.json entry.
   - Optionally deletes `.claude/hooks/{pack}.sh` (asks; keeps script on disk by default).

## Recommendations (`recommend`)

Runs `cc_docs_hook_pack_recommend(signals)` with auto-detected repo signals (has_formatter, has_tests, has_secrets, has_git, …). Returns shortlist of packs with rationale.

## All hook events (complete reference)

Sourced from the Claude Agent SDK. All events are available in `settings.json` under `hooks.{Event}`.

| Event | Fires when | Can block? | Typical use |
|---|---|---|---|
| `PreToolUse` | Before any tool call | Yes — return `{"decision":"block"}` | Guard writes, validate paths |
| `PostToolUse` | After a tool call succeeds | No | Reformat, log, audit |
| `PostToolUseFailure` | After a tool call fails | No | Capture errors → lessons-learned |
| `Notification` | Claude emits a user-facing notification | No | Log, webhook, Slack alert |
| `Stop` | Claude is about to stop responding | Yes | Enforce test pass, quality gate |
| `SessionStart` | A new session begins | No | Load context, inject rules |
| `SessionEnd` | Session is ending | No | Summarize, archive to memory |
| `SubagentStart` | A subagent is spawned | Yes | Audit which agents fire, enforce budget |
| `SubagentStop` | A subagent completes or is stopped | No | Collect telemetry, capture output |
| `TeammateIdle` | A teammate process has been idle too long | Yes | Kill stale processes, alert |
| `PreCompact` | Before `/compact` context compaction | No | Save key context to memory before window shrinks |
| `UserPromptSubmit` | User submits a prompt | Yes | Enforce prompt policies, inject context |
| `PermissionRequest` | A permission check fires | Yes | Auto-approve known-safe tools |
| `Setup` | During initial session setup | No | Bootstrap rules, check environment |

**Matchers** use regex on tool name or event type, e.g. `"Write|Edit"`, `"^mcp__"`, `""` (match all).

**Priority**: `deny` > `ask` > `allow` — if any hook returns `{"decision":"block"}`, the operation is blocked regardless of other hooks.

## Debugging (`debug`)

Shows:
- Which packs fire on the given event + matcher combination
- Execution order
- Their output format
- Test fixture to verify behavior
