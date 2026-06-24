# Hook Event Matrix

Complete input/output contract for each hook event. All inputs are JSON on stdin (max 64 KB); all outputs are single-line JSON on stdout.

**Common stdin fields** (present on every event): `session_id`, `transcript_path`, `cwd`, `permission_mode` (`default|plan|acceptEdits|auto|dontAsk|bypassPermissions`), and `hook_event_name`. Inside a subagent you also get `agent_id` and `agent_type`. The per-event fields below are *in addition* to these.

## PreToolUse

**Fires**: before any tool call (after Claude decides to call, before the tool runs).
**Input**:
```json
{
  "tool_name": "Write|Edit|Bash|Read|Agent|...",
  "tool_input": { /* tool-specific */ }
}
```
**Output** (legacy `decision` form still works; the current form is `hookSpecificOutput`):
```json
{ "hookSpecificOutput": { "permissionDecision": "allow" } }
// or deny / ask, with an optional reason and rewritten input:
{ "hookSpecificOutput": { "permissionDecision": "deny", "permissionDecisionReason": "...", "updatedInput": { } } }
// inject context without changing the decision:
{ "hookSpecificOutput": { "additionalContext": "note shown to Claude" } }
```
`permissionDecision: "defer"` hands the decision back to the normal permission flow. **Latency budget**: <100ms. Hook runs in the critical path.

## PostToolUse

**Fires**: after a tool completes successfully.
**Input**:
```json
{
  "tool_name": "...",
  "tool_input": { /* ... */ },
  "tool_output": "..."
}
```
**Output**: same as PreToolUse. `block` here annotates the result — it does not undo the tool call.
**Latency budget**: <500ms.

## PostToolUseFailure

**Fires**: after a tool fails (exception, non-zero exit, validation error).
**Input**:
```json
{
  "tool_name": "...",
  "tool_input": { /* ... */ },
  "error": "error message"
}
```
**Output**: usually `{"decision":"approve"}`. Useful for error capture / lessons-learned logging.

## Notification

**Fires**: when Claude needs user input (e.g. permission prompt, clarification).
**Input**: `{"message": "..."}`
**Output**: `{"decision":"approve"}`
**Use**: send to Slack/Discord/PagerDuty, play a sound, etc.

## Stop

**Fires**: when Claude finishes a response turn.
**Input**: `{"stop_reason": "end_turn|max_tokens|..."}`
**Output**: `{"decision":"approve"}`
**Use**: end-of-turn reminders, test gates, memory consolidation triggers.

## UserPromptSubmit

**Fires**: when user submits a prompt.
**Input**: `{"prompt": "..."}`
**Output**: `{"decision":"approve"}` — optionally modify the prompt by writing to stderr, which gets shown to Claude as additional context.
**Use**: inject dynamic context (branch, uncommitted count, date), enforce conventions on user input.

## SessionStart

**Fires**: once when a new session begins.
**Input**: `{"source": "startup|resume|clear|..."}`
**Output**: `{"hookSpecificOutput": {"additionalContext": "..."}}` to inject context at session start.
**Use**: load memory context, print session header, check for stale rules.

## SessionEnd

**Fires**: when a session is ending.
**Input**: `{}`
**Output**: `{"decision":"approve"}`
**Use**: summarize the session, archive learnings to memory, flush telemetry.

## PreCompact

**Fires**: before context compaction (`/compact` or automatic near the context limit).
**Input**: `{}`
**Output**: `{"decision":"approve"}`
**Use**: persist anchors / key decisions to memory so they survive the summary. Pair with a SessionStart hook that re-injects them.

## SubagentStart

**Fires**: when a subagent (Agent tool) is spawned.
**Input**: `{"agent_type": "..."}`
**Output**: `{"decision":"approve"}` — `block` to gate which agents may fire or enforce a budget.
**Use**: audit/limit fan-out, enforce a prompt-budget preflight.

## SubagentStop

**Fires**: when a subagent completes or is stopped.
**Input**: `{"agent_id": "...", "agent_type": "..."}`
**Output**: `{"decision":"approve"}`
**Use**: collect per-agent telemetry (see `hooks/capture-agent-telemetry.sh`), capture output for the parent.

## TeammateIdle

**Fires**: when a teammate/agent process has been idle past a threshold.
**Input**: `{"agent_id": "..."}`
**Output**: `{"decision":"approve"}` — `block` to terminate the stale process.
**Use**: reap idle background agents, alert on stalled teams.

## PermissionRequest

**Fires**: when a permission check is about to prompt the user.
**Input**: `{"tool_name": "...", "tool_input": { /* ... */ }}`
**Output**: `{"hookSpecificOutput": {"decision": {"behavior": "allow|deny", "updatedInput": {}, "addPermissionRule": {}}}}`
**Use**: auto-approve known-safe tools, persist a new allow rule, reduce prompt fatigue.

## Setup

**Fires**: during initial session setup (before the first turn).
**Input**: `{}`
**Output**: `{"decision":"approve"}`
**Use**: bootstrap rules, verify environment/toolchain, fail fast on misconfiguration.

## Matcher patterns

In `.claude/settings.json`, each event array has entries with `matcher` (regex) + `hooks` array.

| Matcher | Fires on |
|---|---|
| `Write` | Write tool only |
| `Write\|Edit` | Write or Edit |
| `Bash` | Bash tool |
| `*` or missing | All tools |
| `(Write\|Edit\|MultiEdit)` | Any file-write tool |

## Tool input keys you'll commonly extract

- `tool_input.file_path` — Write, Edit, Read
- `tool_input.path` — some file tools
- `tool_input.command` — Bash
- `tool_input.pattern` — Grep, Glob
- `tool_input.query` — WebSearch

Use `jq -r '.tool_input.file_path // .tool_input.path // ""'` to cover variants safely.
