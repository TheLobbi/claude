---
name: gh:actions
intent: Author, audit, and cost-optimize GitHub Actions workflows including caching, matrices, permissions, and runtime
tags:
  - github-orchestrator
  - command
  - ci
inputs:
  - scope
  - flags
risk: medium
cost: medium
description: Write new Actions workflows, harden existing ones, and cut CI wall-clock and cost through caching, matrix pruning, concurrency, and job-graph restructuring
---

# /gh:actions

## Usage

```
/gh:actions audit                   # security + correctness of every workflow
/gh:actions optimize                # cost and wall-clock analysis with fixes
/gh:actions create ci               # scaffold a workflow for this repo's stack
/gh:actions explain pr-check.yml    # what this workflow actually does
/gh:actions cost                    # minutes and spend by workflow and job
```

## Optimization

`actions-optimizer` measures before it changes anything — the slow job is
usually not the one people assume.

### The levers, in the order they usually pay

| Lever | Typical win | Notes |
| --- | --- | --- |
| **Cache hit rate** | Large | A cache that misses every run costs *more* than no cache. Check the hit rate before tuning the key |
| **Job graph** | Large | Independent jobs serialized by an unnecessary `needs:` — the most common structural waste |
| **Matrix pruning** | Medium | Full OS × version matrices on every PR; run the full matrix on the default branch and a representative slice on PRs |
| **Concurrency groups** | Medium | Cancel superseded runs on force-push; without it every push to a PR runs a full CI |
| **Path filters** | Medium | Docs-only PRs running the full e2e suite |
| **Fail fast ordering** | Medium | Lint and typecheck before a 12-minute test job — surface the cheap failure first |
| **Runner sizing** | Varies | A larger runner that halves a 20-minute job can be cheaper per run |
| **Artifact retention** | Small | Often the quiet majority of storage spend |

### Cache keys

The most common cache defect is a key that never hits: it includes something
that changes every run (a timestamp, the commit sha, `github.run_id`). The
second most common is a key that never *misses* when it should — no lockfile
hash — so a stale dependency tree is restored after an upgrade.

```yaml
key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
restore-keys: |
  ${{ runner.os }}-pnpm-
```

## Security hardening

Everything under `/gh:audit --workflows` applies here too, plus authoring rules:

- Declare `permissions:` explicitly — at workflow level, narrowed further per job.
  Default `GITHUB_TOKEN` scope is far wider than any single workflow needs.
- Pin third-party actions to a **commit SHA** with the version in a trailing
  comment. Tags are mutable.
- Never use `pull_request_target` with a checkout of the PR head. If you need
  fork PR context, use `pull_request` and accept that secrets are unavailable —
  that is the point.
- Never interpolate `${{ github.event.* }}` directly into a `run:` block —
  it is script injection. Pass through `env:` and reference the variable.
- Use OIDC for cloud auth; long-lived cloud keys in secrets are a standing
  liability.

```yaml
# wrong — issue title is attacker-controlled, executes as shell
- run: echo "Title: ${{ github.event.issue.title }}"

# right
- env:
    TITLE: ${{ github.event.issue.title }}
  run: echo "Title: $TITLE"
```

## Output

```
Actions — 6 workflows, 41 jobs, 8,240 min/month

OPTIMIZE  ci.yml : test          cache hit rate 4%
          Key includes github.run_id — it can never hit.
          Fix: key on hashFiles('**/pnpm-lock.yaml').   Est. −1,900 min/mo

OPTIMIZE  ci.yml : e2e           runs on every PR, incl. docs-only
          Fix: paths-ignore for docs/**, *.md.          Est. −620 min/mo

OPTIMIZE  ci.yml                 no concurrency group
          14% of runs superseded before finishing.
          Fix: concurrency group on ref, cancel-in-progress. Est. −1,100 min/mo

SECURITY  release.yml:12         permissions not declared (full write token)
SECURITY  pr-check.yml:4         pull_request_target + PR head checkout  ← critical

Total estimated saving: 3,620 min/mo (44%)
```

## Related

- [`/gh:audit`](audit.md) — repo-wide posture
- [`/gh:ci`](ci.md) — failures, not configuration
- [`actions-authoring`](../skills/actions-authoring/SKILL.md)
