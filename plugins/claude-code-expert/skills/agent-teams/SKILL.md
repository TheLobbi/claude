---
name: agent-teams
description: Select and coordinate multi-agent teams (topology kits, role-based squads, lifecycle, worktree isolation). Use this skill whenever launching parallel agents, designing a review board, running a debug council, scheduling an orchestrator-workers team, configuring agent tool restrictions, or deciding between solo and team execution. Triggers on: "launch a team", "parallel agents", "review board", "debug council", "architect-implementer-reviewer", "swarm", "multi-agent", "subagents for X", "team topology", "agent lifecycle".
---

# Agent Teams

Multi-agent orchestration with explicit topologies, tool restrictions, worktree isolation, and lifecycle management.

## When to use a team vs solo

| Signal | Go team |
|---|---|
| Task has 3+ independent subtasks | yes |
| Quality-critical (security, compliance) | yes (adds reviewer) |
| Cross-cutting refactor touching many files | yes |
| Debug with multiple plausible hypotheses | yes (competing-hypotheses) |
| Straightforward feature in one module | no (solo is cheaper) |
| Time-sensitive (parallel beats serial) | yes |

Rough guideline: team cost = 1.5–6× solo, so reserve teams for tasks where the parallel-or-specialist value justifies it.

## Five ready-made topologies (fetch via MCP)

| Topology | Size | When |
|---|---|---|
| `architect-implementer-reviewer` | 3 (2 Opus + 1 Sonnet) | Medium-to-large features with non-trivial design |
| `frontend-backend-test-squad` | 4 (3 Sonnet + 1 Opus) | Full-stack features with clear UI/API/test split |
| `competing-hypotheses-debug` | 4 (3 Sonnet parallel + 1 Opus synth) | Bugs with multiple plausible causes |
| `security-performance-test-review-board` | 4 parallel Sonnet | PR reviews where discipline specialists are cheaper than generalist |
| `docs-migration-sprint` | 4 (3 Sonnet writers + 1 Opus editor) | Large doc migrations (framework version bumps, brand renames) |

Fetch full kit via `cc_kb_topology_kit(name)` — includes composition, file ownership, coordination protocol, cost estimate, anti-patterns.

Shortlist for a specific task: `cc_docs_team_topology_recommend(task, complexity, team_size)`.

## Role-based subagents (general-purpose)

These agents are topology-agnostic — plug them into any topology:

| Agent | Model | Tools |
|---|---|---|
| `implementer` | Sonnet | Read, Edit, Write, Bash, Grep, Glob |
| `debugger` | Opus | Read, Grep, Glob, Bash (hypothesis protocol) |
| `migration-lead` | Opus | Read + writes migration plan before any code |
| `dependency-auditor` | Haiku | Bash (pnpm/pip/cargo audit only) |
| `release-coordinator` | Sonnet | Read, Write, Bash (semver + changelog + tag) |
| `audit-reviewer` | Opus | Read, Grep, Glob (second-round review) |
| `security-compliance-advisor` | Opus | Read, Grep, Glob, Bash (compliance scan) |
| `principal-engineer-strategist` | Opus | Read, Grep, Glob (deep analysis) |
| `council-coordinator` | Opus | Agent, Read (fan-out/fan-in) |
| `team-orchestrator` | Opus | Agent, Read, Write (delegation + lifecycle) |

## Coordination protocols

| Protocol | Use |
|---|---|
| **Serial (chain)** | Phase N+1 needs phase N's output verbatim (architect → implementer → reviewer) |
| **Parallel (fan-out)** | Subtasks are independent; merge at end (review board, competing hypotheses) |
| **Blackboard** | Agents read each other's evolving notes; coordinator synthesizes (council review) |
| **Orchestrator-workers** | Lead agent decomposes and spawns workers dynamically |

## Worktree isolation

Parallel agents often need isolated working copies to prevent interference. Use `isolation: "worktree"` on the Agent tool call, or manually `git worktree add` before launching.

When to isolate:
- Parallel agents all edit the same file → yes, isolate
- Parallel agents investigate (read-only) → no, shared repo is fine
- Agents share state via a coordinator file (blackboard) → no isolation, but strict write-discipline

## Coordination mechanics (current Agent-tool surface)

| Need | How |
|---|---|
| Spawn a teammate | `Agent` tool with `subagent_type`, `model`, and a focused prompt. A built-in `general-purpose` agent is always available. |
| Address it later with context intact | give it a `name`/`team_name`, then **`SendMessage`** to that name/ID — a fresh `Agent` call instead starts a new context. |
| Run non-blocking | `run_in_background: true` (tool) / `background: true` (frontmatter); you're notified on completion. Launch independent agents in one message to run them concurrently. |
| Isolate the working copy | `isolation: "worktree"` (see below). |
| Require a plan before it acts | `mode: "plan"` on the spawn. |
| Cap runaway loops | `maxTurns` in the agent definition. |

The agent's **final message is the only thing returned to the parent** — relay what matters; the
user doesn't see a teammate's transcript. Keep spawn prompts under ~400 words and prefer named
specialists over generics (see `prompt-budget-preflight`).

**Fable 5 for long-horizon coordinators.** When a team runs for hours (overnight builds, multi-wave
migrations), put the coordinator on `model: fable` — Fable 5 reliably sustains ongoing messaging
with long-running async subagents and doesn't drift across waves the way smaller orchestrators can.
Workers stay on Sonnet; the tier premium (~2× Opus per token) only pays off on the coordinator
role. Old "don't over-delegate" guardrails written for prior models should be relaxed on Fable —
delegation is dependable there.

## Lifecycle management

Long-running or idle agents waste tokens. `team-orchestrator` agent handles this:
- Health check active agents periodically.
- Mark agents idle after N minutes of no activity.
- Clean up completed worktrees if the agent made no changes.
- Retain results (the agent's final message) for the coordinator even after cleanup.

## MCP delegation

| Need | Tool |
|---|---|
| Fetch a topology kit | `cc_kb_topology_kit(name)` |
| Recommend a topology | `cc_docs_team_topology_recommend(task, complexity, team_size)` |
| Model for each role | `cc_docs_model_recommend(task, budget)` |
| Pattern for orchestration | `cc_kb_pattern_template(name)` |

## Anti-patterns

- Launching a team for a task a solo agent could finish in under 5 tool calls → overhead dominates.
- Parallel agents with identical system prompts → not actually parallel; just N×cost.
- No coordinator → each agent reports separately; user has to synthesize.
- Unbounded agent TTL → agents hang around consuming session tokens.
- Team cost estimate skipped → teams regularly exceed budget; always estimate first via `cc_docs_model_recommend`.
