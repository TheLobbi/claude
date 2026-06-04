---
name: upgrade-deep-dive
intent: Deep analysis of a specific upgrade with full impact report, implementation plan, and risk assessment
tags:
  - upgrade-suggestion
  - command
  - deep-dive
  - analysis
inputs:
  - upgrade
  - format
risk: low
cost: medium
description: |
  Deep-dive analysis of a single upgrade. Produces a full impact report with risk assessment, implementation plan with numbered steps, affected file list, test strategy, rollback plan, and before/after code previews.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Agent
  - AskUserQuestion
---

# Upgrade Deep Dive

Drill into a **single upgrade** to produce a complete implementation briefing — risk
assessment, step-by-step plan, affected files, test strategy, and before/after
code previews.

## Usage

```bash
/upgrade-deep-dive --upgrade 1                    # Deep dive into upgrade #1 from last suggest-upgrades
/upgrade-deep-dive --upgrade "add caching"        # Deep dive by description
/upgrade-deep-dive --upgrade 2 --format markdown  # Exportable markdown report
/upgrade-deep-dive --upgrade 3 --format plan      # Just the implementation steps
```

## Execution Steps

### Step 1: Identify the Upgrade

Match the `--upgrade` argument to a recent suggestion from `/suggest-upgrades`.
If no recent suggestions exist, run a quick analysis to identify the upgrade.

### Step 2: Deep Analysis

Spawn a focused agent to perform thorough analysis of the upgrade target:

1. **Read ALL affected files** completely (not just the flagged lines)
2. **Trace dependencies** — what other code calls/imports the affected code?
3. **Check test coverage** — do tests exist for the affected code?
4. **Identify risks** — what could break? What are the edge cases?
5. **Research best practices** — what's the recommended approach for this pattern?

### Step 3: Generate Implementation Plan

Produce numbered, copy-pasteable implementation steps:

```yaml
implementation:
  prerequisites:
    - "Ensure @types/node is installed"
    - "Backup database before migration"
  steps:
    - step: 1
      action: "Create cache utility module"
      file: "src/lib/cache.ts"
      type: create
      description: "Implement SWR cache with configurable TTL"
    - step: 2
      action: "Modify products endpoint to use cache"
      file: "src/api/products.ts"
      lines: "42-67"
      type: modify
      description: "Wrap db.query() with cache.swr()"
    - step: 3
      action: "Add cache invalidation on write"
      file: "src/api/products.ts"
      lines: "89-95"
      type: modify
      description: "Call cache.invalidate('products') in POST/PUT handlers"
    - step: 4
      action: "Add tests for cache behavior"
      file: "src/api/__tests__/products.cache.test.ts"
      type: create
      description: "Test cache hit, miss, invalidation, and TTL expiry"
  validation:
    - "Run existing test suite: npm test"
    - "Verify cache hit rate in dev: check console logs"
    - "Load test: ab -n 1000 -c 10 http://localhost:3000/api/products"
  rollback:
    - "Revert src/lib/cache.ts and src/api/products.ts"
    - "No database changes to roll back"
```

### Step 4: Visual Output

```
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   UPGRADE DEEP DIVE                                                 ║
║   ─────────────────────────────────────────────────────────────────  ║
║   Upgrade:  Add request-level caching to /api/products              ║
║   Category: Performance                                              ║
║   Source:   Council consensus (3/5 agents agreed)                    ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║   IMPACT ASSESSMENT                                                  ║
║   ┌────────────────────────────────────────────────────────────┐    ║
║   │  Metric              Current        After         Delta   │    ║
║   │  ──────────────────  ─────────────  ──────────  ──────── │    ║
║   │  P95 Latency         320ms          15ms         -95%    │    ║
║   │  DB Queries/min      2,400          240          -90%    │    ║
║   │  Cache Hit Rate      0%             ~85%         +85%    │    ║
║   │  Memory Usage        120MB          135MB        +12%    │    ║
║   │  Bundle Size         no change      no change    0%      │    ║
║   └────────────────────────────────────────────────────────────┘    ║
║                                                                      ║
║   RISK MATRIX                                                        ║
║   ┌──────────────────┬──────────┬──────────────────────────────┐   ║
║   │ Risk             │ Level    │ Mitigation                    │   ║
║   │ ────────────────── ────────── ───────────────────────────── │   ║
║   │ Stale data       │ ▰▰▰▱▱ M │ SWR pattern: serve stale,    │   ║
║   │                  │          │ revalidate in background      │   ║
║   │ Memory pressure  │ ▰▰▱▱▱ L │ Set maxSize on cache, add    │   ║
║   │                  │          │ LRU eviction                  │   ║
║   │ Cache stampede   │ ▰▱▱▱▱ L │ Use lock/coalesce on miss    │   ║
║   │ Test regression  │ ▰▰▱▱▱ L │ Add cache-specific tests     │   ║
║   └──────────────────┴──────────┴──────────────────────────────┘   ║
║                                                                      ║
║   AFFECTED FILES (4 files, ~45 lines changed)                       ║
║   ┌──────────────────────────────┬──────────┬──────────────────┐   ║
║   │ File                         │ Action   │ Lines            │   ║
║   │ ──────────────────────────── │ ──────── │ ──────────────── │   ║
║   │ src/lib/cache.ts             │ CREATE   │ ~40 new          │   ║
║   │ src/api/products.ts          │ MODIFY   │ 42-67, 89-95     │   ║
║   │ src/api/__tests__/products.  │ CREATE   │ ~30 new          │   ║
║   │   cache.test.ts              │          │                  │   ║
║   │ src/types/cache.ts           │ CREATE   │ ~15 new          │   ║
║   └──────────────────────────────┴──────────┴──────────────────┘   ║
║                                                                      ║
║   IMPLEMENTATION PLAN                                                ║
║   ───────────────────                                                ║
║                                                                      ║
║   Step 1 of 4  Create cache utility                                  ║
║   File:        src/lib/cache.ts (new)                                ║
║   ┌─────────────────────────────────────────────────────────────┐   ║
║   │ import { LRUCache } from 'lru-cache';                       │   ║
║   │                                                              │   ║
║   │ interface CacheOptions {                                     │   ║
║   │   ttl: number;         // seconds                            │   ║
║   │   staleWhile?: number; // grace period for SWR              │   ║
║   │   maxSize?: number;                                          │   ║
║   │ }                                                            │   ║
║   │                                                              │   ║
║   │ export async function swr<T>(                                │   ║
║   │   key: string,                                               │   ║
║   │   fetchFn: () => Promise<T>,                                 │   ║
║   │   opts: CacheOptions                                         │   ║
║   │ ): Promise<T> { ... }                                        │   ║
║   └─────────────────────────────────────────────────────────────┘   ║
║                                                                      ║
║   Step 2 of 4  Wrap DB query with cache                              ║
║   File:        src/api/products.ts:42-67                             ║
║   ┌── Before ──────────────────────────────────────────────────┐   ║
║   │ export async function getProducts(req, res) {               │   ║
║   │   const products = await db.query('SELECT * FROM products');│   ║
║   │   return res.json(products);                                 │   ║
║   │ }                                                            │   ║
║   └─────────────────────────────────────────────────────────────┘   ║
║   ┌── After ───────────────────────────────────────────────────┐   ║
║   │ import { swr } from '../lib/cache';                         │   ║
║   │                                                              │   ║
║   │ export async function getProducts(req, res) {               │   ║
║   │   const products = await swr('products',                    │   ║
║   │     () => db.query('SELECT * FROM products'),               │   ║
║   │     { ttl: 300, staleWhile: 60 }                            │   ║
║   │   );                                                         │   ║
║   │   return res.json(products);                                 │   ║
║   │ }                                                            │   ║
║   └─────────────────────────────────────────────────────────────┘   ║
║                                                                      ║
║   [Steps 3-4 follow same format...]                                 ║
║                                                                      ║
║   VALIDATION CHECKLIST                                               ║
║   ☐ Run test suite: npm test                                        ║
║   ☐ Check cache hits in dev logs                                    ║
║   ☐ Load test: verify P95 drops below 50ms                         ║
║   ☐ Memory check: verify no leaks after 1000 requests              ║
║                                                                      ║
║   ROLLBACK PLAN                                                      ║
║   ☐ Revert cache.ts and products.ts changes                        ║
║   ☐ No data migrations to reverse                                  ║
║   ☐ No infrastructure changes needed                                ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║   WHAT'S NEXT?                                                       ║
║   ────────────                                                       ║
║   "Implement this upgrade"  — Start implementing now                ║
║   "Show me the tests"       — Generate test file first              ║
║   "Back to suggestions"     — Return to /suggest-upgrades           ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

### Step 5: Interactive Follow-up

Use `AskUserQuestion`:
- **Implement this upgrade** → Execute the implementation plan step by step
- **Show me the tests** → Generate test file first, then implement
- **Back to suggestions** → Return to the main upgrade list

## Quality Rules

- **Read affected files completely** — Don't guess at code structure
- **Show real code** — Before/after must reflect actual codebase code, not generic examples
- **Quantify impact** — Use numbers (latency, bundle size, query count) not just words
- **Identify real risks** — Every upgrade has tradeoffs; be honest about them
- **Make it actionable** — Steps should be copy-paste ready
- **Include rollback** — Every upgrade should be safely reversible

## See Also

- `/suggest-upgrades` — Generate the initial upgrade list
- `/upgrade-roadmap` — See all upgrades in sequenced plan
