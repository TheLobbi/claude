---
name: /mui-slots
intent: Customize MUI component internals using the slots API
tags:
  - mui-expert
  - slots
  - customization
  - composition
inputs:
  - '--component'
  - '--slot'
  - '--mode'
risk: low
cost: medium
description: |
  List available slots for a component, generate custom slot implementations, or migrate from deprecated components/componentsProps to the slots API.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# /mui-slots

Customize MUI component internals using the slots and slotProps API.

## Operating Protocol

### List Mode (`--mode list`)

Show all available slots for the specified component with their types:

| Component | Available Slots |
|-----------|----------------|
| Autocomplete | root, input, inputRoot, tag, clearIndicator, popupIndicator, popper, paper, listbox, option, groupLabel, groupUl, loading, noOptions |
| DataGrid | toolbar, footer, noRowsOverlay, noResultsOverlay, loadingOverlay, pagination, filterPanel, columnsPanel, columnMenu, baseButton, baseCheckbox, baseTextField, baseSelect, cell, row, columnHeader |
| DatePicker | field, textField, openPickerButton, openPickerIcon, day, toolbar, actionBar, layout, leftArrowIcon, rightArrowIcon, switchViewButton, switchViewIcon, calendarHeader, previousIconButton, nextIconButton |
| Slider | root, track, rail, thumb, valueLabel, mark, markLabel, input |
| Select | root, listbox, popup, indicator |
| TextField | root, input, inputLabel, formHelperText, select |
| Tooltip | tooltip, arrow, popper, transition |
| Dialog | root, backdrop, paper |
| Tabs | root, scroller, flexContainer, indicator, scrollButtons |

### Customize Mode (`--mode customize`)

1. Identify the target component and slot
2. Look up the slot's expected props interface
3. Generate a custom component that:
   - Accepts the correct props type
   - Uses forwardRef when needed
   - Preserves all default behavior
   - Adds the requested customization
4. Show how to wire it into the parent component

Example output:
```tsx
const CustomPaper = forwardRef<HTMLDivElement, PaperProps>((props, ref) => (
  <Paper {...props} ref={ref} elevation={8} sx={{ borderRadius: 2, mt: 1 }} />
));

<Autocomplete
  slots={{ paper: CustomPaper }}
  slotProps={{
    listbox: { sx: { maxHeight: 300 } },
    option: { sx: { fontSize: 14 } },
  }}
/>
```

### Migrate Mode (`--mode migrate`)

Scan codebase for deprecated prop patterns and migrate to slots API:

| Deprecated Pattern | New Pattern |
|-------------------|-------------|
| `components={{ Toolbar: X }}` | `slots={{ toolbar: X }}` |
| `componentsProps={{ toolbar: {} }}` | `slotProps={{ toolbar: {} }}` |
| `PaperComponent={X}` | `slots={{ paper: X }}` |
| `PopperComponent={X}` | `slots={{ popper: X }}` |
| `TransitionComponent={X}` | `slots={{ transition: X }}` |
| `BackdropComponent={X}` | `slots={{ backdrop: X }}` |

For each file with deprecated patterns:
1. Read the file
2. Identify all deprecated component/componentsProps usages
3. Transform to slots/slotProps pattern
4. Verify TypeScript compilation
5. Report changes made

## Output Contract

```
Slots customization complete.
Component: [name]
Slot(s) customized: [list]
Files modified: X (migrate mode)
TypeScript: PASS
```
