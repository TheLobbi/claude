---
name: cc-verify-between-waves
description: Checkpoint-between-waves cadence for multi-file refactors. After each logical batch (wave) of edits, run typecheck + tests; commit only on green; roll back the wave (not the whole branch) on red. Use for any refactor touching more than three files or three distinct concerns.
allowed-tools:
  - Read
  - Bash
  - Edit
  - Write
triggers:
  - verify between waves
  - wave-by-wave
  - checkpoint refactor
  - tsc after each
  - multi-file refactor
---

# Verify Between Waves

A named cadence for multi-file refactors. This codifies what happens in practice on successful
large refactors — and what's missing on the ones that go sideways.

## Why this exists

Refactors fail when edits compound before any get verified. Classic failure mode: wave 1 edits
look fine; wave 2 breaks something subtle in wave 1; by wave 4 the tsc errors are so tangled the
repro takes longer than redoing the work.

## Session evidence

Applied to the `scrapin-aint-easy` Tier-A refactor pass (one real session, n=1):

- **7 waves**, 24 upgrades, 9 commits
- **tsc + tests after every wave** before committing
- **Regressions caught inside the wave they were introduced**:
  - `this._initialized` rename broke two write sites (caught by tsc immediately after rename wave)
  - `now` unused after the dead-comparator removal wave (caught on the same tsc pass)
- **9 of 9 commits landed green** — no mid-branch rollback ever needed
- **Every wave's gate**: `npx tsc --noEmit && pnpm test` — no exceptions

## When to use this

Any edit set that:

- Touches >3 files, **or**
- Touches >3 distinct concerns (security, perf, DX, cleanup, …), **or**
- Runs longer than 20 minutes of human time, **or**
- Mixes mechanical cleanup with new-code additions

Skip for single-file fixes, one-line edits, and documentation-only commits.

## The cadence

```
Wave = a logically coherent group of edits that can be reasoned about as one change.

Per wave:
  1. Read the target files (batched, parallel Reads).
  2. Make the edits (batched, parallel Edits). Keep edits narrow and related.
  3. Gate: run typecheck (`tsc --noEmit`) and tests (`pnpm test` or equivalent).
  4. If RED:
     a. Do NOT add more edits.
     b. Fix the regression inside the current wave.
     c. Re-run the gate until GREEN.
     d. If the fix grows the wave beyond "one coherent change", split into two waves
        with a commit boundary between them.
  5. If GREEN:
     a. Commit with a scoped message naming the wave.
     b. Move to the next wave.

After N waves: push.
```

## Wave-sizing heuristics

| Signal | Wave size |
|---|---|
| Mechanical replace_all (e.g., `errMsg` helper replacing 11 ternaries) | One wave by itself |
| Related fixes in one file | One wave |
| Same pattern applied across 2-3 files | One wave |
| Cross-cutting change (interface extraction, rename of a widely-used symbol) | One wave, then verify, then cleanup wave |
| New feature + tests | One wave for feature, one for tests |

Anti-pattern: stuffing "security fixes + cleanup + new tests + doc update" into one wave.

## The gate: what counts as "green"

Minimum:

- Typecheck: no errors
- Tests: all pre-existing tests pass; new tests added in the wave also pass

Better (if available):

- Lint: clean
- Coverage: above the configured threshold
- Smoke: a handful of explicit manual checks where unit tests can't reach (e.g., MCP stdio transport round-trip)

## Example: commit messages

```
wave 1 — security hardening
wave 2 — tools.ts cleanup + schema visibility
wave 3 — pino redact + telemetry race + HNSW init
wave 4 — Puppeteer page pool
wave 5 — safePaginate helper, vector dirty flag
```

Each message states the wave's coherent theme; body documents what changed and what was left out.

## Interaction with other patterns

- **Refactor Pipeline** (`cc-orchestrate.md` Template 5): verify-between-waves is the "Verifier"
  role formalized as a repeating cadence instead of a single final step.
- **Checkpointing** (`skills/checkpointing/SKILL.md`): checkpointing saves orchestrator state
  periodically; verify-between-waves saves code state (commits) periodically. Complementary.
- **Context Budget** (`skills/cc-context-budgeting/SKILL.md`): waves are natural `/compact`
  boundaries — after each green commit, the surrounding context is a good candidate to summarize.

## Rollback recipe (if a wave went bad)

```
git reset --mixed HEAD~1      # undo the wave commit but keep files
git checkout -- <files>       # drop the bad edits
# or: git stash                # keep them for inspection
```

Then either redo the wave in smaller steps, or abandon that particular change and move on.

## Red flags that you're NOT running this cadence

- You haven't run tsc in 10+ edits.
- You're hoping the tests pass "at the end".
- You have >5 uncommitted files changed.
- You're about to commit 200+ line diff without having run typecheck since the first edit.

Any of these → stop editing, run the gate, commit what's green, re-plan the rest as new waves.
