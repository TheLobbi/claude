---
name: linear:customer
intent: Manage customers and customer requests — link to issues, track aggregate demand, route to teams
tags:
  - linear-orchestrator
  - command
  - customer
  - customer-requests
inputs:
  - action
risk: medium
cost: low
description: Customers + customer requests (linear.app/docs/customer-requests, linear.app/developers/managing-customers)
---

# /linear:customer

Customer requests aggregate user feedback against issues so PMs can see total demand. Backed by the `Customer` and `CustomerNeed` GraphQL types.

## Actions

### `create-customer`
- `--name <str>` (required)
- `--domain <str>` — used for auto-attribution from Slack/email
- `--tier <enterprise|growth|free>`
- `--external-id <str>` — your CRM ID (Stripe, HubSpot, Salesforce)
- Calls `customerCreate`

### `create-request`
- `--customer <id|name>` (required)
- `--issue <id>` — link to existing
- `--body <md>` — request description
- `--source <slack|email|intercom|manual>`
- Calls `customerNeedCreate`

### `link <requestId> --issue <id>`
- Re-targets a request to a different issue (e.g. de-duplication)

### `list`
- `--customer <id>` or `--issue <id>`
- `--unresolved` — only show requests on open issues
- Returns requests with customer + revenue weight if `tier` is set

### `merge <requestA> <requestB>`
- Merges two requests, keeping the older one as canonical

## Routing
The `linear-customer-liaison` agent watches webhooks for new requests and:
1. Matches by domain to existing Customer
2. If issue not specified, searches for similar open issues by embedding similarity
3. Routes to team owner; falls back to triage if no match

## Bridge behaviour
- New customer requests **do not** sync to Harness or Planner by default (they're product-PM concerns, not engineering tasks)
- Once a request is linked to an issue, that issue's lifecycle syncs normally
