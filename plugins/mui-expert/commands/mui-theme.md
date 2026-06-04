---
name: /mui-theme
intent: Generate or audit a MUI theme configuration
tags:
  - mui-expert
  - theme
  - design-system
inputs:
  - '--mode'
  - '--dark-mode'
  - '--palette'
  - '--typography'
  - '--audit-file'
risk: low
cost: medium
description: |
  Generate a complete MUI createTheme() configuration with palette, typography, spacing, shape, breakpoints, and component overrides — or audit an existing theme file for missing best practices, accessibility issues, and TypeScript gaps.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# /mui-theme

Generate or audit a MUI theme configuration.

## Operating Protocol

### Generate Mode (`--mode generate`)

1. Collect brand requirements:
   - Primary and secondary brand colors (ask if not provided via `--palette`)
   - Font family (ask if not provided via `--typography`; default to Roboto)
   - Border radius preference (sharp / rounded / pill)
   - Whether dark mode support is needed (`--dark-mode`)

2. Generate a complete theme file including:
   - `createTheme()` call with full `palette`, `typography`, `spacing`, `shape`, and `breakpoints` configuration
   - Component overrides (`components` key) for the most common components: Button, TextField, Card, AppBar
   - TypeScript module augmentation for any custom palette colors added beyond the MUI defaults
   - `CssBaseline` and `ThemeProvider` wrapper usage example in a comment block

3. If `--dark-mode` is requested:
   - Generate a `ColorModeContext` with `React.createContext`
   - Export a `useColorMode` hook
   - Generate both `light` and `dark` palette variants inside a single `getDesignTokens(mode)` function
   - Show how to pass `mode` to `createTheme` and toggle it at runtime

4. Output format:
   - Single TypeScript file (`theme.ts`)
   - Named exports: `theme` (default light), `getDesignTokens` (if dark mode), `ColorModeContext` (if dark mode)
   - Inline comments explaining non-obvious choices

### Audit Mode (`--mode audit`)

1. Read the file specified by `--audit-file`.

2. Check for the following issues and report each with severity, line reference, and a concrete fix:

   | Check | Severity |
   |-------|----------|
   | Missing `CssBaseline` in ThemeProvider usage | warning |
   | Hardcoded hex/rgb colors instead of `theme.palette.*` tokens | error |
   | Missing dark mode support when app has theme toggle | warning |
   | Unused theme properties (keys defined but never referenced) | info |
   | TypeScript augmentation gaps for custom palette keys | error |
   | Component override opportunities (repeated `sx` patterns that belong in `components`) | info |
   | Accessibility color contrast failures (WCAG AA < 4.5:1 for text) | error |
   | `makeStyles` / `withStyles` usage (v4 pattern, should use `styled` or `sx`) | error |
   | Missing `typography.htmlFontSize` when root font-size is not 16px | warning |
   | Spacing values that don't align to the 8px grid | info |

3. Output an audit report grouped by severity. Each item must include:
   - Severity label (ERROR / WARNING / INFO)
   - File and approximate line number
   - Description of the issue
   - Exact fix suggestion or code snippet

## Output

- **Generate**: Complete `theme.ts` file written to the project, plus a short summary of choices made.
- **Audit**: Markdown-formatted report printed to the conversation, with counts per severity level and an overall health score (0–100).
