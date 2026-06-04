---
name: hooks
description: Design, install, and debug Claude Code hooks across the full lifecycle (PreToolUse, PostToolUse, PostToolUseFailure, UserPromptSubmit, Notification, Stop, SessionStart, SessionEnd, PreCompact, SubagentStart, SubagentStop, TeammateIdle, PermissionRequest, Setup). Use this skill whenever a user asks to "install hooks", "add a pre-tool hook", "format on save", "block dangerous commands", "protect sensitive files", "restore context after compact", "enforce tests before stop", capture subagent telemetry, or runs /cc-hooks. Also triggers on "hooks not firing", "hook keeps blocking", or any configuration of .claude/settings.json hook sections.
---

# Hooks

Hooks are Claude Code's automation surface — deterministic bash (or any shell) scripts that fire on lifecycle events. Each hook receives JSON on stdin and returns JSON on stdout: `{"decision": "approve"|"block", "reason"?: "..."}`.

## Events (matcher + input + output)

Every hook also receives common fields on stdin: `session_id`, `transcript_path`, `cwd`, `permission_mode`, and `hook_event_name` (plus `agent_id`/`agent_type` inside subagents).

| Event | Fires | Input (event-specific) | Output shape |
|---|---|---|---|
| `PreToolUse` | Before any tool | `{tool_name, tool_input}` | `hookSpecificOutput.permissionDecision: allow\|deny\|ask\|defer`, `updatedInput?`, `additionalContext?` |
| `PostToolUse` | After tool succeeds | `{tool_name, tool_input, tool_output}` | `{decision, reason?}` |
| `PostToolUseFailure` | After tool fails | `{tool_name, tool_input, error}` | `{decision}` — almost always approve |
| `UserPromptSubmit` | Prompt submitted | `{prompt}` | `{decision}` + `additionalContext?` / optional modified prompt |
| `Notification` | Claude emits a user-facing notification | `{message}` | `{decision}` |
| `Stop` | Claude is about to stop responding | `{stop_reason}` | `{decision}` — block to force more work (e.g. tests must pass) |
| `SessionStart` | New session begins | `{source}` | `additionalContext?` — context/rule injection |
| `SessionEnd` | Session is ending | `{}` | `{decision}` — summarize, archive to memory |
| `PreCompact` | Before `/compact` (manual or auto) | `{}` | save key context to memory before it's summarized |
| `SubagentStart` | A subagent is spawned | `{agent_type}` | block to enforce budget / gate which agents may fire |
| `SubagentStop` | A subagent completes or is stopped | `{agent_id, agent_type}` | collect telemetry, capture output |
| `TeammateIdle` | A teammate process has been idle too long | `{agent_id}` | kill stale processes, alert |
| `PermissionRequest` | A permission check fires | `{tool_name, tool_input}` | auto-approve/deny known-safe tools, add permission rules |
| `Setup` | During initial session setup | `{}` | bootstrap rules, check environment |

This is the practical working set. Hook events that block (return a deny/block decision): `PreToolUse`, `Stop`, `UserPromptSubmit`, `SubagentStart`, `TeammateIdle`, `PermissionRequest`. The rest are observe-only.

## Installing a hook pack

Use MCP `cc_kb_hook_recipe(name)` to fetch a security-hardened pack. Each pack returns:
- `script` — the bash script content
- `script_path` — target path (`.claude/hooks/{name}.sh`)
- `settings_snippet` — the JSON to merge into `.claude/settings.json`
- `verify` — one-line manual test

Available pack names (fetch a shortlist first via `cc_docs_hook_pack_recommend(signals)`):
- `protect-sensitive-files` — block writes to .env/credentials (always recommended)
- `auto-format-after-edit` — prettier/black/rustfmt on Write|Edit
- `stop-until-tests-pass` — block Stop if tests fail
- `post-compact-context-restoration` — re-load memory rules after /compact
- `direnv-reload-on-cwd-change` — reload .envrc on cd
- `task-created-governance` — log new tasks to memory
- `task-completed-quality-gate` — enforce lint+test before task completion
- `teammate-idle-enforcement` — prevent idle teammate processes

## Authoring a new hook

```bash
#!/bin/bash
set -euo pipefail
INPUT=$(head -c 65536)

# Validate JSON input
if ! printf '%s' "$INPUT" | jq -e . >/dev/null 2>&1; then
  echo '{"decision":"approve"}'; exit 0
fi

# Extract fields you need
FILE=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // ""')

# Validate path (prevent injection + traversal)
[ -z "$FILE" ] && { echo '{"decision":"approve"}'; exit 0; }
REAL=$(realpath "$FILE" 2>/dev/null) || { echo '{"decision":"approve"}'; exit 0; }
WD=$(realpath "$PWD")
[[ "$REAL" != "$WD"/* ]] && { echo '{"decision":"approve"}'; exit 0; }
BN=$(basename "$REAL")
[[ "$BN" == -* ]] && { echo '{"decision":"approve"}'; exit 0; }

# Do the work...

# Always emit valid JSON
echo '{"decision":"approve"}'
```

**Safety rules:**
1. Always cap input with `head -c`.
2. Always validate JSON before parsing.
3. Always `realpath` + PWD-prefix check before touching a file.
4. Reject filenames starting with `-` (flag injection).
5. Never `eval` or unquoted-interpolate user content.
6. Default to `{"decision":"approve"}` on any error — never block on bugs.
7. For concurrent writes to shared files (e.g. a log), use `flock`.

## Registering in settings.json

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [{ "type": "command", "command": "bash .claude/hooks/protect-sensitive-files.sh" }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [{ "type": "command", "command": "bash .claude/hooks/auto-format-after-edit.sh" }]
      }
    ]
  }
}
```

Matchers are regex. `Write|Edit` fires for both tools. `*` fires for all tools.

## Debugging

1. **Hook not firing**: check `.claude/settings.json` has the event + matcher. Matcher regex is case-sensitive.
2. **Hook blocks unexpectedly**: check the hook's stderr output — Claude Code prints it.
3. **Hook slow**: profile with `time bash .claude/hooks/...`. Target <100ms for PreToolUse, <500ms for PostToolUse.
4. **JSON parse error**: run `bash .claude/hooks/x.sh < fixture.json` locally.

## MCP delegation

| Need | Tool |
|---|---|
| Fetch a specific hook pack | `cc_kb_hook_recipe(name)` |
| Recommend packs from signals | `cc_docs_hook_pack_recommend({has_formatter, has_tests, has_secrets, has_git, ...})` |

## Anti-patterns

- Hooks that call LLMs → slow and non-deterministic. Hooks should be fast local computation.
- Hooks that `rm -rf` or delete files → use `Bash` tool with user confirmation, not a hook.
- Hooks that swallow errors without emitting approve → hangs the session.
- Multiple hooks on same event that fight each other → run them sequentially in one script or use distinct matchers.

## Reference

- [hook-event-matrix.md](references/hook-event-matrix.md) — full event → input → output contract per event
