---
name: tokens
intent: Generate design tokens from a selected design style
tags:
  - frontend-design-system
  - command
  - tokens
inputs: []
risk: medium
cost: medium
description: Generate design tokens from a selected design style
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
---

# Design Tokens Generation Command

Extract and generate design tokens from design styles in multiple formats (CSS variables, JSON, Tailwind config, TypeScript, Chakra UI v3).

## Usage

```bash
/tokens <category> [style] [--format css|ts|tailwind|json|chakra]
```

## Arguments

- `category` (required): Token category - `colors`, `spacing`, `typography`, `shadows`, `all`
- `style` (optional): Design style name to extract tokens from (defaults to active theme)
- `--format` (optional): Output format. Omit to emit the default set; `chakra` emits a Chakra UI v3 system (Format 5 below).

## Examples

```bash
# Generate all tokens from Material Design
/tokens all "Material Design"

# Generate only color tokens
/tokens colors

# Generate spacing tokens from Tailwind
/tokens spacing Tailwind

# Generate typography tokens
/tokens typography "Modern Minimalist"

# Generate shadow tokens from Neumorphism
/tokens shadows Neumorphism

# Generate a Chakra UI v3 system from a style
/tokens all "Material Design" --format chakra
```

## Execution Flow

### 1. Load Design Style

```bash
# Search for the design style in the registry
# Location: frontend-design-system/skills/design-styles/
```

Extract style metadata and characteristics.

### 2. Token Extraction by Category

#### Colors

```json
{
  "colors": {
    "primary": {
      "50": "#E3F2FD",
      "100": "#BBDEFB",
      "200": "#90CAF9",
      "300": "#64B5F6",
      "400": "#42A5F5",
      "500": "#2196F3",
      "600": "#1E88E5",
      "700": "#1976D2",
      "800": "#1565C0",
      "900": "#0D47A1"
    },
    "secondary": {
      "500": "#FF4081",
      "600": "#F50057",
      "700": "#C51162"
    },
    "success": {
      "500": "#4CAF50",
      "600": "#43A047",
      "700": "#388E3C"
    },
    "warning": {
      "500": "#FF9800",
      "600": "#FB8C00",
      "700": "#F57C00"
    },
    "error": {
      "500": "#F44336",
      "600": "#E53935",
      "700": "#D32F2F"
    },
    "neutral": {
      "50": "#FAFAFA",
      "100": "#F5F5F5",
      "200": "#EEEEEE",
      "300": "#E0E0E0",
      "400": "#BDBDBD",
      "500": "#9E9E9E",
      "600": "#757575",
      "700": "#616161",
      "800": "#424242",
      "900": "#212121"
    },
    "semantic": {
      "background": {
        "default": "#FFFFFF",
        "paper": "#FAFAFA",
        "elevated": "#FFFFFF"
      },
      "text": {
        "primary": "rgba(0, 0, 0, 0.87)",
        "secondary": "rgba(0, 0, 0, 0.60)",
        "disabled": "rgba(0, 0, 0, 0.38)"
      },
      "divider": "rgba(0, 0, 0, 0.12)",
      "border": {
        "default": "#E0E0E0",
        "light": "#F5F5F5"
      }
    }
  }
}
```

#### Spacing

```json
{
  "spacing": {
    "base": 8,
    "scale": {
      "0": "0",
      "0.5": "4px",
      "1": "8px",
      "1.5": "12px",
      "2": "16px",
      "2.5": "20px",
      "3": "24px",
      "4": "32px",
      "5": "40px",
      "6": "48px",
      "7": "56px",
      "8": "64px",
      "9": "72px",
      "10": "80px",
      "12": "96px",
      "16": "128px",
      "20": "160px",
      "24": "192px"
    },
    "semantic": {
      "page": {
        "padding": "24px",
        "maxWidth": "1200px"
      },
      "section": {
        "padding": "48px",
        "gap": "32px"
      },
      "component": {
        "padding": "16px",
        "gap": "8px"
      },
      "element": {
        "padding": "8px",
        "gap": "4px"
      }
    }
  }
}
```

#### Typography

```json
{
  "typography": {
    "fontFamily": {
      "base": "'Roboto', 'Helvetica', 'Arial', sans-serif",
      "headings": "'Roboto', 'Helvetica', 'Arial', sans-serif",
      "monospace": "'Roboto Mono', 'Courier New', monospace"
    },
    "fontSize": {
      "xs": "0.75rem",
      "sm": "0.875rem",
      "base": "1rem",
      "lg": "1.125rem",
      "xl": "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "5xl": "3rem",
      "6xl": "3.75rem"
    },
    "fontWeight": {
      "light": 300,
      "regular": 400,
      "medium": 500,
      "semibold": 600,
      "bold": 700
    },
    "lineHeight": {
      "none": 1,
      "tight": 1.25,
      "snug": 1.375,
      "normal": 1.5,
      "relaxed": 1.625,
      "loose": 2
    },
    "letterSpacing": {
      "tighter": "-0.05em",
      "tight": "-0.025em",
      "normal": "0",
      "wide": "0.025em",
      "wider": "0.05em",
      "widest": "0.1em"
    },
    "textTransform": {
      "uppercase": "uppercase",
      "lowercase": "lowercase",
      "capitalize": "capitalize"
    }
  }
}
```

#### Shadows

```json
{
  "shadows": {
    "none": "none",
    "sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    "base": "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    "md": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    "lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    "xl": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "inner": "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
    "elevation": {
      "0": "none",
      "1": "0 2px 1px -1px rgba(0,0,0,0.2), 0 1px 1px 0 rgba(0,0,0,0.14), 0 1px 3px 0 rgba(0,0,0,0.12)",
      "2": "0 3px 1px -2px rgba(0,0,0,0.2), 0 2px 2px 0 rgba(0,0,0,0.14), 0 1px 5px 0 rgba(0,0,0,0.12)",
      "4": "0 2px 4px -1px rgba(0,0,0,0.2), 0 4px 5px 0 rgba(0,0,0,0.14), 0 1px 10px 0 rgba(0,0,0,0.12)",
      "8": "0 5px 5px -3px rgba(0,0,0,0.2), 0 8px 10px 1px rgba(0,0,0,0.14), 0 3px 14px 2px rgba(0,0,0,0.12)",
      "16": "0 8px 10px -5px rgba(0,0,0,0.2), 0 16px 24px 2px rgba(0,0,0,0.14), 0 6px 30px 5px rgba(0,0,0,0.12)",
      "24": "0 11px 15px -7px rgba(0,0,0,0.2), 0 24px 38px 3px rgba(0,0,0,0.14), 0 9px 46px 8px rgba(0,0,0,0.12)"
    }
  }
}
```

### 3. Output Formats

#### Format 1: CSS Variables

```css
/* Design Tokens - Generated from {style} */

:root {
  /* === COLORS === */

  /* Primary */
  --color-primary-50: #E3F2FD;
  --color-primary-100: #BBDEFB;
  --color-primary-200: #90CAF9;
  --color-primary-300: #64B5F6;
  --color-primary-400: #42A5F5;
  --color-primary-500: #2196F3;
  --color-primary-600: #1E88E5;
  --color-primary-700: #1976D2;
  --color-primary-800: #1565C0;
  --color-primary-900: #0D47A1;

  /* Secondary */
  --color-secondary-500: #FF4081;
  --color-secondary-600: #F50057;
  --color-secondary-700: #C51162;

  /* Semantic Colors */
  --color-bg-default: #FFFFFF;
  --color-bg-paper: #FAFAFA;
  --color-text-primary: rgba(0, 0, 0, 0.87);
  --color-text-secondary: rgba(0, 0, 0, 0.60);
  --color-border-default: #E0E0E0;

  /* === SPACING === */
  --spacing-0: 0;
  --spacing-1: 8px;
  --spacing-2: 16px;
  --spacing-3: 24px;
  --spacing-4: 32px;
  --spacing-5: 40px;
  --spacing-6: 48px;
  --spacing-8: 64px;
  --spacing-10: 80px;

  /* === TYPOGRAPHY === */
  --font-family-base: 'Roboto', 'Helvetica', 'Arial', sans-serif;
  --font-family-headings: 'Roboto', 'Helvetica', 'Arial', sans-serif;
  --font-family-mono: 'Roboto Mono', 'Courier New', monospace;

  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;

  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.625;

  /* === SHADOWS === */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

  /* Material Elevation */
  --elevation-1: 0 2px 1px -1px rgba(0,0,0,0.2), 0 1px 1px 0 rgba(0,0,0,0.14), 0 1px 3px 0 rgba(0,0,0,0.12);
  --elevation-2: 0 3px 1px -2px rgba(0,0,0,0.2), 0 2px 2px 0 rgba(0,0,0,0.14), 0 1px 5px 0 rgba(0,0,0,0.12);
  --elevation-4: 0 2px 4px -1px rgba(0,0,0,0.2), 0 4px 5px 0 rgba(0,0,0,0.14), 0 1px 10px 0 rgba(0,0,0,0.12);

  /* === BORDER RADIUS === */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --radius-full: 9999px;

  /* === TRANSITIONS === */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);

  /* === Z-INDEX === */
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
}
```

#### Format 2: TypeScript Tokens

```typescript
// tokens.ts - Generated from {style}

export const tokens = {
  colors: {
    primary: {
      50: '#E3F2FD',
      100: '#BBDEFB',
      200: '#90CAF9',
      300: '#64B5F6',
      400: '#42A5F5',
      500: '#2196F3',
      600: '#1E88E5',
      700: '#1976D2',
      800: '#1565C0',
      900: '#0D47A1',
    },
    // ... other colors
  },
  spacing: {
    0: '0',
    1: '8px',
    2: '16px',
    3: '24px',
    4: '32px',
    5: '40px',
    6: '48px',
    8: '64px',
    10: '80px',
  },
  typography: {
    fontFamily: {
      base: "'Roboto', 'Helvetica', 'Arial', sans-serif",
      headings: "'Roboto', 'Helvetica', 'Arial', sans-serif",
      mono: "'Roboto Mono', 'Courier New', monospace",
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.625,
    },
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  radii: {
    sm: '4px',
    md: '8px',
    lg: '16px',
    full: '9999px',
  },
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
} as const;

export type Tokens = typeof tokens;
```

#### Format 3: Tailwind Config

```javascript
// tailwind.config.tokens.js - Generated from {style}

module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E3F2FD',
          100: '#BBDEFB',
          200: '#90CAF9',
          300: '#64B5F6',
          400: '#42A5F5',
          500: '#2196F3',
          600: '#1E88E5',
          700: '#1976D2',
          800: '#1565C0',
          900: '#0D47A1',
        },
        // ... other colors
      },
      spacing: {
        '0': '0',
        '1': '8px',
        '2': '16px',
        '3': '24px',
        '4': '32px',
        '5': '40px',
        '6': '48px',
        '8': '64px',
        '10': '80px',
      },
      fontFamily: {
        sans: ["'Roboto'", "'Helvetica'", "'Arial'", 'sans-serif'],
        mono: ["'Roboto Mono'", "'Courier New'", 'monospace'],
      },
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
      },
      fontWeight: {
        regular: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
      lineHeight: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.625',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '16px',
        'full': '9999px',
      },
      transitionDuration: {
        'fast': '150ms',
        'base': '250ms',
        'slow': '350ms',
      },
      transitionTimingFunction: {
        'material': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      zIndex: {
        'dropdown': 1000,
        'sticky': 1020,
        'fixed': 1030,
        'modal-backdrop': 1040,
        'modal': 1050,
        'popover': 1060,
        'tooltip': 1070,
      },
    },
  },
};
```

#### Format 4: JSON

```json
{
  "tokens": {
    "colors": { "...": "..." },
    "spacing": { "...": "..." },
    "typography": { "...": "..." },
    "shadows": { "...": "..." },
    "radii": { "...": "..." },
    "transitions": { "...": "..." },
    "zIndex": { "...": "..." }
  },
  "metadata": {
    "style": "{style}",
    "version": "1.0.0",
    "generated": "2025-01-15T10:30:00Z",
    "categories": ["colors", "spacing", "typography", "shadows"]
  }
}
```

#### Format 5: Chakra UI v3

Source of truth: `skills/chakra-ui-v3/SKILL.md`. Never emit `extendTheme` or other v2 patterns.

Rules:
- Every raw token value is wrapped: `{ value: ... }`.
- Raw palette goes in `theme.tokens`; light/dark meaning goes in `theme.semanticTokens` as `{ base, _dark }`.
- Reference other tokens with `{colors.x}`.
- A custom color used with `colorPalette` defines `50`-`950` raw tokens plus the semantic keys `solid`, `contrast`, `fg`, `muted`, `subtle`, `emphasized`, `focusRing`.
- Export `system = createSystem(defaultConfig, config)`, then run `npx @chakra-ui/cli typegen tokens/theme.ts`.

```typescript
// tokens/theme.ts
import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: '#eff6ff' }, // literal values extracted from the style
          // ... 100-900
          950: { value: '#172554' },
        },
      },
    },
    semanticTokens: {
      colors: {
        brand: {
          solid:      { value: { base: '{colors.brand.500}', _dark: '{colors.brand.400}' } },
          contrast:   { value: { base: '{colors.brand.50}',  _dark: '{colors.brand.950}' } },
          fg:         { value: { base: '{colors.brand.700}', _dark: '{colors.brand.200}' } },
          muted:      { value: { base: '{colors.brand.100}', _dark: '{colors.brand.900}' } },
          subtle:     { value: { base: '{colors.brand.200}', _dark: '{colors.brand.800}' } },
          emphasized: { value: { base: '{colors.brand.300}', _dark: '{colors.brand.700}' } },
          focusRing:  { value: { base: '{colors.brand.500}', _dark: '{colors.brand.400}' } },
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
```

The hex values and the light/dark step choices above are illustrative; use the extracted style values and verify contrast. For spacing, typography, shadows, and radii, emit the matching `theme.tokens.<category>` groups with `{ value }` wrapping. Validate semantic pairs with `check_contrast` (`design-styles` MCP server) in light and dark. For a full system generated from a named style, use `generate_chakra_system`.

### 4. Token Documentation

Generate markdown documentation for tokens:

```markdown
# Design Tokens - {style}

Generated: {timestamp}

## Colors

### Primary
Primary brand color used for main actions and emphasis.

| Shade | Hex | Usage |
|-------|-----|-------|
| 50 | #E3F2FD | Very light backgrounds |
| 500 | #2196F3 | Primary buttons, links |
| 900 | #0D47A1 | Dark text on light backgrounds |

### Semantic Colors
| Token | Value | Usage |
|-------|-------|-------|
| background.default | #FFFFFF | Main page background |
| text.primary | rgba(0,0,0,0.87) | Primary text color |
| border.default | #E0E0E0 | Default border color |

## Spacing

Based on 8px grid system.

| Token | Value | Usage |
|-------|-------|-------|
| spacing-1 | 8px | Small gaps between elements |
| spacing-2 | 16px | Standard component padding |
| spacing-3 | 24px | Section spacing |
| spacing-4 | 32px | Large section spacing |

## Typography

### Font Families
- **Base**: Roboto, Helvetica, Arial, sans-serif
- **Headings**: Roboto, Helvetica, Arial, sans-serif
- **Monospace**: Roboto Mono, Courier New, monospace

### Font Sizes
| Size | Value | Usage |
|------|-------|-------|
| xs | 0.75rem | Caption text |
| base | 1rem | Body text |
| 2xl | 1.5rem | Section headings |

## Shadows

Material Design elevation system.

| Level | CSS Value | Usage |
|-------|-----------|-------|
| elevation-1 | ... | Raised buttons |
| elevation-4 | ... | Cards |
| elevation-8 | ... | Dialogs |
```

## Integration

### Import Tokens

```typescript
// Import TypeScript tokens
import { tokens } from '@/design-tokens/tokens';

// Use in components
const Button = styled.button`
  background-color: ${tokens.colors.primary[500]};
  padding: ${tokens.spacing[2]} ${tokens.spacing[3]};
  font-family: ${tokens.typography.fontFamily.base};
  box-shadow: ${tokens.shadows.md};
`;
```

```css
/* Import CSS variables */
@import '@/design-tokens/variables.css';

/* Use in CSS */
.button {
  background-color: var(--color-primary-500);
  padding: var(--spacing-2) var(--spacing-3);
  font-family: var(--font-family-base);
  box-shadow: var(--shadow-md);
}
```

## Validation

After token generation:

1. **Validate JSON structure**
2. **Check color contrast ratios** (WCAG compliance)
3. **Verify spacing scale consistency**
4. **Ensure all categories are complete**
5. **Test token imports in sample component**

## Output

```
✅ Design Tokens Generated

Style: {style}
Category: {category}

Files created:
- tokens/variables.css (CSS variables)
- tokens/tokens.ts (TypeScript)
- tokens/tokens.json (JSON)
- tokens/tailwind.config.tokens.js (Tailwind)
- tokens/theme.ts (Chakra UI v3, with --format chakra)
- tokens/README.md (Documentation)

Token count:
- Colors: 45
- Spacing: 12
- Typography: 24
- Shadows: 8

Next steps:
1. Import tokens in your application
2. Replace hardcoded values with token references
3. Run: /audit to verify consistency
```
