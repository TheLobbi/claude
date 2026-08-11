---
name: gh:release
intent: Run a release train from semver calculation through changelog, release notes, tagging, and publication
tags:
  - github-orchestrator
  - command
  - release
inputs:
  - bump
  - flags
risk: high
cost: high
description: Compute the semver bump from conventional commits, generate a changelog and human release notes, verify release readiness gates, then tag and publish
---

# /gh:release

## Usage

```
/gh:release                          # compute the bump and show the plan
/gh:release --bump minor             # override the computed bump
/gh:release --prerelease rc          # v2.4.0-rc.1
/gh:release --dry-run                # full plan, nothing written
/gh:release notes                    # regenerate notes for an existing release
/gh:release --publish                # execute the plan
```

## Phases

### 1. Compute the bump

From conventional commits since the last tag:

| Commit | Bump |
| --- | --- |
| `feat!:` or a `BREAKING CHANGE:` footer | **major** |
| `feat:` | **minor** |
| `fix:`, `perf:` | **patch** |
| `docs:`, `chore:`, `test:`, `refactor:`, `style:`, `ci:` | none |

Pre-1.0 is handled correctly: under `0.x`, a breaking change bumps the **minor**,
not the major. Getting this wrong is the classic release automation bug.

Commits that do not parse as conventional are listed rather than ignored — a
release computed from commits the tool could not read is a release with an
unknown bump.

### 2. Readiness gates

`release-conductor` verifies all of these before anything is tagged:

- Default branch CI is green at the release commit
- No open PRs labeled `release-blocker`
- No open `critical` security alerts that are reachable
- The version in `package.json` (and any other manifest) matches the computed tag
- The lockfile is in sync with `package.json`
- No unreleased breaking change lacks a migration note
- The previous release is not still in draft

A failed gate stops the release and names the gate. Releases are not "mostly ready".

### 3. Changelog

`changelog-scribe` appends a Keep a Changelog section, grouped Added / Changed /
Deprecated / Removed / Fixed / Security. Entries are written from what the change
*does for a user*, not from the commit subject:

```
# commit subject
fix(api): guard null user before id deref

# changelog entry
- Fixed a 500 error when requesting a user id that does not exist; the API now
  returns 404.
```

### 4. Release notes

Notes are for humans reading them in a hurry, so they lead with what changed for
them, not with a commit list:

```markdown
## Highlights
Per-tenant rate limiting is now enforced on the ingest API…

## Breaking changes
`POST /v1/ingest` now returns 429 …
**Migration:** set `INGEST_RATE_LIMIT` …

## Fixed
…

## Full changelog
https://github.com/…/compare/v2.3.1...v2.4.0
```

Breaking changes always carry a migration paragraph. A breaking change without
migration instructions is an incident scheduled for later.

### 5. Tag and publish

Annotated tag on the release commit, GitHub release created from the notes,
artifacts attached if the repo builds any. Prereleases are marked as such so
they do not become `latest`.

## Never

- Never tag a commit whose CI is not green.
- Never rewrite or move a published tag — publish a new patch instead.
- Never delete a published release; mark it deprecated and supersede it.
- Never include credentials or internal hostnames in release notes.

## Related

- [`release-train`](../workflows/release-train.json) — declarative form
- [`/gh:rollback`](rollback.md) — when a release goes wrong
- [`release-engineering`](../skills/release-engineering/SKILL.md)
