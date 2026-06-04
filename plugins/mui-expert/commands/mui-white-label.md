---
name: /mui-white-label
intent: Generate multi-tenant white-label theme architecture
tags:
  - mui-expert
  - white-label
  - multi-tenant
  - theming
inputs:
  - '--tenants'
  - '--base-colors'
  - '--features'
  - '--source'
risk: low
cost: high
description: |
  Generate a complete multi-tenant white-label theming architecture with tenant-specific branding, component variant overrides, dynamic theme loading, and CSS variables support.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# /mui-white-label

Generate multi-tenant white-label theme architecture for MUI.

## Operating Protocol

### Phase 1 — Architecture Design

Based on `--source`:
- **static**: Tenant configs as TypeScript objects, selected at build time or route
- **api**: Tenant config fetched from API, loaded at runtime
- **env**: Tenant selected from environment variable, config from static map

### Phase 2 — Generate Base Theme

Create shared base theme that all tenants inherit:

```typescript
// theme/base-theme.ts
const baseTheme = {
  typography: { fontFamily: 'Inter, sans-serif', button: { textTransform: 'none' } },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiCard: { defaultProps: { elevation: 0 }, styleOverrides: { root: { border: '1px solid', borderColor: 'divider' } } },
  },
};
```

### Phase 3 — Generate Tenant Configs

For each tenant in `--tenants`:

```typescript
// theme/tenants/acme.ts
export const acmeConfig: TenantThemeConfig = {
  id: 'acme',
  name: 'Acme Corp',
  palette: {
    primary: { main: '#2563eb' },
    secondary: { main: '#7c3aed' },
  },
  typography: { fontFamily: '"Poppins", sans-serif' },
  logo: { light: '/logos/acme-light.svg', dark: '/logos/acme-dark.svg' },
  favicon: '/favicons/acme.ico',
  componentOverrides: {
    MuiButton: { variants: [{ props: { variant: 'brand' }, style: { ... } }] },
  },
};
```

### Phase 4 — Generate Theme Factory

```typescript
// theme/tenant-factory.ts
export function createTenantTheme(config: TenantThemeConfig): Theme {
  return extendTheme(deepmerge(baseTheme, {
    colorSchemes: {
      light: { palette: config.palette },
      dark: { palette: generateDarkPalette(config.palette) },
    },
    typography: config.typography,
    components: config.componentOverrides,
  }));
}
```

### Phase 5 — Generate Provider

```typescript
// theme/TenantThemeProvider.tsx
export function TenantThemeProvider({ tenantId, children }) {
  const theme = useMemo(() => {
    const config = getTenantConfig(tenantId);
    return createTenantTheme(config);
  }, [tenantId]);

  return (
    <CssVarsProvider theme={theme}>
      <CssBaseline />
      {children}
    </CssVarsProvider>
  );
}
```

For `--source api`: generate async loading with suspense/loading state.

### Phase 6 — Generate TypeScript Types

```typescript
interface TenantThemeConfig {
  id: string;
  name: string;
  palette: { primary: SimplePaletteColorOptions; secondary: SimplePaletteColorOptions; };
  typography?: { fontFamily?: string; };
  logo?: { light: string; dark: string; };
  favicon?: string;
  componentOverrides?: Components<Omit<Theme, 'components'>>;
}
```

### Phase 7 — Feature Implementation

For each feature in `--features`:
- **dark-mode**: Dual colorSchemes per tenant, toggle component
- **css-vars**: CssVarsProvider, getInitColorSchemeScript per tenant
- **font-loading**: next/font or @fontsource integration per tenant
- **logo-swap**: TenantLogo component that reads logo from config
- **component-variants**: Per-tenant custom Button/Card/Chip variants

## Output Contract

```
White-label architecture generated:
  Base theme: theme/base-theme.ts
  Tenant factory: theme/tenant-factory.ts
  Tenant configs: X tenants
  Provider: theme/TenantThemeProvider.tsx
  TypeScript types: theme/tenant-types.ts
  Features: [list]
```
