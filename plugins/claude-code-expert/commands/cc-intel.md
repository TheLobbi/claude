---
name: claude-code-expert:cc-intel
intent: Deep evidence-driven analysis for hard coding problems — architecture decisions, root-cause investigation, high-stakes refactor planning, performance bottleneck isolation. Invokes the principal-engineer-strategist agent.
tags:
  - claude-code-expert
  - command
  - cc-intel
inputs: []
risk: medium
cost: medium
description: Deep evidence-driven analysis for hard coding problems — architecture decisions, root-cause investigation, high-stakes refactor planning, performance bottleneck isolation. Invokes the principal-engineer-strategist agent.
---

# /cc-intel — Deep Code Intelligence

For problems where speed kills quality. Runs the evidence-driven workflow from `skills-v8/deep-code-intelligence`.

## Usage

```bash
/cc-intel <question>          # Deep analysis with evidence table + hypothesis tree
/cc-intel --route             # Route to the best agent/skill/topology first
/cc-intel --council           # Delegate to multi-agent council (see /cc-council)
```

## Output contract

1. **Frame** — restated problem, constraints, hidden cost of being wrong.
2. **Evidence table** — claims, sources, confidence, counter-evidence.
3. **Invariants + constraints + assumptions** — explicit.
4. **Hypothesis tree** (debug) or **alternatives tree** (design).
5. **Recommendation** — chosen path, rejected options, risks, rollback.
6. **Confidence signal** — high / medium / low, honestly.

## When to use

- Architecture decision affecting multiple teams
- Bug with multiple plausible root causes
- Refactor where rollback cost is high
- Performance problem needing profile-driven insight
- Any task where "move fast and guess" would burn days

## When NOT to use

- Straightforward feature implementation
- Known bug with obvious fix
- Pure mechanical work (renames, reformats)

For those, use Sonnet directly without `/cc-intel`.

## Delegation

Runs `principal-engineer-strategist` agent by default (Opus, read-only tools). For tasks that need council review (parallel specialist perspectives), use `/cc-council` instead.

## MCP delegation

Uses `cc_docs_resolve_task` for task → starting docs; `cc_docs_compare` for comparing approaches; `cc_kb_pattern_template` for pattern fit.
