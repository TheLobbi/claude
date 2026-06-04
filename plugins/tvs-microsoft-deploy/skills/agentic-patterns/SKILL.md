---
name: agentic-patterns
description: "Patterns from \"Agentic Design Patterns\" (Gulli & Sauco, 2025) applied to enterprise Microsoft ecosystem orchestration for multi-entity, multi-tenant deployment"
---

# Agentic Design Patterns — TVS Microsoft Deploy

> Patterns from "Agentic Design Patterns" (Gulli & Sauco, 2025) applied to enterprise Microsoft ecosystem orchestration for multi-entity, multi-tenant deployment

## Applied Patterns

### Prompt Chaining
**Relevance**: Microsoft ecosystem deployment is an ordered dependency graph — identity must exist before Dataverse, Dataverse before Power Pages, Fabric before Power BI Embedded, Azure infra before application deployment.
**Current Implementation**: Workflows (`deploy-all`, `week1-critical-path`) define ordered command sequences.
**Enhancement**: Formalize each deployment phase as a typed pipeline stage with explicit input/output contracts. Each stage validates its prerequisites (e.g., Entra groups exist, Dataverse environment is healthy) before proceeding. Failed stages emit structured errors with retry strategies rather than raw CLI output.

### Planning
**Relevance**: A multi-entity Microsoft deployment (TVS Holdings, TAIA, Consulting) spanning Power Platform, Azure, Fabric, and M365 requires comprehensive upfront architecture planning before any resource is provisioned.
**Current Implementation**: The `solution-architect` role and `quick-start` command provide planning guidance, but planning is conversational rather than structured.
**Enhancement**: Generate a machine-readable deployment plan (JSON) specifying: resource dependencies, estimated costs per service, compliance checkpoints, and rollback procedures for each phase. The plan becomes the execution contract — all subsequent agents operate against the plan, not against ad-hoc instructions.

### Tool Use
**Relevance**: The plugin orchestrates 6+ distinct CLI tools (pac CLI, az CLI, Fabric REST API, Graph API, Power Automate REST, Stripe API, Firebase) each with different auth models, rate limits, and error formats.
**Current Implementation**: Each agent invokes its own CLI tools through MCP servers with per-tool configuration.
**Enhancement**: Unify tool invocations under a structured tool registry: each tool declares its auth method, rate limit budget, retry policy, and error normalization rules. Agents request tool execution through the registry rather than calling CLIs directly, enabling centralized audit logging, rate limit tracking, and graceful degradation when a tool is unavailable.

### Exception Handling
**Relevance**: Partial deployment failures in a live multi-tenant Microsoft environment can leave tenants in broken states — orphaned Entra objects, half-provisioned Dataverse environments, dangling Fabric capacities.
**Current Implementation**: Hooks (`audit-azure-provisioning.sh`, `tenant-isolation-validator.sh`) provide post-hoc auditing but no structured recovery.
**Enhancement**: Define recovery procedures for each failure class: Entra provisioning failure → clean up partial objects and re-run identity phase; Dataverse solution import failure → delete environment and re-provision from solution export; Fabric workspace failure → release capacity and retry with smaller initial allocation. Wrap every deployment step in try/catch with the recovery procedure registered before execution starts.

### Guardrails
**Relevance**: TVS operates under HIPAA compliance requirements with strict tenant isolation, PII data handling rules, and identity governance policies across three entities.
**Current Implementation**: 14 hooks enforce compliance checks (hipaa-config-guard.sh, identity-policy-engine.sh, audit-* hooks, tenant-isolation-validator.sh, taia-winddown-guard.sh).
**Enhancement**: Elevate guardrails from reactive hooks to proactive pre-flight checks. Before any deployment command executes, run the full guardrail suite in read-only mode and present a compliance report. Deployment proceeds only if all HIPAA, DLP, and tenant-isolation checks pass. Integrate guardrail results into the deployment plan as compliance attestation records.

### HITL (Human-in-the-Loop)
**Relevance**: Deployment to production Microsoft tenants (especially identity changes, data migrations, and cost-incurring Azure resources) requires explicit administrator approval.
**Current Implementation**: HITL is partially addressed through Planner task creation (`orchestrate-planner`), but no formal approval gate exists in the deployment pipeline.
**Enhancement**: Insert approval gates at three points: (1) after planning, before resource provisioning; (2) before identity changes that affect production Entra groups; (3) before any operation estimated to exceed $500 Azure cost. Present a structured approval request with change summary, risk assessment, and estimated cost. Log approval with timestamp, approver identity, and the approved plan hash.

### Multi-Agent
**Relevance**: 19 specialized agents handle distinct Microsoft platform domains — identity, data, platform, Azure, GitHub, communications, analytics, carrier normalization, consulting CRM, and browser automation.
**Current Implementation**: Agents are defined with clear scopes but coordination between them during complex deployments is implicit.
**Enhancement**: Implement an orchestration layer that maps deployment phases to agent assignments. Enable parallel execution where agents have no shared resource dependencies (e.g., analytics-agent and comms-agent can configure their services simultaneously after identity is established). Use a shared deployment context object to prevent agents from making conflicting changes to shared resources.

### Memory
**Relevance**: Deployment state (which resources are provisioned, which tenants are active, what versions are deployed, what the last-known-good configuration was) must persist across sessions and be accessible to all 19 agents.
**Current Implementation**: State is tracked implicitly through Azure resource existence and Power Platform environment status.
**Enhancement**: Maintain a structured deployment ledger (`.claude/tvs-deployment-state.json`) updated atomically after each successful deployment step. The ledger records: resource IDs, provisioned versions, compliance attestations, and rollback snapshots. All agents read the ledger at startup and write updates on completion, eliminating redundant live queries and enabling precise rollback to any previous state.

### A2A (Agent-to-Agent)
**Relevance**: The MCP server enables Graph API, Dataverse, Fabric, and Planner communication — effectively agent-to-agent messaging through the Microsoft platform itself.
**Current Implementation**: The MCP server (`mcp-server/src/index.ts`) exposes tools for cross-platform operations.
**Enhancement**: Formalize A2A contracts between agents: identity-agent publishes group membership events that data-agent and platform-agent subscribe to; analytics-agent publishes health metrics that the orchestrator uses to gate progression; comms-agent sends deployment notifications triggered by state transitions in other agents. Use the MCP server as the message bus for these inter-agent events.

### Routing
**Relevance**: Deployment commands must be directed to the correct entity (TVS Holdings, TAIA Insurance, Consulting) and the correct platform tier (dev/staging/prod) based on context.
**Current Implementation**: Entity and environment context is passed as command arguments and environment variables.
**Enhancement**: Implement a routing resolver that maps `(entity, environment, operation-type)` to `(agent, tool-set, compliance-profile)`. The resolver reads from a routing table that can be updated without code changes, making it easy to add new entities or redirect traffic to different environments during incident response.

### Resource-Aware
**Relevance**: Azure services, Power Platform capacities, and Fabric workspaces have real dollar costs. The `cost-report` command provides visibility but not pre-deployment cost controls.
**Current Implementation**: `cost-report` queries Azure Cost Management after spend occurs.
**Enhancement**: Before provisioning any Azure resource, query the resource pricing API and accumulate projected costs for the full deployment plan. If projected cost exceeds a configurable budget threshold, pause and present a cost breakdown for approval. During deployment, track actual vs. projected spend and alert if actual cost diverges by more than 20%. Integrate cost awareness into the deployment plan as a first-class constraint alongside compliance requirements.

## Pattern Interaction Map

```
Deploy Command
      │
      ▼
[Routing] ── resolve entity + environment + compliance profile
      │
      ▼
[Planning] ── generate deployment plan (JSON)
      │        ├── resource dependency graph
      │        ├── cost projection
      │        └── compliance checkpoints
      │
      ▼
[Guardrails] ── pre-flight HIPAA/DLP/tenant-isolation checks
      │
      ▼
[HITL] ── approval gate (plan + cost + risk)
      │
      ▼
[Prompt Chaining] ── phased execution pipeline
  Phase 1: Identity (identity-agent)
      │
  Phase 2: Data (data-agent + ingest-agent) ──────────── [A2A] ◄── identity events
      │
  Phase 3: Platform (platform-agent) ─────────────────── [A2A] ◄── data ready events
      │
  Phase 4: Azure + GitHub (parallel) ─────────────────── [A2A] ◄── platform events
  ┌───┴────────────────────────┐
  ▼                            ▼
azure-agent              github-agent
      │
  Phase 5: Analytics + Comms (parallel)
  ┌───┴────────────────────────┐
  ▼                            ▼
analytics-agent          comms-agent
      │
      ▼
[Tool Use] ── pac CLI / az CLI / Fabric REST / Graph API / Power Automate / Stripe / Firebase
      │
      ▼
[Exception Handling] ── per-phase recovery procedures
      │
      ▼
[Memory] ── update deployment ledger (atomic write)
      │
      ▼
[Resource-Aware] ── actual vs. projected cost reconciliation
      │
      ▼
Deployment Complete + Compliance Attestation Record
```

## References
- Gulli, A. & Sauco, M. (2025). Agentic Design Patterns.
- Repository: github.com/Mathews-Tom/Agentic-Design-Patterns
