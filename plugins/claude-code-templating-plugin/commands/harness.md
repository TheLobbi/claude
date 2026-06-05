---
name: harness
intent: Harness CI/CD operations - create and validate pipelines, manage templates (step/stage/pipeline), list templates, and trigger deployments
tags:
  - harness
  - cicd
  - pipeline
  - deployment
  - template
inputs: []
risk: medium
cost: medium
description: Harness CI/CD operations - create and validate pipelines, manage templates (step/stage/pipeline), list templates, and trigger deployments
model: sonnet
---

# Harness CI/CD Command

Create, validate, and manage Harness pipelines and templates with comprehensive CI/CD workflows.

## Overview

The `/harness` command provides a complete interface for Harness CI/CD operations including pipeline creation, template management, validation, and deployment triggering.

---

## Subcommands

### 1. `/harness pipeline create <name>`

Create a new Harness pipeline from templates or scratch.

**Syntax:**
```bash
/harness pipeline create <pipeline_name> [options]
```

**Options:**
```
--template <template>   Use pipeline template (standard-cicd, gitops, canary, blue-green)
--org <org_id>         Harness organization ID
--project <proj_id>    Harness project ID
--service <service_id> Service to deploy (optional)
--environment <env>    Environment (dev, staging, prod)
--repo <repo_url>      Source code repository
--branch <branch>      Default branch (default: main)
--dockerfile <path>    Dockerfile path (for Docker builds)
--registry <registry>  Docker registry connector
--output <file>        Save pipeline to file
--dry-run              Preview without creating
--interactive          Interactive configuration
```

**Example 1: Standard CI/CD Pipeline**

```bash
/harness pipeline create my-service-pipeline \
  --template standard-cicd \
  --org my-harness-org \
  --project my-project \
  --service my-service \
  --repo https://github.com/mycompany/my-service \
  --branch main \
  --registry docker-registry-connector
```

Output:
```
✓ Creating pipeline: my-service-pipeline
✓ Organization: my-harness-org
✓ Project: my-project
✓ Template: standard-cicd

Configuration:
  Service: my-service
  Source Repo: https://github.com/mycompany/my-service
  Branch: main
  Build Registry: docker-registry-connector

Pipeline Stages:
  1. Build & Test
     - Source: GitHub
     - Build: Docker
     - Test: Jest/pytest
     - Push: Docker registry

  2. Deploy Dev
     - Cluster: dev-cluster
     - Strategy: Rolling update
     - Approval: Automatic

  3. Deploy Staging
     - Cluster: staging-cluster
     - Strategy: Rolling update
     - Approval: Automatic

  4. Manual Approval
     - Approvers: [DevOps team]

  5. Deploy Production
     - Cluster: prod-cluster
     - Strategy: Blue-Green
     - Approval: Required

✓ Pipeline created successfully
Pipeline ID: my-service-pipeline-001
Harness URL: https://harness.company.com/pipeline/my-service-pipeline-001
```

**Example 2: GitOps Pipeline**

```bash
/harness pipeline create order-service-gitops \
  --template gitops \
  --service order-service \
  --environment dev,staging,prod \
  --manifest-repo https://github.com/mycompany/manifests \
  --gitops-connector argocd
```

**Example 3: Canary Deployment**

```bash
/harness pipeline create payment-service-canary \
  --template canary \
  --service payment-service \
  --canary-percentage 10 \
  --verify-duration 300 \
  --environment prod
```

---

### 2. `/harness pipeline validate <file>`

Validate a Harness pipeline YAML configuration.

**Syntax:**
```bash
/harness pipeline validate <path> [options]
```

**Options:**
```
--strict               Enforce strict validation rules
--check-references    Verify all resource references exist
--show-warnings       Show all warnings
--fix-inline          Suggest inline fixes
--output <file>       Save validation report
```

**Example:**

```bash
/harness pipeline validate ./harness/pipeline.yaml --strict
```

Output:
```
Validating: ./harness/pipeline.yaml

Configuration:
  Name: my-service-pipeline
  Type: Pipeline
  Version: 1

✓ Syntax: Valid YAML
✓ Structure: Valid Harness format
✓ Stages: 5 stages (all valid)
✓ Steps: 12 steps (all valid)
✓ Expressions: 8 expressions (all valid)

References:
  ✓ Service: my-service (exists in project)
  ✓ Environments: dev (exists), staging (exists), prod (exists)
  ✓ Connectors: docker-registry (exists), k8s-cluster-dev (exists)
  ✓ Variables: All 6 variables defined
  ✓ Secrets: All 3 secrets accessible

Security:
  ✓ No hardcoded secrets
  ✓ RBAC checks passed
  ✓ Resource group restrictions valid

Best Practices:
  ⚠ Warning: No approval gate on production deployment
    Recommendation: Add manual approval step before prod

Overall: PASSED
  Valid: 100%
  Issues: 0 errors, 1 warning
```

---

### 3. `/harness template create <type> <name>`

Create a reusable Harness template (step, stage, or pipeline).

**Syntax:**
```bash
/harness template create <template_type> <template_name> [options]
```

**Template Types:**
```
step            - Reusable step configuration
stage           - Reusable stage definition
pipeline        - Reusable pipeline template
stepgroup       - Group of related steps
```

**Options:**
```
--type <type>          Template type (step, stage, pipeline, stepgroup)
--description <desc>   Template description
--version <version>    Initial version (default: 1.0.0)
--org <org_id>        Organization scope (default: account-level)
--project <proj_id>   Project scope (optional)
--icon <icon>         Template icon
--inputs <file>       Variable definitions file
--output <file>       Save template to file
--interactive         Interactive template builder
```

**Example 1: Deploy to Kubernetes Step Template**

```bash
/harness template create step deploy-kubernetes \
  --description "Deploy service to Kubernetes cluster" \
  --version 1.0.0 \
  --inputs ~/templates/k8s-deploy-inputs.yaml
```

Template inputs file:
```yaml
# k8s-deploy-inputs.yaml
inputs:
  - name: service_name
    type: string
    required: true
    description: Service name to deploy

  - name: namespace
    type: string
    default: default
    description: Kubernetes namespace

  - name: replicas
    type: int
    default: 3
    description: Number of replicas

  - name: image_tag
    type: string
    required: true
    description: Docker image tag

  - name: timeout_minutes
    type: int
    default: 10
    description: Deployment timeout
```

Output:
```
✓ Creating step template: deploy-kubernetes
✓ Version: 1.0.0
✓ Type: Step
✓ Scope: Account-level

Template Configuration:
  Name: deploy-kubernetes
  Description: Deploy service to Kubernetes cluster

  Inputs (5):
    - service_name (String, required)
    - namespace (String, default: default)
    - replicas (Integer, default: 3)
    - image_tag (String, required)
    - timeout_minutes (Integer, default: 10)

✓ Template created successfully
Template ID: step-deploy-kubernetes-1-0-0
Reference: {{.Values.template.deploy_kubernetes}}
```

**Example 2: Build and Push Stage Template**

```bash
/harness template create stage build-and-push \
  --description "Build Docker image and push to registry" \
  --version 2.0.0
```

**Example 3: Complete CI/CD Pipeline Template**

```bash
/harness template create pipeline standard-cicd-pipeline \
  --description "Standard CI/CD pipeline with build, test, and deploy" \
  --version 1.0.0 \
  --org my-org
```

---

### 4. `/harness template list`

List all available Harness templates.

**Syntax:**
```bash
/harness template list [options]
```

**Options:**
```
--type <type>          Filter by type (step, stage, pipeline)
--scope <scope>        Filter by scope (account, org, project)
--org <org_id>        Organization ID
--project <proj_id>   Project ID
--search <query>      Search templates by name/description
--sort <field>        Sort by: name, updated, downloads
```

**Example:**

```bash
/harness template list --type step
```

Output:
```
Available Step Templates

Account-Level (12 templates):

Deployment:
  ✓ deploy-kubernetes (v2.1.0)
    Description: Deploy to Kubernetes cluster
    Updated: 2 weeks ago
    Uses: 34

  ✓ deploy-ecs (v1.5.0)
    Description: Deploy to AWS ECS
    Updated: 1 month ago
    Uses: 18

  ✓ deploy-lambda (v1.0.0)
    Description: Deploy to AWS Lambda
    Updated: 2 months ago
    Uses: 8

Build & Test:
  ✓ build-docker (v3.0.0)
    Description: Build Docker image
    Updated: 1 week ago
    Uses: 52

  ✓ run-tests (v1.2.0)
    Description: Run test suite with coverage
    Updated: 2 weeks ago
    Uses: 41

  ✓ code-analysis (v2.1.0)
    Description: Run SonarQube code analysis
    Updated: 3 weeks ago
    Uses: 27

Notifications:
  ✓ notify-slack (v1.0.0)
    Description: Send Slack notification
    Updated: 1 month ago
    Uses: 31

  ✓ notify-email (v1.0.0)
    Description: Send email notification
    Updated: 1 month ago
    Uses: 19

Organization-Level (5 templates):
  [List shows org-specific templates]

Project-Level (2 templates):
  [List shows project-specific templates]
```

---

### 5. `/harness deploy <pipeline>`

Trigger a deployment pipeline execution.

**Syntax:**
```bash
/harness deploy <pipeline_name_or_id> [options]
```

**Options:**
```
--environment <env>    Target environment
--branch <branch>      Source branch
--tag <tag>           Artifact tag/version
--vars <file|json>    Pipeline variables (YAML/JSON)
--async               Don't wait for completion
--timeout <seconds>   Execution timeout
--wait-for <status>   Wait until status (Success, Failed, etc.)
```

**Example 1: Deploy to Development**

```bash
/harness deploy my-service-pipeline --environment dev
```

Output:
```
Triggering pipeline: my-service-pipeline
Environment: dev
Branch: main

Pipeline Execution Details:
  Execution ID: exec-a1b2c3d4e5f6
  Pipeline: my-service-pipeline
  Status: Running
  Started: 2024-01-16 10:30:00 UTC

Stages:
  1. Build & Test
     Status: Running
     Progress: [████████░░] 80%

  2. Deploy Dev
     Status: Queued

  3. Approval
     Status: Not started

  4. Deploy Staging
     Status: Not started

Real-time Log Stream:
  [10:30:02] Starting build...
  [10:30:15] Dependencies installed
  [10:30:45] Build completed
  [10:31:00] Running tests...
  [10:31:30] Tests passed (42 tests, 0 failures)
  [10:31:45] Building Docker image...
  [10:32:15] Docker image built: my-service:dev-a1b2c3d
  [10:32:20] Pushing to registry...

Waiting for completion... (Ctrl+C to detach)
```

**Example 2: Deploy with Custom Variables**

```bash
/harness deploy order-service-pipeline \
  --environment prod \
  --vars deployment-vars.yml \
  --wait-for Success
```

Variables file:
```yaml
# deployment-vars.yml
replicas: 5
image_tag: "1.2.3"
enable_rollback: true
```

**Example 3: Async Deployment (Fire and Forget)**

```bash
/harness deploy payment-service-pipeline \
  --environment staging \
  --async
```

Output:
```
✓ Pipeline triggered
Execution ID: exec-xyz789
Status: In Progress
Check status at: https://harness.company.com/execution/exec-xyz789
```

---

## Common Workflows

### Workflow 1: Create and Deploy Pipeline

```bash
# 1. Create pipeline from template
/harness pipeline create my-service \
  --template standard-cicd \
  --service my-service \
  --repo https://github.com/mycompany/my-service

# 2. Validate pipeline
/harness pipeline validate harness/pipeline.yaml --strict

# 3. Trigger deployment
/harness deploy my-service --environment dev
```

### Workflow 2: Create and Use Custom Templates

```bash
# 1. Create custom step template
/harness template create step deploy-custom \
  --description "Custom deployment step"

# 2. List templates to verify
/harness template list --type step

# 3. Use in pipeline
/harness pipeline create app-pipeline --template standard-cicd
```

### Workflow 3: Validate and Deploy

```bash
# 1. Validate pipeline locally
/harness pipeline validate ./harness/pipeline.yaml --strict

# 2. Deploy to dev
/harness deploy my-pipeline --environment dev

# 3. Monitor execution
/harness deploy my-pipeline --environment dev --wait-for Success
```

---

## Pipeline Templates Reference

### Standard CI/CD

**Description:** Build → Test → Deploy Dev → Approve → Deploy Staging → Deploy Prod

**Use When:** Standard application deployment

```bash
/harness pipeline create my-app \
  --template standard-cicd \
  --service my-app
```

---

### GitOps

**Description:** Build image → Push manifest → ArgoCD syncs

**Use When:** GitOps deployment approach with Argo CD

```bash
/harness pipeline create my-app-gitops \
  --template gitops \
  --gitops-connector argocd
```

---

### Canary Deployment

**Description:** Deploy 5% → Verify → 25% → Verify → 100%

**Use When:** Risk-reducing gradual deployments

```bash
/harness pipeline create my-app-canary \
  --template canary \
  --canary-percentage 5
```

---

### Blue-Green Deployment

**Description:** Deploy to inactive → Verify → Switch → Cleanup

**Use When:** Zero-downtime deployments with instant rollback

```bash
/harness pipeline create my-app-blue-green \
  --template blue-green
```

---

## Best Practices

1. **Always validate before deploying:** Use `pipeline validate --strict`
2. **Use templates for consistency:** Don't create pipelines from scratch
3. **Version your templates:** Follow semantic versioning
4. **Document variables:** Clearly define all pipeline inputs
5. **Test in dev first:** Always validate in lower environments
6. **Monitor deployments:** Use `--wait-for Success` for critical deployments
7. **Review execution logs:** Check real-time logs during deployment

---

## Integration with Other Commands

```bash
# Scaffold with Harness integration
/scaffold nodejs-app my-app --harness

# Validate after scaffolding
/harness pipeline validate ./harness/pipeline.yaml

# Deploy from scaffolded project
/harness deploy my-app --environment dev
```

---

## Error Reference

| Error | Solution |
|-------|----------|
| Service not found | Create service in Harness first |
| Invalid environment | Check environment exists in project |
| Connector not found | Create and configure connector |
| Insufficient permissions | Check RBAC roles and permissions |
| Pipeline validation failed | Review error details and fix YAML |

---

## See Also

- **`/scaffold`** - Scaffold projects with Harness integration
- **`/template`** - Template management
- **`/generate`** - Code generation

---

**⚓ Golden Armada** | *You ask - The Fleet Ships*
