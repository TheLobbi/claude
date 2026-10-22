---
name: style
intent: Apply a specific design style from the bundled catalog or an extended 263+ style vault and generate implementation code
tags:
  - frontend-design-system
  - command
  - style
inputs: []
risk: medium
cost: medium
description: Apply a specific design style from the bundled catalog or an extended 263+ style vault and generate implementation code
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
---

# Style Application Command

Apply a specific design style and generate implementation code in your preferred format (CSS, Tailwind, styled-components, or Chakra UI v3).

## Usage

```bash
/style <style_name> [output_format]
```

## Arguments

- `style_name` (required): Name of the design style to apply (e.g., "Material Design", "Glassmorphism", "Neumorphism")
- `output_format` (optional): Output format - `css`, `tailwind`, `styled-components`, or `chakra` (default: `css`). `chakra` generates a Chakra UI v3 system via the `design-styles` MCP server (see "Chakra UI v3 Output").

## Examples

```bash
# Apply Material Design style with CSS output
/style "Material Design"

# Apply Glassmorphism style with Tailwind output
/style Glassmorphism tailwind

# Apply Neumorphism with styled-components
/style Neumorphism styled-components

# Apply Glassmorphism as a Chakra UI v3 system
/style Glassmorphism chakra
```

## Execution Flow

### 1. Style Lookup

```bash
# Search for the style in the design styles registry
# Location: frontend-design-system/skills/design-styles/
```

The command will:
1. Search the bundled 95-style catalog. Point `DESIGN_STYLES_PATH` at an exported JSON from the full 263+ design styles vault to extend the search set.
2. Extract style characteristics (colors, typography, spacing, effects)
3. Load associated prompt keywords and design tokens
4. Verify style exists or suggest closest matches

### 2. Style Analysis

Extract key design characteristics:
- **Color palette**: Primary, secondary, accent colors
- **Typography**: Font families, sizes, weights, line heights
- **Spacing**: Margins, paddings, gaps
- **Shadows**: Box shadows, text shadows
- **Border radius**: Corner styles
- **Effects**: Gradients, animations, transitions
- **Layout patterns**: Grid systems, flexbox patterns

### 3. Code Generation

Based on output format, generate implementation code:

#### CSS Output

```css
/* {style_name} Design System */

:root {
  /* Colors */
  --color-primary: #1976d2;
  --color-secondary: #dc004e;
  --color-background: #ffffff;
  --color-surface: #f5f5f5;
  --color-text-primary: rgba(0, 0, 0, 0.87);
  --color-text-secondary: rgba(0, 0, 0, 0.60);

  /* Typography */
  --font-family-primary: 'Roboto', sans-serif;
  --font-size-base: 1rem;
  --font-size-h1: 2.5rem;
  --font-size-h2: 2rem;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-bold: 700;
  --line-height-base: 1.5;

  /* Spacing */
  --spacing-unit: 8px;
  --spacing-xs: calc(var(--spacing-unit) * 0.5);
  --spacing-sm: var(--spacing-unit);
  --spacing-md: calc(var(--spacing-unit) * 2);
  --spacing-lg: calc(var(--spacing-unit) * 3);
  --spacing-xl: calc(var(--spacing-unit) * 4);

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.12);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.16);
  --shadow-lg: 0 10px 20px rgba(0, 0, 0, 0.19);

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;

  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Base styles */
body {
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
  color: var(--color-text-primary);
  background-color: var(--color-background);
}

/* Utility classes */
.shadow-sm { box-shadow: var(--shadow-sm); }
.shadow-md { box-shadow: var(--shadow-md); }
.shadow-lg { box-shadow: var(--shadow-lg); }
.rounded-sm { border-radius: var(--radius-sm); }
.rounded-md { border-radius: var(--radius-md); }
.rounded-lg { border-radius: var(--radius-lg); }
```

#### Tailwind Output

```javascript
// tailwind.config.js extension for {style_name}
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e3f2fd',
          100: '#bbdefb',
          200: '#90caf9',
          300: '#64b5f6',
          400: '#42a5f5',
          500: '#1976d2',
          600: '#1565c0',
          700: '#0d47a1',
          800: '#0a3d91',
          900: '#062e6f',
        },
        secondary: {
          500: '#dc004e',
        },
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
      },
      fontSize: {
        'base': '1rem',
        'h1': '2.5rem',
        'h2': '2rem',
      },
      spacing: {
        'unit': '8px',
      },
      boxShadow: {
        'sm': '0 1px 3px rgba(0, 0, 0, 0.12)',
        'md': '0 4px 6px rgba(0, 0, 0, 0.16)',
        'lg': '0 10px 20px rgba(0, 0, 0, 0.19)',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '16px',
      },
      transitionDuration: {
        'fast': '150ms',
        'base': '250ms',
        'slow': '350ms',
      },
      transitionTimingFunction: {
        'material': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
};
```

#### Styled-Components Output

```typescript
// theme.ts - {style_name} styled-components theme
import { DefaultTheme } from 'styled-components';

export const theme: DefaultTheme = {
  colors: {
    primary: '#1976d2',
    secondary: '#dc004e',
    background: '#ffffff',
    surface: '#f5f5f5',
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.60)',
    },
  },
  typography: {
    fontFamily: {
      primary: "'Roboto', sans-serif",
    },
    fontSize: {
      base: '1rem',
      h1: '2.5rem',
      h2: '2rem',
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      bold: 700,
    },
    lineHeight: {
      base: 1.5,
    },
  },
  spacing: {
    unit: 8,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.12)',
    md: '0 4px 6px rgba(0, 0, 0, 0.16)',
    lg: '0 10px 20px rgba(0, 0, 0, 0.19)',
  },
  radii: {
    sm: '4px',
    md: '8px',
    lg: '16px',
  },
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// Type definitions
declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      primary: string;
      secondary: string;
      background: string;
      surface: string;
      text: {
        primary: string;
        secondary: string;
      };
    };
    typography: {
      fontFamily: { primary: string };
      fontSize: { base: string; h1: string; h2: string };
      fontWeight: { regular: number; medium: number; bold: number };
      lineHeight: { base: number };
    };
    spacing: { unit: number; xs: number; sm: number; md: number; lg: number; xl: number };
    shadows: { sm: string; md: string; lg: string };
    radii: { sm: string; md: string; lg: string };
    transitions: { fast: string; base: string; slow: string };
  }
}
```

### 4. Prompt Keywords Injection

Include style-specific prompt keywords for AI-assisted design:

```json
{
  "style": "{style_name}",
  "keywords": [
    "elevation",
    "material depth",
    "responsive typography",
    "8px grid system",
    "bold colors",
    "ripple effects"
  ],
  "prompts": {
    "button": "Create a Material Design button with elevation on hover, ripple effect on click, using primary color with bold font",
    "card": "Design a Material card with subtle shadow, 8dp elevation, rounded corners, and clear content hierarchy",
    "form": "Build a Material form with floating labels, underline inputs, and validation states"
  }
}
```

### 5. Component Examples

Generate example components using the style:

```typescript
// Button component example
import styled from 'styled-components';

export const Button = styled.button`
  background-color: ${props => props.theme.colors.primary};
  color: white;
  padding: ${props => props.theme.spacing.sm}px ${props => props.theme.spacing.md}px;
  border: none;
  border-radius: ${props => props.theme.radii.sm};
  font-family: ${props => props.theme.typography.fontFamily.primary};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  font-size: ${props => props.theme.typography.fontSize.base};
  box-shadow: ${props => props.theme.shadows.sm};
  transition: all ${props => props.theme.transitions.base};
  cursor: pointer;

  &:hover {
    box-shadow: ${props => props.theme.shadows.md};
    transform: translateY(-1px);
  }

  &:active {
    box-shadow: ${props => props.theme.shadows.sm};
    transform: translateY(0);
  }
`;
```

## Chakra UI v3 Output

Used when `output_format` is `chakra`. Source of truth: `skills/chakra-ui-v3/SKILL.md`. Never emit a pattern from its "v2 → v3 banned list".

Use the `design-styles` MCP server (this plugin's `mcp-server/`):

| Tool | Use |
|------|-----|
| `search_styles` | Find a style when the name is missing or ambiguous |
| `get_style` | Load a style's characteristics |
| `generate_chakra_system` | Generate the Chakra v3 system for the style. Inputs: `style`; optional `brandColor` (hex) and `paletteName` (default `brand`) |
| `check_contrast` | Validate foreground/background semantic pairs (WCAG AA, light and dark) |

Flow:
1. Resolve the style (`search_styles`, `get_style`).
2. Call `generate_chakra_system` with the style name, passing `brandColor` only when the user supplied one.
3. Write the result as `styles/{style_name}/theme.ts` (`createSystem(defaultConfig, defineConfig(...))`). It covers raw tokens, semantic tokens (`base`/`_dark`, including the `colorPalette` contract), and `globalCss`.
4. Per-component recipes/slot recipes are not generated; hand-author them from the style (see `/component <type> {style_name} --target chakra`).
5. Run `check_contrast` on the semantic pairs, then `npx @chakra-ui/cli typegen styles/{style_name}/theme.ts`.

Integration: provide the system with `<ChakraProvider value={system}>` (the generated `Provider` from `npx @chakra-ui/cli snippet add` wraps it with `next-themes`). For built-in component props, use the official `chakra-ui` MCP server (`get_component_props`, `get_component_example`).

## Output Structure

The command creates the following files:

```
styles/
├── {style_name}/
│   ├── tokens.{format}           # Design tokens
│   ├── components.{format}       # Component examples
│   ├── utilities.{format}        # Utility classes
│   ├── keywords.json             # Prompt keywords
│   └── README.md                 # Style guide documentation
```

## Validation

After generation:
1. Validate CSS syntax (if CSS format)
2. Check for accessible color contrast ratios
3. Verify responsive design token values
4. Confirm all required tokens are present
5. Test component examples compile correctly

## Integration

Provide instructions for integrating the generated style:

```markdown
# {style_name} Style Integration

## Installation

1. Copy the generated files to your project:
   - CSS: `cp styles/{style_name}/tokens.css src/styles/`
   - Tailwind: Merge `tokens.js` into `tailwind.config.js`
   - Styled-components: Import theme in `App.tsx`

2. Import in your application:

### CSS
```css
@import './styles/tokens.css';
```

### Tailwind
```javascript
// tailwind.config.js
const styleTokens = require('./styles/{style_name}/tokens.js');
module.exports = styleTokens;
```

### Styled-components
```typescript
import { ThemeProvider } from 'styled-components';
import { theme } from './styles/{style_name}/theme';

<ThemeProvider theme={theme}>
  <App />
</ThemeProvider>
```

## Usage Examples

See `components.{format}` for ready-to-use component examples.
```

## Error Handling

- If style not found: Display list of similar styles
- If invalid output format: Default to CSS and show warning
- If `chakra` is requested and the `design-styles` MCP server is unavailable: say so and fall back to `/tokens all {style_name} --format chakra`
- If generation fails: Provide fallback with basic tokens

## Next Steps

After applying a style, suggest:
- `/palette {style_name}` - Generate full color palette
- `/component button {style_name}` - Create styled components
- `/tokens all {style_name}` - Export all design tokens
- `/audit` - Verify style consistency across project
