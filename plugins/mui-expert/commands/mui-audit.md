---
name: mui-audit
intent: Audit MUI usage for best practices, performance, and accessibility
tags:
  - mui-expert
  - audit
inputs:
  - scope (full|performance|a11y|patterns)
  - fix
  - path
risk: low
cost: high
description: Scan project for MUI anti-patterns, deprecated APIs, a11y issues, and performance problems
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Write
  - Edit
---

# /mui-audit — Audit MUI Usage

Comprehensive scan of the codebase for MUI anti-patterns, deprecated APIs, accessibility violations, and performance issues. Produces a categorized report with severity levels, affected file counts, and (when `fix` is true) automated remediation.

## Operating Protocol

### Phase 1 — Setup and Scope

1. **Determine scan root** from `path` input (default: `src/`)
2. **Collect all component files** in scope:
   ```bash
   find ${path:-src} -type f \( -name "*.tsx" -o -name "*.ts" \) \
     ! -path "*/node_modules/*" ! -path "*/__tests__/*" \
     ! -name "*.test.*" ! -name "*.spec.*"
   ```
3. **Detect MUI version** from package.json — some checks are version-specific
4. **Initialize findings registry** — categorized list of issues with file, line, severity, and fix hint

### Phase 2 — Performance Checks (scope: full|performance)

#### P1: Barrel Imports from @mui/material
**Severity: HIGH** — loads entire MUI bundle even with tree-shaking in some bundler configs.

```bash
grep -rn "from '@mui/material'" ${path:-src} --include="*.tsx" --include="*.ts" \
  | grep -v "from '@mui/material/styles'" \
  | grep -v "from '@mui/material/colors'" \
  | grep "{ .*Button\|Box\|Typography\|Grid\|Stack"
```

Expected: `import Button from '@mui/material/Button'`
Found issue: `import { Button, Box } from '@mui/material'`

Collect file path, line number, list of imported names. For each, generate a fix that splits into individual path imports.

#### P2: Barrel Icon Imports from @mui/icons-material
**Severity: HIGH** — @mui/icons-material barrel is ~4 MB; path imports are mandatory.

```bash
grep -rn "from '@mui/icons-material'" ${path:-src} --include="*.tsx" --include="*.ts" \
  | grep -v "from '@mui/icons-material/"
```

Expected: `import SearchIcon from '@mui/icons-material/Search'`
Found issue: `import { Search, Close } from '@mui/icons-material'`

#### P3: Inline sx Object References (Unstable References)
**Severity: MEDIUM** — inline object literal in `sx` creates a new reference every render, causing unnecessary child re-renders.

```bash
grep -rn "sx={{" ${path:-src} --include="*.tsx" -A 5 | grep -c "^--$"
```

Flag multi-line `sx` props that are not extracted to a constant or `useMemo`. Simple one-liners (single property) are acceptable.
Recommendation: extract to a `const` defined outside the component, or migrate to `styled()`.

#### P4: createTheme Called Inside Components
**Severity: MEDIUM** — recreates the theme object on every render.

```bash
grep -rn "createTheme()" ${path:-src} --include="*.tsx" \
  | grep -v "theme\.\(ts\|tsx\|js\)$"
```

Flag: `createTheme()` called inside a component render function. Should be called once at module level or in a stable useMemo.

#### P5: autoHeight on DataGrid
**Severity: HIGH** — `autoHeight` disables row virtualization, rendering all rows to the DOM regardless of scroll position.

```bash
grep -rn "autoHeight" ${path:-src} --include="*.tsx"
```

Flag every DataGrid with `autoHeight`. Only acceptable when the grid will always show fewer than ~20 rows.

### Phase 3 — Deprecated API Checks (scope: full|patterns)

#### D1: makeStyles / withStyles (MUI v4 API)
**Severity: CRITICAL** — removed in MUI v5, causes runtime errors.

```bash
grep -rn "makeStyles\|withStyles\|createStyles" ${path:-src} --include="*.tsx" --include="*.ts"
grep -rn "from '@material-ui/" ${path:-src} --include="*.tsx" --include="*.ts"
```

Fix: migrate to `styled()` from `@mui/material/styles` or `sx` prop.

#### D2: Deprecated @material-ui Package Imports
**Severity: CRITICAL** — old package name, not installed in v5+.

```bash
grep -rn "from '@material-ui/" ${path:-src} --include="*.tsx" --include="*.ts"
```

Fix replacements:
- `@material-ui/core` → `@mui/material`
- `@material-ui/icons` → `@mui/icons-material`
- `@material-ui/lab` → `@mui/lab`

#### D3: Deprecated Grid Props (v5 → v6)
**Severity: HIGH** (only when MUI v6 detected)

```bash
grep -rn "<Grid " ${path:-src} --include="*.tsx" \
  | grep "item\|container\b\|xs=\|sm=\|md=\|lg=\|xl="
```

MUI v6 removed `item`, `xs`, `sm`, `md`, `lg`, `xl` props in favor of `size={{ xs: 12, md: 6 }}`.
Fix: migrate to Grid v2 API.

#### D4: Deprecated Hidden Component
**Severity: HIGH** (MUI v6 removed `Hidden`)

```bash
grep -rn "<Hidden " ${path:-src} --include="*.tsx"
```

Fix: replace with `sx={{ display: { xs: 'none', md: 'block' } }}` or `useMediaQuery`.

#### D5: Legacy Palette Mode Access
**Severity: MEDIUM** — `theme.palette.type` renamed to `theme.palette.mode` in v5.

```bash
grep -rn "theme\.palette\.type\b" ${path:-src} --include="*.tsx" --include="*.ts"
```

#### D6: Removed Event Props on Dialog/Modal
**Severity: MEDIUM** — removed in v5.

```bash
grep -rn "onEscapeKeyDown\|onBackdropClick" ${path:-src} --include="*.tsx"
```

Fix: use `onClose` with reason parameter:
```typescript
onClose={(event, reason) => {
  if (reason !== 'backdropClick') handleClose();
}}
```

#### D7: StylesProvider / ServerStyleSheets (JSS)
**Severity: CRITICAL** — JSS-based APIs removed entirely in v5.

```bash
grep -rn "StylesProvider\|ServerStyleSheets\|jssPreset" ${path:-src} --include="*.tsx" --include="*.ts"
```

Fix: replace SSR with Emotion's `createEmotionCache` pattern.

### Phase 4 — Accessibility Checks (scope: full|a11y)

#### A1: IconButton Without aria-label
**Severity: HIGH** — screen readers cannot announce the button's purpose.

```bash
grep -rn "<IconButton" ${path:-src} --include="*.tsx" -A 3 \
  | grep -B 3 "IconButton" | grep -v "aria-label\|aria-labelledby"
```

For each `<IconButton` lacking `aria-label` or `aria-labelledby`, collect file, line, and child icon name.
Fix: add `aria-label="[action] [object]"` — e.g., `aria-label="delete item"`.

#### A2: TextField Without label Prop
**Severity: HIGH** — placeholder is not a substitute for a label; it disappears on focus.

```bash
grep -rn "<TextField" ${path:-src} --include="*.tsx" -A 5 \
  | grep -B 1 "placeholder=" | grep -v "label="
```

Fix: add `label="..."` prop. If the label must be visually hidden, use `InputLabelProps={{ shrink: true }}` with a visually hidden label style.

#### A3: Select Without Label Association
**Severity: HIGH** — unlabeled Select has no accessible name.

```bash
grep -rn "<Select" ${path:-src} --include="*.tsx" -B 5 \
  | grep -v "labelId=\|aria-label\|aria-labelledby"
```

Fix: wrap in `FormControl` → `InputLabel` (with `id`) → `Select` (with `labelId` matching the `InputLabel`'s `id`).

#### A4: Image Without Alt Text
**Severity: HIGH** — WCAG 1.1.1 failure.

```bash
grep -rn "<CardMedia\|<img " ${path:-src} --include="*.tsx" \
  | grep -v "alt="
```

Fix: add descriptive `alt` text. For decorative images: `alt=""`.

#### A5: Dialog Without ARIA Attributes
**Severity: MEDIUM** — dialog purpose not announced to screen reader on open.

```bash
grep -rn "<Dialog" ${path:-src} --include="*.tsx" -A 2 \
  | grep -v "aria-labelledby\|aria-label"
```

Fix: add `aria-labelledby="dialog-title-id"` and ensure `<DialogTitle id="dialog-title-id">` matches.

#### A6: Hardcoded Colors Bypassing Theme
**Severity: MEDIUM** — hardcoded colors bypass the theme's accessibility-optimized contrast ratios.

```bash
grep -rn "color: '#[0-9a-fA-F]\|backgroundColor: '#[0-9a-fA-F]" ${path:-src} --include="*.tsx"
```

Flag all hardcoded hex values in sx or styled. Recommend migrating to semantic palette tokens.

#### A7: Missing ARIA Live Regions for Dynamic Status
**Severity: LOW** — dynamic status messages not announced to screen readers.

```bash
grep -rn "setError\|setSuccess\|setMessage\|setNotification" ${path:-src} --include="*.tsx" -A 5 \
  | grep -v "aria-live\|Snackbar\|Alert\|role=\"status\""
```

Recommend `<Alert>` component or `role="status"` with `aria-live="polite"` for dynamic content.

#### A8: Non-Interactive Element Used as Button
**Severity: HIGH** — Box/div with onClick but no role or keyboard handler.

```bash
grep -rn "onClick=" ${path:-src} --include="*.tsx" -B 2 \
  | grep -B 2 "<Box\|<div\|<span" | grep -v "role=\"button\"\|tabIndex\|Button\|IconButton\|MenuItem"
```

Fix: add `role="button"`, `tabIndex={0}`, and `onKeyDown` handler.

### Phase 5 — Pattern Checks (scope: full|patterns)

#### PT1: Missing ThemeProvider
**Severity: HIGH** — MUI components without ThemeProvider use default theme, ignoring all customizations.

```bash
grep -rn "ThemeProvider\|CssVarsProvider" src/main.tsx src/App.tsx src/index.tsx 2>/dev/null
```

Flag if no `ThemeProvider` or `CssVarsProvider` wraps the app root.

#### PT2: Missing CssBaseline
**Severity: MEDIUM** — browser default styles conflict with MUI's styles without CssBaseline.

```bash
grep -rn "CssBaseline" src/main.tsx src/App.tsx src/index.tsx 2>/dev/null
```

#### PT3: Hardcoded Spacing Values
**Severity: MEDIUM** — bypasses the theme's spacing system, preventing consistent layout control.

```bash
grep -rn "padding: '[0-9]\|margin: '[0-9]\|gap: '[0-9]" ${path:-src} --include="*.tsx"
```

Fix: use theme spacing multiples in sx: `p: 2` (= `theme.spacing(2)` = 16px by default).

#### PT4: z-index Magic Numbers
**Severity: LOW** — arbitrary z-index values conflict with MUI's stacking order.

```bash
grep -rn "zIndex: [0-9][0-9][0-9]" ${path:-src} --include="*.tsx" \
  | grep -v "theme\.zIndex"
```

Fix: use `theme.zIndex.appBar`, `theme.zIndex.drawer`, `theme.zIndex.modal`, `theme.zIndex.tooltip`, etc.

#### PT5: DataGrid Without getRowId
**Severity: HIGH** — DataGrid requires `getRowId` when rows do not have an `id` field; silently produces incorrect selection across pages.

```bash
grep -rn "<DataGrid\|<DataGridPro\|<DataGridPremium" ${path:-src} --include="*.tsx" -A 5 \
  | grep -v "getRowId="
```

Best practice: always provide `getRowId` even when the field is named `id`.

#### PT6: Missing LocalizationProvider for Date/Time Components
**Severity: CRITICAL** — @mui/x-date-pickers requires `LocalizationProvider` wrapper; fails at runtime without it.

```bash
# Check if date pickers are used
picker_count=$(grep -rn "DatePicker\|TimePicker\|DateTimePicker\|DateRangePicker" ${path:-src} --include="*.tsx" | wc -l)
# Check if LocalizationProvider is present
provider_count=$(grep -rn "LocalizationProvider" ${path:-src} --include="*.tsx" | wc -l)
echo "Picker usages: $picker_count, LocalizationProvider: $provider_count"
```

Flag if picker count > 0 and provider count = 0.

#### PT7: Inline style={} Instead of sx
**Severity: LOW** — inline `style={}` bypasses MUI's theme variables and CSS injection order.

```bash
grep -rn "style={{" ${path:-src} --include="*.tsx" \
  | grep -v "// allow-inline-style\|display.*none\|animation"
```

Flag inline style objects that contain theme-derivable values. Exempt display:none toggle patterns.

### Phase 6 — Compile Report

Aggregate all findings into a structured report:

```
## MUI Audit Report
Scanned: ${fileCount} files in ${path}
Scope: ${scope}
Date: ${date}

### Summary
| Severity  | Count | Auto-fixable |
|-----------|-------|--------------|
| CRITICAL  |   X   |      X       |
| HIGH      |   X   |      X       |
| MEDIUM    |   X   |      X       |
| LOW       |   X   |      X       |
| **TOTAL** | **X** |    **X**     |

---

### CRITICAL Issues

#### D1: makeStyles / withStyles — X occurrences
Files affected:
- src/components/OldForm/OldForm.tsx:12 — `makeStyles({ root: { ... } })`
  Fix: Replace with `styled(Box)({ ... })` or move styles to `sx` prop

[... per-issue detail with file:line and fix hint ...]

### HIGH Issues
[...]

### MEDIUM Issues
[...]

### LOW Issues
[...]

---

### Recommended Fix Order
1. CRITICAL deprecated APIs (risk of runtime errors)
2. Missing ThemeProvider/LocalizationProvider (silent failures)
3. HIGH accessibility issues (legal/compliance risk)
4. HIGH performance issues (bundle size)
5. MEDIUM patterns (maintainability)
6. LOW improvements (code quality)
```

### Phase 7 — Apply Fixes (when `fix` is true)

For each auto-fixable issue, apply the transformation in order of safety (lowest risk first):

**Barrel import fix** — for each file with barrel imports:
1. Read the file
2. Parse named imports from `@mui/material`
3. Generate individual path import lines
4. Replace the barrel import line with path imports
5. Verify no duplicate imports after transformation
6. Run `tsc --noEmit` on the modified file to confirm no regression

**makeStyles fix** — per file:
1. Read the existing styles object
2. For each CSS class, determine if it maps to a single MUI component (`styled()`) or is applied conditionally (`sx` with conditional)
3. Generate equivalent `styled()` calls
4. Replace `className={classes.x}` with the styled component usage
5. Remove `makeStyles` import, add `styled` import from `@mui/material/styles`

**aria-label fix** — add `aria-label` derived from icon component name and surrounding context:
- `<DeleteIcon />` inside a list item → `aria-label="delete [item name]"`
- `<CloseIcon />` inside a Dialog → `aria-label="close dialog"`

**TextField label fix** — for each TextField with only `placeholder`:
- Add `label={placeholder}` and keep `placeholder` if the content differs
- If label should match placeholder exactly, remove `placeholder` after adding `label`

After all fixes: run full TypeScript check and ESLint to verify no regressions introduced.

## Quality Bar

The audit command itself must:
- [ ] Scan every file in scope with no silent skips
- [ ] Report exact file + line number for every finding
- [ ] Distinguish auto-fixable from manual-review-required issues
- [ ] Not modify files unless `fix` is explicitly true
- [ ] Verify all applied fixes pass `tsc --noEmit` before reporting as fixed
- [ ] Produce a machine-readable summary with counts per severity

## Output Contract

```
Audit complete.
Files scanned: X
Issues found: X (X critical, X high, X medium, X low)
Auto-fixable: X
Manual review needed: X

Report written to: mui-audit-report.md
Fixes applied: X (only when fix=true)
TypeScript after fixes: PASS|FAIL
```
