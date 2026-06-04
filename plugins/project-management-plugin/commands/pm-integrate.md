---
name: project-management-plugin:pm-integrate
intent: Connect an external PM platform (Jira, Linear, Notion, Asana, Trello, ClickUp, Monday, Todoist, GitHub)
tags:
  - project-management-plugin
  - command
  - pm-integrate
inputs: []
risk: medium
cost: medium
description: Connect an external PM platform (Jira, Linear, Notion, Asana, Trello, ClickUp, Monday, Todoist, GitHub)
---

# /pm:integrate — Connect PM Platform

**Usage**: `/pm:integrate {project-id} --platform github|linear|notion|asana|trello|clickup|monday|todoist|local`

## Purpose

Connects the project to an external project management platform for bidirectional task sync. Sets up the integration mapping in `project.json` and verifies credentials. After connecting, use `/pm:sync` to push and pull task status.

The `local` platform means "no external sync — use local files only." Setting `--platform local` clears any existing integration.

## Supported Platforms

| Platform | Credential Env Var Keys | Notes |
|----------|------------------------|-------|
| github   | CLAUDE_PM_GITHUB_TOKEN, CLAUDE_PM_GITHUB_REPO | Creates issues in a GitHub repo |
| linear   | CLAUDE_PM_LINEAR_API_KEY, CLAUDE_PM_LINEAR_TEAM_ID | Syncs to Linear issues |
| notion   | CLAUDE_PM_NOTION_TOKEN, CLAUDE_PM_NOTION_DATABASE_ID | Syncs to a Notion database |
| asana    | CLAUDE_PM_ASANA_TOKEN, CLAUDE_PM_ASANA_PROJECT_ID | Syncs to Asana tasks |
| trello   | CLAUDE_PM_TRELLO_KEY, CLAUDE_PM_TRELLO_TOKEN, CLAUDE_PM_TRELLO_BOARD_ID | Syncs to Trello cards |
| clickup  | CLAUDE_PM_CLICKUP_TOKEN, CLAUDE_PM_CLICKUP_LIST_ID | Syncs to ClickUp tasks |
| monday   | CLAUDE_PM_MONDAY_TOKEN, CLAUDE_PM_MONDAY_BOARD_ID | Syncs to Monday.com items |
| todoist  | CLAUDE_PM_TODOIST_TOKEN, CLAUDE_PM_TODOIST_PROJECT_ID | Syncs to Todoist tasks |

## Steps

### Step 1 — Verify Credentials

Invoke the `pm-integrator` agent to check for the required environment variables for the specified platform (listed in the table above). The integrator looks for these in the Claude Code environment (set via `/pm enable` userConfig prompts or shell environment).

If any required credential is missing:
1. List the missing env var key names.
2. Explain how to set them: "Set these via the `/pm enable` command prompts, or add them to your shell environment before starting Claude Code."
3. Stop — do not proceed without credentials.

If all credentials are present: announce which keys were found (mask the values, show only the first 4 characters followed by `****`).

### Step 2 — Verify Connection

The `pm-integrator` makes a lightweight API call to verify the credentials are valid and the specified workspace/project/board exists. For example:
- GitHub: fetch the repository metadata
- Linear: fetch the team name
- Notion: fetch the database title
- Asana: fetch the project name

If the connection test fails: show the HTTP error or authentication error and stop. Common issues: wrong project/board ID, expired token, insufficient scopes.

If the connection succeeds: announce "Connected to {platform}: '{workspace/project name}'."

### Step 3 — Import Option

After successful connection, ask: "Import existing tasks from {platform}? (yes / no)"

If yes: invoke `pm-integrator` in import mode. It fetches all open issues/tasks/items from the external platform and converts them to local task records. The importer:
- Maps platform status (e.g., "In Progress" on Linear) to local status (`IN_PROGRESS`)
- Assigns MEDIUM priority by default unless the platform has priority fields
- Creates `completion_criteria` as `["External task requirements met as defined in {platform}"]` (minimal, since external tasks may not have structured criteria)
- Assigns task IDs continuing from the highest existing local ID
- Does NOT overwrite existing local tasks

Report: "Imported {n} tasks from {platform}. Review with `/pm:task show {id} T-{n}` to verify completion criteria."

If no: skip import.

### Step 4 — Write Integration Config

Write the platform configuration to `project.json` under the `pm_integration` key:
```json
{
  "platform": "{platform}",
  "external_project_id": "{repo/board/database id}",
  "external_project_name": "{name from connection test}",
  "connected_at": "{iso-timestamp}",
  "last_sync_at": null,
  "sync_direction": "bidirectional",
  "credential_keys": ["{list of env var names used}"]
}
```

Invoke `checkpoint-manager` to save state.

Announce: "Integration configured. Run `/pm:sync {id}` to push your first task batch to {platform}."

## Clearing Integration

`/pm:integrate {project-id} --platform local`

Sets `pm_integration: null` in `project.json`. Existing tasks in the external platform are not deleted. Announce: "Integration cleared. Tasks will no longer sync to an external platform."

## Atlassian (Jira) Note

If the user asks about Jira: check whether the Atlassian MCP (`mcp__claude_ai_Atlassian__*`) is available. If it is, Jira integration uses the MCP directly rather than credential env vars. Run `/pm:integrate {id} --platform jira` to trigger Jira-specific MCP flow.
