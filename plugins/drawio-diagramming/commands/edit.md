---
name: drawio:edit
intent: Edit and modify existing draw.io diagrams with intelligent updates
tags:
  - drawio-diagramming
  - command
  - edit
inputs: []
risk: low
cost: medium
description: |
  Reads and parses existing .drawio XML files to add, remove, or modify cells (shapes, edges, labels), update styles, adjust layouts, manage layers, merge diagrams, diff versions, and perform bulk operations while preserving diagram integrity.
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
  - Edit
---

# drawio:edit — Edit and Modify Existing draw.io Diagrams

## Overview

This command provides intelligent editing of existing draw.io diagrams. It reads
the current XML structure, applies modifications precisely, and writes back
well-formed XML. Supports everything from single-cell tweaks to bulk operations
across the entire diagram.

## Flags

| Flag | Alias | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--add-vertex <label>` | `-a` | string | none | Add a new shape (vertex) with the given label |
| `--connect-to <id>` | `-c` | string | none | Connect a newly added vertex to an existing cell by ID |
| `--remove <id>` | `-r` | string | none | Remove a cell by ID (and all connected edges) |
| `--rename <old> <new>` | | string | none | Rename a cell label from old to new |
| `--move <id> <x> <y>` | | string | none | Move a cell to absolute position (x, y) |
| `--resize <id> <w> <h>` | | string | none | Resize a cell to width w and height h |
| `--reparent <id> <parent>` | | string | none | Move a cell to a different parent container or layer |
| `--style <preset>` | `-s` | string | none | Apply a style preset to the entire diagram (dark, sketch, minimal, etc.) |
| `--recolor-by-status` | | boolean | `false` | Recolor cells based on status metadata (active=green, deprecated=red, etc.) |
| `--diff <file1> <file2>` | `-d` | string | none | Diff two diagram versions and report changes |
| `--merge <file>` | `-M` | string | none | Merge another diagram file into the current one |
| `--analyze` | `-A` | boolean | `false` | Analyze the diagram for structural issues and suggest fixes |
| `--output <path>` | `-o` | string | in-place | Write edited diagram to a different file (preserves original) |
| `--batch <script>` | `-b` | string | none | Run a batch edit script (JSON array of operations) |
| `--undo-safe` | `-u` | boolean | `false` | Create a `.drawio.bak` backup before editing |
| `--backup` | `-B` | boolean | `false` | Same as --undo-safe; create backup before any modifications |
| `--noout` | | boolean | `false` | Suppress diagram output (useful with --analyze) |
| `--force` | `-F` | boolean | `false` | Skip confirmation prompts for destructive operations |
| `--verbose` | `-v` | boolean | `false` | Show detailed processing output for each edit operation |
| `--dry-run` | `-n` | boolean | `false` | Preview changes without modifying any files |

### Flag Details

#### Element Manipulation Flags
- **`--add-vertex <label>`** (`-a`): Insert a new shape into the diagram with the given label. Uses default styling (blue rounded rectangle) unless combined with `--style`. Position is auto-calculated to avoid overlaps.
- **`--connect-to <id>`** (`-c`): Used with `--add-vertex` to create an edge from the new vertex to an existing cell. The edge uses orthogonal routing by default.
- **`--remove <id>`** (`-r`): Delete a cell and all edges that reference it as source or target. Use `--force` to skip the confirmation prompt. Cannot remove structural cells (id="0" or id="1").
- **`--rename <old> <new>`**: Find cells with label matching `old` and replace with `new`. Supports regex patterns when old is wrapped in slashes: `--rename "/v[0-9]+/" "v2"`.
- **`--move <id> <x> <y>`**: Set absolute position. Coordinates are in pixels from the top-left origin. For grouped elements, coordinates are relative to the parent container.
- **`--resize <id> <w> <h>`**: Change width and height while preserving position. Connected edges are automatically rerouted.
- **`--reparent <id> <parent>`**: Move a cell to a different container or layer. Adjusts coordinates from absolute to relative (or vice versa) automatically.

#### Style & Appearance Flags
- **`--style <preset>`** (`-s`): Apply a named style preset to all cells. Options: `dark`, `sketch`, `minimal`, `blueprint`, `colorful`, `professional`. Remaps fill colors, stroke colors, font families, and effects.
- **`--recolor-by-status`**: Reads `status` custom properties on cells and applies semantic colors: `active`=green, `deprecated`=red, `planned`=yellow, `in-review`=purple.

#### Comparison & Merge Flags
- **`--diff <file1> <file2>`** (`-d`): Compare two diagram files and output added, removed, and modified cells. Returns JSON when combined with `--noout`.
- **`--merge <file>`** (`-M`): Import all cells from another diagram file. Cells are added as a new page by default, or merged into the same page with `--force` (applies coordinate offset to avoid overlap).

#### Safety & Output Flags
- **`--output <path>`** (`-o`): Write the result to a new file instead of modifying in-place. The original file is never touched.
- **`--undo-safe`** / **`--backup`**: Create a timestamped `.bak` copy before making changes. Useful for irreversible operations like bulk renames.
- **`--dry-run`** (`-n`): Parse the diagram, compute all changes, and report what would happen, but do not write any files.
- **`--verbose`** (`-v`): Log each individual cell modification (add, remove, restyle, reposition) as it happens.
- **`--noout`**: Suppress the diagram file output. Useful when combining `--analyze` or `--diff` with scripting.
- **`--force`** (`-F`): Skip confirmation prompts for destructive operations (remove, merge into same page, overwrite).

#### Examples with Flags

```bash
# Add a service and connect it to the gateway
drawio:edit architecture.drawio --add-vertex "Payment Service" --connect-to "api-gateway"

# Safely restyle to dark mode with backup
drawio:edit architecture.drawio --style dark --backup

# Diff two versions
drawio:edit --diff v1/arch.drawio v2/arch.drawio

# Bulk rename with dry-run preview
drawio:edit architecture.drawio --rename "v1" "v2" --dry-run --verbose

# Remove a deprecated service
drawio:edit architecture.drawio --remove "svc-legacy" --force

# Merge two diagrams into one
drawio:edit main.drawio --merge secondary.drawio --output merged.drawio
```

## Reading and Parsing .drawio Files

### Step 1: Locate the diagram file

```bash
# Find all .drawio files in the project
find . -name "*.drawio" -o -name "*.drawio.svg" -o -name "*.drawio.png" | head -20
```

### Step 2: Read and validate structure

Use the Read tool to load the file, then validate:

```bash
# Validate XML is well-formed
xmllint --noout diagram.drawio 2>&1 && echo "VALID" || echo "INVALID"
```

### Step 3: Parse the structure

The XML hierarchy is always:
```
mxfile
  └── diagram (id, name)
        └── mxGraphModel (dx, dy, grid, ...)
              └── root
                    ├── mxCell id="0"              (root cell — never modify)
                    ├── mxCell id="1" parent="0"   (default layer — never remove)
                    ├── mxCell id="..." vertex="1"  (shapes)
                    ├── mxCell id="..." edge="1"    (connectors)
                    └── ...
```

**Critical rules when editing:**
- Never remove cells with `id="0"` or `id="1"`
- Never change the `parent` attribute of `id="1"` (must be `"0"`)
- Preserve the `<mxfile>` attributes (host, modified, agent, version)
- Update the `modified` timestamp when saving edits
- Keep all IDs unique within a page

## Adding Elements

### Add a Shape (Vertex)

Insert a new `<mxCell>` with `vertex="1"` inside `<root>`:

```xml
<!-- Rectangle -->
<mxCell id="new-box" value="New Service" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=12;" vertex="1" parent="1">
  <mxGeometry x="400" y="200" width="160" height="80" as="geometry" />
</mxCell>

<!-- Cylinder (database) -->
<mxCell id="new-db" value="Redis Cache" style="shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#D5E8D4;strokeColor=#82B366;fontSize=12;" vertex="1" parent="1">
  <mxGeometry x="600" y="200" width="100" height="100" as="geometry" />
</mxCell>

<!-- Diamond (decision) -->
<mxCell id="new-decision" value="Valid?" style="rhombus;whiteSpace=wrap;html=1;fillColor=#FFF2CC;strokeColor=#D6B656;fontSize=12;" vertex="1" parent="1">
  <mxGeometry x="360" y="350" width="120" height="80" as="geometry" />
</mxCell>

<!-- Circle (start/end) -->
<mxCell id="new-start" value="" style="ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#D5E8D4;strokeColor=#82B366;" vertex="1" parent="1">
  <mxGeometry x="200" y="100" width="40" height="40" as="geometry" />
</mxCell>

<!-- Cloud -->
<mxCell id="new-cloud" value="Internet" style="ellipse;shape=cloud;whiteSpace=wrap;html=1;fillColor=#F5F5F5;strokeColor=#666666;fontSize=12;" vertex="1" parent="1">
  <mxGeometry x="100" y="50" width="180" height="110" as="geometry" />
</mxCell>

<!-- Document -->
<mxCell id="new-doc" value="Report" style="shape=document;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=0.27;fillColor=#FFF2CC;strokeColor=#D6B656;fontSize=12;" vertex="1" parent="1">
  <mxGeometry x="500" y="400" width="120" height="80" as="geometry" />
</mxCell>
```

### Add a Connector (Edge)

```xml
<!-- Solid arrow -->
<mxCell id="edge-new-1" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" edge="1" source="new-box" target="new-db" parent="1">
  <mxGeometry relative="1" as="geometry" />
</mxCell>

<!-- Dashed arrow (response / return) -->
<mxCell id="edge-new-2" style="edgeStyle=orthogonalEdgeStyle;rounded=0;dashed=1;endArrow=open;endFill=0;html=1;" edge="1" source="new-db" target="new-box" parent="1">
  <mxGeometry relative="1" as="geometry" />
</mxCell>

<!-- Labeled edge -->
<mxCell id="edge-new-3" value="HTTP 200" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;fontSize=10;" edge="1" source="new-box" target="new-decision" parent="1">
  <mxGeometry relative="1" as="geometry" />
</mxCell>

<!-- Bidirectional arrow -->
<mxCell id="edge-new-4" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;startArrow=block;startFill=1;endArrow=block;endFill=1;" edge="1" source="new-box" target="new-db" parent="1">
  <mxGeometry relative="1" as="geometry" />
</mxCell>
```

### Add a Text Label / Annotation

```xml
<!-- Floating text annotation -->
<mxCell id="note-1" value="Note: This service handles&#xa;all authentication logic" style="text;html=1;align=left;verticalAlign=top;whiteSpace=wrap;rounded=0;fillColor=#FFF2CC;strokeColor=#D6B656;fontSize=11;fontStyle=2;spacingLeft=8;spacingTop=4;spacingRight=8;spacingBottom=4;" vertex="1" parent="1">
  <mxGeometry x="600" y="50" width="220" height="60" as="geometry" />
</mxCell>

<!-- Sticky note style -->
<mxCell id="sticky-1" value="TODO: Add retry logic" style="shape=note;whiteSpace=wrap;html=1;backgroundOutline=1;size=15;fillColor=#FFF2CC;strokeColor=#D6B656;fontSize=11;shadow=1;" vertex="1" parent="1">
  <mxGeometry x="700" y="300" width="140" height="80" as="geometry" />
</mxCell>
```

### Add a Group / Container

```xml
<!-- Container that holds child elements -->
<mxCell id="group-backend" value="Backend Services" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#F5F5F5;strokeColor=#666666;dashed=1;verticalAlign=top;fontStyle=1;fontSize=13;spacingTop=5;container=1;collapsible=0;" vertex="1" parent="1">
  <mxGeometry x="100" y="100" width="400" height="300" as="geometry" />
</mxCell>

<!-- Child element inside the group (parent = group ID) -->
<mxCell id="svc-in-group" value="API Server" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;" vertex="1" parent="group-backend">
  <mxGeometry x="40" y="50" width="140" height="60" as="geometry" />
</mxCell>
```

## Removing Elements

### Remove a Single Cell

Use the Edit tool to find and delete the `<mxCell>` element:

```
# Find the cell by ID and remove it entirely
old_string: <mxCell id="cell-to-remove" value="Old Service" style="..." vertex="1" parent="1">
          <mxGeometry x="400" y="200" width="160" height="80" as="geometry" />
        </mxCell>
new_string: (empty — removes the cell)
```

**Important:** When removing a vertex, also remove all edges that reference it as `source` or `target`:

```bash
# Find edges connected to the cell being removed
grep -n 'source="cell-to-remove"\|target="cell-to-remove"' diagram.drawio
```

Then remove each connected edge as well.

### Remove All Edges Connected to a Cell

```bash
# Identify and list all edges connected to a specific cell
python3 << 'PYEOF'
import xml.etree.ElementTree as ET
tree = ET.parse("diagram.drawio")
cell_id = "cell-to-remove"
root_el = tree.find(".//root")
edges_to_remove = []
for cell in root_el.findall("mxCell"):
    if cell.get("edge") == "1":
        if cell.get("source") == cell_id or cell.get("target") == cell_id:
            edges_to_remove.append(cell.get("id"))
            print(f"Edge to remove: {cell.get('id')} (source={cell.get('source')}, target={cell.get('target')})")
print(f"\nTotal edges to remove: {len(edges_to_remove)}")
PYEOF
```

## Modifying Existing Cells

### Update a Label

```
old_string: value="Old Label"
new_string: value="New Label"
```

For HTML labels (multi-line, formatted):
```
old_string: value="Old Label"
new_string: value="&lt;b&gt;Service Name&lt;/b&gt;&lt;br&gt;v2.1.0&lt;br&gt;&lt;i&gt;Port 8080&lt;/i&gt;"
```

### Update Position

```
old_string: <mxGeometry x="400" y="200" width="160" height="80" as="geometry" />
new_string: <mxGeometry x="550" y="300" width="160" height="80" as="geometry" />
```

### Resize an Element

```
old_string: <mxGeometry x="400" y="200" width="160" height="80" as="geometry" />
new_string: <mxGeometry x="400" y="200" width="240" height="120" as="geometry" />
```

## Style Updates

### Style String Format

draw.io styles are semicolon-separated key=value pairs:
```
rounded=1;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=12;fontStyle=1;
```

### Common Style Properties

| Property | Values | Description |
|----------|--------|-------------|
| `fillColor` | `#hex` or `none` | Background color |
| `strokeColor` | `#hex` | Border color |
| `fontColor` | `#hex` | Text color |
| `fontSize` | number | Font size in points |
| `fontStyle` | 0=normal, 1=bold, 2=italic, 4=underline | Combinable (3=bold+italic) |
| `fontFamily` | font name | e.g., Helvetica, Courier New |
| `rounded` | 0 or 1 | Rounded corners |
| `shadow` | 0 or 1 | Drop shadow |
| `glass` | 0 or 1 | Glossy effect |
| `sketch` | 0 or 1 | Hand-drawn style |
| `opacity` | 0-100 | Transparency |
| `dashed` | 0 or 1 | Dashed border |
| `dashPattern` | e.g., `5 5` | Dash pattern |
| `strokeWidth` | number | Border width |
| `align` | left, center, right | Horizontal text alignment |
| `verticalAlign` | top, middle, bottom | Vertical text alignment |
| `whiteSpace` | wrap | Enable text wrapping |
| `html` | 1 | Enable HTML labels |
| `shape` | shape name | e.g., cylinder3, cloud, document |
| `arcSize` | number | Corner radius for rounded shapes |
| `container` | 0 or 1 | Can contain child elements |
| `collapsible` | 0 or 1 | Can be collapsed |

### Change Colors

```
old_string: fillColor=#DAE8FC;strokeColor=#6C8EBF
new_string: fillColor=#D5E8D4;strokeColor=#82B366
```

### Apply Sketch Style to Entire Diagram

```bash
python3 << 'PYEOF'
import xml.etree.ElementTree as ET

tree = ET.parse("diagram.drawio")
root_el = tree.find(".//root")

for cell in root_el.findall("mxCell"):
    style = cell.get("style", "")
    if not style:
        continue
    if cell.get("vertex") == "1" or cell.get("edge") == "1":
        if "sketch=" not in style:
            style += "sketch=1;curveFitting=1;jiggle=2;"
        else:
            style = style.replace("sketch=0", "sketch=1")
        cell.set("style", style)

tree.write("diagram.drawio", xml_declaration=True, encoding="UTF-8")
print("Applied sketch style to all elements")
PYEOF
```

### Apply Dark Mode

```bash
python3 << 'PYEOF'
import xml.etree.ElementTree as ET

DARK_REMAP = {
    "#DAE8FC": "#1A3A5C",  # blue fill
    "#6C8EBF": "#4A90D9",  # blue stroke
    "#D5E8D4": "#1A3C1A",  # green fill
    "#82B366": "#5CB85C",  # green stroke
    "#FFF2CC": "#3C3500",  # yellow fill
    "#D6B656": "#D4A017",  # yellow stroke
    "#F8CECC": "#3C1A1A",  # red fill
    "#B85450": "#D9534F",  # red stroke
    "#E1D5E7": "#2D1F3D",  # purple fill
    "#9673A6": "#B07CC6",  # purple stroke
    "#F5F5F5": "#2D2D2D",  # gray fill
    "#666666": "#999999",  # gray stroke
    "#FFFFFF": "#1E1E1E",  # white fill
    "#000000": "#E0E0E0",  # black stroke
}

tree = ET.parse("diagram.drawio")

# Set dark background on mxGraphModel
model = tree.find(".//mxGraphModel")
if model is not None:
    model.set("background", "#1E1E1E")

root_el = tree.find(".//root")
for cell in root_el.findall("mxCell"):
    style = cell.get("style", "")
    if not style:
        continue
    for light, dark in DARK_REMAP.items():
        style = style.replace(light, dark)
    if "fontColor=" not in style and (cell.get("vertex") == "1"):
        style += "fontColor=#E0E0E0;"
    cell.set("style", style)

tree.write("diagram.drawio", xml_declaration=True, encoding="UTF-8")
print("Applied dark mode to diagram")
PYEOF
```

## Layout Adjustments

### Auto-Layout with Even Spacing

```bash
python3 << 'PYEOF'
import xml.etree.ElementTree as ET

tree = ET.parse("diagram.drawio")
root_el = tree.find(".//root")

PADDING_X = 40
PADDING_Y = 40
COL_WIDTH = 200
ROW_HEIGHT = 120

vertices = []
for cell in root_el.findall("mxCell"):
    if cell.get("vertex") == "1" and cell.get("id") not in ("0", "1"):
        geom = cell.find("mxGeometry")
        if geom is not None:
            vertices.append((cell, geom))

# Grid layout: arrange in rows of 4
cols = 4
for i, (cell, geom) in enumerate(vertices):
    row = i // cols
    col = i % cols
    geom.set("x", str(PADDING_X + col * COL_WIDTH))
    geom.set("y", str(PADDING_Y + row * ROW_HEIGHT))

tree.write("diagram.drawio", xml_declaration=True, encoding="UTF-8")
print(f"Repositioned {len(vertices)} elements in a {cols}-column grid")
PYEOF
```

### Horizontal Flow Layout

```bash
python3 << 'PYEOF'
import xml.etree.ElementTree as ET

tree = ET.parse("diagram.drawio")
root_el = tree.find(".//root")

START_X = 80
START_Y = 200
GAP = 60

x = START_X
vertices = []
for cell in root_el.findall("mxCell"):
    if cell.get("vertex") == "1" and cell.get("id") not in ("0", "1"):
        geom = cell.find("mxGeometry")
        if geom is not None:
            width = int(geom.get("width", "160"))
            geom.set("x", str(x))
            geom.set("y", str(START_Y))
            x += width + GAP
            vertices.append(cell.get("id"))

tree.write("diagram.drawio", xml_declaration=True, encoding="UTF-8")
print(f"Arranged {len(vertices)} elements in horizontal flow")
PYEOF
```

### Center-Align All Elements on Page

```bash
python3 << 'PYEOF'
import xml.etree.ElementTree as ET

tree = ET.parse("diagram.drawio")
model = tree.find(".//mxGraphModel")
page_width = int(model.get("pageWidth", "1169"))
page_height = int(model.get("pageHeight", "827"))

root_el = tree.find(".//root")

min_x, max_x_w, min_y, max_y_h = float('inf'), 0, float('inf'), 0
geoms = []
for cell in root_el.findall("mxCell"):
    if cell.get("vertex") == "1" and cell.get("id") not in ("0", "1"):
        geom = cell.find("mxGeometry")
        if geom is not None:
            x = float(geom.get("x", "0"))
            y = float(geom.get("y", "0"))
            w = float(geom.get("width", "0"))
            h = float(geom.get("height", "0"))
            min_x = min(min_x, x)
            max_x_w = max(max_x_w, x + w)
            min_y = min(min_y, y)
            max_y_h = max(max_y_h, y + h)
            geoms.append(geom)

content_w = max_x_w - min_x
content_h = max_y_h - min_y
offset_x = (page_width - content_w) / 2 - min_x
offset_y = (page_height - content_h) / 2 - min_y

for geom in geoms:
    geom.set("x", str(round(float(geom.get("x", "0")) + offset_x)))
    geom.set("y", str(round(float(geom.get("y", "0")) + offset_y)))

tree.write("diagram.drawio", xml_declaration=True, encoding="UTF-8")
print(f"Centered diagram content on page ({page_width}x{page_height})")
PYEOF
```

## Self-Editing: Analyze and Improve

### Analyze Diagram for Issues

```bash
python3 << 'PYEOF'
import xml.etree.ElementTree as ET

tree = ET.parse("diagram.drawio")
root_el = tree.find(".//root")

issues = []
vertex_ids = set()
edge_sources = set()
edge_targets = set()

for cell in root_el.findall("mxCell"):
    cid = cell.get("id")
    style = cell.get("style", "")
    value = cell.get("value", "")

    if cell.get("vertex") == "1" and cid not in ("0", "1"):
        vertex_ids.add(cid)
        # Check for missing labels
        if not value.strip():
            issues.append(f"WARNING: Vertex {cid} has no label")
        # Check for missing geometry
        geom = cell.find("mxGeometry")
        if geom is None:
            issues.append(f"ERROR: Vertex {cid} has no mxGeometry")
        # Check for zero-size
        elif geom.get("width") == "0" or geom.get("height") == "0":
            issues.append(f"WARNING: Vertex {cid} has zero width or height")

    if cell.get("edge") == "1":
        src = cell.get("source")
        tgt = cell.get("target")
        edge_sources.add(src)
        edge_targets.add(tgt)
        # Check for missing source/target
        if not src:
            issues.append(f"WARNING: Edge {cid} has no source")
        if not tgt:
            issues.append(f"WARNING: Edge {cid} has no target")

# Check for orphan vertices (no connections)
connected = edge_sources | edge_targets
for vid in vertex_ids:
    if vid not in connected:
        issues.append(f"INFO: Vertex {vid} is disconnected (no edges)")

# Check for dangling edges (source/target not in vertex list)
for src in edge_sources:
    if src and src not in vertex_ids:
        issues.append(f"ERROR: Edge references non-existent source: {src}")
for tgt in edge_targets:
    if tgt and tgt not in vertex_ids:
        issues.append(f"ERROR: Edge references non-existent target: {tgt}")

# Check for duplicate IDs
all_ids = []
for cell in root_el.findall("mxCell"):
    all_ids.append(cell.get("id"))
dupes = set(x for x in all_ids if all_ids.count(x) > 1)
for d in dupes:
    issues.append(f"ERROR: Duplicate cell ID: {d}")

print(f"=== Diagram Analysis ===")
print(f"Vertices: {len(vertex_ids)}")
print(f"Edges: {len(edge_sources)}")
print(f"Issues found: {len(issues)}")
print()
for issue in sorted(issues):
    print(f"  {issue}")
if not issues:
    print("  No issues found - diagram looks good!")
PYEOF
```

### Suggest Layout Improvements

```bash
python3 << 'PYEOF'
import xml.etree.ElementTree as ET

tree = ET.parse("diagram.drawio")
root_el = tree.find(".//root")

suggestions = []

vertices = {}
for cell in root_el.findall("mxCell"):
    if cell.get("vertex") == "1" and cell.get("id") not in ("0", "1"):
        geom = cell.find("mxGeometry")
        if geom is not None:
            x = float(geom.get("x", "0"))
            y = float(geom.get("y", "0"))
            w = float(geom.get("width", "100"))
            h = float(geom.get("height", "50"))
            vertices[cell.get("id")] = {"x": x, "y": y, "w": w, "h": h}

# Check for overlapping elements
ids = list(vertices.keys())
for i in range(len(ids)):
    for j in range(i + 1, len(ids)):
        a = vertices[ids[i]]
        b = vertices[ids[j]]
        if (a["x"] < b["x"] + b["w"] and a["x"] + a["w"] > b["x"] and
            a["y"] < b["y"] + b["h"] and a["y"] + a["h"] > b["y"]):
            suggestions.append(f"OVERLAP: {ids[i]} and {ids[j]} overlap - consider repositioning")

# Check for inconsistent sizing
widths = [v["w"] for v in vertices.values()]
heights = [v["h"] for v in vertices.values()]
if widths and max(widths) > 3 * min(widths):
    suggestions.append("SIZING: Element widths vary significantly - consider standardizing")
if heights and max(heights) > 3 * min(heights):
    suggestions.append("SIZING: Element heights vary significantly - consider standardizing")

# Check alignment
x_positions = sorted(set(v["x"] for v in vertices.values()))
y_positions = sorted(set(v["y"] for v in vertices.values()))
if len(x_positions) > len(vertices) * 0.7:
    suggestions.append("ALIGNMENT: Elements are not aligned to a grid - consider snapping to grid")

print("=== Layout Suggestions ===")
for s in suggestions:
    print(f"  {s}")
if not suggestions:
    print("  Layout looks well-organized!")
PYEOF
```

## Layer Management

### List Layers

```bash
python3 << 'PYEOF'
import xml.etree.ElementTree as ET

tree = ET.parse("diagram.drawio")
root_el = tree.find(".//root")

layers = []
for cell in root_el.findall("mxCell"):
    if cell.get("parent") == "0":
        layers.append({
            "id": cell.get("id"),
            "name": cell.get("value", "(default)"),
            "visible": cell.get("visible", "1"),
            "locked": "locked=1" in cell.get("style", "")
        })

print("=== Layers ===")
for layer in layers:
    status = []
    if layer["visible"] == "0":
        status.append("hidden")
    if layer["locked"]:
        status.append("locked")
    flag = f" [{', '.join(status)}]" if status else ""
    print(f"  Layer {layer['id']}: {layer['name']}{flag}")
PYEOF
```

### Add a New Layer

Insert a new `<mxCell>` with `parent="0"` after the existing layers:

```xml
<mxCell id="layer-security" value="Security" parent="0" />
```

Then assign elements to this layer by setting `parent="layer-security"`.

### Toggle Layer Visibility

```
old_string: <mxCell id="layer-security" value="Security" parent="0" />
new_string: <mxCell id="layer-security" value="Security" parent="0" visible="0" />
```

### Lock a Layer

```
old_string: <mxCell id="layer-security" value="Security" parent="0" />
new_string: <mxCell id="layer-security" value="Security" parent="0" style="locked=1;" />
```

### Move Elements Between Layers

```
old_string: parent="1"
new_string: parent="layer-security"
```

Apply this change only to the specific cell that needs to move (use surrounding context in Edit tool to ensure uniqueness).

## Connection Point Management

### Add Custom Connection Points to a Shape

Use the `points` style property to define where edges can connect:

```xml
<!-- Shape with 8 connection points (N, NE, E, SE, S, SW, W, NW) -->
<mxCell id="router" value="Router" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;points=[[0.5,0,0],[1,0.5,0],[0.5,1,0],[0,0.5,0],[0.25,0,0],[0.75,0,0],[0.25,1,0],[0.75,1,0]];" vertex="1" parent="1">
  <mxGeometry x="400" y="200" width="160" height="80" as="geometry" />
</mxCell>
```

Point format: `[x_ratio, y_ratio, perimeter]` where x and y are 0-1 ratios of width/height.

### Constrain Edge Connection Side

```xml
<!-- Force edge to exit from the east side of source and enter west side of target -->
<mxCell id="edge-constrained" style="edgeStyle=orthogonalEdgeStyle;exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;" edge="1" source="box-a" target="box-b" parent="1">
  <mxGeometry relative="1" as="geometry" />
</mxCell>
```

Exit/entry point reference:
- `exitX=0, exitY=0.5` → left (west)
- `exitX=1, exitY=0.5` → right (east)
- `exitX=0.5, exitY=0` → top (north)
- `exitX=0.5, exitY=1` → bottom (south)

## Merging Multiple Diagrams

### Merge Two .drawio Files

```bash
python3 << 'PYEOF'
import xml.etree.ElementTree as ET
import sys

file_a = "diagram-a.drawio"
file_b = "diagram-b.drawio"
output = "merged.drawio"

tree_a = ET.parse(file_a)
tree_b = ET.parse(file_b)

mxfile_a = tree_a.getroot()
mxfile_b = tree_b.getroot()

# Option 1: Add as separate pages
for diagram in mxfile_b.findall("diagram"):
    # Rename to avoid ID collision
    old_id = diagram.get("id")
    diagram.set("id", f"merged-{old_id}")
    old_name = diagram.get("name", "Imported")
    diagram.set("name", f"{old_name} (from B)")
    mxfile_a.append(diagram)

tree_a.write(output, xml_declaration=True, encoding="UTF-8")
print(f"Merged {file_a} + {file_b} -> {output}")
print(f"Total pages: {len(mxfile_a.findall('diagram'))}")
PYEOF
```

### Merge Into Same Page (with offset)

```bash
python3 << 'PYEOF'
import xml.etree.ElementTree as ET

file_a = "diagram-a.drawio"
file_b = "diagram-b.drawio"
output = "merged-single-page.drawio"
X_OFFSET = 600  # shift B's elements to the right

tree_a = ET.parse(file_a)
tree_b = ET.parse(file_b)

root_a = tree_a.find(".//root")
root_b = tree_b.find(".//root")

# Collect existing IDs from A to avoid collision
existing_ids = set()
for cell in root_a.findall("mxCell"):
    existing_ids.add(cell.get("id"))

# Import cells from B (skip id=0 and id=1)
imported = 0
for cell in root_b.findall("mxCell"):
    cid = cell.get("id")
    if cid in ("0", "1"):
        continue
    # Prefix IDs to avoid collision
    new_id = f"b-{cid}"
    cell.set("id", new_id)
    # Remap parent
    parent = cell.get("parent", "1")
    if parent not in ("0", "1"):
        cell.set("parent", f"b-{parent}")
    # Remap source/target
    for attr in ("source", "target"):
        val = cell.get(attr)
        if val:
            cell.set(attr, f"b-{val}")
    # Offset geometry
    geom = cell.find("mxGeometry")
    if geom is not None and cell.get("vertex") == "1":
        x = float(geom.get("x", "0"))
        geom.set("x", str(x + X_OFFSET))
    root_a.append(cell)
    imported += 1

tree_a.write(output, xml_declaration=True, encoding="UTF-8")
print(f"Imported {imported} elements from {file_b} into {file_a} (offset {X_OFFSET}px right)")
PYEOF
```

## Diffing Two Diagram Versions

```bash
python3 << 'PYEOF'
import xml.etree.ElementTree as ET

file_old = "diagram-v1.drawio"
file_new = "diagram-v2.drawio"

tree_old = ET.parse(file_old)
tree_new = ET.parse(file_new)

def get_cells(tree):
    cells = {}
    for cell in tree.find(".//root").findall("mxCell"):
        cid = cell.get("id")
        cells[cid] = {
            "value": cell.get("value", ""),
            "style": cell.get("style", ""),
            "vertex": cell.get("vertex"),
            "edge": cell.get("edge"),
            "source": cell.get("source"),
            "target": cell.get("target"),
        }
        geom = cell.find("mxGeometry")
        if geom is not None:
            cells[cid]["geom"] = {
                "x": geom.get("x"), "y": geom.get("y"),
                "width": geom.get("width"), "height": geom.get("height")
            }
    return cells

old_cells = get_cells(tree_old)
new_cells = get_cells(tree_new)

old_ids = set(old_cells.keys())
new_ids = set(new_cells.keys())

added = new_ids - old_ids
removed = old_ids - new_ids
common = old_ids & new_ids

modified = []
for cid in common:
    if old_cells[cid] != new_cells[cid]:
        modified.append(cid)

print(f"=== Diagram Diff: {file_old} -> {file_new} ===")
print(f"\nAdded ({len(added)}):")
for cid in sorted(added):
    print(f"  + {cid}: {new_cells[cid].get('value', '(no label)')}")
print(f"\nRemoved ({len(removed)}):")
for cid in sorted(removed):
    print(f"  - {cid}: {old_cells[cid].get('value', '(no label)')}")
print(f"\nModified ({len(modified)}):")
for cid in sorted(modified):
    old_val = old_cells[cid].get("value", "")
    new_val = new_cells[cid].get("value", "")
    if old_val != new_val:
        print(f"  ~ {cid}: label '{old_val}' -> '{new_val}'")
    elif old_cells[cid].get("style") != new_cells[cid].get("style"):
        print(f"  ~ {cid}: style changed")
    elif old_cells[cid].get("geom") != new_cells[cid].get("geom"):
        print(f"  ~ {cid}: position/size changed")
PYEOF
```

## Bulk Operations

### Rename All Labels Matching a Pattern

```bash
python3 << 'PYEOF'
import xml.etree.ElementTree as ET
import re

tree = ET.parse("diagram.drawio")
root_el = tree.find(".//root")

OLD_PATTERN = r"Service v1"
NEW_TEXT = "Service v2"
count = 0

for cell in root_el.findall("mxCell"):
    value = cell.get("value", "")
    if re.search(OLD_PATTERN, value):
        new_value = re.sub(OLD_PATTERN, NEW_TEXT, value)
        cell.set("value", new_value)
        count += 1
        print(f"  Renamed {cell.get('id')}: '{value}' -> '{new_value}'")

tree.write("diagram.drawio", xml_declaration=True, encoding="UTF-8")
print(f"\nRenamed {count} elements")
PYEOF
```

### Recolor by Status

```bash
python3 << 'PYEOF'
import xml.etree.ElementTree as ET

tree = ET.parse("diagram.drawio")
root_el = tree.find(".//root")

STATUS_COLORS = {
    "active":     {"fill": "#D5E8D4", "stroke": "#82B366"},
    "deprecated": {"fill": "#F8CECC", "stroke": "#B85450"},
    "planned":    {"fill": "#FFF2CC", "stroke": "#D6B656"},
    "in-review":  {"fill": "#E1D5E7", "stroke": "#9673A6"},
}

# Map cell IDs to statuses
STATUS_MAP = {
    "svc-auth": "active",
    "svc-legacy": "deprecated",
    "svc-payments-v2": "planned",
    "svc-notification": "in-review",
}

count = 0
for cell in root_el.findall("mxCell"):
    cid = cell.get("id")
    if cid in STATUS_MAP:
        status = STATUS_MAP[cid]
        colors = STATUS_COLORS[status]
        style = cell.get("style", "")
        # Replace fillColor and strokeColor
        import re
        style = re.sub(r"fillColor=#[0-9A-Fa-f]{6}", f"fillColor={colors['fill']}", style)
        style = re.sub(r"strokeColor=#[0-9A-Fa-f]{6}", f"strokeColor={colors['stroke']}", style)
        cell.set("style", style)
        count += 1
        print(f"  {cid} -> {status} ({colors['fill']})")

tree.write("diagram.drawio", xml_declaration=True, encoding="UTF-8")
print(f"\nRecolored {count} elements by status")
PYEOF
```

### Standardize All Font Sizes

```bash
python3 << 'PYEOF'
import xml.etree.ElementTree as ET
import re

tree = ET.parse("diagram.drawio")
root_el = tree.find(".//root")

TARGET_SIZE = "12"
count = 0

for cell in root_el.findall("mxCell"):
    style = cell.get("style", "")
    if "fontSize=" in style:
        new_style = re.sub(r"fontSize=\d+", f"fontSize={TARGET_SIZE}", style)
        if new_style != style:
            cell.set("style", new_style)
            count += 1

tree.write("diagram.drawio", xml_declaration=True, encoding="UTF-8")
print(f"Standardized font size to {TARGET_SIZE}pt for {count} elements")
PYEOF
```

## Deeply Nested Editing: Groups and Containers

### Edit Elements Inside a Group

Elements inside a group have their `parent` set to the group's ID. Their `mxGeometry` coordinates are relative to the group's position.

```bash
python3 << 'PYEOF'
import xml.etree.ElementTree as ET

tree = ET.parse("diagram.drawio")
root_el = tree.find(".//root")

GROUP_ID = "group-backend"

print(f"=== Children of {GROUP_ID} ===")
for cell in root_el.findall("mxCell"):
    if cell.get("parent") == GROUP_ID:
        cid = cell.get("id")
        value = cell.get("value", "(no label)")
        geom = cell.find("mxGeometry")
        pos = ""
        if geom is not None:
            pos = f" at ({geom.get('x', '?')}, {geom.get('y', '?')})"
        print(f"  {cid}: {value}{pos}")
PYEOF
```

To move all children when moving a group, only change the group's geometry - children use relative coordinates and move automatically.

### Add Element to Existing Group

```xml
<mxCell id="new-svc-in-group" value="New Service" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;" vertex="1" parent="group-backend">
  <mxGeometry x="40" y="120" width="140" height="60" as="geometry" />
</mxCell>
```

Note: set `parent` to the group's ID, and use coordinates relative to the group's top-left corner.

## Execution Steps

1. **Read the diagram**: use Read tool to load the .drawio file
2. **Parse and understand**: identify cells, layers, connections, and structure
3. **Plan modifications**: determine what needs to change and check for side effects
4. **Apply changes**: use Edit tool for targeted modifications or Write for full rewrites
5. **Validate**: run the analysis script to check for broken references
6. **Report**: list changes made (added/removed/modified counts)

## Usage Examples

```
# Add a new service to the architecture diagram
drawio:edit architecture.drawio --add-vertex "Payment Service" --connect-to "API Gateway"

# Restyle to dark mode
drawio:edit architecture.drawio --style dark

# Analyze for issues
drawio:edit architecture.drawio --analyze

# Merge two diagrams
drawio:edit --merge diagram-a.drawio diagram-b.drawio --output merged.drawio

# Diff two versions
drawio:edit --diff diagram-v1.drawio diagram-v2.drawio

# Bulk rename
drawio:edit architecture.drawio --rename "v1" "v2"

# Recolor by status
drawio:edit architecture.drawio --recolor-by-status
```
