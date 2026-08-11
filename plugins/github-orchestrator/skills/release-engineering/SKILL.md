---
name: release-engineering
description: This skill should be used when cutting a release — computing a semver bump from conventional commits, writing changelogs and release notes, sequencing breaking changes, and planning rollbacks.
version: 1.0.0
trigger_phrases: [semver, release notes, changelog, version bump, breaking change, tag release, rollback, revert]
categories: [release, versioning, documentation, deployment]
author: github-orchestrator
created: 2026-08-11
updated: 2026-08-11
---

# Release Engineering

## Computing the bump

| Commit | Bump |
| --- | --- |
| `feat!:` or a `BREAKING CHANGE:` footer | major |
| `feat:` | minor |
| `fix:`, `perf:` | patch |
| `docs:`, `chore:`, `test:`, `refactor:`, `style:`, `ci:` | none |

**Pre-1.0 inverts this.** Under `0.x`, a breaking change bumps the **minor**, not
the major. This is the classic release-automation bug, and it is not recoverable
once published.

List commits that do not parse as conventional rather than ignoring them. A
version computed from commits the tool could not read has an unknown bump.

## Readiness gates

Default branch CI green **at the release commit** · no open `release-blocker` ·
no open reachable `critical` advisory · manifest versions match the computed tag ·
lockfile in sync · every breaking change has a migration note · the previous
release is not still draft.

A failed gate stops the release and names the gate. There is no "mostly ready".

## Breaking changes need sequencing, not just documentation

The safe pattern across releases is **expand → migrate → contract**:

1. **Expand** — add the new field/endpoint/column alongside the old. Nothing breaks.
2. **Migrate** — move consumers over. Both paths work.
3. **Contract** — remove the old path, in a later release.

A single release doing all three is a breaking change wearing a disguise. The
same logic applies within a rolling deploy: old code and new schema coexist for
minutes, so `NOT NULL` without a default breaks every insert in flight.

## Changelog vs release notes

They are different documents for different moments.

**Changelog** — Keep a Changelog sections (`Added` `Changed` `Deprecated`
`Removed` `Fixed` `Security`), written from **user effect**, not commit subject:

```
commit  fix(api): guard null user before id deref
entry   Fixed a 500 error when requesting a user id that does not exist;
        the API now returns 404.
```

Omit internal refactors with no observable effect. A changelog padded with
`chore:` entries trains readers to skip it.

**Release notes** — read once, in a hurry: Highlights → Breaking changes with
migrations → Fixed/Added → compare link.

Every breaking change carries the actual migration steps, not just the fact that
it is breaking. A breaking change without migration instructions is an incident
scheduled for whenever someone upgrades.

## Rollback vs forward-fix

| Prefer rollback | Prefer forward-fix |
| --- | --- |
| Broad or user-visible failure | Narrow and understood |
| The fix is not yet understood | The fix is small and obvious |
| Self-contained change | Later merges depend on it |
| No migration ran | An irreversible migration ran |

An irreversible migration flips the decision on its own — reverting code whose
migration ran leaves the schema ahead of the code.

**Check for a feature flag first.** A flag flip has no code risk, cannot conflict
with work merged since, does not touch history, and reverses in seconds. The best
rollback is often not a git operation.

Reverting the code does not revert the **data** already written in the new shape.
Ask that question every time.

## Never

Never tag a commit whose CI is not green. Never move or rewrite a published tag —
publish a new patch; a moved tag breaks every consumer that pinned it, invisibly.
Never delete a published release; supersede it. Never `git reset` a shared branch.

## See also

- `../commands/release.md` · `../commands/rollback.md`
