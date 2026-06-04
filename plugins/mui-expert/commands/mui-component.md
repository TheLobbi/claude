---
name: mui-component
intent: Scaffold a MUI component following best practices
tags:
  - mui-expert
  - component
inputs:
  - name
  - type (form|display|navigation|feedback|layout)
  - features (responsive,dark-mode,a11y,animation)
  - with-test
risk: low
cost: medium
description: Scaffold a production-ready MUI component with proper theming, accessibility, and TypeScript types
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# /mui-component — Scaffold MUI Component

Scaffold a production-ready MUI component with correct imports, theming, accessibility, and TypeScript types. This command discovers the project's existing MUI patterns before generating, so output is consistent with the codebase.

## Operating Protocol

### Phase 1 — Discover Project Context

1. **Detect MUI version**:
   ```bash
   grep -E '"@mui/material"' package.json | grep -oE '[0-9]+\.[0-9]+\.[0-9]+'
   ```
   Note the major version (5 or 6) — it affects Grid, slots API, and sx typing.

2. **Detect styling approach** — search existing components to determine project pattern:
   - `Glob("src/**/*.tsx")` + `Grep("styled(|useTheme|sx={{")` — determine ratio of `styled()` vs inline `sx`
   - Check for `emotion` vs `styled-components` peer dep in package.json
   - Check for Pigment CSS if MUI v6 (`@mui/material-pigment-css`)

3. **Detect theme shape**:
   - `Glob("src/**/theme*.ts", "src/**/theme*.tsx")` — read the project theme file
   - Note custom palette keys, typography variants, spacing scale, and breakpoints
   - Note whether `CssVarsProvider` (v6) or `ThemeProvider` (v5) is used

4. **Detect folder conventions**:
   - `Glob("src/components/**")` — identify naming pattern (PascalCase dir + index.tsx, or flat file)
   - Check for barrel exports (`index.ts`)
   - Check for co-located tests (`*.test.tsx`, `*.spec.tsx`)
   - Check for Storybook stories (`*.stories.tsx`)

5. **Detect import style**:
   - `Grep("from '@mui/material/Button'")` vs `Grep("from '@mui/material'")` — determine whether project uses path imports (tree-shaking) or barrel imports
   - Path imports are preferred for performance; note the project standard and follow it

### Phase 2 — Plan Component Structure

Based on `type` input, determine required MUI primitives:

| Type | Core MUI components | Common patterns |
|------|--------------------|--------------------|
| `form` | TextField, Select, Checkbox, RadioGroup, Switch, Button, FormHelperText, FormControl, FormLabel | react-hook-form or controlled state, validation error display |
| `display` | Card, CardMedia, CardContent, CardActions, Chip, Avatar, Typography, Divider, List | data prop interface, skeleton loading state |
| `navigation` | AppBar, Toolbar, Drawer, Tabs, Tab, Breadcrumbs, Menu, MenuItem, Link | active state, router integration, mobile collapse |
| `feedback` | Alert, Snackbar, Dialog, CircularProgress, LinearProgress, Backdrop, Skeleton | open/close state, severity variants |
| `layout` | Box, Stack, Grid, Container, Paper, Accordion | responsive columns, spacing from theme |

Parse `features` CSV input and activate relevant sections:
- `responsive` — add `useMediaQuery` + breakpoint-aware sx props
- `dark-mode` — use `mode`-sensitive palette keys (`palette.background.paper`, `palette.text.primary`), avoid hardcoded hex
- `a11y` — add ARIA roles, labels, keyboard handlers, focus management
- `animation` — add `Fade`/`Grow`/`Collapse` MUI transitions or `sx` with `transition` property

### Phase 3 — Generate TypeScript Interface

Always define a typed props interface before the component:

```typescript
// Pattern: explicit props interface, no `any`, use MUI's own types where applicable
import type { SxProps, Theme } from '@mui/material/styles';
import type { ButtonProps } from '@mui/material/Button'; // extend when wrapping

interface ${Name}Props {
  // Required props first
  // Optional props after, with JSDoc on non-obvious ones
  /** Overrides applied to the root element via sx prop */
  sx?: SxProps<Theme>;
}
```

Rules for the interface:
- Extend the underlying MUI component's props type when wrapping a single MUI primitive: `Omit<ButtonProps, 'variant'> & { variant: 'primary' | 'danger' }`
- Use `SxProps<Theme>` for any `sx` passthrough prop
- Never use `React.FC` — use explicit return type annotation instead
- Export the props interface (consumers need it)

### Phase 4 — Generate Component Body

**Import order** (enforce this exact sequence):

```typescript
// 1. React
import { useState, useCallback, memo } from 'react';

// 2. MUI core — use path imports unless project uses barrel imports
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
// NOT: import { Box, Typography } from '@mui/material'; (barrel — larger bundle)

// 3. MUI icons — always path imports (never barrel from @mui/icons-material)
import SearchIcon from '@mui/icons-material/Search';

// 4. MUI x packages
import { DataGrid } from '@mui/x-data-grid';

// 5. Internal imports
import { useAppTheme } from '@/hooks/useAppTheme';
```

**sx prop rules** — use theme-aware tokens, not raw values:

```typescript
// CORRECT — adapts to theme, dark mode safe
sx={{ color: 'text.primary', bgcolor: 'background.paper', p: 2, mt: { xs: 1, md: 2 } }}

// WRONG — hardcodes colors, breaks dark mode
sx={{ color: '#333333', backgroundColor: 'white', padding: '16px' }}
```

**styled() vs sx** — follow the project's detected pattern. Default guidance:
- Use `sx` for one-off overrides, responsive tweaks, and theme-derived values
- Use `styled()` for components used more than once or with complex variant logic
- Never mix both on the same element unless there is a clear reason

**Responsive design** (when `responsive` feature enabled):

```typescript
// Prefer breakpoint object syntax in sx
sx={{
  flexDirection: { xs: 'column', md: 'row' },
  gap: { xs: 1, sm: 2, md: 3 },
  display: { xs: 'none', md: 'flex' },
}}

// For conditional logic, use useMediaQuery
const isMobile = useMediaQuery(theme.breakpoints.down('md'));
```

**Dark mode safety** (when `dark-mode` feature enabled):

```typescript
// Always use palette semantic tokens
sx={{
  bgcolor: 'background.default',   // adapts to mode
  color: 'text.primary',           // adapts to mode
  borderColor: 'divider',          // adapts to mode
}}

// For custom colors: define in theme with mode variants, then reference by name
// NEVER: bgcolor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#fff'
```

**Accessibility** (when `a11y` feature enabled):

```typescript
// IconButton: always aria-label
<IconButton aria-label="close dialog" onClick={onClose}>
  <CloseIcon />
</IconButton>

// TextField: always use label prop (not placeholder alone)
<TextField label="Email address" type="email" required />

// Interactive non-button elements: role + tabIndex + keyboard handler
<Box
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
  aria-pressed={isSelected}
/>

// Images: alt text on CardMedia or <img>
<CardMedia component="img" alt="Product screenshot of dashboard" src={imgSrc} />

// Dialogs: aria-labelledby + aria-describedby
<Dialog aria-labelledby="dialog-title" aria-describedby="dialog-description">
  <DialogTitle id="dialog-title">Confirm deletion</DialogTitle>
  <DialogContent>
    <Typography id="dialog-description">...</Typography>
  </DialogContent>
</Dialog>
```

**Animation** (when `animation` feature enabled):

```typescript
// Use MUI built-in transitions for show/hide
import Fade from '@mui/material/Fade';
import Grow from '@mui/material/Grow';
import Collapse from '@mui/material/Collapse';

// For enter/exit
<Fade in={open} timeout={300}>
  <Box>...</Box>
</Fade>

// For height transitions (accordion-like)
<Collapse in={expanded} timeout="auto">
  <Box>...</Box>
</Collapse>

// sx transition for hover effects
sx={{
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
}}
```

### Phase 5 — Generate Test File (when `with-test` is true)

Create `${Name}.test.tsx` co-located with the component:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ${Name} } from './${Name}';

// Always wrap with ThemeProvider to test theme-dependent rendering
const renderWithTheme = (ui: React.ReactElement) =>
  render(
    <ThemeProvider theme={createTheme()}>
      <CssBaseline />
      {ui}
    </ThemeProvider>
  );

describe('${Name}', () => {
  it('renders without crashing', () => {
    renderWithTheme(<${Name} />);
  });

  // form type: test field interactions and error display
  // navigation type: test active state and keyboard navigation
  // feedback type: test open/close lifecycle and screen reader announcements
  // display type: test data rendering and skeleton/loading states
  // layout type: test responsive breakpoint classes

  it('meets accessibility requirements', () => {
    const { container } = renderWithTheme(<${Name} />);
    const interactiveElements = container.querySelectorAll('button, [role="button"]');
    interactiveElements.forEach((el) => {
      expect(el).toHaveAccessibleName();
    });
  });
});
```

### Phase 6 — Write Files

Determine output path based on detected folder conventions:
- If project uses `src/components/ComponentName/index.tsx` → create directory + index.tsx
- If project uses `src/components/ComponentName.tsx` → create flat file
- Create test file in same location when `with-test` is true
- Update barrel `index.ts` if one exists in the parent directory

Write the component file with:
1. File-level JSDoc comment explaining purpose
2. Props interface (exported)
3. Component function (named export, not default unless project uses default)
4. Display name: `${Name}.displayName = '${Name}';`

### Phase 7 — Quality Checks

After writing files, run:

```bash
# Type check the new file
npx tsc --noEmit 2>&1 | grep -i "${name}"

# Lint check
npx eslint src/components/${Name}/ --max-warnings 0 2>&1

# Check for common MUI mistakes in the new file
grep -n "from '@mui/icons-material'" src/components/${Name}/*.tsx    # barrel icon import
grep -n "makeStyles\|withStyles" src/components/${Name}/*.tsx         # v4 patterns
grep -n "color: '#\|backgroundColor: '" src/components/${Name}/*.tsx  # hardcoded colors
```

Report any issues found and fix them before completing.

## Quality Bar

Before declaring done, verify:
- [ ] No TypeScript errors (`tsc --noEmit` passes for the new file)
- [ ] No ESLint errors or warnings
- [ ] All interactive elements have accessible names
- [ ] No hardcoded color hex values in sx or styled
- [ ] All MUI icon imports are path-based (not barrel)
- [ ] Component renders correctly in both light and dark theme (when `dark-mode` feature)
- [ ] All form fields have associated labels (when `form` type)
- [ ] Responsive breakpoints applied (when `responsive` feature)
- [ ] Test file created and passing (when `with-test` is true)

## Output Contract

On completion, report:

```
Component created: src/components/${Name}/index.tsx
Props interface: ${Name}Props (exported)
MUI components used: [list]
Features implemented: [list from input]
Test file: src/components/${Name}/${Name}.test.tsx (if with-test)
TypeScript: PASS
Lint: PASS
Issues found and fixed: [list or "none"]
```
