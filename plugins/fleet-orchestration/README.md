# Fleet Orchestration

Run many Claude Code sessions on one codebase without them lying to each
other.

Not "run them in parallel" — that part is easy and mostly works. The hard part
is that a fleet of sessions generates claims faster than anyone can check
them, and a claim nobody checked is indistinguishable from a fact right up
until it reaches production. This plugin is the protocol, the evidence
discipline, and the monitoring that came out of a multi-repository run that
merged **38 pull requests across 7 of 8 repositories** in one continuous
stretch — counted from the run's own outcome log at 19:35Z, as 41 dated rows
minus 3 self-correction rows.

That sentence is the whole plugin in miniature. It names its noun (merges),
its set (7 of 8 repositories), its source (the outcome log), its moment
(19:35Z) and its derivation (41 minus 3). A later count of the same file the
same evening read **40 fleet lane PRs** — also correct, also of the same log,
at a different moment. Neither is "the number of merges". That is the point.

---

## The thing that convinced us to package it

While building this plugin, a fresh session ran the host repository's four
validators to establish a baseline before adding anything. Two exited 0. Two
exited **1** with `ERR_MODULE_NOT_FOUND` — the dev dependencies were not
installed.

It recorded them as **dead instruments, not as reds**, ran
`pnpm install --frozen-lockfile`, and only then used either as evidence.

That is rule 5's corollary — *a dead instrument is UNKNOWN, neither a red nor
a green* — applied by a session that had not been present for the fifteen
hours of incidents that produced the rule.

**The honest scope of that claim**, because the plugin's own rule 8 requires
it: that session had **read the written rules first** — it had not lived the
run, but it had the documentation. So this is evidence that the rules
transfer **through writing**, not that they are obvious. Which is exactly the
claim a plugin makes, and a weaker, truer version of the story than "it
figured it out from nothing".

---

## What it is

| Component | What it does |
|---|---|
| **`scripts/fleet.mjs`** | **The protocol as a tool.** Eleven subcommands, zero dependencies; every evidence rule that governs a ritual is built into the command for it, so it costs no turns and cannot be skipped |
| `fleet-protocol` skill | The contract: heartbeats, addressing through a dispatch router, ASSERTED vs DELIVERED, git discipline, merge-readiness discipline |
| `evidence-rules` skill | **One claim, ten sightings** — each with the incident that produced it **and the case where it does not apply** |
| `heartbeat-monitor` skill | Staleness detection, the three silence classes, and the replacement policy |
| `fleet-roles` skill | The role catalogue, the RACI, the descending-model rule, and where the velocity comes from |
| 10 agents | Seven management roles, a lane template, a worker, a verifier — each naming its model |
| 6 commands | `/fleet-start`, `/fleet-census`, `/fleet-blockers`, `/fleet-checks`, `/fleet-unblocks`, `/fleet-decisions` |
| `config/` | Every fleet-specific name, in one file, with a JSON Schema |

## Velocity — what the tooling buys, measured

Rules that cost turns slow a fleet down. The source run lost hours to
bookkeeping and to lanes waiting on work that was already finished. Each row
is a loss that was measured there, and the one-command form that removes it.
**Every command below was run against that run's live data before this
shipped**, and each reproduced the incident that motivated it.

| Ritual, by hand | Turns | One command | Proved on live data |
|---|---|---|---|
| "what am I waiting on, has it cleared?" — usually never asked | ∞ (566 min, 68 min, ~2 h idle) | `fleet blockers <lane>` | found **8 of 11** refs already cleared for the lane that idled 68 min on a merged PR; **10 of 16** for another |
| census: read 22 files, age each, classify, validate | 6–10 | `fleet census` | 22 of 22 lanes, classes, 63 malformed lines flagged, one command |
| merge-gate check read: fresh head, rollup by type, group by run, second reading | 5–6, one skipped once | `fleet checks <repo> <pr>` | 15 entries / 1 run / 5 skipped named; two readings agree; the double-run and mixed-type cases are in its self-test |
| stale-verdict sweep across open PRs | never done until it hurt | `fleet verdicts <repo>` | caught an APPROVE at `d126173c` stale against head `8f52ad96` |
| after a merge: who is unblocked, whose green just broke | never done — unauditable | `fleet unblocks <repo> <pr>` | found the lane whose heartbeat waited on the merged PR |
| CI load | counted runs, built a wrong cap | `fleet queue-depth <repo>` | 1 run, **14 jobs** |
| registry row + first heartbeat | 2, sometimes 1 | `fleet register <lane> <session>` | one action |
| heartbeat, format by memory | 1, malformed 3 ways in one evening | `fleet hb …` | refuses a malformed line |
| the router's digest | read 4 files, dedupe by hand | `fleet digest` | watermark-based |

Plus two defaults in the config that the source run learned at hour fifteen:
**two reviewers from the start** above four lanes, and **peer review for
mechanical changes** by file glob. Both are in `fleet-roles` → *Where the
velocity comes from*.

**Nothing in this plugin names a repository, a lane, a path, an organisation
or a person.** That is a maintained invariant, not an aspiration — see
`CLAUDE.md`.

## Install

```bash
/plugin marketplace add TheLobbi/claude
/plugin install fleet-orchestration@claude-orchestration
```

Then:

```bash
/fleet-orchestration:fleet-start my-run-id
```

It writes a config from your answers, creates the run directory, generates
one brief per role, and prints the exact text to paste into each session. It
does **not** open sessions — a human does that, because every lane is its own
session.

## The one claim, and its two media

Everything in `evidence-rules` is one idea seen in ten places:

> **A wrong predicate and a missing notification both produce a plausible,
> quiet, checkable-looking state. Neither raises an error. In both cases the
> only defence is a second reading through a different mechanism.**

**In tooling**, the second reading is the raw print through a *different
field*. **In coordination**, it is *measuring the thing you wait on* rather
than waiting for news of it. That collapses two things most fleets treat as
separate problems: coordination failures are not a second category beside
evidence failures, they are the same failure where the missing artifact is a
message rather than a field.

And one asymmetry decides where to spend if you can only afford one defence:
**you cannot enumerate the absences of messages you never wrote.** "The
merger tells the unblocked lane" is unauditable — nobody can verify it
afterwards, including the merger. "Every waiting lane measures its own
blocker" is self-verifying by construction. Ship both. If only one survives,
it is the waiter's.

**That is settled, three to zero.** In one evening three lanes sat waiting on
work that was already done — roughly 2 hours, 68 minutes, and **566
minutes**. **None was detected by any monitor. Every one was found by someone
measuring their own blocker.** Nothing was stale and nothing was malformed in
any of the three: the merges were correct, the heartbeats were correct and
current, and the schema validator this plugin ships would have passed every
one of those files.

**But the halves cover different sets, so neither is optional.** The waiter's
half catches what you *know* you await — and a lane cannot measure a blocker
it does not know it has. One merge produced two victims that look like
unrelated problems: 68 minutes of waiting on an already-merged PR, **and** a
second, unrelated PR's green silently invalidated by five files landing in
its build-and-test closure. Its owner had no reason to check anything;
nothing it was waiting on had moved. **Only the merger could have reached
it.** Notify-on-merge is not a courtesy — it is what protects the other PR's
evidence.

## The four ideas

**1. Heartbeat or be replaced — but read the artifact first.**
Every session appends `<UTC> | <state> | <task> | <note>` to its own file.
Stale past the threshold means hung. *But* message-absence is not
work-absence: before calling anything silent, read its branch, its PRs, its
worktree, and quote what they showed. Four times in one evening an absence
read as a defect, and four times the thing was moving.

**2. ASSERTED vs DELIVERED.**
Every statement is ASSERTED until a link — a PR URL, a merge SHA, a
verifier's re-run, a check state at a named head — promotes it. A worker's
"done" is a claim. An intention is not evidence. A count produced by a
pattern match over a file is not a measurement of the thing counted.

**3. Descending models.**
The orchestrator reasons, mid-tier executes, cheap models verify
mechanically. **Every spawned agent names its model** — not naming one is the
failure, because an unnamed dispatch inherits the caller's tier and a fleet
that never names models drifts to one tier and pays for it silently.

**4. A claim carries its falsifier and its set.**
Every PR body states what was verified, the exact command that proves it, the
input that would have turned it red, and the size of the set the claim ranges
over. This is not ceremony: reviewer attention is the scarce resource, and a
body in that shape removes the reconstruction a reviewer would otherwise do
from scratch — and makes a lazy review visibly lazy.

## Why the rules have exceptions written into them

Every rule in `evidence-rules` carries a **"does not bite"** clause. That is
deliberate, and it came from watching the rules get applied:

> A rule applied everywhere is a rule nobody keeps. Knowing where it does not
> bite is what makes it survivable.

The concrete case: a lane re-checked a PR whose base absorb had moved a
package version pin underneath the files it touched — and **declined** to
re-check a second PR whose entire span was shell, PowerShell and workflow
YAML, because that compiles against and pins nothing. The second decision is
what keeps the first one from becoming ritual.

---

## What it cost to learn

Each of these is a real cost, paid once, by somebody. They are the reason the
plugin exists rather than a document that says "be careful".

**A capped search told a human that no defect had been filed.** The query
capped at 100 in a repository with **464 open issues** (confirmed twice,
uncapped, via a total-count query). The issue existed, had been filed that
morning, and described the problem exactly — including which obvious fix was
wrong. A cap leaves exit 0 and a plausible result: it cannot be caught by
inspecting the output, only the invocation.

**Five of fifteen posted approvals were stale.** An audit against a moved head
found a third of standing verdicts invalid, none of them flagged. All five
were caught by the reviewer re-running its own falsifier, not by anyone
noticing the comment was old.

**A merge went through with two checks still queued.** A *filtered* query
returned empty while the unfiltered list in the same message showed both
pending. "Not pending" is not "passing" — a check gate enumerates the allowed
states, never the blocked ones.

**A retention rule that could never fire.** It required a resource untouched
for 14 days on a host with eight constantly-used slots. The same class had
already been diagnosed in that codebase's own notes — written down, never
gated, and repeated. A doc that records a defect class with no gate behind it
is the documentation version of a gate that cannot go red.

**1,212 lines of never-committed source**, recovered from a working directory
that a cleanup sweep would have deleted. The delete half of that predicate
worked perfectly; nobody had tested the spare half.

**An entire evening on a CI cap built from the wrong noun.** "5 in progress"
counted **runs**, was relayed without its unit, read as "five lanes", and
became a fleet-wide concurrency cap. The cap's own instrument counted runs,
so one run could spawn jobs indefinitely without moving the number it
watched. The evidence justifying its threshold came from a host that had run
zero jobs in the measured window. The correct instrument already existed and
was already going red, per job, at the moment of actual exhaustion. Its
author's accounting, kept verbatim because it is the useful part:

> *"my cap was a coarse proxy layered on top of a precise one that was
> already doing the job correctly, and I built it because I misread that
> gate's red as a defect rather than as the mechanism working."*

**One predicate, four variants, one evening — each fix becoming the next
defect.** The question was only "is this check still running". The field is
`null` while running — no, it is an **empty string**; so a fallback operator
was added, and it is **silently dead** on an empty string; so the test moved
to a different field, and the collection turned out to be **mixed-type**,
with one entry type not carrying that field at all — which marked every entry
of that type permanently unsettled, on exactly the repositories where a
third-party integration posts it. All four produced a confident number and no
error.

Every one was caught the same way: **two readings, obtained differently,
printed side by side and disagreeing.** The third was found broken *by the
rule that had just recommended it.* So the plugin ships the current best
predicate while saying plainly that **the predicate is not the defence — the
print is** — because the observed failure mode is that people adopt the
predicate and drop the print, and a document that ships the predicate as the
rule ships the defect with it.

**A lane went 60+ minutes silent** because it made a foreground subagent call.
A foreground call blocks the caller's turn: it cannot heartbeat and cannot
read messages until the call returns. The monitor read it as hung. This is
why every management and lane agent file in this plugin says, in its own
body, that it normally runs as **its own session**.

**A near-miss that came out clean, recorded as luck.** A PR was cleared on a
carry-forward check that compared blobs — answering the content question and
silently declining the build question — while its base absorb had moved a
major version pin directly beneath the files it touched. It merged; every
check passed; nothing broke. **The build question was answered after the
merge rather than before it.** It is recorded that way on purpose: an entry
with a real gap and a fine result is the version people believe, because
nobody can dismiss it as an unlucky day.

**A heartbeat convention with no gate, and three malformations in one
evening.** Literal `\n` escapes instead of newlines. A bullet with no pipes,
so the state parsed empty. And a **leading pipe**, copied from a markdown
table elsewhere in the same run, which shifted every field by one — so the
parser read the timestamp as the state. **The tombstone written to stop the
monitor counting a dead session made the monitor announce it as alive.**

Three sessions, three malformations, one under-specified format. That makes
it the format's defect, not three people's carelessness — and it is a gate
that could not go red in the most literal sense, because a malformed line
does not fail, it produces a plausible state. So this plugin ships
`scripts/validate-heartbeat.mjs`: **if the orchestration ships a convention,
it ships the gate that runs against it.** That is the difference between the
two things this run kept rediscovering — a rule with a gate, and a rule with
a reader.

### The part that is not a bug list

A real fraction of that run went into correcting claims rather than shipping,
and the two are not separable — several corrections prevented a bad merge
outright. One PR was held on a false green and merged an hour later on a real
one, unblocking two lanes that had been told to wait.

**Correction is not overhead subtracted from delivery. It is what delivery
depended on.**

### Two things observed while this plugin was being written

**The rules corrected the plugin's own gate, twice, and only real data could
do it.** `validate-heartbeat.mjs` was written with an invented set of valid
lines. It passed its own self-test — and then, run against 22 live heartbeat
files, rejected **79 correct heartbeats** whose notes legitimately contained
a `|`, plus **376 lines of ordinary prose**. Corrected, it still demanded
four fields, when **327 of 328** three-field lines were correct heartbeats
with the note omitted. Both times the failure was the one this plugin names:
a spare set that has never met production reads as coverage. The shipped
version's spare cases are shapes taken from real files, and it now finds
**46 genuine malformations across those 22 files**.

**The founding anecdote was sharpened three times, in the direction that
argued against the plugin.** "Applied a rule it had read" was relayed as
"applied a rule **unprompted**" — one word, and it inverts the case:
*unprompted* implies the rule is obvious, which implies writing it down is
unnecessary. The generalisation is now in the skill, and it is cheap enough
to actually use: **a sharpening never drifts randomly, it drifts toward the
more impressive claim** — so a relayed detail that flatters the work is the
first place to check, not the last.

**The predicted failure did not happen.** The one most expected after the
four-variant episode was that someone would take the corrected predicate and
drop the print. Instead a session adopted the **shape** — "print both raw
readings beside the decision for every future check-state read, not just swap
in the corrected filter." That is the claim this plugin makes, observed once,
under load.

**And a test worth stealing for any fan-out:** *a broadcast that produces only
acknowledgements has not been tested.* The one that carried these rules found
a real gap — a status entry that predated its own push, on a repository where
that entry type had never been read at all.

And one cost worth naming rather than hiding: the comms router switched
mid-run to relaying source words **verbatim** rather than paraphrasing,
because verbatim relay preserves hedges by construction that a paraphrase
silently drops. The price is message volume — longer relays, more of them.
Anyone deciding whether to run this arrangement should see both halves of
that trade, not only the accuracy gain.

---

## What this plugin does not do

- **It does not open sessions.** A human opens them; the plugin writes the
  briefs and prints the text.
- **It ships no active hooks.** A plugin hook is live the moment the plugin is
  enabled, and these rules are too opinionated to impose on every repository
  a user has. Copy-paste hooks, with their matcher semantics, are in
  `docs/optional-hooks.md`.
- **It does not merge or release anything by itself.** Everything in
  `founderClass` reaches a human as a ready-to-merge PR with proofs attached,
  never as a question that parks the work.
- **It does not promise the platform notes generalise.** `docs/platform-notes.md`
  is a host-specific instance list — Windows append locking, exit codes
  through pipes, dotted-directory walks. The protocol needs a concurrent
  append and a reliable exit code; how you get them is your host's business.

## Layout

```
fleet-orchestration/
├── .claude-plugin/plugin.json
├── CONTEXT_SUMMARY.md          bootstrap summary (budget-capped)
├── CLAUDE.md                   how to work on this plugin
├── agents/                     10 role definitions, each naming its model
├── commands/                   fleet-start · fleet-census · fleet-blockers · fleet-checks · fleet-unblocks · fleet-decisions
├── skills/
│   ├── fleet-protocol/         + 4 references
│   ├── evidence-rules/         + worked examples
│   ├── heartbeat-monitor/      + replacement policy
│   └── fleet-roles/
├── config/                     example config + JSON Schema
├── scripts/                    fleet.mjs (the CLI) · validate-heartbeat.mjs · heartbeat.ps1 · heartbeat.sh
└── docs/                       platform-notes · optional-hooks
```

## Licence

MIT.
