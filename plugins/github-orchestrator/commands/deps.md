---
name: gh:deps
intent: Assess dependency health and orchestrate upgrades in risk-ordered batches with verification between batches
tags:
  - github-orchestrator
  - command
  - security
inputs:
  - scope
  - flags
risk: high
cost: medium
description: Report dependency freshness, breaking-change risk, and maintenance signals, then upgrade in batches ordered by risk with a real verification step between each
---

# /gh:deps

## Usage

```
/gh:deps                          # health report
/gh:deps --outdated               # what is behind and by how much
/gh:deps --upgrade lodash         # one dependency
/gh:deps --upgrade --batch safe   # all patch + non-breaking minor upgrades
/gh:deps --unused                 # declared but never imported
/gh:deps --risk                   # maintenance and supply-chain risk signals
```

## Batching by risk

Upgrading everything in one PR guarantees that when something breaks you cannot
tell what broke it. Upgrades are batched so each PR has one failure hypothesis:

| Batch | Contents | Verification |
| --- | --- | --- |
| `security` | Anything closing a reachable advisory | Full test suite + the specific exploit path is now blocked |
| `safe` | Patch versions, and minors from packages with a clean changelog | Full test suite |
| `minor` | Minor versions with API additions | Full test suite + typecheck |
| `major` | One major per PR, always | Full suite + manual review + a read of the migration guide |
| `dev` | devDependencies | Build + test toolchain still runs |

`major` is never batched with anything, including other majors. Two majors in
one PR is two failure hypotheses.

## Lockfiles

`pnpm-lock.yaml` is committed and required by CI (`--frozen-lockfile`).

- Regenerate it via `pnpm install` after any `package.json` change, and commit
  the result in the same commit.
- Never hand-merge a lockfile conflict — take the base version and re-run install.
- A PR that changes `package.json` without a matching lockfile change fails CI,
  and the plugin blocks it at the PR-creation gate rather than letting CI find it.

## Risk signals

Beyond version drift, `dependency-steward` reports maintenance health, because a
current version of an abandoned package is still a liability:

| Signal | Why |
| --- | --- |
| Last publish > 24 months | Unmaintained; no fix will come |
| Single maintainer, no org | Bus factor and account-takeover risk |
| Recent maintainer change | The most common supply-chain compromise vector |
| Install scripts (`postinstall`) | Arbitrary code at install time |
| Deprecated by its author | Migration is inevitable; do it deliberately |
| Deep transitive-only dependency with high fan-in | Blast radius if compromised |

## Unused dependencies

Detected by static import analysis across source, config, and build files, with
the known false-positive classes excluded (peer dependencies, type-only
packages, plugins loaded by name from config, CLI-only tools). Anything the
analysis is unsure about is reported as "possibly unused", not removed.

## Output

```
Dependencies: 214 direct · 1,882 total · 31 outdated · 4 advisories

Upgrade plan — 4 PRs
  1. security   lodash 4.17.15 → 4.17.21          closes GHSA-xxxx (reachable)
  2. safe       12 patch bumps                     no API changes
  3. minor      vitest 2.1 → 2.4, ajv 8.17 → 8.20  additive only
  4. major      typescript 6.x → 7.0               ← alone, migration guide read

Risk flags
  ⚠ node-sass          deprecated by author 2020, last publish 3.1y ago
  ⚠ tiny-json-parser   maintainer changed 14d ago, has a postinstall script
  ⚠ left-pad-clone     single maintainer, 0 orgs, 2.4M weekly downloads

Possibly unused (4): @types/uuid, rimraf, cross-env, nodemon
```

## Related

- [`/gh:security`](security.md) — the advisory side
- [`supply-chain-security`](../skills/supply-chain-security/SKILL.md)
