---
name: agentic-patterns
description: This skill should be used when the user asks about "agentic design patterns", "multi-agent orchestration patterns", "routing/planning/reflection patterns", "the blackboard pattern", "coordinator-of-coordinators", or "saga/circuit-breaker for agents", or needs to apply agentic design patterns to Jira workflow orchestration and the 81-agent hierarchy.
version: 1.0.0
categories: ["agentic-patterns", "orchestration", "multi-agent", "architecture"]
---

# Agentic Design Patterns — Jira Orchestrator

> Patterns from "Agentic Design Patterns" (Gulli & Sauco, 2025) applied to enterprise Jira workflow orchestration, 81-agent hierarchy management, sprint planning, and issue lifecycle automation.

## Applied Patterns

### 1. Routing
**Relevance**: With 46 commands, 16 teams, and 81 agents, every incoming Jira request must be classified and routed to the correct agent team without human disambiguation.
**Current Implementation**: `/jira:triage` classifies issues by type (bug/feature/epic/task), complexity, and domain to determine the optimal workflow path. The `/model` command routes to haiku/sonnet/opus based on task complexity.
**Enhancement**: Formalize intent extraction as a structured routing schema: `{ issueType, complexity, domain, urgency, assignedTeam, estimatedAgents }`. Run routing before any Jira operation to log routing decisions alongside issue history for analytics.

### 2. Planning
**Relevance**: Sprint planning, epic decomposition, and issue breakdown require hierarchical planning that mirrors Jira's own hierarchy (Epic → Story → Subtask).
**Current Implementation**: `/jira:prepare` decomposes issues into subtasks with enriched acceptance criteria. `/jira:sprint-plan` generates capacity-aware sprint plans. `/jira:release` coordinates multi-project release planning.
**Enhancement**: Adopt ReAct-style planning with explicit Thought → Action → Observation cycles logged to Temporal workflow state. Each planning decision references the Jira issue it modifies, creating a full audit trail.

### 3. Multi-Agent
**Relevance**: The 81-agent hierarchy — organized into 16 specialized teams — is the core architectural pattern. No single agent has sufficient context or authority to handle complex enterprise workflows alone.
**Current Implementation**: Teams include Code Team (6 agents), QA Team (6 agents), Security Team (4 agents), DevOps Team (5 agents), Analytics Team (4 agents), and 11 additional specialized teams. Each team has a coordinator agent.
**Enhancement**: Implement a Coordinator-of-Coordinators (CoC) pattern where team coordinators report status to a central orchestrator via the blackboard. The CoC resolves cross-team conflicts (e.g., QA blocking DevOps deploy) and escalates to HITL when consensus is not reached.

### 4. Memory Management
**Relevance**: Jira projects accumulate months of context — sprint history, team velocity, recurring bugs, architectural decisions — that must be retrievable across sessions.
**Current Implementation**: Neon PostgreSQL stores persistent state; Redis caches active session data; knowledge-graph skill maps issue relationships. `/cc-memory` provides three-tier memory for Claude sessions.
**Enhancement**: Implement a Jira-aware memory layer that indexes issue history by project key, team, epic, and recurring pattern type. When starting a new sprint, the memory agent surfaces: velocity trends, unresolved blockers from previous sprints, and recurring defect categories.

### 5. Reflection
**Relevance**: Code review loops, sprint retrospectives, and quality gate checks all require iterative improvement through structured self-critique.
**Current Implementation**: `/jira:review` applies multi-agent code review with security, performance, and quality dimensions. `/retro` facilitates retrospective analysis. The `cc-council` pattern provides multi-perspective reflection.
**Enhancement**: Add a Reflector agent to the Code Team that receives every PR diff and produces structured feedback: `{ correctness: score, security: score, style: score, critique: string[], suggestedRevisions: string[] }`. Failed reviews automatically create child Jira issues with the critique embedded.

### 6. Parallelization
**Relevance**: Sub-issues within a sprint can be executed in parallel by independent agent teams. Sequential execution wastes velocity.
**Current Implementation**: `/jira:work` orchestrates parallel sub-issue execution across agent teams. Temporal workflows manage parallel branch coordination with join synchronization.
**Enhancement**: Implement a dependency graph extractor that reads Jira issue links (blocks/is-blocked-by) and fans out only independent issues. Blocked issues wait in a dependency queue rather than failing or stalling the orchestration.

### 7. Exception Handling
**Relevance**: Jira workflows involve external systems (Harness CI/CD, Atlassian APIs, Neon DB, Redis) — all of which can fail. Robust orchestration must recover without losing work.
**Current Implementation**: Temporal workflows provide durable execution with automatic retry for transient failures. `/jira:cancel` saves checkpoint state. The self-healing protocol captures tool failures to lessons-learned.
**Enhancement**: Build a typed ExceptionClassifier that categorizes failures: `{ type: 'api-timeout'|'auth-expired'|'conflict'|'validation', severity, recoveryStrategy }`. Each failure type maps to a specific recovery playbook: retry with backoff, refresh OAuth token, resolve conflict with HITL, or escalate to team coordinator.

### 8. Human-in-the-Loop (HITL)
**Relevance**: Production deployments, release approvals, SLA escalations, and destructive Jira operations (bulk delete, board reset) require human sign-off.
**Current Implementation**: `/jira:approve` manages approval workflows for PRs, deploys, and releases. Enterprise notification system routes approvals to Slack/Teams/email. SLA escalation paths include human escalation.
**Enhancement**: Serialize agent state at every HITL checkpoint — the full context of what has been done, what is proposed next, and why. Present a human-readable summary with explicit approve/reject/modify options. On resume, inject the human's decision as a typed directive into the agent context.

### 9. Evaluation and Monitoring
**Relevance**: Agent trajectory quality, sprint velocity, SLA compliance, and code review effectiveness all need continuous measurement to drive improvement.
**Current Implementation**: `/jira:metrics` generates real-time dashboards with SLA tracking. `/jira:quality` produces tech debt analysis. Session analytics track agent cost and token spend. Agent trajectory analysis is referenced in orchestration docs.
**Enhancement**: Implement an Evaluator agent that scores each agent action in an orchestration run: `{ agentId, action, relevance, correctness, efficiency, score }`. Aggregate scores per sprint to identify underperforming agents and trigger retraining or prompt revision.

### 10. Prioritization
**Relevance**: Backlog ordering, sprint candidate selection, and in-sprint issue sequencing all require principled prioritization that balances urgency, value, and effort.
**Current Implementation**: `/backlog-groom` applies prioritization logic. `/jira:sprint-plan` uses capacity-aware scoring. `/jira:intelligence` provides AI-powered predictive prioritization.
**Enhancement**: Formalize a Priority Score agent that computes `(business_value × urgency) ÷ (effort × risk)` for each issue using Jira field data. Re-score the entire backlog after each sprint close, incorporating velocity actuals and changed business context.

### 11. Goal Setting
**Relevance**: Sprint goals, release targets, and SLA objectives give agent teams a measurable north star. Without explicit goals, agents optimize locally at the expense of team outcomes.
**Current Implementation**: Sprint goals are referenced in `/jira:sprint` and `/jira:release`. SLA targets drive `/jira:sla` monitoring. Portfolio objectives are tracked in `/jira:portfolio`.
**Enhancement**: Formalize a Goal object at sprint start: `{ sprintGoal: string, successCriteria: string[], keyMetrics: { velocity, defectRate, slaCompliance }, deadline: date }`. The Evaluator checks goal progress after each daily sync and surfaces blockers to the Coordinator.

## Pattern Interaction Map

```
Incoming Jira Request
        │
        ▼
    [Routing] ──────────────────────────────────┐
        │                                        │
        ▼                                        ▼
  [Goal Setting] ←── [Prioritization]   [Memory Management]
        │                                        │
        ▼                                        │
    [Planning] ──────────────────────────────────┤
        │                                        │
        ▼                                        │
  [Parallelization] ──→ [Multi-Agent (81 agents)]│
        │                      │                 │
        │              [A2A via Blackboard]      │
        │                      │                 │
        ▼                      ▼                 │
  [Exception Handling]   [Reflection] ←──────────┘
        │                      │
        ▼                      ▼
      [HITL] ←── [Evaluation & Monitoring]
        │                      │
        └──────────────────────┘
                   │
            [Feedback Loop]
         (Retrospective → Backlog)
```

### Key Synergies
- **Routing + Prioritization**: Route only after priority is established so the highest-value work reaches agents first
- **Multi-Agent + Exception Handling**: Team coordinators handle intra-team exceptions; CoC handles cross-team conflicts
- **Memory + Planning**: Historical velocity and defect data inform sprint capacity planning
- **Reflection + Goal Setting**: Retrospective reflection updates next sprint's goal criteria
- **Parallelization + Evaluation**: Score parallel branches independently so the best approach wins

## Quick Reference: Pattern → Command Mapping

| Pattern | Primary Command | Jira Entity |
|---------|-----------------|-------------|
| Routing | `/jira:triage` | Issue classification |
| Planning | `/jira:prepare`, `/jira:sprint-plan` | Epic/Story/Subtask |
| Multi-Agent | `/jira:work`, `/jira:orchestrate-advanced` | 81-agent teams |
| Memory | `/jira:setup` (Neon/Redis) | Cross-session state |
| Reflection | `/jira:review`, `/retro` | PR review, retrospective |
| Parallelization | `/jira:work` | Sub-issue fan-out |
| Exception Handling | `/jira:cancel` + Temporal | Workflow recovery |
| HITL | `/jira:approve` | Deploy/release approval |
| Evaluation | `/jira:metrics`, `/jira:quality` | Sprint/agent scoring |
| Prioritization | `/backlog-groom`, `/jira:intelligence` | Backlog ordering |
| Goal Setting | `/jira:sprint`, `/jira:release` | Sprint/release goals |

## References
- Gulli, A. & Sauco, M. (2025). *Agentic Design Patterns*. O'Reilly Media.
- Repository: github.com/Mathews-Tom/Agentic-Design-Patterns
- Atlassian Jira REST API: developer.atlassian.com/cloud/jira/platform/rest/v3/
- Temporal Workflow Docs: docs.temporal.io
- Related Skills: `skills/structured-reasoning/SKILL.md`, `skills/sprint-intelligence/SKILL.md`
