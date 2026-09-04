---
name: evidence-rules
description: One claim with ten sightings - a wrong predicate and a missing notification both produce a plausible, quiet, checkable-looking state, neither raises an error, and the only defence in both is a second reading through a different mechanism. In tooling that is the raw print through a different field; in coordination it is measuring the thing you wait on rather than waiting for news of it. Covers - ask what an artifact SITS ON and whether that moved, print the RAW STATE beside any predicate that decides whether to stop, a gate must name an input that turns it red, a destructive predicate needs its spare case proven by mutation, an absence needs the size of the space searched, a search-space cap manufactures false negatives while a result-set cap does not, check the exit code before reading the output, a true measurement stated as a durable property never expires and never stops being wrong, a count is only evidence when the thing counted is named, and a correction is itself a claim that names the set it ranges over. Use when writing a gate, guard, scanner, retention or delete rule; when reporting that something was not found, does not exist, or is not used; when writing a PR body, review verdict, status report or handover; when quoting a number to someone else; when relaying someone else's finding; and when correcting anything you or anyone else said earlier.
---

# Evidence rules

## One claim

> **A wrong predicate and a missing notification both produce a plausible,
> quiet, checkable-looking state. Neither raises an error. In both cases the
> only defence is a second reading through a different mechanism.**

Everything below is that claim in a different place. The rules are not ten
lessons; they are ten sightings of one failure, which is why they carry to a
codebase and a fleet that have nothing else in common with the one that found
them.

### Two media

| | The second reading is |
|---|---|
| **In tooling** | the raw print, read through a **different field** — a status against a conclusion, a file listing against an inventory count |
| **In coordination** | **measuring the thing you wait on**, rather than waiting for news of it — query the blocker yourself instead of filtering for a message about it |

That collapses two things most fleets treat as separate problems.
Coordination failures are not a second category beside evidence failures.
They are the same failure in a medium where the missing artifact is a message
rather than a field.

### One asymmetry, which decides where to spend if you can only afford one

**You cannot enumerate the absences of messages you never wrote.**

- *"The merger tells the unblocked lane"* is **unauditable**. It leaves no
  trace, so nobody can verify it afterwards — **including the merger.**
- *"Every waiting lane measures its own blocker"* is **self-verifying by
  construction**: the check either ran or it did not, and the next heartbeat
  says which.

Teach the pair. **If only one survives, it is the waiter's.**

The demonstration is two audits that looked identical and were not. One
session enumerated **its own handoffs** — a set it owns completely — and
returned a sound negative naming seven items. Another enumerated **its own
reported merges** and could not make the same claim, because merges and
unblocks are different sets, and **the set of waiters is precisely what no
artifact records**. "One omission found, and I cannot bound the rest" is a
different claim from a clean negative.

That is rule 7 arriving at an **audit** instead of a count: the noun was
right and the set was not the set the question was about. And the easy move
was available and obvious — enumerate the merges, report all told, close the
item — and **a clean result would have been unfalsifiable.**

> A practice is only worth teaching where the confident version could never
> have been checked.

**Every rule below carries a "does not bite" clause**, and that is
deliberate:

> A rule applied everywhere is a rule nobody keeps. Knowing where it does not
> bite is what makes it survivable.

Worked examples for every rule: `references/worked-examples.md`.

---

## 0. What does this artifact SIT ON, and did that move?

Ask it **separately** from "did the artifact change". This is the rule the
other eight are special cases of, and it is the one that survives when the
others are forgotten.

Three members, none of them visible in a diff of what the artifact owns:

- **The CI definition changed** under an unchanged branch.
- **A dependency changed** under unchanged files.
- **A second ref moved** under an unchanged branch.

A content-only check answers the content question and silently declines the
build question. A change that owns no build files can still be broken by a
version pin that moved directly underneath it.

**Does not bite:** when the artifact compiles against and pins nothing.
Shell scripts, workflow YAML and documentation have no plausible
build-question exposure, and re-checking them is ceremony. Ask what the
artifact could *possibly* sit on before you go looking.

## 0a. Before writing a predicate over an API's data, check whether the API ALREADY ANSWERS THE QUESTION

This sits above everything below it. Most aggregate questions — *has this
settled, did it all pass, how many are outstanding* — are already computed by
the service that owns the data. A homemade predicate over its raw rows is a
reimplementation of something already answered, and it is a reimplementation
written under time pressure by someone who has not read the type definitions.

The evidence is in rule 0b: **four consecutive defects, hours of attention, a
broadcast to seven sessions, and a fix that was itself defective — all in
code nobody needed to write.** The one session never exposed was never
exposed *because it had not written the code*: it quoted the service's own
aggregate field and read the entries. It sat through the whole episode
unaffected **without knowing it was safe.**

**Does not bite:** when the answer you need genuinely is not exposed — a
cross-field condition, a filter the API does not offer. Then you write the
predicate, and rule 0b applies with full force.

## 0b. Where a predicate decides whether to STOP, print the RAW STATE beside the decision

For the case where a homemade reading genuinely is needed. The two readings
must come through **different mechanisms**, or they are one reading printed
twice.

> **"Different mechanisms" means different CHANNELS, not different tools.**
> A lane distrusted a line-ending count, re-ran it in a second shell, and got
> identical numbers — and both were wrong, because both shells shared one
> conversion layer. **Two shells over one channel are one mechanism wearing
> two names.** Practical form: to measure bytes, get them out of every
> pipeline first — redirect to a file, then read the file.

This rule exists because its own subject matter kept breaking. In a single
evening, one predicate — "is this check still running?" — went through **four
variants, and each fix became the next defect**:

1. the field is `null` while running;
2. no — it is an **empty string**, not null;
3. so a fallback operator was added, and it is **silently dead** on an empty
   string;
4. and the collection is **mixed-type**: one type carries that field, another
   type does not carry it *at all*, so the corrected test marked every item of
   the second type as permanently unsettled — on exactly the repositories
   where a third-party integration posts that second type.

**All four produced a confident number and no error.**

The conclusion is not that a better predicate was needed. Every one of the
four was caught the same way: **two readings printed beside each other and
disagreeing.** The third variant was found broken *by this very rule* — a
reviewer printed the raw state next to the decision and they did not agree.

> Here is the current best predicate, and **it is not what protects you.**

Write it that way explicitly wherever you ship a predicate, because the
observed failure mode is that people adopt the predicate and drop the print.
A document that ships the predicate as the rule ships the defect with it, and
the next reader inherits the failure it took four hours to find.

**Assume a fifth variant exists and has not been found yet.** That assumption
costs one printed line and is the only thing that survives the discovery.
(One did: a file written with the wrong line ending, which a strict parser
then could not match — failing *loud and closed*, the opposite direction from
the other four.)

### When your instruments disagree, say so

The hardest move on this list, and the one worth naming as a skill rather
than a caution. A lane's two instruments contradicted each other **inside one
command** — one showed a carriage return present, the other removed zero such
bytes from the same blob. It **stopped and said its instruments disagreed**
rather than picking a reading.

The reading it declined to pick was the alarming one — the one that makes a
finding, and would have been published. *"My instruments disagree and I do
not yet know"* is a worse-sounding output and a better one.

Generalised, past any one forge: any place your code asks "has this settled",
"is this empty", "did this succeed" and then *stops looking* — print what the
source actually said, next to what you concluded, obtained a different way.

**Does not bite:** a predicate whose wrong answer is loud and immediate — a
parse that throws, a build that fails. The rule is for predicates that decide
to **stop waiting, stop searching, or stop checking**, because those fail
into silence.

## 1. A gate must name an input that turns it RED

If you cannot state the input that makes it fail, it is not a gate. It is a
green light wired to nothing.

Ask of every check, test, guard, scanner and assertion: **what would this
prove if it passed?** A check whose red is unreachable passes forever while
measuring nothing.

Two forms it hides in:

- **The unsatisfiable predicate.** A retention rule requiring "untouched for
  14 days" on a resource regenerated hourly can never fire. An age window on
  a resource the system regenerates faster than the window is unsatisfiable
  by construction, **at any cadence**. Check the burn rate against the window
  before choosing an age filter at all — and prefer **state** over **elapsed
  time** for any reap, prune or retention predicate.
- **The documented-but-ungated defect class.** A doc that records a defect
  class with no gate behind it is the documentation version of a gate that
  cannot go red. If the answer to "what makes this checkable" is "someone
  remembers to read this", it is not a control yet.

**Does not bite:** a check whose whole purpose is to report state rather than
to gate — a dashboard, an inventory, a summary line. Demanding a red from
something that was never a gate turns a useful report into a broken gate.

## 2. A destructive predicate needs its SPARE case, proven by mutation

Rule 1 covers predicates whose action is to *fail*. It does not cover
predicates whose action is to *delete*. Those need the mirror:

> For any predicate whose action is destructive, construct an input it must
> **SPARE** and one it must **REAP**, and show it does both.

A delete predicate that cannot be made to spare is exactly as broken as one
that cannot be made to delete — and only the second half is usually tested,
because "it deleted the thing" looks like success.

**The loophole, and its fix.** A spare test that would *also* pass with the
exemption removed proves nothing, and is worse than no test because it reads
as coverage. A green suite where every input happens to be clean does not
prove the skip logic works; it proves there was nothing to skip.

> **Prove a spare case by MUTATION, not assertion.** Mutate the guard and
> watch which cases fail. Each mutation should fail exactly the case that
> claims to depend on it, and nothing else.

Asserting that a spare case exercises its branch is a claim. Mutating the
guard and watching that case fail is a measurement a reviewer can re-run.
For a destructive rule specifically, the spare case must be one the rule
**would reap** if its protection were removed.

**Does not bite:** a predicate whose action is reversible and cheap to
reverse — moving to an archive rather than deleting, or flagging rather than
removing. Make the action reversible and you have bought your way out of the
proof.

## 3. An absence is only evidence when it carries the SIZE OF THE SPACE SEARCHED

"No matches" is a claim about a search. "No matches across 188 files" is a
claim about a tree.

Same rule, three sizes:

- **Name the SET** for a sweep.
- **Name the FILE COUNT** for a search.
- **Name the SCOPE** for a measurement.

Mechanics that make the negative sound:

- Make a failed search **raise** rather than yield an empty set.
- Include hidden and dotted directories in any recursive walk that claims to
  cover a tree — most tools skip them by default, and the interesting
  directories are often dotted.
- **A silent stall and a clean negative are the same bytes without the
  count.**

**The retroactive falsifier**, cheap and usable on results already in hand:
an emitted line proves the instrument was alive for that item, whatever its
value. The test is whether output *appeared* for that item, not whether the
number was interesting. **A zero is a measurement, not an absence.**
"0 findings across 5 files" and "no output for 5 files" look identical in a
summary and are opposite claims.

**And the finding is never the absence itself.** Name the artifact you read
and quote what it said.

**Does not bite:** a positive finding. If you found the thing, the size of
the space is trivia. This rule is entirely about negatives, and loading it
onto every claim is how it gets ignored on the claims that need it.

## 4. A SEARCH-SPACE cap manufactures false negatives; a RESULT-SET cap does not

**The test: did the cap come BEFORE or AFTER the thing that decided the
answer?**

- `grep <pattern> <all files> | head -40` searches everything and trims what
  it found. A **result-set** cap. An empty result is genuinely empty.
- `list --limit 100`, then matching, never examines position 150. A
  **search-space** cap. The empty is manufactured.

Every server-side `--limit`, and every `-First N` / `head -N` that **feeds a
later filter**, is a search-space cap.

**Why it is the worst of the truncation family:** a stall leaves a hang, a
timeout leaves a kill code, **a cap leaves exit 0 and a plausible result.** It
cannot be caught by inspecting the output, only the **invocation** — so the
check belongs where the command is *written*, not where the result is read.
A negative claim whose command is not quoted is unreviewable by construction.

Size the set first, then search.

**A filtered test run is a search-space cap by another name.** `--filter`
decides which tests are allowed to fail before any of them run, so a green
filtered run supports "the tests I selected pass", never "the change is
safe". Every "tests pass" claim must say whether the run was filtered.

**Does not bite:** display. Capping what you *show* a reader after the
decision has been made costs nothing. The distinction is the whole rule —
treating every cap as unsafe means fetching everything forever, and that is
how the rule gets dropped.

## 5. Check the EXIT CODE before you read the output, not after

A timed-out command that already emitted output presents as a completed one.
"Treat an empty result as unknown" does not cover it — the result is not
empty.

Learn your platform's timeout kill code by sight (128+SIGTERM = **143** on
POSIX). It is not an ordinary nonzero.

Two confirmed cases in one day, and in **both** the harness stated the
failure on its first line and the reader went past it to the output, because
the emitted text was more legible and more expected than the code above it.

**The fix is a reading order, not a better instrument.**

Related traps in the same family:

- A pipe to `tail`, `head`, or a first-N filter **replaces the command's exit
  code with the filter's**. Capture the exit code before any shaping.
- **Never shape the output of a command whose output you intend to quote.** A
  `-Last`/`head` on a gate run discards the summary line, leaving exit 0 and
  a plausible tail.
- Empty output is not a measurement when a **denial** is hidden. A silenced
  permission error and a genuine empty look identical.
- **A dead instrument is UNKNOWN — neither a red nor a green.** A tool that
  fails to start has not measured anything. Revive it, then measure.

**Does not bite:** an interactive read you are about to act on anyway and
will notice failing. The discipline is for results that get *quoted*, and for
loops, where one dead item hides among many live ones.

## 6. A true measurement stated as a DURABLE PROPERTY never expires — and never stops being wrong

A third failure category beside "gap" and "trap" cautions:

- A **gap** caution is true when measured and expires when someone fixes the
  gap.
- A **trap** caution never expires, because the mechanism holds.
- This one is **neither: the measurement is right, the verb is wrong.**

Re-verification returns the same true answer *and* the same false conclusion,
which is exactly why such a sentence survives years of confident use.

| Measured | Reported as | Actually proves |
|---|---|---|
| a merge would be a no-op **now** | "absorbed" | absorption at that moment only |
| a structural gate returned READY | "ready to merge" | structure, not CI |
| "11 of 11 gates passed" | "everything passes" | what that gate set **contains** |
| "both settings present on the serving revision" | "configured" | one revision, one moment |

The last is the rule in miniature: a future revision deployed without them
reopens the identical defect silently. The fix is not a better measurement —
it is a **gate**, falsified by removing one setting from a scratch instance.

**How to apply:** put the scope inside the sentence, and inside the **tool's
own output** where the reader meets it, not in a README nobody opens at the
moment of the claim. Print `POINT-IN-TIME:` next to the verdict.

**Does not bite:** a genuinely immutable fact — a released version's content,
a merged commit's diff, a signature over a fixed payload. Stating those as
durable properties is correct, and hedging them trains readers to ignore the
hedge where it matters.

## 7. A count needs its NOUN and the SIZE OF THE SET it ranges over

Two independent failure modes, caught by two different questions, so ask
**both** of every number you pass to someone else.

- **Missing noun.** "5 in progress" (runs) relayed without its unit, read as
  "five lanes", became a published concurrency cap.
- **Narrower scope.** "0 in flight" had its noun and was still wrong: it was
  measured across 8 repositories while the sentence implied all 14.

A third, which is the same rule pointed the other way: **a true count of a set
nobody wanted.** "45 PRs across the eight repositories, all authors" was
correct, and swept in unrelated work through a date range wider than the
question. Correct noun, correct arithmetic, wrong set.

Before quoting a number: **name what is counted, name the set counted over,
and say whether you measured it or received it.** Evidence denominated in one
unit does not transfer to another without a measurement taken in the same
window — and if nobody captured the second count then, the transfer is
unrecoverable, not merely unverified.

Two riders:

- **Two measures agreeing once is not two measures agreeing.** A coincidence
  in today's data is not evidence the distinction is academic.
- **A definition change can move the EXIT, not just the threshold.** Two
  readings that agree on today's decision and disagree on whether the rule
  can ever end are not the same rule.

**Does not bite:** a number nobody will act on and nobody will repeat. A count
inside your own scratch reasoning does not need a provenance sentence. The
rule attaches at the moment the number is **handed to someone else**.

## 8. A correction is a claim; it names the set it ranges over

The most dangerous claim in a long-running system is a correction, because it
arrives wearing the authority of the check that produced it.

- **A partial correction is harder to catch than the stale claim it
  replaces.** It arrives *as* a correction, so the reader stops checking. If
  six items were listed and three were wrong, the correction says which three
  and why the other three still stand — it never quietly shrinks the count.
  **Diff and group; never confirm only the one change that prompted the
  alert.**
- **When a correction contains a MEASUREMENT, recompute the measurement.** A
  conceded number is still a number. (This works for conceded numbers, not
  for conceded judgements.)
- **The author of a mitigation is usually the party it exculpates.** Ask who
  the sentence lets off. A mitigation costs its author nothing and arrives
  sounding like fairness. State whose fault it softens — including your own —
  and recompute a received one before repeating it.
- **A relay that sharpens is a relay that falsifies.** Relaying an unverified
  claim preserves its uncertainty; adding a location, number or name the
  source never supplied destroys that uncertainty while looking like
  comprehension. Carry provenance across every hop.
- **Apply the standard in both directions.** A reviewer who only ever
  corrects downward on other people's claims is doing something else. The
  same falsifier discipline binds your own output.

**Does not bite:** a typo, a slip that changes nothing for the reader. Fix it
and move on. Ceremonial self-correction is noise that trains readers to skim
the corrections that matter.

---

## Three shapes worth knowing

**Evidence from BEFORE an event proves nothing about the state after it.**
Neither a freshness rule nor a name-the-head rule catches this, because the
observation is genuinely current and genuinely wrong for the question. Ask
which side of the event the observation sits on. It is right for the wrong
reason, so it survives review and never goes stale.

**A wrong causal story can be attached to two correct numbers.** Recomputing
both numbers confirms them and confirms nothing about the story. Reproduce
the **comparison**: were both measured at the same time, over the same noun,
at the same scope, by the same method?

**A verdict bound to a head can be invalidated by the CHECK STATE moving even
when the head does not.** Both clauses are load-bearing: the head moving
invalidates a verdict, *and* an unmoved head does not preserve one. Re-read
the state; do not infer it from the SHA.

## Writing a thin finding

One observation is not a diagnosis. The same weak claim has two forms with
opposite blast radius:

- ❌ *diagnosis*: "the cache is leaking under concurrent runs"
- ✅ *instruction*: "one run at 14:02 showed X; if you see X again, capture Y
  before restarting"

Writing a one-observation finding as an instruction makes thin signal safe to
circulate rather than forbidden.

## The coordination medium, concretely

The same claim, where the missing artifact is a message rather than a field.
A lane blocked on another lane's merge waited **two hours** after the merge
landed, because the unblocking was a notification that nobody sent and
nobody could later prove was missing.

**The rule ships as a pair, and shipping half of it is what cost those two
hours:**

1. **The merger tells the unblocked lane, as part of the merge** — not as a
   follow-up, the same "one action, never two" shape as push-and-open-PR.
2. **Every waiting lane measures its own blocker, each heartbeat** — queries
   the PR, the branch, the check, itself.

Both are cheap. **Neither is sufficient.** And per the asymmetry above, the
second is the one that survives: it leaves a trace, so it can be audited.

**`waiting` and `standby` are different states, and only one has a
counterparty.**

- `waiting | <specific next action> | <why>` — reserved for something
  genuinely pending on someone else. It names who or what is being waited on,
  so a monitor can check whether that thing is still pending.
- `standby | <next action when work arrives> |` — genuinely idle.

Collapsing them hides every instance of this class, because a lane that is
blocked and a lane that is idle look identical in a census. That is what
happened, and it is why the heartbeat format has six states rather than five.

## The checklist

Before you send a PR body, verdict, status line, or any negative claim:

- [ ] You asked what the artifact sits on, separately from whether it changed.
- [ ] Every predicate that decides to stop prints the raw state beside its
      decision, read a different way.
- [ ] Every gate names the input that turns it red.
- [ ] Every destructive predicate has a spare case, proven by mutation.
- [ ] Every absence carries the size of the space searched, command quoted.
- [ ] No cap sits upstream of anything that decided a negative.
- [ ] Exit codes were read before outputs; nothing was shaped before quoting.
- [ ] Every measurement carries its moment and its scope, in the sentence.
- [ ] Every number carries its noun, its set, and measured-or-received.
- [ ] Every correction names the whole set it ranges over.
- [ ] An audit's set is the set the question was about — not the adjacent one
      you happen to own.
- [ ] Anything you are waiting on, you measured yourself this cycle.
