# github-orchestrator — Context Summary

## Purpose
Autonomous GitHub delivery orchestration. Drives a change from branch to merged
commit: adversarial review boards, CI drive-to-green loops, stacked-PR merge
trains, conflict prediction, supply-chain triage, release trains, and
DORA/hotspot repo intelligence — all over the GitHub MCP (`mcp__github__*`).

## At a glance
- 34 agents · 7 teams · 24 commands · 16 skills · 7 declarative workflows · read-only `gh-advisor`

## Command namespace (`/gh:…`)
`advise` `ship` `pr` `review` `ci` `merge-train` `conflict` `watch` ·
`triage` `issue` `plan-prs` `backlog` `project` ·
`insights` `ownership` `audit` ·
`security` `deps` ·
`actions` `release` `rollback` `delegate` ·
`workflow` `setup`

## Agent teams
`delivery` · `review-board` · `ci` · `intel` · `supply-chain` · `release` · `issues`
Coordinator: `gh-orchestrator`. Read-only advisor: `gh-advisor`.

## Workflows (`/gh:workflow run <name>`)
`pr-delivery` (sequential) · `review-board` (parallel) ·
`ci-drive-to-green` (adaptive) · `issue-triage` (conditional) ·
`merge-train` (hierarchical) · `security-sweep` (parallel) ·
`release-train` (sequential)

## When to load
- Load this summary first for routing, scope checks, and capability matching.
- Open specific command/agent/skill/workflow files only when the task needs them.
- Use `/gh:advise` for prioritized, evidence-backed next-best-action recommendations.

## When to open deeper docs
| Signal | Open docs | Why |
| --- | --- | --- |
| Install, auth, or usage details | `README.md` | Setup steps and full command reference. |
| Changing plugin behavior | the relevant `commands/`, `agents/`, or `skills/` file | Source of truth for behavior. |
| Auth, tokens, 403/404, MCP modes | `docs/connectivity.md` | Every connection path and how each fails. |
| Merge/branch-protection policy | `config/policies.json` | Gates the orchestrator enforces before merging. |
| Which model an agent uses | `config/model-routing.json` | Model/effort policy per team. |
| Full inventory | `commands/` `agents/` `skills/` `workflows/` | Complete list beyond this summary. |

## Hard guardrails
Never merge without required checks green, never force-push a protected branch,
never bypass branch protection, never post secrets in PR/issue bodies. Enforced
by `hooks/scripts/guard-github-writes.sh` and re-checked by `merge-marshal`.
