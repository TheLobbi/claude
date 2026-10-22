---
description: "Chakra UI v3 reference — createSystem, tokens, semantic tokens, recipes, slot recipes, color mode, v2 migration, and how a design style maps onto a Chakra system"
model: sonnet
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
triggers:
  - chakra
  - chakra ui
  - chakra v3
  - createSystem
  - defineConfig
  - defineRecipe
  - defineSlotRecipe
  - semantic tokens
  - colorPalette
globs:
  - "theme.ts"
  - "**/theme/**/*.ts"
  - "**/components/ui/*.tsx"
  - "*.tsx"
---

# Chakra UI v3 Skill

Single source of truth for Chakra UI v3 in this plugin. Every other skill, command, and agent that emits Chakra code must follow this file. Verified against the official docs (docs header showed 3.37.0, Node.js 20+ required) on 2026-10-21.

Chakra v3 is a total rewrite of the v2 API. Never emit v2 patterns (see "v2 → v3 banned list").

## Install and bootstrap

```bash
npm i @chakra-ui/react @emotion/react
npx @chakra-ui/cli snippet add        # generates components/ui/* incl. provider.tsx
npx @chakra-ui/cli snippet add color-mode
```

`tsconfig.json`: `"moduleResolution": "Bundler"`, `"module": "ESNext"`, `"skipLibCheck": true`, and `"paths": { "@/*": ["./src/*"] }`.

Wrap the app root with the generated provider:

```tsx
import { Provider } from "@/components/ui/provider"
// <Provider>{children}</Provider>
```

The generated `Provider` composes `ChakraProvider` (styling) and `ThemeProvider` from `next-themes` (color mode).

## The system: `createSystem` + `defineConfig`

All customization is one config merged over `defaultConfig`. Token values are always wrapped in `{ value: ... }`.

```ts
// theme.ts
import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          500: { value: "tomato" },
        },
      },
    },
  },
})

export const system = createSystem(defaultConfig, config)
```

```tsx
// provider.tsx
import { ChakraProvider } from "@chakra-ui/react"
import { ThemeProvider } from "next-themes"
import { system } from "./theme"

export function Provider(props: { children: React.ReactNode }) {
  return (
    <ChakraProvider value={system}>
      <ThemeProvider attribute="class">{props.children}</ThemeProvider>
    </ChakraProvider>
  )
}
```

- `defaultConfig` = built-in tokens + recipes. `defaultBaseConfig` = only conditions and style properties.
- `preflight: false` in `createSystem` replaces v2 `resetCss={false}`.
- After editing the config, regenerate prop types: `npx @chakra-ui/cli typegen ./theme.ts`.

## Semantic tokens (light/dark)

Reference another token with `{colors.x}`. Use `base` for the default value and `_dark` for dark mode. Conditions in semantic tokens must be an at-rule or parent-selector condition.

```ts
const config = defineConfig({
  theme: {
    semanticTokens: {
      colors: {
        danger: {
          value: { base: "{colors.red.500}", _dark: "{colors.red.700}" },
        },
      },
    },
  },
})
```

### The `colorPalette` contract

A custom color works with `colorPalette` only if it defines `50`–`950` raw tokens **and** these semantic keys:

```ts
semanticTokens: {
  colors: {
    brand: {
      solid:      { value: "{colors.brand.500}" },
      contrast:   { value: "{colors.brand.100}" },
      fg:         { value: "{colors.brand.700}" },
      muted:      { value: "{colors.brand.100}" },
      subtle:     { value: "{colors.brand.200}" },
      emphasized: { value: "{colors.brand.300}" },
      focusRing:  { value: "{colors.brand.500}" },
    },
  },
}
```

Consume it: `<Button colorPalette="brand">` or `<Box bg="brand.solid" color="brand.contrast">`. For dark mode, give each semantic key `{ base, _dark }` values and verify contrast in both modes.

## Recipes and slot recipes

`styleConfig`/`multiStyleConfig` from v2 are replaced by recipes (single element) and slot recipes (multi-part). Base styles key is `base` (not `baseStyle`).

Extend a built-in recipe (adds an `xl` Button size):

```ts
import { defineRecipe, defineConfig, createSystem, defaultConfig } from "@chakra-ui/react"

const buttonRecipe = defineRecipe({
  variants: { size: { xl: { fontSize: "lg", px: 6, py: 3 } } },
})

const customConfig = defineConfig({
  theme: { recipes: { button: buttonRecipe } },
})
export const system = createSystem(defaultConfig, customConfig)
```

Extend a built-in slot recipe (`alertAnatomy.keys()` supplies the slot names):

```ts
import { alertAnatomy } from "@chakra-ui/react/anatomy"

const alertSlotRecipe = defineSlotRecipe({
  slots: alertAnatomy.keys(),
  variants: { size: { xl: { root: { fontSize: "lg", px: 6, py: 3 } } } },
})
// theme: { slotRecipes: { alert: alertSlotRecipe } }
```

A brand-new multi-part component:

```ts
const navbarSlotRecipe = defineSlotRecipe({
  slots: ["root", "badge", "icon"],
  base: {
    root: { bg: "blue.500", color: "white", px: 4, py: 2 },
    badge: { borderRadius: "full", px: 2, py: 1 },
  },
})
// theme: { slotRecipes: { navbar: navbarSlotRecipe } }
```

```tsx
const Navbar = (props) => {
  const recipe = useSlotRecipe({ key: "navbar" })
  const styles = recipe()
  return (
    <Box css={styles.root}>
      {props.children}
      <Box css={styles.badge} />
      <Box css={styles.icon} />
    </Box>
  )
}
```

Recipe fields: `base`, `variants`, `defaultVariants`, `compoundVariants` (slot recipes: `slots` plus per-slot styles; compound entries use a `css` object targeting slots). `compoundVariants` does not work with responsive values. Prefer the `chakra` factory or `createSlotRecipeContext` over hand-rolled `useRecipe` for new components:

```tsx
"use client"
const { withProvider, withContext } = createSlotRecipeContext({ recipe: checkboxSlotRecipe })
export const CheckboxRoot = withProvider<HTMLLabelElement, CheckboxRootProps>("label", "root")
export const CheckboxControl = withContext<HTMLInputElement, CheckboxControlProps>("input", "control")
```

Pass `unstyled` on the root to drop recipe styles. Files using these hooks need `"use client"` in React Server Component frameworks.

## Conditions and global CSS

```ts
const customConfig = defineConfig({
  conditions: {
    off: "&:is([data-state=off])",
    on: "&:is([data-state=on])",
  },
  globalCss: {
    "*::placeholder": { opacity: 1, color: "fg.subtle" },
    "*::selection": { bg: "green.200" },
    html: { fontFamily: "Roboto, sans-serif" },
  },
})
```

Custom conditions are used as `_off` / `_on` style props.

## Color mode

`ColorModeProvider`, `useColorMode`, `useColorModeValue`, `LightMode`, `DarkMode`, and `ColorModeScript` were removed from the core package. Color mode is `next-themes` plus the generated snippet:

```tsx
import { ColorModeButton, DarkMode, LightMode, useColorMode, useColorModeValue } from "@/components/ui/color-mode"
```

`next-themes` is framework-agnostic (Vite, Remix, Gatsby work too). Force a mode app-wide with `forcedTheme`:

```tsx
<ThemeProvider attribute="class" disableTransitionOnChange forcedTheme="dark" {...props} />
```

Prefer semantic tokens with `_dark` over per-component `useColorModeValue`.

## Mapping a design style onto a Chakra system

A design style from the `design-styles` skill becomes four config layers, in this order:

1. `tokens` — raw palette (`50`–`950`), fonts, radii, shadows, blurs, easings.
2. `semanticTokens` — `bg.*`, `fg.*`, `border.*`, and the `colorPalette` contract, each with `base` and `_dark`.
3. `recipes` / `slotRecipes` — per-component visual language (e.g. glass: translucent `bg`, `backdropFilter: "blur(...)"`, 1px border; neo-brutalist: thick border, hard offset `boxShadow`, `borderRadius: "none"`).
4. `globalCss` — page background, selection, typography baseline.

The plugin's MCP server (`design-styles`) exposes `generate_chakra_system` to produce layers 1, 2, and 4 for a named style, and `check_contrast` to validate semantic pairs. Layer 3 stays hand-authored per project.

## MCP servers for Chakra work

| Server | Source | Use |
|--------|--------|-----|
| `chakra-ui` | official `@chakra-ui/react-mcp` | Live v3 component props, examples, tokens, `v2_to_v3_code_review` |
| `design-styles` | this plugin (`mcp-server/`) | Style catalog search, token/system generation, contrast checks |

Official server tools: `get_theme`, `v2_to_v3_code_review`, `installation`, `list_components`, `get_component_example`, `get_component_props`, and `customize_theme`. Prefer querying it over recalling props from memory. The server's current public tool names are authoritative; do not use retired names such as `theme_customization`, `list_component_templates`, or `get_component_templates`.

## v2 → v3 banned list

Never emit these. Use the replacement.

| v2 (banned) | v3 |
|-------------|----|
| `extendTheme({...})` | `createSystem(defaultConfig, defineConfig({ theme: {...} }))`, tokens as `{ value }` |
| `<ChakraProvider theme={theme}>` | `<ChakraProvider value={system}>` |
| `resetCss={false}` | `preflight: false` in `createSystem` |
| `ColorModeScript`, `useColorMode` from core | `next-themes` + `@/components/ui/color-mode` snippet |
| `styleConfig` / `multiStyleConfig` | `defineRecipe` / `defineSlotRecipe` |
| `sx`, `__css`, `apply` | `css` prop (nested selectors need `&`) |
| `colorScheme` | `colorPalette` |
| `isOpen` / `isDisabled` / `isInvalid` / `isRequired` / `isLoading` | `open` / `disabled` / `invalid` / `required` / `loading` |
| `spacing` | `gap` |
| Event handlers | Keep `onChange` for native inputs; use `onCheckedChange(details)` for checkbox controls and read `details.checked`; use `onValueChange(details)` for value-based controls and read the component's documented `details.value` (verify with the official MCP) |
| `noOfLines`, `truncated` | `lineClamp`, `truncate` |
| `leftIcon` / `rightIcon` | icons as children |
| `Modal`, `Drawer`, `Popover`, `Menu` flat API | `Dialog.Root` etc. with explicit parts, wrapped in `Portal` where needed |
| `FormControl` | `Field` / `Fieldset` |
| `Collapse` | `Collapsible` |
| `Fade`, `ScaleFade`, `Slide`, `SlideFade` | `Presence` |
| `Stepper` / `CircularProgress` / `Select` | `Steps` / `ProgressCircle` / `NativeSelect` |
| `Tooltip label=` | `Tooltip content=` from `@/components/ui/tooltip` |
| `@chakra-ui/icons`, `@chakra-ui/next-js` | removed in v3 (check the official MCP `v2_to_v3_code_review` for the replacement) |
| `Show` / `Hide`, `StackDivider`, `StackItem`, `FocusLock` | removed in v3 (check the official MCP `v2_to_v3_code_review` for the replacement) |

Accordion items and Tabs triggers/content now require a `value`.

## Verification checklist for generated Chakra code

- No banned v2 pattern appears.
- Tokens are `{ value }`-wrapped; semantic tokens use `base` / `_dark`.
- Every custom color used with `colorPalette` defines all seven semantic keys.
- Components use compound parts, not v2 flat props.
- `typegen` has been run (or noted as a follow-up) after editing the config.
- Foreground/background semantic pairs meet WCAG AA in light and dark (use `check_contrast`).
