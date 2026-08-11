# GitHub Orchestrator Plugin Guide

## Purpose
- Operational guide for working safely in `plugins/github-orchestrator`.
- Keep edits scoped, minimal, and aligned with this plugin's existing architecture.

## Supported Commands
All commands live under the `/gh:` namespace.

| Command | File | What it does |
| --- | --- | --- |
| `advise` | `commands/advise.md` | Read-only advisor: prioritized next best actions |
| `actions` | `commands/actions.md` | Author, audit, and cost-optimize GitHub Actions |
| `audit` | `commands/audit.md` | Repository hygiene and health audit |
| `backlog` | `commands/backlog.md` | Backlog grooming and prioritization |
| `ci` | `commands/ci.md` | CI failure triage and drive-to-green loop |
| `conflict` | `commands/conflict.md` | Predict and resolve merge conflicts |
| `delegate` | `commands/delegate.md` | Hand scoped work to in-GitHub agents |
| `deps` | `commands/deps.md` | Dependency health and upgrade orchestration |
| `insights` | `commands/insights.md` | DORA metrics, hotspots, review latency |
| `issue` | `commands/issue.md` | Create, update, and link issues |
| `merge-train` | `commands/merge-train.md` | Stacked-PR and merge-queue orchestration |
| `ownership` | `commands/ownership.md` | CODEOWNERS synthesis and reviewer routing |
| `plan-prs` | `commands/plan-prs.md` | Decompose work into a stacked PR delivery plan |
| `pr` | `commands/pr.md` | Create, update, and iterate on pull requests |
| `project` | `commands/project.md` | Projects boards, fields, items, hygiene |
| `release` | `commands/release.md` | Release train: semver, changelog, notes |
| `review` | `commands/review.md` | Multi-agent adversarial review board |
| `rollback` | `commands/rollback.md` | Revert and rollback orchestration |
| `security` | `commands/security.md` | CodeQL/Dependabot/secret-scanning triage |
| `setup` | `commands/setup.md` | Configure auth, defaults, and merge policy |
| `ship` | `commands/ship.md` | End-to-end: branch → PR → review → green → merge |
| `triage` | `commands/triage.md` | Issue triage, dedup, labeling, decomposition |
| `watch` | `commands/watch.md` | Subscribe to and babysit PRs autonomously |
| `workflow` | `commands/workflow.md` | Run declarative multi-agent workflows |

## Architecture
- **Agents** (`agents/`) are grouped into 7 teams declared in `config/teams.json`.
  `gh-orchestrator` is the coordinator; `gh-advisor` is strictly read-only.
- **Workflows** (`workflows/*.json`) are declarative and validated against
  `workflows/schema/workflow.schema.json` via `node workflows/validate.mjs`.
  Run with `/gh:workflow run <name>`; inspect with `/gh:workflow show <name>`.
- **Policy** lives in `config/policies.json` (merge gates, branch protection,
  PR size budgets) and `config/model-routing.json` (model/effort per team).
- **Telemetry**: `hooks/scripts/capture-agent-telemetry.sh` (SubagentStop) and
  `hooks/scripts/lessons-capture.sh` (PostToolUseFailure) write JSONL under
  `.claude/orchestration/telemetry/`.

## GitHub access
- Use GitHub MCP tools (`mcp__github__*`) for all GitHub operations. The `gh`
  CLI is not available in the web/remote execution environment.
- `mcp__github__*` "read" tools are multiplexed behind a `method` discriminator
  (`pull_request_read`, `issue_read`, `actions_list`, `actions_get`). Always
  pass `method`.
- For CI log triage use `get_job_logs` (run_id + `failed_only`, then job_id +
  `return_content`), not `actions_get`.
- A `404` on a repository is almost always **unauthorized**, not missing —
  GitHub 404s private resources rather than confirming they exist. Never report
  a repository as nonexistent based on an under-scoped request.
- Git transport and API access are **independent channels**. A session can clone
  a repo and still have no API access to it. Diagnose them separately.
- Projects has both a REST surface (`/orgs/{org}/projectsV2/…`, API version
  `2026-03-10`) and GraphQL. User-owned project endpoints reject fine-grained
  PATs, App user tokens, and installation tokens — a 403 there is a credential
  *type* problem, not a permission level. See `docs/connectivity.md`.

## Prohibited Actions
- Do not delete or rename `.claude-plugin/plugin.json`.
- Do not introduce secrets, credentials, tokens, or tenant-specific IDs in tracked files.
- Do not merge a PR whose required checks are not green, and never bypass branch
  protection or force-push a protected branch.
- Do not modify unrelated plugins from this plugin workflow unless explicitly requested.

## Required Validation Checks
- `node workflows/validate.mjs` (from the plugin root) after touching `workflows/`.
- `pnpm check:plugin-context`
- `pnpm check:plugin-schema`
- `pnpm check:marketplace`
- `pnpm check:plugin-indexes` after adding or editing any command/agent frontmatter.

## Context Budget
Load in this order and stop when you have enough context:
1. `CONTEXT_SUMMARY.md`
2. `commands/index.json` (or list files in `commands/`)
3. `README.md` and only the specific docs needed for the current task

## Escalation Path
- If requirements conflict with plugin guardrails, pause implementation and document the conflict.
- If validation fails and the root cause is unclear, escalate with failing command output and touched files.
- For production-impacting changes (release, rollback, merge policy), request maintainer review first.
