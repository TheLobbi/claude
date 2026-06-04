---
name: agentic-patterns
description: "Patterns from \"Agentic Design Patterns\" (Gulli & Sauco, 2025) applied to cloud-native Kubernetes infrastructure, authentication, and CI/CD orchestration."
---

# Agentic Design Patterns — AWS EKS Helm Keycloak

> Patterns from "Agentic Design Patterns" (Gulli & Sauco, 2025) applied to cloud-native Kubernetes infrastructure, authentication, and CI/CD orchestration.

## Applied Patterns

### Prompt Chaining
**Relevance**: EKS cluster provisioning is a multi-step pipeline where each step's output feeds the next — VPC → EKS → node groups → Helm releases → Keycloak realms.
**Current Implementation**: The `setup` and `ship` commands execute sequential AWS CLI, Terraform, and Helm steps, passing cluster context between them.
**Enhancement**: Make the chain explicit with typed handoff contracts. Each step emits a structured context object (cluster ARN, kubeconfig path, namespace map) that the next step validates before proceeding. Failed steps trigger the Exception Handling pattern rather than silent failure.

### Planning
**Relevance**: Kubernetes architecture decisions — node sizing, namespace layout, RBAC structure, ingress topology — require upfront planning before any `kubectl apply`.
**Current Implementation**: The `pipeline-scaffold` command scaffolds a deployment plan, and `service-onboard` pre-validates service requirements.
**Enhancement**: Add an explicit planning phase that generates a deployment plan document (cluster topology, resource estimates, dependency graph) before any infrastructure changes. The plan is reviewed (HITL) or auto-approved based on scope.

### Tool Use
**Relevance**: The plugin orchestrates three distinct tool ecosystems: AWS CLI (EKS, ECR, IAM), Helm (chart management), and kubectl (live cluster operations). Each has different auth models and failure modes.
**Current Implementation**: Commands invoke these tools directly via shell. The `debug` command aggregates multi-tool output.
**Enhancement**: Wrap each tool family in a typed interface that normalizes errors, retries transient failures (API throttling), and logs invocations for audit. Tools become composable units rather than raw shell calls.

### Exception Handling
**Relevance**: Cluster provisioning failures (node group scaling, Helm timeout, Keycloak pod crash) must be caught, classified, and either auto-recovered or escalated — never silently ignored.
**Current Implementation**: Basic error checking exists in ship scripts; manual debug is required for deeper issues.
**Enhancement**: Classify exceptions into recoverable (Helm rollback, node drain/replace), escalatable (IAM permission denial, quota exceeded), and fatal (corrupt etcd). Each class has a defined recovery runbook that the agent can execute autonomously up to a configurable confidence threshold.

### Guardrails
**Relevance**: RBAC misconfiguration, OIDC trust policy errors, or overly permissive Keycloak roles can create security vulnerabilities in production clusters.
**Current Implementation**: The plugin enforces OIDC-based auth and namespace isolation by convention.
**Enhancement**: Add pre-flight guardrail checks before any `helm upgrade` or `kubectl apply`: validate RBAC role bindings against a least-privilege baseline, verify Keycloak realm configuration against security policy, and block deployments that would expose cluster-admin permissions to service accounts.

### Human-in-the-Loop (HITL)
**Relevance**: Production cluster changes — node pool scaling, Keycloak realm migration, namespace deletion — carry blast radius that warrants human approval before execution.
**Current Implementation**: The `ship` command has a preview mode; manual confirmation is implicit.
**Enhancement**: Formalize HITL checkpoints: generate a diff of all planned changes, present cost/risk impact, and require explicit approval (`/ship --approve`) before the destructive phase. Dry-run output is always shown first; auto-approve is only allowed for non-destructive changes.

### Multi-Agent
**Relevance**: Infrastructure provisioning (AWS), application deployment (Helm/K8s), and identity configuration (Keycloak) are distinct domains that can be parallelized and independently validated.
**Current Implementation**: All operations run sequentially in a single agent context.
**Enhancement**: Split into three specialized subagents — `infra-agent` (VPC/EKS/IAM), `deploy-agent` (Helm releases, rollouts), `auth-agent` (Keycloak realms, OIDC, client configs). The orchestrator agent coordinates handoffs, validates cross-domain contracts, and merges results. Failures in one subagent do not block independent work in others.

### Resource-Aware
**Relevance**: EKS node groups, NAT gateways, load balancers, and Keycloak replicas all have real cost implications. Poor resource choices compound at scale.
**Current Implementation**: Resource requests/limits are defined in Helm values; cost is not surfaced to the developer.
**Enhancement**: Before any provisioning, compute estimated monthly cost (AWS Pricing API) for the proposed configuration. Flag configurations that exceed budget thresholds. Suggest Spot instances for non-critical workloads. After deployment, surface actual vs. estimated cost in the `debug` command output.

### Evaluation
**Relevance**: A deployed cluster must continuously be assessed for health: node readiness, pod crash loops, Keycloak auth latency, certificate expiry, and Helm release drift.
**Current Implementation**: The `debug` command provides point-in-time diagnostics.
**Enhancement**: Implement a structured evaluation loop: collect metrics (kubectl top, Keycloak metrics endpoint, Helm status), score cluster health (0–100), classify degraded components, and emit structured findings. The agent can act on findings autonomously (restart crashed pods, rotate expiring certs) or surface them with recommended actions.

## Pattern Interaction Map

```
Planning ──────────────────────────────────────────┐
    │                                               │
    ▼                                               ▼
Prompt Chaining ──► Tool Use ──► Exception Handling ──► HITL
    │                   │                               │
    │               Guardrails                          │
    │               (pre-flight)                        │
    ▼                                               ▼
Multi-Agent ◄──────────────────────────────── Resource-Aware
    │
    ▼
Evaluation (continuous post-deploy loop)
```

**Key interactions**:
- **Planning → Prompt Chaining**: The plan becomes the chain definition — steps, contracts, rollback points.
- **Tool Use + Exception Handling**: Every tool invocation is wrapped; exceptions feed back into the chain or trigger HITL.
- **Guardrails gate HITL**: Security violations block the approval checkpoint; human cannot override guardrail failures without an explicit override flag.
- **Multi-Agent feeds Evaluation**: Each subagent reports its domain health; the orchestrator aggregates into a unified cluster score.
- **Resource-Aware informs Planning**: Cost estimates are generated during planning so resource decisions are made before provisioning, not after.

## References
- Gulli, A. & Sauco, M. (2025). *Agentic Design Patterns*.
- Repository: github.com/Mathews-Tom/Agentic-Design-Patterns
