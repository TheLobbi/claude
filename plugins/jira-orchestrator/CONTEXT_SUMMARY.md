# jira-orchestrator — Context Summary

## Purpose
Enterprise Jira orchestration with 82 agents, 16 teams, 48 commands, 14 skills, 5 schema-validated workflows, and a read-only advisor. Features Atlassian MCP OAuth, Harness integration, Neon PostgreSQL, Redis caching, Temporal workflows, declarative workflow definitions, lifecycle telemetry hooks, and structured reasoning frameworks.

## At a glance
- 82 agents · 16 teams · 48 commands · 14 skills · 5 declarative workflows · read-only jira-advisor

## Workflows (`/jira:workflow run <name>`)
- `issue-delivery` (sequential) · `bug-triage` (conditional) · `epic-decomposition` (hierarchical) · `sprint-planning` (sequential) · `pr-review-board` (parallel)

## When to load
- Load this summary first for routing, scope checks, and capability matching.
- Open specific command/agent/skill/workflow files only when the task needs them.
- Use `/jira:advise` for prioritized next-best-action recommendations.

## When to open deeper docs
| Signal | Open docs | Why |
| --- | --- | --- |
| You need setup or usage details | README.md | Install steps and command/usage reference. |
| You are changing plugin behavior | the relevant commands/, agents/, or skills/ file | Source of truth for behavior. |
| You need the full inventory | commands/, agents/, skills/ directories | Complete list beyond this summary. |
