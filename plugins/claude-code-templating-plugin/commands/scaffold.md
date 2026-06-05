---
name: scaffold
intent: Scaffold complete projects with automatic Harness integration, environment configuration, and post-generation setup
tags:
  - scaffold
  - project
  - setup
  - harness
  - initialization
inputs: []
risk: medium
cost: medium
description: Scaffold complete projects with automatic Harness integration, environment configuration, and post-generation setup
model: sonnet
---

# Project Scaffolding Command

Create complete projects with intelligent template selection, Harness integration, and environment configuration.

## Overview

The `/scaffold` command creates production-ready projects with automatic detection of project type, intelligent template selection, and integrated Harness CI/CD setup.

---

## Basic Syntax

```bash
/scaffold <template> <project_name> [options]
```

## Required Arguments

```
<template>             Template name or auto-detect (e.g., python-package, nodejs-app, java-maven)
<project_name>         Name for new project (will create directory)
```

---

## Options

### Output & Location

```
--output <dir>         Output directory (default: current directory)
--force                Overwrite existing directory
--dry-run              Preview what will be created without generating
```

### Harness Integration

```
--harness              Setup Harness CI/CD pipeline (default: true if Harness configured)
--harness-org <id>     Harness organization ID
--harness-project <id> Harness project ID
--pipeline-name <name> Custom pipeline name (default: {project_name}-pipeline)
--harness-delegate <id> Delegate selector for execution
```

### Environment Configuration

```
--env <envs>           Target environments (dev, staging, prod - comma-separated)
--region <region>      Cloud region (aws:us-east-1, gcp:us-central1, azure:eastus)
--kubernetes           Setup Kubernetes/Helm (requires --env)
--docker               Include Docker configuration
--docker-registry <url> Docker registry URL
```

### Variables & Configuration

```
--vars <file>          YAML/JSON with template variables
--vars-json <json>     Inline JSON with variables
--interactive          Force interactive mode
--skip-git             Don't initialize git
--skip-dependencies    Don't install dependencies
--skip-tests           Don't run tests after generation
```

### Post-Generation

```
--after <cmd>          Command to run after generation
--open-editor          Open generated files in editor
--create-remote        Create GitHub/GitLab repository
--remote-owner <user>  GitHub user/org for remote
--remote-name <name>   Custom remote repository name
```

---

## Examples

### Example 1: Simple Python Package

```bash
/scaffold python-package my_awesome_lib
```

Interactive prompts:
```
Project Name: my_awesome_lib
Author Name: Your Name
Author Email: your@example.com
Python Version (3.9, 3.10, 3.11, 3.12) [3.11]: 3.11
Include Docker? [y/N]: n
Include pytest? [Y/n]: y

✓ Created: /current/dir/my_awesome_lib/
✓ Files generated: 12
✓ Git initialized
✓ Dependencies installed (via pip)
✓ Tests passed

Next steps:
  cd my_awesome_lib
  python -m venv venv
  source venv/bin/activate
  python -m pytest tests/
```

---

### Example 2: Node.js App with Harness

```bash
/scaffold nodejs-app my-web-app \
  --harness \
  --env dev,staging,prod \
  --docker \
  --docker-registry registry.company.com
```

Output:
```
Scaffolding: nodejs-app (node-typescript template)
Project: my-web-app
Output: /current/dir/my-web-app

Configuration:
  ✓ Template detected: node-typescript
  ✓ Variables: 8 required, 4 optional
  ✓ Harness integration: Enabled
  ✓ Environments: dev, staging, prod
  ✓ Docker: Enabled

Step 1: Variable Collection
  ✓ Project name: my-web-app
  ✓ Author name: [interactive prompt]
  ✓ Package manager: npm (detected)
  ✓ TypeScript: yes
  ✓ Testing framework: jest

Step 2: Project Generation
  ✓ Created directories: 8
  ✓ Generated files: 24
  ✓ Applied conditionals: 3
  ✓ Rendered templates: 21

Step 3: Git Setup
  ✓ Initialized repository
  ✓ Created .gitignore
  ✓ Initial commit: "Initial commit: my-web-app"

Step 4: Dependency Installation
  ✓ Running: npm install
  ✓ Packages installed: 152
  ✓ Lock file: package-lock.json

Step 5: Harness Integration
  ✓ Created pipeline: my-web-app-pipeline
  ✓ Org: your-harness-org
  ✓ Project: default
  ✓ Environments created: dev, staging, prod
  ✓ Services created: my-web-app
  ✓ Connectors configured: Docker registry, Kubernetes

Step 6: Post-Generation Validation
  ✓ Build test: npm run build
  ✓ Lint test: npm run lint
  ✓ Test suite: npm test (passed, 15 tests)
  ✓ Docker build: Successful (image: registry.company.com/my-web-app:dev-latest)

✅ Project Scaffolding Complete!

Directory Structure:
my-web-app/
├── .github/
│   └── workflows/
│       └── ci.yml                    # GitHub Actions (optional)
├── harness/
│   ├── pipeline.yaml                 # Harness pipeline
│   ├── services/                     # Service definitions
│   │   └── my-web-app.yaml
│   ├── environments/                 # Environment configs
│   │   ├── dev.yaml
│   │   ├── staging.yaml
│   │   └── prod.yaml
│   └── connectors.yaml              # Connector configs
├── src/
├── tests/
├── Dockerfile
├── docker-compose.yml
├── kubernetes/
│   ├── base/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── kustomization.yaml
│   ├── dev/
│   ├── staging/
│   └── prod/
├── package.json
├── tsconfig.json
├── jest.config.js
├── .eslintrc.json
├── .prettierrc.json
├── .gitignore
├── README.md
└── LICENSE

Next Steps:
  1. Clone the repository or CD into: cd my-web-app
  2. Start development: npm run dev
  3. View Harness pipeline: https://harness.company.com/pipeline/my-web-app-pipeline
  4. Deploy to dev: https://harness.company.com/execution/my-web-app-pipeline?env=dev

Useful Commands:
  npm run dev              # Development server
  npm run build            # Production build
  npm test                 # Run tests
  npm run lint             # Linting
  docker build -t my-web-app:latest .
  kubectl apply -f kubernetes/dev/

Documentation:
  - README.md - Project overview
  - harness/README.md - Harness pipeline documentation
  - kubernetes/README.md - Kubernetes deployment guide
```

---

### Example 3: Java Microservice with Everything

```bash
/scaffold java-springboot order-service \
  --output ~/projects \
  --harness \
  --env dev,staging,prod \
  --kubernetes \
  --docker-registry docker.io/mycompany \
  --vars ~/templates/java-vars.yml
```

Variables file:
```yaml
# java-vars.yml
project_name: order-service
group_id: com.mycompany.microservices
java_version: "17"
spring_boot_version: "3.2.0"
database: postgresql
cache: redis
include_swagger: true
include_monitoring: true
kubernetes_replicas_dev: 1
kubernetes_replicas_prod: 3
```

---

### Example 4: Dry-Run Preview

```bash
/scaffold fastapi-api my-api --dry-run
```

Output:
```
DRY-RUN: Would create the following structure

Would create directory: /current/dir/my-api
Would create 23 files in 8 directories

Template: fastapi-api
Version: 1.0.0
Format: Copier

Variables (all defaults):
  project_name: my-api
  author_name: [REQUIRED]
  python_version: 3.11
  use_docker: true
  use_sqlalchemy: true
  use_redis: false

Would generate:
├─ my-api/
│  ├── app/
│  │  ├── main.py
│  │  ├── config.py
│  │  ├── database.py
│  │  └── models/
│  ├── tests/
│  ├── docker/
│  ├── kubernetes/
│  ├── harness/
│  ├── requirements.txt
│  ├── pyproject.toml
│  ├── pytest.ini
│  ├── Dockerfile
│  ├── docker-compose.yml
│  ├── README.md
│  └── LICENSE

Post-generation steps:
  1. Create virtual environment
  2. Install dependencies
  3. Initialize git
  4. Run tests
  5. Setup Harness pipeline

Would NOT create any files (dry-run mode). Use without --dry-run to proceed.
```

---

### Example 5: Create Remote Repository

```bash
/scaffold nodejs-app my-new-app \
  --harness \
  --create-remote \
  --remote-owner mycompany \
  --docker \
  --env dev,prod
```

Output includes:
```
GitHub Repository Created
  Repository: https://github.com/mycompany/my-new-app
  Remote Added: origin
  First push: main branch ready
  SSH: git@github.com:mycompany/my-new-app.git
```

---

## Template Auto-Detection

When template is omitted, `/scaffold` attempts to detect based on current directory:

```bash
# In a directory with package.json and tsconfig.json
/scaffold auto my-migration

# Detected: nodejs-app (typescript variant)
```

---

## Post-Scaffolding Checklist

After scaffolding, these tasks are automatically completed:

- [x] Directory structure created
- [x] Files generated from template
- [x] Git repository initialized
- [x] .gitignore configured
- [x] Dependencies installed (if applicable)
- [x] Basic tests run
- [x] Harness pipeline created (if `--harness`)
- [x] Docker image built (if `--docker`)
- [x] Kubernetes manifests validated (if `--kubernetes`)
- [x] README generated
- [x] Remote repository created (if `--create-remote`)

### Manual Post-Scaffolding Tasks

```bash
cd {project_name}

# Review generated files
ls -la

# Update README.md with specific details
edit README.md

# Add project-specific configuration
edit .env.example

# For Harness: Configure secrets and connectors
# For Kubernetes: Adjust resource requests/limits
# For Docker: Adjust image tagging strategy
```

---

## Environment Configuration

### Kubernetes Setup (--kubernetes)

When `--kubernetes` is specified:
- Generates Helm chart with dev/staging/prod overlays
- Creates kustomization.yaml for variant management
- Generates namespace configurations
- Sets up resource requests/limits
- Configures horizontal pod autoscaling (prod only)

### Docker Setup (--docker)

When `--docker` is specified:
- Generates production Dockerfile with multi-stage build
- Creates .dockerignore
- Configures image tagging strategy
- Sets up docker-compose.yml for local development
- Includes health check configuration

### Harness Integration (--harness)

When `--harness` is specified:
- Creates complete CI/CD pipeline
- Sets up build stage with artifact push
- Configures deployment stages per environment
- Creates approval gates (prod)
- Sets up notifications
- Configures secrets and connectors
- Creates services and environments in Harness

---

## Common Workflows

### Workflow 1: Quick Python Project

```bash
/scaffold python-package my-lib
# Interactive prompts → Done
```

### Workflow 2: Production Node.js with Harness & Kubernetes

```bash
/scaffold nodejs-app order-service \
  --harness \
  --env dev,staging,prod \
  --kubernetes \
  --docker \
  --vars config.yml
```

### Workflow 3: Java Microservice with All Services

```bash
/scaffold java-springboot user-service \
  --output ~/microservices \
  --harness \
  --kubernetes \
  --docker \
  --env dev,staging,prod \
  --create-remote --remote-owner mycompany
```

### Workflow 4: Preview Before Creating

```bash
/scaffold fastapi-api my-api --dry-run
# Review output
/scaffold fastapi-api my-api           # Create for real
```

---

## Integration with Other Commands

```bash
# Generate after scaffolding
/scaffold python-package my-lib
/generate tests my-lib/my_module.py

# Setup Harness pipeline details
/scaffold nodejs-app my-app --harness
/harness pipeline validate harness/pipeline.yaml

# Create additional features
/template generate fastapi-api --output my-app/api-modules/new-module
```

---

## Best Practices

1. **Preview first:** Use `--dry-run` for unfamiliar templates
2. **Commit early:** Git initializes automatically; initial commit is ready
3. **Test after:** Verify tests pass with generated setup
4. **Document changes:** Update README.md for project specifics
5. **Use Harness:** Enable `--harness` for production projects
6. **Validate Kubernetes:** Review generated manifests if using `--kubernetes`
7. **Version tracking:** Track template versions in documentation

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Template not found | Run `/template list` to see available templates |
| Permission denied | Check directory write permissions |
| Git init fails | Ensure git is installed and configured |
| Harness integration fails | Check Harness credentials and organization access |
| Docker build fails | Review Dockerfile and base image availability |
| Dependencies won't install | Check language/package manager setup |

---

## See Also

- **`/template`** - Discover and manage templates
- **`/harness`** - Harness pipeline management
- **`/generate`** - Code generation
- **`/scaffold validate`** - Validate project structure

---

## Advanced Usage

### Custom Post-Generation Script

```bash
/scaffold nodejs-app my-app --after "./setup.sh"
```

### With External Configuration

```bash
/scaffold <template> <name> \
  --vars /path/to/vars.yml \
  --after "npm run build && npm test"
```

---

**⚓ Golden Armada** | *You ask - The Fleet Ships*
