---
name: cc-deep-code-intelligence
description: Evidence-driven deep analysis for hard coding problems — architecture decisions, root-cause investigation, high-stakes refactor planning, performance bottleneck isolation. Use this skill whenever the user asks for "the best approach", a "deep analysis", "root cause", "principal engineer review", or runs /cc-intel. Also triggers on hard debugging questions, major architectural choices, tricky performance problems, or any task where a hypothesis tree and evidence table matter more than a fast answer.
---

# Deep Code Intelligence

The workflow for problems where speed kills quality — architecture, root cause, high-stakes refactor. Evidence first, recommendation second.

## Workflow

### 1. Frame the problem

Restate in one paragraph: what is the goal, what is the constraint, what is the hidden cost of being wrong? Write it down even if the user already said it — framing shifts under scrutiny.

### 2. Build an evidence table

```
| Claim | Source | Confidence | Counter-evidence |
|-------|--------|-----------|------------------|
| X calls Y synchronously | src/a/b.ts:42-58 | high | ... |
```

No recommendation without this table. If you can't fill it, you don't know enough yet — go read more before synthesizing.

### 3. Identify invariants and constraints

- Invariants the code must preserve (data integrity, ordering, idempotency).
- Constraints from the environment (runtime version, db version, budget, timeline).
- Assumptions Claude is making (mark explicitly — these are the hypothesis branches).

### 4. Hypothesis tree

For debugging/diagnosis: root-cause tree with ≥3 branches. Each branch:
- Claim
- Evidence-for count
- Evidence-against count
- Verification step (the cheapest check that confirms or refutes)

For design: alternatives tree with ≥3 options. Each option:
- Sketch
- Cost (effort, runtime, operational)
- Reversibility (can we undo?)
- Who wins / who loses (not everything is net-positive)

### 5. Synthesize recommendation

Only now. Recommendation has:
- Chosen path with one-sentence rationale
- What was rejected and why
- Risks and mitigations
- Rollback plan if the recommendation fails in production

### 6. Signal certainty honestly

- "High confidence" — evidence is multi-source, counter-evidence addressed.
- "Medium" — some evidence, but a few assumptions.
- "Low" — more research needed; here's the next best step.

Never upgrade certainty to sound confident. A low-confidence answer clearly labeled is more useful than a high-confidence guess.

## When to invoke `principal-engineer-strategist` agent

Route to the agent when:
- The decision affects multiple teams.
- The cost of being wrong is ≥ days of work.
- There are hidden stakeholders (security, compliance, ops) whose concerns aren't obvious.
- The task requires deep repo context that exceeds working memory.

Agent runs the same workflow with more depth and less context pressure.

## MCP delegation

| Need | Tool |
|---|---|
| Task resolution → starting docs | `cc_docs_resolve_task(task)` |
| Compare two approaches side by side | `cc_docs_compare(["approach-a", "approach-b"])` |
| Check pattern fit | `cc_kb_pattern_template(name)` |

## Anti-patterns

- Recommending before the evidence table → advice isn't grounded; often wrong in subtle ways.
- Single-branch hypothesis tree → not actually a tree; confirmation bias.
- Ignoring counter-evidence → the one line that breaks the claim is the one that matters.
- "Move fast" framing on high-stakes work → that's the definition of getting it wrong.

## Reference

- [evidence-table-format.md](references/evidence-table-format.md) — evidence table column schema + examples
