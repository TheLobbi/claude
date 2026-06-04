---
name: scrapin-aint-easy:scrapin-crawl
intent: Trigger a documentation crawl for a specific source or all sources
tags:
  - scrapin-aint-easy
  - command
  - scrapin-crawl
inputs: []
risk: medium
cost: medium
description: Trigger a documentation crawl for a specific source or all sources
model: sonnet
allowed-tools:
  - Read
  - Bash
---

# /scrapin-crawl

Trigger an immediate crawl of one or all documentation sources.

## Usage

```
/scrapin-crawl <source-key>
/scrapin-crawl --all
```

## Behavior

1. If a source key is provided, call `scrapin_crawl_source` for that source
2. If `--all` is specified, iterate all sources in `@config/sources.yaml`
3. Report progress and completion statistics
4. After crawl, call `scrapin_graph_stats` to show updated graph state

## Available Sources

Check `@config/sources.yaml` for the full list. Common sources:
- `stripe` — Stripe API documentation
- `github-rest` — GitHub REST API
- `react-query` — TanStack Query
- `anthropic` — Anthropic API
- `mcp-sdk` — Model Context Protocol SDK
