---
name: agentic-patterns
description: "Patterns from \"Agentic Design Patterns\" (Gulli & Sauco, 2025) applied to multi-tenant MERN platform management and Keycloak orchestration"
---

# Agentic Design Patterns — Lobbi Platform Manager

> Patterns from "Agentic Design Patterns" (Gulli & Sauco, 2025) applied to multi-tenant MERN platform management and Keycloak orchestration

## Applied Patterns

### Multi-Agent
**Relevance**: The platform coordinates Keycloak, MongoDB, Node.js microservices, Docker, and test infrastructure — each requiring specialized operational knowledge.
**Current Implementation**: Commands like `keycloak-setup`, `service`, and `test-gen` are handled by discrete command handlers without explicit agent coordination.
**Enhancement**: Formalize a small fleet of specialized agents: a `keycloak-agent` (realm/client/role management), a `service-agent` (container orchestration), a `test-agent` (test generation and execution), and a `health-agent` (monitoring). A coordinator dispatches cross-cutting operations to the appropriate specialist and merges results.

### Tool Use
**Relevance**: Platform operations span Keycloak Admin REST API, Docker CLI, MongoDB connection strings, and Node.js package management — each with distinct authentication and error models.
**Current Implementation**: Commands invoke platform APIs through direct shell calls and environment variable configuration.
**Enhancement**: Wrap each external system as a typed tool with structured inputs/outputs, retry logic, and normalized error responses. Tool selection is explicit and logged, making operations reproducible and debuggable across environments.

### Exception Handling
**Relevance**: Service failures during platform operations (Keycloak realm import failure, container crash, DB migration error) must not leave the platform in a partial state.
**Current Implementation**: Error messages surface to the user but no structured recovery path is defined.
**Enhancement**: Define failure modes per operation with explicit recovery actions: Keycloak import failure → rollback realm to last-known-good snapshot; service start failure → drain connections and restart with previous image; DB migration error → apply down-migration script. Capture all exceptions with operation context for post-mortem analysis.

### Guardrails
**Relevance**: Keycloak misconfigurations (open redirect URIs, disabled MFA, over-permissioned roles) and service misconfigurations can expose the multi-tenant platform to auth bypass or data leakage.
**Current Implementation**: Validation is limited to schema checks in `env-validate`.
**Enhancement**: Add a platform safety layer that enforces: no wildcard redirect URIs in production realms, MFA required for admin roles, service containers never run as root, environment files never contain production secrets in development configs. Run guardrails before any write operation, not just on explicit validate commands.

### Memory
**Relevance**: Platform state (realm configurations, service topology, deployed versions, known-good snapshots) must be preserved across sessions and shared between agents.
**Current Implementation**: State is inferred from live system inspection on each command invocation.
**Enhancement**: Maintain a lightweight platform state file (`.claude/platform-state.json`) updated after each successful operation. Agents read this state at startup rather than re-querying the live system for every decision. Include realm checksums, service health timestamps, and last-validated environment hashes.

### HITL (Human-in-the-Loop)
**Relevance**: Destructive platform operations — realm deletion, production service restart, database migration — require explicit human approval before execution.
**Current Implementation**: No approval gate; commands execute immediately when invoked.
**Enhancement**: Classify operations by risk tier (read / write / destructive). For destructive operations, present a structured impact summary (what will change, what will be unreachable, estimated downtime) and require explicit confirmation (`yes/[operation-id]`) before proceeding. Log approval events with timestamp and operator identity.

### Routing
**Relevance**: Incoming service requests must be directed to the correct microservice handler, Keycloak realm, or infrastructure target based on tenant context and request type.
**Current Implementation**: Routing is hardcoded within individual command handlers.
**Enhancement**: Introduce a routing decision layer that resolves: which realm handles this tenant, which service owns this endpoint, which Docker network applies. Store routing rules in a config file so they can be updated without modifying command code. Emit routing decisions to the audit log.

### Planning
**Relevance**: Platform lifecycle operations (initial setup, tenant onboarding, major version upgrades) span many ordered steps with dependencies between them.
**Current Implementation**: Multi-step operations are described in command documentation but not enforced programmatically.
**Enhancement**: Generate an operation plan before execution — an ordered list of steps with pre-conditions, post-conditions, and rollback actions for each. Visualize the plan for operator review. Execute steps sequentially, checking post-conditions before advancing. Pause and request guidance if a post-condition fails.

### Evaluation
**Relevance**: The `test-gen` command generates tests, but generated test quality and platform health need continuous evaluation to ensure coverage is meaningful.
**Current Implementation**: Tests are generated on demand; health checks are point-in-time via `health` command.
**Enhancement**: After test generation, run a coverage evaluation pass: check that critical auth flows (login, token refresh, role assertion) are covered, that generated tests actually execute against a running service, and that health checks are integrated into the CI pipeline. Score test quality and surface gaps as actionable findings.

## Pattern Interaction Map

```
Incoming Operation Request
          │
          ▼
     [Routing] ── resolve tenant/realm/service target
          │
          ▼
     [Planning] ── generate ordered operation plan
          │
          ▼
     [HITL] ── approval gate for destructive ops
          │
          ▼
   [Multi-Agent Dispatch]
   ┌──────┬──────────┬──────────┬──────────┐
   │      │          │          │          │
   ▼      ▼          ▼          ▼          ▼
keycloak service   test       health    [Tool Use]
-agent   -agent   -agent     -agent    Keycloak API
                                       Docker CLI
                                       MongoDB
          │
          ▼
  [Exception Handling] ── catch, recover, rollback
          │
          ▼
     [Memory] ── update platform state snapshot
          │
          ▼
  [Guardrails] ── post-op safety validation
          │
          ▼
  [Evaluation] ── test coverage / health scoring
          │
          ▼
    Result + Audit Log
```

## References
- Gulli, A. & Sauco, M. (2025). Agentic Design Patterns.
- Repository: github.com/Mathews-Tom/Agentic-Design-Patterns
