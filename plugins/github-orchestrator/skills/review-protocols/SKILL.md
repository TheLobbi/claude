---
name: review-protocols
description: This skill should be used when running or designing a code review process — adversarial verification, lens separation, evidence standards, severity mapping, and blackboard synthesis.
version: 1.0.0
trigger_phrases: [review board, adversarial review, verify finding, refute, review lens, severity, false positive]
categories: [review, quality, multi-agent, protocol]
author: github-orchestrator
created: 2026-08-11
updated: 2026-08-11
---

# Review Protocols

## The core asymmetry

A reviewer asked to find problems will find them whether or not they exist. A
skeptic asked to prove the code is *fine* finds the guard clause the reviewer
missed.

So: generate findings with one set of agents, then hand each finding to
independent verifiers **prompted to refute it**. Only findings that survive get
reported.

This is not redundancy. Three reviewers all asked "is this buggy?" produce
correlated errors. One reviewer plus two refuters produce an actual test.

## Lens separation

Give each reviewer a narrow mandate. A lens that comments on everything dilutes
into style commentary, and the real defect gets lost in it.

| Lens | Question |
| --- | --- |
| Correctness | Does it do what it claims for every reachable input? |
| Security | Can an attacker make it do something it should not? |
| Tests | Would these tests catch this breaking? |
| API contract | Will this break something that depends on it? |
| Performance | Does this get worse as data or load grows? |
| Docs | What does this diff make untrue? |

Lenses run **blind to each other**. Shared context makes them converge, and
convergence is exactly what you do not want from independent reviewers.

## Evidence standard

Every finding needs a **concrete failure scenario**: specific inputs or state →
the wrong output or crash.

```
✓ "user.id dereferenced on line 114, guard is on 121. GET /users/:id with an
   unknown id → TypeError → 500 instead of 404."

✗ "possible null pointer issue here"
✗ "this could be a problem at scale"
✗ "consider adding error handling"
```

A finding you cannot write a failure scenario for is a guess. Drop it — an
unfalsifiable finding costs the author more time than it saves.

## Verification and quorum

Default: 3 verifiers, a finding survives if it fails to be refuted by 2 of them.

**Verifiers default to REFUTED when uncertain.** A false positive costs the
author's trust in the entire board; a missed finding costs one review cycle.
Those are not symmetric, and the default should reflect that.

To confirm, a verifier must name the specific refutation attempt that failed —
"no guard anywhere in the call chain, verified at src/a.ts:41 and src/b.ts:88" —
not merely "I could not find a guard".

### Standard refutations to check

Guard earlier in the function or the caller · type system already excludes it ·
path unreachable from any entry point · precondition guaranteed by validation,
a DB constraint, or a construction invariant · the described input cannot reach
the described line · an existing test already covers it · the framework handles it.

## Severity

| Level | Meaning | Action |
| --- | --- | --- |
| BLOCK | Data loss, crash on a reachable path, exploitable, silent wrong results | `REQUEST_CHANGES` |
| REQUEST | Wrong on an edge case, unbounded resource, missing regression test | `COMMENT` |
| SUGGEST | Fragile but correct; improvement | `COMMENT` |
| PRAISE | A pattern worth repeating | — |

Cap `SUGGEST` at 5. Beyond that they crowd out the blocking findings, which is
exactly backwards.

## Synthesis

Deduplicate by **root cause**, not by text — two lenses often describe one
defect from different angles. Merge those into a single finding carrying both
framings.

Always report the dropped count with reasons. It tells the author the board is
calibrated rather than merely quiet, and it exposes lenses that are
systematically wrong.

## Posting

One pending review, all inline comments attached, submitted once. Never a stream
of individual comments.

## See also

- `pr-craft` — comment and reply discipline
- `../commands/review.md` — the command that runs this protocol
