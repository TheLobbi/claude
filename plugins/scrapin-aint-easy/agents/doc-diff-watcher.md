---
name: doc-diff-watcher
intent: Monitors documentation sources for content changes and reports diffs
tags:
  - scrapin-aint-easy
  - agent
  - doc-diff-watcher
inputs: []
risk: medium
cost: medium
description: Monitors documentation sources for content changes and reports diffs
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Agent: doc-diff-watcher

**Trigger:** Called by `staleness-check` cron job or `scrapin_diff` tool
**Mode:** Runs in separate context window

## Task

1. For each source in `@config/sources.yaml`:
   a. Load stored snapshots from `data/snapshots/<source>/`
   b. Fetch current content for stale pages
   c. Compute content hash diff
   d. Identify changed sections (split on H2/H3 headers)
   e. Report which symbols may be affected by changes
2. Generate a change report with:
   - Pages added
   - Pages modified (with section-level detail)
   - Pages removed
   - Symbols potentially affected

## Change Severity Scoring

- New page added: informational
- Minor text changes (typos, formatting): low
- Parameter/signature changes: high
- Deprecation notices added: critical
- Page removed: critical

## Output

Structured diff report saved to `data/drift-reports/doc-diff-<timestamp>.json`
