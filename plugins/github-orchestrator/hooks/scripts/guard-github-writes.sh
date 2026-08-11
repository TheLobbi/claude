#!/usr/bin/env bash
#
# guard-github-writes.sh — PreToolUse guard for destructive or policy-violating
# GitHub operations.
#
# Blocks, with a reason:
#   * force-push to a protected branch
#   * plain `git push --force` (requires --force-with-lease instead)
#   * `git reset --hard` / history rewrite on a protected branch
#   * branch-protection bypass flags on a merge
#   * PR/issue bodies containing credential-shaped strings
#
# Contract: reads the tool-call JSON on stdin, writes a decision object to
# stdout, exits 0. Anything it does not recognize is approved — this is a
# targeted guard, not an allowlist.

set -euo pipefail

INPUT="$(cat)"

approve() {
  printf '%s\n' '{"decision":"approve"}'
  exit 0
}

block() {
  local reason="$1"
  jq -nc --arg reason "$reason" '{decision:"block", reason:$reason}'
  exit 0
}

command -v jq >/dev/null 2>&1 || approve

TOOL_NAME="$(printf '%s' "$INPUT" | jq -r '.tool_name // empty')"
[ -n "$TOOL_NAME" ] || approve

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
POLICY_FILE="${PLUGIN_ROOT}/config/policies.json"

PROTECTED="main master develop release"
if [ -r "$POLICY_FILE" ]; then
  FROM_POLICY="$(jq -r '(.protectedBranches // []) | join(" ")' "$POLICY_FILE" 2>/dev/null || printf '')"
  [ -n "$FROM_POLICY" ] && PROTECTED="$FROM_POLICY"
fi

is_protected() {
  local ref="$1" pattern
  for pattern in $PROTECTED; do
    # shellcheck disable=SC2254 # pattern intentionally supports globs like release/*
    case "$ref" in
      $pattern) return 0 ;;
    esac
  done
  return 1
}

# ---------------------------------------------------------------- Bash guards
if [ "$TOOL_NAME" = "Bash" ]; then
  CMD="$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty')"
  [ -n "$CMD" ] || approve

  case "$CMD" in
    *"git push"*"--force"*)
      case "$CMD" in
        *"--force-with-lease"*) ;;
        *) block "Plain 'git push --force' is not permitted. Use --force-with-lease so a concurrent push is detected instead of overwritten." ;;
      esac
      for branch in $PROTECTED; do
        case "$CMD" in
          *"$branch"*) block "Force-push targets protected branch '${branch}'. Protected branches are never force-pushed." ;;
        esac
      done
      ;;
  esac

  case "$CMD" in
    *"git reset --hard"*|*"git filter-branch"*|*"git filter-repo"*)
      CURRENT_REF="$(git symbolic-ref --quiet --short HEAD 2>/dev/null || printf '')"
      if [ -n "$CURRENT_REF" ] && is_protected "$CURRENT_REF"; then
        block "History rewrite attempted on protected branch '${CURRENT_REF}'. Rewriting shared history is blocked; revert with a new commit instead."
      fi
      ;;
  esac

  case "$CMD" in
    *"--admin"*|*"--bypass"*)
      case "$CMD" in
        *"merge"*|*"gh pr"*) block "Branch-protection bypass flag detected. A bypass available to admins is still a bypass — clear the failing gate instead." ;;
      esac
      ;;
  esac

  approve
fi

# ------------------------------------------------- GitHub MCP write guards
case "$TOOL_NAME" in
  mcp__github__merge_pull_request)
    BYPASS="$(printf '%s' "$INPUT" | jq -r '.tool_input.bypass // .tool_input.admin // empty')"
    if [ "$BYPASS" = "true" ]; then
      block "Merge requested with branch-protection bypass. Clear the failing gate rather than overriding it."
    fi
    approve
    ;;

  mcp__github__create_pull_request|mcp__github__update_pull_request|mcp__github__issue_write|mcp__github__add_issue_comment|mcp__github__add_comment_to_pending_review|mcp__github__add_reply_to_pull_request_comment)
    BODY="$(printf '%s' "$INPUT" | jq -r '[.tool_input.body?, .tool_input.title?, .tool_input.description?] | map(select(. != null)) | join("\n")')"
    [ -n "$BODY" ] || approve

    # Credential-shaped strings. Matching the shape only; the value is never echoed.
    SECRET_PATTERNS='(AKIA[0-9A-Z]{16})|(ASIA[0-9A-Z]{16})|(gh[pousr]_[A-Za-z0-9]{20,})|(xox[baprs]-[A-Za-z0-9-]{10,})|(sk_live_[A-Za-z0-9]{16,})|(npm_[A-Za-z0-9]{30,})|(-----BEGIN [A-Z ]*PRIVATE KEY-----)|([a-z][a-z0-9+.-]*://[^/\s:@]+:[^/\s@]+@)'

    if printf '%s' "$BODY" | grep -Eq "$SECRET_PATTERNS"; then
      block "The body contains a credential-shaped string. Secrets must never be posted to GitHub. Remove it, and if it is a real credential, revoke it first — a secret that reaches a remote is compromised."
    fi
    approve
    ;;

  mcp__github__delete_file|mcp__github__push_files|mcp__github__create_or_update_file)
    REF="$(printf '%s' "$INPUT" | jq -r '.tool_input.branch // .tool_input.ref // empty')"
    if [ -n "$REF" ] && is_protected "$REF"; then
      block "Direct write to protected branch '${REF}'. Open a pull request instead."
    fi
    approve
    ;;
esac

approve
