---
name: project-management-plugin:pm-init
intent: 8-phase interview-first project initialization with micro-task decomposition
tags:
  - project-management-plugin
  - command
  - pm-init
inputs: []
risk: medium
cost: medium
description: 8-phase interview-first project initialization with micro-task decomposition
---

# /pm:init — Interview-First Project Initialization

**Usage**: `/pm:init [--type software|content|research|business|auto] [--depth quick|standard|thorough] [--template webapp|api-service|ml-pipeline|mobile-app|infrastructure] [--dry-run] [--import-jira PROJ-123]`

## Core Rule (NEVER BREAK)

Run the full interview before generating ANY output files or project structure. Even if the user provides a complete, detailed description upfront, still ask the full question set. The interview exists to surface unstated assumptions, hidden constraints, and implicit expectations that users rarely volunteer. Skipping the interview produces shallow projects that fail during execution.

## Interview Protocol

Ask ONE question at a time and wait for the user's full answer before asking the next. Never combine two questions in a single message. If an answer is surprising or contradicts a prior answer, ask a clarifying follow-up before proceeding. Adapt follow-up questions based on what you learn — if the user mentions a constraint you did not anticipate, probe it before moving on.

Minimum 15 substantive questions across all 8 phases before synthesis. Do not count clarifying follow-ups toward that minimum. Never assume anything — confirm even obvious details. If the user seems impatient, explain: "These questions will prevent the system from building the wrong thing. Each answer shapes the task decomposition."

## Phase 1 — Project Identity (3–5 questions)

Ask at minimum:
1. What is this project, described in one sentence?
2. Who are the primary users and what will they do with it?
3. What specific problem does it solve, and for whom?
4. What does success look like in concrete, measurable terms six months from now?
5. Why does this project exist right now — what changed or what opportunity opened up?

## Phase 2 — Tech Stack (4–6 questions)

Ask at minimum:
1. What programming languages, frameworks, and databases are involved?
2. Are there external services, APIs, or third-party platforms you must integrate with?
3. Are these technology choices already decided, or is there flexibility to change them?
4. Why were these specific technologies chosen — performance, team familiarity, cost, existing contracts?
5. Are there infrastructure constraints (on-premise only, specific cloud provider, air-gapped environments)?
6. What is the target runtime environment — browser, mobile, desktop, server, embedded?

## Phase 3 — Team and Workflow (3–4 questions)

Ask at minimum:
1. How large is the team, and what are the roles (engineers, designers, PMs, QA)?
2. What is the Git workflow — trunk-based, feature branches, GitFlow?
3. How is code reviewed and approved before merging?
4. How is the application deployed — manually, CI/CD, blue-green, canary?

## Phase 4 — Testing and Quality (3–4 questions)

Ask at minimum:
1. What types of tests exist or should exist — unit, integration, E2E, performance, contract?
2. Is there a code coverage target or quality gate?
3. What CI/CD system is used, and what checks must pass before deploy?
4. How are bugs currently tracked, triaged, and resolved?

## Phase 5 — Security and Compliance (2–4 questions)

Ask at minimum:
1. What is the authentication and authorization model — who can access what?
2. How sensitive is the data handled by this system?
3. Are there regulatory requirements — GDPR, HIPAA, SOC 2, PCI-DSS, or industry-specific standards?
4. Are there specific security controls required by your organization or customers?

## Phase 6 — Domain Deep-Dive (3–5 questions)

Ask at minimum:
1. What are the key domain entities or data models that everything else depends on?
2. What are the hardest business rules — things that cannot be wrong without serious consequences?
3. What edge cases worry you most — scenarios that break assumptions or require special handling?
4. Are there known unknowns — areas where the team does not yet know how to solve the problem?
5. What existing systems must this integrate with, and what are their constraints?

## Phase 7 — PM Integration (2–3 questions)

Ask at minimum:
1. Are you using an external project management tool — Jira, Linear, Notion, Asana, ClickUp, or another?
2. If so, which workspace or board should tasks sync to?
3. Do you have API credentials configured, or will you set them up after project creation?

## Phase 8 — Pain Points and Goals (2–4 questions)

Ask at minimum:
1. What is the hardest part of this project — the thing you are most uncertain about?
2. What has kept you up at night when thinking about this project?
3. What would make this project feel truly done and successful, beyond the feature list?
4. Is there anything else about constraints, context, or requirements that I should know before we start?

## Synthesis Round

After completing all 8 phases and all minimum questions, present a complete synthesis. Do not start writing files yet. Show the user:

- **Project name and ID** (slugified, e.g., `my-project-2026`)
- **Goal** (one sentence from Phase 1)
- **Tech stack summary**
- **Team and workflow summary**
- **Proposed phases** with brief descriptions and estimated task counts
- **Estimated total scope** (rough hours)
- **Top 3 risks** identified from the interview
- **Known unknowns** that will require spike research tasks
- **PM integration** plan (if applicable)

Then ask: "What did I miss or get wrong? Take a moment to correct anything before I generate the project." Incorporate all corrections before writing any files.

## File Generation

After the synthesis is accepted, generate the following:

1. Create `.claude/projects/{project-id}/` directory structure:
   - `project.json` — full project metadata
   - `plan.md` — human-readable project overview
   - `tasks.json` — initially empty (`{"tasks": [], "version": 1}`)
   - `checkpoints/` — directory for checkpoint files
   - `research/` — directory for research briefs
   - `artifacts/` — directory for task output artifacts
   - `progress/log.md` — running progress log
   - `sessions/` — directory for session summaries

2. Write `project.json` with fields:
   - `id`, `name`, `goal`, `type`, `status: "READY"`, `depth`
   - `tech_stack`, `team`, `workflow`, `security`, `compliance`
   - `pm_integration` (platform, external_project_id, or null)
   - `phases` array with phase IDs, names, and descriptions
   - `risks` array
   - `known_unknowns` array
   - `created_at`, `updated_at`
   - `focus_scope: null`

3. Write `plan.md` in human-readable markdown covering all interview findings.

4. Set `status: READY` in project.json.

5. Confirm: "Project '{name}' created (ID: {id}). Run `/pm:plan {id}` to decompose into tasks."

## Flag Behaviors

`--template {name}`: Before starting the interview, load the template from `plugins/project-management-plugin/templates/{name}.json`. Pre-populate tech stack, phase structure, and default tasks. Skip Phase 2 questions that are already answered by the template. Announce: "Using template '{name}'. I will skip questions already answered by the template."

`--import-jira PROJ-123`: Before the interview, check whether the Atlassian MCP is available. If available, fetch the Jira epic or project and extract: title, description, existing issues, labels, and assignees. Use this as context for Phase 6 (domain deep-dive) and PM integration. Announce what was imported at the start of the interview.

`--dry-run`: After synthesis approval, display the planned `project.json` and `plan.md` content but do not write any files. Confirm: "Dry run complete. No files written. Remove --dry-run to create the project."

`--depth quick|standard|thorough`: Pass this value through to task decomposition so `/pm:plan` uses the correct granularity target when called later.
