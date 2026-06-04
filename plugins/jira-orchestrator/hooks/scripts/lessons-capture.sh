#!/usr/bin/env bash
# lessons-capture.sh — PostToolUseFailure hook.
# Captures genuine tool failures as structured JSONL so the learning-coordinator
# and jira-advisor can surface recurring problems. Filters known false-positive
# classes (grep zero-match, tsc type-noise, expected 4xx, vitest red-green) per
# the self-healing rule. Advisory only: never blocks, never fails the session.
set -euo pipefail

command -v jq >/dev/null 2>&1 || exit 0

INPUT="$(cat)"

TOOL="$(printf '%s' "${INPUT}" | jq -r '(.tool_name // .tool // "unknown")' 2>/dev/null || echo unknown)"
ERROR="$(printf '%s' "${INPUT}" | jq -r '(.error // .tool_response.error // .tool_response // .message // "")' 2>/dev/null || echo '')"

# --- False-positive filter (hardcoded; never sourced externally) -------------
is_false_positive() {
  local e="$1"
  printf '%s' "${e}" | grep -Eqi \
    'no matches found|0 matches|exit code 1[^0-9].*grep|tsconfig.*not be loaded|TS6133|TS6196|status code 4[0-9][0-9].*(expected|test)|vitest.*(fail).*(retr|expected)' \
    && return 0
  return 1
}
[ -n "${ERROR}" ] || exit 0
if is_false_positive "${ERROR}"; then exit 0; fi

# Sanitize: strip backticks, control chars; clamp length (defense in depth).
sanitize() { printf '%s' "$1" | tr -d '`\000-\010\013\014\016-\037' | cut -c1-500; }
TOOL="$(printf '%s' "${TOOL}" | tr -cd '[:alnum:]:_-' | cut -c1-60)"
ERROR_CLEAN="$(sanitize "${ERROR}")"

TELEMETRY_DIR="${CLAUDE_PROJECT_DIR:-${TMPDIR:-/tmp}}/.claude/orchestration/telemetry"
if ! mkdir -p "${TELEMETRY_DIR}" 2>/dev/null; then
  TELEMETRY_DIR="${TMPDIR:-/tmp}/jira-orchestrator-telemetry"
  mkdir -p "${TELEMETRY_DIR}" 2>/dev/null || exit 0
fi
LOG_FILE="${TELEMETRY_DIR}/jira-lessons.jsonl"

RECORD="$(jq -nc \
  --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --arg tool "${TOOL}" \
  --arg error "${ERROR_CLEAN}" \
  '{ts:$ts, plugin:"jira-orchestrator", tool:$tool, error:$error, status:"NEEDS_FIX"}' 2>/dev/null || true)"
[ -n "${RECORD}" ] || exit 0

( flock -w 2 9 || exit 0; printf '%s\n' "${RECORD}" >>"${LOG_FILE}" ) 9>"${LOG_FILE}.lock" 2>/dev/null || true

exit 0
