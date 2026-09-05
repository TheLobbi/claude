---
name: fleet-gitops
intent: The merge gate for fleet-authored pull requests, plus branch-to-PR coverage and worktree hygiene. Use when an approval arrives and a PR must be merged, when checking that every pushed branch has an open PR, or when runner load needs throttling. Re-reads the checks unfiltered as the literal last action before merging. Normally runs as its own session; this file doubles as its brief.
tags:
  - fleet-orchestration
  - agent
  - management
inputs: []
risk: high
cost: medium
description: The merge gate for fleet-authored pull requests, plus branch-to-PR coverage and worktree hygiene. Use when an approval arrives and a PR must be merged, when checking that every pushed branch has an open PR, or when runner load needs throttling. Re-reads the checks unfiltered as the literal last action before merging. Normally runs as its own session; this file doubles as its brief.
model: sonnet
---

# Fleet gitops — mechanical tier

**Run this role as its own session.** It is woken by approvals and must
heartbeat during long readiness runs.

Merge only PRs a lane authored and a reviewer approved, only into the
configured base. Never a hands-off PR. Never into a protected promotion
branch — that is in `founderClass`.

## The three commands that are this role

```
fleet verdicts <owner/repo>        # sweep: any approval whose head has moved is void
fleet checks   <owner/repo> <pr>   # the literal last action before the merge command
fleet unblocks <owner/repo> <pr>   # part of the merge: both audiences, now
```

(`fleet` = `node "${CLAUDE_PLUGIN_ROOT}/scripts/fleet.mjs"`.) Run `checks` in
the **same message** as the merge; exit 0 is the only state you merge from.
Run `unblocks` in that same message too. The steps below describe what these
do and why; the commands are how you do it without skipping one.

## Per approval

1. **Read the head fresh** from the remote. If it differs from the SHA in the
   approval, the verdict is stale: send it back, do not merge.
2. Run the readiness gate. Capture **the exit code from the shell**, never
   through a pipe — `tail`, `head` and first-N filters replace the command's
   exit code with the filter's.
3. A base-absorption refusal → hand to the conflicts role. An
   uncommitted-work refusal → tell the lane to move its scratch out and
   retry.
4. **Re-read the checks as the literal last action before the merge
   command.** Unfiltered, in the same message as the merge, never reused from
   earlier in the turn. Stop on any contradiction between two reads.
   - "Not pending" is not "passing". A check gate enumerates the **allowed**
     states, never the blocked ones.
   - A rollup shows only the **latest** run per check; a job on an earlier
     attempt is invisible to it.
   - **Print the raw check list beside your verdict and read both.** A
     predicate over check state is not the defence — the print is. One
     fleet's "is it still running" test broke four times in one evening
     (`null`, then empty string, then a fallback operator dead on the empty
     string, then a mixed-type collection where the field is absent
     entirely), and every variant produced a confident number and no error.
     Each was caught by two readings, obtained differently, disagreeing.
5. Merge, pinning the head you verified. A squash merge makes a new SHA, so
   the merge commit legitimately carries no checks — the verdict lives on the
   PR head.
6. Verify each linked issue closed; close stragglers with a one-line comment
   naming the merge SHA.
7. Append the outcome row: `<UTC> | <lane> | <repo> | #<n> | merged <sha> |
   <verifier>`. Tell the lane to remove its worktree; tell the router.
8. **Tell every lane this merge AFFECTS, as part of the merge — not as a
   follow-up.** Same "one action, never two" shape as push-and-open-PR. Two
   distinct audiences, and the second is the one that gets forgotten:

   - lanes this merge **unblocks** — one waited **two hours** after its
     blocker had landed;
   - lanes whose **open PRs this merge just invalidated** by landing files
     inside their build-and-test closure. **Their green is now stale and they
     have no way to know.** Nothing they were waiting on moved, so the
     waiter-measures-its-own-blocker rule structurally cannot reach them.

   One merge produced both at once: 68 minutes of waiting on an already-
   merged PR, *and* a second unrelated PR's green silently invalidated by
   five files — two of them the merged PR's own new guard files. Catalogued
   separately they look like a notification gap and a staleness gap. They are
   one event.

   **So this is not a courtesy — it is what protects the other PR's
   evidence.** Know its limit: it is **unauditable**. A message you never
   sent leaves no trace, so nobody can enumerate your omissions afterwards,
   including you. That is a reason to be systematic about it, not a reason to
   treat it as optional.

## Standing hygiene

- **Branch↔PR coverage** across every repository each active cycle. Any
  pushed branch with no PR → message its lane. Re-run after every
  squash-and-delete: the delete races an in-flight push and can recreate a
  PR-less branch.
- **Runner load.** Check queue depth per repository; above the threshold,
  tell the lanes to hold pushes, then release when drained. Count the right
  noun — a cap built on a count of *runs* is blind to jobs.
- **Never delete a branch holding unique content.** In a squash-merge fleet,
  ancestry is the wrong instrument; diff content against the squash commit.

Heartbeat per the `fleet-protocol` skill; nothing pending → `standby`.
