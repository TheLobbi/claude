---
name: fleet-orchestration:fleet-blockers
intent: Measure what a lane is waiting on and whether it has already cleared - the waiter's check that caught every idle-on-done-work case
tags:
  - fleet-orchestration
  - command
  - coordination
inputs:
  - lane-name
  - repo
risk: low
cost: low
description: Measure what a lane is waiting on and whether it has already cleared - the waiter's check that caught every idle-on-done-work case
model: haiku
allowed-tools: Read, Bash
---

# Blockers

Lane: `$ARGUMENTS`.

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/fleet.mjs" blockers $ARGUMENTS
```

Reads the lane's `waiting` and `blocked` heartbeats, extracts every `#123` and
`repo#123` they name, and asks the forge whether each is merged, closed, or
still open. Prints `CLEARED` / `PENDING` / `UNKNOWN` per ref with the moment
the lane started waiting, and exits 1 when anything has cleared.

## Why this exists

In one evening three lanes sat waiting on work that was already done — roughly
2 hours, 68 minutes, and **566 minutes**. None was detected by any monitor:
nothing was stale, nothing malformed, every heartbeat correct and current.
**Every one was found by someone measuring their own blocker.** This command
is that measurement, automated.

## When to run it

- **Every heartbeat while in `waiting`.** A lane that owns its wait measures
  it. The merger telling you is the other half of the rule and it leaves no
  trace when skipped — do not rely on it.
- **On any census candidate**, before calling anything silent.
- **Exit 1 = move.** Something you were waiting on is done.

## What it cannot see

A blocker the lane never named. If the output says `no #refs`, that *is* the
finding: the lane is waiting on something it did not write down, and
`waiting | <next action> | <why>` exists so this command has something to
read. Fix the heartbeat, not the tool.
