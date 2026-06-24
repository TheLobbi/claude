---
name: cc-agentic-patterns
description: Select and wire an agentic design pattern (reflection, prompt chaining, routing, parallelization, orchestrator-workers, evaluator-optimizer, ReAct, blackboard) into the 5-layer Claude Code stack. Use this skill whenever deciding how to structure a multi-step task, whether to spawn subagents, how to run parallel review, or when to use which pattern. Triggers on: "which pattern", "orchestrate", "parallel review", "self-review", "chain of thought", "eval-optimizer loop", "blackboard", "ReAct", "how to decompose this task".
---

# Agentic Patterns

13 patterns from Anthropic's workflow/agent taxonomy + Andrew Ng's four foundational patterns. This skill is the router; templates live in MCP `cc_kb_pattern_template(name)` and the `pattern-router` agent picks for you.

## Choose by task shape

```
How many distinct phases?
│
├─ 1 (single generation) ──────────────► REFLECTION
│
├─ 2-4 (sequential, each uses prior) ──► PROMPT CHAINING
│
├─ 2-4 (independent, same question) ───► PARALLELIZATION
│
├─ Branching on input type ────────────► ROUTING
│
├─ Quality must meet a rubric ─────────► EVALUATOR-OPTIMIZER
│
├─ Emergent subtasks, dynamic ─────────► ORCHESTRATOR-WORKERS
│
├─ Open debug / root-cause ────────────► ReAct (thought→action→observation)
│
├─ Multi-agent collaborative review ───► BLACKBOARD (council)
│
└─ Unsure? ────────────────────────────► use agents/cc-pattern-router
```

## Pattern quick-reference

| Pattern | Cost | Best for | Template |
|---|---|---|---|
| Reflection | 1.1× | Default quality gate on single shots | `cc_kb_pattern_template("reflection")` |
| Prompt chaining | 1.5–2× | Multi-phase features (analyze→plan→implement→verify) | `cc_kb_pattern_template("prompt-chaining")` |
| Routing | 1× | Task-type decides the branch | `cc_kb_pattern_template("routing")` |
| Parallelization | 1–3× | Independent parallel subtasks, fan-in synthesis | `cc_kb_pattern_template("parallelization")` |
| Evaluator-optimizer | 1.5–3× | Quality-critical artifacts (configs, security code) | `cc_kb_pattern_template("eval-optimizer")` |
| Orchestrator-workers | 2–5× | Large features where subtasks emerge during work | `cc_kb_pattern_template("orchestrator-workers")` |
| ReAct | 1.2–2× | Open-ended debugging, exploration | `cc_kb_pattern_template("react")` |
| Blackboard | 3–6× | Multi-agent collaborative review/synthesis | `cc_kb_pattern_template("blackboard")` |

## Wiring patterns into the 5-layer stack

Each pattern deploys artifacts across layers. Example for **reflection**:

| Layer | Artifact |
|---|---|
| L1 — CLAUDE.md | Add rule: "Review your own output before presenting. Check for off-by-one errors, unhandled edge cases, and inconsistency with existing code patterns." |
| L2 — Skill | None required — behavior driven from CLAUDE.md |
| L3 — Hook | Optional: PostToolUse on Write|Edit that prompts self-verify |
| L4 — Agent | `agents/cc-audit-reviewer` for explicit second-pass when risk is high |
| L5 — Memory | Save rejection reasons to engram for learning |

Fetch a specific pattern's full wiring via `cc_kb_pattern_template(name)`.

## Pattern selection via router agent

When the task is ambiguous, launch `pattern-router`:

```
Agent({
  subagent_type: "pattern-router",
  prompt: "Task: {...}. Select the optimal agentic pattern with rationale."
})
```

Router returns: pattern name + 5-layer wiring + cost estimate + anti-patterns.

## MCP delegation

| Need | Tool |
|---|---|
| Fetch pattern template | `cc_kb_pattern_template(name)` |
| Decide orchestration cost cap | `cc_docs_model_recommend(task, budget)` |
| Recommend topology for multi-agent | `cc_docs_team_topology_recommend(task, complexity, team_size)` |

## Parallelization vs Blackboard — when each applies

Both fan out to multiple agents. The difference is **whether agents read each other's work**:

| | Parallelization | Blackboard |
|---|---|---|
| Agents see peers? | No — each gets only their scope | Yes — each reads the shared board before writing |
| Subtasks | Fully independent | Overlapping; one agent's finding informs another |
| Example | Run security + perf + test reviews simultaneously | Security agent flags an issue; architecture agent reads it and re-evaluates their finding |
| Cost | 1–3× | 3–6× (extra rounds per agent) |
| When to choose | Subtasks have zero shared state | Agents must build on each other's output (adversarial or consensus-building) |

If in doubt: start with parallelization. Upgrade to blackboard only when a second round of cross-agent reasoning is demonstrably necessary.

## Anti-patterns

- Using eval-optimizer for simple tasks → wasted loops, no quality gain.
- Parallelization when subtasks share state → merge conflicts and hallucinated consistency.
- Orchestrator-workers for fixed-scope work → supervisor overhead dominates.
- ReAct with no stopping criterion → runs forever on fuzzy tasks.
- Blackboard with fewer than 3 agents → not actually multi-agent; just a chain with extra steps.
