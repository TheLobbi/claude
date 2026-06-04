---
name: agentic-patterns
description: "Patterns from \"Agentic Design Patterns\" (Gulli & Sauco, 2025) applied to executive director automation for trade associations and nonprofits"
---

# Agentic Design Patterns — Exec Automator

> Patterns from "Agentic Design Patterns" (Gulli & Sauco, 2025) applied to executive director automation for trade associations and nonprofits

## Applied Patterns

### Planning
**Relevance**: Executive director responsibilities span complex, interdependent tasks (event planning, advocacy, member relations, compliance) that require structured decomposition before automation.
**Current Implementation**: The plugin uses LangGraph workflow decomposition to break high-level executive functions into ordered task graphs. The `/generate` command produces LangGraph workflow definitions from responsibility mappings.
**Enhancement**: Apply formal hierarchical planning with goal trees — each top-level executive goal decomposes into subgoals with preconditions, enabling the system to reason about what must complete before what, and to re-plan when steps fail or priorities shift.

### Multi-Agent Coordination
**Relevance**: No single agent can span the full breadth of an executive director role — legal, communications, finance, events, and advocacy all require domain-specialized reasoning.
**Current Implementation**: 11 specialized agents are deployed (via `/deploy` and `/orchestrate`) to cover the distinct functional domains of an executive director, coordinated through the `admin-coordinator` orchestrator agent.
**Enhancement**: Apply the council pattern — have agents report findings back to a shared context and vote or negotiate on conflicting recommendations before presenting a unified output, reducing contradictory guidance across domains.

### Routing
**Relevance**: Incoming tasks and requests must be assigned to the correct specialist agent without human sorting overhead.
**Current Implementation**: The 6-factor scoring algorithm (accessed via `/score`) evaluates tasks on automation potential, risk, frequency, complexity, impact, and reversibility, then routes to the appropriate agent pipeline.
**Enhancement**: Layer semantic routing on top of scoring — use embedding similarity to match task descriptions against agent capability profiles, so novel task phrasings still reach the right agent even if they score ambiguously on the 6-factor rubric.

### Parallelization
**Relevance**: An executive director juggles concurrent workstreams — a board meeting prep can proceed in parallel with membership renewal processing and a grant report draft.
**Current Implementation**: The `/orchestrate` command executes agent tasks concurrently where dependencies allow, leveraging LangGraph's parallel node execution.
**Enhancement**: Introduce an explicit dependency graph at workflow generation time so parallelism is structurally declared, enabling the runtime to maximally fan out work rather than relying on implicit ordering.

### Memory
**Relevance**: Executive director context is deeply session-spanning — member relationships, multi-year advocacy positions, and board dynamics are not rebuilt from scratch each session.
**Current Implementation**: Session state is maintained across the workflow lifecycle, allowing the `/dashboard` and `/report` commands to reflect cumulative organizational context.
**Enhancement**: Implement tiered memory: short-term working context (current session), mid-term episode memory (recent decisions and outcomes), and long-term organizational knowledge (member records, historical positions). Use retrieval-augmented generation to surface relevant history without overloading context windows.

### Exception Handling
**Relevance**: Automated executive workflows operate in high-stakes environments where failures (a missed filing deadline, a botched member communication) have real organizational consequences.
**Current Implementation**: LangGraph workflow recovery paths handle agent failures, with the `/simulate` command allowing pre-flight validation before live execution.
**Enhancement**: Apply the formal exception handling pattern — each workflow node declares expected exceptions, fallback handlers, and escalation conditions. When an exception exceeds the agent's recovery capability, the workflow automatically escalates to the HITL approval layer rather than silently failing or retrying indefinitely.

### Human-in-the-Loop (HITL)
**Relevance**: Executive decisions involving legal commitments, financial thresholds, or board communications must have human sign-off regardless of automation confidence.
**Current Implementation**: The `/orchestrate` command supports executive approval gates at configurable workflow checkpoints before high-consequence actions are taken.
**Enhancement**: Implement confidence-gated HITL — agents self-assess confidence on each action and automatically pause for human review when below threshold, rather than requiring static checkpoint configuration. Low-confidence outputs surface with the agent's uncertainty reasoning to help the executive decide quickly.

### Goal Setting
**Relevance**: Nonprofit and trade association operations are KPI-driven — membership retention, advocacy wins, event attendance, and financial sustainability are measurable goals that should guide agent behavior.
**Current Implementation**: The `/analyze` command maps organizational responsibilities against KPIs, and the `/dashboard` tracks goal-relevant metrics across active workflows.
**Enhancement**: Apply formal goal-conditioning — inject current KPI targets into agent system prompts so every recommendation is evaluated against organizational goals, and the reporting layer surfaces goal-progress deltas alongside task completions.

## Pattern Interaction Map

```
Goal Setting ──────► Planning ──────────► Parallelization
     │                   │                      │
     │                   ▼                      ▼
     │              Routing ──────► Multi-Agent Coordination
     │                                    │
     ▼                                    ▼
  Memory ◄──────── Exception Handling ◄── HITL
     │
     └──────────────────────────────────► Dashboard / Reporting
```

**Flow**: Organizational KPIs (Goal Setting) shape the workflow plan (Planning), which is decomposed into parallel branches (Parallelization) and routed to specialist agents (Routing + Multi-Agent). Agents draw on organizational history (Memory), recover from failures (Exception Handling), and escalate uncertain decisions to human executives (HITL). Outcomes flow back into Memory, closing the loop.

## References
- Gulli, A. & Sauco, M. (2025). Agentic Design Patterns.
- Repository: github.com/Mathews-Tom/Agentic-Design-Patterns
