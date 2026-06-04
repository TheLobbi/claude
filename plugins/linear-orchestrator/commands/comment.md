---
name: linear:comment
intent: Comment on issues, reply in threads, add reactions; supports markdown editor features and customer-request linkage
tags:
  - linear-orchestrator
  - command
  - comment
inputs:
  - id
  - body
risk: low
cost: low
description: Comment on issues (linear.app/docs/comment-on-issues)
---

# /linear:comment

Maps to `commentCreate`, `commentUpdate`, `commentDelete`, `reactionCreate`.

## Subcommands
- `/linear:comment ENG-123 "Body here"` — top-level comment
- `/linear:comment --reply <commentId> "Body"` — threaded reply
- `/linear:comment --edit <commentId> "New body"`
- `/linear:comment --delete <commentId>`
- `/linear:comment --react <commentId> :thumbsup:`

## Markdown features supported
- Inline code, code blocks, lists, headings, links
- `@mentions` (resolves email/name to user mention via SDK)
- `<file>` attachments via `attachmentLinkCreate` for non-uploaded URLs
- Cross-issue links rendered as Linear smart references (e.g. `ENG-456`)

## Bridge fan-out
- If a comment is created on a Linear issue mirrored to MS Planner, the `planner-linear-bridge` agent posts a copy as a Planner task comment (only if the parent task hasn't been deleted).
- Comments from Harness PR threads are mirrored back as Linear comments by the `harness-linear-bridge` agent.
