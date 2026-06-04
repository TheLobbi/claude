---
name: linear:documents
intent: Manage Linear issue documents and project documents — create, update, link, and version
tags:
  - linear-orchestrator
  - command
  - documents
inputs:
  - action
risk: low
cost: low
description: Issue + project documents (linear.app/docs/issue-documents, linear.app/docs/project-documents)
---

# /linear:documents

Documents in Linear are first-class — separate from comments and issue descriptions. Used for design docs, RFCs, runbooks attached to projects/issues.

## Actions

### `create`
- `--title <str>` (required)
- `--content <md>` or `--from-file <path>`
- `--scope project:<id>` or `--scope issue:<id>`
- Calls `documentCreate(input: { title, content, projectId | issueId })`

### `update <documentId>`
- `--content <md>` or `--patch <unified-diff>`
- Calls `documentUpdate`

### `list`
- `--project <id>` or `--issue <id>`
- Returns recent documents with last-updated timestamps

### `link <documentId> --to <project:id|issue:id>`
- Adds a cross-reference (creates a comment with smart-link)

## Editor compatibility
- Linear's editor is markdown-superset (https://linear.app/docs/editor); supports tables, callouts, mentions, smart-links
- When importing from Confluence/Notion, run `/linear:diff --normalize` first to coerce syntax

## Versioning
- Linear keeps document history server-side
- Use `documentVersions(documentId)` (read-only) to inspect; no client-side diff needed for `--show-history`
