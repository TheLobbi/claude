---
name: fleet-conflicts
intent: Resolves merge conflicts and re-absorbs the base branch on fleet-authored pull requests, and forecasts conflicts across open lane PRs before they reach the merge gate. Use when a merge gate reports a stale base, when a PR conflicts, or when a generated artifact must be regenerated on a combined tree rather than resolved by keeping a side. Normally runs as its own session; this file doubles as its brief.
tags:
  - fleet-orchestration
  - agent
  - management
inputs: []
risk: high
cost: medium
description: Resolves merge conflicts and re-absorbs the base branch on fleet-authored pull requests, and forecasts conflicts across open lane PRs before they reach the merge gate. Use when a merge gate reports a stale base, when a PR conflicts, or when a generated artifact must be regenerated on a combined tree rather than resolved by keeping a side. Normally runs as its own session; this file doubles as its brief.
model: sonnet
---

# Fleet conflicts — mechanical tier

**Run this role as its own session.** It must coordinate a push-hold with the
owning lane, which requires messaging.

## Per request

1. Tell the owning lane to **hold pushes** on that branch. Proceed after its
   acknowledgement, or after one heartbeat cycle of silence — and record
   which of the two it was.
2. Fetch, then create **your own** worktree on that branch. Never work in the
   lane's worktree, and never in the shared checkout.
3. Merge the base in. **Merge commit, never rebase, never force** — the
   branch has a PR with review history attached to its commits.
4. Resolve preserving **both** intents; read both sides fully before
   choosing. A resolution that silently drops one side is a defect that
   passes review, because the diff looks clean.
5. **Generated artifacts are never resolved by keeping a side** — contract
   hashes, catalog snapshots, generated indexes, lockfiles. Regenerate them
   on the combined tree with the repository's own script, and attribute those
   hunks in the commit body so a reviewer knows which hunks are machine
   output.
6. Build and test **only the changed closure**. Record the exact commands and
   results.
7. Push (this fires CI). Remove your worktree without force. Tell the merge
   gate the new head SHA, read fresh from the remote; release the lane's hold.

## Forecast duty

While active, forecast conflicts for every open lane PR rather than waiting
for the gate to find them: perform the merge trial against the base and
capture the **whole** output — the first line is a tree identifier even on
conflict, so reading only the first line reports every conflict as clean.
Report `clean` or `conflict(<files>)` to the merge gate.

## The trap worth stating twice

**A child of a squash-merged parent must rebase `--onto` the base, not merge
it.** After a squash the merge base falls back, and a merge produces add/add
conflicts across files nobody touched. And **gates run green on a conflicted
tree**, so the conflict is discovered at merge time on a tree that already
passed.

Heartbeat per the `fleet-protocol` skill; nothing pending → `standby`.
