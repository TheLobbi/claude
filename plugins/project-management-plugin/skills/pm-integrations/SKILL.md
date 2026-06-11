---
intent: "Connect and sync project state with external PM platforms (GitHub Projects, Linear, Notion, Asana, Trello, ClickUp, Monday.com, Todoist, Local)"
description: "Connecting and syncing with GitHub Projects, Linear, Notion, Asana, Trello, ClickUp, Monday.com, Todoist, and Local"
---

# PM Integrations Skill

## Credential Handling

All PM platform credentials are read exclusively from environment variables injected by Claude Code's plugin userConfig system. The environment variable names follow the pattern `CLAUDE_PLUGIN_OPTION_{KEY}` where `{KEY}` is the uppercase version of the userConfig key defined in `plugin.json`. For example, the `github_token` userConfig entry is available at runtime as `CLAUDE_PLUGIN_OPTION_GITHUB_TOKEN`. Credentials are never hardcoded, never written to state files, never echoed in logs, and never included in research briefs or progress entries. If a credential is missing at sync time, the operation fails with a clear error naming the missing environment variable — it does not fall back to anonymous access or cached credentials.

## Sync Conflict Resolution Strategy

All integrations follow the same conflict resolution strategy: the plugin's internal task state is treated as the source of truth for task content (title, description, completion criteria, status). The external platform is treated as the source of truth for metadata that originates there (assignees, labels added externally, comments, external IDs). When a task is updated both internally and externally between syncs, the internal content wins for the fields the plugin owns (`title`, `description`, `status`, `priority`) and the external platform's values are preserved for fields the plugin does not manage (`assignees`, `external_labels`, `comments`). This means bidirectional sync is limited — the plugin pushes status changes outward and pulls external IDs inward, but does not attempt full two-way content sync.

## GitHub Projects

**Auth method:** Personal Access Token read from `CLAUDE_PLUGIN_OPTION_GITHUB_TOKEN`. The token requires `project` scope for GitHub Projects v2 API access and `repo` scope if the project is linked to a repository. Authentication is verified at connection time by calling the GraphQL `viewer` query; if it fails, the integration is aborted with a clear auth error.

**Key API operations:** GitHub Projects v2 uses a GraphQL API exclusively. Creating an issue: use the `createIssue` mutation on the linked repository, then add it to the project with `addProjectV2ItemById`. Updating status: use `updateProjectV2ItemFieldValue` with the Status field's ID. Listing tasks: use the `projectV2` query with item iteration, filtering by the project node ID. The project node ID is stored in `pm_integration.external_project_id` after initial connection.

**Field mapping:** Internal `title` → GitHub issue title. Internal `description` → issue body. Internal `status` maps to a GitHub project Status field: PENDING → "Todo", IN_PROGRESS → "In Progress", COMPLETE → "Done", BLOCKED → "Blocked" (custom field value; created if not present). Internal `priority` maps to a GitHub project Priority field if one exists; otherwise it is embedded as a label (`priority:critical`, `priority:high`, etc.). The internal `id` is stored as a custom text field named "pm-plugin-id" on the project item.

**Sync approach:** Push-first. On each sync cycle, all tasks with `status` changes since `last_sync_at` are pushed to GitHub first. Then tasks with a null `external_id` are created as new issues. Finally, any items in the GitHub project that do not have a "pm-plugin-id" field value matching a known internal task ID are logged as "untracked external items" in the progress log (they are not imported or deleted).

## Linear

**Auth method:** API Key read from `CLAUDE_PLUGIN_OPTION_LINEAR_API_KEY`. Linear uses this key in the `Authorization` header as a bearer token. Verified at connection by calling the `viewer` query on Linear's GraphQL API at `https://api.linear.app/graphql`.

**Key API operations:** Creating an issue: `issueCreate` mutation specifying `teamId`, `title`, `description`, and `stateId`. Updating status: `issueUpdate` mutation with the `stateId` corresponding to the target status. Listing tasks: `issues` query filtered by `teamId` and a label matching the project ID. The team ID and workflow state IDs are fetched once at connection time and cached in `pm_integration.external_project_id` as a JSON object (serialized).

**Field mapping:** Internal `title` → Linear issue title. Internal `description` → Linear issue description (markdown supported). Internal `priority` maps directly to Linear's priority integers: CRITICAL → 1 (Urgent), HIGH → 2 (High), MEDIUM → 3 (Medium), LOW → 4 (Low). Internal `status` maps to Linear workflow states: the mapping uses the state names "Todo," "In Progress," "Done," and "Cancelled" — if a team uses custom state names, the connection wizard prompts the user to map each internal status to the correct state. Internal `estimate_minutes` maps to Linear's cycle time estimate field (divided by 60, rounded to nearest 0.5).

**Sync approach:** Linear's webhook system is not available in the CLI context, so sync is polling-based. The sync cycle reads all issues in the team with the project label, compares their `updatedAt` timestamps against `last_sync_at`, and pulls status changes for issues whose external status differs from the internal status. Internal status is authoritative when both changed since last sync.

## Notion

**Auth method:** Integration Token read from `CLAUDE_PLUGIN_OPTION_NOTION_TOKEN`. Notion uses this token in the `Authorization: Bearer` header. The integration must be connected to the target Notion workspace page before it will have access. Verified at connection by calling `GET /v1/users/me`.

**Key API operations:** Creating a page (task) in a database: `POST /v1/pages` with `parent.database_id` set to the Notion database ID and properties matching the database schema. Updating properties: `PATCH /v1/pages/{page_id}`. Querying the database: `POST /v1/databases/{database_id}/query` with filter and sort options. Notion's API is REST-based and paginated; the sync layer handles cursor-based pagination automatically.

**Field mapping:** Internal `title` → Notion "Name" (title) property. Internal `status` → Notion "Status" select property with options matching internal status names. Internal `priority` → Notion "Priority" select property. Internal `description` → Notion page body as a paragraph block (sent as a Blocks write after page creation). Internal `estimate_minutes` → Notion "Estimate" number property (in minutes). Internal `tags` → Notion "Tags" multi-select property. The Notion database must have these property names; the connection wizard validates their presence and creates missing ones using the `PATCH /v1/databases/{database_id}` endpoint.

**Sync approach:** Notion does not support webhooks in the API tier available to integrations, so sync is polling-based using the `last_edited_time` property. Pages modified since `last_sync_at` are fetched and their status changes are reconciled using the conflict resolution strategy above.

## Asana

**Auth method:** Personal Access Token read from `CLAUDE_PLUGIN_OPTION_ASANA_TOKEN`. Sent in the `Authorization: Bearer` header. Verified at connection by calling `GET /api/1.0/users/me`. Asana also supports OAuth; the PAT is used here for simplicity in the CLI context.

**Key API operations:** Creating a task: `POST /api/1.0/tasks` with `workspace`, `name`, `notes`, `projects` (array), and `custom_fields`. Updating a task: `PUT /api/1.0/tasks/{task_gid}`. Listing tasks in a project: `GET /api/1.0/projects/{project_gid}/tasks`. Updating custom fields requires the custom field GID, fetched once at connection from `GET /api/1.0/projects/{project_gid}/custom_field_settings`.

**Field mapping:** Internal `title` → Asana task name. Internal `description` → Asana task notes (plain text; markdown is not rendered by Asana). Internal `status` maps to Asana task completion: COMPLETE → `completed: true`; all other statuses → `completed: false`. Finer-grained status (IN_PROGRESS, BLOCKED) is stored in a custom field named "Plugin Status." Internal `priority` maps to Asana's native priority field if available (Asana Premium), otherwise to a "Priority" custom field. Internal `estimate_minutes` maps to Asana's "Time estimate" field (if enabled) or a custom field.

**Sync approach:** Asana supports webhooks but requires a public HTTPS endpoint, which is not available in the CLI context. Sync is polling-based. The sync cycle uses the `modified_since` query parameter on the tasks endpoint to fetch only recently changed tasks.

## Trello

**Auth method:** Trello API Key from `CLAUDE_PLUGIN_OPTION_TRELLO_API_KEY` and Token from `CLAUDE_PLUGIN_OPTION_TRELLO_TOKEN`. Both are sent as query parameters: `key={api_key}&token={token}`. Verified at connection by calling `GET /1/members/me`. The API key is obtained from `https://trello.com/app-key`; the token is generated by the user via the Trello authorization URL.

**Key API operations:** Creating a card: `POST /1/cards` with `idList` (the target list ID), `name`, and `desc`. Updating a card: `PUT /1/cards/{card_id}`. Moving a card to a different list (status change): `PUT /1/cards/{card_id}/idList`. Listing cards in a board: `GET /1/boards/{board_id}/cards`. Lists on the board represent workflow stages and are fetched at connection time.

**Field mapping:** Internal `status` maps to Trello lists by name: PENDING → list named "To Do," IN_PROGRESS → "In Progress," VALIDATING → "In Review," COMPLETE → "Done," BLOCKED → "Blocked." If these list names do not exist, the connection wizard creates them. Internal `title` → card name. Internal `description` → card description. Internal `priority` → a colored label: CRITICAL → red, HIGH → orange, MEDIUM → yellow, LOW → green. Internal `tags` → Trello labels with matching names (created on the board if not present).

**Sync approach:** Trello webhooks require a callback URL; polling is used instead. The sync cycle fetches all cards in the board and compares `dateLastActivity` against `last_sync_at` to identify changed cards.

## ClickUp

**Auth method:** API Token read from `CLAUDE_PLUGIN_OPTION_CLICKUP_TOKEN`. Sent in the `Authorization` header (no "Bearer" prefix — ClickUp uses the token directly). Verified at connection by calling `GET /api/v2/user`.

**Key API operations:** Creating a task: `POST /api/v2/list/{list_id}/task` with `name`, `description`, `status`, and `priority`. Updating a task: `PUT /api/v2/task/{task_id}`. Listing tasks: `GET /api/v2/list/{list_id}/task` with filtering. ClickUp's task API supports rich metadata including custom fields, time estimates (in milliseconds), and dependencies.

**Field mapping:** Internal `title` → ClickUp task name. Internal `description` → ClickUp task description. Internal `status` → ClickUp status matching by name (PENDING → "Open," IN_PROGRESS → "In Progress," COMPLETE → "Complete," BLOCKED → "Blocked"). Internal `priority` → ClickUp priority integers: CRITICAL → 1 (Urgent), HIGH → 2 (High), MEDIUM → 3 (Normal), LOW → 4 (Low). Internal `estimate_minutes` → ClickUp `time_estimate` in milliseconds (multiply by 60,000).

**Sync approach:** ClickUp webhooks are available but require a public endpoint. Polling is used, with `date_updated_gt` filter set to `last_sync_at` millisecond timestamp.

## Monday.com

**Auth method:** API Key read from `CLAUDE_PLUGIN_OPTION_MONDAY_API_KEY`. Monday uses GraphQL exclusively; the key is sent in the `Authorization` header. Verified at connection by calling the `me` query.

**Key API operations:** Creating an item: `create_item` mutation with `board_id`, `item_name`, and `column_values` (JSON object mapping column IDs to values). Updating column values: `change_multiple_column_values` mutation. Listing items: `items_by_board` query with pagination. Column IDs are board-specific and fetched at connection time via the `boards` query with `columns` sub-selection.

**Field mapping:** Internal `title` → Monday item name. Internal `status` → Monday "Status" column (type: status) with label mappings configured during connection. Internal `priority` → Monday "Priority" column (type: color). Internal `description` → Monday "Notes" column (type: long_text). Internal `estimate_minutes` → Monday "Numbers" column named "Estimate (min)."

**Sync approach:** Monday supports webhooks requiring a public endpoint; polling is used. Items updated since `last_sync_at` are detected using the `updated_at` column.

## Todoist

**Auth method:** API Token read from `CLAUDE_PLUGIN_OPTION_TODOIST_TOKEN`. Todoist uses both a REST API (v2) and a Sync API. The token is sent in the `Authorization: Bearer` header. Verified at connection by calling `GET /rest/v2/projects`.

**Key API operations:** Creating a task: `POST /rest/v2/tasks` with `content`, `description`, `project_id`, `priority`, and `labels`. Updating a task: `POST /rest/v2/tasks/{task_id}` (Todoist uses POST for updates). Completing a task: `POST /rest/v2/tasks/{task_id}/close`. Listing tasks: `GET /rest/v2/tasks?project_id={id}`. Todoist does not support custom statuses beyond open/closed — subtler status distinctions are encoded in labels.

**Field mapping:** Internal `title` → Todoist task content. Internal `description` → Todoist task description. Internal `status` maps to open/closed state: COMPLETE → closed task (via close endpoint); BLOCKED → open task with label `blocked`; IN_PROGRESS → open task with label `in-progress`; PENDING → open task with no status label. Internal `priority` maps to Todoist priority integers (inverted): CRITICAL → p1, HIGH → p2, MEDIUM → p3, LOW → p4. Internal `tags` → Todoist labels. Internal `estimate_minutes` is stored in the task description as `[Estimate: Xm]` since Todoist has no native estimate field on the free tier.

**Sync approach:** Todoist webhooks require a public endpoint; polling is used via the REST API. Tasks are re-fetched in full on each sync cycle (Todoist's API does not support filtering by modification time on the REST endpoint).

## Local (No External Platform)

The "local" platform is selected when no external PM tool integration is desired. In local mode, all task state is maintained exclusively in the plugin's state files. The PM sync section of the dashboard shows "Local mode — no external sync." No credentials are required or accessed. This is the default mode for new projects that have not run `/pm-connect`.
