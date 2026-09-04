---
name: fleet-orchestration:fleet-census
intent: Take a fleet census - every lane's heartbeat age and state, cross-checked against its actual artifacts, classified as standby, blocked-by-design or hung, with the evidence for each verdict
tags:
  - fleet-orchestration
  - command
  - monitoring
inputs:
  - lane-name
risk: low
cost: low
description: Take a fleet census - every lane's heartbeat age and state, cross-checked against its actual artifacts, classified as standby, blocked-by-design or hung, with the evidence for each verdict
model: sonnet
allowed-tools: Read, Glob, Grep, Bash
---

# Fleet census

Focus: `$ARGUMENTS` (if empty, census **every** lane in the registry).

Load the `heartbeat-monitor` skill first. The rule it exists to enforce:

> **Message-absence is not work-absence. Read the lane's ARTIFACT before you
> call it silent.**

## 1. Read every heartbeat, not only the suspicious ones

For each lane in `registry.md` (use the **last** row per lane; match on
session id so a repurposed session is not counted twice), read the last line
of `heartbeats/<lane>.md`: UTC, state, task, note.

**State the set**: "read n of n lanes". A census over a subset is a sample,
and a sample reported as a census is a count with the wrong scope.

**Validate the lines before trusting any of them**:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/validate-heartbeat.mjs" <logRoot>/heartbeats
```

A malformed line does not fail — it produces a *plausible* state, and this
census then reports it confidently. One leading `|` once made a dead
session's tombstone read as `state=<a timestamp>`, which the monitor
announced as recovered.

## 2. Age each one

`now - last heartbeat`, against `heartbeat.staleMinutes` from the config.

## 3. For anything past the threshold, read the artifact

In this order, stopping at the first that shows movement — and **quote what
it showed**:

1. the lane's branch head on the remote, and when it last moved;
2. its open PRs — opened, updated, or new comments since the heartbeat;
3. its worktree — new commits, uncommitted work;
4. its report file, if written.

Enumerate branches and PRs **uncapped**. A `--limit` here is a search-space
cap, and it manufactures exactly the false negative this census exists to
prevent. Size the set first, then look.

Under a shared identity, ownership is not derivable from forge state: cross
-reference against the assignment record written at assignment time, never
against an acknowledgement log, which records what was said rather than what
exists.

## 4. Classify

| Class | Signature | Action |
|---|---|---|
| STANDBY | last state `standby` | none — send work, it wakes |
| BLOCKED-BY-DESIGN | `waiting`, note says a long call is in flight | wait, re-read next cycle |
| ACTIVE | artifact moved since the last heartbeat | message about heartbeat discipline, do not replace |
| HUNG | past threshold, not standby, **and** no artifact movement | ping once, then replace |

## 5. Report

One table, then the verdicts:

```
lane | last HB (UTC) | age | state | task | artifact check | class
```

For every HUNG verdict, print the full ruling block from
`${CLAUDE_PLUGIN_ROOT}/skills/heartbeat-monitor/references/replacement-policy.md`
— last heartbeat verbatim, age, each artifact read and what it returned, the
ping time, the set read. A ruling that says only "lane X has been quiet"
cannot be checked, and cannot be argued with, which is the same thing.

**Do not replace anything from this command.** It produces evidence; the
replacement decision and the successor brief belong to the orchestrator.
