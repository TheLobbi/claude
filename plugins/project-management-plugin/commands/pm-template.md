---
name: project-management-plugin:pm-template
intent: Use or create reusable project templates (webapp, api-service, ml-pipeline, mobile-app, infrastructure)
tags:
  - project-management-plugin
  - command
  - pm-template
inputs: []
risk: medium
cost: medium
description: Use or create reusable project templates (webapp, api-service, ml-pipeline, mobile-app, infrastructure)
---

# /pm:template — Project Templates

**Usage**: `/pm:template list | use {template-name} | create {project-id} --name {template-name}`

## Purpose

Manages reusable project templates. Templates pre-populate the project structure (phases, epics, default task types, tech-stack assumptions, and typical risk areas) so that `/pm:init` can skip questions that are already answered by the template. Templates reduce interview length for common project archetypes while still requiring the full domain deep-dive and team/workflow questions.

Templates are stored as JSON files in `plugins/project-management-plugin/templates/`.

## Subcommands

### list

`/pm:template list`

Display all available templates with their metadata. Built-in templates ship with the plugin; user-created templates are added by the `create` subcommand.

Output:

```
Available Project Templates
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Built-in:
  webapp            Web application with frontend + backend + database
                    Phases: 5 · Default epics: 18 · Est. scope: 80–200h
                    Stack assumptions: React, REST API, PostgreSQL

  api-service       Standalone API service with auth and documentation
                    Phases: 4 · Default epics: 12 · Est. scope: 40–100h
                    Stack assumptions: Node.js or Python, OpenAPI spec

  ml-pipeline       Machine learning data pipeline and model serving
                    Phases: 6 · Default epics: 20 · Est. scope: 120–300h
                    Stack assumptions: Python, data processing, model training

  mobile-app        Cross-platform mobile application
                    Phases: 5 · Default epics: 16 · Est. scope: 100–250h
                    Stack assumptions: React Native or Flutter, mobile backend

  infrastructure    Cloud infrastructure and deployment automation
                    Phases: 4 · Default epics: 14 · Est. scope: 60–150h
                    Stack assumptions: Terraform, Kubernetes, CI/CD

User templates:
  {name}            {description}
                    Created from: {source-project-name} on {date}
  ...

Use: /pm:init --template {name}
```

If no user templates exist: omit the "User templates" section.

### use

`/pm:template use {template-name}`

This subcommand is shorthand — it immediately starts `/pm:init` with the template pre-loaded. Equivalent to `/pm:init --template {template-name}`.

Before starting the interview: announce which template is loaded and which interview phases will be shortened:

```
Template loaded: {template-name}
Pre-populated: tech stack (Phase 2), default phase structure

Phases that will be skipped or shortened:
  Phase 2 (Tech Stack): only confirm/adjust pre-populated choices
  Template-specific phases are pre-structured

All other interview phases are required. Starting now.
```

Then proceed with the `/pm:init` interview protocol, skipping only the questions that the template fully answers. Template answers are presented to the user for confirmation, not assumed silently.

### create

`/pm:template create {project-id} --name {template-name} [--description "text"]`

Saves a completed project as a reusable template for future projects of the same type.

Steps:

1. Load `project.json` and `tasks.json` for `{project-id}`. If the project status is not COMPLETE: warn "Project is not complete. Templates created from incomplete projects may be missing phases or tasks. Proceed? (yes / no)"

2. Extract the template structure from the project:
   - Phase names, descriptions, and ordering
   - Epic names and descriptions (without task-level detail — too specific)
   - Default task type taxonomy (the kinds of tasks that appeared most, e.g., "CRUD endpoint", "migration", "test suite")
   - Typical risk areas identified during the project
   - Tech stack as "assumptions" (labeled clearly as defaults, not requirements)
   - Estimation multipliers: actual vs. estimated ratios by task type (from retrospective data if available)

3. Generalize the template — strip project-specific names, IDs, and one-off details. Replace specific entity names with placeholders like `{domain-entity}`, `{api-name}`, `{external-service}`.

4. Write to `plugins/project-management-plugin/templates/{template-name}.json`:

```json
{
  "name": "{template-name}",
  "description": "{description}",
  "created_from_project": "{project-id}",
  "created_at": "{iso-timestamp}",
  "type": "user",
  "phases": [
    {
      "name": "{Phase name}",
      "description": "{what this phase covers}",
      "typical_epics": ["{epic name}", ...]
    },
    ...
  ],
  "stack_assumptions": {
    "languages": [...],
    "frameworks": [...],
    "databases": [...],
    "external_services": [...]
  },
  "default_risk_areas": ["authentication", "data migration", ...],
  "estimation_multipliers": {
    "api_endpoint": 1.2,
    "database_migration": 1.8,
    "frontend_component": 1.0
  }
}
```

5. Announce: "Template '{template-name}' created and saved. Use it with: `/pm:init --template {template-name}` or `/pm:template use {template-name}`."

## Template Validation

When loading a template (during `/pm:init --template`), validate the JSON structure before use. If the template file is malformed: error with the parse issue and suggest running `/pm:template list` to verify available templates. Do not crash the init interview — fall back to template-free mode if the template cannot be loaded.
