---
name: agentic-patterns
description: "Patterns from \"Agentic Design Patterns\" (Gulli & Sauco, 2025) applied to enterprise team development, DevOps tooling, and multi-cloud workflow automation"
---

# Agentic Design Patterns — Team Accelerator

> Patterns from "Agentic Design Patterns" (Gulli & Sauco, 2025) applied to enterprise team development, DevOps tooling, and multi-cloud workflow automation

## Applied Patterns

### Multi-Agent
**Relevance**: An enterprise development toolkit spans DevOps, code quality, testing, documentation, performance, and integrations — no single agent can competently own all domains.
**Current Implementation**: The plugin provides specialized commands (`quality`, `test`, `deploy`, `docs`, `perf`, `workflow`, `integrate`) each backed by domain knowledge.
**Enhancement**: Surface each command domain as a distinct specialist agent with a declared capability manifest. A coordinator agent (`team-lead`) receives natural-language team requests, routes to the correct specialist(s), and aggregates results. Agents can request help from peers (e.g., the quality agent delegating static analysis to a security sub-agent) without exposing the complexity to the user.

### Parallelization
**Relevance**: Code quality pipelines — lint, type-check, unit test, security scan, coverage — are independent checks that can run concurrently, dramatically reducing developer feedback time.
**Current Implementation**: The `quality` command runs checks sequentially; the `test` command executes a single test suite at a time.
**Enhancement**: Implement a parallel fan-out pattern for the quality gate: spawn concurrent sub-tasks for each check category, collect results into a unified report, then fan in. Apply the same pattern to the `test` command for parallel test-suite execution across environments (unit, integration, e2e, performance). Provide a consolidated pass/fail summary with per-check timing.

### Routing
**Relevance**: Team requests are heterogeneous — a request about "slow API responses" could route to performance profiling, database optimization, or infrastructure scaling depending on context.
**Current Implementation**: Users select commands explicitly; routing is manual.
**Enhancement**: Add an intent-classification routing layer at the plugin entry point. The router analyzes the request, extracts signals (keywords, file types, error messages, affected systems), and dispatches to the correct specialist command(s). For ambiguous requests, the router presents a structured clarification prompt rather than guessing. Route decisions are logged for pattern analysis.

### Resource-Aware
**Relevance**: The plugin targets multi-cloud environments (Kubernetes, Harness, Prometheus, Playwright) with variable resource costs. Decisions about test environment provisioning, build runners, and deployment targets should account for cost and capacity.
**Current Implementation**: The `deploy` command targets configured environments without explicit resource-awareness; `perf` profiling runs without capacity checks.
**Enhancement**: Before provisioning any cloud resource (test cluster, build runner, deployment target), query current capacity and cost signals. The resource-aware layer provides: current node utilization, estimated cost of the operation, alternative lower-cost options (spot instances, off-peak scheduling), and a hard budget cap that blocks operations exceeding defined limits. Expose this via a `--resource-report` flag on any resource-consuming command.

### Planning
**Relevance**: Complex team workflows — a full release cycle, a refactoring sprint, a migration — require upfront planning before execution to coordinate multiple tools and agents correctly.
**Current Implementation**: The `workflow` command automates defined workflows but does not synthesize a plan from a high-level goal.
**Enhancement**: Add a planning mode to the `workflow` command: given a high-level goal ("release v2.3 to production by Friday"), the planner decomposes it into an ordered task graph with dependencies, estimated durations, resource requirements, and risk points. The plan is reviewable and editable before execution begins. The planner re-plans dynamically if a task fails or new information arrives.

### Evaluation
**Relevance**: Code quality, test coverage, deployment frequency, and incident recovery time are measurable outcomes that should be tracked over time to assess whether the toolkit is improving team performance.
**Current Implementation**: Commands produce per-run output but do not accumulate metrics or trend data.
**Enhancement**: After each command execution, emit a structured metrics event: command type, duration, pass/fail, key metrics (coverage %, lint violations, test count, deploy duration). Aggregate these into a team-health dashboard accessible via a `status --metrics` flag. Surface trends (coverage decreasing, deploy frequency dropping, test flakiness increasing) as proactive alerts.

### Learning
**Relevance**: Teams develop patterns and preferences — preferred test frameworks, common lint suppressions, recurring performance bottlenecks. The toolkit should learn from repeated interactions and adapt its defaults accordingly.
**Current Implementation**: Commands operate with static configuration; team-specific patterns are not captured.
**Enhancement**: Instrument a lightweight pattern-capture layer that records: which commands are used most, which options are consistently overridden, which errors recur, and which workflows succeed vs. fail. After N runs, the learning layer updates local defaults and suggests configuration improvements. For recurring errors, it generates a team-specific runbook entry. Store learned patterns in a `.team-patterns.json` file within the plugin config directory.

## Pattern Interaction Map

```
Team Request (natural language or command)
    │
    ▼
[Routing] — intent classification
  ├── Ambiguous? → structured clarification prompt
  └── Clear? → dispatch to specialist agent(s)
    │
    ▼
[Multi-Agent] — specialist coordination
  ├── quality-agent    ─┐
  ├── test-agent       ─┤  [Parallelization] — concurrent execution
  ├── deploy-agent     ─┤  fan-out → parallel sub-tasks
  ├── docs-agent       ─┤  fan-in  → unified report
  ├── perf-agent       ─┘
  └── integrate-agent
    │
    ├── [Resource-Aware] — capacity/cost check before cloud ops
    │
    ├── [Planning] — task graph for multi-step workflows
    │
    ▼
[Evaluation] — structured metrics event emitted per run
    │
    ▼
[Learning] — pattern capture → adapt defaults → runbook updates
```

## References
- Gulli, A. & Sauco, M. (2025). Agentic Design Patterns.
- Repository: github.com/Mathews-Tom/Agentic-Design-Patterns
