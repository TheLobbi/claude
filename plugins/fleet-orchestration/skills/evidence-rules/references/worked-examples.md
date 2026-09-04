# Worked examples

Every rule in `SKILL.md`, with the incident that produced it. Repository and
person names are removed; the numbers are the ones actually measured. They are
kept because a rule with a number attached is remembered and a rule stated in
the abstract is not.

---

## Rule 0 — what does the artifact sit on, and did that move?

**The near-miss that came out clean.** A PR was cleared to merge on a
carry-forward check that answered only the **content** question: the branch's
own blobs were unchanged, so the earlier verdict was carried forward. What
that check never looked at was the base absorb underneath it, which had moved
a central package version pin — a major-version bump of a library — directly
beneath the files the PR touched.

It merged. All fifteen checks settled, the build job succeeded, nothing broke.

**Recorded as luck, not as a success.** The build question was answered
*after* the merge rather than before it. The reason this version is worth
more than an incident that caused damage: *an entry with a real gap and a
fine result is the version people believe, because nobody can dismiss it as
an unlucky day.*

**And the other half, which is what makes the rule survivable.** The same
session **declined** to re-check a second PR under the same suspicion,
because its absorbed span was shell scripts, PowerShell and workflow YAML —
which compile against and pin nothing, so there was no plausible
build-question exposure at all.

> A rule applied everywhere is a rule nobody keeps. Knowing where it does not
> bite is what makes it survivable.

**The check-state sub-case, one PR, both directions, one hour.** The same PR
read "8 passed, 2 failed" and later "15 completed, 10 success" **at the same
SHA**, and then its head moved with content byte-identical to before. Every
combination of the two clauses appeared on one artifact within an hour: the
state moved without the head, and the head moved without the content.

---

## Rule 0b — the predicate is not the defence, the print is

One question — *is this check still running?* — four predicates in one
evening, **each fix becoming the next defect**:

| # | Belief | Why it broke |
|---|---|---|
| 1 | the conclusion field is `null` while running | it is an **empty string**, not null |
| 2 | so test the conclusion for empty | a **fallback operator** was used, and it is silently dead on an empty string — only `null`/undefined trigger it |
| 3 | so test the status field instead of the conclusion | the rollup is a **mixed-type collection**: one entry type carries `status`, another carries `state` and has **no `status` field at all**, so every entry of the second type read as permanently unsettled |
| 4 | so filter on the entry type first, then read the right field per type | *current best — and offered as current best, not as safe* |

**All four produced a confident number and no error.** None threw. None
logged. Each one was a plausible reading of a real API.

Variant 3 hung a wait forever on exactly the repositories where it mattered,
because a third-party deployment integration posts the second entry type
there and nowhere else.

**How every one of them was actually caught:** two readings printed beside
each other and disagreeing. Variant 3 was found broken **by the very rule
that had just recommended it** — a reviewer printed the raw state next to the
decision, and they did not agree.

The conclusion the fleet drew was not "we need a better predicate". It was:

> Where a predicate decides whether to **stop**, print the raw state
> alongside the decision — and only when the two readings come through
> different mechanisms, or they are one reading printed twice.

And the diagnosis of how variants 2, 3 and 4 happened at all: **people adopt
the predicate and drop the print.** A document that ships the predicate as
the rule ships the defect with it.

**Assume a fifth variant exists.** That assumption costs one printed line.

---

## Rule 1 — a gate must name an input that turns it red

**The unsatisfiable retention rule.** A hygiene script's stale-checkout rule
required a checkout untouched for **14 days** on a host with **eight**
constantly-used slots. It could never fire. The rule had been green for its
whole life, measuring nothing.

Worse: the same class had **already been diagnosed** in that codebase's own
provenance notes — "retention expressed as a function of burn rate is not
retention", with a companion note that a particular age filter "can never
bite, at any cadence" because the cache is regenerated inside the window. The
lesson was written down and then repeated, which means it was never enforced
anywhere. It lived in a document nobody greps before writing a retention rule.

**Derived rule:** make a reap/prune/retention predicate a function of
**state**, not elapsed time. The remedy that worked: every age filter became a
space target (minimum free space, maximum used space).

**Also true at once:** "under-provisioned rather than under-cleaned" and "a
rule that never fires is a defect". Do not let the capacity argument be used
against the correctness fix.

---

## Rule 2 — the spare case, proven by mutation

**A workflow-injection scanner**, four mutations, each isolating one
dependency:

| mutation | what failed |
|---|---|
| broaden the key match to any key | all four spare cases, plus 16 real lines |
| treat an empty-rest key as block-eligible | only the defaults case |
| weaken block termination to zero indent | only the following-step case — **plus two real lines in a live file** |
| hardcode the reason classifier | only the quoted and commented cases |

Each mutation failed exactly its own case and nothing else, and the third
turned up a genuine surprise: that spare case guards a **live construct in the
repository**, not a hypothetical one.

**The cost behind the destructive half:** **1,212 lines** of never-committed
source were recovered from working copies that a bulk cleanup would have
deleted. The reap half of that predicate worked perfectly.

---

## Rule 3 — an absence needs the size of the space searched

**The counted negative.** A recursive scan that skips dotted directories by
default reports a clean tree while never having looked at the directories
holding the configuration. Fixed by forcing hidden entries into the walk and
stating the file count with the result.

**The zero versus the silence.** A summary line reading "no findings" was
produced by a loop whose instrument had died three items in. The surviving
falsifier: an emitted line proves the instrument was alive **for that item**.
"0 findings across 5 files" and "no output for 5 files" are opposite claims
that look identical once summarised.

**Four absences in one evening**, each read as a defect, each wrong: a session
read as silent (it was working and its artifact said so), a PR read as
unclaimed (it had an owner recorded in that lane's own heartbeat), a block
read as unresolved, a lane read as stalled. In every case the wrong artifact —
or none — had been read. The fix that worked was the positive requirement:
**name the artifact and quote what it showed.**

---

## Rule 4 — search-space cap versus result-set cap

**464 open issues, read as 100.** A person asked whether a defect had been
filed and was told nothing described it. The query capped at 100 in a
repository with **464 open issues** (confirmed twice independently, uncapped,
via a total-count query). The issue existed, had been filed that morning, and
described the problem exactly — including why it was blocked and which obvious
fix was wrong.

**Ten results, and a file that was there.** A session reported a script "not
verifiable from this checkout". Its listing capped at ten results, the file
fell outside, and the absence read as evidence. The file was present, 379
lines, byte-identical to the deployed copy.

**The filtered test run.** A filtered proof was green. The full unfiltered
project run found **two genuine failures** caused by the real content change,
on the version bump three lanes were waiting for.

**The deeper failure in all three is retrieval, not knowledge**: the system
held the answer and the asker did not get it.

---

## Rule 5 — exit code before output

**"(none listed)" at exit 143.** A sweep loop timed out mid-emission, having
already printed its per-item "(none listed)" lines. The output read as a clean
sweep. One item was missed entirely — a PR that mattered.

**The compound command that printed once.** Two items queried in one command;
the first printed, the second never did, and the run read as complete and
empty for both.

In **both** cases the harness stated the failure on its first line and the
reader went past it, because the emitted text was more legible and more
expected than the code above it.

**The pipe that ate the exit code.** A gate run through `tail` reported exit 0
while the gate itself had failed. Same shape on the other shell: a
`-First`-style filter replaces the native exit status.

**The hidden denial.** A read that silences its own permission error returns
empty. Three host reads were faked this way before anyone noticed the empty
was a denial and not a measurement.

---

## Rule 6 — a true measurement stated as a durable property

**The absorption test.** A merge-tree check returning the base's tree proves
merging would be a no-op **now**. Written up as "absorption is proven by
merge-tree", it became a permanent property — and a branch byte-identical to
its own squash commit reported as unique work once the base touched the same
files.

**The configured service.** An issue was closed on "the two required settings
are present on the serving revision". True, measured, and not durable: the
next revision deployed without them reopens the identical defect silently,
because the both-absent case is treated as an explicit unconfigured state and
logs at information level, not as an error. Reopened as a **gate** falsified
by removing one setting from a scratch revision.

**The gate-set claim.** "11 of 11 gates passed" proves what that gate set
*contains*. A PR still failed on a check that lived only in CI.

---

## Rule 7 — a count needs its noun and its set

Both halves inside one hour.

**Missing noun.** "5 in progress" was a count of **runs**. It was relayed
without its unit, read as five **lanes**, and became a published
fleet-wide concurrency cap. The cap's own instrument counted runs, so a single
run could spawn jobs indefinitely without moving the number the cap watched.
The cap was lifted after an investigation found the evidence that justified
its threshold came from a host that had run **zero jobs** in the measured
window — it had measured nothing — and that the correct instrument already
existed and was already going red per-job at the moment of actual exhaustion.

The author's own accounting, kept because it is the useful part: *"my cap was
a coarse proxy layered on top of a precise one that was already doing the job
correctly, and I built it because I misread that gate's red as a defect rather
than as the mechanism working."*

**Narrower scope.** A status line reading "0 in flight" had its noun and was
still wrong: measured across **8** repositories while the sentence implied the
full **14**-repository manifest. No noun rule catches this, because the noun
was correct.

**The coincidence.** Runs and lanes both read 7 that evening, because every
in-flight run happened to sit on a distinct branch. That coincidence could not
be used as evidence the distinction was academic — and it is what let a
relabelled number pass review.

**A true count of a set nobody wanted.** A merge total was reported as "45 PRs
across the eight repositories, all authors". The noun was right and the
arithmetic was right; the **set** was a two-day date range that swept in
unrelated work. The defensible figure was the fleet's own outcome log — and
even that moved during the run: **38** merges counted at 19:35Z (41 dated rows
minus 3 self-correction rows), **40** fleet lane PRs counted from the same
file later the same evening. Both are correct measurements of the same log at
different moments, which is precisely why a bare number is not a fact.

---

## Rule 8 — a correction is a claim

**The partial correction.** A security-headers finding was first listed as six
equal items. Three were real; three were not comparable at all. The corrected
finding had to say so explicitly rather than quietly shrink the count — a
correction that arrives *as* a correction stops the reader checking.

**The mitigation that exculpated its author.** A ledger entry claimed a
duplicate investigation "improved the original finding". False: the original
already held the evidence and root cause the rediscovery claimed credit for.
The mitigating claim was authored by the party whose retrieval miss it
softened.

**The router that manufactured corroboration.** A wrong issue number travelled
lane → router → planner → back to its own origin, arriving wearing two hops of
apparent independent corroboration it never had.

**The relay that sharpened.** "The concurrency cap" was relayed onward as "the
concurrency cap in your own workflows" after a grep found no such block — a
hold count dropped from three to two on an inference the source never made.

**The stale verdicts.** An audit of **15** posted approvals found **5**
invalidated by a moved head with no re-issue. All five were caught by the
reviewer re-running its own falsifier, not by anyone noticing the comment was
old.

---

## The asymmetry — two audits that looked identical and were not

Both sessions were asked the same question after a coordination failure:
*did you fail to notify anyone else?*

**Session A enumerated its own handoffs.** That is a set it owns completely —
every handoff it made is an artifact it wrote. It returned a **sound
negative**, naming seven items.

**Session B enumerated its own reported merges.** Superficially the same
move, and it is not: merges and unblocks are **different sets**, and the set
of waiters is precisely what no artifact records. It found one omission and
could say only *"one omission found, and I cannot bound the rest"* — a
different claim from a clean negative, and the honest one.

**The general form:** this is the noun-and-scope rule arriving at an **audit**
instead of a count. The noun was right; the set was not the set the question
was about.

**Why it matters more than either audit alone:** the easy move was available
and obvious — enumerate the merges, report all told, close the item — and a
clean result would have been **unfalsifiable**. Nobody could have checked it,
including its author.

> A practice is only worth teaching where the confident version could never
> have been checked.

**And that is what decides where to spend.** "The merger tells the unblocked
lane" leaves no trace and cannot be audited afterwards, including by the
merger. "Every waiting lane measures its own blocker" is self-verifying by
construction: the check either ran or it did not, and the next heartbeat says
which. Ship both; if only one survives, it is the waiter's.

The cost of shipping only the unauditable half, measured: a lane sat blocked
for **two hours** after its blocker had landed.

---

## The handover case

A handover report is the one artifact with **no reader who can re-check it
against a live head**. A PR body has its PR; a verdict has its SHA; a
heartbeat has its branch; a handover has nothing but its own text.

One decision sheet was full of unstamped state claims — a file count, a
runtime-file count, "three required checks passing", "fifteen entries all
completed". Every one was true when measured, and every branch had since
moved.

Caught concretely: a lane's own report said "three open, all green", and one
branch had moved under it **as it wrote** — to a commit it had never pushed.
It was caught only because a worktree listing showed an unrecognised commit
and the lane investigated rather than assuming it was its own. The lane's own
sentence is the rule: *"the verification was true and is now historical, and
nothing in it said which."*

---

## The honest cost

A real fraction of that run went into correcting claims rather than shipping,
and the two are not separable — several corrections prevented a bad merge
outright. One PR was held on a false green and merged an hour later on a real
one, unblocking two lanes that had been told to wait. The concurrency cap is
the same shape at fleet scale: an evening spent building and defending a
control for a problem that was never correctly measured, while the instrument
that would have settled it sat already running and already correct.

**Correction is not overhead subtracted from delivery. In both cases it is
what delivery depended on.**

One cost worth naming rather than hiding: the comms router switched mid-run to
relaying source words **verbatim** rather than paraphrasing, because verbatim
relay preserves hedges by construction that a paraphrase silently drops. The
price is message volume — longer relays, more of them. Anyone deciding whether
to run this arrangement should see both halves of that trade.
