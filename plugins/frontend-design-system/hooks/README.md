# Frontend Design System Hooks

This directory contains hooks for maintaining design system consistency, accessibility, and theme management in the frontend design system plugin.

## Overview

These hooks run automatically during Claude Code operations to ensure design system best practices are followed. All hooks run in **advisory mode** by default, providing warnings and suggestions without blocking operations.

Claude Code passes the hook payload as JSON on stdin. The scripts read
`.tool_input.file_path` (with `.tool_input.path` as a fallback); a positional path
argument is also accepted for manual checks. `jq` is used when available, with a
Node.js JSON parser fallback so the hooks do not depend on regex extraction.

## Available Hooks

### 1. Style Consistency Checker

**File:** `scripts/check-style-consistency.sh`

**Trigger:** Before writing/editing CSS, SCSS, TSX, or JSX files

**Checks:**
- Hardcoded color values (should use CSS variables)
- Non-standard spacing values (should use 4px increments)
- Inline styles in React components
- Custom typography declarations (should use design tokens)

**Configuration:**
```bash
CHECK_COLOR_CONSISTENCY=true
CHECK_SPACING_CONSISTENCY=true
CHECK_TYPOGRAPHY_CONSISTENCY=true
```

### 2. Accessibility Validator

**File:** `scripts/validate-accessibility.sh`

**Trigger:** Before writing/editing TSX or JSX files

**Checks:**
- Images without alt text
- Icon-only buttons without aria-label
- Form inputs without associated labels
- Interactive divs without keyboard support
- Missing role attributes on custom elements
- Tables without proper header structure
- Basic color contrast issues

**Configuration:**
```bash
CHECK_ARIA_LABELS=true
CHECK_COLOR_CONTRAST=true
CONTRAST_RATIO_THRESHOLD=4.5
```

### 3. Theme Sync

**File:** `scripts/sync-themes.sh`

**Trigger:** After writing/editing theme or token files (*.ts, *.json, *.css)

**Actions:**
- Detects theme file modifications
- Lists tenant themes that may need updates
- Reminds to sync Keycloak theme files
- Provides helpful commands for theme building

**Configuration:**
```bash
TENANTS=thelobbi,brooksidebi
KEYCLOAK_THEME_DIR=./themes/keycloak
```

### 4. Design Token Updater

**File:** `scripts/update-tokens.sh`

**Trigger:** After editing design-tokens.json or design-tokens.ts

**Actions:**
- Detects which token categories changed (colors, spacing, typography, etc.)
- Lists files that may be affected by token changes
- Suggests regenerating CSS variables
- Provides migration guidance for breaking changes

## Configuration

### Environment Variables

Create a `.env` file in the hooks directory (use `.env.example` as template):

```bash
# Hook strictness: strict | advisory
HOOK_STRICTNESS=advisory

# Design style baseline
DESIGN_STYLE_BASELINE=minimalist

# Tenants for theme sync
TENANTS=thelobbi,brooksidebi

# Keycloak theme directory
KEYCLOAK_THEME_DIR=./themes/keycloak

# Color contrast ratio threshold (WCAG AA = 4.5:1 for normal text)
CONTRAST_RATIO_THRESHOLD=4.5

# Enable/disable specific checks
CHECK_COLOR_CONSISTENCY=true
CHECK_SPACING_CONSISTENCY=true
CHECK_TYPOGRAPHY_CONSISTENCY=true
CHECK_ACCESSIBILITY=true
CHECK_ARIA_LABELS=true
CHECK_COLOR_CONTRAST=true
```

### Strictness Modes

- **advisory** (default): Shows warnings but does not block operations
- **strict**: Fails the operation if any issues are detected

To enable strict mode:
```bash
export HOOK_STRICTNESS=strict
```

## Hook Configuration (hooks.json)

The `hooks.json` file defines when each hook runs:

```json
{
  "hooks": [
    {
      "name": "style-consistency-checker",
      "event": "PreToolUse",
      "toolPattern": "(Write|Edit)",
      "filePattern": "\\.(css|scss|tsx|jsx)$",
      "script": "scripts/check-style-consistency.sh"
    },
    ...
  ]
}
```

**Events:**
- `PreToolUse`: Runs before a tool is used (validation)
- `PostToolUse`: Runs after a tool is used (notifications, sync)

**Patterns:**
- `toolPattern`: Regex matching Claude Code tools (Write, Edit, etc.)
- `filePattern`: Regex matching file paths

## Design System Standards

### Color System

**Use CSS variables instead of hardcoded values:**

❌ Bad:
```css
.button {
  background-color: #3b82f6;
  color: #ffffff;
}
```

✅ Good:
```css
.button {
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
}
```

### Spacing Scale

**Use 4px increments:**

| Token | Value | Usage |
|-------|-------|-------|
| xs    | 4px   | Tight spacing |
| sm    | 8px   | Small gaps |
| md    | 16px  | Default spacing |
| lg    | 24px  | Section spacing |
| xl    | 32px  | Large gaps |
| 2xl   | 48px  | Major sections |
| 3xl   | 64px  | Page sections |

❌ Bad:
```css
.card {
  padding: 15px;
  margin: 10px;
}
```

✅ Good:
```css
.card {
  padding: var(--space-md); /* 16px */
  margin: var(--space-sm);  /* 8px */
}
```

### Typography

**Use design system text classes:**

❌ Bad:
```tsx
<h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>Title</h1>
```

✅ Good:
```tsx
<h1 className="text-heading-1">Title</h1>
```

### Accessibility

**Always provide accessible labels:**

❌ Bad:
```tsx
<button onClick={handleClick}>
  <IconTrash />
</button>
```

✅ Good:
```tsx
<button onClick={handleClick} aria-label="Delete item">
  <IconTrash />
</button>
```

## Integration with Workflows

### Theme Development Workflow

1. Edit design tokens: `design-tokens.ts`
2. **Hook:** Token updater reminds to regenerate CSS variables
3. Run: `npm run tokens:generate`
4. **Hook:** Theme sync suggests updating tenant themes
5. Build themes: `npm run build:themes`
6. Test in Storybook: `npm run storybook`

### Component Development Workflow

1. Create/edit component: `Button.tsx`
2. **Hook:** Style consistency checker validates CSS usage
3. **Hook:** Accessibility validator checks a11y
4. Fix any warnings
5. Test component
6. Document in Storybook

### Multi-Tenant Theming Workflow

1. Edit base theme: `src/themes/base-theme.ts`
2. **Hook:** Theme sync lists affected tenants
3. Update tenant overrides:
   - `src/themes/thelobbi-theme.ts`
   - `src/themes/brooksidebi-theme.ts`
4. Sync to Keycloak: `npm run sync:keycloak-themes`
5. Test each tenant theme

## Troubleshooting

### Hooks Not Running

Check if hooks are enabled in Claude Code:
```bash
# Verify hooks.json is valid
cat hooks/hooks.json | jq .

# Check hook scripts are executable
chmod +x hooks/scripts/*.sh
```

### False Positives

Adjust sensitivity in `.env`:
```bash
# Disable specific checks
CHECK_COLOR_CONSISTENCY=false
CHECK_SPACING_CONSISTENCY=false
```

### Custom Patterns

Edit hook scripts to add custom validation patterns for your design system.

## Resources

### Design System Documentation
- Internal design system docs
- Storybook component library
- Theme configuration guide

### Accessibility
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Tools
- `eslint-plugin-jsx-a11y` - Automated accessibility linting
- `stylelint` - CSS linting
- `chromatic` - Visual regression testing

## Contributing

To add a new hook:

1. Create script in `scripts/` directory
2. Add entry to `hooks.json`
3. Document in this README
4. Add configuration options to `.env.example`
5. Test with sample files

## Support

For issues or questions about these hooks:
- Check hook logs in Claude Code output
- Review `.env` configuration
- Consult design system team
