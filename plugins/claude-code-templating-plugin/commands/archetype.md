---
name: archetype
intent: Complete archetype lifecycle - analyze projects, create templates, scaffold new projects, register architecture, generate Harness templates, and export diagrams
tags:
  - archetype
  - template
  - scaffold
  - structurizr
  - harness
  - gradle
inputs: []
risk: medium
cost: medium
description: Complete archetype lifecycle - analyze projects, create templates, scaffold new projects, register architecture, generate Harness templates, and export diagrams
model: sonnet
---

# Archetype Command - Complete Lifecycle

The `/archetype` command manages the complete archetype lifecycle from project analysis to architecture registration, with full Harness template integration.

---

## Quick Reference

```bash
# Full workflow - project to production-ready archetype
/archetype create svc-membership --full-flow

# Analyze project for template conversion
/archetype analyze ./svc-membership

# Create archetype from existing project
/archetype create ./svc-membership --format copier,harness

# Scaffold new project from archetype
/archetype scaffold svc-template-fastapi my-new-service

# Register in Structurizr architecture
/archetype register my-new-service

# Export architecture diagrams
/archetype export --format mermaid,plantuml

# Generate Harness templates from archetype
/archetype harness-templates svc-template-fastapi
```

---

## Commands

### `analyze` - Project Analysis

Analyze an existing project to identify template conversion opportunities.

```bash
/archetype analyze <project-path> [options]
```

**Options:**
```
--output <file>        Output analysis report (default: stdout)
--format <fmt>         Report format: yaml, json, markdown (default: yaml)
--deep                 Include deep code analysis for variable detection
--structurizr          Include Structurizr metadata extraction
--harness              Analyze for Harness template opportunities
```

**Example:**
```bash
/archetype analyze ./svc-membership --deep --structurizr --harness
```

**Output:**
```yaml
project_analysis:
  name: svc-membership
  type: fastapi-service
  language: python
  version: "3.11"

  frameworks:
    - fastapi: "0.109.0"
    - beanie: "1.25.0"
    - pydantic: "2.5.0"

  variable_candidates:
    high_confidence:
      - name: project_name
        found_in: 12 files
        current_value: "svc-membership"
        suggested_type: string

      - name: service_port
        found_in: 4 files
        current_value: "8000"
        suggested_type: integer

    medium_confidence:
      - name: database_name
        found_in: 2 files
        current_value: "membership_service"

  structurizr_metadata:
    system: softwareSystem
    containers:
      - name: "Membership API"
        technology: "Python, FastAPI, Beanie"
        type: API
      - name: "Membership Database"
        technology: "MongoDB Atlas"
        type: Database
    relationships:
      - to: keycloak
        description: "Validates tokens"
        technology: "OAuth2/OIDC"
      - to: mongoAtlas
        description: "Stores data"
        technology: "MongoDB"

  harness_opportunities:
    pipeline_templates:
      - type: ci-cd-standard
        confidence: 95%
        reason: "Dockerfile + pytest + k8s manifests detected"

    stage_templates:
      - type: docker-build
        files: [Dockerfile, .dockerignore]
      - type: pytest-test
        files: [pytest.ini, tests/]
      - type: k8s-deploy
        files: [k8s/, helm/]

    step_templates:
      - type: poetry-install
        detected: pyproject.toml with poetry
      - type: pytest-coverage
        detected: pytest-cov in dependencies
```

---

### `create` - Create Archetype

Convert an existing project into a reusable archetype with optional full workflow.

```bash
/archetype create <project-path> [options]
```

**Options:**
```
--output <dir>         Output archetype location
--format <formats>     Template formats: copier, cookiecutter, maven, harness (comma-separated)
--full-flow            Complete workflow: create → validate → test → register → export
--structurizr          Generate Structurizr fragment template
--harness-templates    Generate Harness step/stage/pipeline templates
--gradle               Generate Gradle build tasks
--variables <file>     Override variable detection with YAML file
--dry-run              Preview without creating files
```

**Example - Full Workflow:**
```bash
/archetype create ./svc-membership \
  --full-flow \
  --format copier,harness \
  --structurizr \
  --harness-templates \
  --gradle
```

**Full Flow Output:**
```
═══════════════════════════════════════════════════════════════
              ARCHETYPE CREATION - FULL WORKFLOW
═══════════════════════════════════════════════════════════════

Phase 1: ANALYZE
─────────────────────────────────────────────────────────────────
✓ Project type detected: fastapi-service
✓ Language: Python 3.11
✓ Frameworks: FastAPI, Beanie, Pydantic
✓ Variables identified: 8 high-confidence, 4 medium-confidence
✓ Structurizr metadata extracted
✓ Harness opportunities identified: 3 templates

Phase 2: CREATE ARCHETYPE
─────────────────────────────────────────────────────────────────
✓ Copier template created: archetypes/svc-template-fastapi/
  ├── copier.yml (12 variables)
  ├── template/ (23 files)
  └── tests/ (validation tests)

✓ Harness templates created:
  ├── templates/harness/pipelines/fastapi-ci-cd.yaml
  ├── templates/harness/stages/python-build.yaml
  ├── templates/harness/stages/pytest-test.yaml
  ├── templates/harness/stages/docker-push.yaml
  ├── templates/harness/stages/k8s-deploy.yaml
  ├── templates/harness/steps/poetry-install.yaml
  ├── templates/harness/steps/pytest-coverage.yaml
  └── templates/harness/steps/docker-build.yaml

✓ Structurizr fragment template created:
  └── structurizr/fragments/service-template.dsl

✓ Gradle tasks generated:
  └── build.gradle.kts (archetype plugin configured)

Phase 3: VALIDATE
─────────────────────────────────────────────────────────────────
✓ Copier template syntax valid
✓ Variable schema valid
✓ Harness templates valid (YAML schema)
✓ Structurizr fragment valid (DSL syntax)

Phase 4: TEST SCAFFOLD
─────────────────────────────────────────────────────────────────
✓ Test project scaffolded: /tmp/test-scaffold-abc123/
✓ Dependencies installed successfully
✓ Tests passed: 24/24
✓ Docker build successful
✓ Harness pipeline validated

Phase 5: REGISTER ARCHITECTURE
─────────────────────────────────────────────────────────────────
✓ Structurizr fragment merged into workspace.dsl
✓ Relationships updated
✓ Views regenerated

Phase 6: EXPORT DIAGRAMS
─────────────────────────────────────────────────────────────────
✓ Mermaid diagrams: docs/diagrams/mermaid/
✓ PlantUML diagrams: docs/diagrams/plantuml/
✓ PNG exports: docs/diagrams/png/

═══════════════════════════════════════════════════════════════
                    ARCHETYPE CREATED SUCCESSFULLY
═══════════════════════════════════════════════════════════════

Archetype: svc-template-fastapi
Location: archetypes/svc-template-fastapi/
Formats: Copier, Harness Templates

Usage:
  # Scaffold new project
  /archetype scaffold svc-template-fastapi my-new-service

  # Or with Gradle
  ./gradlew scaffoldProject -PprojectName=my-new-service

  # Or with Copier directly
  copier copy archetypes/svc-template-fastapi ./my-new-service

Harness Templates Published:
  - Pipeline: fastapi-ci-cd (org: default, project: thelobbi)
  - Stages: python-build, pytest-test, docker-push, k8s-deploy
  - Steps: poetry-install, pytest-coverage, docker-build

Architecture:
  - Workspace: structurizr/workspace.dsl
  - Diagrams: https://lobbi.github.io/architecture-diagrams/
```

---

### `scaffold` - Create Project from Archetype

Scaffold a new project using an archetype with automatic architecture registration.

```bash
/archetype scaffold <archetype> <project-name> [options]
```

**Options:**
```
--output <dir>         Output directory (default: current)
--vars <file>          Variable values YAML file
--vars-json <json>     Inline JSON variables
--interactive          Force interactive prompts
--register             Auto-register in Structurizr (default: true)
--harness              Create Harness service/pipeline (default: true)
--harness-env <envs>   Target environments (default: dev,staging,prod)
--skip-tests           Don't run post-scaffold tests
--dry-run              Preview without creating
```

**Example:**
```bash
/archetype scaffold svc-template-fastapi svc-events \
  --register \
  --harness \
  --harness-env dev,staging,prod \
  --vars-json '{"database_type": "mongodb", "include_auth": true}'
```

**Output:**
```
═══════════════════════════════════════════════════════════════
                    SCAFFOLDING PROJECT
═══════════════════════════════════════════════════════════════

Archetype: svc-template-fastapi
Project: svc-events
Output: ./svc-events

Step 1: Variable Collection
─────────────────────────────────────────────────────────────────
Using provided variables:
  ✓ project_name: svc-events
  ✓ database_type: mongodb
  ✓ include_auth: true

Prompting for missing:
  ? project_description: Event management service for organizations
  ? service_port [8001]: 8002

Step 2: Generate Project
─────────────────────────────────────────────────────────────────
✓ Created directory structure (12 directories)
✓ Generated files (34 files)
✓ Applied conditional logic (3 conditionals)
✓ Processed templates (31 templates)

Step 3: Initialize Git
─────────────────────────────────────────────────────────────────
✓ Initialized repository
✓ Created .gitignore
✓ Initial commit: "Initial commit: svc-events from svc-template-fastapi"

Step 4: Install Dependencies
─────────────────────────────────────────────────────────────────
✓ Poetry detected
✓ Running: poetry install
✓ Dependencies installed (47 packages)

Step 5: Run Tests
─────────────────────────────────────────────────────────────────
✓ Running: poetry run pytest
✓ Tests passed: 18/18
✓ Coverage: 85%

Step 6: Register in Structurizr
─────────────────────────────────────────────────────────────────
✓ Generated fragment: structurizr/fragments/svc-events.dsl
✓ Merged into workspace.dsl
✓ Added relationships:
  - svc-events -> keycloak (Validates tokens)
  - svc-events -> mongoAtlas (Stores data)
  - uiSite -> svc-events (Uses)
  - gateway -> svc-events (Routes to)

Step 7: Create Harness Resources
─────────────────────────────────────────────────────────────────
✓ Service created: svc-events
✓ Environments configured: dev, staging, prod
✓ Pipeline created: svc-events-pipeline
  Using template: fastapi-ci-cd
  Stages: Build → Test → Deploy Dev → Deploy Staging → Approval → Deploy Prod

Step 8: Export Updated Diagrams
─────────────────────────────────────────────────────────────────
✓ System Context updated
✓ Container view updated
✓ Deployment view updated
✓ Pushed to GitHub Pages

═══════════════════════════════════════════════════════════════
                    PROJECT SCAFFOLDED SUCCESSFULLY
═══════════════════════════════════════════════════════════════

Project: svc-events
Location: ./svc-events

Directory Structure:
svc-events/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes/
│   │   └── dependencies.py
│   ├── models/
│   ├── services/
│   └── auth/              # Included (include_auth=true)
├── tests/
├── k8s/
│   ├── base/
│   ├── dev/
│   ├── staging/
│   └── prod/
├── .harness/
│   ├── pipeline.yaml      # svc-events-pipeline
│   └── services/
├── Dockerfile
├── docker-compose.yml
├── pyproject.toml
├── pytest.ini
├── CLAUDE.md
└── README.md

Next Steps:
  cd svc-events
  poetry run uvicorn app.main:app --reload --port 8002

Harness:
  Pipeline: https://app.harness.io/ng/account/.../pipeline/svc-events-pipeline
  Deploy: /harness pipeline run svc-events-pipeline --env dev

Architecture:
  Diagrams: https://lobbi.github.io/architecture-diagrams/
  Workspace: structurizr/workspace.dsl
```

---

### `register` - Register in Architecture

Register a project in the Structurizr architecture workspace.

```bash
/archetype register <project-name> [options]
```

**Options:**
```
--workspace <path>     Structurizr workspace path (default: structurizr/workspace.dsl)
--type <type>          System type: softwareSystem, container, component
--technology <tech>    Technology string
--tags <tags>          Comma-separated tags
--relationships <file> YAML file defining relationships
--export               Export diagrams after registration
```

**Example:**
```bash
/archetype register svc-events \
  --type softwareSystem \
  --technology "Python, FastAPI, MongoDB" \
  --tags "Internal,Backend,Microservice" \
  --export
```

---

### `export` - Export Architecture Diagrams

Export Structurizr diagrams to multiple formats.

```bash
/archetype export [options]
```

**Options:**
```
--workspace <path>     Workspace path (default: structurizr/workspace.dsl)
--format <formats>     Export formats: mermaid, plantuml, png, svg, json (comma-separated)
--output <dir>         Output directory (default: docs/diagrams/)
--views <views>        Specific views to export (comma-separated)
--push-pages           Push to GitHub Pages
```

**Example:**
```bash
/archetype export \
  --format mermaid,plantuml,png \
  --push-pages
```

---

### `harness-templates` - Generate Harness Templates

Generate Harness step, stage, and pipeline templates from an archetype.

```bash
/archetype harness-templates <archetype> [options]
```

**Options:**
```
--output <dir>         Output directory (default: templates/harness/)
--types <types>        Template types: step, stage, pipeline (comma-separated, default: all)
--publish              Publish to Harness (requires credentials)
--org <org>            Harness organization (default: from config)
--project <project>    Harness project (default: from config)
```

**Example:**
```bash
/archetype harness-templates svc-template-fastapi \
  --types step,stage,pipeline \
  --publish
```

**Output:**
```
═══════════════════════════════════════════════════════════════
                 HARNESS TEMPLATE GENERATION
═══════════════════════════════════════════════════════════════

Archetype: svc-template-fastapi
Analysis: FastAPI service with Docker, K8s, MongoDB

Generated Templates:
─────────────────────────────────────────────────────────────────

STEP TEMPLATES (5):
┌────────────────────────┬─────────────────────────────────────┐
│ Template               │ Description                         │
├────────────────────────┼─────────────────────────────────────┤
│ poetry-install         │ Install Python dependencies         │
│ pytest-coverage        │ Run pytest with coverage report     │
│ docker-build-python    │ Build Python Docker image           │
│ docker-push            │ Push to container registry          │
│ k8s-apply              │ Apply Kubernetes manifests          │
└────────────────────────┴─────────────────────────────────────┘

STAGE TEMPLATES (4):
┌────────────────────────┬─────────────────────────────────────┐
│ Template               │ Description                         │
├────────────────────────┼─────────────────────────────────────┤
│ python-build           │ Build + lint Python project         │
│ python-test            │ Test with pytest + coverage         │
│ docker-build-push      │ Build and push Docker image         │
│ k8s-deploy             │ Deploy to Kubernetes environment    │
└────────────────────────┴─────────────────────────────────────┘

PIPELINE TEMPLATES (2):
┌────────────────────────┬─────────────────────────────────────┐
│ Template               │ Description                         │
├────────────────────────┼─────────────────────────────────────┤
│ fastapi-ci-cd          │ Complete CI/CD for FastAPI services │
│ fastapi-pr-check       │ PR validation pipeline              │
└────────────────────────┴─────────────────────────────────────┘

Template Files:
─────────────────────────────────────────────────────────────────
templates/harness/
├── steps/
│   ├── poetry-install.yaml
│   ├── pytest-coverage.yaml
│   ├── docker-build-python.yaml
│   ├── docker-push.yaml
│   └── k8s-apply.yaml
├── stages/
│   ├── python-build.yaml
│   ├── python-test.yaml
│   ├── docker-build-push.yaml
│   └── k8s-deploy.yaml
└── pipelines/
    ├── fastapi-ci-cd.yaml
    └── fastapi-pr-check.yaml

Publishing to Harness:
─────────────────────────────────────────────────────────────────
✓ Step templates published (5)
✓ Stage templates published (4)
✓ Pipeline templates published (2)

Org: default
Project: thelobbi
Scope: Project-level templates

Usage:
─────────────────────────────────────────────────────────────────
# Use in pipeline YAML:
template:
  templateRef: fastapi-ci-cd
  versionLabel: "1.0.0"
  templateInputs:
    properties:
      ci:
        codebase:
          repoName: <+input>
          branch: main

# Or via CLI:
/harness pipeline create my-service --template fastapi-ci-cd
```

---

## Harness Template Specifications

### Step Template: poetry-install

```yaml
template:
  name: poetry-install
  identifier: poetry_install
  versionLabel: "1.0.0"
  type: Step
  projectIdentifier: thelobbi
  orgIdentifier: default
  spec:
    type: Run
    spec:
      connectorRef: <+input>
      image: python:<+input>.default(3.11)-slim
      shell: Bash
      command: |
        pip install poetry
        poetry config virtualenvs.create false
        poetry install --no-interaction --no-ansi
      envVariables:
        POETRY_NO_INTERACTION: "1"
```

### Step Template: pytest-coverage

```yaml
template:
  name: pytest-coverage
  identifier: pytest_coverage
  versionLabel: "1.0.0"
  type: Step
  spec:
    type: Run
    spec:
      connectorRef: <+input>
      image: python:<+input>.default(3.11)-slim
      shell: Bash
      command: |
        poetry run pytest \
          --cov=app \
          --cov-report=xml \
          --cov-report=html \
          --cov-fail-under=<+input>.default(80) \
          --junitxml=test-results.xml \
          tests/
      reports:
        type: JUnit
        spec:
          paths:
            - test-results.xml
```

### Stage Template: python-build

```yaml
template:
  name: python-build
  identifier: python_build
  versionLabel: "1.0.0"
  type: Stage
  spec:
    type: CI
    spec:
      cloneCodebase: true
      platform:
        os: Linux
        arch: Amd64
      runtime:
        type: Cloud
        spec: {}
      execution:
        steps:
          - step:
              type: Run
              name: Install Dependencies
              identifier: install_deps
              spec:
                shell: Bash
                command: |
                  pip install poetry
                  poetry install

          - step:
              type: Run
              name: Lint
              identifier: lint
              spec:
                shell: Bash
                command: |
                  poetry run ruff check app/
                  poetry run mypy app/

          - step:
              type: Run
              name: Format Check
              identifier: format_check
              spec:
                shell: Bash
                command: |
                  poetry run ruff format --check app/
```

### Pipeline Template: fastapi-ci-cd

```yaml
template:
  name: fastapi-ci-cd
  identifier: fastapi_ci_cd
  versionLabel: "1.0.0"
  type: Pipeline
  projectIdentifier: thelobbi
  orgIdentifier: default
  spec:
    properties:
      ci:
        codebase:
          connectorRef: <+input>
          repoName: <+input>
          build: <+input>

    stages:
      - stage:
          name: Build
          identifier: build
          template:
            templateRef: python_build
            versionLabel: "1.0.0"

      - stage:
          name: Test
          identifier: test
          template:
            templateRef: python_test
            versionLabel: "1.0.0"

      - stage:
          name: Build Docker
          identifier: build_docker
          type: CI
          spec:
            execution:
              steps:
                - step:
                    type: BuildAndPushDockerRegistry
                    name: Build and Push
                    identifier: build_push
                    spec:
                      connectorRef: <+input>
                      repo: <+input>/<+pipeline.properties.ci.codebase.repoName>
                      tags:
                        - <+codebase.commitSha>
                        - latest

      - stage:
          name: Deploy Dev
          identifier: deploy_dev
          type: Deployment
          spec:
            deploymentType: Kubernetes
            environment:
              environmentRef: dev
              infrastructureDefinitions:
                - identifier: dev_k8s

      - stage:
          name: Deploy Staging
          identifier: deploy_staging
          type: Deployment
          when:
            stageStatus: Success
          spec:
            deploymentType: Kubernetes
            environment:
              environmentRef: staging

      - stage:
          name: Approval
          identifier: approval
          type: Approval
          when:
            condition: <+pipeline.stages.deploy_staging.status> == "SUCCEEDED"
          spec:
            execution:
              steps:
                - step:
                    type: HarnessApproval
                    name: Production Approval
                    spec:
                      approvers:
                        userGroups:
                          - _project_all_users
                      approverInputs: []

      - stage:
          name: Deploy Production
          identifier: deploy_prod
          type: Deployment
          spec:
            deploymentType: Kubernetes
            environment:
              environmentRef: production
```

---

## Gradle Integration

The command generates Gradle tasks automatically:

```kotlin
// Generated: build.gradle.kts

plugins {
    id("io.lobbi.archetype") version "1.0.0"
}

archetype {
    sourceProject.set(file("svc-membership"))
    output.set(file("archetypes/svc-template-fastapi"))
    formats.set(listOf("copier", "harness"))

    structurizr {
        enabled.set(true)
        workspace.set(file("structurizr/workspace.dsl"))
    }

    harness {
        enabled.set(true)
        org.set("default")
        project.set("thelobbi")
        publishTemplates.set(true)
    }
}

tasks {
    // Full workflow
    register("archetypeFullFlow") {
        dependsOn("analyzeProject", "createArchetype", "validateArchetype",
                  "testScaffold", "registerArchitecture", "exportDiagrams",
                  "publishHarnessTemplates")
    }

    register("analyzeProject") { /* ... */ }
    register("createArchetype") { /* ... */ }
    register("scaffoldProject") { /* ... */ }
    register("registerArchitecture") { /* ... */ }
    register("exportDiagrams") { /* ... */ }
    register("publishHarnessTemplates") { /* ... */ }
}
```

**Usage:**
```bash
# Full workflow
./gradlew archetypeFullFlow

# Individual tasks
./gradlew analyzeProject
./gradlew createArchetype
./gradlew scaffoldProject -PprojectName=my-service
./gradlew registerArchitecture
./gradlew exportDiagrams
./gradlew publishHarnessTemplates
```

---

## Related Commands

- **`/scaffold`** - Quick project scaffolding
- **`/harness`** - Harness pipeline management
- **`/architecture`** - Structurizr operations
- **`/template`** - Template discovery and listing
- **`/generate`** - Code generation

---

## Best Practices

1. **Analyze First:** Always run `/archetype analyze` before creating
2. **Test Scaffolds:** Use `--dry-run` and test scaffolds before publishing
3. **Version Templates:** Use semantic versioning for archetypes and Harness templates
4. **Keep Architecture Current:** Always register new services in Structurizr
5. **Publish Harness Templates:** Share reusable templates across projects
6. **Document Variables:** Provide clear descriptions for all template variables
7. **CI/CD Integration:** Use Harness pipeline templates for consistency

---

**⚓ Golden Armada** | *Complete Archetype Lifecycle Management*
