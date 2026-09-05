---
name: fleet-orchestration:fleet-start
intent: Stand up a fleet run in one pass - doctor, config, run directory, briefs, and the exact text to paste into each session
tags:
  - fleet-orchestration
  - command
  - bootstrap
inputs:
  - run-id
risk: low
cost: medium
description: Stand up a fleet run in one pass - doctor, config, run directory, briefs, and the exact text to paste into each session
model: opus
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Start a fleet run

Run id: `$ARGUMENTS` (if empty, today's date plus a short slug).

Load the `fleet-protocol` and `fleet-roles` skills. This command **writes
files and prints briefs**; it does not open sessions — a human does that,
because each lane is its own session.

## 1. Doctor first

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/fleet.mjs" doctor
```

Fix anything it flags before continuing. A fleet started on an
unauthenticated `gh` or a missing repo directory fails in twenty places at
once, each looking like a different problem.

## 2. Config

If `doctor` found no `fleet.config.json`, `init` writes one from
`config/fleet.config.example.json`. **Edit it before step 3.** Ask for exactly
what you cannot determine by looking at the repositories present:

- which repositories are in scope, and which are **hands-off**;
- base branch per repository (they differ);
- whether every session authenticates as **one identity** (`sharedIdentity`);
- which decisions are **founder-class**.

Never guess a repository name. A lane pointed at the wrong repository is
silent: it will find something to do.

## 3. Create the run directory

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/fleet.mjs" init $ARGUMENTS
```

Creates `<logRoot>/` with seeded `registry.md`, `queue.md`, `acks.md`,
`escalations.md`, `reviews.md`, `outcomes.md`, and `heartbeats/`, `briefs/`,
`reports/`; adds the run directory to `.gitignore`. Machine-local, never
committed.

Then write `<logRoot>/PROTOCOL.md`: the `fleet-protocol` skill with this
run's config substituted, so a session can read the contract without the
plugin installed. And `RACI.md` from the `fleet-roles` table, trimmed to the
roles enabled.

## 4. Briefs

One `briefs/<lane>.md` per enabled role, from the matching
`${CLAUDE_PLUGIN_ROOT}/agents/*.md`, with the run-specific lines filled in:
repository, base, worktree root, model tier, initial queue, inherited state
(empty on a fresh run).

Enable only what the fleet's size justifies. Add **dispatch** and **release**
early rather than when it hurts. **Enable two reviewers from the start when
there are more than four lanes** — reviewer attention was the bottleneck in
the source run, and the second reviewer was added at hour fifteen.

## 5. Print the start text

`init` prints one line per lane. Each pastes into a new session and ends with
the one-action registration:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/fleet.mjs" register <lane> <session-name>
```

Every session heartbeats with `fleet hb`, never by hand — the line is
validated on write, so the malformations that cost the source run a false
"alive" cannot be written.

## 6. Report

One block: run directory, roles enabled with model tiers, lanes with
repository and base, hands-off set quoted from the config, what you asked
and what you assumed. Then stop.
