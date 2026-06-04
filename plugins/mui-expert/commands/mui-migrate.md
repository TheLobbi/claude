---
name: mui-migrate
intent: Migrate MUI code between versions
tags:
  - mui-expert
  - migration
inputs:
  - from (v4|v5)
  - to (v5|v6)
  - path
  - dry-run
risk: medium
cost: high
description: Analyze and execute MUI version migrations with codemods and manual transforms
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# /mui-migrate — MUI Version Migration

Analyze and execute MUI version migrations. Detects current codebase state, generates a migration plan, applies automated transforms where possible, and guides through manual steps. Preserves all existing behavior while upgrading to current API patterns.

## Operating Protocol

### Phase 1 — Pre-Migration Assessment

1. **Verify current version** from package.json:
   ```bash
   node -e "
     const d = {...require('./package.json').dependencies,...require('./package.json').devDependencies};
     console.log('MUI:', d['@mui/material'] || d['@material-ui/core'] || 'not found');
   "
   ```
   Compare against `from` input. Warn if they do not match.

2. **Verify migration path is supported**:
   - `v4 → v5`: supported
   - `v5 → v6`: supported
   - `v4 → v6`: NOT supported as single step — recommend running twice: v4→v5 then v5→v6
   - Any other combination: reject with explanation

3. **Inventory current MUI usage**:
   ```bash
   # Files using any MUI import
   grep -rl "@material-ui\|@mui" ${path:-src} --include="*.tsx" --include="*.ts" | wc -l

   # Breakdown by imported package
   grep -rh "from '@" ${path:-src} --include="*.tsx" --include="*.ts" \
     | grep -oE "from '@(material-ui|mui)/[^']+'" | sort | uniq -c | sort -rn | head -30

   # makeStyles usage (v4-specific API, must all be migrated)
   grep -rl "makeStyles\|withStyles\|createStyles" ${path:-src} --include="*.tsx" | wc -l

   # ThemeProvider and createTheme usage
   grep -rn "ThemeProvider\|createMuiTheme\|createTheme" ${path:-src} --include="*.tsx" | wc -l
   ```

4. **Check for blockers**:
   - TypeScript present? (`tsconfig.json` exists)
   - Any custom class name generator (`generateClassName`, `seed` in `StylesProvider`)?
   - Any SSR setup using `ServerStyleSheets` or `createEmotionCache`?
   - Any custom MUI component overrides via `StylesProvider`?

5. **Estimate complexity**:
   - < 20 files using MUI: LOW — full automated migration likely
   - 20–100 files: MEDIUM — automated + some manual review
   - 100+ files: HIGH — recommend staged migration by feature area

6. **Verify clean git state** (when not `dry-run`):
   ```bash
   git status --short
   ```
   If uncommitted changes exist, **abort** and instruct the user to commit or stash first. Migration must start from a clean working tree so it can be rolled back cleanly if needed.

### Phase 2 — Generate Migration Plan

Always print the full migration plan before making any file changes (even in non-dry-run mode):

```
## Migration Plan: MUI ${from} → ${to}
Complexity: LOW|MEDIUM|HIGH
Files to modify: ~X

### Automated Steps (applied in order)
1. package.json dependency update
2. Import path rewrites (@material-ui/* → @mui/*)
3. Theme API updates (createMuiTheme, palette.type, overrides → components)
4. makeStyles migration (simple static cases)
5. withStyles migration
6. Deprecated prop removals (onEscapeKeyDown, etc.)
7. [v5→v6 only] Grid v2 API migration
8. [v5→v6 only] Hidden component removal

### Manual Review Required
- Complex makeStyles with dynamic props: X files — [list]
- Custom JSS theme overrides with non-standard selectors: X files
- StylesProvider / ServerStyleSheets (SSR): X files
- withStyles HOC with complex prop merging: X files

### Verification After Each Step
- npx tsc --noEmit
- npx eslint ${path:-src} --ext .tsx,.ts
- npm test -- --watchAll=false (after all automated steps)
```

In `dry-run` mode: print the plan and counts of what would change, then stop without modifying anything.

### Phase 3a — v4 → v5 Migration

Apply transforms in this order (lowest risk first):

#### Step 1: Update package.json Dependencies

Remove v4 packages, add v5:

```json
// Remove
"@material-ui/core": "^4.x.x",
"@material-ui/icons": "^4.x.x",
"@material-ui/lab": "^4.x.x",
"@material-ui/pickers": "^3.x.x",

// Add
"@mui/material": "^5.0.0",
"@mui/icons-material": "^5.0.0",
"@mui/lab": "^5.0.0-alpha.0",
"@mui/x-date-pickers": "^6.0.0",
"@emotion/react": "^11.0.0",
"@emotion/styled": "^11.0.0"
```

If the project uses styled-components as a peer dep, also add `@mui/styled-engine-sc` and configure the styled engine resolver in the bundler config.

Run the package manager install after editing package.json.

#### Step 2: Import Path Rewrites

For each file in scope, apply these substitutions:

| Before (v4) | After (v5) |
|-------------|------------|
| `'@material-ui/core'` | `'@mui/material'` |
| `'@material-ui/core/styles'` | `'@mui/material/styles'` |
| `'@material-ui/core/Button'` | `'@mui/material/Button'` |
| `'@material-ui/icons'` | `'@mui/icons-material'` |
| `'@material-ui/icons/Search'` | `'@mui/icons-material/Search'` |
| `'@material-ui/lab'` | `'@mui/lab'` |
| `'@material-ui/system'` | `'@mui/system'` |

Use `Edit` on each affected file. Use `Grep` to build the file list first, then process each file individually.

Verify after: `grep -rl "@material-ui" ${path:-src}` must return empty.

Run `tsc --noEmit` — fix any import errors before proceeding to Step 3.

#### Step 3: Theme API Updates

| Before (v4) | After (v5) |
|-------------|------------|
| `createMuiTheme({` | `createTheme({` |
| `palette.type: 'dark'` | `palette.mode: 'dark'` |
| `theme.palette.type` | `theme.palette.mode` |
| `overrides: { MuiButton: { root: {...} } }` | `components: { MuiButton: { styleOverrides: { root: {...} } } }` |
| `props: { MuiButton: { disableRipple: true } }` | `components: { MuiButton: { defaultProps: { disableRipple: true } } }` |

Theme `overrides` migration is the most complex step. For each key in `overrides`:
1. Move to `components[ComponentName].styleOverrides`
2. Convert any JSS-specific syntax to Emotion-compatible CSS objects

JSS → Emotion differences to handle carefully:

```javascript
// JSS local refs (v4) — references another class in the same makeStyles
{ '$root:hover &': { color: 'red' } }
// Emotion equivalent — use data attributes or CSS hierarchy
{ '.parent-class:hover &': { color: 'red' } }  // prefer restructuring with styled()

// JSS @global (v4)
{ '@global': { 'body': { margin: 0 } } }
// Emotion equivalent — use GlobalStyles component
import GlobalStyles from '@mui/material/GlobalStyles';
<GlobalStyles styles={{ body: { margin: 0 } }} />
```

#### Step 4: makeStyles Migration

For each file using `makeStyles`:

**Simple static case** — convert to `styled()` or `sx`:

```typescript
// BEFORE (v4)
const useStyles = makeStyles({
  root: { display: 'flex', padding: 16 },
  title: { fontWeight: 'bold', color: '#333' },
});
function MyComp() {
  const classes = useStyles();
  return <div className={classes.root}><span className={classes.title}>Hi</span></div>;
}

// AFTER (v5) — styled components (preferred for named, reusable pieces)
const Root = styled(Box)({ display: 'flex', p: 2 });
const Title = styled(Typography)({ fontWeight: 'bold', color: 'text.primary' });
function MyComp() {
  return <Root><Title>Hi</Title></Root>;
}

// AFTER (v5) — sx props (preferred for simple, one-off styling)
function MyComp() {
  return (
    <Box sx={{ display: 'flex', p: 2 }}>
      <Typography sx={{ fontWeight: 'bold', color: 'text.primary' }}>Hi</Typography>
    </Box>
  );
}
```

**Dynamic case** — styles that depend on props or theme:

```typescript
// BEFORE (v4)
const useStyles = makeStyles((theme) => ({
  root: { backgroundColor: theme.palette.primary.main },
  active: (props: { active: boolean }) => ({ opacity: props.active ? 1 : 0.5 }),
}));

// AFTER (v5) — styled with shouldForwardProp
const Root = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'active',
})<{ active: boolean }>(({ theme, active }) => ({
  backgroundColor: theme.palette.primary.main,
  opacity: active ? 1 : 0.5,
}));
```

Flag for manual review when:
- More than 3 interdependent dynamic style rules
- `$ref` local class references used
- Keyframe animations defined inside makeStyles

#### Step 5: withStyles Migration

```typescript
// BEFORE (v4)
const StyledButton = withStyles({ root: { borderRadius: 8 } })(Button);

// AFTER (v5)
const StyledButton = styled(Button)({ borderRadius: 8 });
```

For `withStyles` used as a class decorator pattern, convert to `styled()` wrapping the class component's render output.

#### Step 6: Deprecated Event Props

| Removed prop | Replacement |
|-------------|-------------|
| `Dialog.onEscapeKeyDown` | `onClose` with `reason === 'escapeKeyDown'` |
| `Dialog.onBackdropClick` | `onClose` with `reason === 'backdropClick'` |
| `Modal.onEscapeKeyDown` | `onClose` |
| `Modal.onBackdropClick` | `onClose` |

Also flag TextField instances with no explicit `variant` — the default changed from `'standard'` in v4 to `'outlined'` in v5:

```bash
grep -rn "<TextField" ${path:-src} --include="*.tsx" | grep -v "variant="
```

Add `variant="standard"` to each if the project wants to preserve v4 visual appearance. Otherwise accept the new outlined default.

#### Step 7: Verify v4 → v5 Migration

```bash
# No old imports remaining
grep -r "@material-ui" ${path:-src} --include="*.tsx" --include="*.ts" && echo "FAIL: old imports found" || echo "PASS: no old imports"

# No makeStyles/withStyles remaining
grep -r "makeStyles\|withStyles\|createStyles" ${path:-src} --include="*.tsx" && echo "FAIL: v4 styling API found" || echo "PASS"

# TypeScript
npx tsc --noEmit 2>&1 | head -30

# Lint
npx eslint ${path:-src} --ext .tsx,.ts --max-warnings 0 2>&1 | tail -20

# Tests
npm test -- --watchAll=false 2>&1 | tail -20
```

### Phase 3b — v5 → v6 Migration

MUI v6 has fewer breaking changes than v4→v5 but requires the Grid API migration.

#### Step 1: Update package.json

```json
"@mui/material": "^6.0.0",
"@mui/icons-material": "^6.0.0",
"@mui/lab": "^6.0.0",
"@mui/system": "^6.0.0",
"@mui/x-data-grid": "^7.0.0",       // MUI X v7 aligns with MUI v6
"@mui/x-date-pickers": "^7.0.0",
```

Run install.

#### Step 2: Grid v2 Migration (largest breaking change)

```typescript
// BEFORE (v5 Grid)
<Grid container spacing={2}>
  <Grid item xs={12} md={6}>content</Grid>
  <Grid item xs={12} md={6}>content</Grid>
</Grid>

// AFTER (v6 Grid)
<Grid container spacing={2}>
  <Grid size={{ xs: 12, md: 6 }}>content</Grid>
  <Grid size={{ xs: 12, md: 6 }}>content</Grid>
</Grid>
```

All transforms needed:
- Remove `item` prop (no longer exists — all Grid children are implicitly items)
- Replace `xs={N}` / `sm={N}` / `md={N}` / `lg={N}` / `xl={N}` → `size={{ xs: N, sm: N, ... }}`
- Replace `xs={true}` (grow/fill remaining) → `size="grow"`
- Replace `xs={false}` (auto-size to content) → `size="auto"`
- Keep `container`, `spacing`, `direction`, `wrap` props — they are unchanged

```bash
# Find all Grid usages requiring migration
grep -rn "<Grid " ${path:-src} --include="*.tsx" \
  | grep "xs=\|sm=\|md=\|lg=\|xl=\|\bitem\b"
```

Process each file, apply transforms, verify with `tsc --noEmit`.

#### Step 3: Hidden Component Removal

```bash
grep -rn "<Hidden " ${path:-src} --include="*.tsx"
```

```typescript
// BEFORE (v5)
<Hidden mdUp><MobileMenu /></Hidden>
<Hidden smDown><DesktopMenu /></Hidden>

// AFTER (v6) — sx prop approach
<Box sx={{ display: { xs: 'block', md: 'none' } }}><MobileMenu /></Box>
<Box sx={{ display: { xs: 'none', md: 'block' } }}><DesktopMenu /></Box>
```

#### Step 4: Slots API Standardization

v6 standardizes `slots`/`slotProps` pattern. Check for component-specific prop migrations:

| Component | v5 prop | v6 slots replacement |
|-----------|---------|---------------------|
| `Slider` | `components.ValueLabel` | `slots.valueLabel` |
| `Slider` | `componentsProps.valueLabel` | `slotProps.valueLabel` |
| `Autocomplete` | `PaperComponent` | `slots.paper` |
| `Autocomplete` | `PopperComponent` | `slots.popper` |
| `Select` | `MenuProps` | `slotProps.listbox` |

```bash
grep -rn "PaperComponent\|PopperComponent\|componentsProps" ${path:-src} --include="*.tsx"
```

#### Step 5: CssVarsProvider (Optional Enhancement)

v6 introduces `CssVarsProvider` for CSS custom properties-based theming — enables runtime theme switching without React context re-renders. This is not a required migration but an improvement opportunity:

```typescript
// Optional: migrate from ThemeProvider to CssVarsProvider for dynamic theme switching
import { CssVarsProvider, extendTheme } from '@mui/material/styles';

const theme = extendTheme({
  colorSchemes: {
    light: { palette: { primary: { main: '#1976d2' } } },
    dark:  { palette: { primary: { main: '#42a5f5' } } },
  },
});

// In app root
<CssVarsProvider theme={theme}>
  <App />
</CssVarsProvider>
```

Only recommend this migration if the project uses dynamic theme switching. Otherwise keep `ThemeProvider`.

#### Step 6: Verify v5 → v6 Migration

Same verification checklist as v4→v5 migration.

```bash
# Grid v2 migration complete
grep -rn "\bitem\b" ${path:-src} --include="*.tsx" | grep "<Grid" && echo "FAIL: old Grid item prop found" || echo "PASS"
grep -rn " xs={[0-9]" ${path:-src} --include="*.tsx" | grep "<Grid" && echo "FAIL: old xs prop found" || echo "PASS"

# Hidden removed
grep -rn "<Hidden" ${path:-src} --include="*.tsx" && echo "FAIL: Hidden component found" || echo "PASS"

# TypeScript
npx tsc --noEmit 2>&1 | head -30

# Tests
npm test -- --watchAll=false 2>&1 | tail -20
```

### Phase 4 — Post-Migration Report

```
## Migration Complete: MUI ${from} → ${to}

### Files Modified: X
### Automated transforms applied:
- Import path rewrites: X files
- Theme API updates (createMuiTheme, overrides→components): X occurrences
- makeStyles migrations: X files (Y simple, Z dynamic)
- withStyles migrations: X files
- Deprecated prop removals: X occurrences
- Grid v2 API migration: X files (v5→v6 only)
- Hidden component removal: X occurrences (v5→v6 only)

### Manual review required (X items):
- [file path]: complex makeStyles with dynamic refs — requires manual styled() conversion
- [file path]: StylesProvider SSR setup — requires Emotion cache migration
- [list all manual items with file and reason]

### Verification Results:
- TypeScript: PASS | FAIL (X errors — see details)
- ESLint: PASS | FAIL (X warnings)
- Tests: PASS | FAIL (X failures) | SKIPPED

### Suggested Next Steps:
1. Address all manual review items listed above
2. Run full test suite: npm test
3. Visual regression test: key screens in both light and dark mode
4. Bundle size check: before Xkb → after Xkb (expect reduction from dropping JSS)
5. Performance check: verify no new layout shifts introduced
```

## Quality Bar

- [ ] Migration starts from a clean git working tree (no uncommitted changes)
- [ ] Migration plan is always printed before any file is modified
- [ ] `dry-run` mode never modifies any file
- [ ] Every individual file modification is followed by a `tsc` check to catch immediate errors
- [ ] All deprecated imports removed — verified with grep
- [ ] No regressions in TypeScript strict mode
- [ ] Test suite passes (or failures are documented as pre-existing)
- [ ] Manual review items clearly documented with file paths and reasons

## Output Contract

```
Migration: MUI ${from} → ${to}
Mode: ${dry-run ? 'DRY RUN (no files modified)' : 'APPLIED'}
Files analyzed: X
Files modified: X (0 if dry-run)
Automated transforms: X
Manual review items: X
TypeScript: PASS|FAIL
Tests: PASS|FAIL|SKIPPED
Rollback: git stash pop (if needed)
```
