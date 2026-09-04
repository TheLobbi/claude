---
name: fleet-protocol
description: The contract every session in a multi-session Claude Code fleet reads first. Use when starting, joining, or running a fleet of parallel sessions on one codebase - heartbeats and standby, addressing other sessions through a dispatch router, ASSERTED vs DELIVERED claim states, git discipline (one repo per lane, push-and-open-PR as one action, never rewrite shared history), and merge-readiness discipline (re-read the checks as the literal last action before a merge). Triggers on "start a fleet", "orchestration protocol", "lane", "heartbeat", "dispatch", "PR ready", "merge gate", "who owns this repo", or any question about how parallel sessions coordinate.
---

# Fleet protocol

The contract. A lane's brief says what it works on; this says how it behaves.
Everything fleet-specific — repo names, lane names, paths, bases, hands-off
sets — lives in `fleet.config.json` (see `references/configuration.md`). This
file names no repository.

**Session mode.** Each lane is its **own session**, not a subagent. A
foreground `Agent` call blocks the caller's turn: it cannot heartbeat and
cannot read messages until the call returns. Subagents are for bounded work
*inside* a lane's turn, never for a lane itself.

## 1. Registration and addressing

1. On start, resolve your own identity (`ListAgents` — its first line names
   this session) and append one row to the run's `registry.md`:
   `| <UTC> | <lane-name> | <session-name> |`. The session name is the
   sidebar title and changes when a human renames it; the registry is
   append-only, and the **last** row for a lane is its current address.
2. To message a role, read the last registry row for that lane and send to
   that name. If a send fails to resolve, run `ListAgents` **once**, match
   the row whose title fits the role, append a fresh registry row, retry
   once. A role with no registry row is not online — send to the dispatch
   router instead.
3. **Never poll.** Messages enqueue at the receiver and are processed on its
   next turn, so a message *wakes* an idle session. A polling loop over
   `ListAgents` burns turns and proves nothing.

**Route through the dispatch router.** All acks, reports, "PR ready"/"merged"
notices, blocked notices and escalations go to one comms role, which fans
out, collects acknowledgements, keeps the registry current, and sends the
orchestrator **digests, not a stream**. Nobody else messages tier 0 directly.

Two rules the router itself is bound by, both learned the hard way:

- **Relay verbatim; a relay that sharpens is a relay that falsifies.**
  Paraphrase silently drops hedges. Adding a location, number or name the
  source never supplied destroys the source's uncertainty while looking like
  comprehension.
- **Carry provenance across every hop** ("per `<lane>`, unverified"). A
  router multiplies confidence without adding evidence: a claim that travels
  lane → router → planner → back to its own origin arrives wearing two hops
  of apparent independent corroboration it never had.

## 2. Heartbeats and standby

You own exactly one file: `heartbeats/<your-lane-name>.md`. Append one line:

```
<UTC> | <state> | <task> | <note>
```

`state` ∈ `start` `working` `waiting` `blocked` `delivered` `standby`. The
note is optional; the other three fields are not, and no field may contain an
unescaped newline. **The line is not just a convention — validate it** with
`${CLAUDE_PLUGIN_ROOT}/scripts/validate-heartbeat.mjs`. Three sessions
produced three different malformations of this format in one evening, and one
of them — a leading `|`, copied from a table — shifted every field so a
tombstone for a dead session made the monitor report it **alive**.

Append at start, at every milestone, **before and after** any command
expected to run long, and at least every `heartbeat.intervalMinutes`
(default 15) while active.

- A heartbeat older than `heartbeat.staleMinutes` (default 25) whose state is
  not `standby` is treated as hung — see the `heartbeat-monitor` skill for
  what the monitor must read before acting on that.
- About to block on a foreground call? Heartbeat **first**:
  `waiting | <task> | foreground worker, expect silence`. The monitor reads
  it as intended rather than as a hang.
- **`waiting` and `standby` are different states, and only one has a
  counterparty.** `waiting | <specific next action> | <why>` is reserved for
  something genuinely pending on someone else, and it names what — so the
  monitor, and you, can check whether that thing is still pending.
  `standby | <next action when work arrives> |` is genuinely idle. Collapsing
  them makes a blocked lane and an idle lane identical in a census; a lane
  once sat blocked for **two hours** after its blocker had cleared.
- **Whatever you are waiting on, measure it yourself each heartbeat.** The
  merger telling you is the other half of that rule and it is unauditable —
  it leaves no trace, so nobody can verify it was sent, including the merger.
  Your own measurement leaves one.
- Idle with nothing queued: write `standby` and **end your turn**. A message
  wakes you. Standby is not death.
- Your predecessor (a replaced session of the same lane name) left its last
  state in that file. Resume from it; do not restart its work.

Appending: these files are written by many sessions at once. On Windows,
`[IO.File]::Open($p,'Append','Write','ReadWrite')` or `Add-Content`; POSIX
`>>` and `tail` against a file another session holds open can block until the
tool timeout. See `docs/platform-notes.md`.

## 3. ASSERTED vs DELIVERED

> Every statement a session makes is **ASSERTED** until a link promotes it to
> **DELIVERED**.

A promoting link is a PR URL, an issue number, a merge SHA, a re-run of the
exact command by a different agent, or a check state read at a named head.
Not promoting: "done", "implemented", "should be fine", a worker's report of
its own success, a plan, or an intention.

- A worker's "done" is a claim until a verifier re-runs the stated command.
- A count produced by a pattern match over a file is not a measurement of the
  thing counted.
- The claim state is recorded in the run's logs — the queue, the ack log and
  the review log each carry it — so a later reader can tell which claims were
  ever checked.

This is the single highest-value rule in the protocol. Everything in the
`evidence-rules` skill is a corollary of it.

## 4. Git discipline

Full text with the incident behind each rule: `references/git-discipline.md`.
The short form, all of it load-bearing:

1. **One repo per lane**, exclusive scope, from `fleet.config.json`. Never
   edit another lane's repo. Honour the configured hands-off repo list.
2. **Never switch a shared checkout's HEAD**, never commit in it, never stash
   it. Work in a per-task worktree. If a predecessor's worktree already holds
   your branch, continue **there** — one writer per branch.
3. **Push and open the PR in ONE action.** A pushed branch with no PR is a
   parking spot that hides work. Draft is the parking spot; a bare branch is
   not.
4. **Prove on the committed tree**, not the worktree: `git diff HEAD --stat`
   must be empty when the proof runs.
5. **Conventional commits**, with a `Co-Authored-By:` trailer naming the
   model. No authorship headers inside source files.
6. **Never** `--force`, `reset --hard`, `clean`, or `worktree remove --force`.
   Never delete a branch holding unique content. `--force-with-lease` is
   permitted only on a lane-owned branch and only in the form
   `--force-with-lease=<ref>:<sha>` with the SHA written out — a bare lease
   reads a remote-tracking ref that a background fetch may already have
   moved, which makes it a guard-shaped no-op.
7. **Fix root causes.** Never weaken, skip, quarantine or retry-loop a test to
   get green. A green test that enshrines the defect is a defect.
8. **No machine-absolute paths and no time estimates** in committed files.
   Sequence by dependency.
9. **Verify the issue's symptom before building.** Open state is not evidence
   the defect exists — and presence of the file, script or component is not
   presence of the defect. Absent → close the issue with the evidence.
10. **Do not act on a PR you merely discovered by scanning.** In a fleet
    sharing one credential, `author` cannot discriminate between lanes; it
    answers "is this ours", and the branch answers "which lane". Read
    authorship from the **branch**, never from the PR.

## 5. Review and merge-readiness discipline

**Review routing.** Mechanical changes — docs, templates, link fixes, and
anything whose correctness is decided by a gate the author already ran — go
to a **peer lane**, preferably one that has run the same gate. Management
review is reserved for product behaviour, security, permissions, gates
themselves, and anything on a release path. The peer reviewer is bound by
every rule that binds a management reviewer. Never route a lane to review its
own branch: self-approval wearing a peer's clothes.

**Every PR body states four things** — this is the shape that makes reviewer
attention go further, because the claims arrive already scoped:

| | |
|---|---|
| WHAT was verified | the claim |
| THE EXACT COMMAND or gate | so the claim is re-runnable |
| THE FALSIFIER | the input that would have turned it red |
| THE SET or COUNT | what the claim ranges over |

Plus: what was intentionally **not** run, and the rejected "fixes" that would
have hidden the problem rather than solved it.

**Before merging** (`references/merge-discipline.md` for the mechanics):

1. **Re-read the checks as the literal last action.** Run the *unfiltered*
   pending-check query immediately before the merge command. Never reuse a
   result from earlier in the same turn. Stop on any contradiction between
   two reads. Incident: a merge went through with two checks still queued
   because a filtered query returned empty while an unfiltered list in the
   same message showed both pending.
2. **A SHA handed to another session is read fresh** from the remote
   immediately before handing it on, never from the last local push. The
   verdict, the merge and the last look are all scoped to that SHA; a stale
   one silently scopes all three to a tree nobody read.
3. **A squash merge makes a new SHA**, so the merge commit legitimately
   carries no checks. The verdict lives on the PR head. "The merge commit has
   no checks" is never itself evidence of a gap.
4. **A structural readiness verdict is not CI.** Whatever your merge-gate
   tool reports about mergeability, absorption or worktree cleanliness, it
   read no check conclusions unless it says it did.

## 6. Escalation

Some decisions are not a session's to make: money, production, tenants, the
trust chain, repository or organisation settings, abandoning work. Configure
the list in `fleet.config.json` under `founderClass`.

- **An escalation parks a decision, never a lane.** Append one line to
  `escalations.md` — `<UTC> | <lane> | <decision needed> | MEANWHILE: <what
  proceeds>` — notify the dispatch router, and continue with the next task.
- Reaching the human means a **ready-to-merge PR with proofs**, not a
  question that parks the work.
- Never ask the human a blocking question mid-run.

## 7. Behaviour

- **Minimum verbosity** in every message and report: facts, numbers,
  `path:line`.
- **Delegate.** Spend your own turns on judgement, routing and verification.
  Bounded edits go to a mid-tier worker; verification to a cheap verifier.
  Every dispatch names its model — see the `fleet-roles` skill.
- **Spawn workers in the background** and heartbeat while they run.
- **Loop** until the planner says the queue is empty, then write
  `reports/<lane>.md` (PRs opened and merged, issues closed, blocked items,
  exact proofs) and finish with heartbeat `standby`.

## Run directory

One directory per run, machine-local, never committed. Layout, ownership and
the append rule: `references/run-directory.md`.

## References

| File | Contents |
|---|---|
| `references/configuration.md` | Every configurable name, and the config file shape |
| `references/git-discipline.md` | The full git rules with the incident behind each |
| `references/merge-discipline.md` | The merge gate, step by step |
| `references/run-directory.md` | Log files, who owns which, the append rule |
