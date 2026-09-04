# Replacement policy — templates and edge cases

## The hung ruling

Post it to the run's escalation or queue log, and to the router. It is a
claim; it carries its evidence.

```
HUNG RULING — <lane>
last heartbeat : <verbatim last line>
age            : <minutes> (threshold <staleMinutes>)
artifact reads : branch <name> head <sha> last moved <UTC>
                 open PRs: <n> (<numbers>), last update <UTC>
                 worktree <path>: <clean|dirty>, HEAD <sha>
ping sent      : <UTC>, unanswered for <minutes>
set read       : <n> of <n> lanes in registry.md
verdict        : HUNG — replacing with <lane>-N
```

Every line of that block is falsifiable by a reader with the same access.
That is the point. A ruling that says only "lane X has been quiet" cannot be
checked and cannot be argued with, which is the same thing.

## The successor brief

Written from the predecessor's **state**, not from the original brief.

```
# Brief — <lane>-N   (model: <tier>)

Scope: <repo> only, base <base>. Read its own instruction files first.

You are the successor to <lane>, ruled hung at <UTC>. Its last state is in
heartbeats/<lane>.md — read it before anything else.

Inherited, verified at <UTC>:
- worktree <path>, branch <branch>, HEAD <sha>, <clean|dirty>
- PR #<n> open, head <sha>, review state <state>
- last ruling from the planner: <verbatim>

Do NOT create a second worktree for this branch. Continue in the one above.
Do NOT restart delivered work. <what was delivered, with links>

Next: <one line — the single next item>
```

## Edge cases

**The predecessor comes back.** It can happen: a stalled turn completes. The
first thing either session should do on discovering two writers is stop
pushing and say so. Rule: **the successor keeps the branch**, the predecessor
reverts its uncommitted work rather than contesting, and the ruling is
recorded. This exact case occurred once and was handled cleanly — and nothing
recorded it except a verbal ruling and two sessions' memories, which is why it
is written here.

**The lane is blocked, not hung.** A lane reporting `blocked` is working
correctly. Blocked is an input to the planner, never a reason to replace. Read
what it is blocked on and route that.

**The lane is in standby and the queue is not empty.** That is a routing
failure, not a session failure. Send it the item.

**Nothing proves another lane is idle on another machine.** Cross-session
visibility tooling is scoped to what it can actually see — this machine's
sessions, refs, PR state. It proves nothing about a session running elsewhere.
Treat "no other lane is live" as **unverified**, never as proven, and confirm
by asking the owning session before merging into a scope someone else may
hold.

**A worktree may be removed only when it is clean AND its HEAD is contained by
some remote branch.** Anything else is rescued onto a pushed branch first. Do
not bulk-delete lane working directories as scratch: **1,212 lines** of
never-committed source were recovered from one that a sweep would have taken.

## Cleanup after a run

A worktree never outlives its task. If a run leaves stale working directories
behind, that is a defect in the run, not a cleanup task for later — one
cleanup found **20** stale worktrees in one repository and **86** in another.
Each removal follows the clean-and-contained rule above, individually.
