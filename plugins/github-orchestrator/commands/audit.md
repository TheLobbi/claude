---
name: gh:audit
intent: Audit repository hygiene across branch protection, templates, stale branches, settings, and workflow security
tags:
  - github-orchestrator
  - command
  - intel
inputs:
  - scope
  - flags
risk: low
cost: medium
description: Check branch protection, required checks, templates, stale branches, workflow permissions, secret hygiene, and repository settings against a hardened baseline
---

# /gh:audit

## Usage

```
/gh:audit                        # full hygiene audit
/gh:audit --protection           # branch protection only
/gh:audit --workflows            # Actions security posture only
/gh:audit --stale                # stale branches and abandoned PRs
/gh:audit --fix                  # apply the safe subset of fixes
```

## Checks

### Branch protection

| Check | Why it matters |
| --- | --- |
| Default branch protected | Without it, every other control is advisory |
| Required status checks defined and **strict** | Non-strict lets a PR merge green against a stale base |
| Required review count ≥ policy | |
| Dismiss stale approvals on push | Otherwise an approval survives a rewrite of the diff it approved |
| Require conversation resolution | |
| Restrict force push and deletion | |
| Admin enforcement (`enforce_admins`) | A bypass available to admins is a bypass |

### Actions security

| Check | Why it matters |
| --- | --- |
| `permissions:` declared at workflow or job level | Default `GITHUB_TOKEN` scope is far wider than most workflows need |
| Third-party actions pinned to a **commit SHA**, not a tag | Tags are mutable; a compromised tag is a supply-chain compromise |
| No `pull_request_target` with a checkout of the PR head | The classic fork-PR secret exfiltration pattern |
| Secrets not passed to steps that run untrusted code | |
| OIDC used for cloud auth instead of long-lived keys | |
| Concurrency groups set on deploy workflows | Prevents overlapping deploys |

`pull_request_target` + `actions/checkout` with `ref: github.event.pull_request.head.sha`
is reported as **critical** — it grants a fork PR write-scoped secrets.

### Repository hygiene

- Issue and PR templates present and non-empty
- `SECURITY.md`, `CONTRIBUTING.md`, `LICENSE` present
- `.gitignore` covers build artifacts and env files
- No tracked `.env`, `*.pem`, `*.key`, or credential files
- Dependabot / security updates enabled
- Secret scanning and push protection enabled
- Default branch name matches convention

### Stale artifacts

- Branches with no commits in `staleAfter` and no open PR
- PRs open > 60 days with no activity
- Releases marked draft for > 30 days
- Workflow runs retained beyond policy (cost)

## `--fix`

Applies only the safe, reversible subset:

- Add missing `permissions:` blocks (least-privilege inferred from the steps)
- Pin unpinned third-party actions to their current SHA, with the tag in a comment
- Add missing `.gitignore` entries
- Add concurrency groups to deploy workflows

Never applied automatically: branch protection changes, deleting branches,
closing PRs, changing repository settings, or anything that touches secrets.
Those are reported with the exact change to make.

## Output

```
Repo audit — 6 critical, 9 warnings, 21 passed

CRITICAL  .github/workflows/pr-check.yml:3
          pull_request_target + checkout of PR head sha
          A fork PR can read repository secrets. Fix: use pull_request, or
          checkout the base and never execute PR code with secrets in scope.

CRITICAL  Default branch `main` — enforce_admins is false
          Protection is bypassable by any admin. 3 bypasses in the last 90d.

WARNING   7 actions pinned to tags, not SHAs
          actions/checkout@v4, actions/setup-node@v4, …
          Fix available: /gh:audit --fix

WARNING   14 stale branches (no commits > 90d, no open PR)
```

## Related

- [`/gh:security`](security.md) — vulnerability alerts, not configuration
- [`/gh:actions`](actions.md) — workflow authoring and cost
- [`actions-authoring`](../skills/actions-authoring/SKILL.md)
