---
name: actions-authoring
description: This skill should be used when writing, hardening, or optimizing GitHub Actions workflows — permissions, action pinning, script injection, caching, matrices, concurrency, and cost.
version: 1.0.0
trigger_phrases: [github actions, workflow yaml, actions permissions, cache key, matrix build, pull_request_target, CI cost]
categories: [ci, github-actions, security, performance]
author: github-orchestrator
created: 2026-08-11
updated: 2026-08-11
---

# Actions Authoring

## Security first — the three that actually get exploited

### 1. `pull_request_target` with a PR-head checkout

```yaml
# CRITICAL — a fork PR gets write-scoped secrets
on: pull_request_target
jobs:
  test:
    steps:
      - uses: actions/checkout@v4
        with: { ref: ${{ github.event.pull_request.head.sha }} }
      - run: npm test        # attacker's code, your secrets
```

`pull_request_target` runs in the **base** repo's context with secrets. Checking
out the PR head executes attacker-controlled code with those secrets in scope.
Use `pull_request` and accept that secrets are unavailable — that is the point.

### 2. Script injection through `${{ }}`

```yaml
# wrong — issue title is attacker-controlled, interpolated into the shell
- run: echo "Title: ${{ github.event.issue.title }}"

# right — passed as an environment variable
- env:
    TITLE: ${{ github.event.issue.title }}
  run: echo "Title: $TITLE"
```

Any `github.event.*` field a user can write is untrusted: title, body, branch
name, commit message, label name.

### 3. Unpinned third-party actions

Tags are mutable. Pin to a commit SHA with the version in a trailing comment:

```yaml
- uses: some-org/some-action@8f4b7c2e9a1d... # v3.1.0
```

First-party `actions/*` at a major tag is the common accepted exception — decide
deliberately rather than by default.

## Permissions

Declare explicitly. The default `GITHUB_TOKEN` scope is far wider than any
single workflow needs.

```yaml
permissions:
  contents: read          # workflow-level floor

jobs:
  release:
    permissions:
      contents: write     # narrowed per job
      id-token: write     # OIDC
```

Use OIDC for cloud auth. Long-lived cloud keys in secrets are a standing
liability that no rotation policy fully fixes.

## Caching

```yaml
key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
restore-keys: |
  ${{ runner.os }}-pnpm-
```

Two failure modes, both common:

- A key containing `github.run_id`, a timestamp, or the commit sha **can never
  hit** — it costs upload time every run and saves nothing.
- A key with **no lockfile hash** never misses when it should, restoring a stale
  dependency tree after an upgrade.

Check the actual hit rate in the restore step's log before tuning anything.

## Concurrency

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}
```

Never cancel in progress on the default branch — that kills the run that gates
deploys.

## Matrices

Full OS × version matrix on every PR is usually waste. Run a representative
slice on PRs and the full matrix on the default branch and on a schedule.

```yaml
strategy:
  fail-fast: false        # you want all failures, not the first
  matrix:
    node: [20, 22]
    include:
      - { node: 24, os: ubuntu-latest, experimental: true }
```

## Cost levers, ordered by typical payoff

Cache hit rate → job graph (unnecessary `needs:`) → matrix pruning →
concurrency groups → path filters → fail-fast ordering (cheap checks first) →
runner sizing → artifact retention.

Never buy speed by dropping coverage. A removed matrix entry that covers a
supported platform is not an optimization.

## See also

- `ci-forensics` — diagnosing failures
- `../commands/audit.md` — repo-wide workflow security audit
