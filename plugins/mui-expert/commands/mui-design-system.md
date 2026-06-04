---
name: /mui-design-system
intent: Scaffold a complete design system built on MUI
tags:
  - mui-expert
  - design-system
  - theme
  - tokens
  - white-label
inputs:
  - '--brand'
  - '--colors'
  - '--font'
  - '--mode'
  - '--css-vars'
  - '--white-label'
risk: low
cost: high
description: |
  Scaffold a production-ready design system on MUI with design tokens, theme configuration, TypeScript augmentation, component overrides, CSS variables, dark mode, and optional multi-tenant white-label support.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
  - Agent
---

# /mui-design-system

Scaffold or audit a complete design system built on Material UI.

## Operating Protocol

### Phase 1 — Requirements Gathering

1. **Brand Analysis**: Use `--brand` name, `--colors`, and `--font` inputs
2. **Detect Existing Setup**: Scan for existing theme files, MUI version, CSS vars usage
3. **Determine Architecture**:
   - Standard (single theme) vs white-label (multi-tenant)
   - CssVarsProvider (CSS custom properties) vs ThemeProvider
   - Pigment CSS vs Emotion

### Phase 2 — Design Token Generation

Generate a centralized design token file (`design-tokens.ts`):

```typescript
export const tokens = {
  color: {
    brand: { 50: '...', 100: '...', ..., 900: '...' },
    neutral: { 50: '...', ..., 900: '...' },
    semantic: { success, warning, error, info },
  },
  typography: {
    fontFamily: { sans, mono, display },
    scale: { xs, sm, base, lg, xl, '2xl', '3xl', '4xl' },
    weight: { regular, medium, semibold, bold },
    lineHeight: { tight, normal, relaxed },
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48, '3xl': 64 },
  radius: { none, sm, md, lg, xl, full },
  shadow: { sm, md, lg, xl },
  motion: { fast, normal, slow },
} as const;
```

Generate color scales from primary/secondary using auto palette generation (augmentColor).

### Phase 3 — Theme Configuration

Generate theme files based on architecture:

**Standard Mode**:
- `theme/tokens.ts` — Design tokens
- `theme/palette.ts` — Light and dark palette definitions
- `theme/typography.ts` — Typography scale
- `theme/components.ts` — Component overrides (Button, TextField, Card, AppBar, Chip, Dialog, DataGrid)
- `theme/augmentation.d.ts` — TypeScript module augmentation
- `theme/index.ts` — createTheme / extendTheme assembly

**CSS Variables Mode** (`--css-vars`):
- Use `extendTheme()` with `colorSchemes: { light: {...}, dark: {...} }`
- Generate `getInitColorSchemeScript()` usage for SSR
- Export `useColorScheme` hook usage example

**White-Label Mode** (`--white-label`):
- `theme/base-theme.ts` — Shared base theme
- `theme/tenant-factory.ts` — Factory function: `createTenantTheme(config: TenantConfig)`
- `theme/tenant-types.ts` — TenantConfig interface
- `theme/TenantThemeProvider.tsx` — React context with dynamic theme loading
- Example tenant configs

### Phase 4 — Component Override Library

Generate comprehensive component overrides:

| Component | Overrides |
|-----------|-----------|
| MuiButton | borderRadius, textTransform:none, disableElevation, size variants, custom 'gradient' variant |
| MuiTextField | borderRadius, focused border color, size variants |
| MuiCard | border style, borderRadius, elevation:0 with border |
| MuiChip | borderRadius, size variants |
| MuiAppBar | elevation:0, border-bottom style |
| MuiDialog | borderRadius, max-width defaults |
| MuiDataGrid | header styles, row hover, selection colors |
| MuiDatePicker | toolbar colors, day selection styles |
| MuiAlert | borderRadius, icon alignment |
| MuiTooltip | borderRadius, background, font size |

### Phase 5 — TypeScript Augmentation

Generate complete module augmentation for:
- Custom palette colors (brand, neutral, accent)
- Custom theme variables (navHeight, sidebarWidth, etc.)
- Custom typography variants (code, label, stat)
- Button/Chip/Badge color overrides
- Typography variant overrides

### Phase 6 — Documentation

Generate inline documentation:
- Usage examples for ThemeProvider/CssVarsProvider setup
- Dark mode toggle component
- Design token reference table
- Component customization examples

### Audit Mode (`--mode audit`)

Scan existing design system for:
- Token consistency (are all colors from tokens or hardcoded?)
- Missing TypeScript augmentation
- Component override opportunities
- Dark mode gaps
- Accessibility color contrast issues
- CSS variables vs Emotion inconsistencies

Output: scored report (0-100) with actionable fixes.

## Output Contract

```
Design system scaffolded: theme/
Files created: X
Design tokens: X colors, X spacing, X typography scales
Component overrides: X components
TypeScript augmentation: complete
Dark mode: supported
CSS variables: enabled/disabled
White-label: X tenant configs (if enabled)
```
