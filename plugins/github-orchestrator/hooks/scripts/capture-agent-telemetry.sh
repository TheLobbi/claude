#!/usr/bin/env bash
#
# capture-agent-telemetry.sh — SubagentStop hook.
#
# Appends one JSONL record per completed subagent to
# .claude/orchestration/telemetry/gh-agent-runs.jsonl so agent cost, duration,
# and turn usage can be profiled over time.
#
# All fields are built with jq — never string concatenation — so agent output
# cannot break the record or inject fields. Writes are serialized with flock
# where available, since subagents finish concurrently.

set -euo pipefail

INPUT="$(cat)"

approve() {
  printf '%s\n' '{"decision":"approve"}'
  exit 0
}

command -v jq >/dev/null 2>&1 || approve

PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
TELEMETRY_DIR="${PROJECT_ROOT}/.claude/orchestration/telemetry"
TELEMETRY_FILE="${TELEMETRY_DIR}/gh-agent-runs.jsonl"

mkdir -p "$TELEMETRY_DIR" 2>/dev/null || approve

AGENT="$(printf '%s' "$INPUT" | jq -r '.agent_name // .subagent_type // "unknown"')"
STATUS="$(printf '%s' "$INPUT" | jq -r '.status // "unknown"')"
TURNS="$(printf '%s' "$INPUT" | jq -r '.turns // 0')"
DURATION="$(printf '%s' "$INPUT" | jq -r '.duration_ms // 0')"
SESSION="$(printf '%s' "$INPUT" | jq -r '.session_id // "unknown"')"
TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

RECORD="$(
  jq -nc \
    --arg ts "$TIMESTAMP" \
    --arg plugin "github-orchestrator" \
    --arg agent "$AGENT" \
    --arg status "$STATUS" \
    --arg session "$SESSION" \
    --argjson turns "${TURNS:-0}" \
    --argjson duration "${DURATION:-0}" \
    '{timestamp:$ts, plugin:$plugin, agent:$agent, status:$status, session:$session, turns:$turns, duration_ms:$duration}'
)" || approve

if command -v flock >/dev/null 2>&1; then
  (
    flock -w 5 9 || exit 0
    printf '%s\n' "$RECORD" >>"$TELEMETRY_FILE"
  ) 9>"${TELEMETRY_FILE}.lock"
else
  printf '%s\n' "$RECORD" >>"$TELEMETRY_FILE"
fi

approve
