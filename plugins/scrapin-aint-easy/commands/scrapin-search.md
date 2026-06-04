---
name: scrapin-aint-easy:scrapin-search
intent: Search the documentation knowledge graph for symbols, concepts, or patterns
tags:
  - scrapin-aint-easy
  - command
  - scrapin-search
inputs: []
risk: medium
cost: medium
description: Search the documentation knowledge graph for symbols, concepts, or patterns
model: sonnet
allowed-tools:
  - Read
  - Grep
---

# /scrapin-search

Semantic search across all indexed documentation and algorithm nodes.

## Usage

```
/scrapin-search <query> [--limit N] [--filter <label>]
```

## Behavior

1. Call `scrapin_search` with the user's query
2. For the top 3 results, call `scrapin_graph_query` with `include_siblings: true` to enrich context
3. Present results in a clear, ranked format with:
   - Symbol name and kind
   - Source documentation link
   - Brief description
   - Related symbols (siblings)
4. If no results found, suggest running `scrapin_crawl_source` for the relevant package

## Examples

- `/scrapin-search useQuery` — Find TanStack Query's useQuery hook
- `/scrapin-search stripe payment intent` — Find Stripe PaymentIntent docs
- `/scrapin-search binary search --filter AlgoNode` — Search algorithms only
