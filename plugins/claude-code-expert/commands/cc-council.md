---
name: claude-code-expert:cc-council
intent: Multi-agent council review — security + performance + test + architecture perspectives delivered in parallel with weighted synthesis. Uses blackboard pattern with council-coordinator.
tags:
  - claude-code-expert
  - command
  - cc-council
inputs: []
risk: medium
cost: medium
description: Multi-agent council review — security + performance + test + architecture perspectives delivered in parallel with weighted synthesis. Uses blackboard pattern with council-coordinator.
---

# /cc-council — Multi-Agent Review

Parallel specialist review with structured synthesis. For PR reviews, architecture decisions, high-stakes releases.

## Usage

```bash
/cc-council <topic>                  # Default: 4-specialist review
/cc-council <topic> --protocol <p>   # Choose protocol
/cc-council <topic> --agents <list>  # Custom specialist set
/cc-council <topic> --scope <area>   # Narrow to one domain (security, perf, a11y, etc.)
```

## Protocols

| Protocol | Composition | Use |
|---|---|---|
| `review-board` (default) | security + performance + test + architecture (4 Sonnet specialists + Opus synthesizer) | General PR review |
| `competing-hypotheses` | 3 parallel Sonnet investigators + Opus synth | Bugs with multiple candidate causes |
| `weighted-voting` | 5 specialists + weighted score | Decision requiring quantitative comparison |
| `consensus-building` | 3 specialists + iterative blackboard | Cross-team architecture alignment |
| `devil-advocate` | 1 proposer + 1 red-team + 1 arbiter | Risk-sensitive decisions |
| `domain-deep-dive` | 1 specialist + chain of follow-up questions | Single-domain deep review |

## Coordinator

`council-coordinator` agent (Opus) runs the fan-out:
1. Spawns N parallel specialists with blackboard access.
2. Each specialist writes findings to `.claude/reviews/{specialist}.md`.
3. Coordinator reads all, dedupes, ranks by severity, synthesizes.
4. Outputs final review to `.claude/reviews/VERDICT.md`.

## Cost

Approximate per review:
- `review-board`: $2–4 (4 Sonnet + 1 Opus synth)
- `competing-hypotheses`: $2–4
- `weighted-voting`: $3–5
- `consensus-building`: $3–6

Check `cc_docs_team_topology_recommend` for specific task.

## Output

`.claude/reviews/VERDICT.md` with:
- Per-specialist finding summaries
- Dedupe table (issues raised by multiple specialists)
- Severity-ranked block/nit/ok list
- Recommended follow-ups
