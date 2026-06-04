---
name: /mui-fingerprint
intent: Scan and fingerprint an app, ask interactive questions, then build every MUI component needed
tags:
  - mui-expert
  - fingerprint
  - scan
  - scaffold
  - interactive
  - full-build
inputs:
  - '--path'
  - '--dry-run'
  - '--style'
risk: medium
cost: high
description: |
  Interactive app fingerprinting command. Scans the project to detect existing MUI components, pages, routing, data models, and API endpoints. Asks targeted questions about missing functionality. Then systematically builds every MUI component the app needs — layouts, forms, data tables, navigation, feedback, and custom widgets.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
  - Agent
---

# /mui-fingerprint

Fingerprint an app, ask questions, then build every component it needs.

## Operating Protocol

### Phase 1 — Deep Scan (Fingerprinting)

Scan the project to understand what exists and what's missing.

#### 1.1 — Tech Stack Detection

```bash
# Framework
grep -l "next" package.json             # Next.js
grep -l "vite" package.json             # Vite
grep -l "react-scripts" package.json    # CRA

# MUI version and packages
grep -E '"@mui/(material|system|x-data-grid|x-date-pickers|x-charts)"' package.json

# Styling approach
grep -rl "styled(" src/                 # styled() usage
grep -rl "sx={{" src/                   # sx prop usage
grep -rl "makeStyles\|withStyles" src/  # deprecated patterns
grep -rl "className=" src/ | head -5    # Tailwind/CSS modules

# State management
grep -l "zustand\|@reduxjs/toolkit\|recoil\|jotai\|@tanstack/react-query" package.json

# Form library
grep -l "react-hook-form\|formik\|@hookform" package.json

# Router
grep -l "react-router\|next/router\|next/navigation" package.json
```

#### 1.2 — Existing Component Inventory

```bash
# MUI components in use
grep -roh "from '@mui/material/[A-Z][^']*'" src/ | sort -u | wc -l

# List all unique MUI component imports
grep -roh "from '@mui/material/[A-Z][^']*'" src/ | sort -u

# MUI X components
grep -roh "from '@mui/x-[^']*'" src/ | sort -u

# Custom components (project's own)
find src/components -name "*.tsx" -o -name "*.jsx" | sort

# Pages/routes
find src/pages -name "*.tsx" 2>/dev/null || find src/app -name "page.tsx" 2>/dev/null
```

#### 1.3 — Theme Analysis

```bash
# Theme file
find src -name "theme*" -o -name "Theme*" | head -5

# ThemeProvider usage
grep -rn "ThemeProvider\|CssVarsProvider" src/ | head -3

# CssBaseline
grep -rn "CssBaseline" src/ | head -3

# Dark mode
grep -rn "palette.mode\|colorSchemes\|useColorScheme\|ColorModeContext" src/ | head -5
```

#### 1.4 — API / Data Layer Detection

```bash
# API calls
grep -roh "fetch(\|axios\.\|useSWR\|useQuery" src/ | sort | uniq -c | sort -rn

# API routes (Next.js)
find src/app/api -name "route.ts" 2>/dev/null | head -20

# Data models / types
find src -name "*.types.ts" -o -name "types.ts" -o -name "*.model.ts" | head -10
```

### Phase 2 — Interactive Questions

Based on the scan, ask targeted questions using AskUserQuestion. Adapt questions to
what was found vs what's missing.

**Always ask:**
1. "What is this app? Describe the main purpose in 1-2 sentences."
2. "Who are the primary users? (admin, end-user, both, internal team)"

**Ask based on gaps detected:**

If **no layout/navigation found**:
3. "What navigation pattern do you want? (sidebar+appbar / top-nav / tabs / bottom-nav-mobile)"
4. "How many main sections/pages does the app have? List them."

If **no forms found**:
5. "What are the main data entry forms? (e.g., user registration, settings, create order)"
6. "Do forms need multi-step wizards or single-page layout?"

If **no data tables found**:
7. "What data lists/tables are needed? (e.g., user list, order list, product catalog)"
8. "Do tables need inline editing, filtering, export?"

If **no feedback components found**:
9. "How should the app communicate status? (toast/snackbar, inline alerts, dialog confirmations)"

If **no theme customization found**:
10. "Do you have brand colors? (primary hex, secondary hex)"
11. "Do you need dark mode support?"

If **no auth/access UI found**:
12. "Does the app have login/signup pages?"
13. "Are there role-based access differences in the UI?"

**Ask about quality level:**
14. "How polished should components be? (functional-first / production-quality / highly-creative)"

### Phase 3 — Component Gap Analysis

Build a comprehensive list of needed components by category:

```
## Component Gap Analysis

### Layout (priority: critical)
- [ ] AppShell (AppBar + Drawer + main content area)
- [ ] ResponsiveDrawer (mobile temporary, desktop permanent)
- [ ] PageContainer (consistent padding, max-width, breadcrumbs)

### Navigation (priority: critical)
- [ ] MainNav (sidebar items with icons, active state, router integration)
- [ ] Breadcrumbs (auto-generated from route)
- [ ] TabNavigation (for section sub-navigation)

### Data Display (priority: high)
- [ ] DataTable (reusable DataGrid wrapper with server-side fetch)
- [ ] StatCard (KPI card with trend indicator)
- [ ] DetailPanel (expandable row detail)

### Forms (priority: high)
- [ ] FormField (unified wrapper for TextField/Select/DatePicker + RHF)
- [ ] EntityForm (metadata-driven form from API schema)
- [ ] SearchBar (debounced Autocomplete with recent searches)
- [ ] FilterBar (multi-field filter panel)

### Feedback (priority: medium)
- [ ] ConfirmDialog (reusable confirmation with severity)
- [ ] ToastProvider (Snackbar queue with severity)
- [ ] LoadingOverlay (Backdrop + CircularProgress)
- [ ] EmptyState (illustrated empty state with action button)
- [ ] ErrorBoundary (with MUI Alert fallback)

### Auth (priority: depends)
- [ ] LoginForm (email/password + social)
- [ ] SignupForm (multi-step registration)
- [ ] ForgotPasswordForm
- [ ] ProtectedRoute (role-based access wrapper)

### Dashboard (priority: depends)
- [ ] DashboardGrid (responsive stat cards + charts layout)
- [ ] ChartCard (reusable chart container with title/subtitle)
- [ ] ActivityFeed (timeline of recent events)

### Settings (priority: low)
- [ ] SettingsLayout (tabs or accordion sections)
- [ ] ProfileForm (avatar upload + fields)
- [ ] PreferencesForm (switches, selects for user prefs)
- [ ] ThemeToggle (dark/light/system mode switcher)
```

### Phase 4 — Build Components

For each checked item, generate the component following these rules:

1. **Detect project conventions** — match existing import style, file structure, naming
2. **Use theme tokens** — never hardcode colors, use `theme.palette.*`, `theme.spacing()`
3. **Full TypeScript** — exported props interface, proper generics
4. **Accessibility** — ARIA labels, keyboard navigation, focus management
5. **Responsive** — useMediaQuery or responsive sx for all layout components
6. **Dark mode safe** — semantic palette tokens, no hardcoded hex
7. **Match --style level**:
   - `minimal`: functional, clean, no animations
   - `standard`: polished, subtle hover/focus effects, proper spacing
   - `premium`: refined transitions, loading states, skeleton placeholders, empty states
   - `creative`: fluid animations, gradient accents, glassmorphism, micro-interactions

**Build order** (dependencies first):
1. Theme (if missing)
2. Layout shell (AppBar, Drawer, PageContainer)
3. Navigation (sidebar items, breadcrumbs)
4. Reusable primitives (FormField, DataTable, ConfirmDialog, ToastProvider)
5. Page-specific components (forms, tables, dashboards)
6. Polish components (empty states, error boundaries, loading overlays)

### Phase 5 — Wire Up

After building components:
1. Integrate layout shell into app root (layout.tsx or App.tsx)
2. Add navigation items matching detected/specified pages
3. Wire ToastProvider at app root
4. Add ThemeProvider if missing
5. Update barrel exports if project uses them

### Phase 6 — Report

```
## Fingerprint Report

### App Profile
- Framework: [detected]
- MUI version: [detected]
- Styling: [sx / styled / Tailwind / mixed]
- State: [React Query / Zustand / Redux / Context]
- Forms: [RHF / Formik / controlled]
- Router: [Next.js App / Pages / React Router]

### Scan Results
- Existing MUI components: X unique imports
- Existing custom components: X files
- Pages/routes: X
- Theme: [found / missing]
- Dark mode: [yes / no]

### Components Built
| Component | Category | Lines | Status |
|-----------|----------|-------|--------|
| AppShell  | Layout   | 120   | created |
| DataTable | Display  | 200   | created |
| ...       | ...      | ...   | ...     |

Total: X components, ~Y lines of code
```

## Quality Bar

Before declaring done:
- [ ] All components render without TypeScript errors
- [ ] All interactive elements have accessible names
- [ ] All layout components are responsive (mobile + desktop)
- [ ] All colors use theme palette tokens (no hardcoded hex)
- [ ] Theme has CssBaseline + ThemeProvider/CssVarsProvider
- [ ] Navigation integrates with router
- [ ] Forms have validation wired
- [ ] Data tables have loading/empty/error states
