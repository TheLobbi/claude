---
name: suggest-upgrades
intent: Multi-agent council analyzes your project and suggests 3-5 confidence-scored upgrades with visual impact dashboard
tags:
  - upgrade-suggestion
  - command
  - spark
  - improvements
  - council
inputs:
  - scope
  - focus
  - depth
  - count
risk: low
cost: medium
description: AI-powered upgrade intelligence. Spawns a council of specialist agents (performance, security, architecture, UX, DX) that analyze your codebase in parallel, vote on findings with confidence scores, and present a visual impact dashboard with heatmaps, sparklines, and before/after previews.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Agent
  - AskUserQuestion
---

# Suggest Upgrades v2.0 — Multi-Agent Upgrade Intelligence

Analyze your project with a **council of specialist agents** and produce confidence-scored,
visually rich upgrade suggestions. Each suggestion includes impact heatmaps, effort
estimates, before/after previews, and implementation roadmaps.

## Usage

```bash
/suggest-upgrades                              # Standard council analysis of recent changes
/suggest-upgrades --scope project              # Full project analysis
/suggest-upgrades --scope src/api/             # Specific path
/suggest-upgrades --focus performance          # Filter to performance upgrades
/suggest-upgrades --focus innovation           # Focus on innovative new features
/suggest-upgrades --depth quick                # Fast single-agent analysis
/suggest-upgrades --depth deep                 # Full council + fingerprint + roadmap
/suggest-upgrades --count 5                    # Expanded suggestions (5 instead of 3)
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR                         │
│  1. Fingerprint project                                │
│  2. Spawn council agents in parallel                   │
│  3. Collect findings on shared blackboard              │
│  4. Synthesize consensus with weighted voting           │
│  5. Render visual dashboard                            │
└────┬──────┬──────┬──────┬──────┬──────┬────────────────┘
     │      │      │      │      │      │
     ▼      ▼      ▼      ▼      ▼      ▼
   Perf   Sec    Arch    UX     DX   Innovation
   Agent  Agent  Agent  Agent  Agent  Radar
```

## Execution Steps

### Phase 1: Project Fingerprinting (15 seconds)

Build a comprehensive project profile before spawning agents. This gives agents
targeted context so they don't waste time on irrelevant analysis.

**Detect and record:**

```yaml
fingerprint:
  language: typescript | python | go | rust | java | mixed
  frameworks: [next, react, express, fastapi, django, ...]
  infrastructure:
    containerized: boolean  # Dockerfile present
    orchestrated: boolean   # k8s/helm present
    ci_cd: github-actions | gitlab-ci | jenkins | none
    cloud: aws | gcp | azure | none
  architecture:
    pattern: monolith | monorepo | microservices | serverless
    api_style: rest | graphql | grpc | mixed
    state_management: redux | zustand | context | none
  quality:
    typescript_strict: boolean
    linter: eslint | biome | none
    formatter: prettier | biome | none
    test_framework: jest | vitest | pytest | none
    test_coverage: high | medium | low | none
  scale:
    file_count: number
    src_lines: number
    dependency_count: number
    contributor_count: number  # from git log
```

**Detection rules** (check in order, stop when identified):

| Signal | Detection | Identifies |
|--------|-----------|------------|
| `package.json` + `next` dep | File read | Next.js |
| `package.json` + `react` dep | File read | React SPA |
| `package.json` + `vue` dep | File read | Vue.js |
| `package.json` + `@angular/core` | File read | Angular |
| `package.json` + `express`/`fastify`/`@nestjs/core` | File read | Node API |
| `pyproject.toml`/`requirements.txt` + `fastapi` | File read | FastAPI |
| `pyproject.toml`/`requirements.txt` + `django` | File read | Django |
| `go.mod` | File exists | Go |
| `Cargo.toml` | File exists | Rust |
| `pom.xml`/`build.gradle` | File exists | Java |
| `Dockerfile` | File exists | Containerized |
| `Chart.yaml`/`k8s/`/`kubernetes/` | File/dir exists | Orchestrated |
| `.github/workflows/` | Dir exists | GitHub Actions CI |
| `terraform/`/`*.tf` | File/dir exists | IaC |
| `tsconfig.json` → `"strict": true` | File read | Strict TS |
| `.eslintrc*`/`eslint.config.*` | File exists | ESLint |
| `prettier.config.*`/`.prettierrc*` | File exists | Prettier |
| `jest.config.*`/`vitest.config.*` | File exists | Test framework |

### Phase 2: Council Assembly (parallel agents)

Based on depth setting, spawn agents:

**Quick mode** — Single `upgrade-analyst` agent (original behavior, fast):
- Uses the `upgrade-analysis` skill
- Returns 3 suggestions in <60 seconds

**Standard mode** — 3 specialist agents in parallel:
- `performance-specialist` — Bundle size, render perf, query optimization, caching
- `architecture-specialist` — Patterns, coupling, abstractions, error handling
- Pick 1 based on fingerprint: `security-specialist`, `ux-specialist`, or `dx-specialist`

**Deep mode** — All 5 specialists + innovation radar:
- All 5 specialist agents run in parallel
- `innovation-radar` skill applied to identify cutting-edge improvements
- Results synthesized by `council-synthesizer` agent
- Generates upgrade roadmap with sequencing

**Agent spawn pattern:**
```
Use the Agent tool to spawn each specialist with this context:

Prompt template for each specialist:
"You are the [ROLE] specialist in an upgrade council. Analyze this project
and return your top 5 findings as structured data.

PROJECT FINGERPRINT:
[paste fingerprint YAML]

SCOPE: [recent changes / full project / specific path]
FOCUS: [focus area or 'any']

FILES TO ANALYZE:
[list of files in scope]

Return findings as a YAML block:
```yaml
findings:
  - title: "Short action-oriented title"
    category: performance|security|architecture|ux|dx|innovation
    severity: critical|high|medium|low
    confidence: 0.0-1.0
    impact: 1-10
    effort: 1-10  # higher = easier
    files:
      - path: "src/api/handler.ts"
        lines: "42-67"
        issue: "What's wrong here"
    description: "2-3 sentences on what to do and why"
    before_after:
      before: "Current behavior or code pattern"
      after: "What it looks like after the upgrade"
    tags: [caching, react, bundle-size]
    prerequisites: []  # other upgrades that should happen first
    implementation_hint: "Key steps to implement"
```"
```

### Phase 3: Blackboard Synthesis

Collect all findings from all agents onto a shared "blackboard":

1. **Deduplicate** — Merge findings that reference the same files/issues
   - If 2+ agents flag the same file/pattern, BOOST confidence by 0.15 per agreement
   - Tag as "council consensus" when 3+ agents agree

2. **Score with weighted voting:**

   | Factor | Weight | Description |
   |--------|--------|-------------|
   | Impact | 30% | How much does this improve the project? (1-10) |
   | Effort (inverted) | 20% | How easy to implement? (1-10, higher = easier) |
   | Confidence | 25% | How confident is the council? (0-1, boosted by consensus) |
   | Relevance | 15% | How related to current work? (1-10) |
   | Innovation | 10% | How novel/forward-looking? (1-10) |

   ```
   CompositeScore = (Impact * 0.30) + (Effort * 0.20) + (Confidence * 10 * 0.25)
                  + (Relevance * 0.15) + (Innovation * 0.10)
   ```

3. **Ensure diversity** — No more than 2 from the same category in top results

4. **Bundle detection** — If 2+ upgrades are prerequisites or complementary, group
   them as an "Upgrade Bundle" with combined impact score

### Phase 4: Visual Dashboard Rendering

Present results using this rich visual format:

```
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   ⚡ UPGRADE INTELLIGENCE REPORT                                    ║
║   ─────────────────────────────────────────────────────────────────  ║
║   Project:  my-app (Next.js + TypeScript + PostgreSQL)               ║
║   Scope:    Recent changes (last 5 commits)                          ║
║   Council:  5 specialists · 23 signals detected · 12 deduplicated   ║
║   Depth:    Standard                                                 ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║   PROJECT HEALTH SNAPSHOT                                            ║
║   ┌─────────────┬─────────────┬─────────────┬─────────────┐        ║
║   │ Performance │ Security    │ Architecture│ UX/DX       │        ║
║   │  ████████░░ │  ██████░░░░ │  ███████░░░ │  █████░░░░░ │        ║
║   │    78/100   │    55/100   │    68/100   │    48/100   │        ║
║   └─────────────┴─────────────┴─────────────┴─────────────┘        ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║   1  Add request-level caching to /api/products endpoint             ║
║   ─────────────────────────────────────────────────────────────────  ║
║   Category:    Performance                                           ║
║   Confidence:  ●●●●○ 92% (3/5 agents agree)                        ║
║   Impact:      ▰▰▰▰▰▰▰▰▱▱ 8/10                                    ║
║   Effort:      ▰▰▰▰▰▰▰▱▱▱ 7/10 (easy)                             ║
║   Innovation:  ▰▰▰▰▰▱▱▱▱▱ 5/10                                    ║
║   Score:       8.4 / 10                                              ║
║                                                                      ║
║   Files:  src/api/products.ts:42-67                                  ║
║           src/lib/db/queries.ts:89-112                               ║
║                                                                      ║
║   The /api/products endpoint re-queries the database on every        ║
║   request despite data changing only every ~5 minutes. Adding a      ║
║   stale-while-revalidate cache pattern would cut P95 latency         ║
║   from ~320ms to ~15ms for cached hits.                              ║
║                                                                      ║
║   Before:  const products = await db.query('SELECT * FROM ...')      ║
║   After:   const products = await cache.swr('products', fetchFn,     ║
║            { ttl: 300, staleWhile: 60 })                             ║
║                                                                      ║
║   Tags: #caching #api #database #p95-latency                        ║
║                                                                      ║
║ ──────────────────────────────────────────────────────────────────── ║
║                                                                      ║
║   2  [Next suggestion in same format...]                             ║
║                                                                      ║
║ ──────────────────────────────────────────────────────────────────── ║
║                                                                      ║
║   3  [Third suggestion...]                                           ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║   UPGRADE BUNDLES (complementary upgrades)                           ║
║   ┌──────────────────────────────────────────────────────────┐      ║
║   │  Bundle: "API Performance Pack"                          │      ║
║   │  Upgrades 1 + 3 work together — implement caching first, │      ║
║   │  then add rate limiting. Combined impact: 9.2/10          │      ║
║   └──────────────────────────────────────────────────────────┘      ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║   DIMENSION HEATMAP — Where your codebase needs attention            ║
║                                                                      ║
║   src/api/        ██████████ Perf ████░░░░░░ Sec  ██████░░░░ Arch   ║
║   src/components/ ████░░░░░░ Perf ██░░░░░░░░ Sec  ████████░░ UX    ║
║   src/lib/        ██████░░░░ Perf ████████░░ Sec  ██████████ Arch   ║
║   src/utils/      ██░░░░░░░░ Perf ██░░░░░░░░ Sec  ████░░░░░░ DX    ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║   WHAT'S NEXT?                                                       ║
║   ────────────                                                       ║
║   Pick an upgrade to implement:                                      ║
║     1 → Implement upgrade 1                                          ║
║     2 → Implement upgrade 2                                          ║
║     3 → Implement upgrade 3                                          ║
║     R → Show full upgrade roadmap (/upgrade-roadmap)                ║
║     D → Deep dive into a specific upgrade (/upgrade-deep-dive)      ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

### Phase 5: Interactive Follow-up

After presenting the dashboard, use `AskUserQuestion` with these options:

```yaml
question: "What would you like to do?"
options:
  - label: "Implement upgrade 1"
    description: "[title of upgrade 1]"
  - label: "Implement upgrade 2"
    description: "[title of upgrade 2]"
  - label: "Implement upgrade 3"
    description: "[title of upgrade 3]"
  - label: "Show upgrade roadmap"
    description: "See sequenced implementation plan for all upgrades"
```

If the user selects an upgrade:
1. Show the before/after preview with specific code changes
2. Implement the upgrade immediately
3. After implementation, run a quick re-scan to verify improvement
4. Update the health snapshot scores to show progress

## Quality Rules

- **Be specific**: Reference actual files, functions, and line numbers
- **Be confident**: Show confidence scores based on council agreement
- **Be visual**: Use the dashboard format — bars, heatmaps, sparklines
- **Be diverse**: Spread across dimensions; no more than 2 from same category
- **Be honest**: If the codebase is clean, say so and suggest innovations
- **Be actionable**: Each upgrade must be implementable in a single session
- **Show impact**: Always include before/after previews
- **Bundle wisely**: Group complementary upgrades that amplify each other

## Depth Comparison

| Feature | Quick | Standard | Deep |
|---------|-------|----------|------|
| Agents | 1 | 3 | 5 |
| Fingerprinting | Basic | Standard | Full |
| Council voting | No | Yes | Yes + weighted |
| Heatmap | No | Directory-level | File-level |
| Bundles | No | Yes | Yes + roadmap |
| Innovation radar | No | No | Yes |
| Before/after | Text | Text + code | Code + metrics |
| Time estimate | ~30s | ~60s | ~90s |

## See Also

- `/upgrade-roadmap` — Sequenced implementation plan across all detected upgrades
- `/upgrade-deep-dive` — Deep analysis of a single upgrade with full impact report
- `/simplify` — Review changed code for reuse, quality, and efficiency
- `/review` — Full code review
- `/quick-fix` — Rapid issue identification
