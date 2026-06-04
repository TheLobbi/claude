#!/usr/bin/env bash
# capture-agent-telemetry.sh — SubagentStop hook.
# Appends one JSONL telemetry record per subagent completion so the
# jira-advisor and metrics agents can reason about reject-rate, duration,
# and which agents are actually used. Advisory only: never blocks, never
# fails the session.
set -euo pipefail

# jq is required for safe JSON construction; degrade silently if absent.
command -v jq >/dev/null 2>&1 || exit 0

INPUT="$(cat)"

# Resolve a writable telemetry directory (project first, then temp).
TELEMETRY_DIR="${CLAUDE_PROJECT_DIR:-${TMPDIR:-/tmp}}/.claude/orchestration/telemetry"
if ! mkdir -p "${TELEMETRY_DIR}" 2>/dev/null; then
  TELEMETRY_DIR="${TMPDIR:-/tmp}/jira-orchestrator-telemetry"
  mkdir -p "${TELEMETRY_DIR}" 2>/dev/null || exit 0
fi
LOG_FILE="${TELEMETRY_DIR}/jira-agent-telemetry.jsonl"

# Extract fields defensively; unknown shapes fall back to empty/null.
AGENT="$(printf '%s' "${INPUT}" | jq -r '(.subagent_type // .agent_type // .agent // .name // "unknown")' 2>/dev/null || echo unknown)"
STATUS="$(printf '%s' "${INPUT}" | jq -r '(.status // .result // "completed")' 2>/dev/null || echo completed)"
DURATION="$(printf '%s' "${INPUT}" | jq -r '(.duration_ms // .durationMs // .duration // 0)' 2>/dev/null || echo 0)"

# Sanitize the agent name to a safe token (defense in depth).
AGENT="$(printf '%s' "${AGENT}" | tr -cd '[:alnum:]:_-' | cut -c1-80)"
[ -n "${AGENT}" ] || AGENT="unknown"

RECORD="$(jq -nc \
  --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --arg agent "${AGENT}" \
  --arg status "${STATUS}" \
  --argjson duration "$(printf '%s' "${DURATION}" | grep -Eq '^[0-9]+$' && printf '%s' "${DURATION}" || echo 0)" \
  '{ts:$ts, plugin:"jira-orchestrator", agent:$agent, status:$status, duration_ms:$duration}' 2>/dev/null || true)"
[ -n "${RECORD}" ] || exit 0

# Atomic append under an advisory lock.
( flock -w 2 9 || exit 0; printf '%s\n' "${RECORD}" >>"${LOG_FILE}" ) 9>"${LOG_FILE}.lock" 2>/dev/null || true

exit 0
