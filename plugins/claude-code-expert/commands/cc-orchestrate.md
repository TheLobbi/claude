---
name: claude-code-expert:cc-orchestrate
intent: Launch a multi-agent workflow by agentic pattern (chain, routing, parallelization, eval-optimizer, orchestrator-workers, reflection, ReAct, blackboard). Runs pattern-router to select if pattern isn't specified.
tags:
  - claude-code-expert
  - command
  - cc-orchestrate
inputs: []
risk: medium
cost: medium
description: Launch a multi-agent workflow by agentic pattern (chain, routing, parallelization, eval-optimizer, orchestrator-workers, reflection, ReAct, blackboard). Runs pattern-router to select if pattern isn't specified.
---

# /cc-orchestrate — Launch Multi-Agent Workflow

Runs an agentic pattern end-to-end with the right agents, tools, and coordination.

## Usage

```bash
/cc-orchestrate <task>                    # Auto-select pattern via pattern-router
/cc-orchestrate <task> --pattern <name>   # Explicit pattern
/cc-orchestrate <task> --topology <kit>   # Pattern + team topology
/cc-orchestrate <task> --dry-run          # Show plan, don't execute
/cc-orchestrate <task> --budget <amount>  # Cap cost (will choose cheaper pattern if needed)
/cc-orchestrate --resume                  # Resume last interrupted multi-wave workflow
```

## Patterns

See [`skills/agentic-patterns`](../skills/agentic-patterns/SKILL.md). Quick reference:

| Pattern | Cost | Shape |
|---|---|---|
| `reflection` | 1.1× | Single agent + self-review |
| `prompt-chaining` | 1.5–2× | Sequential phases |
| `routing` | 1× | Branch by input type |
| `parallelization` | 1–3× | Fan-out / fan-in |
| `eval-optimizer` | 1.5–3× | Generate → score → refine |
| `orchestrator-workers` | 2–5× | Lead decomposes and spawns workers |
| `react` | 1.2–2× | Thought → action → observation loop |
| `blackboard` | 3–6× | Multi-agent collaborative review |

## Pattern selection

If `--pattern` isn't provided, runs `pattern-router` agent first. Router returns:
- Recommended pattern + rationale
- 5-layer wiring (CLAUDE.md rules, skill references, hook gates, agent spawns, memory writes)
- Cost estimate
- Anti-patterns to avoid

## Execution

1. Pattern chosen (explicitly or via router).
2. Topology chosen (from `--topology` or `cc_docs_team_topology_recommend`).
3. `team-orchestrator` agent (Opus) launches specialists with correct tool restrictions and worktree isolation.
4. **Between waves** (orchestrator-workers / blackboard): `verify-between-waves` skill runs as a gate — typecheck + lint + tests must pass before the next wave starts. See [`skills/verify-between-waves/SKILL.md`](../skills/verify-between-waves/SKILL.md).
5. Coordinator gathers outputs and synthesizes.
6. Returns: final artifact + decision log + cost actual vs estimate.

**Resume**: If a multi-wave run was interrupted, `--resume` reads `.claude/active-task.md` (written by each wave) and restarts from the last completed wave. When using the Agent SDK programmatically, pass `resume: "<session-id>"` instead — session files are at `~/.claude/projects/<url-encoded-cwd>/<session-id>.jsonl`.

## Cost control

`--budget` caps total spend. Orchestrator downgrades to cheaper pattern if needed. Never exceeds budget without explicit user confirmation.

## Pattern reference

Fetch template for any pattern via MCP: `cc_kb_pattern_template(name)`.
