# Changelog

All notable changes to the `github-orchestrator` plugin are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-08-11

### Added

**Core orchestration**
- `gh-orchestrator` coordinator agent with a 7-team roster and blackboard-based
  coordination (`config/teams.json`).
- Read-only `gh-advisor` agent — analyzes PRs, CI, issues, alerts, and release
  state and recommends next best actions without mutating anything.

**Commands (22, `/gh:` namespace)**
- Delivery: `ship`, `pr`, `review`, `ci`, `merge-train`, `conflict`, `watch`.
- Planning: `triage`, `issue`, `plan-prs`, `backlog`.
- Intelligence: `advise`, `insights`, `ownership`, `audit`.
- Supply chain: `security`, `deps`.
- Actions & release: `actions`, `release`, `rollback`.
- Meta: `workflow`, `setup`.

**Agents (32 across 7 teams)**
- `delivery` — PR authoring, branch strategy, stack management, conflict
  resolution, and merge marshalling.
- `review-board` — six independent review lenses plus an adversarial verifier
  and a blackboard synthesizer.
- `ci` — failure triage, flake forensics, Actions cost optimization, build repair.
- `intel` — advisor, repo cartography, DORA analysis, hotspot scouting,
  ownership mapping.
- `supply-chain` — dependency stewardship, SLSA/provenance auditing, secret sentinel.
- `release` — release conducting, changelog scribing, rollback planning.
- `issues` — triage, dedup detection, epic decomposition.

**Workflows (7, schema-validated)**
- `pr-delivery` (sequential), `review-board` (parallel), `ci-drive-to-green`
  (adaptive), `issue-triage` (conditional), `merge-train` (hierarchical),
  `security-sweep` (parallel), `release-train` (sequential).
- Bundled `workflows/schema/workflow.schema.json` and `workflows/validate.mjs`.

**Skills (11)**
- `github-orchestration`, `pr-craft`, `stacked-prs`, `ci-forensics`,
  `actions-authoring`, `merge-queue`, `repo-intelligence`,
  `supply-chain-security`, `release-engineering`, `review-protocols`, `gh-mcp`.

**Safety and telemetry**
- `hooks/scripts/guard-github-writes.sh` (PreToolUse) blocks merges on red CI,
  force-pushes to protected branches, branch-protection bypass, and secret
  patterns in PR/issue bodies.
- `hooks/scripts/capture-agent-telemetry.sh` (SubagentStop) and
  `hooks/scripts/lessons-capture.sh` (PostToolUseFailure) emit JSONL telemetry
  to `.claude/orchestration/telemetry/`.
- `hooks/scripts/pr-size-guard.sh` warns when a PR exceeds the configured
  diff budget.
- `hooks/scripts/detect-pr-context.sh` (UserPromptSubmit) resolves the active
  PR/branch context from the prompt.

**Configuration and templates**
- `config/policies.json`, `config/model-routing.json`, `config/teams.json`,
  `config/mcps/github.json`.
- Templates for PR descriptions, release notes, triage comments, incident
  reports, and CODEOWNERS.

[1.0.0]: https://github.com/Lobbi-Docs/claude/releases/tag/github-orchestrator-v1.0.0
