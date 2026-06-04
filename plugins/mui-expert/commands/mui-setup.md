---
name: /mui-setup
intent: Set up MUI in a project with MCP server, LSP, packages, theme, and tooling
tags:
  - mui-expert
  - setup
  - mcp
  - lsp
  - installation
  - tooling
inputs:
  - '--scope'
  - '--framework'
  - '--mui-version'
  - '--tier'
  - '--css-engine'
  - '--with-tailwind'
risk: low
cost: medium
description: |
  Complete MUI project setup — installs packages, configures the MUI MCP server for Claude Code, sets up LSP/editor tooling, generates starter theme, and configures SSR/bundler integration. One command to go from zero to production-ready MUI.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# /mui-setup

Set up MUI in a project with packages, MCP server, LSP, theme, and tooling.

## Operating Protocol

### Phase 1 — Detect Environment

1. Check if `package.json` exists
2. Detect package manager (`pnpm`, `yarn`, `npm`) from lock files
3. Detect framework from dependencies (Next.js, Vite, CRA, Remix)
4. Check for existing MUI installation
5. Check for existing `.mcp.json`
6. Check for existing theme files

### Phase 2 — Install Packages (scope: full|packages)

Install based on `--tier` and `--css-engine`:

**Core (always)**:
```bash
# Community tier
pnpm add @mui/material @emotion/react @emotion/styled

# Icons
pnpm add @mui/icons-material

# Lab (experimental components)
pnpm add @mui/lab
```

**MUI X (based on --tier)**:
```bash
# Community (free)
pnpm add @mui/x-data-grid @mui/x-date-pickers @mui/x-charts @mui/x-tree-view

# Pro
pnpm add @mui/x-data-grid-pro @mui/x-date-pickers-pro @mui/x-tree-view-pro

# Premium
pnpm add @mui/x-data-grid-premium @mui/x-date-pickers-pro @mui/x-tree-view-pro
```

**Date adapter (dayjs recommended)**:
```bash
pnpm add dayjs
```

**Pigment CSS (if --css-engine pigment-css)**:
```bash
pnpm add @pigment-css/react
# Framework-specific plugin:
pnpm add -D @pigment-css/nextjs-plugin  # Next.js
pnpm add -D @pigment-css/vite-plugin    # Vite
```

**Tailwind interop (if --with-tailwind)**:
```bash
# Ensure Tailwind is installed, then configure:
# - Disable preflight in tailwind.config
# - Set important: '#root'
# - Configure Emotion prepend: true
```

**Dev dependencies**:
```bash
pnpm add -D @types/react @types/react-dom
# For testing MUI components:
pnpm add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
pnpm add -D jest-axe  # accessibility testing
```

### Phase 3 — Configure MUI MCP Server (scope: full|mcp-only)

The MUI MCP server (`@mui/mcp`) gives Claude direct access to MUI's official
documentation for accurate API answers, migration guidance, and complex questions.

**Check if `.mcp.json` exists**:
- If yes: add `mui-mcp` entry if not present
- If no: create `.mcp.json` with `mui-mcp`

**Add to `.mcp.json`**:
```json
{
  "mcpServers": {
    "mui-mcp": {
      "command": "npx",
      "args": ["-y", "@mui/mcp@latest"]
    }
  }
}
```

**Verify MCP tools available after setup**:
- `useMuiDocs` — Fetch documentation for a specific MUI package/topic
- `fetchDocs` — Follow-up fetch for additional doc URLs

**Usage in Claude Code**:
After setup, Claude can call `useMuiDocs` to get authoritative MUI documentation:
```
useMuiDocs({ query: "DataGrid server-side pagination" })
fetchDocs({ url: "https://mui.com/x/react-data-grid/pagination/" })
```

### Phase 4 — Configure LSP / Editor Tooling (scope: full|tooling)

**TypeScript LSP (built-in)**:
MUI is fully typed. Ensure `tsconfig.json` has:
```json
{
  "compilerOptions": {
    "strict": true,
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

**VS Code Extensions (recommend to user)**:
- `vscode-styled-components` — Syntax highlighting for styled() and css`` template literals
- `ms-vscode.vscode-typescript-next` — Latest TS features for MUI type inference
- `bradlc.vscode-tailwindcss` — Tailwind IntelliSense (if --with-tailwind)

**ESLint for MUI**:
```bash
pnpm add -D eslint-plugin-mui-path-imports
```

Add to `.eslintrc`:
```json
{
  "plugins": ["mui-path-imports"],
  "rules": {
    "mui-path-imports/mui-path-imports": "error"
  }
}
```

This enforces path imports (`import Button from '@mui/material/Button'`) over
barrel imports (`import { Button } from '@mui/material'`) for optimal tree-shaking.

**MUI X License Key (Pro/Premium)**:
If `--tier` is pro or premium, add license setup:
```tsx
// src/main.tsx or app/layout.tsx
import { LicenseInfo } from '@mui/x-license';
LicenseInfo.setLicenseKey(process.env.MUI_X_LICENSE_KEY!);
```

Add `MUI_X_LICENSE_KEY` to `.env.example` (never commit the actual key).

### Phase 5 — Generate Starter Theme (scope: full|theme)

Generate a minimal but production-ready theme file:

**For MUI v6 with CSS variables** (recommended):
```tsx
// src/theme.ts
import { extendTheme } from '@mui/material/styles';

const theme = extendTheme({
  cssVarPrefix: 'app',
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#2563eb' },
        secondary: { main: '#7c3aed' },
      },
    },
    dark: {
      palette: {
        primary: { main: '#60a5fa' },
        secondary: { main: '#a78bfa' },
      },
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8, padding: '8px 20px' },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: '1px solid', borderColor: 'divider', borderRadius: 12 },
      },
    },
  },
});

export default theme;
```

**For MUI v5 (ThemeProvider)**:
```tsx
import { createTheme, responsiveFontSizes } from '@mui/material/styles';

let theme = createTheme({
  palette: { primary: { main: '#2563eb' }, secondary: { main: '#7c3aed' } },
  typography: { fontFamily: '"Inter", sans-serif', button: { textTransform: 'none' } },
  shape: { borderRadius: 8 },
});
theme = responsiveFontSizes(theme);
export default theme;
```

### Phase 6 — Configure Framework Integration (scope: full)

**Next.js App Router**:
Generate `ThemeRegistry` client component + `app/layout.tsx` integration.
Add `getInitColorSchemeScript()` for flash prevention.

**Next.js Pages Router**:
Generate `_app.tsx` with `CacheProvider` + `ThemeProvider`.
Generate `_document.tsx` with Emotion SSR extraction.

**Vite**:
Generate `main.tsx` with `ThemeProvider` + `CssBaseline`.

**Pigment CSS setup** (if selected):
Add framework plugin to config (`next.config.ts` or `vite.config.ts`).

### Phase 7 — Verification Checklist

After setup, verify:
```bash
# TypeScript compiles
npx tsc --noEmit

# MCP server responds
# (Claude can now call useMuiDocs)

# Tree-shaking works (no barrel imports)
grep -rn "from '@mui/material'" src/ --include="*.tsx" | grep "{ " | head -5
# Should return empty — all imports should be path-based

# Theme loads correctly
# (Visual check — CssBaseline applies, fonts load, colors match)
```

## Output Contract

```
MUI setup complete.
Framework: [nextjs|vite|cra|remix]
MUI version: [v5|v6]
CSS engine: [emotion|pigment-css]
MUI X tier: [community|pro|premium]
Tailwind: [yes|no]

Packages installed: X
MCP server: configured in .mcp.json (mui-mcp)
  Tools: useMuiDocs, fetchDocs
Theme: generated at src/theme.ts
Framework integration: configured
ESLint: mui-path-imports rule added
TypeScript: strict mode verified

Recommended VS Code extensions:
  - vscode-styled-components
  - bradlc.vscode-tailwindcss (if Tailwind)

Next steps:
  1. Run 'npx tsc --noEmit' to verify TypeScript
  2. Start dev server to verify theme loads
  3. Use /mui-theme --mode audit to check theme quality
  4. Use /mui-audit to check for anti-patterns
```
