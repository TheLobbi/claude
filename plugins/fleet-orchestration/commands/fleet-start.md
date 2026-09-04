---
name: fleet-orchestration:fleet-start
intent: Stand up a fleet run - write or read the config, create the run directory, generate the protocol, RACI, briefs and empty logs, and print the exact text to paste into each session
tags:
  - fleet-orchestration
  - command
  - bootstrap
inputs:
  - run-id
risk: low
cost: medium
description: Stand up a fleet run - write or read the config, create the run directory, generate the protocol, RACI, briefs and empty logs, and print the exact text to paste into each session
model: opus
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Start a fleet run

Run id: `$ARGUMENTS` (if empty, use today's date plus a short slug).

Load the `fleet-protocol` and `fleet-roles` skills before doing anything
here. This command **writes files and prints briefs**; it does not open
sessions — a human does that, because each lane is its own session.

## 1. Resolve the configuration

Look for `$FLEET_CONFIG`, then `./fleet.config.json`, then
`./.fleet/fleet.config.json`.

**If none exists**, copy `${CLAUDE_PLUGIN_ROOT}/config/fleet.config.example.json`
and fill it in from the repositories actually present. Ask for exactly what
you cannot determine by looking:

- which repositories are in scope, and which are **hands-off**;
- the base branch per repository (they are not always the same);
- whether every session authenticates as **one identity** (`sharedIdentity`)
  — this changes attribution, approval and census mechanics;
- which decisions are **founder-class** and must escalate rather than
  proceed.

Never guess a repository name. A lane pointed at the wrong repository is the
most expensive misconfiguration in this system and it is silent: the lane
will find something to do.

## 2. Create the run directory

At `logRoot`. It is **machine-local and never committed** — add it to the
appropriate ignore file if it sits inside a repository.

```
PROTOCOL.md  RACI.md  registry.md  queue.md  acks.md
escalations.md  reviews.md  outcomes.md
heartbeats/  briefs/  reports/
```

Seed each log with its header row. `PROTOCOL.md` is the `fleet-protocol`
skill rendered with this run's config substituted, so a session can read the
contract without the plugin installed. `RACI.md` comes from the `fleet-roles`
skill's table, trimmed to the roles actually enabled.

## 3. Write one brief per role

`briefs/<lane>.md`, from the matching `${CLAUDE_PLUGIN_ROOT}/agents/*.md`
file, with the run-specific lines filled in: repository, base, worktree root,
model tier, the initial queue, and the inherited state (empty on a fresh
run).

Enable only the roles the fleet's size justifies — a three-lane fleet needs a
planner and a merge gate, and the rest is overhead. Add **dispatch** and
**release** early rather than when it hurts: without dispatch, every session
messages tier 0 and tier 0 becomes the bottleneck it exists to prevent;
without release, "what blocks the next release and the exact next action" is
nobody's job and the human ends up doing it.

## 4. Print the start text

For each role, print the exact text a human pastes into a new session:

```
You are <lane>. Read <logRoot>/PROTOCOL.md first, then
<logRoot>/briefs/<lane>.md. Register in registry.md and write a `start`
heartbeat before your first action. Model: <tier>.
```

## 5. Report

One block, no prose:

- run directory path
- roles enabled, each with its model tier
- lanes, each with its repository and base
- hands-off set, quoted from the config
- what you asked about and what you assumed

Then stop. Sessions are opened by a human; briefs are read by the sessions.
