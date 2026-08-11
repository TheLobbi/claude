#!/usr/bin/env bash
#
# pr-size-guard.sh — PreToolUse advisory on PR size.
#
# Warns (never blocks) when the diff against the base branch exceeds the
# prSizeBudget in config/policies.json, measured excluding lockfiles, generated
# files, and vendored paths. The budget protects review quality: defect
# detection falls off sharply above roughly 400 changed lines.
#
# Contract: reads the tool-call JSON on stdin, writes a decision object to
# stdout, exits 0.

set -euo pipefail

INPUT="$(cat)"

approve() {
  printf '%s\n' '{"decision":"approve"}'
  exit 0
}

approve_with_warning() {
  local message="$1"
  jq -nc --arg m "$message" '{decision:"approve", systemMessage:$m}'
  exit 0
}

command -v jq >/dev/null 2>&1 || approve
command -v git >/dev/null 2>&1 || approve
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || approve

TOOL_NAME="$(printf '%s' "$INPUT" | jq -r '.tool_name // empty')"
CMD="$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty')"

# Only evaluate when a push or PR creation is actually happening.
case "${TOOL_NAME}:${CMD}" in
  Bash:*"git push"*) ;;
  mcp__github__create_pull_request:*) ;;
  *) approve ;;
esac

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
POLICY_FILE="${PLUGIN_ROOT}/config/policies.json"

BUDGET=400
BASE="main"
if [ -r "$POLICY_FILE" ]; then
  POLICY_BUDGET="$(jq -r '.prSizeBudget // empty' "$POLICY_FILE" 2>/dev/null || printf '')"
  POLICY_BASE="$(jq -r '.defaultBranch // empty' "$POLICY_FILE" 2>/dev/null || printf '')"
  [ -n "$POLICY_BUDGET" ] && BUDGET="$POLICY_BUDGET"
  [ -n "$POLICY_BASE" ] && BASE="$POLICY_BASE"
fi

git rev-parse --verify --quiet "origin/${BASE}" >/dev/null 2>&1 || approve

MERGE_BASE="$(git merge-base HEAD "origin/${BASE}" 2>/dev/null || printf '')"
[ -n "$MERGE_BASE" ] || approve

# Count changed lines, excluding files that inflate a diff without adding
# review burden.
CHANGED="$(
  git diff --numstat "${MERGE_BASE}..HEAD" 2>/dev/null \
    | grep -Ev '(pnpm-lock\.yaml|package-lock\.json|yarn\.lock|\.generated\.|\.snap$|^vendor/|/vendor/|\.pb\.(go|ts|js)$)' \
    | awk '{ added += $1; removed += $2 } END { print (added + removed) + 0 }'
)"
[ -n "$CHANGED" ] || approve

if [ "$CHANGED" -gt "$BUDGET" ]; then
  approve_with_warning "PR size ${CHANGED} changed lines exceeds the budget of ${BUDGET} (lockfiles, generated files, and vendored paths already excluded). Reviewers find fewer defects above this size. Consider /gh:pr split to cut it into a stack."
fi

approve
