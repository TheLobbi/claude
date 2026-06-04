---
name: /mui-datagrid
intent: Build or configure MUI X DataGrid
tags:
  - mui-expert
  - data-grid
  - MUI-X
inputs:
  - '--mode'
  - '--features'
  - '--tier'
  - '--data-source'
risk: low
cost: medium
description: |
  Scaffold a new MUI X DataGrid component, add features to an existing one, or optimize an existing DataGrid for performance. Includes TypeScript types, server-side integration patterns, and React Query/SWR data fetching.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# /mui-datagrid

Build or configure MUI X DataGrid.

## Tier Capability Reference

| Feature | Community | Pro | Premium |
|---------|-----------|-----|---------|
| Sorting, filtering, pagination | Yes | Yes | Yes |
| Column resizing / reordering | No | Yes | Yes |
| Row grouping | No | No | Yes |
| Excel export | No | No | Yes |
| CSV export | No | Yes | Yes |
| Tree data | No | Yes | Yes |
| Master/detail rows | No | Yes | Yes |
| Server-side data | Yes | Yes | Yes |
| Inline editing | Yes | Yes | Yes |
| Virtualization | Yes | Yes | Yes |

If a requested feature is not available in the specified tier, note this clearly and suggest the minimum tier required.

## Operating Protocol

### Scaffold Mode (`--mode scaffold`)

1. Parse `--data-source` to infer the row TypeScript interface. If not provided, ask for field names and types.

2. Generate a complete DataGrid component:

   **Row type** — derive a TypeScript interface from the data description:
   ```ts
   interface UserRow {
     id: number;
     name: string;
     email: string;
     role: 'admin' | 'user';
     createdAt: string;
   }
   ```

   **Column definitions** — generate `GridColDef<UserRow>[]` with:
   - Correct `type` field per data type (`'string'`, `'number'`, `'date'`, `'boolean'`, `'singleSelect'`)
   - `valueFormatter` for dates and currency fields
   - `renderCell` for status chips, avatar+name combos, or action buttons
   - `flex` or `width` on each column (avoid leaving all columns unsized)
   - `minWidth` to prevent columns collapsing to zero

   **DataGrid props** — include all of:
   - `rows`, `columns`, `loading`
   - `getRowId` if row objects do not have an `id` field
   - `autoHeight` or explicit `height` on the container
   - `disableRowSelectionOnClick` (default selection behavior is often surprising)
   - `initialState` with `pagination.paginationModel` set

3. Add feature implementations based on `--features`:

   **sorting**: `sortingMode="client"` with `sortModel` + `onSortModelChange` state (or `"server"` for server-side)
   **filtering**: `filterMode="client"` with `filterModel` + `onFilterModelChange` state (or `"server"`)
   **pagination**: `paginationMode="client"` with `paginationModel` + `onPaginationModelChange` + `pageSizeOptions={[10, 25, 50]}`
   **editing**: `editMode="row"` (preferred over `"cell"`) with `processRowUpdate` async callback and `onProcessRowUpdateError`
   **export**: toolbar with `GridToolbar` or custom `GridToolbarExport` (note tier requirements)
   **server-side**: see server-side section below

4. Wrap in a container `Box` with appropriate height:
   ```tsx
   <Box sx={{ height: 600, width: '100%' }}>
     <DataGrid ... />
   </Box>
   ```

### Configure Mode (`--mode configure`)

1. Locate existing DataGrid usage with `Grep` (search for `DataGrid`, `DataGridPro`, or `DataGridPremium`).
2. Read the file(s) containing the DataGrid.
3. For each feature in `--features`, add the implementation to the existing component:
   - If `pagination` is requested but `paginationMode` is absent, add client-side pagination.
   - If `server-side` is requested, upgrade existing client-side sort/filter/pagination to server-side:
     - Add `rowCount` prop (total count from server)
     - Change `paginationMode`, `sortingMode`, `filterMode` to `"server"`
     - Wire `onPaginationModelChange`, `onSortModelChange`, `onFilterModelChange` to state
     - Pass state to data-fetching hook (see server-side pattern below)
   - If `editing` is requested, add `editMode="row"`, `processRowUpdate`, and `onProcessRowUpdateError`

### Optimize Mode (`--mode optimize`)

Scan the existing DataGrid component and apply these checks:

| Check | Fix |
|-------|-----|
| `columns` array defined inline in JSX (recreated every render) | Wrap in `useMemo` with empty dep array or extract to module scope |
| `sx` object on DataGrid defined inline | Extract to `useMemo` or module-level constant |
| `getRowId` defined inline as arrow function | Extract to module-level constant or `useCallback` |
| `onSortModelChange`, `onFilterModelChange` callbacks defined inline | Wrap in `useCallback` |
| `rowHeight` not set when all rows are uniform height | Set explicit `rowHeight` to enable row height optimization |
| `columnVisibilityModel` not controlled when column list is large | Control via state to avoid unnecessary layout recalculations |
| `disableVirtualization` set to `true` | Remove — only acceptable in test environments |
| `autoHeight` on a DataGrid with many rows (>50) | Warn — causes poor performance; use fixed height + overflow scroll |
| Missing `React.memo` on `renderCell` components | Wrap custom cell renderers in `React.memo` |
| `processRowUpdate` not wrapped in `useCallback` | Wrap in `useCallback` |

Report optimizations applied and estimate render improvement.

### Server-Side Integration Pattern

When `server-side` is in `--features`, generate the following pattern in addition to the DataGrid component:

```ts
// useDataGridQuery.ts — React Query integration
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import type { GridFilterModel, GridPaginationModel, GridSortModel } from '@mui/x-data-grid';

export function useDataGridQuery(endpoint: string) {
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([]);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [] });

  // Debounce filter changes to avoid rapid API calls on keystroke
  const [debouncedFilter, setDebouncedFilter] = useState(filterModel);
  // (attach useDebounce(filterModel, 300) to setDebouncedFilter in useEffect)

  const queryParams = useMemo(() => ({
    page: paginationModel.page,
    pageSize: paginationModel.pageSize,
    sortField: sortModel[0]?.field,
    sortOrder: sortModel[0]?.sort,
    filters: debouncedFilter.items,
  }), [paginationModel, sortModel, debouncedFilter]);

  const { data, isLoading } = useQuery({
    queryKey: [endpoint, queryParams],
    queryFn: () =>
      fetch(`${endpoint}?${new URLSearchParams(queryParams as Record<string, string>)}`)
        .then(r => r.json()),
    placeholderData: (prev) => prev, // keep previous data while loading (avoids flash)
  });

  return {
    rows: data?.rows ?? [],
    rowCount: data?.total ?? 0,
    isLoading,
    paginationModel,
    onPaginationModelChange: setPaginationModel,
    sortModel,
    onSortModelChange: setSortModel,
    filterModel,
    onFilterModelChange: useCallback((model: GridFilterModel) => {
      setFilterModel(model);
      setPaginationModel(prev => ({ ...prev, page: 0 })); // reset to page 0 on filter change
    }, []),
  };
}
```

Note: SWR equivalent pattern is generated when `swr` is present in `package.json` and `@tanstack/react-query` is not.

## Always Included

Regardless of mode, every generated or modified DataGrid must have:

- TypeScript generic on the DataGrid: `<DataGrid<RowType> ...>`
- `loading` prop wired to data-fetching state
- `slots.noRowsOverlay` or default `GridNoRowsOverlay` for empty state
- `getRowId` if rows do not have an `id` field
- Container with explicit height (not `autoHeight` for large datasets)
- `aria-label` on the DataGrid container for screen readers

## Output

- Generated component file(s) written to the project.
- For optimize mode: inline diff showing before/after for each optimization.
- Summary of features added, tier requirements noted, and any manual integration steps needed.
