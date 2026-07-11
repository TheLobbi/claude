---
name: msagent-scaffold
intent: Scaffold a new Microsoft agent project on the chosen stack
tags:
  - microsoft-agents-expert
  - scaffold
  - project-setup
inputs:
  - stack (agent-framework|m365-sdk|teams|copilot-studio|foundry)
  - language (csharp|python|typescript)
  - agent name and purpose
  - target channels
risk: medium
cost: high
description: Generate a working starter project for Agent Framework, M365 Agents SDK, Teams AI Library, or Foundry Agent Service, with correct current package names, auth setup, and a runnable first agent
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# /msagent-scaffold — Scaffold a Microsoft Agent Project

Create a runnable starter project for the requested stack. Correct, current package names
matter more than volume — a scaffold that restores/installs cleanly beats a feature tour.

## Process

1. **Resolve the stack** — if not given, run the `/msagent-choose` flow first (one short
   round of questions, then recommend).
2. **Load the matching skill** (`skills/agent-framework`, `skills/m365-agents-sdk`,
   `skills/teams-agents`, or `skills/microsoft-foundry`) for the package names, minimal
   program shape, and auth requirements. Do not invent package IDs — if a package is not
   named in the skill, verify via Microsoft Learn before writing it into a project file.
3. **Generate the project**:
   - Project file(s) with pinned current package references
   - A minimal agent that answers a message end-to-end (echo + one LLM turn)
   - Auth/config: environment variables or `appsettings`/`.env` templates with placeholder
     values only — never real secrets
   - One tool/function registration as the extension example
   - A README with run instructions (local test host, playground, or CLI) and next steps
4. **Copilot Studio requests** don't scaffold code — produce a build sheet instead: agent
   description, instruction draft, topic outline, knowledge sources, tools/connectors to
   attach, and publishing channel checklist.
5. **Verify** what can be verified: builds/installs if the toolchain is available
   (`dotnet build`, `npm install`, `pip install -r`), otherwise state clearly what was not
   verified.

## Guardrails

- Placeholders for tenant IDs, client IDs, and endpoints — flag each one in the README.
- Prefer Entra ID / managed identity auth paths over API keys wherever the stack supports it.
- Note GA vs preview status for anything preview-gated.
