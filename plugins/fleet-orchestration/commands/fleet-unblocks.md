---
name: fleet-orchestration:fleet-unblocks
intent: After a merge, name both audiences it affects - lanes it unblocks and open PRs whose green it just invalidated - so the notification happens as part of the merge
tags:
  - fleet-orchestration
  - command
  - merge-gate
inputs:
  - repo
  - pr
risk: low
cost: low
description: After a merge, name both audiences it affects - lanes it unblocks and open PRs whose green it just invalidated - so the notification happens as part of the merge
model: haiku
allowed-tools: Read, Bash
---

# Unblocks

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/fleet.mjs" unblocks $ARGUMENTS
```

Run this **as part of every merge**, in the same message as the merge command.
It prints two audiences:

**Audience 1 — open PRs whose files this merge touched.** Their green is now
stale and **they have no way to know**: nothing they were waiting on moved.
Only the merger can reach them. One merge in the source run left a lane
waiting 68 minutes *and* silently invalidated an unrelated PR's green by
landing five files in its test closure — two problems that were one event.

**Audience 2 — lanes whose heartbeats say they are waiting on this PR.**
Read from the run directory. Tell each one now.

## What it cannot see

File overlap is the detectable case. A **dependency** change or a **CI
definition** change under an unchanged branch is not visible in any file
list — for those, ask what each open PR *sits on*. The output says so rather
than implying completeness.

## The asymmetry, stated so it is not argued away

This half of the pair is **unauditable**: a message you never sent leaves no
trace, so nobody — including you — can enumerate your omissions afterwards.
That is a reason to make it mechanical, not a reason to skip it. The other
half, `fleet blockers`, is self-verifying and covers blockers a lane *knows*
about. This covers the ones it cannot know about. Neither is optional.
