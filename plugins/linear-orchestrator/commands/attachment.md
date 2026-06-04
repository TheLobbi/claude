---
name: linear:attachment
intent: Upload files to Linear, link external URLs as attachments, and download/inspect existing attachments
tags:
  - linear-orchestrator
  - command
  - attachment
inputs:
  - action
risk: low
cost: low
description: Attachments + file storage (linear.app/developers/attachments, file-storage-authentication, how-to-upload-a-file-to-linear)
---

# /linear:attachment

Linear attachments come in two flavours:
- **File attachments** — uploaded to Linear's S3-backed file storage
- **Link attachments** — external URLs (PR, Figma, doc) rendered with rich preview

## Actions

### `upload --file <path> --to <issueId>`
The flow (https://linear.app/developers/how-to-upload-a-file-to-linear):
1. Call `fileUpload(input: { contentType, filename, size })` → returns `uploadUrl`, `headers`, `assetUrl`
2. PUT the file bytes to `uploadUrl` with the returned headers
3. Call `attachmentCreate(input: { issueId, url: assetUrl, title })`

Implementation in `lib/attachment-upload.ts`. Supports multipart for files >50MB.

### `link --url <url> --to <issueId> [--title <str>]`
- Mutation: `attachmentLinkCreate(issueId, url, title)`
- Linear infers preview type from URL (GitHub PR, Figma, Notion, Loom, etc.)

### `list --issue <id>`
- Returns attachments with type, source, title, URL

### `download <attachmentId> --to <path>`
- Authenticated GET to the asset URL (https://linear.app/developers/file-storage-authentication)
- Token in `Authorization` header (same as API)

### `delete <attachmentId>`
- Mutation: `attachmentDelete`

## Bridge behaviour
- Files attached to a Linear issue with active Harness sync are also pushed to the linked PR as a comment with the asset URL (links, not file copies, to avoid double storage)
- Files on issues with active Planner sync are uploaded to the linked OneDrive/SharePoint location associated with the Planner plan (via Microsoft Graph `driveItem` upload)
