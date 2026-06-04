---
name: /mui-creative
intent: Build highly creative, fluid MUI widgets with animations, micro-interactions, and unique visual patterns
tags:
  - mui-expert
  - creative
  - widgets
  - animation
  - micro-interaction
  - unique
inputs:
  - '--widget'
  - '--style'
  - '--with-motion'
risk: low
cost: high
description: |
  Build highly creative, fluid MUI widgets that go far beyond standard Material Design. Sparkline-in-grid cells, heatmap DataGrids, real-time WebSocket grids, AI assistant panels, animated wizards, hardware-style switches, interactive tree browsers, bi-directional chart+grid sync, and more.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
  - Agent
---

# /mui-creative

Build world-class MUI widgets with fluid animations and unique visual patterns.

## Widget Catalog

### 1. Sparkline Grid Cells (`sparkline-grid`)

Render inline MUI X SparkLineChart inside DataGrid cells — every row becomes a mini dashboard.

```tsx
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

const columns: GridColDef[] = [
  { field: 'name', headerName: 'Contractor', width: 200 },
  { field: 'utilization', headerName: 'Utilization', width: 100,
    renderCell: (params) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" fontWeight={600}>{params.value}%</Typography>
        <LinearProgress
          variant="determinate"
          value={params.value}
          sx={{ flex: 1, height: 6, borderRadius: 3,
            '& .MuiLinearProgress-bar': {
              bgcolor: params.value > 80 ? 'error.main' : params.value > 60 ? 'warning.main' : 'success.main',
            },
          }}
        />
      </Box>
    ),
  },
  {
    field: 'weeklyTrend',
    headerName: '12-Week Trend',
    width: 180,
    sortable: false,
    filterable: false,
    renderCell: (params) => {
      const data = params.value as number[];
      const isUp = data[data.length - 1] > data[0];
      return (
        <SparkLineChart
          data={data}
          width={160}
          height={48}
          plotType="line"
          curve="natural"
          showTooltip
          showHighlight
          colors={[isUp ? '#16a34a' : '#dc2626']}
          area
          sx={{ opacity: 0.9 }}
        />
      );
    },
  },
  {
    field: 'weeklyHours',
    headerName: 'Weekly Hours',
    width: 160,
    renderCell: (params) => (
      <SparkLineChart
        data={params.value}
        width={140}
        height={40}
        plotType="bar"
        colors={['#60a5fa']}
        showTooltip
      />
    ),
  },
];
```

### 2. Heatmap Color Cells (`heatmap-grid`)

Continuous color scaling turns the grid into a visual heatmap.

```tsx
function heatmapColor(value: number, min: number, max: number): string {
  const pct = (value - min) / (max - min);
  // Cool (blue) → Warm (red) gradient
  const r = Math.round(255 * pct);
  const g = Math.round(100 * (1 - Math.abs(pct - 0.5) * 2));
  const b = Math.round(255 * (1 - pct));
  return `rgb(${r},${g},${b})`;
}

const utilizationColumn: GridColDef = {
  field: 'utilization',
  headerName: 'Util %',
  width: 100,
  renderCell: (params) => {
    const bg = heatmapColor(params.value, 0, 100);
    const textColor = params.value > 50 ? '#fff' : '#000';
    return (
      <Box
        sx={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          bgcolor: bg, color: textColor,
          fontWeight: 600, fontSize: '0.875rem',
          transition: 'background-color 300ms ease',
        }}
      >
        {params.value}%
      </Box>
    );
  },
};
```

### 3. Real-Time Live Data Grid (`live-data-grid`)

WebSocket/SignalR → `apiRef.updateRows()` with flash animation on changed rows.

```tsx
import { useGridApiRef, DataGrid } from '@mui/x-data-grid';

function LiveGrid({ initialRows, columns }) {
  const apiRef = useGridApiRef();
  const [flashIds, setFlashIds] = useState<Set<GridRowId>>(new Set());

  useEffect(() => {
    const ws = new WebSocket('wss://your-api/stream');
    // or: const connection = new signalR.HubConnectionBuilder().withUrl('/hubs/data').build();

    ws.onmessage = (event) => {
      const deltas = JSON.parse(event.data); // [{ id, field, value }, ...]
      apiRef.current.updateRows(deltas);

      // Flash effect: add IDs, remove after animation
      const ids = new Set(deltas.map((d: any) => d.id));
      setFlashIds(ids);
      setTimeout(() => setFlashIds(new Set()), 500);
    };

    return () => ws.close();
  }, [apiRef]);

  return (
    <DataGrid
      apiRef={apiRef}
      rows={initialRows}
      columns={columns}
      getRowClassName={(params) =>
        flashIds.has(params.id) ? 'row-flash' : ''
      }
      sx={{
        '@keyframes flash': {
          '0%': { bgcolor: 'rgba(56,189,248,0.3)' },
          '100%': { bgcolor: 'transparent' },
        },
        '& .row-flash': {
          animation: 'flash 500ms ease-out',
        },
      }}
    />
  );
}
```

### 4. AI Assistant Grid (`ai-grid`) (Premium)

Natural language interaction with the DataGrid.

```tsx
import { DataGridPremium, GridAiAssistantPanel } from '@mui/x-data-grid-premium';

<DataGridPremium
  rows={rows}
  columns={columns}
  aiAssistant
  slots={{ aiAssistantPanel: GridAiAssistantPanel }}
  allowAiAssistantDataSampling
  aiAssistantSuggestions={[
    { value: 'Show overdue invoices' },
    { value: 'Group by department and show average salary' },
    { value: 'Sort contractors by utilization, descending' },
    { value: 'Filter to active projects with budget over $50k' },
  ]}
/>
```

### 5. Save/Restore Grid Profiles (`sparkline-grid` bonus)

Users save named "views" to localStorage or API.

```tsx
function GridWithProfiles({ rows, columns }) {
  const apiRef = useGridApiRef();
  const [profiles, setProfiles] = useState<Record<string, any>>(() =>
    JSON.parse(localStorage.getItem('grid-profiles') ?? '{}'),
  );

  const saveProfile = (name: string) => {
    const state = apiRef.current.exportState();
    const next = { ...profiles, [name]: state };
    setProfiles(next);
    localStorage.setItem('grid-profiles', JSON.stringify(next));
  };

  const loadProfile = (name: string) => {
    if (profiles[name]) {
      apiRef.current.restoreState(profiles[name]);
    }
  };

  return (
    <>
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <Button size="small" onClick={() => saveProfile('My View')}>Save View</Button>
        {Object.keys(profiles).map((name) => (
          <Chip key={name} label={name} onClick={() => loadProfile(name)} onDelete={() => {
            const { [name]: _, ...rest } = profiles;
            setProfiles(rest);
            localStorage.setItem('grid-profiles', JSON.stringify(rest));
          }} />
        ))}
      </Stack>
      <DataGrid apiRef={apiRef} rows={rows} columns={columns} />
    </>
  );
}
```

### 6. Stat Dashboard Cards (`stat-dashboard`)

KPI cards with sparklines, trend indicators, and micro-interactions.

```tsx
import { motion } from 'framer-motion';
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';

interface StatCardProps {
  label: string;
  value: string;
  trend: number; // percentage change
  sparkData: number[];
  icon: React.ReactNode;
}

function StatCard({ label, value, trend, sparkData, icon }: StatCardProps) {
  const isUp = trend >= 0;
  return (
    <motion.div whileHover={{ y: -4, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
      <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              {label}
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5 }}>
              {value}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
              <Chip
                label={`${isUp ? '+' : ''}${trend}%`}
                size="small"
                color={isUp ? 'success' : 'error'}
                sx={{ fontWeight: 600, fontSize: '0.75rem', height: 24 }}
              />
              <Typography variant="caption" color="text.secondary">vs last month</Typography>
            </Stack>
          </Box>
          <Box sx={{ color: 'primary.main', opacity: 0.7 }}>{icon}</Box>
        </Stack>
        <Box sx={{ mt: 2 }}>
          <SparkLineChart
            data={sparkData}
            height={40}
            curve="natural"
            area
            colors={[isUp ? '#16a34a' : '#dc2626']}
          />
        </Box>
      </Paper>
    </motion.div>
  );
}
```

### 7. Animated Multi-Step Wizard (`animated-wizard`)

Base UI + Framer Motion step transitions.

```tsx
import { AnimatePresence, motion } from 'framer-motion';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

function AnimatedWizard({ steps, children }) {
  const [activeStep, setActiveStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const goNext = () => { setDirection(1); setActiveStep((s) => s + 1); };
  const goBack = () => { setDirection(-1); setActiveStep((s) => s - 1); };

  return (
    <Box>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ overflow: 'hidden', minHeight: 300 }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeStep}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {children[activeStep]}
          </motion.div>
        </AnimatePresence>
      </Box>

      <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }}>
        <Button disabled={activeStep === 0} onClick={goBack}>Back</Button>
        <Button variant="contained" onClick={goNext}>
          {activeStep === steps.length - 1 ? 'Submit' : 'Next'}
        </Button>
      </Stack>
    </Box>
  );
}
```

### 8. Chart + Grid Bi-Directional Sync (`chart-grid-sync`) (Premium)

Grid filtering/grouping instantly updates connected charts.

```tsx
import { DataGridPremium } from '@mui/x-data-grid-premium';
import { BarChart } from '@mui/x-charts/BarChart';

function SyncedDashboard({ rows, columns }) {
  const [filteredRows, setFilteredRows] = useState(rows);

  return (
    <Stack spacing={3}>
      {/* Chart reacts to grid's visible rows */}
      <Paper sx={{ p: 2, height: 300 }}>
        <BarChart
          dataset={filteredRows}
          xAxis={[{ scaleType: 'band', dataKey: 'department' }]}
          series={[{ dataKey: 'revenue', label: 'Revenue' }]}
        />
      </Paper>

      <Box sx={{ height: 500 }}>
        <DataGridPremium
          rows={rows}
          columns={columns}
          onStateChange={(state) => {
            // Get visible rows after filtering/sorting
            const visibleIds = state.filter.filteredRowsLookup;
            const visible = rows.filter((r) => visibleIds?.[r.id] !== false);
            setFilteredRows(visible);
          }}
        />
      </Box>
    </Stack>
  );
}
```

### 9. Grid-as-Form Pattern (`grid-as-form`)

The grid IS the form — inline editing with metadata-driven validation means
users never open a separate form for simple edits.

```tsx
<DataGrid
  rows={rows}
  columns={buildColumns(metadata)} // columns from entity metadata
  editMode="row"
  processRowUpdate={async (newRow) => {
    const errors = validateRow(metadata, newRow);
    if (errors.length) throw new Error(errors[0].message);
    const saved = await saveToApi(newRow);
    return saved;
  }}
  onProcessRowUpdateError={(error) => showToast(error.message, 'error')}
  slots={{
    toolbar: () => (
      <GridToolbarContainer>
        <GridToolbarFilterButton />
        <GridToolbarExport />
        <Button startIcon={<AddIcon />} onClick={addNewRow}>Add Row</Button>
      </GridToolbarContainer>
    ),
  }}
/>
```

### 10. RichTreeView as File/Resource Browser (`tree-browser`)

```tsx
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import { useTreeItem } from '@mui/x-tree-view/useTreeItem';

function CustomTreeItem({ id, label, icon, onRename, onDelete, ...props }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(label);

  return (
    <TreeItem
      {...props}
      label={
        editing ? (
          <TextField
            size="small"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => { onRename(id, value); setEditing(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { onRename(id, value); setEditing(false); } }}
            autoFocus
            sx={{ py: 0 }}
          />
        ) : (
          <Stack direction="row" alignItems="center" spacing={1}>
            {icon}
            <Typography variant="body2">{label}</Typography>
            <Box sx={{ ml: 'auto' }}>
              <IconButton size="small" onClick={() => setEditing(true)}><EditIcon fontSize="small" /></IconButton>
              <IconButton size="small" onClick={() => onDelete(id)}><DeleteIcon fontSize="small" /></IconButton>
            </Box>
          </Stack>
        )
      }
    />
  );
}
```

## Style Variants

When `--style` is specified, apply these visual treatments:

| Style | Treatment |
|-------|-----------|
| `glassmorphism` | `backdrop-filter: blur(12px)`, semi-transparent backgrounds, frosted glass borders |
| `neumorphism` | Soft inner/outer shadows, no borders, muted palette |
| `gradient` | Linear/radial gradient backgrounds on cards/buttons, gradient text headings |
| `neon` | Dark backgrounds, bright glowing accents (`box-shadow: 0 0 20px color`), high contrast |
| `minimal-motion` | Subtle `transform: translateY(-2px)` on hover, gentle opacity transitions |
| `material-plus` | Enhanced Material Design with `borderRadius: 12`, elevation: 0 + border, refined spacing |

## Framer Motion Micro-Interactions (when --with-motion)

```tsx
// Card hover lift
<motion.div whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.15)' }}>

// Button press
<motion.button whileTap={{ scale: 0.97 }}>

// List item stagger
{items.map((item, i) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: i * 0.05 }}
  />
))}

// Number counter
<motion.span
  key={value}
  initial={{ y: -20, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ type: 'spring', stiffness: 300 }}
>
  {value}
</motion.span>
```

## Output Contract

```
Creative widget built: [widget name]
Style: [glassmorphism|neumorphism|gradient|neon|minimal-motion|material-plus]
Framer Motion: [yes|no]
Components created: X files
Lines of code: ~Y
Dependencies needed: [list any new packages]
```
