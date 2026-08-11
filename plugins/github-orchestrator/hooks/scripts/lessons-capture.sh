#!/usr/bin/env bash
#
# lessons-capture.sh — PostToolUseFailure hook.
#
# Appends a JSONL record for each tool failure to
# .claude/orchestration/telemetry/gh-failures.jsonl, after filtering the known
# false-positive classes that would otherwise drown the real signal.
#
# Inputs are sanitized and every field is constructed with jq, so a failure
# message containing backticks, quotes, or newlines cannot break the record or
# inject fields.

set -euo pipefail

INPUT="$(cat)"

approve() {
  printf '%s\n' '{"decision":"approve"}'
  exit 0
}

command -v jq >/dev/null 2>&1 || approve

PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
TELEMETRY_DIR="${PROJECT_ROOT}/.claude/orchestration/telemetry"
FAILURE_FILE="${TELEMETRY_DIR}/gh-failures.jsonl"
SKIPPED_FILE="${TELEMETRY_DIR}/gh-failures-skipped.jsonl"

mkdir -p "$TELEMETRY_DIR" 2>/dev/null || approve

TOOL="$(printf '%s' "$INPUT" | jq -r '.tool_name // "unknown"')"
ERROR="$(printf '%s' "$INPUT" | jq -r '.error // .tool_response.error // ""')"
COMMAND="$(printf '%s' "$INPUT" | jq -r '.tool_input.command // ""')"
TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Truncate to keep records bounded; the full error stays in the transcript.
ERROR="$(printf '%s' "$ERROR" | head -c 2000)"
COMMAND="$(printf '%s' "$COMMAND" | head -c 500)"

write_record() {
  local file="$1" reason="$2"
  local record
  record="$(
    jq -nc \
      --arg ts "$TIMESTAMP" \
      --arg plugin "github-orchestrator" \
      --arg tool "$TOOL" \
      --arg error "$ERROR" \
      --arg command "$COMMAND" \
      --arg reason "$reason" \
      '{timestamp:$ts, plugin:$plugin, tool:$tool, error:$error, command:$command, reason:$reason}'
  )" || return 0

  if command -v flock >/dev/null 2>&1; then
    (
      flock -w 5 9 || exit 0
      printf '%s\n' "$record" >>"$file"
    ) 9>"${file}.lock"
  else
    printf '%s\n' "$record" >>"$file"
  fi
}

# Known false-positive classes. These are normal working signals, not defects;
# capturing them buries the failures that actually deserve a fix.
#   * grep / rg exit 1 — zero matches is a valid result
#   * tsc exit 2       — type errors during an in-progress edit
#   * test red-green   — expected during test-driven iteration
#   * expected 4xx     — probing an endpoint that is meant to 404
if printf '%s' "$ERROR" | grep -Eqi 'exit code 1$' && printf '%s' "$COMMAND" | grep -Eq '(^|[[:space:]])(grep|rg)([[:space:]]|$)'; then
  write_record "$SKIPPED_FILE" "grep-zero-match"
  approve
fi

if printf '%s' "$ERROR" | grep -Eqi 'exit code 2' && printf '%s' "$COMMAND" | grep -Eq 'tsc'; then
  write_record "$SKIPPED_FILE" "tsc-typecheck-iteration"
  approve
fi

if printf '%s' "$COMMAND" | grep -Eq '(vitest|jest|pytest|node --test)' && printf '%s' "$ERROR" | grep -Eqi '(test|spec).*(fail)'; then
  write_record "$SKIPPED_FILE" "test-red-green-iteration"
  approve
fi

write_record "$FAILURE_FILE" "captured"
approve
