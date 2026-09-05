# Fleet Orchestration — Context Summary

## Purpose
Run many Claude Code sessions on one codebase without them lying to each
other. Ships a session protocol, the evidence rules that keep claims honest,
a staleness monitor, descending-model role definitions, and three commands.

## At a glance
- Commands: 6 · Agents: 10 · Skills: 4 · CLI: `scripts/fleet.mjs` (11 subcommands)
- The protocol is a **tool**: `fleet hb|register|census|blockers|checks|
  verdicts|unblocks|queue-depth|digest|init|doctor`, each with its evidence
  rule built in. Prefer the command to the hand-written ritual.
- Repo list, lane names, paths and hands-off sets are **configuration**
  (`config/fleet.config.example.json`), never hardcoded.
- Keywords: orchestration, multi-agent, protocol, heartbeat, evidence,
  merge-safety, descending-models

## The four load-bearing ideas
1. **Heartbeat or be replaced.** Every session appends state to its own file.
   Stale past the threshold = hung. But read the lane's *artifact* before
   calling it silent: message-absence is not work-absence.
2. **ASSERTED vs DELIVERED.** Every statement is ASSERTED until a link (PR
   URL, merge SHA, re-run) promotes it. An intention is not evidence.
3. **Descending models.** Orchestrator reasons, mid-tier executes, cheap
   models verify mechanically. Every spawned agent names its model.
4. **A claim carries its falsifier and its set.** The input that would turn
   it red, and the size of the space searched.

## When to load
- Load this summary first for routing and scope checks.
- Open one skill when the task matches it; do not preload all four.
- Defer README.md until you need install or provenance detail.

## When to open deeper docs
| Signal | Open docs | Why |
| --- | --- | --- |
| Any protocol ritual — heartbeat, census, checks, blockers | `node scripts/fleet.mjs --help` | One command each; the rule is inside it. |
| Starting or joining a fleet run | `skills/fleet-protocol/SKILL.md` | The contract every session reads first. |
| Writing a PR body, verdict, or any negative claim | `skills/evidence-rules/SKILL.md` | Falsifier, set size, exit-code-before-output. |
| A session looks silent or hung | `skills/heartbeat-monitor/SKILL.md` | Staleness thresholds and the replacement policy. |
| Choosing who does what, and on which model | `skills/fleet-roles/SKILL.md` | Role catalogue and the descending-model rule. |
| Configuring repos, lanes, bases, hands-off sets | `config/fleet.config.example.json` | The only place fleet-specific names belong. |
| Setting up install or reading what this cost | `README.md` | Install steps and the incident record. |
| Windows/POSIX shell traps hit during the run | `docs/platform-notes.md` | Documented guidance, not core assumptions. |
| Wanting hooks to enforce the protocol | `docs/optional-hooks.md` | Opt-in; this plugin ships no active hooks. |
