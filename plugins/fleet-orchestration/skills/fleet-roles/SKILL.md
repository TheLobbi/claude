---
name: fleet-roles
description: The role catalogue and the descending-model rule for a multi-session fleet - which roles exist at each tier, what each owns, which model tier each runs on, and when a role should be its own session versus a subagent. Use when standing up a fleet, deciding who owns an activity, choosing a model for a spawned agent, writing a role brief, adding a second lane to one repository, or building the RACI for a run. Enforces that every spawned agent names its model - the orchestrator reasons, mid-tier executes, cheap models verify mechanically - and that a role which must heartbeat cannot be a subagent.
---

# Roles and models

## The descending-model rule

> **The orchestrator reasons, mid-tier executes, cheap models verify
> mechanically. Every spawned agent names its model.**

Not naming a model is the failure mode, not choosing the wrong one. An
unnamed dispatch inherits whatever the caller happens to be running, so a
fleet that never names models drifts to a single tier and pays either in
quality or in cost, silently.

| Tier | Model class | Work |
|---|---|---|
| **orchestrator** | highest reasoning | outcomes, escalations, replacement, the run's own judgement |
| **judgement** | high | ranking, review verdicts, release readiness, proposals |
| **mechanical** | mid | merges, conflicts, routing, coverage sweeps |
| **lane** | mid (high for the hardest repos) | implementation in one repository |
| **worker** | mid | one bounded edit, dispatched and discarded |
| **verifier** | cheap | re-run a stated command, check one fact, confirm a count |

Configure the actual model per tier in `fleet.config.json` → `models`.
`model:` accepts a tier alias, a full model id, or `inherit`.

**Right-size every dispatch, and never fork.** A verifier that needs to
reason is the wrong verifier; a lane that spends its own turns on bounded
edits is not delegating.

## Session or subagent?

This decides more than the model does.

**A role that must heartbeat, be woken by a message, or survive between turns
must be its own session.** Subagents cannot do any of those, and a
**foreground** subagent call blocks the caller's turn entirely — it cannot
heartbeat and cannot read messages until the call returns. One lane went
**60+ minutes** silent that way, and the monitor read it as hung.

| Role | Normally runs as |
|---|---|
| orchestrator, all management roles, all repo lanes | its own session |
| worker, verifier | a subagent, spawned **in the background**, unnamed |

The agent files this plugin ships under `agents/` serve both uses: dispatch
the worker and verifier directly, and use a management or lane agent file as
the **brief** you paste into the session that takes that role. Each such file
says so in its own body.

If you must block on a foreground call, heartbeat first:
`waiting | <task> | foreground worker, expect silence`.

## Tier 0 — orchestrator

Owns outcomes, promotion decisions, escalations to the human, lane
replacement, and the run directory. Receives **digests** from the router, not
a stream, and messages nobody directly except the router.

## Tier 1 — management

Run only the roles your fleet's size justifies. A three-lane fleet needs a
planner and a merge gate; the rest is overhead.

| Role | Owns | Tier | Enable when |
|---|---|---|---|
| **planner** | the ranked backlog, assignments, the numbered amendment log | judgement | always |
| **reviewer** | APPROVE/BLOCK verdicts on lane PRs, scoped to a head SHA | judgement | always |
| **gitops** | the merge gate, branch↔PR coverage, runner load | mechanical | always |
| **conflicts** | base re-absorption, conflict resolution, merge forecasts | mechanical | more than ~4 lanes |
| **dispatch** | fan-out, acks, registry upkeep, digests to tier 0 | mechanical | more than ~5 sessions |
| **release** | per-product release board: blocker, proof, exact next action | judgement | anything ships |
| **brainstorm** | evidence-backed proposals, planner-gated into issues | judgement | there is slack |

Two roles are worth adding **early** rather than when it hurts:

- **dispatch**, because without it every session messages tier 0 and tier 0
  becomes the bottleneck it was created to avoid. It was added mid-run in the
  source fleet and immediately became the required relay.
- **release**, because "what blocks the next release, and the exact next
  action" is nobody's job by default, and the human ends up doing it.

**Scale reviewers before anything else.** Reviewer attention is the scarce
resource — not reviewer assignment. Two concurrent reviewers splitting the
repository set, with in-flight items staying with whoever already holds them,
is the shape that worked. Mechanical changes go to a **peer lane** instead;
see the protocol's review routing.

## Tier 2 — repo lanes

One session per repository, exclusive scope, from `lanes[]`. A lane:

- reads its repository's own instructions before the first edit,
- works in a per-task worktree,
- pushes and opens the PR in one action,
- announces the PR to the reviewer with the exact commands run **and** the CI
  state at the announced head,
- removes its worktree only after the merge gate confirms,
- loops until the planner says the queue is empty, then writes its report and
  goes to `standby`.

**Second lane on one repository:** allowed when the queue justifies it, split
by **file space**, named and confirmed by the planner **before** the second
lane's first edit. Task claiming locks claims, not files.

**A structurally starving lane goes to standby; it is never repurposed across
repositories mid-task.** Repurposing a finished session to another role is
fine and should be recorded explicitly — a census that counts registry rows
will otherwise count one session twice.

## Tier 3 — workers and verifiers

Unnamed subagents, spawned in the background, discarded after one task.

- **worker** — one bounded edit with a stated acceptance test.
- **verifier** — re-runs one stated command and reports the literal result.

A worker's "done" is **ASSERTED**. It becomes DELIVERED when a verifier
re-runs the stated command, or a link (PR, SHA, check state) confirms it.

## The RACI

Write one per run. The activities that need an explicit owner, because they
are the ones that go unowned:

| Activity | R | A |
|---|---|---|
| Backlog ranking and assignment | planner | orchestrator |
| Implementation in one repo | that lane | that lane |
| Second lane's file split | that lane | planner confirms before first edit |
| Verification of a worker's claim | verifier | the lane |
| Review verdict | reviewer or peer lane | the reviewer |
| Merge into the integration branch | gitops | orchestrator |
| Conflict resolution / re-absorb | conflicts | gitops |
| Branch↔PR coverage, worktree hygiene | gitops + lanes | gitops |
| Heartbeat monitoring and replacement | orchestrator | orchestrator |
| Release readiness per product | release | orchestrator |
| Promotions, releases, production, spend, trust chain | **the human** | the human |
| Escalation routing | orchestrator | orchestrator |

The last two rows are the ones fleets get wrong. Everything in
`founderClass` reaches the human as a **ready-to-merge PR with proofs**,
never as a question that parks the work.
