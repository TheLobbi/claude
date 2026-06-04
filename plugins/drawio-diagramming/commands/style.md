---
name: drawio:style
intent: Apply professional styling, themes, and visual presets to draw.io diagrams
tags:
  - drawio-diagramming
  - command
  - style
inputs: []
risk: low
cost: low
description: |
  Comprehensive styling engine for draw.io diagrams. Apply theme presets (Professional, Sketch, Dark Mode, Blueprint, Minimal, Colorful, Corporate), bulk restyle operations, and fine-grained control over every visual property including fills, strokes, shapes, text, labels, edges, and arrows. Includes style inheritance validation and consistency checking across diagram elements.
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
  - Edit
---

# drawio:style

Apply professional styling, themes, and visual presets to draw.io diagrams. This command
provides complete control over the visual appearance of every element in a diagram, from
individual shape properties to full theme application across all cells.

---

## Flags

| Flag | Alias | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--theme <name>` | `-t` | string | none | Apply a named theme preset (professional, sketch, dark, colorful, minimal, blueprint, corporate) |
| `--target <selector>` | `-T` | string | `all` | Target cells to style (all, vertices, edges, or comma-separated cell IDs) |
| `--set <property=value>` | `-s` | string | none | Set a specific style property (e.g., `--set "fillColor=#DAE8FC"`) |
| `--copy-from <id>` | `-f` | string | none | Copy style from a source cell ID |
| `--copy-to <ids>` | | string | none | Paste copied style to target cell IDs (comma-separated) |
| `--match <property>` | `-m` | string | none | Select cells matching a style property (e.g., `--match "fillColor=#F8CECC"`) |
| `--check-consistency` | `-c` | boolean | `false` | Audit style consistency across the diagram and report issues |
| `--output <path>` | `-o` | string | in-place | Write styled diagram to a different file |
| `--preview` | `-p` | boolean | `false` | Show a before/after summary of style changes |
| `--reset` | `-R` | boolean | `false` | Reset all styles to the default theme |
| `--accessibility-check` | `-a` | boolean | `false` | Check contrast ratios and color-blind safety |
| `--verbose` | `-v` | boolean | `false` | Show detailed per-cell style changes |
| `--dry-run` | `-n` | boolean | `false` | Preview style changes without modifying files |

### Flag Details

#### Theme & Style Flags
- **`--theme <name>`** (`-t`): Apply a complete theme preset to the entire diagram. Each theme defines coordinated fill colors, stroke colors, font family, font size, corner radius, shadow, and sketch effects. Available themes:
  - `professional` — Clean blue/green palette, Helvetica, rounded corners
  - `sketch` — Hand-drawn effect with Comic Sans, jiggle, and curve fitting
  - `dark` — Dark backgrounds with light strokes and white text
  - `colorful` — Vibrant colors with shadows and glass effects
  - `minimal` — No fills, thin strokes, small font
  - `blueprint` — Dark blue backgrounds, Courier font, technical aesthetic
  - `corporate` — Subdued colors, serif fonts, formal appearance
- **`--set <property=value>`** (`-s`): Set a single style property on targeted cells. Can be used multiple times: `--set "fillColor=#DAE8FC" --set "fontSize=14"`. Properties are appended or replaced in the existing style string.
- **`--reset`** (`-R`): Remove all custom styling and revert to the default professional theme. Preserves shape types and positions.

#### Targeting Flags
- **`--target <selector>`** (`-T`): Control which cells are affected. `all` applies to every cell. `vertices` applies only to shapes. `edges` applies only to connectors. Comma-separated IDs target specific cells: `--target "svc-api,svc-db,svc-cache"`.
- **`--match <property>`** (`-m`): Select cells by matching a style property. Useful for bulk updates: `--match "fillColor=#F8CECC"` selects all red elements. Combine with `--set` to restyle them: `--match "fillColor=#F8CECC" --set "fillColor=#D5E8D4"`.

#### Copy & Paste Flags
- **`--copy-from <id>`** (`-f`): Read the full style string from a source cell. Used with `--copy-to` to replicate the style.
- **`--copy-to <ids>`**: Apply the copied style to one or more target cells. Example: `--copy-from "svc-api" --copy-to "svc-db,svc-cache,svc-queue"`.

#### Analysis Flags
- **`--check-consistency`** (`-c`): Audit the diagram for style inconsistencies. Reports elements of the same type with different styles, mixed font families, inconsistent font sizes, and mismatched color palettes.
- **`--accessibility-check`** (`-a`): Evaluate WCAG contrast ratios between fill and font colors, check for color-blind problematic combinations (red-green), and verify minimum font sizes.

#### Output Flags
- **`--output <path>`** (`-o`): Save the restyled diagram to a new file, preserving the original.
- **`--preview`** (`-p`): Show a summary of changes: how many cells affected, which properties changed, before/after color values.
- **`--dry-run`** (`-n`): Compute all style changes and report them without writing files.
- **`--verbose`** (`-v`): Log each individual cell's style change with before/after values.

#### Examples with Flags

```bash
# Apply dark theme to entire diagram
drawio:style architecture.drawio --theme dark

# Restyle only edge connectors
drawio:style architecture.drawio --target edges --set "strokeWidth=2" --set "rounded=1"

# Copy style from one cell to others
drawio:style architecture.drawio --copy-from "svc-api" --copy-to "svc-db,svc-cache"

# Recolor all red elements to green
drawio:style architecture.drawio --match "fillColor=#F8CECC" --set "fillColor=#D5E8D4" --set "strokeColor=#82B366"

# Check style consistency
drawio:style architecture.drawio --check-consistency --verbose

# Accessibility audit
drawio:style architecture.drawio --accessibility-check

# Preview theme change without applying
drawio:style architecture.drawio --theme blueprint --dry-run --preview
```

## Style String Format

Every draw.io cell has a `style` attribute containing a semicolon-delimited string of
key=value pairs. The style string controls all visual properties of the cell:

```
style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=12;"
```

Rules:
- Properties are separated by semicolons (`;`).
- Order does not matter.
- Unknown properties are silently ignored.
- Boolean properties: `1` = true, `0` = false.
- Colors use hex format: `#RRGGBB` (no alpha channel in most properties).
- Some properties accept named values (e.g., `shape=ellipse`).
- A trailing semicolon is conventional but not required.

---

## Shape Style Properties

### Fill Properties

| Property | Values | Description |
|----------|--------|-------------|
| `fillColor` | `#RRGGBB` or `none` | Primary fill color |
| `gradientColor` | `#RRGGBB` or `none` | Secondary gradient color |
| `gradientDirection` | `south`, `north`, `east`, `west` | Direction of gradient blend |
| `opacity` | `0`-`100` | Overall cell opacity (affects fill and stroke) |
| `fillOpacity` | `0`-`100` | Fill-only opacity (independent of stroke) |
| `glass` | `0` or `1` | Glass/glossy overlay effect |
| `shadow` | `0` or `1` | Drop shadow beneath the cell |
| `fillStyle` | `solid`, `hachure`, `cross-hatch`, `dots`, `dashed`, `zigzag` | Fill pattern (sketch mode) |

#### Fill Examples

```xml
<!-- Solid fill -->
<mxCell style="fillColor=#dae8fc;strokeColor=#6c8ebf;" .../>

<!-- Gradient fill (blue to white, top to bottom) -->
<mxCell style="fillColor=#dae8fc;gradientColor=#ffffff;gradientDirection=south;" .../>

<!-- Glass effect -->
<mxCell style="fillColor=#dae8fc;strokeColor=#6c8ebf;glass=1;shadow=1;" .../>

<!-- Transparent fill -->
<mxCell style="fillColor=none;strokeColor=#6c8ebf;" .../>

<!-- Semi-transparent -->
<mxCell style="fillColor=#dae8fc;fillOpacity=50;strokeColor=#6c8ebf;" .../>

<!-- Hachure fill (sketch mode) -->
<mxCell style="fillColor=#dae8fc;fillStyle=hachure;sketch=1;" .../>
```

### Stroke Properties

| Property | Values | Description |
|----------|--------|-------------|
| `strokeColor` | `#RRGGBB` or `none` | Border/stroke color |
| `strokeWidth` | Number (px) | Border thickness (default: 1) |
| `dashed` | `0` or `1` | Enable dashed border |
| `dashPattern` | Space-separated numbers | Custom dash pattern (e.g., `8 4 2 4`) |
| `strokeOpacity` | `0`-`100` | Stroke-only opacity |

#### Stroke Examples

```xml
<!-- Thick solid border -->
<mxCell style="strokeColor=#b85450;strokeWidth=3;" .../>

<!-- Dashed border -->
<mxCell style="strokeColor=#666666;dashed=1;dashPattern=8 4;" .../>

<!-- Dotted border -->
<mxCell style="strokeColor=#666666;dashed=1;dashPattern=2 4;" .../>

<!-- Dash-dot border -->
<mxCell style="strokeColor=#666666;dashed=1;dashPattern=8 4 2 4;" .../>

<!-- No border -->
<mxCell style="strokeColor=none;" .../>

<!-- Semi-transparent border -->
<mxCell style="strokeColor=#b85450;strokeOpacity=50;strokeWidth=2;" .../>
```

### Shape Properties

| Property | Values | Description |
|----------|--------|-------------|
| `shape` | Shape name | Base shape (see shape catalog below) |
| `rounded` | `0` or `1` | Enable rounded corners |
| `arcSize` | Number | Corner radius when rounded=1 (default: 10) |
| `aspect` | `fixed` or unset | Lock aspect ratio |
| `direction` | `south`, `north`, `east`, `west` | Rotation direction for directional shapes |
| `flipH` | `0` or `1` | Horizontal flip |
| `flipV` | `0` or `1` | Vertical flip |
| `rotation` | Degrees (0-360) | Rotation angle |
| `perimeter` | Perimeter style | Custom perimeter for connection points |

#### Common Shape Values

```
rectangle (default)    ellipse              rhombus
triangle               hexagon              parallelogram
cylinder3              cloud                actor
umlLifeline            swimlane             table
note                   card                 document
folder                 tape                 step
process                trapezoid            curlyBracket
callout                doubleArrow          cross
image                  mxgraph.flowchart.*  mxgraph.aws4.*
```

#### Shape Examples

```xml
<!-- Rounded rectangle -->
<mxCell style="rounded=1;arcSize=20;fillColor=#dae8fc;" .../>

<!-- Ellipse / Circle -->
<mxCell style="shape=ellipse;fillColor=#d5e8d4;aspect=fixed;" .../>

<!-- Diamond / Decision -->
<mxCell style="shape=rhombus;fillColor=#fff2cc;" .../>

<!-- Cylinder (database) -->
<mxCell style="shape=cylinder3;boundedLbl=1;backgroundOutline=1;size=15;
               fillColor=#f5f5f5;strokeColor=#666666;" .../>

<!-- Cloud shape -->
<mxCell style="shape=cloud;fillColor=#dae8fc;strokeColor=#6c8ebf;" .../>

<!-- Actor (stick figure) -->
<mxCell style="shape=umlActor;verticalLabelPosition=bottom;
               verticalAlign=top;fillColor=#d5e8d4;" .../>

<!-- Document shape -->
<mxCell style="shape=document;fillColor=#fff2cc;strokeColor=#d6b656;
               boundedLbl=1;size=0.27;" .../>

<!-- Hexagon -->
<mxCell style="shape=hexagon;perimeter=hexagonPerimeter2;
               fillColor=#e1d5e7;strokeColor=#9673a6;size=0.25;" .../>

<!-- Rotated and flipped -->
<mxCell style="shape=triangle;rotation=90;flipH=1;fillColor=#f8cecc;" .../>
```

### Text Properties

| Property | Values | Description |
|----------|--------|-------------|
| `fontSize` | Number (pt) | Font size in points |
| `fontFamily` | Font name | Font family (e.g., `Helvetica`, `Courier New`, `Comic Sans MS`) |
| `fontColor` | `#RRGGBB` | Text color |
| `fontStyle` | Bitmask | Bold=1, Italic=2, Underline=4 (additive: bold+italic=3) |
| `align` | `left`, `center`, `right` | Horizontal text alignment |
| `verticalAlign` | `top`, `middle`, `bottom` | Vertical text alignment |
| `whiteSpace` | `wrap` or unset | Enable text wrapping |
| `html` | `0` or `1` | Enable HTML formatting in labels |
| `overflow` | `hidden`, `fill`, `width`, `visible` | Text overflow behavior |
| `textOpacity` | `0`-`100` | Text opacity |

#### fontStyle Bitmask Values

```
0  = Normal
1  = Bold
2  = Italic
3  = Bold + Italic (1+2)
4  = Underline
5  = Bold + Underline (1+4)
6  = Italic + Underline (2+4)
7  = Bold + Italic + Underline (1+2+4)
8  = Strikethrough
9  = Bold + Strikethrough (1+8)
```

#### Text Examples

```xml
<!-- Bold title with left alignment -->
<mxCell style="text;html=1;fontSize=16;fontStyle=1;fontColor=#333333;
               align=left;verticalAlign=top;whiteSpace=wrap;" .../>

<!-- Italic subtitle -->
<mxCell style="text;html=1;fontSize=12;fontStyle=2;fontColor=#666666;
               align=center;verticalAlign=middle;" .../>

<!-- Code-style monospace text -->
<mxCell style="text;html=1;fontSize=11;fontFamily=Courier New;
               fontColor=#333333;align=left;fillColor=#f5f5f5;
               strokeColor=#cccccc;rounded=1;spacingLeft=8;" .../>

<!-- HTML-formatted label in a shape -->
<mxCell value="&lt;b&gt;Service Name&lt;/b&gt;&lt;br&gt;&lt;i&gt;v2.4.1&lt;/i&gt;"
        style="rounded=1;html=1;fillColor=#dae8fc;fontSize=12;" .../>
```

### Label Position Properties

| Property | Values | Description |
|----------|--------|-------------|
| `labelPosition` | `left`, `center`, `right` | Horizontal position of label relative to cell |
| `verticalLabelPosition` | `top`, `middle`, `bottom` | Vertical position of label relative to cell |
| `spacing` | Number (px) | Global spacing around label |
| `spacingTop` | Number (px) | Top padding for label |
| `spacingBottom` | Number (px) | Bottom padding for label |
| `spacingLeft` | Number (px) | Left padding for label |
| `spacingRight` | Number (px) | Right padding for label |
| `labelBackgroundColor` | `#RRGGBB` or `none` | Background color behind label text |
| `labelBorderColor` | `#RRGGBB` or `none` | Border around label text |

#### Label Position Examples

```xml
<!-- Label below the shape (icon-style) -->
<mxCell style="shape=ellipse;labelPosition=center;
               verticalLabelPosition=bottom;verticalAlign=top;
               fillColor=#dae8fc;aspect=fixed;" .../>

<!-- Label to the right of the shape -->
<mxCell style="shape=ellipse;labelPosition=right;align=left;
               verticalLabelPosition=middle;verticalAlign=middle;
               fillColor=#d5e8d4;aspect=fixed;spacingLeft=10;" .../>

<!-- Label with background highlight -->
<mxCell style="rounded=1;fillColor=#dae8fc;labelBackgroundColor=#ffffff;
               labelBorderColor=#6c8ebf;spacingTop=4;spacingBottom=4;
               spacingLeft=8;spacingRight=8;" .../>
```

---

## Edge / Connector Style Properties

### Edge Routing Styles

| `edgeStyle` Value | Description | Best For |
|-------------------|-------------|----------|
| `orthogonalEdgeStyle` | Right-angle routing with automatic path finding | Architecture diagrams, flowcharts |
| `segmentEdgeStyle` | Manual segment control with draggable waypoints | Complex routing |
| `elbowEdgeStyle` | Single elbow (L-shaped) connections | Simple connections |
| `entityRelationEdgeStyle` | ER-diagram style with crow's foot notation | Database diagrams |
| `isometricEdgeStyle` | 3D isometric routing | Isometric diagrams |
| (none / default) | Straight line from source to target | Simple diagrams |

### Edge Properties

| Property | Values | Description |
|----------|--------|-------------|
| `edgeStyle` | See above | Routing algorithm |
| `curved` | `0` or `1` | Smooth curved edges |
| `rounded` | `0` or `1` | Rounded corners on orthogonal edges |
| `jettySize` | `auto` or Number | Length of the first/last segment |
| `jumpStyle` | `none`, `arc`, `gap`, `sharp`, `line` | Style when edges cross |
| `jumpSize` | Number | Size of the jump/arc at crossings |
| `entryX` | `0`-`1` | Connection point X on target (0=left, 1=right) |
| `entryY` | `0`-`1` | Connection point Y on target (0=top, 1=bottom) |
| `exitX` | `0`-`1` | Connection point X on source |
| `exitY` | `0`-`1` | Connection point Y on source |
| `entryDx` | Number | Offset X from entry point |
| `entryDy` | Number | Offset Y from entry point |
| `exitDx` | Number | Offset X from exit point |
| `exitDy` | Number | Offset Y from exit point |

### Arrow Types

| Arrow Name | Visual | Use Case |
|-----------|--------|----------|
| `classic` | Filled triangle | Default, general purpose |
| `classicThin` | Thin filled triangle | Lighter connections |
| `block` | Filled block | Strong directional flow |
| `open` | Open triangle (outline) | Soft directional indication |
| `oval` | Filled oval | Data flow endpoints |
| `diamond` | Filled diamond | Aggregation (UML) |
| `diamondThin` | Thin filled diamond | Composition (UML) |
| `box` | Filled square | Interface connection |
| `halfCircle` | Half circle | Required interface (UML) |
| `circle` | Filled circle | Composition start |
| `circlePlus` | Circle with plus | Package import |
| `cross` | X mark | Termination |
| `dash` | Short dash | Dependency |
| `async` | Open half-arrow | Asynchronous message |
| `ERone` | ER one notation | ER: exactly one |
| `ERmandOne` | ER mandatory one | ER: one (mandatory) |
| `ERmany` | ER many notation | ER: zero or more |
| `ERoneToMany` | ER one-to-many | ER: one to many |
| `ERzeroToOne` | ER zero-to-one | ER: zero or one |
| `ERzeroToMany` | ER zero-to-many | ER: zero or many |

### Arrow Properties

| Property | Values | Description |
|----------|--------|-------------|
| `startArrow` | Arrow name | Arrow type at source end |
| `endArrow` | Arrow name | Arrow type at target end |
| `startSize` | Number | Size of start arrow (default: 6) |
| `endSize` | Number | Size of end arrow (default: 6) |
| `startFill` | `0` or `1` | Fill the start arrow (1=filled, 0=outline) |
| `endFill` | `0` or `1` | Fill the end arrow |
| `sourcePerimeterSpacing` | Number | Gap between source shape and edge |
| `targetPerimeterSpacing` | Number | Gap between target shape and edge |

### Edge Examples

```xml
<!-- Standard orthogonal edge with block arrow -->
<mxCell style="edgeStyle=orthogonalEdgeStyle;rounded=1;
               strokeColor=#666666;strokeWidth=2;
               endArrow=block;endFill=1;endSize=8;"
        edge="1" source="a" target="b" parent="1">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>

<!-- Curved edge with open arrow -->
<mxCell style="curved=1;strokeColor=#6c8ebf;strokeWidth=1.5;
               endArrow=open;endFill=0;endSize=10;"
        edge="1" source="a" target="b" parent="1">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>

<!-- Dashed dependency arrow -->
<mxCell style="edgeStyle=orthogonalEdgeStyle;dashed=1;dashPattern=8 4;
               strokeColor=#999999;endArrow=open;endFill=0;"
        edge="1" source="a" target="b" parent="1">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>

<!-- UML aggregation (open diamond at source) -->
<mxCell style="edgeStyle=orthogonalEdgeStyle;strokeColor=#333333;
               startArrow=diamond;startFill=0;startSize=14;
               endArrow=open;endFill=0;"
        edge="1" source="a" target="b" parent="1">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>

<!-- UML composition (filled diamond at source) -->
<mxCell style="edgeStyle=orthogonalEdgeStyle;strokeColor=#333333;
               startArrow=diamondThin;startFill=1;startSize=14;
               endArrow=open;endFill=0;"
        edge="1" source="a" target="b" parent="1">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>

<!-- ER relationship with crow's foot -->
<mxCell style="edgeStyle=entityRelationEdgeStyle;
               strokeColor=#333333;strokeWidth=1;
               startArrow=ERmandOne;startFill=0;startSize=10;
               endArrow=ERoneToMany;endFill=0;endSize=10;"
        edge="1" source="users" target="orders" parent="1">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>

<!-- Async message (sequence diagram) -->
<mxCell style="html=1;verticalAlign=bottom;
               endArrow=async;endFill=0;endSize=10;
               curved=0;rounded=0;fontSize=11;"
        edge="1" parent="1">
  <mxGeometry relative="1" as="geometry">
    <mxPoint x="130" y="200" as="sourcePoint"/>
    <mxPoint x="340" y="200" as="targetPoint"/>
  </mxGeometry>
</mxCell>

<!-- Edge with jump arc at crossings -->
<mxCell style="edgeStyle=orthogonalEdgeStyle;rounded=1;
               jumpStyle=arc;jumpSize=10;
               strokeColor=#666666;endArrow=block;endFill=1;"
        edge="1" source="a" target="b" parent="1">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>

<!-- Bidirectional arrow -->
<mxCell style="edgeStyle=orthogonalEdgeStyle;rounded=1;
               strokeColor=#333333;strokeWidth=2;
               startArrow=block;startFill=1;startSize=8;
               endArrow=block;endFill=1;endSize=8;"
        edge="1" source="a" target="b" parent="1">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>

<!-- Edge with label -->
<mxCell value="HTTP/REST"
        style="edgeStyle=orthogonalEdgeStyle;rounded=1;
               strokeColor=#666666;strokeWidth=1.5;
               endArrow=block;endFill=1;fontSize=10;
               labelBackgroundColor=#ffffff;"
        edge="1" source="a" target="b" parent="1">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>
```

---

## Theme Presets

### Professional Theme

Clean, corporate look with blue accents, subtle shadows, and rounded corners.

```python
PROFESSIONAL_THEME = {
    "name": "Professional",
    "graph": {
        "background": "#ffffff",
        "gridColor": "#e0e0e0",
        "shadow": True,
    },
    "shapes": {
        "primary": {
            "fillColor": "#dae8fc",
            "strokeColor": "#6c8ebf",
            "fontColor": "#333333",
            "fontSize": 12,
            "fontFamily": "Helvetica",
            "rounded": 1,
            "arcSize": 10,
            "shadow": 1,
            "glass": 0,
        },
        "secondary": {
            "fillColor": "#d5e8d4",
            "strokeColor": "#82b366",
            "fontColor": "#333333",
            "fontSize": 12,
            "fontFamily": "Helvetica",
            "rounded": 1,
            "arcSize": 10,
            "shadow": 1,
        },
        "accent": {
            "fillColor": "#fff2cc",
            "strokeColor": "#d6b656",
            "fontColor": "#333333",
            "fontSize": 12,
            "fontFamily": "Helvetica",
            "rounded": 1,
            "arcSize": 10,
            "shadow": 1,
        },
        "danger": {
            "fillColor": "#f8cecc",
            "strokeColor": "#b85450",
            "fontColor": "#9C1A1A",
            "fontSize": 12,
            "fontFamily": "Helvetica",
            "rounded": 1,
            "arcSize": 10,
            "shadow": 1,
        },
        "neutral": {
            "fillColor": "#f5f5f5",
            "strokeColor": "#666666",
            "fontColor": "#333333",
            "fontSize": 12,
            "fontFamily": "Helvetica",
            "rounded": 1,
            "arcSize": 10,
            "shadow": 1,
        },
    },
    "edges": {
        "strokeColor": "#666666",
        "strokeWidth": 1.5,
        "rounded": 1,
        "edgeStyle": "orthogonalEdgeStyle",
        "endArrow": "block",
        "endFill": 1,
        "endSize": 8,
        "fontSize": 10,
        "labelBackgroundColor": "#ffffff",
    },
    "text": {
        "fontFamily": "Helvetica",
        "fontSize": 11,
        "fontColor": "#333333",
    },
}
```

```xml
<!-- Professional theme example -->
<mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1" tooltips="1"
              connect="1" arrows="1" fold="1" page="1" pageScale="1"
              pageWidth="1169" pageHeight="827" background="#ffffff">
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="svc" value="API Service"
            style="rounded=1;arcSize=10;whiteSpace=wrap;html=1;
                   fillColor=#dae8fc;strokeColor=#6c8ebf;shadow=1;
                   fontSize=12;fontFamily=Helvetica;fontStyle=1;"
            vertex="1" parent="1">
      <mxGeometry x="100" y="100" width="160" height="60" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>
```

### Sketch / Hand-Drawn Theme

Informal, whiteboard-like appearance using draw.io's sketch mode.

```python
SKETCH_THEME = {
    "name": "Sketch",
    "graph": {
        "background": "#fffef4",
        "gridColor": "#e8e8d8",
    },
    "global_style": "sketch=1;",  # Applied to all cells
    "shapes": {
        "primary": {
            "fillColor": "#dae8fc",
            "strokeColor": "#6c8ebf",
            "fontColor": "#333333",
            "fontSize": 13,
            "fontFamily": "Comic Sans MS",
            "rounded": 1,
            "arcSize": 15,
            "shadow": 0,
            "sketch": 1,
            "curveFitting": 1,
            "jiggle": 2,
            "fillStyle": "hachure",
            "hachureGap": 4,
        },
    },
    "edges": {
        "strokeColor": "#333333",
        "strokeWidth": 2,
        "rounded": 1,
        "curved": 1,
        "sketch": 1,
        "curveFitting": 1,
        "jiggle": 2,
        "endArrow": "open",
        "endFill": 0,
        "fontSize": 12,
        "fontFamily": "Comic Sans MS",
    },
}
```

```xml
<!-- Sketch theme example -->
<mxCell id="sketch-box" value="User Service"
        style="rounded=1;arcSize=15;whiteSpace=wrap;html=1;
               fillColor=#dae8fc;strokeColor=#6c8ebf;
               sketch=1;curveFitting=1;jiggle=2;
               fillStyle=hachure;hachureGap=4;
               fontSize=13;fontFamily=Comic Sans MS;strokeWidth=2;"
        vertex="1" parent="1">
  <mxGeometry x="100" y="100" width="160" height="60" as="geometry"/>
</mxCell>
```

### Dark Mode Theme

Dark backgrounds with light text and vibrant accent colors. Ideal for presentations.

```python
DARK_MODE_THEME = {
    "name": "Dark Mode",
    "graph": {
        "background": "#1a1a2e",
        "gridColor": "#2a2a4e",
    },
    "shapes": {
        "primary": {
            "fillColor": "#16213e",
            "strokeColor": "#0f3460",
            "fontColor": "#e0e0e0",
            "fontSize": 12,
            "fontFamily": "Segoe UI",
            "rounded": 1,
            "arcSize": 8,
            "shadow": 0,
            "strokeWidth": 1.5,
        },
        "accent": {
            "fillColor": "#0f3460",
            "strokeColor": "#533483",
            "fontColor": "#e94560",
            "fontSize": 12,
            "fontFamily": "Segoe UI",
            "rounded": 1,
            "arcSize": 8,
        },
        "highlight": {
            "fillColor": "#533483",
            "strokeColor": "#e94560",
            "fontColor": "#ffffff",
            "fontSize": 12,
            "fontFamily": "Segoe UI",
            "rounded": 1,
            "arcSize": 8,
            "strokeWidth": 2,
        },
        "neon_green": {
            "fillColor": "#1a1a2e",
            "strokeColor": "#00ff88",
            "fontColor": "#00ff88",
            "strokeWidth": 2,
        },
        "neon_blue": {
            "fillColor": "#1a1a2e",
            "strokeColor": "#00d4ff",
            "fontColor": "#00d4ff",
            "strokeWidth": 2,
        },
    },
    "edges": {
        "strokeColor": "#4a4a6e",
        "strokeWidth": 1.5,
        "rounded": 1,
        "edgeStyle": "orthogonalEdgeStyle",
        "endArrow": "block",
        "endFill": 1,
        "fontSize": 10,
        "fontColor": "#aaaaaa",
        "labelBackgroundColor": "#1a1a2e",
    },
}
```

```xml
<!-- Dark mode example -->
<mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1" tooltips="1"
              connect="1" arrows="1" fold="1" page="1" pageScale="1"
              pageWidth="1169" pageHeight="827" background="#1a1a2e">
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="dark-svc" value="API Gateway"
            style="rounded=1;arcSize=8;whiteSpace=wrap;html=1;
                   fillColor=#16213e;strokeColor=#0f3460;
                   fontColor=#e0e0e0;fontSize=12;fontFamily=Segoe UI;
                   fontStyle=1;strokeWidth=1.5;"
            vertex="1" parent="1">
      <mxGeometry x="100" y="100" width="160" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="dark-db" value="PostgreSQL"
            style="shape=cylinder3;boundedLbl=1;backgroundOutline=1;size=15;
                   fillColor=#0f3460;strokeColor=#533483;
                   fontColor=#e94560;fontSize=12;fontFamily=Segoe UI;
                   fontStyle=1;strokeWidth=1.5;"
            vertex="1" parent="1">
      <mxGeometry x="400" y="90" width="120" height="80" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>
```

### Blueprint Theme

Technical blueprint look with dark blue background and white/cyan elements.

```python
BLUEPRINT_THEME = {
    "name": "Blueprint",
    "graph": {
        "background": "#0d1b2a",
        "gridColor": "#1b2d44",
    },
    "shapes": {
        "primary": {
            "fillColor": "none",
            "strokeColor": "#60c0e0",
            "fontColor": "#60c0e0",
            "fontSize": 12,
            "fontFamily": "Consolas",
            "rounded": 0,
            "shadow": 0,
            "strokeWidth": 1.5,
        },
        "highlight": {
            "fillColor": "#1b3a5c",
            "strokeColor": "#80d0f0",
            "fontColor": "#ffffff",
            "fontSize": 12,
            "fontFamily": "Consolas",
            "strokeWidth": 2,
        },
        "annotation": {
            "fillColor": "none",
            "strokeColor": "#ffffff",
            "fontColor": "#ffffff",
            "fontSize": 10,
            "fontFamily": "Consolas",
            "dashed": 1,
            "dashPattern": "4 4",
        },
    },
    "edges": {
        "strokeColor": "#60c0e0",
        "strokeWidth": 1,
        "edgeStyle": "orthogonalEdgeStyle",
        "endArrow": "open",
        "endFill": 0,
        "fontSize": 10,
        "fontColor": "#60c0e0",
        "fontFamily": "Consolas",
    },
}
```

```xml
<!-- Blueprint theme example -->
<mxGraphModel background="#0d1b2a">
  <root>
    <mxCell id="0"/><mxCell id="1" parent="0"/>
    <mxCell id="bp-box" value="Load Balancer"
            style="rounded=0;whiteSpace=wrap;html=1;fillColor=none;
                   strokeColor=#60c0e0;fontColor=#60c0e0;fontSize=12;
                   fontFamily=Consolas;strokeWidth=1.5;"
            vertex="1" parent="1">
      <mxGeometry x="100" y="100" width="160" height="60" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>
```

### Minimal Theme

Clean, distraction-free design with thin strokes, muted colors, and generous whitespace.

```python
MINIMAL_THEME = {
    "name": "Minimal",
    "graph": {
        "background": "#ffffff",
        "gridColor": "#f0f0f0",
    },
    "shapes": {
        "primary": {
            "fillColor": "#f8f9fa",
            "strokeColor": "#dee2e6",
            "fontColor": "#495057",
            "fontSize": 11,
            "fontFamily": "Inter",
            "rounded": 1,
            "arcSize": 6,
            "shadow": 0,
            "strokeWidth": 1,
        },
        "accent": {
            "fillColor": "#e3f2fd",
            "strokeColor": "#90caf9",
            "fontColor": "#1565c0",
            "fontSize": 11,
            "fontFamily": "Inter",
            "rounded": 1,
            "arcSize": 6,
        },
    },
    "edges": {
        "strokeColor": "#bdbdbd",
        "strokeWidth": 1,
        "rounded": 1,
        "edgeStyle": "orthogonalEdgeStyle",
        "endArrow": "classic",
        "endFill": 1,
        "endSize": 6,
        "fontSize": 9,
        "fontColor": "#9e9e9e",
    },
}
```

### Colorful Theme

Vibrant fills with gradient effects and glass styling for visual impact.

```python
COLORFUL_THEME = {
    "name": "Colorful",
    "graph": {
        "background": "#ffffff",
    },
    "shapes": {
        "blue": {
            "fillColor": "#1e88e5",
            "gradientColor": "#42a5f5",
            "strokeColor": "#1565c0",
            "fontColor": "#ffffff",
            "fontSize": 13,
            "fontStyle": 1,
            "rounded": 1,
            "arcSize": 12,
            "shadow": 1,
            "glass": 1,
        },
        "green": {
            "fillColor": "#43a047",
            "gradientColor": "#66bb6a",
            "strokeColor": "#2e7d32",
            "fontColor": "#ffffff",
            "fontSize": 13,
            "fontStyle": 1,
            "rounded": 1,
            "arcSize": 12,
            "shadow": 1,
            "glass": 1,
        },
        "orange": {
            "fillColor": "#fb8c00",
            "gradientColor": "#ffa726",
            "strokeColor": "#ef6c00",
            "fontColor": "#ffffff",
            "fontSize": 13,
            "fontStyle": 1,
            "rounded": 1,
            "arcSize": 12,
            "shadow": 1,
            "glass": 1,
        },
        "purple": {
            "fillColor": "#8e24aa",
            "gradientColor": "#ab47bc",
            "strokeColor": "#6a1b9a",
            "fontColor": "#ffffff",
            "fontSize": 13,
            "fontStyle": 1,
            "rounded": 1,
            "arcSize": 12,
            "shadow": 1,
            "glass": 1,
        },
        "red": {
            "fillColor": "#e53935",
            "gradientColor": "#ef5350",
            "strokeColor": "#c62828",
            "fontColor": "#ffffff",
            "fontSize": 13,
            "fontStyle": 1,
            "rounded": 1,
            "arcSize": 12,
            "shadow": 1,
            "glass": 1,
        },
    },
    "edges": {
        "strokeColor": "#555555",
        "strokeWidth": 2,
        "rounded": 1,
        "curved": 1,
        "endArrow": "block",
        "endFill": 1,
        "endSize": 10,
        "fontSize": 11,
    },
}
```

### Corporate Theme

Formal gray/navy palette suitable for enterprise documentation and stakeholder presentations.

```python
CORPORATE_THEME = {
    "name": "Corporate",
    "graph": {
        "background": "#ffffff",
        "gridColor": "#e8e8e8",
    },
    "shapes": {
        "primary": {
            "fillColor": "#2c3e50",
            "strokeColor": "#1a252f",
            "fontColor": "#ffffff",
            "fontSize": 12,
            "fontFamily": "Segoe UI",
            "rounded": 1,
            "arcSize": 4,
            "shadow": 1,
        },
        "secondary": {
            "fillColor": "#ecf0f1",
            "strokeColor": "#bdc3c7",
            "fontColor": "#2c3e50",
            "fontSize": 12,
            "fontFamily": "Segoe UI",
            "rounded": 1,
            "arcSize": 4,
        },
        "accent": {
            "fillColor": "#3498db",
            "strokeColor": "#2980b9",
            "fontColor": "#ffffff",
            "fontSize": 12,
            "fontFamily": "Segoe UI",
            "rounded": 1,
            "arcSize": 4,
            "shadow": 1,
        },
        "success": {
            "fillColor": "#27ae60",
            "strokeColor": "#1e8449",
            "fontColor": "#ffffff",
        },
        "warning": {
            "fillColor": "#f39c12",
            "strokeColor": "#d68910",
            "fontColor": "#ffffff",
        },
        "danger": {
            "fillColor": "#e74c3c",
            "strokeColor": "#c0392b",
            "fontColor": "#ffffff",
        },
    },
    "edges": {
        "strokeColor": "#7f8c8d",
        "strokeWidth": 1.5,
        "rounded": 1,
        "edgeStyle": "orthogonalEdgeStyle",
        "endArrow": "block",
        "endFill": 1,
        "endSize": 8,
        "fontSize": 10,
        "fontFamily": "Segoe UI",
        "fontColor": "#555555",
        "labelBackgroundColor": "#ffffff",
    },
}
```

---

## Bulk Restyle Operations

### Apply Theme to Entire Diagram

```python
#!/usr/bin/env python3
"""Apply a theme preset to all cells in a draw.io diagram."""

import xml.etree.ElementTree as ET
import re
import sys

def parse_style(style_str):
    """Parse a draw.io style string into a dict."""
    props = {}
    if not style_str:
        return props
    for part in style_str.split(";"):
        part = part.strip()
        if "=" in part:
            key, value = part.split("=", 1)
            props[key] = value
        elif part:
            props[part] = ""  # Standalone property like "rounded" or "html"
    return props

def build_style(props):
    """Build a draw.io style string from a dict."""
    parts = []
    for key, value in props.items():
        if value == "":
            parts.append(key)
        else:
            parts.append(f"{key}={value}")
    return ";".join(parts) + ";"

def apply_theme(drawio_path, theme, element_type="all"):
    """Apply theme properties to all matching cells."""
    tree = ET.parse(drawio_path)
    root = tree.getroot()
    updated = 0

    for cell in root.iter("mxCell"):
        is_vertex = cell.get("vertex") == "1"
        is_edge = cell.get("edge") == "1"
        style_str = cell.get("style", "")

        if not style_str:
            continue

        if element_type == "shapes" and not is_vertex:
            continue
        if element_type == "edges" and not is_edge:
            continue

        props = parse_style(style_str)

        if is_vertex and "shapes" in theme:
            # Determine which shape category this cell belongs to
            category = categorize_cell(props, theme)
            if category and category in theme["shapes"]:
                for key, value in theme["shapes"][category].items():
                    props[key] = str(value)
                updated += 1

        if is_edge and "edges" in theme:
            for key, value in theme["edges"].items():
                props[key] = str(value)
            updated += 1

        cell.set("style", build_style(props))

    # Apply graph-level properties
    if "graph" in theme:
        for model in root.iter("mxGraphModel"):
            if "background" in theme["graph"]:
                model.set("background", theme["graph"]["background"])

    tree.write(drawio_path, xml_declaration=True, encoding="UTF-8")
    print(f"Applied '{theme.get('name', 'custom')}' theme to {updated} cells")

def categorize_cell(props, theme):
    """Determine which theme category a cell belongs to based on current style."""
    fill = props.get("fillColor", "")
    shape = props.get("shape", "")

    # Default categorization by existing fill color
    if fill in ("#dae8fc", "#d4e1f5"):
        return "primary"
    if fill in ("#d5e8d4", "#c8e6c0"):
        return "secondary"
    if fill in ("#fff2cc", "#fce5b0"):
        return "accent"
    if fill in ("#f8cecc", "#e6b8b7"):
        return "danger"
    if fill in ("#f5f5f5", "#e0e0e0", "none"):
        return "neutral"

    # Fallback to primary
    return "primary"
```

### Selective Restyle by Pattern

Restyle only cells matching specific criteria:

```bash
# Restyle all database shapes to use cylinder style
/drawio:style architecture.drawio --match="label:*Database*" \
  --set="shape=cylinder3;boundedLbl=1;backgroundOutline=1;size=15"

# Restyle all edges to use curved routing
/drawio:style architecture.drawio --target=edges \
  --set="curved=1;rounded=1;strokeWidth=1.5"

# Change all fonts to Inter
/drawio:style architecture.drawio --target=all \
  --set="fontFamily=Inter"

# Apply dark mode theme
/drawio:style architecture.drawio --theme=dark-mode

# Apply sketch mode to all shapes
/drawio:style architecture.drawio --target=shapes \
  --set="sketch=1;curveFitting=1;jiggle=2"
```

---

## Style Inheritance and Consistency Checking

### Consistency Checker

Validate that all elements of the same semantic type share consistent styles:

```python
#!/usr/bin/env python3
"""Check style consistency across diagram elements."""

import xml.etree.ElementTree as ET
import sys
from collections import defaultdict

CONSISTENCY_PROPERTIES = [
    "fillColor", "strokeColor", "fontColor", "fontSize",
    "fontFamily", "fontStyle", "rounded", "arcSize",
    "shadow", "strokeWidth",
]

def check_consistency(drawio_path):
    tree = ET.parse(drawio_path)
    root = tree.getroot()

    # Group cells by their semantic type (based on shape and label patterns)
    groups = defaultdict(list)
    for cell in root.iter("mxCell"):
        if cell.get("vertex") != "1":
            continue
        style = cell.get("style", "")
        label = cell.get("value", "")

        # Categorize by shape type
        if "cylinder" in style:
            groups["database"].append((cell, style))
        elif "ellipse" in style:
            groups["circle"].append((cell, style))
        elif "rhombus" in style:
            groups["decision"].append((cell, style))
        elif "swimlane" in style:
            groups["container"].append((cell, style))
        else:
            groups["rectangle"].append((cell, style))

    issues = []
    for group_name, cells in groups.items():
        if len(cells) < 2:
            continue

        # Check each consistency property
        for prop in CONSISTENCY_PROPERTIES:
            values = set()
            for cell, style in cells:
                props = dict(p.split("=", 1) for p in style.split(";")
                           if "=" in p)
                val = props.get(prop, "(default)")
                values.add(val)

            if len(values) > 1:
                issues.append({
                    "group": group_name,
                    "property": prop,
                    "values": values,
                    "count": len(cells),
                })

    if issues:
        print(f"Found {len(issues)} style inconsistencies:")
        for issue in issues:
            vals = ", ".join(issue["values"])
            print(f"  {issue['group']} ({issue['count']} cells): "
                  f"{issue['property']} has {len(issue['values'])} different values: {vals}")
    else:
        print("All element groups have consistent styles.")

    return issues

if __name__ == "__main__":
    check_consistency(sys.argv[1])
```

---

## Usage Examples

```bash
# Apply the Professional theme
/drawio:style architecture.drawio --theme=professional

# Apply Dark Mode theme
/drawio:style architecture.drawio --theme=dark-mode

# Apply Sketch hand-drawn style
/drawio:style architecture.drawio --theme=sketch

# Apply Blueprint technical theme
/drawio:style architecture.drawio --theme=blueprint

# Apply Corporate formal theme
/drawio:style architecture.drawio --theme=corporate

# Check style consistency
/drawio:style architecture.drawio --check-consistency

# Bulk change a specific property
/drawio:style architecture.drawio --target=shapes --set="rounded=1;arcSize=10"

# Copy style from one cell to others
/drawio:style architecture.drawio --copy-from=svc-api --copy-to="svc-auth,svc-db,svc-cache"
```
