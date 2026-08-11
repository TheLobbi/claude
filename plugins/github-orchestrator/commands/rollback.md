---
name: gh:rollback
intent: Plan and execute a revert or release rollback with blast-radius analysis and a forward-fix comparison
tags:
  - github-orchestrator
  - command
  - release
inputs:
  - target
  - flags
risk: high
cost: medium
description: Analyze what a revert would touch, compare rolling back against forward-fixing, then execute the safer option with the migration and dependency order handled
---

# /gh:rollback

## Usage

```
/gh:rollback --pr 482               # revert a merged PR
/gh:rollback --release v2.4.0       # roll back a release
/gh:rollback --commit a1b2c3d
/gh:rollback --analyze              # blast radius only, no action
```

## Roll back or forward-fix?

`rollback-planner` compares both before recommending, because reverting is not
automatically the safe option:

| Prefer **rollback** when | Prefer **forward-fix** when |
| --- | --- |
| The failure is broad or user-visible | The failure is narrow and understood |
| The fix is not yet understood | The fix is small and obvious |
| The change is self-contained and revertible | Later commits depend on the change |
| No migration ran | An irreversible migration ran |
| Time pressure is high | Reverting would itself break something |

An irreversible data migration flips the recommendation on its own. Reverting
code whose migration already ran leaves the schema ahead of the code — usually
worse than the original bug.

## Blast radius

```
/gh:rollback --pr 482 --analyze

Revert of #482 "feat(sessions): read from postgres"

Direct:      4 files, +40 −38
Dependents:  2 merged PRs touch the same code since
             #487 (feat: session TTL)   — conflicts with the revert
             #491 (fix: session logging) — clean
Migrations:  1 ran (2026_08_02_sessions) — REVERSIBLE, down migration tested
Feature flag: SESSIONS_PG — still present

RECOMMEND: flip the flag, do not revert.
  The flag flip is a config change with no code risk and no conflict with #487.
  Revert is available if the flag path is also broken.
  Command: /gh:release --config SESSIONS_PG=false
```

The best rollback is often not a git operation at all. A feature flag flip
achieves the same outcome without touching history or conflicting with work
merged since — the planner checks for one before recommending a revert.

## Executing a revert

1. `git revert` the **merge commit** with `-m 1` for merge commits, or the squash
   commit directly. Never `git reset` a shared branch.
2. Revert dependents in reverse merge order if the base revert conflicts.
3. Run the down migration only if it is tested and reversible; otherwise stop
   and escalate — an untested down migration on production data is a second
   incident.
4. Open the revert as a **PR**, not a direct push, so it gets CI and a reviewer.
   The exception is a live outage under an incident, where the direct push is
   logged in the incident record.
5. File a follow-up issue with the original diff attached so the work is not lost.

## Post-rollback

An incident report is generated from
[`templates/incident-report.md`](../templates/incident-report.md): timeline,
detection, contributing factors, and the specific control that would have caught
it earlier. It names systems and gaps, not people.

## Related

- [`/gh:release`](release.md)
- [`/gh:insights`](insights.md) — change failure rate and restore time
