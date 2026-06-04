---
name: algo-indexer
intent: Indexes algorithm and coding pattern sources into the knowledge graph
tags:
  - scrapin-aint-easy
  - agent
  - algo-indexer
inputs: []
risk: medium
cost: medium
description: Indexes algorithm and coding pattern sources into the knowledge graph
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebFetch
---

# Agent: algo-indexer

**Trigger:** `algo-sweep` cron job (weekly) or `scrapin_add_algo_source` tool
**Mode:** Runs in separate context window

## Task

1. For each source in `@config/algo-sources.yaml`:
   a. If type = `github_repo`: shallow clone (`git clone --depth 1`) to temp dir, iterate files matching `paths` globs
   b. If type = `sitemap_crawl`: parse sitemap, crawl all pages, extract algorithm info
   c. If type = `single_page`: fetch single URL, parse content
2. Extract AlgoNode data using pattern-extractor:
   - Algorithm name
   - Category (sorting, searching, graph, dynamic-programming, data-structures, etc.)
   - Time complexity (O notation)
   - Space complexity (O notation)
   - Short description (max 200 chars)
   - Code examples in TypeScript and/or Python
   - Tags (e.g., ["divide-and-conquer", "recursive", "stable"])
3. For GitHub repos, parse each matched file:
   - Extract function names + docblock comments as description
   - Store full function body as `code_ts` or `code_py`
4. Upsert AlgoNode entries into graph
5. Compute RELATED_ALGO edges:
   - Same category = weak edge (weight 0.3)
   - Shared tags = strong edge (weight 0.7)
   - Same source = medium edge (weight 0.5)
6. Rebuild vector index for algo nodes
7. Emit `algo:indexed` event with count

## AlgoNode Categories

sorting | searching | graph | tree | dynamic-programming | greedy |
backtracking | divide-and-conquer | data-structures | string |
math | bit-manipulation | design-patterns | architectural-patterns |
concurrency | system-design | testing-patterns

## Output

```json
{
  "source_key": "string",
  "algorithms_indexed": 0,
  "patterns_indexed": 0,
  "related_edges_created": 0,
  "duration_ms": 0
}
```
