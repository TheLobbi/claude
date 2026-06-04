---
name: confluence-documentation-creator
intent: Create Confluence documentation at orchestration phases with Jira/PR linking
tags:
  - confluence
  - documentation
  - jira
  - pr
  - orchestration
inputs: []
risk: medium
cost: medium
description: Create Confluence documentation at orchestration phases with Jira/PR linking
model: sonnet
effort: medium
maxTurns: 35
tools:
  - mcp__atlassian__createConfluencePage
  - mcp__atlassian__updateConfluencePage
  - mcp__atlassian__getConfluencePage
  - mcp__atlassian__searchConfluenceUsingCql
  - mcp__atlassian__addCommentToJiraIssue
  - Read
  - Grep
memory: true
background: false
isolation: false
---

# Confluence Documentation Creator

## Purpose

Creates comprehensive Confluence documentation at each orchestration phase with full linking to Jira issues and PRs.

## Input Context

```yaml
confluence_space: "PROJECT"
jira_issue_key: "PROJ-123"
jira_issue_url: "https://..."
github_pr_url: "https://..."
github_pr_number: 42
phase: "PLAN|CODE|TEST|DOCUMENT"
feature_name: "Feature Name"
version: "1.2.0"
project_root: "/path/to/project"
```

## Document Templates by Phase

### 1. Technical Design Document (PLAN Phase)

**Sections:**
- Executive Summary
- Problem Statement (Current/Desired/Success Criteria)
- Architecture Design (Overview, Components, Data Models, API Specs, DB Schema)
- Security Considerations (Auth, Data Protection, Input Validation, Audit Logging)
- Performance Considerations (Load, Caching, Database, Monitoring)
- Integration Points (External/Internal)
- Deployment Architecture (Requirements, Config, Rollout)
- Risk Assessment
- Open Questions
- References & Next Steps

### 2. Implementation Notes (CODE Phase)

**Sections:**
- Implementation Overview
- Code Architecture (Directory Structure, Key Files, Architectural Decisions)
- Key Abstractions & Patterns
- Integration Points (Internal/External)
- Configuration (Env Variables, Feature Flags)
- Database Changes (Migrations, Rollback)
- Error Handling (Types, Retry Logic)
- Performance Optimizations (Caching, DB, Code)
- Testing Considerations (Coverage, Utilities)
- Known Limitations
- Code Review Notes
- Implementation Checklist

### 3. Test Plan & Results (TEST Phase)

**Sections:**
- Test Strategy (Pyramid, Types)
- Unit Test Results (Coverage, Critical Cases)
- Integration Test Results (Scenarios, DB)
- E2E Test Results (User Journeys, Browser Compatibility)
- Performance Test Results (Load, Stress, DB Performance)
- Edge Cases & Boundary Testing
- Security Testing (Auth, Authorization, Input, Data Protection)
- Accessibility Testing (WCAG 2.1 AA)
- Regression Testing
- Test Failures & Issues
- Test Environment
- Coverage Gaps
- Sign-Off (Approvals)

### 4. Runbook/Operations Guide (DOCUMENT Phase)

**Sections:**
- Service Overview & Quick Links
- Deployment Guide (Prerequisites, Process, Strategies)
- Monitoring & Alerts (Key Metrics, Alert Rules, Dashboards)
- Troubleshooting Guide (Common Issues, Diagnosis, Resolution)
- Rollback Procedures
- Configuration Management (Env Vars, Secrets, Feature Flags)
- Scaling Guide (Horizontal/Vertical)
- Maintenance Procedures (Routine, Database)
- Disaster Recovery (Backup, Recovery, RTO/RPO)
- Security Considerations (Access Control, Best Practices)
- Runbook Changelog
- Contact Information & Escalation

### 5. Release Notes (CHANGELOG)

**Sections:**
- What's New (Features with description, benefits, usage)
- Improvements
- Bug Fixes
- Breaking Changes
- Migration Guide (Schema, Config, Code)
- Deprecation Notices
- Known Issues
- Upgrade Instructions (Docker, Kubernetes, npm)
- Performance Improvements (Benchmarks)
- Security Updates (CVEs)
- Dependencies Updated
- Documentation Updates
- Contributors & Rollback Instructions
- Support & References

## Page Hierarchy

```
{Project Space}/
├── Features/
│   └── {ISSUE-KEY} - {Feature Name}          [Parent]
│       ├── Technical Design                   [Child]
│       ├── Implementation Notes                [Child]
│       ├── Test Plan & Results                 [Child]
│       └── Runbook                            [Child]
├── API Documentation/
└── Release Notes/
```

## Implementation Workflow

### 1. Find Confluence Space

Search for project space by key or name. Ask user if not found.

### 2. Create Page Hierarchy

- Create parent page: `{ISSUE-KEY} - {Feature Name}`
- Create child pages for phase documents
- Use consistent naming: `{ISSUE-KEY} - {Document Type}: {Feature Name}`

### 3. Link Everything

- Add Confluence page links to Jira issue (comment)
- Add Confluence page links to GitHub PR (comment)
- Include Jira/PR links in Confluence pages
- Use canonical Confluence URLs for indexed pages from the Operations Index parent page (avoid ad-hoc editor URLs)

### 3a. Write Standardized Page Properties + Labels on Create/Update

For every new or updated page, always write/update page properties with these required keys:

- `issue-key`
- `release`
- `incident`
- `env`
- `service`

Also apply labels (when values are available):

- `issue-key`
- `release`
- `incident`
- `env`
- `service`

Do this on both create and update operations to keep index queries accurate.

### 3b. Generator Step: Operations Index Parent Page (Per Project/Quarter)

After page create/update, run an index generator step:

1. Resolve `project-key` and quarter value (for example `2026-Q1`).
2. Find or create parent page titled: `Operations Index - {project-key} - {quarter}`.
3. Use CQL (`searchConfluenceUsingCql`) to discover child pages by:
   - required page property keys (`issue-key`, `release`, `incident`, `env`, `service`)
   - labels and `project-key`/quarter metadata.
4. Rebuild parent page sections with canonical links to all discovered child pages:
   - Release Status
   - Incident Timeline
   - Rollback Log
   - SLA Breach Reports
5. Persist a deterministic ordering (updated date desc, then title asc).
6. Save canonical parent/child URLs for downstream Jira comments.

### 4. Content Discovery

Auto-populate documentation by analyzing codebase:
- Extract architecture from service/component files
- Parse TypeScript interfaces for data models
- Extract API specs from OpenAPI or route files
- Read test coverage from coverage reports
- Parse test results from test output

### 5. Error Handling

- Retry network failures (3 attempts, exponential backoff)
- Ask user for missing information
- Handle permission errors gracefully
- Log errors without failing silently

## Key Capabilities

- **Template Rendering:** Convert markdown templates to Confluence storage format
- **Auto-population:** Extract data from codebase to fill templates
- **Jira Integration:** Comment on issues with Confluence page links
- **GitHub Integration:** Comment on PRs with documentation links
- **Error Resilience:** Retry failed requests and handle missing data
- **Page Management:** Create, update, organize documentation pages
- **Cross-linking:** Connect related pages, issues, and PRs
- **Operations Index Generation:** Build and refresh project/quarter index pages from CQL-discovered children

## Best Practices

1. Link everything together (Confluence ↔ Jira ↔ GitHub)
2. Use consistent naming conventions
3. Create page hierarchy for organization
4. Auto-populate with real codebase data
5. Handle errors gracefully with retries
6. Update existing pages instead of duplicating
7. Include actual code snippets and metrics
8. Write required page property keys + labels on every create/update
9. Jira comments must include canonical links from the Operations Index (not ad-hoc URLs)

## Success Output

```
✅ Confluence Documentation Created

**Technical Design Document**
- URL: https://confluence.example.com/...
- Status: Published

**Links Created:**
- ✅ Jira comment added
- ✅ GitHub PR comment added

**Next Steps:**
1. Review document
2. Proceed to next phase
```

## See Also

- Jira Orchestration: `jira-orchestrator:jira-orchestration`
- PR Workflow: `jira-orchestrator:pr-workflow`
- Technical Design ADRs: Referenced in documents
