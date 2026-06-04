---
name: /mui-ssr
intent: Configure MUI for server-side rendering with Next.js
tags:
  - mui-expert
  - ssr
  - next.js
  - emotion
  - pigment-css
inputs:
  - '--router'
  - '--engine'
  - '--css-vars'
  - '--dark-mode'
risk: low
cost: medium
description: |
  Configure MUI for Next.js SSR with correct Emotion cache setup, CSS variables, flash prevention, and React Server Components compatibility.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# /mui-ssr

Configure MUI for server-side rendering with Next.js.

## Operating Protocol

### Phase 1 — Detect Environment

1. Check Next.js version from package.json
2. Detect App Router vs Pages Router (existence of `app/` directory)
3. Check existing MUI setup (ThemeProvider, CssVarsProvider, Emotion cache)
4. Check for existing `_document.tsx` or `layout.tsx`

### Phase 2 — Generate Configuration

**App Router + Emotion** (`--router app --engine emotion`):

Generate:
- `lib/theme.ts` — Theme with extendTheme/createTheme
- `components/ThemeRegistry/ThemeRegistry.tsx` — Client component wrapper
- `components/ThemeRegistry/EmotionCache.tsx` — NextAppDirEmotionCacheProvider
- Update `app/layout.tsx` — Wrap children in ThemeRegistry

**App Router + Pigment CSS** (`--router app --engine pigment-css`):

Generate:
- `lib/theme.ts` — Theme configuration
- `next.config.ts` — withPigmentCSS plugin setup
- No EmotionCache needed (zero-runtime)
- Full RSC compatibility

**Pages Router + Emotion** (`--router pages --engine emotion`):

Generate:
- `lib/createEmotionCache.ts` — Cache factory
- `pages/_app.tsx` — CacheProvider + ThemeProvider
- `pages/_document.tsx` — extractCriticalToChunks + style injection

### Phase 3 — Dark Mode & Flash Prevention

When `--dark-mode` and `--css-vars`:
- Use `extendTheme()` with `colorSchemes: { light, dark }`
- Add `getInitColorSchemeScript()` to layout/document body
- Generate `useColorScheme` toggle component
- Configure `defaultMode: 'system'` for OS preference detection

When `--dark-mode` without `--css-vars`:
- Generate ColorModeContext with React.createContext
- Memoize theme with useMemo based on mode state
- Persist preference to localStorage

### Phase 4 — Verification

After generating files:
1. Check TypeScript compilation
2. Verify no hydration mismatch patterns (useMediaQuery SSR safety)
3. Confirm Emotion cache is per-request (not singleton)
4. Verify `'use client'` directives on all MUI-using components

### Phase 5 — Performance Recommendations

Output checklist:
- [ ] Heavy MUI X components wrapped in next/dynamic with ssr: false
- [ ] Emotion cache uses `prepend: true`
- [ ] Theme created once (not inside render)
- [ ] getInitColorSchemeScript present for flash prevention
- [ ] useMediaQuery uses ssrMatchMedia option

## Output Contract

```
SSR configured: Next.js ${router} Router + ${engine}
Files created/modified: X
CSS Variables: enabled/disabled
Dark mode: enabled/disabled
Flash prevention: configured
RSC compatibility: full (pigment) / client-boundary (emotion)
```
