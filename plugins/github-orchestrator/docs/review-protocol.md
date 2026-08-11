# The Adversarial Review Board

Why the review board is built the way it is.

## The problem with AI code review

An agent asked "what's wrong with this code?" will answer. It will always
answer. Ask three agents and you get three answers, largely overlapping, several
of them wrong in the same direction — because they share the same prior about
what code smells look like.

The failure mode is not missing defects. It is **confident false positives**.
A reviewer that flags a null-pointer risk guarded three lines up costs the
author time to investigate, and after a few of those they stop reading the
review carefully. At that point the board is worse than nothing: it consumes
attention and produces no signal.

## The fix: asymmetric verification

Generate findings with one set of agents. Then hand each finding to independent
verifiers **prompted to refute it**.

This is not the same as asking a second reviewer. A second reviewer asked "is
this buggy?" produces a correlated error. A skeptic asked to prove the code is
*fine* searches a different space — it goes looking for the guard clause, the
type constraint, the validation middleware, the existing test. Those are exactly
the things the first reviewer missed.

```
      diff
        │
   ┌────┴────┬────────┬────────┬────────┬────────┐
correctness security tests    api      perf     docs      ← blind to each other
   └────┬────┴────────┴────────┴────────┴────────┘
        │  raw findings
        ▼
   for each finding: 3 × adversarial-verifier          ← "refute this"
        │  survives if ≥2 fail to refute
        ▼
   review-synthesizer                                  ← dedup, rank, verdict
```

## Why the verifier defaults to REFUTED

A verifier that cannot decide returns `REFUTED`.

The costs are asymmetric. A false positive costs the author's trust in the whole
board — and trust, once gone, applies to every future review including the
correct ones. A missed finding costs one review cycle, and the defect is still
catchable by CI, by a human reviewer, or in staging.

So the default is set where the cheaper error lives. To `CONFIRM`, a verifier
must name the specific refutation attempt that failed — "no guard anywhere in
the call chain, verified at `src/a.ts:41` and `src/b.ts:88`" — not merely "I
could not find a guard". The difference is whether it looked or shrugged.

## Why the lenses are blind to each other

Shared context makes reviewers converge. Convergence looks like agreement and
is actually contamination: the second lens inherits the first's framing and
stops looking where the first did not.

Six independent passes over the same diff produce genuinely different findings,
and where two of them independently land on the same defect, that agreement
carries real information. The synthesizer merges those into one finding with
both framings — it is one defect, described twice.

## Why lenses are narrow

A reviewer with a broad mandate produces broad output. Asked to "review this
PR", an agent comments on naming, structure, style, tests, and — somewhere in
the middle of that — the actual bug, at the same visual weight as everything
else.

Each lens gets one question:

| Lens | Question |
| --- | --- |
| Correctness | Does it do what it claims for every reachable input? |
| Security | Can an attacker make it do something it should not? |
| Tests | Would these tests catch this breaking? |
| API contract | Will this break something that depends on it? |
| Performance | Does this get worse as data or load grows? |
| Docs | What does this diff make untrue? |

Style and naming are deliberately absent. A linter does that better, without
consuming review attention.

## The evidence standard

Every finding needs a concrete failure scenario: specific inputs or state → the
wrong output or crash.

```
✓ "user.id dereferenced on line 114, guard is on 121. GET /users/:id with an
   unknown id → TypeError → 500 instead of 404."

✗ "possible null pointer issue here"
✗ "this could be a problem at scale"
✗ "consider adding error handling"
```

The rejected forms share a property: they cannot be refuted, so they cannot be
verified, so they survive the board by default. Requiring a failure scenario is
what makes stage 2 possible at all.

## Reporting the drops

The synthesizer always reports how many findings were refuted and why. This is
not padding.

It tells the author the board is *calibrated* rather than merely quiet — a
review that says "9 findings, 4 confirmed, 5 refuted" reads very differently
from one that says "4 findings". And over time, the drop log shows which lens is
systematically wrong, which is the only way to fix it.

## Tuning

| Knob | Where | Effect |
| --- | --- | --- |
| `verifiers` | `config/policies.json:reviewBoard` | More verifiers, more confidence, more cost |
| `quorum` | same | How many must fail to refute. 2 of 3 default; 3 of 3 for a release branch |
| `lenses` | same | Drop lenses that do not apply to the repository |
| `maxSuggestions` | same | Caps `SUGGEST` so they do not crowd out blockers |
| `--no-verify` | `/gh:review` | Skips stage 2 — faster, noisier, not recommended |
| `--effort` | `/gh:review` | `low`/`medium`: fewer, higher-confidence. `high`/`max`: broader sweep |

Raising the quorum makes the board quieter and more trustworthy. Lowering it
makes it noisier and, past a point, ignorable. When in doubt, raise it — a board
people read is worth more than a board that finds everything.
