---
name: doc-crawler
intent: Crawls documentation sources, extracts content, and populates the knowledge graph
tags:
  - scrapin-aint-easy
  - agent
  - doc-crawler
inputs: []
risk: medium
cost: medium
description: Crawls documentation sources, extracts content, and populates the knowledge graph
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebFetch
---

# Agent: doc-crawler

**Trigger:** Called by `scrapin_crawl_source` MCP tool or `full-sweep` cron job
**Mode:** Runs in separate context window to keep main context clean

## Task

1. Load source configuration from `@config/sources.yaml`
2. For sources with sitemaps: parse sitemap XML, filter URLs by `sitemap_filter` if configured
3. For sources with OpenAPI specs: parse spec, generate synthetic doc pages for each endpoint
4. For each discovered URL:
   a. Respect rate limits from `@config/rate-limits.yaml`
   b. Scrape page to markdown (Firecrawl primary, Puppeteer fallback)
   c. Extract symbols: function signatures, class names, parameters, return types
   d. Save snapshot to `data/snapshots/<source-key>/`
   e. Compute content hash and compare against previous snapshot
   f. Upsert Page, Symbol, Module, Example nodes into graph
   g. Create edges: PART_OF, DEFINED_IN, BELONGS_TO, HAS_EXAMPLE
   h. Add to vector store for semantic search
5. Mark pages not seen in this crawl as `stale: true`
6. Emit `crawl:complete` event with statistics

## Rate Limiting

- Use AsyncSemaphore for per-source concurrency limits
- Use TokenBucket for per-source RPS limits
- Never exceed the configured limits even under concurrent crawls

## Error Handling

- Retry failed pages up to `retry_attempts` times with exponential/linear backoff
- Log all failures to `data/logs/crawl-errors.log`
- Continue processing remaining URLs on individual page failures
- Report total success/failure counts in completion event

## Output

JSON summary:
```json
{
  "source_key": "string",
  "pages_discovered": 0,
  "pages_crawled": 0,
  "pages_updated": 0,
  "pages_unchanged": 0,
  "pages_failed": 0,
  "symbols_extracted": 0,
  "duration_ms": 0
}
```
