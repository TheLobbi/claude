---
name: fleet-orchestration:fleet-decisions
intent: Produce the founder decision sheet - every item only the human can decide, each with what it unblocks, what it costs, the exact action, and every state claim stamped with the moment it was measured
tags:
  - fleet-orchestration
  - command
  - reporting
inputs:
  - output-path
risk: low
cost: medium
description: Produce the founder decision sheet - every item only the human can decide, each with what it unblocks, what it costs, the exact action, and every state claim stamped with the moment it was measured
model: opus
allowed-tools: Read, Write, Glob, Grep, Bash
---

# The decision sheet

Output: `$ARGUMENTS` (default `<logRoot>/reports/DECISIONS.md`).

Load the `evidence-rules` skill first. This is the hardest document in the
system to write honestly, for one structural reason:

> **This sheet is the one artifact nobody can verify from context, so it must
> not ask its reader to.**

A PR body has its PR. A verdict has its SHA. A heartbeat has its branch. This
has nothing but its own text.

## 1. Gather

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/fleet.mjs" digest --dry-run
```

That lists every escalation row since the last digest — each already carries
its MEANWHILE — plus merges and lanes currently `blocked`. `--dry-run` leaves
the watermark alone so the router's next real digest is unaffected.

Then, from the forge, anything founder-class by the config's `founderClass`
list whether or not someone escalated it: promotions, releases, production
changes, tenants, spend, trust chain, organisation settings. For each
candidate PR run `fleet checks <repo> <pr>` and paste its verdict line — the
head, the two readings, the skipped lanes — rather than describing the state
in prose.

Enumerate **uncapped**. A missed item on this sheet is the failure mode.

## 2. Verify every claim yourself

Not "per the lane". Read the check states, the remote heads, the gate
outputs. A relayed claim is ASSERTED; this sheet publishes only what you
looked at, or says explicitly that it did not look.

## 3. Write one section per decision

Each section:

- **The decision, as a yes / no / click.** Not a discussion.
- **What it unblocks**, in plain words, from the point of view of whoever is
  affected. A promotion described by its commit count is not described. Say
  what changes for a customer.
- **What it costs**, including anything irreversible.
- **The exact next action**, with the command or the button.
- **The proofs**, each stamped: what was measured, when, and at which head.
- **The falsifier**: what would make this recommendation wrong.

## 4. The stamping rule, stated in the document itself

Open the sheet with a short paragraph telling the reader how to read its
numbers:

> File counts, commit counts and check results were measured while this was
> written and the branches keep moving. Treat any number here as *true when
> measured* rather than as current. Where it matters, the command to
> re-check it is given inline.

Then honour it: every state claim carries its moment, and where one exists,
the head it was measured at. Anything without one is an instruction to
re-check, not a settled fact.

## 5. Corrections, in the open

If this sheet withdraws something an earlier version recommended, say so in
the section it belongs to: what changed, and why the earlier version made
sense at the time. Never quietly drop a row. A **partial** correction is
harder to catch than the stale claim it replaces, because it arrives *as* a
correction and the reader stops checking.

Name what a check could not look at — "could not look" is not a failure and
is not a pass. And if a currently-red check would start genuinely passing
once someone creates a missing credential, say so: every instruction relying
on reading that red correctly becomes wrong the moment it exists.

## 6. Distinguish the two lists

- **Founder-gated** — named as such, not as a lane failing to act.
- **Lane-owned, in flight** — no action needed from the reader beyond what is
  already logged.

Readers who cannot tell these apart start doing the second list themselves.

## 7. Report back

Print the path, the count of decisions by class, and the count of claims you
personally re-verified versus relayed. That last number is the one that says
how much this sheet is worth.
