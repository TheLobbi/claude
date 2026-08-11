---
name: gh:setup
intent: Configure GitHub MCP connectivity, merge policy, size budgets, and team model routing for this repository
tags:
  - github-orchestrator
  - command
  - setup
inputs:
  - flags
risk: medium
cost: low
description: Verify GitHub MCP access, detect repository conventions, and write policy and routing configuration the orchestrator enforces
---

# /gh:setup

Run once per repository. Detects conventions rather than imposing them.

## Usage

```
/gh:setup                      # interactive: detect, propose, confirm, write
/gh:setup --detect             # show what was detected, write nothing
/gh:setup --check              # verify an existing configuration still holds
/gh:setup --reset              # restore packaged defaults
```

## What it detects

| Detected | From |
| --- | --- |
| Default branch | `mcp__github__list_branches` and repo metadata |
| Required checks | Branch protection on the default branch |
| Merge method | Which methods the repo allows; the one actually used in history |
| Branch naming convention | The last 100 merged branch names |
| Commit convention | Whether recent commits parse as conventional commits |
| PR template | `.github/pull_request_template.md` and variants |
| Review quorum | Branch protection required-approvals |
| Protected paths | `CODEOWNERS` entries plus migration/auth/infra path heuristics |
| Package manager | Lockfile present in the repo root |
| Test command | `package.json` scripts, `Makefile`, or CI workflow steps |

Nothing is invented. If a convention cannot be detected, `/gh:setup` asks rather
than guessing — an inferred merge method that is wrong causes a bad merge, and a
wrong branch prefix causes a confusing one.

## Connectivity check

Verifies the GitHub MCP server is reachable and correctly scoped:

```
✓ mcp__github__get_me            authenticated
✓ repository in scope            org/repo
✓ read access                    pull_request_read, issue_read, actions_list
✓ write access                   create_pull_request, add_issue_comment
⚠ merge access                   merge_pull_request unavailable
                                 → /gh:ship will stop after CI is green
✗ actions logs                   get_job_logs denied
                                 → /gh:ci cannot classify failures
```

Missing capabilities are reported as **degraded modes**, not failures — the
plugin works without merge rights, it just stops one step earlier and says so.

## What it writes

`config/policies.json`:

```json
{
  "defaultBranch": "main",
  "protectedBranches": ["main", "release/*"],
  "mergeMethod": "squash",
  "deleteBranchOnMerge": true,
  "requiredChecks": ["build", "test", "typecheck", "lint"],
  "reviewQuorum": 1,
  "prSizeBudget": 400,
  "prSizeExcludes": ["**/pnpm-lock.yaml", "**/*.generated.*", "vendor/**"],
  "branchNaming": "<type>/<scope>-<slug>",
  "commitConvention": "conventional",
  "humanReviewPaths": ["migrations/**", "src/auth/**", "src/billing/**", ".github/workflows/**", "infra/**"],
  "staleAfter": "90d",
  "driftWindow": "180d",
  "failureWindow": "72h",
  "deploysFrom": "main",
  "backlogWeights": { "unblocks": 0.30, "severity": 0.25, "reach": 0.20, "confidence": 0.15, "effort": 0.10 }
}
```

`config/model-routing.json` is written from the packaged defaults and can be
tuned per team.

## `--check`

Re-verifies that the written policy still matches reality — required checks
renamed, protection changed, a new protected path added. Configuration that has
silently drifted from the repository is worse than none, because the orchestrator
enforces gates that no longer exist.

## Related

- [`/gh:audit`](audit.md) — whether the repository settings themselves are sound
- `config/policies.json` — the file this writes
