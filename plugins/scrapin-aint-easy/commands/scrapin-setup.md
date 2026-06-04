---
name: scrapin-aint-easy:scrapin-setup
intent: Interactive project setup — conducts a thorough interview then generates complete Claude Code configuration
tags:
  - scrapin-aint-easy
  - command
  - scrapin-setup
inputs: []
risk: medium
cost: medium
description: Interactive project setup — conducts a thorough interview then generates complete Claude Code configuration
model: opus
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
---

# /scrapin-setup

Interactive, interview-driven project setup that generates a complete Claude Code configuration
tailored to the user's project.

## CRITICAL RULES

1. **ONE question at a time.** Wait for the answer before asking the next.
2. **NEVER use dates or timelines** unless the user specifically asks for them.
3. **Adapt dynamically** — each answer should spawn new, specific follow-up questions.
4. **Be genuinely curious** — dig deeper on surprising or ambiguous answers.
5. **Minimum 15 substantive questions** before generating ANY output.
6. **Never assume** — confirm even things that seem obvious.

## Interview Flow

### Phase 1: Project Identity (3-5 questions)
Start warm and open-ended. Understand WHAT this project is, WHO it's for, and WHY it exists.

Example openers:
- "Tell me about this project — what does it do and who uses it?"
- "What problem were you trying to solve when you started this?"
- "If you had to explain this to a new team member in 30 seconds, what would you say?"

Follow up on: non-obvious stakeholders, scale, maturity, competitive landscape.

### Phase 2: Tech Stack & Architecture (4-6 questions)
Discover the full technology picture. Don't just list — understand WHY each choice was made.

Topics to cover:
- Languages, frameworks, major libraries
- Database(s) and data stores
- API style (REST, GraphQL, gRPC, etc.)
- Architecture pattern (monolith, microservices, serverless, monorepo)
- Frontend vs backend split
- External services and integrations

Follow up on: pain points with current stack, things they'd change, technical debt.

### Phase 3: Team & Workflow (3-4 questions)
How do humans work on this codebase?

Topics:
- Team size and composition (roles, experience levels)
- Branching strategy (trunk-based, gitflow, etc.)
- Code review process
- How changes get deployed
- Communication tools and patterns

### Phase 4: Testing & Quality (3-4 questions)
What does "quality" mean for this project?

Topics:
- Test types used (unit, integration, e2e, contract, snapshot)
- Coverage expectations or requirements
- CI/CD pipeline
- How bugs get caught and triaged
- Performance testing or monitoring

### Phase 5: Security & Compliance (2-4 questions)
Only go deep if relevant. Adjust based on project type.

Topics:
- Authentication/authorization model
- Data sensitivity (PII, financial, health)
- Regulatory requirements (GDPR, HIPAA, SOC2, etc.)
- Secrets management approach

### Phase 6: Domain Deep-Dive (3-5 questions)
Understand the business domain — this is what makes config TRULY useful.

Topics:
- Key domain entities and their relationships
- Business rules and invariants ("X must never happen")
- Domain terminology that might confuse an AI
- Edge cases that have caused bugs before

### Phase 7: Pain Points & Goals (2-4 questions)
What would make their work life better?

Topics:
- What's hard right now?
- What breaks often?
- What's undocumented that should be?
- What would "great AI-assisted development" look like for them?

### Phase 8: Synthesis & Confirmation
Before generating ANYTHING:

1. Present a structured summary of everything learned
2. Ask: "What did I miss? What did I get wrong?"
3. Incorporate corrections
4. Ask: "Ready for me to generate the configuration?"

## Generation Phase

After interview is complete and user confirms, generate:

### 1. Root CLAUDE.md
Tailored project summary, stack description, workflow guide, reference document links.

### 2. .claude/rules/
- `coding.md` — Language/framework conventions specific to this project
- `testing.md` — Test requirements, locations, how to run
- `security.md` — Auth rules, secrets handling, data policies
- `infra.md` — Deployment, environments, CI/CD conventions
- `review.md` — PR checklist tailored to this project
- `product.md` — Product principles to preserve during code changes

### 3. .claude/skills/
Based on what the team actually needs:
- `code-review/` — If they do code reviews (most teams)
- `release-notes/` — If they publish changelogs
- `migration-planner/` — If they do schema/API migrations
- `bug-triage/` — If they handle bug reports
- `project-setup/` — This setup skill itself (for re-runs)

### 4. .claude/templates/
- `pr-description.md` — PR template matching their review process
- `design-doc.md` — RFC/ADR skeleton matching their decision process
- `test-plan.md` — Test plan template matching their testing approach
- `incident-report.md` — If they do incident response

### 5. .claude/agents/
Persona/context packs based on team structure:
- `backend-architect.md` — If they have backend concerns
- `frontend-specialist.md` — If they have frontend concerns
- `infra-guardian.md` — If they have infrastructure concerns
- `qa-analyst.md` — If they do structured QA

### 6. .claude/hooks/
Automation based on their workflow:
- `post-refactor/run-tests.yaml` — Run tests after large edits
- `post-refactor/update-docs.yaml` — Update docs after refactors
- `pre-merge/sanity-checks.yaml` — Checks before calling work "done"

### 7. docs/context/
Architectural documentation seeded from interview answers:
- `project-overview.md` — From Phase 1 answers
- `architecture.md` — From Phase 2 answers
- `domain-glossary.md` — From Phase 6 answers
- `testing-strategy.md` — From Phase 4 answers
- `security-rules.md` — From Phase 5 answers
- `constraints.md` — From pain points and non-negotiables
- `decisions/` — Key decisions discovered during interview

### 8. config/sources.yaml
Documentation sources based on their tech stack — auto-populate package aliases.

## Workspace & Repository Setup (CRITICAL)

During generation, the setup command MUST physically create the entire structure
in the **target workspace directory** (the directory where the user is working).

### Step 1: Discover the workspace

```bash
# Detect project root
pwd
git rev-parse --show-toplevel 2>/dev/null
ls -la package.json pyproject.toml Cargo.toml go.mod *.sln 2>/dev/null
```

- Identify the project root (git root or cwd)
- Detect if it's a monorepo (lerna.json, pnpm-workspace.yaml, nx.json, rush.json)
- List all sub-repositories if any

### Step 2: Discover existing structure

```bash
# What already exists?
ls -la .claude/ 2>/dev/null
ls -la docs/ 2>/dev/null
ls -la CLAUDE.md 2>/dev/null
```

- Do NOT overwrite existing files without asking
- If `.claude/` already exists, ask: "I see you have an existing configuration. Should I merge into it or start fresh?"
- If `CLAUDE.md` exists, read it first and incorporate existing content

### Step 3: Create all directories

```bash
mkdir -p .claude/{rules,skills,templates,agents,hooks/{post-refactor,pre-merge}}
mkdir -p docs/context/decisions
```

### Step 4: Create all files

Using the interview answers, create EVERY file with tailored content:

**Root:**
- `CLAUDE.md` — Tailored to this specific project

**`.claude/rules/`:**
- `coding.md` — Language/framework conventions from interview
- `testing.md` — Test types, locations, coverage from interview
- `security.md` — Auth, secrets, compliance from interview
- `infra.md` — Deployment, CI/CD from interview
- `review.md` — PR checklist from interview
- `product.md` — Product principles from interview

**`.claude/skills/`:**
- `code-review/SKILL.md` + checklist + template + examples
- `release-notes/SKILL.md` + template + examples (if applicable)
- `migration-planner/SKILL.md` + playbook (if applicable)
- `bug-triage/SKILL.md` + heuristics (if applicable)
- Additional skills based on interview answers

**`.claude/templates/`:**
- `pr-description.md`
- `design-doc.md`
- `test-plan.md`
- `incident-report.md` (if applicable)

**`.claude/agents/`:**
- Persona agents based on team roles from interview
- At minimum: one backend-focused and one frontend-focused if applicable

**`.claude/hooks/`:**
- `post-refactor/run-tests.yaml`
- `post-refactor/update-docs.yaml`
- `pre-merge/sanity-checks.yaml`

**`docs/context/`:**
- `project-overview.md` — From Phase 1 answers
- `vision-and-roadmap.md` — From Phase 1 (NO dates unless asked)
- `domain-glossary.md` — From Phase 6 answers
- `personas-and-use-cases.md` — From Phase 1 + 6
- `architecture.md` — From Phase 2 answers
- `architecture-runtime.md` — From Phase 2
- `architecture-deployment.md` — From Phase 2 + 7
- `data-model.md` — From Phase 2 + 6
- `data-migrations.md` — If applicable
- `api-contracts.md` — From Phase 2
- `api-guidelines.md` — From Phase 2
- `ux-flows.md` — If frontend exists
- `ux-principles.md` — If frontend exists
- `security-rules.md` — From Phase 5
- `compliance.md` — From Phase 5 (if applicable)
- `testing-strategy.md` — From Phase 4
- `test-inventory.md` — From Phase 4
- `constraints.md` — From pain points
- `performance.md` — From Phase 2 + 7
- `ops-and-runbooks.md` — If applicable
- `changelog.md` — Initialized
- `plan.md` — Current priorities
- `decisions/adr-template.md` — ADR template

### Step 5: Configure documentation sources

Based on the tech stack discovered in the interview:
- Auto-populate `config/sources.yaml` with package aliases matching their dependencies
- Parse `package.json` / `pyproject.toml` / `go.mod` for dependency list
- Map known packages to documentation sources

### Step 6: Initialize git tracking

```bash
# Stage the new files (specific files, not git add -A)
git add .claude/ docs/context/ CLAUDE.md
```

Ask the user if they want to commit: "I've created the configuration. Want me to commit these files?"

## Post-Generation

1. Run `scrapin_graph_stats` to verify setup
2. Show the user a full directory tree of what was generated
3. Show file count: "Created X files across Y directories"
4. Suggest next steps: "Run `/scrapin-crawl --all` to index your documentation sources"
5. Offer to refine any section: "Want me to go deeper on any of these?"
6. Offer to run initial drift baseline: "Want me to establish the agent drift baseline now?"

## IMPORTANT REMINDERS

- NEVER rush through the interview to get to generation
- NEVER generate boilerplate — everything must be tailored to interview answers
- NEVER include dates or timelines in generated content unless user asked
- ALWAYS physically create ALL directories and files — don't just describe them
- ALWAYS discover the workspace and existing repos before creating anything
- ALWAYS ask before overwriting existing configuration
- The interview IS the product — the generation is just the output
