---
name: convert
intent: Convert CSS styles between different formats (CSS, Tailwind, styled-components)
tags:
  - frontend-design-system
  - command
  - convert
inputs: []
risk: medium
cost: medium
description: Convert CSS styles between different formats (CSS, Tailwind, styled-components)
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
---

# CSS Format Conversion Command

Convert styling between CSS, Tailwind, styled-components, Chakra UI v3, SCSS, Less, and PostCSS formats with intelligent property mapping.

## Usage

```bash
/convert <source_format> <target_format> <input_file> [output_file]
```

## Arguments

- `source_format` (required): Source CSS format - css, tailwind, styled, chakra, scss, less, postcss
- `target_format` (required): Target CSS format - css, tailwind, styled, chakra, scss, less, postcss
- `input_file` (required): Path to the CSS/style file to convert
- `output_file` (optional): Output file path (defaults to input_file.{ext})

## Examples

```bash
# Convert CSS to Tailwind
/convert css tailwind styles/button.css styles/button.tailwind.css

# Convert Tailwind to styled-components
/convert tailwind styled components/Button.tsx components/Button.styled.tsx

# Convert SCSS to CSS
/convert scss css theme.scss theme.css

# Convert styled-components to Tailwind
/convert styled tailwind src/Button.tsx src/Button.module.css

# Convert Less to PostCSS
/convert less postcss styles/main.less styles/main.pcss

# Convert CSS to SCSS with variables
/convert css scss styles/app.css styles/app.scss

# Convert CSS variables to a Chakra UI v3 system
/convert css chakra styles/tokens.css theme.ts

# Convert styled-components to Chakra UI v3
/convert styled chakra src/Button.tsx src/Button.chakra.tsx

# Convert a Chakra UI v3 system to CSS variables
/convert chakra css theme.ts styles/tokens.css
```

## Execution Flow

### 1. Input Validation

Load and parse the source file to extract styling rules, variables, and declarations.

```bash
# Verify file exists and validate format
validate_input() {
  if [ ! -f "$input_file" ]; then
    echo "Error: Input file not found: $input_file"
    return 1
  fi
  
  # Validate source format
  case "$source_format" in
    css|tailwind|styled|chakra|scss|less|postcss) return 0 ;;
    *) echo "Error: Invalid source format"; return 1 ;;
  esac
}
```

### 2. Format-Specific Parsers

Extract AST from source format:

- **CSS Parser**: Extract rules, selectors, properties, variables
- **Tailwind Parser**: Extract utility classes and tailwind config
- **Styled-Components Parser**: Extract styled definitions and global styles
- **Chakra Parser**: Extract `theme.tokens`, `theme.semanticTokens`, recipes/slot recipes, `globalCss`, and `css`/style props from Chakra v3 sources
- **SCSS Parser**: Handle nesting, variables, mixins
- **Less Parser**: Handle operations and mixins
- **PostCSS Parser**: Handle plugins and modern syntax

### 3. Abstract Syntax Tree Generation

Create unified AST representation:

```
StyleAST {
  selector: string
  properties: Map<string, string>
  pseudoStates: Map<string, StyleAST>
  mediaQueries: Map<string, StyleAST>
  keyframes: Keyframe[]
  variables: Map<string, string>
}
```

### 4. Intelligent Property Mapping

Map properties between formats using conversion tables:

- **Color mapping**: RGB, HEX, HSL, CSS variables
- **Unit conversion**: px, rem, em, %, vh, vw
- **Spacing mapping**: Padding, margin, gap values
- **Responsive mapping**: Media queries to breakpoint prefixes
- **Animation mapping**: Keyframes and transitions

### 5. Target Format Generation

Generate output in target format:

- **CSS**: Standard CSS with variables and media queries
- **Tailwind**: Utility class composition
- **styled-components**: Styled components with theme integration
- **Chakra**: Chakra UI v3 system (see "Chakra UI v3 Conversion")
- **SCSS**: SCSS with variables and nesting
- **Less**: Less with variables and mixins
- **PostCSS**: Modern CSS with plugin syntax

## Supported Conversion Paths

### Color Space Conversion

```
RGB:        rgb(59, 130, 246)
HEX:        #3b82f6
HSL:        hsl(217, 98%, 61%)
CSS Var:    var(--color-primary)
Tailwind:   text-blue-500
Theme:      tokens.colors.primary[500]
```

### Unit Transformation

```
16px -> 1rem (with 16px base)
8px  -> 0.5rem
100% -> w-full
50%  -> w-1/2
100vh -> h-screen
```

### Responsive Breakpoints

```
@media (max-width: 768px)
  -> md: prefix in Tailwind
  -> ${media.tablet} in styled-components
```

### Variable Resolution

```
--primary: #3b82f6
  -> primary: '#3b82f6' in Tailwind config
  -> primary: '#3b82f6' in styled theme
```

## Output Examples

### CSS Output

```css
:root {
  --color-primary: #3b82f6;
  --spacing-base: 8px;
  --border-radius-md: 6px;
}

.button {
  display: inline-flex;
  padding: var(--spacing-base);
  background-color: var(--color-primary);
  border-radius: var(--border-radius-md);
}
```

### Tailwind Output

```html
<button class="inline-flex p-2 bg-blue-500 rounded-md">
  Click me
</button>
```

### Styled-Components Output

```typescript
import styled from 'styled-components';

export const Button = styled.button`
  display: inline-flex;
  padding: 8px;
  background-color: #3b82f6;
  border-radius: 6px;
`;
```

### Chakra UI v3 Output

```typescript
import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const config = defineConfig({
  theme: {
    tokens: {
      colors: { primary: { 500: { value: '#3b82f6' } } },
    },
    semanticTokens: {
      colors: {
        danger: { value: { base: '{colors.red.500}', _dark: '{colors.red.700}' } },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
```

## Chakra UI v3 Conversion

Source of truth: `skills/chakra-ui-v3/SKILL.md`. Never emit a pattern from its "v2 → v3 banned list". Look up built-in component props and examples through the official `chakra-ui` MCP server (`get_component_props`, `get_component_example`, `v2_to_v3_code_review`) rather than recalling them.

### To Chakra (`css|tailwind|styled|scss|less|postcss` -> `chakra`)

| Source | Chakra v3 |
|--------|-----------|
| `--primary: #3b82f6` / theme value | `theme.tokens.colors.primary.500: { value: '#3b82f6' }` (always `{ value }`-wrapped) |
| Light/dark variable pair (`:root` + `.dark`, `prefers-color-scheme`) | `theme.semanticTokens` with `{ base, _dark }` |
| Reference to another variable | `{colors.x}` token reference |
| Custom color used as a variant color | Raw `50`-`950` plus semantic `solid`, `contrast`, `fg`, `muted`, `subtle`, `emphasized`, `focusRing` so `colorPalette` works |
| Component variants (single element) | `defineRecipe` under `theme.recipes` |
| Multi-part component | `defineSlotRecipe` under `theme.slotRecipes` |
| Global/body/selection rules | `globalCss` |
| Per-element nested selectors | `css` prop (nested selectors need `&`) |

Wrap in `createSystem(defaultConfig, defineConfig({ theme: { ... } }))`, provide it with `<ChakraProvider value={system}>`, and run `npx @chakra-ui/cli typegen ./theme.ts` afterwards.

### From Chakra (`chakra` -> `css|tailwind|styled|scss|less|postcss`)

- Unwrap `{ value }` from tokens; resolve `{colors.x}` references to the target's variable or theme reference.
- `semanticTokens` `base` becomes the default value; `_dark` becomes the dark variant (CSS: `.dark` or `prefers-color-scheme` block; Tailwind: `dark:` variant; styled-components: dark theme object).
- Recipes and slot recipes become variant classes/props per slot. Report responsive `compoundVariants` as a warning (unsupported in Chakra itself).

### v2 sources (`chakra` input that uses v2 APIs)

Detect v2 patterns and migrate them while converting, never copy them through:

- `extendTheme` -> `createSystem(defaultConfig, defineConfig(...))`; `colorScheme` -> `colorPalette`; `sx`/`__css` -> `css`.
- `isOpen`/`isDisabled`/`isInvalid`/`isRequired`/`isLoading` -> `open`/`disabled`/`invalid`/`required`/`loading`; `spacing` -> `gap`.
- Anything else on the banned list: apply the replacement from `skills/chakra-ui-v3/SKILL.md` or flag for `v2_to_v3_code_review`.

Event handlers are component-specific: retain `onChange` for native inputs, use
`onCheckedChange(details)` and read `details.checked` for checkbox controls, and
use `onValueChange(details)` with the documented `details.value` field for
value-based controls. Verify the payload with the official `chakra-ui` MCP.

## Conversion Report

```
CONVERSION REPORT

Source:             tailwind
Target:             styled-components
Input File:         components/Button.tsx
Output File:        components/Button.styled.tsx
Conversion Time:    234ms

STATISTICS
Classes Processed:  45
Properties Mapped:  127
Variables:          12
Errors:             0
Warnings:           3

MAPPING SUMMARY
Colors:             32/32 mapped
Spacing:            18/18 mapped
Sizing:             15/15 mapped
Custom Utilities:   3 unmapped (see warnings)

WARNINGS
- Line 23: custom-gradient not in mapping table
- Line 45: animation-bounce needs manual review
- Line 67: blur-effect not supported in target

NEXT STEPS
1. Review the converted file: components/Button.styled.tsx
2. Manually handle unmapped utilities
3. Test in your application
4. Update custom mapping config if needed
```

## Configuration

Create `.claude/convert.config.json`:

```json
{
  "conversionRules": {
    "css-to-tailwind": {
      "preserveCustomProperties": true,
      "generateConfig": true,
      "strictMapping": false
    },
    "tailwind-to-styled": {
      "includeTheme": true,
      "generateTypeScript": true
    }
  },
  "customMappings": {
    "css-to-tailwind": {
      "box-shadow": [
        { "value": "0 2px 4px", "class": "shadow-sm" }
      ]
    }
  },
  "preserveComments": true,
  "optimizeOutput": true,
  "reportUnmapped": true
}
```

## Advanced Options

### Batch Conversion

```bash
# Convert all CSS files to Tailwind
/convert css tailwind styles/**/*.css

# Convert all styled-components to CSS
/convert styled css src/**/*.tsx
```

### Custom Mapping Rules

Load project-specific conversion rules from config file.

### Format Validation

Validate converted output against target format specifications.

### Performance Optimization

Optimize output:
- Remove duplicate declarations
- Minify where applicable
- Consolidate similar rules
- Suggest better compositions

