---
name: /mui-perf
intent: Analyze and optimize MUI performance
tags:
  - mui-expert
  - performance
  - bundle-size
  - optimization
inputs:
  - '--scope'
  - '--fix'
  - '--path'
risk: low
cost: high
description: |
  Comprehensive MUI performance analysis covering bundle size, render optimization, DataGrid performance, SSR efficiency, and Emotion caching. Reports issues with severity and provides auto-fix for safe optimizations.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# /mui-perf

Analyze and optimize MUI performance across bundle size, rendering, and SSR.

## Operating Protocol

### Phase 1 — Bundle Size Analysis (scope: full|bundle)

#### B1: Barrel Import Detection
**Severity: HIGH** — Barrel imports from `@mui/material` and `@mui/icons-material` prevent tree-shaking.

```bash
# Material barrel imports
grep -rn "from '@mui/material'" ${path} --include="*.tsx" --include="*.ts" | grep "{ "

# Icon barrel imports (4MB+ if not tree-shaken)
grep -rn "from '@mui/icons-material'" ${path} --include="*.tsx" --include="*.ts" | grep -v "/"
```

Fix: Convert to path imports (`import Button from '@mui/material/Button'`).

#### B2: Unused MUI Imports
**Severity: MEDIUM** — Imported but unused components still bundled by some bundlers.

#### B3: Heavy MUI X Components Not Lazy-Loaded
**Severity: HIGH** — DataGrid (~200KB), DatePicker (~150KB), Charts (~100KB) should be code-split.

```bash
# Check if heavy components are lazy-loaded
grep -rn "import.*DataGrid\|import.*DatePicker\|import.*Chart" ${path} --include="*.tsx" | grep -v "lazy\|dynamic"
```

Fix: Wrap in `React.lazy()` or `next/dynamic`.

#### B4: Duplicate Emotion Instances
**Severity: HIGH** — Multiple Emotion caches cause style conflicts and bloat.

### Phase 2 — Render Optimization (scope: full|render)

#### R1: Inline sx Objects
**Severity: MEDIUM** — New object reference every render triggers Emotion recalculation.

Detect multi-line inline `sx={{...}}` inside component bodies. Flag when:
- More than 3 properties
- Inside a list/map rendering
- Contains only static values (could be extracted to const)

Fix: Extract to module-level const or wrap in useMemo.

#### R2: createTheme Inside Components
**Severity: HIGH** — Theme recreation triggers full tree re-render.

#### R3: Unstable Callback Props
**Severity: MEDIUM** — Inline arrow functions in event handlers inside mapped lists.

#### R4: Missing React.memo on Custom Cell Renderers
**Severity: HIGH** — DataGrid re-renders all visible cells on any state change.

#### R5: Theme Object Spread in Styled
**Severity: LOW** — `({ theme, ...props })` in styled() causes unnecessary recalculations.

### Phase 3 — DataGrid Performance (scope: full|datagrid)

#### DG1: autoHeight with Large Datasets
**Severity: CRITICAL** — Disables virtualization, renders all rows to DOM.

#### DG2: Columns Array Not Memoized
**Severity: HIGH** — Inline columns array recreated every render.

#### DG3: processRowUpdate Not Wrapped in useCallback
**Severity: MEDIUM** — Causes unnecessary re-renders.

#### DG4: Missing rowHeight for Uniform Rows
**Severity: LOW** — Explicit rowHeight enables row height optimization.

#### DG5: Custom Cell Components Not Memoized
**Severity: HIGH** — renderCell functions should use React.memo.

#### DG6: getRowId Inline Arrow
**Severity: LOW** — Extract to module-level constant.

### Phase 4 — SSR Performance (scope: full|ssr)

#### SSR1: Emotion Cache Not Per-Request
**Severity: HIGH** — Shared cache between requests causes style leaking.

#### SSR2: Missing getInitColorSchemeScript
**Severity: MEDIUM** — Flash of wrong color scheme on page load.

#### SSR3: useMediaQuery Without ssrMatchMedia
**Severity: MEDIUM** — Hydration mismatch from client/server media query disagreement.

#### SSR4: Heavy Components Not Dynamic Imported
**Severity: MEDIUM** — MUI X components should be `ssr: false` with next/dynamic.

### Phase 5 — Report Generation

```
## MUI Performance Report
Scanned: X files in ${path}
Scope: ${scope}

### Summary
| Category | Issues | Auto-fixable | Est. Impact |
|----------|--------|--------------|-------------|
| Bundle   |   X    |      X       | -X KB       |
| Render   |   X    |      X       | -X ms/frame |
| DataGrid |   X    |      X       | significant |
| SSR      |   X    |      X       | FOUC fix    |

### Optimization Priority
1. [highest impact items first]
...

### Bundle Size Estimate
Before: ~X KB (gzipped MUI)
After fixes: ~X KB (estimated)
Savings: ~X KB (~X%)
```

### Phase 6 — Auto-Fix (when --fix)

Apply in order of safety:
1. Barrel → path import conversion
2. Extract static sx objects to module scope
3. Wrap columns arrays in useMemo
4. Add React.memo to renderCell components
5. Extract getRowId to module constant
6. Wrap processRowUpdate in useCallback

Verify each fix with `tsc --noEmit`.

## Output Contract

```
Performance analysis complete.
Files scanned: X
Issues found: X (X critical, X high, X medium, X low)
Auto-fixable: X
Estimated bundle savings: X KB
Fixes applied: X (only when --fix)
```
