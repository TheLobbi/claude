# Merge discipline

The merge gate is the one place where a wrong claim reaches customers. These
steps exist because each was skipped once.

## The gate, in order

1. **Receive an approval scoped to a SHA.** `APPROVE <repo> #<n> head <sha>`.
   A verdict with no SHA is not a verdict; it names no tree.

2. **Read the head fresh.** Query the forge for the PR's current head SHA.
   Compare it to the SHA in the approval. If they differ, the verdict is
   **stale** — send it back, do not merge.

   *Incident:* twice in one day a locally-known SHA disagreed with the
   remote. The verdict, the merge and the final check-read are all scoped to
   that SHA, so a stale one silently scopes all three to a tree nobody read.

   *Scale:* an audit of 15 posted approvals found **5 invalidated by a moved
   head with no re-issue**. All five were caught by re-running the falsifier,
   not by anyone noticing the comment was old.

3. **Structural readiness.** Whatever gate you run for mergeability,
   base-tip absorption, and local worktree cleanliness — run it, capture the
   **exit code from the shell**, never through a pipe.

   *Trap:* a pipe to `tail`, `head` or `Select-Object -First` replaces the
   command's exit code with the filter's. The gate reports 0 while having
   failed.

   *Scope:* a structural verdict proves **structure**. It reads no check
   conclusions unless it says it does. Never let "READY" stand in for CI.

4. **Re-read the checks as the literal last action before the merge
   command.** Unfiltered. In the same message as the merge. Never reuse a
   result from earlier in the same turn.

   *Incident:* a merge went through with two checks still queued. A
   **filtered** query returned empty while the unfiltered list in the same
   message showed both pending. "Not pending" is not "passing" — a check gate
   enumerates the ALLOWED states, never the blocked ones.

   *Corollary:* rollup views show only the **latest** run per check. A job on
   an earlier attempt is invisible to a rollup reader and visible to a log
   reader, and the two reach opposite wrong conclusions from different sets.

   **Print the raw check list beside your verdict, obtained a different way,
   and read both.** A predicate over check state is not the defence here —
   the print is. One fleet's "is this still running" predicate went through
   four variants in one evening, each fix becoming the next defect, and every
   one produced a confident number and no error:

   - the field is `null` while running — no, it is an **empty string**;
   - so a fallback operator was added, **silently dead** on an empty string;
   - and the rollup is a **mixed-type collection**: one type carries a status
     field, another type does not carry it at all, so the corrected test
     marked every item of the second type as permanently unsettled — on
     exactly the repositories where a third-party integration posts that
     second type.

   Current best form for a GitHub rollup, offered as the current best and
   **not as the defence**: filter on the entry's type before reading its
   fields — read a check run through its status, and a status context through
   its own state field. Assume a fifth variant exists that nobody has found.
   Every one of the four was caught by two readings printed side by side and
   disagreeing.

5. **Stop on any contradiction between two reads.** Two instruments
   disagreeing is a finding, not noise to average out.

   *Both clauses of the head rule are load-bearing:* a moved head invalidates
   a verdict, **and an unmoved head does not preserve one**. The check state
   can move underneath a fixed SHA. One PR read "8 passed, 2 failed" and later
   "15 completed, 10 success" at the same SHA, then moved its head with
   content byte-identical. Re-read the state; never infer it from the SHA.

6. **Ask what the PR sits on, not only what it changed.** A carry-forward
   verdict that compares blobs answers the content question and silently
   declines the build question. A base absorb can move a version pin directly
   underneath files the PR touched, and nothing in the PR's own diff shows it.
   Three members, none visible in that diff: the CI definition changed, a
   dependency changed, a second ref moved.

   *Where it does not bite:* a change whose whole span compiles against and
   pins nothing — shell scripts, workflow YAML, documentation. Re-checking
   those is ceremony, and a rule applied everywhere is a rule nobody keeps.

7. **Merge**, pinning the head you verified (`--match-head-commit <sha>` or
   the equivalent). A squash merge makes a **new** SHA, so the merge commit
   legitimately carries no checks; the verdict lives on the PR head, and "the
   merge commit has no checks" is never itself evidence of a gap.

8. **Verify each linked issue actually closed.** Close stragglers with a
   one-line comment naming the merge SHA.

9. **Record the outcome**: `<UTC> | <lane> | <repo> | #<n> | merged <sha> |
   <verifier>`. Notify the lane to remove its worktree, and the router.

10. **Re-run branch↔PR coverage after every squash-and-delete.** The delete
    races an in-flight push and can leave a recreated branch with no PR.

## When absorption is in question

**Do not test absorption with a merge trial.** A merge trial returning the
base tree proves merging would be a **no-op now** — a point-in-time
measurement, not a durable property. Once the base rewrites the branch's
files, a branch byte-identical to its own squash commit reports as a
conflict, and a genuinely absorbed branch reads as unique work.

**Ancestry alone is also wrong** in a squash-merge fleet: a squashed branch
commit is never an ancestor of the squashed base, however absorbed.

Two conditions, both required:

```
git diff --quiet origin/<branch> <squash-sha>          # content identical
git merge-base --is-ancestor <squash-sha> origin/<base> # and that squash is in the base
```

Take `<squash-sha>` from the PR's own merge-commit field **via the API**,
never grepped from a commit subject line.

The content half alone is insufficient: a branch merged into a *different*
base passes it, and so does one whose merge was later reverted. The ancestry
half is what ties the identical content to *this* base's current history.

## Under a shared identity

Approval badges are unavailable — the fleet's own credential authored the PR.
Verdicts are **PR comments**, scoped to a head SHA, naming the falsifier and
the set. The merge gate reads the comment.

Route mechanical changes to a **peer lane**, never to the lane that wrote the
branch. Read authorship from the branch to find out who wrote it; the PR's
author field says only that it is the fleet's.
