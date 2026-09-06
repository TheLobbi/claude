# The run directory

One directory per run, at `logRoot` from `fleet.config.json`. **Machine-local,
never committed** — it holds session names, live state, and a running record
of who was wrong about what.

```
<logRoot>/
  PROTOCOL.md            the contract, as this run amended it
  RACI.md                who is R/A/C/I for each activity
  registry.md            lane -> session name (append-only)
  queue.md               ranked backlog + assignments + numbered amendments
  acks.md                every routed event
  escalations.md         one line per parked decision, with MEANWHILE
  reviews.md             one row per verdict
  outcomes.md            one row per merged or closed PR
  heartbeats/<lane>.md   one file per session, owned by that session
  briefs/<lane>.md       one file per role, written at assignment
  reports/<lane>.md      final report, written at standby
  reports/SUMMARY.md     the run's standalone record
  reports/DECISIONS.md   what only the human can decide
```

## Ownership

| File | Owner | Everyone else |
|---|---|---|
| `heartbeats/<lane>.md` | that lane | read only |
| `queue.md` | planner | read only |
| `reviews.md` | reviewer(s) | read only |
| `outcomes.md` | merge gate | read only |
| `registry.md`, `acks.md` | dispatch router | append a registry row if a send failed to resolve |
| `escalations.md` | append-only, anyone | never rewrite another's line |
| `briefs/`, `reports/` | the named role | read only |

**Nobody edits another session's file.** A correction to someone else's row is
a new row that cites the old one, never an edit — a rewritten log destroys the
one record of what was believed at the time.

## The append rule

These files are written by many sessions concurrently. Use an append that
tolerates another process holding the file open:

- PowerShell: `[IO.File]::Open($p,'Append','Write','ReadWrite')`, or
  `Add-Content`.
- POSIX `>>` and `tail` **can block until the tool timeout** against a file
  another session has open on Windows shares. See `docs/platform-notes.md`.
- `fleet hb` is the one writer: shared-read/write open, LF terminator,
  validated on write, printed on every branch, **read back before success**.
  Use it rather than a hand append whenever Node is present — and Node is
  present wherever Claude Code runs.

## What each log is for

**`registry.md`** — the address book. Append-only because a session's name is
its sidebar title and a human can rename it mid-run; the last row wins, and
the history tells you what an old message was addressed to.

**`queue.md`** — the ranked backlog, the assignments, and **numbered
amendments**: every ranking, ruling, correction and new rule, in order. This
is the file that makes a run reconstructable. An amendment number is how a
later reader tells a rule that was in force at 04:00 from one adopted at
19:00.

**`acks.md`** — the routed event log. One row per event: `<UTC> | <lane> |
<event> | <detail>`.

**`escalations.md`** — one line per parked decision, each carrying its
MEANWHILE: what proceeds while the decision waits. An escalation with no
MEANWHILE parked a lane, which is the failure this format exists to prevent.

**`reviews.md`** — one row per verdict, scoped to a head SHA.

**`outcomes.md`** — one row per merge, with SHA and verifier. This is the file
outcome counts are measured from, not derived from memory.

**`reports/SUMMARY.md`** — written for a reader who was not here. It is the
one artifact with **no reader who can re-check it against a live head**: a PR
body has its PR, a verdict has its SHA, a heartbeat has its branch, and this
has nothing but its own text. So every state claim in it carries the moment
it was measured and, where one exists, the head it was measured at. Anything
without one is an instruction to re-check, not a settled fact.
