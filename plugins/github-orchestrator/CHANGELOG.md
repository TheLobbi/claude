# Changelog

All notable changes to the `github-orchestrator` plugin are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-08-11

Connectivity, Projects, the issue model, Actions automation, and delegation to
agents that run inside GitHub. Researched against current GitHub documentation
rather than assumed.

### Added

**Connectivity**
- `github-auth` skill — every credential type (classic and fine-grained PATs,
  GitHub App installation and user tokens, OAuth, `GITHUB_TOKEN`, OIDC, SSH and
  deploy keys), what each can reach, and a decoder for the failures each
  produces.
- `docs/connectivity.md` — the full connection matrix, the credential capability
  table, and a symptom-to-cause failure decoder.
- `gh-mcp` skill gained MCP connection modes: remote hosted vs local, OAuth vs
  PAT, enterprise data-residency endpoints, toolset narrowing, and `--read-only`
  as a real capability boundary.

**Projects**
- `github-projects` skill and `/gh:project` command covering **both** API
  surfaces — the REST endpoints under `/orgs/{org}/projectsV2/…` (API version
  `2026-03-10`) as well as GraphQL, with guidance on which to use per operation.
- `project-steward` agent — resolves field and single-select option IDs, audits
  board hygiene, and flags hand-written automation that a built-in project
  workflow already covers.

**Issue model**
- `github-issue-model` skill — organization-level issue types, sub-issues,
  issue dependencies, issue forms vs markdown templates, the template chooser,
  PR templates, and org-level `.github` community health defaults.

**Actions automation**
- `actions-automation` skill — the full trigger taxonomy, the two-workflow
  pattern for safely handling fork PRs, reusable workflows vs composite actions,
  bot workflows, auto-merge, and Dependabot grouping.

**In-GitHub agents**
- `github-agents` skill, `/gh:delegate` command, and `agent-delegator` agent —
  delegating to the Copilot cloud agent and custom agents, requesting automated
  review, and scaffolding GitHub Agentic Workflows (`gh-aw`) with safe outputs
  and committed lock files.

### Changed

- `/gh:setup` rewritten around connectivity: it now identifies the connection
  path and credential type, **probes** each capability class rather than
  assuming it from tool presence, and reports missing capabilities as named
  degraded modes ("no merge rights, so `/gh:ship` stops at green") instead of
  failures. It also distinguishes 404-as-unauthorized from genuinely missing,
  and treats git transport and API access as independent channels.
- `CLAUDE.md` records the 404/403 rule, the two-channel model, and the Projects
  credential-type limit.

### Fixed

- Corrected the widely repeated claim that Projects v2 is GraphQL-only. A REST
  surface exists; the plugin now documents both and notes that user-owned
  project endpoints reject fine-grained PATs, GitHub App user tokens, and
  installation tokens outright — so a 403 there cannot be fixed by re-scoping.

## [1.0.0] - 2026-08-11

### Added

**Core orchestration**
- `gh-orchestrator` coordinator agent with a 7-team roster and blackboard-based
  coordination (`config/teams.json`).
- Read-only `gh-advisor` agent — analyzes PRs, CI, issues, alerts, and release
  state and recommends next best actions without mutating anything.

**Commands (24, `/gh:` namespace)**
- Delivery: `ship`, `pr`, `review`, `ci`, `merge-train`, `conflict`, `watch`.
- Planning: `triage`, `issue`, `plan-prs`, `backlog`.
- Intelligence: `advise`, `insights`, `ownership`, `audit`.
- Supply chain: `security`, `deps`.
- Actions & release: `actions`, `release`, `rollback`.
- Meta: `workflow`, `setup`.

**Agents (34 across 7 teams)**
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

**Skills (16)**
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
