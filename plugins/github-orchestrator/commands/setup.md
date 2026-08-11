---
name: gh:setup
intent: Detect how this session reaches GitHub, verify capabilities, and write merge policy and routing configuration
tags:
  - github-orchestrator
  - command
  - setup
inputs:
  - flags
risk: medium
cost: low
description: Identify the connection path and credential type, probe real capabilities rather than assuming them, report degraded modes precisely, and write policy detected from repository conventions
---

# /gh:setup

Run once per repository. It answers two questions: **how does this session reach
GitHub, and what can it actually do?** Everything else follows from those.

## Usage

```
/gh:setup                      # detect, propose, confirm, write
/gh:setup --detect             # show what was found, write nothing
/gh:setup --connection         # connectivity and capability probe only
/gh:setup --check              # verify an existing config still matches reality
/gh:setup --reset              # restore packaged defaults
```

---

## Phase 1 — How is this session connected?

There are several distinct paths to GitHub, and they fail differently. Identify
which one is in play before diagnosing anything.

| Path | Detect by | Notes |
| --- | --- | --- |
| **GitHub MCP — remote** | `mcp__github__*` present; host `api.githubcopilot.com` | OAuth or PAT. The default in Claude Code on the web |
| **GitHub MCP — remote, enterprise** | Host `copilot-api.<tenant>.ghe.com` | Data-residency tenants use their own endpoint; the public one 404s |
| **GitHub MCP — local** | Server runs as a local process, PAT in env | Offline-capable; you own updates |
| **`gh` CLI** | `command -v gh` | **Unavailable** in web and remote execution environments |
| **Raw git over HTTPS** | `git remote -v` + a credential helper | Transport only — never the API |
| **SSH / deploy key** | `git@github.com:` remote | Transport only |
| **Inside Actions** | `$GITHUB_ACTIONS` | Use `GITHUB_TOKEN` with a narrowed `permissions:` block |
| **Session git proxy** | Remote resolves through the agent proxy | Clone/fetch may work while the API does not |

The last row causes a specific confusion worth naming: **git transport and API
access are independent**. A session can clone a repository fine and still have
no API access to it, or vice versa. `/gh:setup` reports them separately rather
than collapsing them into one "connected" boolean.

### Credential type

Capability follows from credential type, so identify it explicitly:

| Type | Identify by | Consequence |
| --- | --- | --- |
| OAuth (MCP) | No token configured; one-click sign-in | Only the scopes approved at sign-in |
| Fine-grained PAT | `github_pat_…` | Per-repo, per-permission. **Cannot reach user-owned Projects endpoints** |
| Classic PAT | `ghp_…` | Coarse scopes; reaches the few APIs fine-grained cannot |
| App installation token | `ghs_…`, ~1h expiry | Per-installation permissions; best for automation |
| `GITHUB_TOKEN` | Inside Actions | Governed by `permissions:`. **Cannot trigger further workflows** |

---

## Phase 2 — Probe capabilities, do not assume them

Tool presence is not permission. `/gh:setup` **calls** a cheap representative of
each capability class and records what actually happened.

```
Connection
  ✓ path                 GitHub MCP (remote, OAuth)
  ✓ identity             get_me → octocat
  ✓ repo in scope        org/repo
  ✓ git transport        fetch OK via session proxy

Read
  ✓ pull requests        pull_request_read
  ✓ issues               issue_read
  ✓ actions runs         actions_list
  ✗ actions logs         get_job_logs → 403
                         → /gh:ci cannot classify failures; it will report raw
                           check status only

Write
  ✓ open PRs             create_pull_request
  ✓ comment              add_issue_comment
  ⚠ merge                merge_pull_request unavailable
                         → /gh:ship stops after CI is green and hands off

Org surfaces
  ✓ issue types          list_issue_types → 3 defined (Bug, Feature, Task)
  ⚠ projects             org projects readable; user-owned projects unreachable
                         with this credential type — that is a token-type limit,
                         not a permission level
  ✗ security alerts      403 — code scanning unavailable to this token
                         → /gh:security runs dependency + secret triage only
```

**Missing capabilities are degraded modes, not failures.** The plugin works
without merge rights; it stops one step earlier and says so. Reporting that
precisely is more useful than a red cross.

### Distinguish 404 from 403

GitHub returns **404 for unauthorized private resources** rather than confirming
they exist. Never conclude a repository is missing from a 404 on an
under-scoped request. `/gh:setup` re-probes with identity context before
reporting anything as nonexistent, and if a repository is genuinely out of
session scope it says *out of scope* — which is fixable by attaching it — not
*not found*.

---

## Phase 3 — Detect repository conventions

Nothing is invented. Where a convention cannot be detected, `/gh:setup` asks
rather than guessing — an inferred merge method that is wrong produces a bad
merge, and a wrong branch prefix produces a confusing one.

| Detected | From |
| --- | --- |
| Default branch, protection, required checks | Branch protection + repo metadata |
| Merge method | Which methods are allowed, and which history actually uses |
| Branch naming | Last 100 merged branch names |
| Commit convention | Whether recent commits parse as conventional |
| PR template | `.github/pull_request_template.md` and variants |
| Issue templates | `.github/ISSUE_TEMPLATE/` — forms vs markdown, `config.yml` |
| Issue types | `list_issue_types` — org-level, if defined |
| Projects | Boards linked to this repository |
| `AGENTS.md` | Present, and whether it names build and test commands |
| Review quorum | Required approvals |
| Protected paths | `CODEOWNERS` plus migration/auth/infra heuristics |
| Package manager, test command | Lockfile, `package.json` scripts, CI steps |
| Merge queue | Whether the repo uses one |

### Hygiene findings surfaced here

Detection notices things worth fixing immediately:

- `blank_issues_enabled` not set to `false` — templates are optional in practice
- No security `contact_link` — vulnerability reports will land in public issues
- Issue **forms** used in a **private** repo — `validations.required` silently
  does nothing there, so triage cannot trust required fields
- No `AGENTS.md`, or one without build/test commands — every in-GitHub agent
  degrades, since it cannot verify its own work
- Multiple PR templates present but nothing links `?template=`, so none are used

---

## Phase 4 — Write configuration

`config/policies.json` gets the detected values (see the file for the full
schema — defaultBranch, protectedBranches, mergeMethod, requiredChecks,
reviewQuorum, prSizeBudget, humanReviewPaths, backlogWeights, and the review and
CI blocks).

`config/model-routing.json` and `config/teams.json` are written from packaged
defaults and tuned per team afterwards.

A `connection` block records the detected path, credential type, and the
capability probe results, so agents can reason about degraded modes without
re-probing every session.

---

## `--check`

Re-verifies that written policy still matches reality: required checks renamed,
protection changed, a new protected path added, a token expired, an org enabling
fine-grained token approval.

Configuration that has silently drifted from the repository is worse than none,
because the orchestrator then enforces gates that no longer exist — and, worse,
*stops* enforcing ones that do.

## Related

- [`github-auth`](../skills/github-auth/SKILL.md) — credential types and failure modes
- [`gh-mcp`](../skills/gh-mcp/SKILL.md) — MCP connection modes, toolsets, read-only
- [`docs/connectivity.md`](../docs/connectivity.md) — the full connection matrix
- [`/gh:audit`](audit.md) — whether the repository settings are themselves sound
