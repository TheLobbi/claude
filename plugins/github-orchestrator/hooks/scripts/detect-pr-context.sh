#!/usr/bin/env bash
#
# detect-pr-context.sh — UserPromptSubmit hook.
#
# Resolves the active GitHub context (branch, PR reference, dirty state) and
# injects a compact summary so the orchestrator does not have to rediscover it.
# Read-only: it never touches the working tree or the network.
#
# Contract: reads the prompt JSON on stdin, writes a decision object to stdout,
# exits 0.

set -euo pipefail

INPUT="$(cat)"

emit() {
  local context="${1:-}"
  if [ -z "$context" ]; then
    printf '%s\n' '{"decision":"approve"}'
  else
    jq -nc --arg c "$context" '{decision:"approve", hookSpecificOutput:{hookEventName:"UserPromptSubmit", additionalContext:$c}}'
  fi
  exit 0
}

command -v jq >/dev/null 2>&1 || emit
command -v git >/dev/null 2>&1 || emit
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || emit

PROMPT="$(printf '%s' "$INPUT" | jq -r '.prompt // empty')"

BRANCH="$(git symbolic-ref --quiet --short HEAD 2>/dev/null || printf 'DETACHED')"
DIRTY_COUNT="$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')"

# A PR reference explicitly mentioned in the prompt takes precedence over
# anything inferred from the branch.
PR_REF="$(printf '%s' "$PROMPT" | grep -Eo '(#[0-9]{1,7})|(pull/[0-9]{1,7})' | head -1 | grep -Eo '[0-9]+' || printf '')"

CONTEXT="github-orchestrator context: branch=${BRANCH}"
[ "$DIRTY_COUNT" != "0" ] && CONTEXT="${CONTEXT} uncommitted=${DIRTY_COUNT}"
[ -n "$PR_REF" ] && CONTEXT="${CONTEXT} pr=#${PR_REF}"

AHEAD_BEHIND="$(git rev-list --left-right --count "@{upstream}...HEAD" 2>/dev/null || printf '')"
if [ -n "$AHEAD_BEHIND" ]; then
  BEHIND="$(printf '%s' "$AHEAD_BEHIND" | awk '{print $1}')"
  AHEAD="$(printf '%s' "$AHEAD_BEHIND" | awk '{print $2}')"
  [ "$AHEAD" != "0" ] && CONTEXT="${CONTEXT} ahead=${AHEAD}"
  [ "$BEHIND" != "0" ] && CONTEXT="${CONTEXT} behind=${BEHIND}"
fi

emit "$CONTEXT"
