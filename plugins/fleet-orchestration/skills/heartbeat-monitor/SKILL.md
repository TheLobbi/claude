---
name: heartbeat-monitor
description: Detect and replace a hung session in a multi-session fleet without killing a working one. Use when a lane looks silent, stalled, unresponsive or hung, when deciding whether to replace or ping a session, when taking a fleet census, or when a heartbeat file has gone stale. Enforces the hard-won rule that message-absence is not work-absence - read the lane's own artifact (heartbeat file, branch, open PR, worktree) and quote what it showed before calling anything silent - plus the staleness thresholds, the three silence classes and their different remedies, and the replacement handover that lets a successor resume rather than restart.
---

# Heartbeat monitor

Two failures to avoid, and they pull in opposite directions:

- **Leaving a hung session in place**, so its queue drains into nothing.
- **Replacing a working session**, so its in-flight work is duplicated, its
  branch acquires a second writer, and the fleet learns a false lesson about
  its own reliability.

The second is the more common and the more expensive. This skill is written
to prevent it.

## The rule that costs the most to relearn

> **Message-absence is not work-absence. Read the lane's ARTIFACT before you
> call it silent.**

A session that is not replying is not necessarily a session that is not
working. It may be:

- mid-turn on a long command,
- blocked on a foreground call that cannot be interrupted,
- in `standby` exactly as the protocol instructs, waiting to be woken,
- working normally, with a router that dropped the message.

In one evening, **four** absences were read as defects — a session silent, a
PR unclaimed, a block unresolved, a lane stalled — and **four** times the
thing was moving, and the wrong artifact, or none, had actually been read.

**The positive requirement, not another caution:** name the artifact you read
and quote what it showed. "Lane X is silent" is not a finding.
"`heartbeats/lane-x.md` last line at 11:16Z, state `working`, task #123; PR
#456 head moved at 11:41Z" is.

## The failure this monitor cannot see

Be honest about the boundary. In one evening three lanes sat waiting on work
that was **already done** — roughly 2 hours, 68 minutes, and **566 minutes**.
**Not one was detected by any monitor**, including this one. Nothing was
stale; the heartbeats were correct and current the whole time. One lane spent
nine and a half hours on the words "a message resumes me."

A monitor watches for **silence**. It cannot see a lane that is talking
normally about a thing that stopped being true. The only mechanism that
caught all three was the lane **measuring its own blocker** — see the
`evidence-rules` skill's coordination medium. So the monitor's job ends
sooner than it looks, and a fleet that leans on it alone will lose hours it
never sees.

## The census, in order

Run this before every replacement decision, and on demand for a status
report. `/fleet-orchestration:fleet-census` automates it.

1. **Heartbeat file.** Last line, its UTC, its state, its task, for **every**
   lane in the registry — not only the suspicious ones. State the set you
   read (`n` of `n` lanes) so the census is a measurement rather than a
   sample.
2. **Age.** `now - last heartbeat`, per lane.
3. **The artifact, for anything past the threshold.** In this order, stopping
   at the first that shows movement:
   - the lane's branch head on the remote (moved since the last heartbeat?),
   - its open PRs (opened, updated, or new comments since?),
   - its worktree (new commits? uncommitted work?),
   - its report file, if it has written one.
4. **Classify** (below), then act.

**Never poll `ListAgents` in a loop.** It burns turns and proves nothing about
whether a session is working. Read files and forge state instead.

## The three silence classes

| Class | Signature | Remedy |
|---|---|---|
| **STANDBY** | last state is `standby` | Nothing is wrong. Send work; it wakes. |
| **BLOCKED-BY-DESIGN** | last state is `waiting`, note says a long call is in flight | Wait. Re-read at the next cycle. Replacing it duplicates the call. |
| **HUNG** | past `staleMinutes`, state not `standby`, **and** no artifact movement | Ping once, then replace. |

A lane that is past the threshold **but whose artifact moved** is not hung. It
is a lane with a heartbeat discipline problem, which is a message, not a
replacement.

## The line has a schema, and a gate

`${CLAUDE_PLUGIN_ROOT}/scripts/validate-heartbeat.mjs`

Run it against the run's heartbeat directory. `--self-test` proves the gate
can go red on six named inputs and green on six real ones, with two mutations
each breaking exactly the case that depends on it.

**Why a convention was not enough.** In one evening, three sessions produced
three different malformations of this one format: literal `\n` escapes
instead of newlines; a bullet with no pipes, so `state` parsed empty; and a
**leading pipe**, copied from a markdown table elsewhere in the same run,
which shifts every field by one — so the parser read the *timestamp* as the
*state*. **The tombstone written to stop the monitor counting a dead session
made the monitor announce it as alive.**

Three sessions, three malformations, one format: that makes it the **format's
defect**, not three people's carelessness. And it is a gate that could not go
red in the most literal sense — a malformed line does not fail, it produces a
*plausible* state and the monitor reports it confidently.

**Where this gate does not bite:** a bullet with no timestamp and no pipes is
indistinguishable from the prose these files legitimately contain, and no
line-level rule catches it without rejecting every handover note. It is
caught one level up: no valid heartbeat for that cycle is a stale heartbeat.

**Parseability is not validity, and that is the argument for this gate.**
The monitor's own parser asks one thing — does field 2 exist and is it
non-empty. By that test all 22 files parsed cleanly. This gate asks a
different question: timestamp format, state vocabulary, escapes, leading
pipes. It found **46 malformations that all parse**. Both answers are true
and they answer different questions, and the gap between them is exactly what
a validator exists to close: a line that parses into a *plausible* state is
the failure mode, not a line that fails to parse.

**And a note on this gate's own history**, because it is the plugin's rules
applied to the plugin: its first spare set was entirely synthetic. It passed
its own self-test and then, on first contact with 22 live files, rejected 79
correct heartbeats whose *notes* contained a `|`, and 376 lines of ordinary
prose. Its second version still demanded four fields, when 327 of 328
three-field lines were correct heartbeats with the note omitted. **A spare
set that has never met production data is the vacuous-spare failure** — and
it took real data, not review, to find it both times.

The 500-versus-46 disagreement between the two instruments was resolved by
**stopping and investigating** rather than by publishing the alarming number,
which was the one that would have made a finding.

## Thresholds

From `fleet.config.json`:

- `heartbeat.intervalMinutes` (default **15**) — how often an active session
  must append.
- `heartbeat.staleMinutes` (default **25**) — past this, an active session is
  a replacement *candidate*, having failed step 3.

Both are per-fleet. A fleet whose typical task is longer than the interval
should raise the interval rather than teach its sessions to ignore it — a
threshold everyone breaches is a gate that cannot go red.

## Ping before replace

Send exactly one message: `heartbeat now`. Record the time you sent it.

If the heartbeat file does not change within one cycle, and the artifact check
still shows no movement, the lane is hung. Two independent silences, one of
them to a direct address, is the evidence standard.

## Replacement

1. **Rule it hung in writing**, with the evidence: the last heartbeat line
   verbatim, its age, the artifact checks you ran and what each returned, and
   the time of the unanswered ping. This is a claim; it carries its falsifier
   like any other.
2. **Never touch the predecessor's worktree or branch** until you know it is
   not still writing. The successor continues *in* that worktree — one writer
   per branch — it does not create a second one.
3. **The successor inherits the heartbeat file.** The predecessor's last
   state is the handover. Read it and resume; do not restart.
4. **Write the successor's brief from the predecessor's state**, not from the
   original brief: what was delivered, what is in flight, which branch and
   worktree, which PR is awaiting review, what the last ruling was.
5. **Append a registry row** for the successor. The old row stays — it is how
   a later reader understands an old message's address.
6. **Name the successor distinctly** (`<lane>-2`, `<lane>-3`). Reusing the
   name makes the registry ambiguous and makes two sessions answer to one
   address.
7. **Announce the replacement** through the router, so nobody sends work to
   the address that stopped answering.

## Two facts that make replacement records unreliable, and their fix

**A repurposed session is not a new lane.** When a session finishes its role
and takes another, the registry has a new row with the same session id. A
census that counts rows counts it twice. Match on the session id, and record
repurposing explicitly.

**Timestamps in the record can disagree.** In one run, a replacement's
registry row predates the ruling that its predecessor was hung. Do not smooth
that over in a report — quote the record as it stands and say it is
inconsistent. A tidied record is worse than a contradictory one, because the
contradiction is the only signal that something was mis-recorded.

## Under a shared identity

If every session authenticates as one account, **ownership is not derivable**
from git or forge state. A census cannot ask "whose branch is this?" and get
an answer.

- A **self-report census has a hole exactly at collisions**: when two lanes
  claimed one item and one reverted with zero commits, the loser has nothing
  to point at.
- Build a census from the repository's **own uncapped enumeration** of
  branches and PRs, cross-referenced against the assignment record written at
  assignment time — never from an acknowledgement log, which records what was
  said rather than what exists.

See `references/replacement-policy.md` for the ruling template, and the
`evidence-rules` skill for why a capped enumeration would break this.
