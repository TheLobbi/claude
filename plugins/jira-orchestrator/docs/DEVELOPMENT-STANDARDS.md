# Development Standards & Best Practices

**Version:** 7.5.0 | **Last Updated:** 2026-02-25 | **Status:** MANDATORY

---

## Table of Contents

1. [Git Workflow Standards](#git-workflow-standards)
2. [SOLID Principles & Clean Code](#solid-principles--clean-code)
3. [Deployment Standards](#deployment-standards)
4. [Documentation Requirements](#documentation-requirements)
5. [Repository Structure Standards](#repository-structure-standards)
6. [Sub-Agent & Git Worktrees](#sub-agent--git-worktrees)
7. [Template Library](#template-library)
8. [Enforcement Mechanisms](#enforcement-mechanisms)

---

## Git Workflow Standards

### PR-Only Workflow (MANDATORY)

**CRITICAL:** Direct commits to `main` or `master` branches are **STRICTLY PROHIBITED**.

All changes MUST go through the Pull Request workflow:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MANDATORY PR WORKFLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│   │   CREATE    │ -> │    CODE     │ -> │   CREATE    │ -> │   MERGE     │ │
│   │   BRANCH    │    │   & TEST    │    │     PR      │    │   TO MAIN   │ │
│   └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘ │
│         │                  │                  │                  │         │
│         v                  v                  v                  v         │
│   feature/PROJ-123   All tests pass    Review required    Squash merge   │
│   or bugfix/...      Code quality      Approvals met      CI passed      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Branch Naming Convention

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/{ISSUE-KEY}-{description}` | `feature/PROJ-123-user-auth` |
| Bug Fix | `bugfix/{ISSUE-KEY}-{description}` | `bugfix/PROJ-456-fix-login` |
| Hotfix | `hotfix/{ISSUE-KEY}-{description}` | `hotfix/PROJ-789-critical-patch` |
| Release | `release/{version}` | `release/v2.0.0` |

### Commit Message Format

```
{ISSUE-KEY}: Brief description (imperative mood)

- Detailed bullet point if needed
- Another point

Co-Authored-By: Claude <noreply@anthropic.com>
```

### PR Requirements (BLOCKING)

Before a PR can be merged:

- [ ] **Branch protection enabled** on main/master
- [ ] **At least 1 approval** from code owner
- [ ] **All CI checks passing** (tests, lint, build)
- [ ] **Code coverage >= 80%** for new code
- [ ] **No direct pushes** - all via PR
- [ ] **Squash merge** preferred for clean history
- [ ] **Linked Jira issue** in PR description

### Branch Protection Rules

```yaml
# Required branch protection settings
branch_protection:
  branches:
    - main
    - master
  rules:
    require_pull_request:
      required_approving_review_count: 1
      dismiss_stale_reviews: true
      require_code_owner_reviews: true
    require_status_checks:
      strict: true
      contexts:
        - "CI / Build"
        - "CI / Test"
        - "CI / Lint"
    restrict_pushes:
      allow_force_pushes: false
      allow_deletions: false
```

---

## SOLID Principles & Clean Code

### SOLID Principles (MANDATORY)

Every code contribution MUST adhere to SOLID principles:

#### S - Single Responsibility Principle (SRP)

```typescript
// BAD: Class handles multiple responsibilities
class UserManager {
  createUser() { /* ... */ }
  sendEmail() { /* ... */ }
  validateInput() { /* ... */ }
  logActivity() { /* ... */ }
}

// GOOD: Each class has one responsibility
class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly validator: UserValidator
  ) {}

  createUser(data: UserData): User {
    this.validator.validate(data);
    return this.userRepository.save(data);
  }
}

class EmailService {
  sendWelcomeEmail(user: User): void { /* ... */ }
}

class ActivityLogger {
  log(activity: Activity): void { /* ... */ }
}
```

#### O - Open/Closed Principle (OCP)

```typescript
// BAD: Modifying existing code for new features
function calculateDiscount(type: string, price: number): number {
  if (type === 'regular') return price * 0.1;
  if (type === 'premium') return price * 0.2;
  if (type === 'vip') return price * 0.3; // Added later - violates OCP
}

// GOOD: Open for extension, closed for modification
interface DiscountStrategy {
  calculate(price: number): number;
}

class RegularDiscount implements DiscountStrategy {
  calculate(price: number): number { return price * 0.1; }
}

class PremiumDiscount implements DiscountStrategy {
  calculate(price: number): number { return price * 0.2; }
}

class VIPDiscount implements DiscountStrategy {
  calculate(price: number): number { return price * 0.3; }
}
```

#### L - Liskov Substitution Principle (LSP)

```typescript
// BAD: Subclass violates parent contract
class Bird {
  fly(): void { /* ... */ }
}

class Penguin extends Bird {
  fly(): void { throw new Error("Can't fly!"); } // Violates LSP
}

// GOOD: Proper abstraction hierarchy
interface Bird {
  move(): void;
}

interface FlyingBird extends Bird {
  fly(): void;
}

class Sparrow implements FlyingBird {
  move(): void { this.fly(); }
  fly(): void { /* ... */ }
}

class Penguin implements Bird {
  move(): void { this.swim(); }
  swim(): void { /* ... */ }
}
```

#### I - Interface Segregation Principle (ISP)

```typescript
// BAD: Fat interface
interface Worker {
  work(): void;
  eat(): void;
  sleep(): void;
  code(): void;
  design(): void;
}

// GOOD: Segregated interfaces
interface Workable {
  work(): void;
}

interface Eatable {
  eat(): void;
}

interface Codeable {
  code(): void;
}

interface Designable {
  design(): void;
}

class Developer implements Workable, Codeable {
  work(): void { /* ... */ }
  code(): void { /* ... */ }
}
```

#### D - Dependency Inversion Principle (DIP)

```typescript
// BAD: High-level module depends on low-level module
class UserService {
  private database = new MySQLDatabase(); // Direct dependency

  getUser(id: string): User {
    return this.database.query(`SELECT * FROM users WHERE id = ${id}`);
  }
}

// GOOD: Both depend on abstractions
interface Database {
  query(sql: string): any;
}

class UserService {
  constructor(private readonly database: Database) {} // Injected

  getUser(id: string): User {
    return this.database.query(`SELECT * FROM users WHERE id = ${id}`);
  }
}

// Can now use MySQL, PostgreSQL, or any Database implementation
```

### Clean Code Standards

#### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Classes | PascalCase | `UserService`, `PaymentProcessor` |
| Interfaces | PascalCase (no I prefix) | `Repository`, `Logger` |
| Functions/Methods | camelCase | `calculateTotal`, `getUserById` |
| Variables | camelCase | `userName`, `totalAmount` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES`, `API_BASE_URL` |
| Files | kebab-case | `user-service.ts`, `payment-utils.ts` |
| Test files | `*.test.ts` or `*.spec.ts` | `user-service.test.ts` |

#### Function Guidelines

```typescript
// Maximum function length: 20-30 lines
// Maximum parameters: 3-4 (use object for more)

// BAD
function createUser(name: string, email: string, password: string,
                    role: string, department: string, manager: string,
                    startDate: Date, salary: number): User { /* ... */ }

// GOOD
interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role?: string;
  department?: string;
  manager?: string;
  startDate?: Date;
  salary?: number;
}

function createUser(request: CreateUserRequest): User { /* ... */ }
```

#### Error Handling

```typescript
// Always use typed errors
class UserNotFoundError extends Error {
  constructor(public readonly userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'UserNotFoundError';
  }
}

// Handle errors explicitly
async function getUser(id: string): Promise<User> {
  const user = await this.repository.findById(id);
  if (!user) {
    throw new UserNotFoundError(id);
  }
  return user;
}
```

---

## Deployment Standards

### Helm-First Deployment (MANDATORY)

**CRITICAL:** All Kubernetes deployments MUST use Helm charts. Docker Compose is for **local development only**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DEPLOYMENT HIERARCHY                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Production   │  Helm + Kubernetes        │  REQUIRED                     │
│   Staging      │  Helm + Kubernetes        │  REQUIRED                     │
│   Development  │  Helm + Kubernetes        │  RECOMMENDED                  │
│   Local Dev    │  Docker Compose           │  ALLOWED (dev only)           │
│                                                                             │
│   ❌ NEVER use Docker Compose for: staging, production, CI/CD              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Helm Chart Structure (MANDATORY)

Every deployable service MUST include:

```
deployment/
├── helm/
│   └── {service-name}/
│       ├── Chart.yaml
│       ├── values.yaml              # Default values
│       ├── values-dev.yaml          # Development overrides
│       ├── values-staging.yaml      # Staging overrides
│       ├── values-prod.yaml         # Production overrides
│       ├── templates/
│       │   ├── _helpers.tpl
│       │   ├── deployment.yaml
│       │   ├── service.yaml
│       │   ├── ingress.yaml
│       │   ├── configmap.yaml
│       │   ├── secrets.yaml
│       │   ├── hpa.yaml             # Horizontal Pod Autoscaler
│       │   └── pdb.yaml             # Pod Disruption Budget
│       └── README.md
└── terraform/                        # Infrastructure as Code
    └── environments/
        ├── dev/
        ├── staging/
        └── prod/
```

### Helm Deployment Commands

```bash
# Development
helm upgrade --install {service} ./deployment/helm/{service} \
  -n {namespace} \
  -f ./deployment/helm/{service}/values-dev.yaml

# Staging
helm upgrade --install {service} ./deployment/helm/{service} \
  -n {namespace} \
  -f ./deployment/helm/{service}/values-staging.yaml

# Production (REQUIRES APPROVAL)
helm upgrade --install {service} ./deployment/helm/{service} \
  -n {namespace} \
  -f ./deployment/helm/{service}/values-prod.yaml \
  --wait --timeout 5m
```

### When Docker Compose is Allowed

Docker Compose is ONLY permitted for:

1. **Local development** - Running services on developer machines
2. **Quick prototyping** - Initial exploration before Helm chart creation
3. **Integration tests** - Spinning up test dependencies locally

```yaml
# docker-compose.yml - LOCAL DEVELOPMENT ONLY
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    # ⚠️ This file is for LOCAL DEVELOPMENT ONLY
    # ⚠️ Use Helm charts for staging/production
```

---

## Documentation Requirements

### Docs Folder Structure (MANDATORY)

Every repository MUST include a `docs/` folder with Confluence links:

```
docs/
├── README.md                    # Index with Confluence links
├── architecture.md              # High-level architecture
├── api.md                       # API documentation
├── deployment.md                # Deployment guide
├── runbook.md                   # Operations runbook
└── adr/                         # Architecture Decision Records
    ├── 0001-initial-architecture.md
    └── template.md
```

### README with Confluence Links (MANDATORY)

Every repository README MUST include a documentation table linking to Confluence:

```markdown
# {Service Name}

**Status:** Active | **Jira:** [PROJ-123](https://jira.example.com/browse/PROJ-123)

## Quick Start

\`\`\`bash
# Local development
docker-compose up -d

# Helm deployment (staging/prod)
helm upgrade --install {service} ./deployment/helm/{service}
\`\`\`

## Documentation

| Document | Description | Link |
|----------|-------------|------|
| Technical Design | Architecture & design decisions | [Confluence](https://confluence.example.com/tdd-PROJ-123) |
| API Reference | Endpoint documentation | [Confluence](https://confluence.example.com/api-PROJ-123) |
| Runbook | Operations & troubleshooting | [Confluence](https://confluence.example.com/runbook-PROJ-123) |
| ADRs | Architecture decisions | [docs/adr/](./docs/adr/) |

## Architecture

See [docs/architecture.md](./docs/architecture.md) for detailed architecture.

## Development

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## Team

**Owner:** {Team Name} | **Slack:** #{service-name}-support
```

### Confluence Page Requirements

For every major feature/service, create these Confluence pages:

| Page Type | Required | Template |
|-----------|----------|----------|
| Technical Design Document (TDD) | **MANDATORY** | `templates/confluence/tdd.md` |
| API Documentation | If applicable | `templates/confluence/api.md` |
| Runbook | **MANDATORY** | `templates/confluence/runbook.md` |
| Implementation Notes | Recommended | `templates/confluence/implementation.md` |
| Test Results | For major features | `templates/confluence/test-results.md` |

---

## Repository Structure Standards

### Standard Directory Structure

All repositories MUST follow this consistent structure:

```
{repository-name}/
├── .github/
│   ├── workflows/               # CI/CD pipelines
│   │   ├── ci.yml
│   │   └── cd.yml
│   ├── CODEOWNERS
│   └── PULL_REQUEST_TEMPLATE.md
├── .harness/                    # Harness pipeline definitions
│   ├── pipeline.yaml
│   └── triggers.yaml
├── deployment/
│   ├── helm/{service-name}/     # Helm charts (MANDATORY)
│   ├── terraform/               # Infrastructure as Code
│   └── k8s/                     # Raw K8s manifests (if needed)
├── docs/                        # Documentation (MANDATORY)
│   ├── README.md
│   ├── architecture.md
│   ├── api.md
│   └── adr/
├── src/                         # Source code
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── models/
│   ├── utils/
│   └── index.ts
├── tests/                       # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── scripts/                     # Utility scripts
├── .jira/                       # Jira orchestrator config
│   └── config.yml
├── docker-compose.yml           # Local development only
├── Dockerfile
├── README.md                    # With Confluence links
├── CONTRIBUTING.md
├── CHANGELOG.md
├── package.json                 # or equivalent
└── tsconfig.json                # or equivalent
```

### Source Code Organization

```
src/
├── controllers/                 # Request handlers
│   └── user.controller.ts
├── services/                    # Business logic (SOLID)
│   └── user.service.ts
├── repositories/                # Data access
│   └── user.repository.ts
├── models/                      # Domain models
│   ├── entities/
│   └── dto/
├── interfaces/                  # TypeScript interfaces
├── middleware/                  # Express/Fastify middleware
├── utils/                       # Utility functions
├── config/                      # Configuration
└── index.ts                     # Application entry point
```

---

## Sub-Agent & Git Worktrees

### Sub-Agent Requirements (MANDATORY)

Complex tasks MUST use sub-agents for parallel processing:

```yaml
# Minimum sub-agents per task type
task_types:
  simple_fix:
    min_agents: 3
    max_agents: 5

  standard_feature:
    min_agents: 5
    max_agents: 8

  complex_feature:
    min_agents: 8
    max_agents: 13

  epic_decomposition:
    min_agents: 4
    max_agents: 6
```

### Git Worktrees for Parallel Development

Use git worktrees when working on multiple features simultaneously:

```bash
# Create worktree for a feature
git worktree add ../feature-PROJ-123 feature/PROJ-123-user-auth

# Create worktree for a bugfix
git worktree add ../bugfix-PROJ-456 bugfix/PROJ-456-fix-login

# List worktrees
git worktree list

# Remove worktree when done
git worktree remove ../feature-PROJ-123
```

### Worktree Structure

```
workspace/
├── main-repo/                   # Main repository (main branch)
├── feature-PROJ-123/            # Worktree for feature
├── feature-PROJ-124/            # Worktree for another feature
└── bugfix-PROJ-456/             # Worktree for bugfix
```

### When to Use Worktrees

| Scenario | Use Worktrees? | Reason |
|----------|----------------|--------|
| Multiple features in parallel | **YES** | Avoid context switching |
| Long-running feature + hotfix | **YES** | Don't block hotfix |
| Single feature | No | Overhead not justified |
| Epic with multiple sub-tasks | **YES** | Parallel development |

### Sub-Agent + Worktree Workflow

```yaml
# Example: Epic with 3 sub-tasks
epic: PROJ-100
sub_tasks:
  - PROJ-101: Frontend component
  - PROJ-102: Backend API
  - PROJ-103: Database schema

workflow:
  1. Create worktrees:
     - git worktree add ../proj-101 feature/PROJ-101-frontend
     - git worktree add ../proj-102 feature/PROJ-102-backend
     - git worktree add ../proj-103 feature/PROJ-103-database

  2. Assign sub-agents:
     - Agent 1 → ../proj-101 (frontend specialist)
     - Agent 2 → ../proj-102 (backend specialist)
     - Agent 3 → ../proj-103 (database specialist)

  3. Parallel execution:
     - All agents work simultaneously
     - Each creates PR for their sub-task
     - Merge PRs in dependency order

  4. Cleanup:
     - git worktree remove ../proj-101
     - git worktree remove ../proj-102
     - git worktree remove ../proj-103
```

---

## Template Library

### Available Templates

Templates are stored in `plugins/jira-orchestrator/templates/`:

```
templates/
├── repository/                  # Repository templates
│   ├── microservice/
│   │   ├── README.md.template
│   │   ├── CONTRIBUTING.md.template
│   │   ├── Dockerfile.template
│   │   └── package.json.template
│   ├── helm-chart/
│   ├── terraform-module/
│   └── shared-lib/
├── confluence/                  # Confluence page templates
│   ├── tdd.md.template          # Technical Design Document
│   ├── api.md.template          # API Documentation
│   ├── runbook.md.template      # Operations Runbook
│   ├── implementation.md.template
│   └── test-results.md.template
├── helm/                        # Helm chart templates
│   ├── Chart.yaml.template
│   ├── values.yaml.template
│   └── templates/
├── github/                      # GitHub templates
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── CODEOWNERS.template
│   └── workflows/
├── adr/                         # ADR templates
│   └── adr-template.md
└── code/                        # Code templates
    ├── typescript/
    │   ├── service.ts.template
    │   ├── controller.ts.template
    │   └── repository.ts.template
    └── python/
        ├── service.py.template
        └── repository.py.template
```

### Using Templates

Templates use variable substitution:

```markdown
# {{SERVICE_NAME}}

**Status:** Active | **Jira:** [{{JIRA_KEY}}]({{JIRA_URL}}/browse/{{JIRA_KEY}})

## Documentation

| Document | Link |
|----------|------|
| Technical Design | [Confluence]({{CONFLUENCE_BASE}}/tdd-{{JIRA_KEY}}) |

## Team

**Owner:** {{TEAM_NAME}} | **Slack:** #{{SERVICE_NAME}}-support
```

### Template Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{SERVICE_NAME}}` | Name of the service | `user-service` |
| `{{JIRA_KEY}}` | Jira issue key | `PROJ-123` |
| `{{JIRA_URL}}` | Jira instance URL | `https://jira.example.com` |
| `{{CONFLUENCE_BASE}}` | Confluence base URL | `https://confluence.example.com` |
| `{{TEAM_NAME}}` | Owning team | `Platform Team` |
| `{{DATE}}` | Current date | `2025-12-31` |
| `{{AUTHOR}}` | Author name | `Developer Name` |

---

## Enforcement Mechanisms

### Pre-Commit Hooks

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Block direct commits to main/master
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" == "main" || "$BRANCH" == "master" ]]; then
  echo "❌ Direct commits to $BRANCH are not allowed!"
  echo "Please create a feature branch and submit a PR."
  exit 1
fi

# Run linting
npm run lint || exit 1

# Run tests
npm test || exit 1
```

### CI/CD Checks

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
    branches: [main, master]

jobs:
  standards-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Check branch protection
        run: |
          if [ "${{ github.event_name }}" == "push" ] && \
             [ "${{ github.ref }}" == "refs/heads/main" ]; then
            echo "❌ Direct push to main detected!"
            exit 1
          fi

      - name: Verify Helm charts exist
        run: |
          if [ ! -d "deployment/helm" ]; then
            echo "❌ Missing Helm charts in deployment/helm/"
            exit 1
          fi

      - name: Check docs folder
        run: |
          if [ ! -d "docs" ]; then
            echo "❌ Missing docs/ folder"
            exit 1
          fi

      - name: Run tests
        run: npm test

      - name: Check coverage
        run: |
          COVERAGE=$(npm run coverage -- --silent | grep "All files" | awk '{print $10}')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "❌ Coverage $COVERAGE% is below 80%"
            exit 1
          fi
```

### Jira Orchestrator Enforcement

The Jira orchestrator automatically enforces these standards:

```yaml
# Enforcement rules
enforcement:
  pr_only:
    enabled: true
    block_direct_commits: true
    required_approvals: 1

  deployment:
    helm_required: true
    docker_compose_allowed_envs: ["local"]

  documentation:
    docs_folder_required: true
    confluence_links_required: true
    readme_template_required: true

  code_quality:
    solid_principles: enforced
    test_coverage_min: 80
    lint_required: true

  agents:
    min_sub_agents: 3
    max_sub_agents: 13
    worktrees_for_parallel: recommended
```

---

## Compliance Checklist

Before merging any PR, verify:

### Git Workflow
- [ ] Created feature branch (not committing to main)
- [ ] Branch follows naming convention
- [ ] Commits reference Jira issue
- [ ] PR created with proper template
- [ ] At least 1 approval obtained
- [ ] All CI checks passing

### Code Quality
- [ ] Follows SOLID principles
- [ ] Clean code standards met
- [ ] Unit tests added/updated
- [ ] Test coverage >= 80%
- [ ] No linting errors

### Deployment
- [ ] Helm charts exist and are valid
- [ ] Values files for all environments
- [ ] No Docker Compose for non-local envs
- [ ] Infrastructure as Code if applicable

### Documentation
- [ ] `docs/` folder exists
- [ ] README has Confluence links
- [ ] Architecture documented
- [ ] API documented (if applicable)
- [ ] Runbook created/updated
- [ ] ADRs for significant decisions

---

## Related Documentation

- [Orchestration Protocol](./ARCHITECTURE-SUMMARY.md)
- [GitHub-Jira Integration](./GITHUB-JIRA-INTEGRATION-GUIDE.md)
- [Harness Setup](./HARNESS-JIRA-CONNECTOR-SETUP.md)
- [Template Library](../templates/README.md)

---

**Enforcement:** These standards are automatically enforced by the Jira Orchestrator hooks and CI/CD pipelines. Non-compliant code will be blocked from merging.
