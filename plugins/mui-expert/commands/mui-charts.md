---
name: /mui-charts
intent: Scaffold or configure MUI X Charts
tags:
  - mui-expert
  - charts
  - data-visualization
  - MUI-X
inputs:
  - '--type'
  - '--mode'
  - '--data-source'
  - '--features'
  - '--theme-aware'
risk: low
cost: medium
description: |
  Scaffold MUI X Charts with typed data, responsive layout, custom tooltips, click handlers, theme integration, and composition API patterns.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# /mui-charts

Build MUI X Charts with full TypeScript types and theme integration.

## Operating Protocol

### Phase 1 — Detect Environment

1. Check if `@mui/x-charts` is installed in package.json
2. If not: instruct to install `@mui/x-charts`
3. Detect MUI version and theme configuration
4. Check for existing chart components

### Phase 2 — Data Shape Analysis

Parse `--data-source` to infer TypeScript interfaces:

```typescript
// For "monthly revenue with category breakdown":
interface RevenueData {
  month: string;
  revenue: number;
  category: string;
}
```

### Phase 3 — Chart Generation

**Scaffold Mode** — Generate a complete chart component:

For each `--type`:

| Type | Component | Key Props |
|------|-----------|-----------|
| `bar` | BarChart | series, xAxis (band), horizontal option |
| `line` | LineChart | series, xAxis (time/band), area fill, curve type |
| `pie` | PieChart | series with data/innerRadius/outerRadius, labels |
| `scatter` | ScatterChart | series with x/y data arrays |
| `composed` | ChartsContainer + BarPlot + LinePlot | Composition API |
| `sparkline` | SparkLineChart | Inline mini chart, area/line/bar |
| `gauge` | GaugeContainer | KPI display with value/min/max |

**Composition Mode** (`--mode composition`):
Build from primitives using the Composition API:
```tsx
<ChartsContainer series={...} xAxis={[...]} yAxis={[...]}>
  <BarPlot />
  <LinePlot />
  <ChartsXAxis position="bottom" />
  <ChartsYAxis position="left" />
  <ChartsTooltip trigger="axis" />
  <ChartsAxisHighlight x="band" />
  <ChartsLegend position={{ vertical: 'top', horizontal: 'right' }} />
</ChartsContainer>
```

### Phase 4 — Feature Implementation

For each feature in `--features`:

- **stacked**: Add `stack: 'group1'` to series, show stacked bar/area
- **animation**: Configure duration, easing via slotProps
- **click-handler**: Add `onItemClick`, `onAxisClick` with typed handlers
- **custom-tooltip**: Generate custom tooltip component using slots.tooltip
- **responsive**: Wrap in responsive container, configure margins
- **dual-axis**: Add second yAxis with independent scale, map series to axes
- **legend**: Configure legend position, direction, custom rendering

### Phase 5 — Theme Integration

When `--theme-aware`:
- Use `theme.palette` colors for series
- Support dark mode (auto-adjust grid lines, text, background)
- Use theme typography for labels
- Generate color palette from theme primary/secondary

### Phase 6 — Output

Write component file with:
- TypeScript interfaces for data shapes
- Typed series configuration
- Responsive container wrapper
- Theme-aware color scheme
- Inline comments explaining customization points

## Output Contract

```
Chart created: src/components/[Name]Chart.tsx
Type: [bar|line|pie|scatter|composed|sparkline|gauge]
Features: [list]
Theme integration: yes/no
TypeScript: fully typed series and data
```
