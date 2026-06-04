---
name: linear:query
intent: Run arbitrary GraphQL queries with cursor pagination, filtering DSL, and complexity-budget rate limiting
tags:
  - linear-orchestrator
  - command
  - query
  - graphql
inputs:
  - query
risk: low
cost: medium
description: GraphQL query cookbook (linear.app/developers/filtering, pagination, rate-limiting; studio.apollographql.com/public/Linear-API)
---

# /linear:query

Escape hatch for arbitrary GraphQL.

## Usage
```bash
/linear:query 'query { viewer { name email } }'
/linear:query --file ./queries/my-query.graphql --vars '{"teamKey": "ENG"}'
/linear:query --paginate 'query($cursor: String) { issues(first: 50, after: $cursor) { ... } }'
```

## Flags
- `--file <path>` — read query from file
- `--vars <json>` — variables
- `--paginate` — auto-paginate using cursor-based pagination (https://linear.app/developers/pagination); collects all pages into a single result; respects rate limits
- `--complexity-budget <int>` — soft limit; pause if exceeded (https://linear.app/developers/rate-limiting)
- `--output <json|md|table>`

## Filtering DSL
Linear's filter language (https://linear.app/developers/filtering) supports nested boolean trees:
```graphql
issues(filter: {
  and: [
    { state: { type: { eq: "started" } } },
    { priority: { lte: 2 } },
    { or: [{ assignee: { isMe: true } }, { team: { key: { eq: "ENG" } } }] }
  ]
})
```

## Rate limiting
- Linear uses **complexity points**, not request count
- Each query pre-declares its complexity; the server returns budget remaining in headers
- `lib/client.ts` automatically backs off when budget < 20% remaining
- See: https://linear.app/developers/rate-limiting

## Schema reference
Apollo Studio: https://studio.apollographql.com/public/Linear-API/variant/current/schema/reference

## Deprecations
Linear publishes deprecations at https://linear.app/developers/deprecations. The `linear-graphql-expert` agent flags any deprecated fields used in your queries during code review.
