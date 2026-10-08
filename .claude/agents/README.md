# Agent System

## Current WagonWorks business scope

Owner correction, 2026-10-05: business agents support developing, explaining,
demonstrating, and selling WagonWorks. Discovery services and discovery-led
sales workflows are retired; do not propose or initiate them from older
profiles or selling playbooks. General work-automation recommendations are
not the current marketing or sales direction. Release-to-campaign and
campaign-experiment agents are parked pending a new owner instruction.

Assess Power BI analysis, plain-language product explanations, self-service
demo configuration, website monitoring, contact/company enrichment, company
research, competitive and market intelligence, paperwork, and meeting
assistance including scheduling. These directions do not imply implemented
tools or authorization to contact people.

The agent system provides 137 specialized subagents that Claude invokes using the
`Task` tool. Each agent is a markdown file with a YAML frontmatter block (or embedded
YAML section) that declares its name, model, tools, and purpose. Agents are organized
into domain-specific directories so they are easy to find and extend.

## Why agents instead of one general assistant

A single general-purpose assistant accumulates context and loses precision on
specialized tasks. Agents isolate concerns: a `k8s-debugger` knows Kubernetes
deeply and nothing else, which keeps its instructions tight and its output reliable.
The master orchestrators (angelos-symbo, ultrathink) handle decomposition and
delegation — specialized agents handle execution.

## Agent file format

```markdown
---
name: agent-name
description: One-line description. Tells Claude when to invoke this agent.
tools: Read, Grep, Glob, Bash, Write, Edit
model: sonnet
memory: project
---

You are a [role]. [System prompt defining behavior, checklist, output format...]
```

Some agents use an embedded YAML block instead of frontmatter:

```markdown
# Agent Title

## Agent Metadata
\`\`\`yaml
name: agent-name
model: opus
category: orchestration
keywords:
  - keyword1
  - keyword2
\`\`\`
```

The `description` field (or the keywords list) is what Claude reads to decide
whether to invoke this agent. Write descriptions as "use this when..." phrases.

## Top-level core agents (8)

These eight agents live directly in `agents/` and are the most broadly applicable.
They are proactively invoked across all domains.

| Agent | Model | Purpose |
|-------|-------|---------|
| `code-reviewer` | sonnet | Post-write code review: security, type safety, error handling, N+1 queries |
| `debugger` | sonnet | Systematic debugging: reproduce, isolate, fix, regression-test |
| `doc-writer` | haiku | Documentation for code, APIs, and architecture |
| `docker-ops` | haiku | Docker build, push, compose, multi-stage image management |
| `k8s-image-auditor` | sonnet | Audits K8s deployments for stale images and pull policy misconfigurations |
| `researcher` | haiku | Fast lookup and web research via MCP tools |
| `security-reviewer` | sonnet | Security audit: injection, secrets exposure, auth flaws, dependency CVEs |
| `test-writer` | sonnet | Test generation: unit, integration, edge cases, regression tests |

## Subdirectory catalog (28 categories, 129 agents)

| Directory | Count | Domain |
|-----------|-------|--------|
| `orchestration/` | 12 | Master orchestrators, MCP experts, PR review, commit workflows |
| `development/` | 12 | Full-stack development: AI, GraphQL, Redis, Prisma, mobile, desktop |
| `github/` | 8 | GitHub workflows: issues, PRs, commits, branch management, Husky |
| `business-sales/` | 8 | Sales engineering, enterprise onboarding, pricing, customer success |
| `product-management/` | 7 | PRDs, sprint planning, roadmap, workflow optimization |
| `marketing-growth/` | 7 | Content, social media, ASO, growth hacking, community building |
| `design-ux/` | 7 | UX research, brand, visual storytelling, mobile UX, naming |
| `keycloak/` | 5 | Keycloak auth flows, realm admin, themes, identity federation |
| `membership-domain/` | 4 | Membership management, directory, analytics, engagement |
| `mobile/` | 4 | iOS, Android, React Native, Flutter |
| `data-ai/` | 4 | Analytics, A/B experiments, trend research, feedback synthesis |
| `mongodb-atlas/` | 4 | Schema design, query optimization, aggregation pipelines, Atlas admin |
| `utility/` | 4 | Context cleanup, registry management, plugin manager, regex |
| `testing/` | 4 | Vitest, database performance, test result analysis, optimization |
| `kubernetes/` | 4 | K8s architecture, debugging, security, resource optimization |
| `documentation/` | 4 | API docs generation, codebase analysis, CLAUDE.md updates, Context7 |
| `security/` | 4 | Enterprise security review, data privacy, AI ethics, legal |
| `frontend-theming/` | 3 | White-label, theme system architecture, theme builder |
| `helm/` | 3 | Helm chart development, release management, values management |
| `messaging/` | 3 | Kafka, RabbitMQ, event streaming architecture |
| `selenium-testing/` | 3 | Auth flow testing, member journey testing, Selenium architecture |
| `stripe-payment/` | 3 | Stripe integration, subscriptions, invoice management |
| `system-ops/` | 3 | Dependency analysis, environment management, shell scripting |
| `devops/` | 2 | Ansible automation, infrastructure provisioning |
| `migration/` | 2 | Code migration, refactoring and modernization |
| `multi-tenant/` | 2 | Multi-tenant architecture, tenant provisioning |
| `quality-gates/` | 2 | Coverage analysis, spec validation |
| `cloud/` | 1 | Pulumi infrastructure-as-code |

## Key agents spotlight

**`orchestration/ultrathink`** (model: opus) — Extended reasoning agent for problems
that need deep deliberation. Invoked when you use keywords like `ultrathink`,
`think harder`, or `analyze deeply`. Uses Claude's extended thinking API with
configurable token budgets. Ideal for architecture decisions, security threat modeling,
and multi-system analysis.

**`orchestration/angelos-symbo`** (model: opus) — Master orchestrator. Designs and
coordinates complex multi-agent workflows. Handles task decomposition, parallel
execution planning, context flow between agents, and graceful degradation when
sub-agents fail. The recommended starting point for any task requiring 3+ agents.

**`orchestration/feature-dev`** (model: sonnet) — Full-stack TDD agent. Implements
features end-to-end following the EXPLORE → PLAN → CODE → TEST → FIX → DOCUMENT
protocol. Writes tests before implementation and does not consider a feature complete
until all tests pass and documentation is updated.

## Adding a new agent

1. Create `agents/<category>/<name>.md`
2. Add YAML frontmatter with `name`, `description`, `tools`, and `model`
3. Write a focused system prompt — one responsibility, clear output format
4. Keep the description field precise: it controls when Claude chooses this agent

Do not duplicate responsibilities across agents. If an agent would mostly repeat
an existing one, extend the existing agent's system prompt instead.

## See also

- [../README.md](../README.md) — Platform overview and component relationships
- [../skills/README.md](../skills/README.md) — Skills that activate agents via triggers
- [../rules/README.md](../rules/README.md) — Rules that constrain agent behavior
