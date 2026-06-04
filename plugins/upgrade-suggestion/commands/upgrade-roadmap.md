---
name: upgrade-roadmap
intent: Generate a sequenced upgrade implementation plan with dependency graphs and timeline
tags:
  - upgrade-suggestion
  - command
  - roadmap
  - planning
inputs:
  - scope
  - horizon
  - team-size
risk: low
cost: medium
description: |
  Generates a prioritized, sequenced upgrade roadmap showing what to implement first, dependency chains between upgrades, estimated effort, and cumulative impact curves. Visualizes the optimal implementation path as a directed graph.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Agent
  - AskUserQuestion
---

# Upgrade Roadmap

Generate a **sequenced implementation plan** for all detected upgrades, organized by
priority waves with dependency tracking and cumulative impact visualization.

## Usage

```bash
/upgrade-roadmap                        # Sprint-horizon roadmap (solo dev)
/upgrade-roadmap --horizon quarter      # Quarter-length strategic plan
/upgrade-roadmap --team-size 4          # Adjust for team of 4
/upgrade-roadmap --scope src/api/       # Roadmap for specific area
```

## Execution Steps

### Step 1: Comprehensive Scan

Run `/suggest-upgrades --depth deep --count 5` logic internally to gather all upgrade
candidates. Don't filter to top 3 — collect ALL viable upgrades (typically 8-15).

### Step 2: Dependency Analysis

For each upgrade pair, determine if there's a dependency:

```
Types of dependencies:
- BLOCKS:      Upgrade A must complete before B can start
- ENABLES:     Upgrade A makes B significantly easier/more impactful
- CONFLICTS:   Upgrades A and B touch the same code — do sequentially
- AMPLIFIES:   Upgrades A and B together have synergistic impact
- INDEPENDENT: No relationship
```

Build a dependency graph (DAG) and verify it's acyclic.

### Step 3: Wave Planning

Group upgrades into implementation waves using topological sort:

```
Wave 1 (Foundation):  Upgrades with no dependencies — start here
Wave 2 (Build):       Upgrades that depend on Wave 1
Wave 3 (Polish):      Upgrades that depend on Wave 2
Wave 4 (Innovation):  Forward-looking upgrades, lowest urgency
```

Within each wave, sort by: `(Impact * 0.5) + (Effort_inverted * 0.3) + (Confidence * 0.2)`

### Step 4: Effort Estimation

Estimate each upgrade's effort adjusted for team size:

| Complexity | Solo Dev | Small Team (2-3) | Medium Team (4-8) |
|------------|----------|-------------------|---------------------|
| Trivial    | 30 min   | 20 min            | 15 min              |
| Simple     | 2 hours  | 1 hour            | 45 min              |
| Medium     | 4 hours  | 2 hours           | 1.5 hours           |
| Complex    | 1 day    | 4 hours           | 3 hours             |
| Major      | 2-3 days | 1 day             | 6 hours             |

### Step 5: Visual Output

```
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   UPGRADE ROADMAP                                                   ║
║   ─────────────────────────────────────────────────────────────────  ║
║   Project:    my-app                                                 ║
║   Horizon:    Sprint (2 weeks)                                       ║
║   Team size:  Solo developer                                         ║
║   Upgrades:   12 detected · 8 actionable · 4 deferred               ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║   DEPENDENCY GRAPH                                                   ║
║                                                                      ║
║   ┌─────────────┐     ┌──────────────┐     ┌──────────────┐        ║
║   │ Add caching  │────▶│ Rate limiting │────▶│ CDN setup    │        ║
║   │ (2h, 8/10)  │     │ (1h, 7/10)   │     │ (4h, 9/10)   │        ║
║   └─────────────┘     └──────────────┘     └──────────────┘        ║
║                                                                      ║
║   ┌─────────────┐     ┌──────────────┐                              ║
║   │ Zod schemas  │────▶│ API types gen │                             ║
║   │ (3h, 8/10)  │     │ (2h, 7/10)   │                              ║
║   └─────────────┘     └──────────────┘                              ║
║                                                                      ║
║   ┌─────────────┐                                                    ║
║   │ Error bounds │  (independent)                                    ║
║   │ (1h, 6/10)  │                                                    ║
║   └─────────────┘                                                    ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║   WAVE 1: FOUNDATION (Day 1-2)                   Total: ~6 hours    ║
║   ───────────────────────────────────────────────────────────────    ║
║   ☐ 1. Add Zod validation schemas          3h  Impact: ████████░░  ║
║   ☐ 2. Add request caching                 2h  Impact: ████████░░  ║
║   ☐ 3. Add error boundaries                1h  Impact: ██████░░░░  ║
║                                                                      ║
║   Cumulative impact: ░░░░░░░░░░ → ████████░░  (+35 health points)  ║
║                                                                      ║
║   WAVE 2: BUILD (Day 3-4)                        Total: ~5 hours    ║
║   ───────────────────────────────────────────────────────────────    ║
║   ☐ 4. Generate API types from schemas     2h  Impact: ███████░░░  ║
║   ☐ 5. Add rate limiting middleware        1h  Impact: ███████░░░  ║
║   ☐ 6. Extract shared auth middleware      2h  Impact: ██████░░░░  ║
║                                                                      ║
║   Cumulative impact: ████████░░ → █████████░  (+22 health points)  ║
║                                                                      ║
║   WAVE 3: POLISH (Day 5-7)                       Total: ~8 hours    ║
║   ───────────────────────────────────────────────────────────────    ║
║   ☐ 7. Add skeleton loading states         3h  Impact: ██████░░░░  ║
║   ☐ 8. Configure CDN for static assets     4h  Impact: █████████░  ║
║   ☐ 9. Add keyboard shortcuts              1h  Impact: ████░░░░░░  ║
║                                                                      ║
║   Cumulative impact: █████████░ → ██████████  (+18 health points)  ║
║                                                                      ║
║   WAVE 4: INNOVATION (Backlog)                                       ║
║   ───────────────────────────────────────────────────────────────    ║
║   ☐ 10. Add AI-powered search             8h  Impact: █████████░  ║
║   ☐ 11. Implement optimistic UI updates   4h  Impact: ███████░░░  ║
║   ☐ 12. Add real-time collaboration       12h  Impact: ████████░░  ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║   CUMULATIVE IMPACT CURVE                                            ║
║                                                                      ║
║   100│                                              ╭──── ●         ║
║      │                                    ╭─────────╯               ║
║    75│                          ╭─────────╯                          ║
║      │                ╭────────╯                                     ║
║    50│        ╭───────╯                                              ║
║      │   ╭───╯                                                       ║
║    25│╭──╯                                                           ║
║      │╯                                                              ║
║     0└──────────────────────────────────────────────── Time          ║
║       W1-1  W1-2  W1-3  W2-4  W2-5  W2-6  W3-7  W3-8  W3-9        ║
║                                                                      ║
║   Best ROI:  Upgrades 1-2 (Wave 1) deliver 60% of total impact     ║
║   Quick wins: Upgrades 3, 5, 9 each take ≤1 hour                    ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║   WHAT'S NEXT?                                                       ║
║   ────────────                                                       ║
║   Start with Wave 1:  "Implement wave 1"                            ║
║   Pick specific:      "Implement upgrade 4"                          ║
║   Deep dive:          /upgrade-deep-dive --upgrade 1                ║
║   Re-analyze:         /suggest-upgrades --depth deep                ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

### Step 6: Interactive Follow-up

Use `AskUserQuestion` to let the user:
1. Start implementing a specific wave
2. Pick a single upgrade to implement
3. Deep dive into a specific upgrade
4. Adjust horizon or team size and regenerate

## Quality Rules

- **Show the graph**: Always render the dependency DAG visually
- **Show cumulative impact**: The curve helps users see diminishing returns
- **Flag quick wins**: Highlight upgrades that take ≤1 hour
- **Flag best ROI**: Identify the upgrade(s) with highest impact/effort ratio
- **Be realistic**: Don't suggest a 2-week roadmap for a solo dev that needs a team
- **Sequence matters**: Never suggest an upgrade before its prerequisite

## See Also

- `/suggest-upgrades` — Run the analysis that feeds this roadmap
- `/upgrade-deep-dive` — Deep dive into a specific upgrade
