---
name: linear:webhook
intent: Register, verify, replay, and dead-letter Linear webhooks
tags:
  - linear-orchestrator
  - command
  - webhook
inputs:
  - action
risk: high
cost: low
description: Webhook lifecycle (linear.app/developers/webhooks)
---

# /linear:webhook

## Actions

### `register --url <url> [--resource Issue,Comment,...]`
- Mutation: `webhookCreate(input: { url, resourceTypes, allPublicTeams })`
- Generates and stores `LINEAR_WEBHOOK_SECRET` for signature verification
- Default resource types: Issue, Comment, IssueLabel, Cycle, Project, ProjectUpdate, Initiative, Customer, Reaction, Attachment, Document

### `list`
- Returns existing webhooks with last-delivery status

### `unregister <webhookId>`

### `verify --request-body <body> --signature <header>`
- HMAC-SHA256 verification helper
- Implementation in `lib/webhook-verify.ts`
- Constant-time comparison via `crypto.timingSafeEqual`

### `replay --since <duration>`
- Replays events from the dead-letter queue
- Useful after fixing a downstream bug or restoring a service

### `dlq`
- Lists events in DLQ with failure reason
- `--purge` removes them after manual reconciliation

## Webhook handler architecture

```
Linear → POST /linear/webhook
              ↓
       Verify signature (timingSafeEqual)
              ↓
       Idempotency check (event.id seen?)
              ↓
       Dispatch by resource type:
         Issue       → issue-curator + bridges
         Comment     → bridges (mirror to Harness/Planner)
         Cycle       → cycle-planner aggregator
         Customer    → customer-liaison
         Attachment  → attachment processor
              ↓
       On error → DLQ (with retry counter)
```

## Security checklist
- [x] HMAC-SHA256 verify with constant-time compare
- [x] Reject events older than 5 min (replay protection)
- [x] Idempotency by `delivery.id`
- [x] DLQ with max-3 retries before manual review
- [x] Never trust webhook payload — re-fetch via GraphQL when state matters
