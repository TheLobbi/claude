---
name: agentic-patterns
description: "Patterns from \"Agentic Design Patterns\" (Gulli & Sauco, 2025) applied to full-stack development and infrastructure-as-code automation"
---

# Agentic Design Patterns — Fullstack IaC

> Patterns from "Agentic Design Patterns" (Gulli & Sauco, 2025) applied to full-stack development and infrastructure-as-code automation

## Applied Patterns

### Prompt Chaining
**Relevance**: Infrastructure provisioning is inherently sequential and stateful — network must exist before subnets, subnets before compute, compute before application deployment, application before smoke tests. Skipping or reordering steps causes hard-to-debug failures.
**Current Implementation**: Commands like `infra`, `ansible`, `k8s`, and `docker` handle discrete provisioning stages. Users orchestrate them manually.
**Enhancement**: Formalise a provisioning chain: (1) architecture planning → decompose the target stack into layers; (2) dependency resolution → topological sort of resources; (3) Terraform plan → generate and validate IaC; (4) infrastructure apply → execute with state tracking; (5) configuration management → Ansible playbook execution; (6) container deployment → Kubernetes manifests applied; (7) health verification → smoke tests and readiness probes. Each step receives the previous step's output (state file, inventory, kubeconfig) and produces structured output for the next. Chain failures trigger targeted rollback, not full teardown.

### Planning
**Relevance**: Full-stack architecture decisions have long-lived consequences — choosing the wrong network topology, storage class, or IAM model is expensive to change after deployment. Upfront planning prevents costly rework.
**Current Implementation**: The `new` command scaffolds projects with opinionated defaults. The `infra` command generates Terraform from templates.
**Enhancement**: Add an architecture planning agent that produces a formal Architecture Decision Record (ADR) before any code or IaC is generated. The ADR covers: compute tier (VMs, containers, serverless), networking topology, storage strategy, IAM model, observability stack, and cost estimate. The agent presents the plan for human review and captures the approval before entering the provisioning chain.

### Tool Use
**Relevance**: The fullstack-iac domain spans multiple tool ecosystems: Terraform for cloud resources, Ansible for OS-level configuration, Docker for image builds, Kubernetes kubectl/helm for container orchestration, and platform CLIs (aws, az, gcloud) for provider-specific operations.
**Current Implementation**: Each command invokes its native toolchain. Commands are domain-specific wrappers.
**Enhancement**: Define a unified tool registry that maps infrastructure intents to tool invocations with typed parameters and expected exit codes. Agents query the registry rather than hardcoding tool calls. The registry enforces tool-specific constraints: Terraform always runs `plan` before `apply`, Ansible always uses `--check` before execution in production, Helm always uses `--atomic` to ensure rollback on failure. Failed tool calls return structured error objects (exit code, stderr, affected resource) rather than raw output.

### Exception Handling
**Relevance**: Infrastructure failures are diverse and require different responses: a Terraform state lock needs force-unlock; a failed Kubernetes rollout needs rollback; a timed-out Ansible task may indicate a networking issue rather than a playbook bug.
**Current Implementation**: Commands surface raw tool errors. No structured recovery logic exists beyond Helm's `--atomic` flag.
**Enhancement**: Implement a three-tier exception handler for infrastructure operations: (1) transient — timeout or rate limit, retry with back-off up to 3 times; (2) recoverable — resource conflict or state drift, attempt automatic reconciliation or targeted destroy+recreate; (3) fatal — security violation or state corruption, halt the chain, preserve state files, notify the operator, and produce a remediation runbook. All exceptions are logged with resource ID, tool, operation, and timestamp.

### Guardrails
**Relevance**: Infrastructure code runs with elevated cloud permissions. Mistakes — opening port 0.0.0.0/0 to the internet, deploying to production without approval, deleting non-empty S3 buckets — can cause data loss or security incidents.
**Current Implementation**: No programmatic safety constraints exist beyond individual tool safeguards (e.g., Terraform's `-target` flag).
**Enhancement**: Define a guardrail policy engine that intercepts all IaC operations before execution. Policies include: block any security group rule with source `0.0.0.0/0` on ports below 1024 except 80/443; block `terraform destroy` on resources tagged `env=production` without explicit override; block any IAM policy with `*` actions without HITL approval; enforce mandatory tags (env, owner, cost-center) on all resources. Guardrails produce structured violations with policy name, resource, and remediation hint.

### Human-in-the-Loop (HITL)
**Relevance**: Infrastructure changes — especially in production — warrant explicit human approval. Automated agents should not provision or destroy cloud resources without a human checkpoint.
**Current Implementation**: The `infra` command supports a `--dry-run` flag that produces a Terraform plan. Approval is implicit (user runs the next command).
**Enhancement**: Implement a formal HITL gate after the planning and `terraform plan` phases. The agent renders a human-readable change summary: resources to create/modify/destroy, estimated cost delta, security impact, and rollback complexity. The gate waits for explicit approval (yes/no/modify) before proceeding. Rejections capture a reason that feeds back into the planning agent for revision. For high-risk operations (production destroy, IAM changes), require two-person approval.

### Multi-Agent
**Relevance**: Full-stack infrastructure spans genuinely separate domains of expertise: frontend hosting and CDN, backend API and database, infrastructure networking and security, CI/CD pipelines. These benefit from parallel specialist agents rather than a single generalist.
**Current Implementation**: Commands are domain-specific (`frontend`, `api`, `infra`, `k8s`, `ansible`) but execute in isolation. No coordination exists between them.
**Enhancement**: Implement a multi-agent orchestration layer with four specialist agents: (1) Frontend Agent — React/Vite build optimisation, CDN configuration, static asset deployment; (2) Backend Agent — FastAPI service scaffolding, database migration, API gateway configuration; (3) Infrastructure Agent — Terraform networking, compute, IAM, storage; (4) CI/CD Agent — pipeline definition, secret management, deployment automation. An Orchestrator Agent decomposes the user's request, assigns work to specialists in dependency order, merges their outputs, and resolves conflicts (e.g., both frontend and backend agents trying to configure the same DNS zone).

### Evaluation
**Relevance**: Infrastructure health degrades silently — resource costs creep up, security posture drifts, performance baselines shift, and unused resources accumulate. Without continuous evaluation, the infrastructure diverges from its intended state.
**Current Implementation**: No ongoing evaluation or drift detection exists beyond one-time deployment validation.
**Enhancement**: Add an infrastructure evaluation agent that runs periodic assessments across four dimensions: (1) health — compare live resource state against Terraform state, flag drift; (2) security — scan IAM policies, security groups, and exposed endpoints against CIS benchmarks; (3) cost — identify untagged, idle, or over-provisioned resources; (4) performance — compare current metrics against baseline thresholds. Evaluations produce structured reports with severity scores and remediation recommendations. Critical findings trigger automated alerts via the HITL channel.

## Pattern Interaction Map

```
User Request / Architecture Brief
        │
        ▼
   [MULTI-AGENT] ──── Orchestrator decomposes work
        │
        ├─ Frontend Agent ─┐
        ├─ Backend Agent  ─┤─► [PLANNING] ──► ADR + dependency graph
        ├─ Infra Agent    ─┘
        └─ CI/CD Agent ───┐
                          │
                          ▼
                    [GUARDRAILS] ──── policy check on all IaC
                          │
                          ▼
                    [HITL] ──── human approval gate
                          │
                          ▼
              [PROMPT CHAINING] ──── ordered provisioning pipeline
                    │
                    ├─ [TOOL USE] ──── Terraform / Ansible / Helm / kubectl
                    │
                    ├─ [EXCEPTION HANDLING] ──── tier-1/2/3 recovery
                    │
                    └─ [EVALUATION] ──── continuous health / drift monitoring
                                            │
                                            └─ findings feed back to [PLANNING]
```

Key interactions:
- **Multi-Agent + Planning**: Each specialist agent produces its own plan fragment; the Orchestrator merges them into a unified dependency-ordered plan.
- **Guardrails + HITL**: Guardrails block clearly unsafe operations outright; borderline operations are escalated to HITL for human decision.
- **Prompt Chaining + Exception Handling**: The provisioning chain's error handling determines whether to retry, recover, or halt and invoke HITL.
- **Tool Use + Guardrails**: The guardrail engine intercepts tool calls before execution, not after.
- **Evaluation + Planning**: Evaluation findings (drift, cost anomalies, security gaps) are fed back as inputs to the next planning cycle, creating a continuous improvement loop.

## References
- Gulli, A. & Sauco, M. (2025). *Agentic Design Patterns*. O'Reilly Media.
- Repository: github.com/Mathews-Tom/Agentic-Design-Patterns
- Terraform: https://developer.hashicorp.com/terraform/docs
- Ansible: https://docs.ansible.com
- Kubernetes: https://kubernetes.io/docs
