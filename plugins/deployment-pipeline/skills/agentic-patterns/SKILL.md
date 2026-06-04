---
name: agentic-patterns
description: "Patterns from \"Agentic Design Patterns\" (Gulli & Sauco, 2025) applied to CD orchestration and state-machine deployment workflows"
---

# Agentic Design Patterns — Deployment Pipeline

> Patterns from "Agentic Design Patterns" (Gulli & Sauco, 2025) applied to CD orchestration and state-machine deployment workflows

## Applied Patterns

### Prompt Chaining
**Relevance**: Deployment pipelines are inherently sequential — each stage must succeed before the next begins, making prompt chaining the foundational pattern.
**Current Implementation**: The `start` command triggers a linear pipeline of validate → build → deploy → verify stages, each passing state to the next.
**Enhancement**: Model each stage transition as a structured chain link with explicit input/output schemas. The output of the validate stage (manifest, checksums, env config) becomes the structured prompt input to the build stage, ensuring context is never lost across stage boundaries.

### Planning
**Relevance**: Before initiating a deployment, the orchestrator must devise a strategy that accounts for environment, risk level, rollout type (canary, blue-green, rolling), and SLA windows.
**Current Implementation**: The `orchestrator.md` agent selects deployment strategies, but strategy selection is implicit.
**Enhancement**: Add an explicit planning phase that emits a deployment plan artifact (target envs, rollout %, health check thresholds, estimated duration, rollback triggers) before any execution begins. The plan is approved (by HITL or auto) before the pipeline proceeds.

### Exception Handling
**Relevance**: Deployment failures are not exceptional — they are expected scenarios that require structured recovery, not ad-hoc responses.
**Current Implementation**: The `rollback.md` agent and `rollback` command handle failure recovery; the `validator.md` agent detects issues.
**Enhancement**: Wrap each pipeline stage in a try/catch pattern with typed exception classes: `ValidationError`, `BuildError`, `HealthCheckFailure`, `TimeoutError`. Each exception type maps to a predefined recovery action (retry, rollback, notify, halt). The rollback agent receives the exception type as input context.

### Human-in-the-Loop (HITL)
**Relevance**: Production deployments and rollbacks to critical environments require human authorization gates before proceeding.
**Current Implementation**: The `approve` command provides a manual approval mechanism at the pipeline level.
**Enhancement**: Formalize HITL as a blocking gate with configurable placement: pre-deploy approval, post-canary validation approval, and rollback confirmation. Each gate presents a structured summary (diff, risk score, affected services, estimated impact) and records the approver identity and timestamp in the deployment history.

### Guardrails
**Relevance**: Deployments must enforce hard constraints — never deploy to production without passing health checks, never exceed a change-failure-rate threshold, never skip required approval stages.
**Current Implementation**: The `validator.md` agent checks pre-conditions; the pipeline has validation stages.
**Enhancement**: Extract guardrails into a declarative constraint layer evaluated before and after every stage. Guardrails include: artifact integrity checks, environment drift detection, concurrent deployment prevention (mutex lock), SLA window enforcement, and rollback-eligibility verification. Constraint violations immediately halt the pipeline with a structured error report.

### Goal Setting
**Relevance**: A deployment is successful only when it meets defined SLA targets — latency, error rate, availability — not simply when the deployment command exits 0.
**Current Implementation**: The pipeline tracks deploy status but success/failure is binary (command success vs. failure).
**Enhancement**: Define deployment goals as measurable SLA criteria attached to the pipeline plan. After deploy, the orchestrator evaluates whether goals are met (p99 latency < X ms, error rate < Y%, all health checks green for Z minutes). Only when goals are satisfied does the pipeline transition to `COMPLETE`; otherwise it triggers exception handling.

### Evaluation
**Relevance**: Each deployment run is a data point. Evaluating outcomes over time improves future deployment decisions and detects degrading patterns.
**Current Implementation**: The `history` command surfaces past deployments, but evaluation is manual.
**Enhancement**: After each pipeline completion, emit a structured evaluation report: goal achievement (met/missed/partial), stage durations, rollback count, MTTR for failures, and change-failure rate trend. Store these in the deployment history for trend analysis and use them as context in the planning phase of subsequent deployments.

### Multi-Agent
**Relevance**: Complex deployment workflows exceed the capability of a single agent — orchestration, validation, and rollback are distinct responsibilities requiring specialized agents.
**Current Implementation**: Three specialized agents exist — `orchestrator.md`, `validator.md`, `rollback.md` — with defined roles.
**Enhancement**: Formalize the multi-agent topology with explicit communication contracts: the orchestrator is the sole coordinator; validator and rollback agents are workers that receive structured task requests and return structured results. Add a monitoring agent that runs concurrently during deployment, watching health signals and alerting the orchestrator if guardrail thresholds are approached before they are breached.

## Pattern Interaction Map

```
User Request
    │
    ▼
[Planning] ──────────────────────────────────────────────────────┐
  Emit deployment plan (strategy, goals, guardrails config)       │
    │                                                             │
    ▼                                                             │
[HITL Gate] ← human approves plan                                │
    │                                                             │
    ▼                                                             │
[Prompt Chaining] — stage-by-stage execution                     │
  ├── Stage N input = Stage N-1 structured output                 │
  ├── [Guardrails] checked at every stage boundary               │
  └── [Multi-Agent] Orchestrator ↔ Validator ↔ Monitor agents   │
    │               (concurrent monitoring during execution)      │
    ▼                                                             │
[Exception Handling]                                             │
  ├── Typed exceptions → recovery map                            │
  └── Rollback agent activated with exception context            │
    │                                                             │
    ▼                                                             │
[Goal Setting] — evaluate post-deploy SLA metrics               │
    │                                                             │
    ▼                                                             │
[Evaluation] — emit structured deployment report ←──────────────┘
  Feeds back into Planning context for next deployment
```

## References
- Gulli, A. & Sauco, M. (2025). Agentic Design Patterns.
- Repository: github.com/Mathews-Tom/Agentic-Design-Patterns
