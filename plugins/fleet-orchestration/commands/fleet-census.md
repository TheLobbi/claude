---
name: fleet-orchestration:fleet-census
intent: Take a fleet census in one command - every lane's heartbeat age, state and class, malformed lines flagged, and the artifact reads for anything past the staleness threshold
tags:
  - fleet-orchestration
  - command
  - monitoring
inputs:
  - lane-name
risk: low
cost: low
description: Take a fleet census in one command - every lane's heartbeat age, state and class, malformed lines flagged, and the artifact reads for anything past the staleness threshold
model: sonnet
allowed-tools: Read, Glob, Grep, Bash
---

# Fleet census

Focus: `$ARGUMENTS` (if empty, every lane).

Load the `heartbeat-monitor` skill. The rule it exists to enforce:

> **Message-absence is not work-absence. Read the lane's ARTIFACT before you
> call it silent.**

## 1. The census, one command

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/fleet.mjs" census
```

Reads **every** heartbeat file (states the set: `lanes read=n of n`),
validates every line against the schema, takes the last *valid* heartbeat per
lane, ages it against `heartbeat.staleMinutes`, and classifies:

| Class | Meaning | Action |
|---|---|---|
| `STANDBY` | idle by declaration | none — send work, it wakes |
| `ACTIVE` | heartbeat within threshold | none |
| `WAITING` / `WAITING-STALE` | pending on someone else | step 2 |
| `BLOCKED` | reported blocked | route the blocker, do not replace |
| `HUNG-CANDIDATE` | past threshold, not standby | step 2 **before any verdict** |
| `NO-HEARTBEAT` | file has no valid line | registry check, then step 2 |

Exit 1 means candidates exist. That is a list of things to **read**, not a
list of things to replace.

## 2. Read the artifact, in order, stopping at first movement

For each candidate, first the cheapest and highest-yield check:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/fleet.mjs" blockers <lane>
```

It pulls every PR and issue the lane's `waiting`/`blocked` heartbeats name
and asks the forge whether each has cleared. **This one check caught 3 of 3
idle-on-done-work cases** in the source run, none of which any monitor saw.

Then, for anything still unexplained: its branch head on the remote, its open
PRs, its worktree — and **quote what each showed**. "Lane X is silent" is not
a finding; "`heartbeats/lane-x.md` last line 11:16Z `working` #123; PR #456
head moved 11:41Z" is.

Enumerate uncapped. A `--limit` here manufactures the false negative this
census exists to prevent.

## 3. Report

Paste the census table, then per candidate one line: what you read and what
it said. For every `HUNG` verdict, the full ruling block from
`skills/heartbeat-monitor/references/replacement-policy.md`.

**Do not replace anything from this command.** It produces evidence; the
replacement decision belongs to the orchestrator.
