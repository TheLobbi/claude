# GitHub Orchestrator

**Autonomous GitHub delivery orchestration for Claude Code.**

34 agents in 7 teams · 24 commands · 16 skills · 7 schema-validated declarative workflows

`jira-orchestrator` runs the *ticket* side of delivery. `github-orchestrator` runs the
*code* side: it takes a change from a branch to a merged commit and refuses to
declare victory until CI is green and the merge policy is satisfied.

---

## What makes it different

Most GitHub tooling wraps `gh` and stops. This plugin models the parts that
actually cost engineering time:

| Capability | What it does |
| --- | --- |
| **Adversarial review board** | Six independent review lenses run in parallel, then every finding is handed to a skeptic prompted to *refute* it. Only findings that survive reach you. Kills the plausible-but-wrong review comment. |
| **Drive-to-green loop** | Classifies each CI failure (real / flaky / infra / base-branch-broken), fixes what's yours, and re-pushes. Loops until green — it does not report "fixed" after one round. |
| **Merge trains & stacked PRs** | Understands stack topology, rebases the whole stack after a base lands, and lands PRs in dependency order without the mid-stack breakage. |
| **Conflict prediction** | Compares in-flight PR diffs *before* they collide and warns which pairs will conflict, with the specific hunks. |
| **Flake forensics** | Correlates failures across runs to separate genuine regressions from flaky tests, and quarantines with an issue + owner. |
| **Supply-chain triage** | Dependabot/CodeQL/secret-scanning alerts ranked by *reachability*, not just CVSS. |
| **Repo intelligence** | DORA four keys, change-failure hotspots, review latency, and CODEOWNERS coverage gaps. |
| **Connectivity that self-diagnoses** | Knows every path to GitHub and every credential type. Probes real capability instead of assuming it, and reports *degraded modes* — "no merge rights, so `/gh:ship` stops at green" — rather than a red cross. |
| **Delegation to in-GitHub agents** | Hands scoped work to the Copilot cloud agent or an agentic workflow, then holds the resulting PR to the same gates as a human's. |
| **Read-only advisor** | `/gh:advise` looks at everything in flight and tells you what to do next. Never mutates anything. |

---

## Install

```bash
/plugin marketplace add markus41/claude
/plugin install github-orchestrator
/gh:setup
```

`/gh:setup` writes `config/policies.json` defaults for your repo (required
checks, merge method, PR size budget, protected branches) and verifies GitHub
MCP connectivity.

### Requirements

- **GitHub MCP server** connected (`mcp__github__*` tools). The `gh` CLI is not
  required and is unavailable in Claude Code on the web.
- Repository access scoped to the repos you want orchestrated.

---

## Quick start

```bash
/gh:advise                       # what should I do next?
/gh:ship "add rate limiting"     # branch → code → PR → review → green → merge
/gh:review 482                   # adversarial review board on PR #482
/gh:ci 482 --drive-to-green      # loop until CI passes
/gh:watch 482                    # subscribe and babysit until merged
```

---

## Command reference

### Delivery

| Command | Purpose |
| --- | --- |
| `/gh:ship <goal>` | Full loop: plan → branch → implement → PR → review → green → merge |
| `/gh:pr [create\|update\|iterate]` | Create or revise a PR with a template-filled body |
| `/gh:review <pr>` | Parallel multi-lens review board + adversarial verification |
| `/gh:ci <pr> [--drive-to-green]` | Triage CI failures and loop until green |
| `/gh:merge-train [--stack]` | Land a stack or queue in dependency order |
| `/gh:conflict [--predict]` | Predict or resolve conflicts across in-flight PRs |
| `/gh:watch <pr>` | Subscribe to PR events and act on them autonomously |

### Planning & issues

| Command | Purpose |
| --- | --- |
| `/gh:triage` | Triage, dedup, label, and decompose issues |
| `/gh:issue` | Create, update, link, and sub-issue issues |
| `/gh:plan-prs <goal>` | Decompose work into a reviewable stacked-PR plan |
| `/gh:backlog` | Groom and prioritize the backlog |
| `/gh:project` | Projects boards, fields, items, and board hygiene |

### Intelligence

| Command | Purpose |
| --- | --- |
| `/gh:advise [scope]` | Read-only next-best-action recommendations |
| `/gh:insights` | DORA four keys, hotspots, review latency, flake rate |
| `/gh:ownership` | CODEOWNERS synthesis, coverage gaps, reviewer routing |
| `/gh:audit` | Repo hygiene: protection, templates, stale branches, licences |

### Security & supply chain

| Command | Purpose |
| --- | --- |
| `/gh:security` | CodeQL / Dependabot / secret-scanning triage by reachability |
| `/gh:deps` | Dependency health and staged upgrade orchestration |

### Actions & release

| Command | Purpose |
| --- | --- |
| `/gh:actions` | Author, audit, and cost-optimize workflows |
| `/gh:release` | Release train: semver calc, changelog, notes, tag |
| `/gh:rollback` | Revert/rollback orchestration with blast-radius analysis |
| `/gh:delegate` | Hand scoped work to the Copilot cloud agent or an agentic workflow |

### Meta

| Command | Purpose |
| --- | --- |
| `/gh:workflow [list\|show\|run] <name>` | Run declarative multi-agent workflows |
| `/gh:setup` | Configure auth, defaults, and merge policy |

---

## Agent teams

| Team | Agents |
| --- | --- |
| **delivery** | `gh-orchestrator` · `pr-author` · `branch-strategist` · `stack-manager` · `conflict-resolver` · `merge-marshal` · `agent-delegator` |
| **review-board** | `correctness-reviewer` · `security-reviewer` · `test-coverage-critic` · `api-contract-reviewer` · `performance-reviewer` · `docs-reviewer` · `review-synthesizer` · `adversarial-verifier` |
| **ci** | `ci-triage-analyst` · `flake-detective` · `actions-optimizer` · `build-doctor` |
| **intel** | `gh-advisor` · `repo-cartographer` · `dora-analyst` · `hotspot-scout` · `ownership-mapper` |
| **supply-chain** | `dependency-steward` · `supply-chain-auditor` · `secret-sentinel` |
| **release** | `release-conductor` · `changelog-scribe` · `rollback-planner` |
| **issues** | `issue-triager` · `dedup-detective` · `epic-decomposer` · `project-steward` |

Model and effort policy per team lives in `config/model-routing.json`.

---

## Declarative workflows

```bash
/gh:workflow list
/gh:workflow show review-board
/gh:workflow run ci-drive-to-green --input prNumber=482
```

| Workflow | Type | What it does |
| --- | --- | --- |
| `pr-delivery` | sequential | Branch → implement → PR → review → green → merge |
| `review-board` | parallel | Six review lenses, adversarial verify, synthesize |
| `ci-drive-to-green` | adaptive | Loop: triage → classify → fix → push → re-check |
| `issue-triage` | conditional | Dedup → classify → label → route or decompose |
| `merge-train` | hierarchical | Order a stack, rebase, land in sequence |
| `security-sweep` | parallel | CodeQL + Dependabot + secrets, ranked by reachability |
| `release-train` | sequential | Semver → changelog → notes → tag → publish |

All definitions are validated against `workflows/schema/workflow.schema.json`:

```bash
node plugins/github-orchestrator/workflows/validate.mjs
```

---

## Skills

| Skill | Covers |
| --- | --- |
| `github-auth` | Every credential type, what each can reach, and how each fails |
| `gh-mcp` | MCP connection modes, the tool map, and the pitfalls |
| `github-projects` | Projects v2 — the REST **and** GraphQL surfaces |
| `github-issue-model` | Issue types, sub-issues, dependencies, forms, templates |
| `actions-automation` | Triggers, reusable workflows, bots, Dependabot, auto-merge |
| `actions-authoring` | Actions security, caching, matrices, cost |
| `github-agents` | Copilot cloud agent, custom agents, agentic workflows |
| `github-orchestration` | Coordination patterns and merge gates |
| `pr-craft` · `stacked-prs` · `merge-queue` | PR authoring, stacks, queue semantics |
| `ci-forensics` | Reading Actions logs, classifying failures |
| `review-protocols` | The adversarial board |
| `repo-intelligence` | DORA, hotspots, ownership |
| `supply-chain-security` · `release-engineering` | Reachability triage, semver, rollback |

Skills carry the domain knowledge (how a merge queue actually behaves, how to
read an Actions log, why user-owned Projects endpoints reject fine-grained
tokens) so agents stay short and the knowledge stays in one place.

---

## Safety model

Enforced by `hooks/scripts/guard-github-writes.sh` (PreToolUse) and re-checked
by `merge-marshal` before any merge:

- **Never merge red.** Required checks must be green (or explicitly waived by a
  human in the same session).
- **Never force-push a protected branch.** Blocked at the hook layer.
- **Never bypass branch protection**, including admin override.
- **Never post secrets.** PR/issue bodies are scanned for token patterns before
  they are written.
- **Destructive ops confirm first.** Branch deletion, release deletion, and
  history rewrites require explicit approval.

Hook telemetry lands in `.claude/orchestration/telemetry/*.jsonl`.

---

## Configuration

| File | Purpose |
| --- | --- |
| `config/policies.json` | Merge gates, protected branches, PR size budgets, review quorum |
| `config/model-routing.json` | Model + effort per agent team |
| `config/teams.json` | Team membership and coordination patterns |
| `config/mcps/github.json` | GitHub MCP tool map and method discriminators |

---

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — how the orchestrator, teams, and workflows fit together
- [`docs/connectivity.md`](docs/connectivity.md) — every path to GitHub, the credential capability matrix, and a failure decoder
- [`docs/review-protocol.md`](docs/review-protocol.md) — the adversarial review board in detail
- [`docs/ci-drive-to-green.md`](docs/ci-drive-to-green.md) — failure taxonomy and the loop contract

---

## License

MIT
