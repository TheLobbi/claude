# Jira Orchestrator - Complete Documentation

**Version:** 7.3.0  
**Last Updated:** 2025-01-27  
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Commands](#core-commands)
4. [6-Phase Protocol](#6-phase-protocol)
5. [Agent System](#agent-system)
6. [Confluence Integration](#confluence-integration)
7. [Installation & Setup](#installation--setup)
8. [Usage Examples](#usage-examples)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The **Jira Orchestrator** (Golden Armada) is an autonomous DevOps orchestration system that automates the complete software development lifecycle from Jira issue to production deployment. It coordinates 73 specialized agents across 16 teams to deliver end-to-end automation with full traceability.

### Key Capabilities

- **Autonomous Work Orchestration** - Complete 6-phase protocol (EXPLORE → PLAN → CODE → TEST → FIX → DOCUMENT)
- **Intelligent Agent Routing** - Dynamic agent selection based on issue type, complexity, and domain
- **Confluence Integration** - Automatic documentation creation and synchronization
- **Git Workflow Automation** - Smart commits, PR creation, and review orchestration
- **Enterprise Features** - Notifications, approvals, SLA monitoring, compliance reporting
- **Harness Platform Integration** - CI/CD pipeline automation and repository management

### Statistics

| Metric | Value |
|--------|-------|
| **Total Agents** | 73 |
| **Agent Teams** | 16 |
| **Commands** | 44 |
| **Skills** | 11 |
| **Workflow Hooks** | 6 |
| **Supported Plugins** | 6 (including orchestrator) |

---

## Architecture

### System Layers

### Core Components

1. **Request Classifier** - Analyzes user requests and determines complexity
2. **Capability Matcher** - Scores plugins and agents for task assignment
3. **Routing Decision Engine** - Selects optimal execution path
4. **Message Bus** - Inter-plugin communication backbone
5. **Agent Registry** - Dynamic agent discovery and selection
6. **State Management** - CRDT-based distributed state

### Communication Patterns

- **Publish/Subscribe** - System broadcasts and event notifications
- **Request/Response** - Command execution and agent queries
- **RPC** - Synchronous operations and method invocations
- **State Sharing** - Distributed context and conflict resolution

---

## Core Commands

### Primary Commands (v6.0 Consolidation)

| Command | Purpose | Includes | Hooks |
|---------|---------|----------|-------|
| `/jira:work` | Start orchestrated work | branch, triage, prepare (auto) | pre-work, post-work |
| `/jira:ship` | One-click shipping | work → pr → review → merge | pre-ship, post-ship, on-merge |
| `/jira:status` | Check progress, dashboard | metrics included | - |
| `/jira:pr` | Create/manage PRs | review, council, harness (flags) | pre-pr, post-pr, on-review |
| `/jira:iterate` | Fix feedback, re-review | auto-update PR | pre-iterate, post-iterate |
| `/jira:cancel` | Cancel with checkpoint | resume later | - |
| `/jira:sprint` | Sprint operations | plan, metrics, quality, team | - |
| `/jira:enterprise` | Enterprise features | notify, approve, sla, compliance | - |
| `/jira:infra` | Infrastructure | create-repo, deploy, pipeline | - |
| `/jira:setup` | Configuration | hooks, verify, reset | - |
| `/jira:sync` | Manual sync | usually auto via hooks | - |
| `/jira:help` | Documentation | command help | - |

**Philosophy:** Fewer commands, more automation via hooks.

### Confluence Command

```bash
/jira:confluence PROJ-123 read              # Fetch linked pages
/jira:confluence PROJ-123 write             # Update with progress
/jira:confluence PROJ-123 sync              # Bi-directional sync
/jira:confluence PROJ-123 create tdd        # TDD spec page
/jira:confluence PROJ-123 create api        # API docs page
/jira:confluence PROJ-123 create adr        # Architecture Decision
/jira:confluence PROJ-123 create runbook    # Operations guide
/jira:confluence PROJ-123 link              # Find & link pages
```

**Actions:**
- **read** - Find linked Confluence pages and display content
- **write** - Update existing pages with progress
- **sync** - Bi-directional synchronization (Jira ↔ Confluence)
- **create** - New page from template (tdd|api|adr|runbook|release-notes)
- **link** - Search & link existing pages

---

## 6-Phase Protocol

The orchestrator enforces a mandatory 6-phase protocol for all work:

```
EXPLORE (2+) → PLAN (1-2) → CODE (2-4) → TEST (2-3) → FIX (1-2) → DOCUMENT (1-2)
```

### Phase Breakdown

| Phase | Goal | Key Agents | Duration | Outputs |
|-------|------|------------|----------|---------|
| **EXPLORE** | Context gathering | triage-agent, task-enricher, requirements-analyzer | 2+ agents | Issue analysis, affected files, dependency map, risk assessment |
| **PLAN** | Execution planning | planner, architect, technical-planner | 1-2 agents | Implementation plan, test plan, rollback strategy |
| **CODE** | Implementation | domain specialists (via agent-router) | 2-4 agents | Code changes, configs, migration scripts |
| **TEST** | Validation | test-strategist, coverage-analyst, qa-specialist | 2-3 agents | Test results, coverage reports, acceptance criteria verification |
| **FIX** | Bug resolution | debugger, fixer | 1-2 agents | Bug fixes, regression tests |
| **DOCUMENT** | Documentation | documentation-writer, confluence-manager | 1-2 agents | Technical docs, runbooks, API docs |

### Validation Gates

Each phase must complete validation gates before proceeding:
- **EXPLORE** - Issue analysis complete, dependencies identified
- **PLAN** - Implementation plan approved, tasks broken down
- **CODE** - Code implemented, linting passed
- **TEST** - Tests passing, coverage >80%
- **FIX** - Bugs resolved, tests updated
- **DOCUMENT** - Documentation created, linked to Jira

---

## Agent System

### Agent Categories (73 Total)

| Category | Count | Key Agents |
|----------|-------|------------|
| **core** | 6 | triage-agent, code-reviewer, pr-creator, task-enricher, requirements-analyzer, documentation-writer |
| **intelligence** | 5 | intelligence-analyzer, agent-router, pattern-analyzer, quality-intelligence, expert-agent-matcher |
| **enterprise** | 8 | notification-router, sla-monitor, compliance-reporter, approval-orchestrator, escalation-manager |
| **portfolio** | 4 | portfolio-manager, release-coordinator, roadmap-planner, dependency-mapper |
| **sprint** | 5 | sprint-planner, team-capacity-planner, workload-balancer, skill-mapper, performance-tracker |
| **git** | 7 | commit-tracker, smart-commit-validator, commit-message-generator, checkpoint-pr-manager |
| **confluence** | 3 | confluence-manager, confluence-documentation-creator, qa-confluence-documenter |
| **teams** | 16 | autogen-style orchestration teams |
| **harness** | 3 | harness-jira-sync, harness-api-expert, harness-pipeline-orchestrator |
| **quality** | 1 | code-quality-enforcer |
| **workflows** | 5 | completion-orchestrator, approval-orchestrator, event-sourcing-orchestrator |
| **+ more** | 6 | qa, batch, testing, documentation, management |

### Dynamic Agent Discovery

The `agent-router` selects specialists based on:
- **Jira labels/components** - Routes to domain-specific agents
- **File patterns** - `.tsx` → frontend, `.prisma` → database
- **Keywords** - In issue description and requirements
- **Phase requirements** - Different agents for different phases

**Config:** `config/file-agent-mapping.yaml`

### Agent Teams (AutoGen-style)

16 orchestration teams for collaborative work:
- **Frontend Team** - React/Next.js specialists
- **Backend Team** - API and service developers
- **DevOps Team** - Infrastructure and deployment
- **QA Team** - Testing and quality assurance
- **Documentation Team** - Technical writing and Confluence
- **Security Team** - Security analysis and compliance
- And 10 more specialized teams

---

## Confluence Integration

### Overview

The Confluence integration provides seamless documentation management linked to Jira issues. It supports automatic page creation, bidirectional synchronization, and comprehensive documentation templates.

### Confluence Manager Agent

The `confluence-manager` agent handles all Confluence operations:

**Capabilities:**
- Read Confluence pages linked to Jira issues
- Search Confluence for related documentation
- Extract requirements from Confluence specs
- Create technical design documents
- Generate API documentation
- Write runbooks and operational playbooks
- Create architecture decision records (ADRs)
- Update release notes
- Sync Jira issues with Confluence pages
- Maintain documentation lifecycle
- Auto-link pages to Jira issues

### Documentation Types

#### 1. Technical Design Document (TDD)

**Template Structure:**
- Status, Author, Created Date, Jira Link
- **Overview** - Purpose, goals, non-goals
- **Requirements** - Functional and non-functional
- **Architecture** - System context, components, data model
- **Implementation** - 4 phases (foundation, core logic, integration, deployment)
- **Testing** - Unit, integration, E2E, performance
- **Security** - Auth, validation, encryption, audit
- **Deployment** - Infrastructure changes, rollout/rollback plans
- **Monitoring** - Metrics and alerts
- **Open Questions** - Unresolved items
- **Approvals** - Stakeholder sign-offs

**Create Command:**
```bash
/jira:confluence PROJ-123 create tdd
```

#### 2. API Documentation

**Template Structure:**
- Version, Base URL, Authentication
- **Authentication** - JWT header, token endpoint
- **Endpoints** - List/Create patterns, query params, responses, status codes
- **Error Handling** - Error format, codes
- **Rate Limiting** - Limits per user/IP, headers
- **Webhooks** - Events, payload format
- **Code Examples** - JavaScript, Python

**Create Command:**
```bash
/jira:confluence PROJ-123 create api
```

#### 3. Architecture Decision Record (ADR)

**Template Structure:**
- Number, Title, Status, Date, Deciders
- **Context** - What is the issue we're addressing?
- **Decision** - What is the change we're proposing?
- **Consequences** - Positive and negative impacts
- **Alternatives Considered** - Other options evaluated

**Create Command:**
```bash
/jira:confluence PROJ-123 create adr
```

#### 4. Runbook/Operations Guide

**Template Structure:**
- Service, Owner, On-Call, Updated Date
- **Overview** - Purpose, dependencies, SLA
- **Quick Reference** - URLs, K8s namespace, DB, cache
- **Health Checks** - Pod status, service health endpoint, logs
- **Common Incidents** - Symptoms → Diagnosis → Resolution
- **Deployment** - Build → Deploy → Rollback process
- **Scaling** - Manual replicas, HPA config
- **Monitoring** - Dashboards, alerts, contacts

**Create Command:**
```bash
/jira:confluence PROJ-123 create runbook
```

#### 5. Release Notes

**Template Structure:**
- Version, Release Date, Release Manager
- **New Features** - What's new
- **Improvements** - Enhancements
- **Bug Fixes** - Issues resolved
- **Breaking Changes** - Migration required
- **Deprecations** - Features being removed
- **Security** - Security updates

**Create Command:**
```bash
/jira:confluence PROJ-123 create release-notes
```

### Synchronization Workflows

#### Jira → Confluence Sync

**Automatic Updates:**
- Status changes → Update Confluence status indicators
- Assignee changes → Update page metadata
- Acceptance criteria → Update requirements section
- Comments → Add to documentation notes

**Trigger:** Jira issue update (via hooks or manual sync)

#### Confluence → Jira Sync

**Automatic Updates:**
- Requirements changes → Update Jira description
- Blockers identified → Create Jira blockers
- Dependencies → Link related issues
- Completion status → Update Jira status

**Trigger:** Confluence page update

#### Conflict Resolution

**Strategy:**
- **Status** - Jira is authoritative
- **Dates** - Newer wins
- **Assignee** - Jira is authoritative
- **Content** - Manual review required

**Process:**
1. Detect conflicts (status mismatch, assignee, dates)
2. Show both versions
3. Prompt for resolution
4. Apply resolution
5. Generate sync report

### Linking Strategies

#### Method 1: Smart Links

**In Jira issue description:**
```markdown
Design Document: [TDD - New Feature](confluence-url)
```

**In Confluence page:**
```markdown
Related Jira Issue: [PROJ-123](jira-url)
```

#### Method 2: Jira Macro

**In Confluence:**
```
{jira:PROJ-123}
```

Shows issue card with status, assignee, and summary.

#### Method 3: Remote Links

**Automatic bidirectional links:**
- Jira issue → Confluence page (remote link)
- Confluence page → Jira issue (reference section)

### Search & Discovery

**Search Strategies:**
1. Issue key in page text
2. Issue title keywords
3. Component/label match
4. Parent issue (if subtask)
5. Browse related areas

**Scoring Algorithm (0-100):**
- Issue key mentioned: +50
- Title similarity: +30
- Common labels: +10
- Same component: +10
- Recent update: +5
- Same creator: +5

**Link Command:**
```bash
/jira:confluence PROJ-123 link
```

Searches for related pages and creates links.

---

## Installation & Setup

### Prerequisites

- Node.js 18+ and TypeScript 5+
- Claude Code with MCP support
- Atlassian Cloud account (Jira + Confluence)
- Git repository access

### Quick Install

```bash
# Clone repository
git clone <repository-url>
cd jira-orchestrator

# Install dependencies
bash scripts/install.sh

# Verify installation
claude /jira:setup
```

### Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `ATLASSIAN_CLOUD_ID` | Yes* | Your Atlassian Cloud ID |
| `JIRA_DEFAULT_PROJECT` | Yes* | Default Jira project key |
| `CONFLUENCE_SPACE_KEY` | No | Default Confluence space (defaults to project key) |
| `HARNESS_ACCOUNT_ID` | No | Harness CI/CD integration |
| `HARNESS_API_KEY` | No | Harness PAT token |
| `HARNESS_ORG_ID` | No | Harness organization |
| `HARNESS_PROJECT_ID` | No | Harness project |
| `OBSIDIAN_VAULT_PATH` | No | Documentation sync |

*OAuth handles authentication - no API tokens needed

### MCP Integration

**Setup Atlassian MCP:**
```bash
claude mcp add --transport http atlassian https://mcp.atlassian.com/v1/mcp/authv2
```

**Available Tools:**
- `mcp__atlassian__getJiraIssue`
- `mcp__atlassian__createJiraIssue`
- `mcp__atlassian__getConfluencePage`
- `mcp__atlassian__createConfluencePage`
- `mcp__atlassian__updateConfluencePage`
- `mcp__atlassian__searchConfluenceUsingCql`
- And 20+ more Atlassian tools

### Hook Setup

**Automatic Setup:**
Hooks are automatically installed during `scripts/install.sh`

**Manual Setup:**
```bash
bash hooks/install-hooks.sh
```

**Available Hooks:**
- `pre-work` - Before starting work on issue
- `post-work` - After work completes
- `pre-pr` - Before PR creation
- `post-pr` - After PR creation
- `on-review` - During PR review
- `on-merge` - When PR is merged

---

## Usage Examples

### Example 1: Complete Feature Development

```bash
# Start work on a story
/jira:work PROJ-123

# The orchestrator will:
# 1. EXPLORE - Analyze issue, gather requirements
# 2. PLAN - Create implementation plan
# 3. CODE - Implement feature
# 4. TEST - Run tests, verify coverage
# 5. FIX - Fix any issues
# 6. DOCUMENT - Create Confluence docs

# Create PR
/jira:pr PROJ-123

# Ship to production
/jira:ship PROJ-123
```

### Example 2: Create Documentation

```bash
# Create TDD for new feature
/jira:confluence PROJ-123 create tdd

# Update documentation with progress
/jira:confluence PROJ-123 write

# Sync Jira and Confluence
/jira:confluence PROJ-123 sync
```

### Example 3: Sprint Planning

```bash
# Plan sprint
/jira:sprint plan --sprint-id=123

# Check sprint metrics
/jira:sprint metrics --sprint-id=123

# Team capacity planning
/jira:sprint capacity --team=backend
```

### Example 4: Enterprise Workflow

```bash
# Start work with notifications
/jira:work PROJ-123 --notify

# Create PR with approval workflow
/jira:pr PROJ-123 --approve

# Monitor SLA
/jira:sla monitor --issue=PROJ-123

# Compliance report
/jira:compliance report --project=PROJ
```

---

## Best Practices

### Workflow Best Practices

1. **Always use `/jira:work`** - Ensures proper orchestration
2. **Let hooks handle automation** - Don't manually sync
3. **Use `/jira:ship` for complete flow** - One command for everything
4. **Check status regularly** - Use `/jira:status` to monitor progress
5. **Document as you go** - Use `/jira:confluence write` frequently

### Documentation Best Practices

1. **Create TDD early** - Before implementation starts
2. **Update docs with progress** - Keep Confluence in sync
3. **Link everything** - Jira ↔ Confluence ↔ Code
4. **Use templates** - Consistent structure
5. **Review documentation** - Part of code review process

### Agent Selection Best Practices

1. **Trust the router** - Agent selection is automatic
2. **Use labels** - Help routing with proper Jira labels
3. **Specify components** - Component tags improve routing
4. **Add keywords** - Descriptive issue descriptions help

### Confluence Best Practices

1. **One page per issue** - Clear ownership
2. **Use page types** - TDD, API, Runbook, ADR
3. **Link to parent** - Sub-issues link to parent TDD
4. **Keep updated** - Regular sync with Jira
5. **Use labels** - Issue key, type, component labels

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Commands not showing | Restart Claude Code, check plugin path |
| Jira connection fails | Verify env vars, test with curl |
| PR blocked by review | Run `/jira:review`, address findings |
| Hooks not triggering | `chmod +x hooks/scripts/*.sh` |
| Confluence sync fails | Check space permissions, verify space key |
| Agent not found | Check agent registry, verify agent name |
| Documentation not created | Check Confluence permissions, verify space exists |

### Debug Commands

```bash
# Check status
/jira:status PROJ-123

# Verify setup
/jira:setup verify

# Check hooks
bash hooks/verify-hooks.sh

# Test Confluence connection
/jira:confluence PROJ-123 read
```

### Getting Help

- **Documentation:** `docs/` directory
- **Command Help:** `/jira:help`
- **Agent Details:** `agents/*.md`
- **Command Details:** `commands/*.md`

---

## Related Documentation

- **Full README:** `README.md`
- **Installation Guide:** `INSTALLATION.md`
- **Architecture:** `docs/ARCHITECTURE-SUMMARY.md`
- **Plugin Ecosystem:** `docs/PLUGIN-ECOSYSTEM-ARCHITECTURE.md`
- **Harness Integration:** `docs/HARNESS-KNOWLEDGE-BASE.md`
- **Workflows:** Obsidian vault (if configured)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 7.3.0 | 2025-01-27 | Official Atlassian MCP SSE, updated Confluence integration |
| 7.2.0 | 2025-01-20 | Complete plugin manifest, 6 workflow hooks |
| 7.1.0 | 2025-01-15 | AutoGen-style agent teams, parent-child orchestration |
| 7.0.0 | 2025-01-10 | Harness platform integration, comprehensive knowledge base |
| 6.0.0 | 2025-01-05 | Command consolidation, hook-based automation |

---

**⚓ Golden Armada** | *You ask - The Fleet Ships*

---

*This documentation is maintained by the Jira Orchestrator team. For updates or corrections, please create a Jira issue or submit a PR.*
