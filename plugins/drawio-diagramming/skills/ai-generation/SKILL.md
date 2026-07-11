---
description: "AI-powered diagram generation using draw.io's built-in AI features and LLM integration"
triggers:
  - ai diagram
  - generate diagram
  - ai drawio
  - smart diagram
  - auto generate
  - vibe diagramming
globs:
  - "**/*.drawio"
  - "**/*.drawio.svg"
---

# AI-Powered Diagram Generation

## draw.io Built-in AI Generate Tool

draw.io includes a native AI diagram generation feature accessible from the editor.

### Accessing the AI Generator

1. Open draw.io (app.diagrams.net or desktop)
2. Click **Extras > AI Diagram** or the AI icon in the toolbar
3. Enter a natural language prompt
4. Select the AI model/provider
5. Click **Generate**

### Supported AI Models

| Provider | Models | Notes |
|----------|--------|-------|
| Google Gemini | 2.0 Flash, 2.5 Pro, 2.5 Flash | Free tier available |
| Anthropic Claude | 3.7 Sonnet, 4.0 Sonnet, 4.5 Sonnet | Requires API key |
| OpenAI GPT | 4o, 4.1, 4.1-mini, 5.1 | Requires API key |

### Configuration

Configure AI in draw.io via **Extras > Configuration** (JSON editor):

```json
{
  "enableAi": true,
  "gptApiKey": "sk-...",
  "geminiApiKey": "AIza...",
  "claudeApiKey": "sk-ant-...",
  "defaultAiModel": "claude-sonnet-5"
}
```

Or set via URL parameters:
```
https://app.diagrams.net/?enableAi=1
```

### AI Actions

| Action | Description |
|--------|-------------|
| `createPublic` | Generate a new public diagram from prompt |
| `create` | Generate a new diagram (private) |
| `update` | Modify an existing diagram based on instructions |
| `assist` | Get suggestions for improving the current diagram |

### Custom LLM Backend

Point draw.io to a custom/self-hosted LLM endpoint:

```json
{
  "enableAi": true,
  "aiBaseUrl": "https://your-llm-proxy.example.com/v1",
  "aiApiKey": "your-key",
  "aiModel": "your-model-name"
}
```

The endpoint must be compatible with the OpenAI Chat Completions API format.

---

## AI Diagram Generation Best Practices

### Use Simplified mxGraphModel Format

When generating diagrams via LLM, always use the simplified format without the `mxfile` wrapper. This reduces complexity and error rates:

```xml
<!-- CORRECT: Simplified format for AI generation -->
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <!-- diagram content -->
  </root>
</mxGraphModel>
```

```xml
<!-- AVOID: Full mxfile wrapper adds unnecessary complexity -->
<mxfile host="..." modified="..." agent="..." version="..." type="...">
  <diagram id="..." name="...">
    <mxGraphModel dx="..." dy="..." grid="..." ...>
      <root>
        <!-- diagram content -->
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

### Always Include Structural Cells

Every generated diagram must start with the two mandatory structural cells:

```xml
<mxCell id="0"/>                <!-- Root cell -->
<mxCell id="1" parent="0"/>     <!-- Default layer -->
```

Omitting these causes the diagram to fail to load.

### Use Uncompressed XML

Always output uncompressed, human-readable XML. Never generate the base64-compressed format that draw.io uses internally for storage. draw.io imports uncompressed XML without issue.

### Reference Valid Style Properties

Only use documented style property names. Common mistakes:

| Wrong | Correct |
|-------|---------|
| `fill` | `fillColor` |
| `stroke` | `strokeColor` |
| `color` | `fontColor` |
| `border` | `strokeWidth` |
| `background` | `fillColor` |
| `bold` | `fontStyle=1` |
| `italic` | `fontStyle=2` |
| `font-size` | `fontSize` |
| `text-align` | `align` |
| `border-radius` | `rounded=1;arcSize=N;` |

### Ensure Unique IDs

Every cell must have a unique `id`. Use descriptive IDs for clarity:

```xml
<!-- GOOD: Descriptive IDs -->
<mxCell id="api-gateway" value="API Gateway" .../>
<mxCell id="auth-service" value="Auth Service" .../>
<mxCell id="edge-gw-to-auth" edge="1" source="api-gateway" target="auth-service" .../>

<!-- ACCEPTABLE: Sequential IDs -->
<mxCell id="2" value="API Gateway" .../>
<mxCell id="3" value="Auth Service" .../>
<mxCell id="e1" edge="1" source="2" target="3" .../>

<!-- BAD: Duplicate IDs -->
<mxCell id="node" value="API Gateway" .../>
<mxCell id="node" value="Auth Service" .../>  <!-- DUPLICATE -->
```

### Match Perimeter to Shape

When using non-rectangular shapes, set the matching perimeter:

| Shape | Required Perimeter |
|-------|-------------------|
| `shape=ellipse` | `perimeter=ellipsePerimeter` |
| `shape=rhombus` | `perimeter=rhombusPerimeter` |
| `shape=hexagon` | `perimeter=hexagonPerimeter2` |
| `shape=triangle` | `perimeter=trianglePerimeter` |
| `shape=parallelogram` | `perimeter=parallelogramPerimeter` |
| `shape=trapezoid` | `perimeter=trapezoidPerimeter` |
| `shape=step` | `perimeter=stepPerimeter` |

Mismatched perimeters cause connection points to appear in wrong positions.

---

## Prompt Engineering for Diagram Generation

### Effective Prompt Structure

A good diagram generation prompt includes:

1. **Diagram type**: Explicitly state what kind of diagram
2. **Entities/components**: List the key elements
3. **Relationships**: Describe how elements connect
4. **Style preferences**: Colors, themes, layout direction
5. **Detail level**: High-level overview vs. detailed implementation

### Example Prompts

#### System Architecture
```
Create a cloud architecture diagram showing:
- A React frontend hosted on CloudFront/S3
- API Gateway routing to Lambda functions
- Lambda connects to DynamoDB and S3
- SQS queue between Lambda and a worker Lambda
- All inside a VPC with public and private subnets
- Use AWS icon shapes
- Blue color scheme, orthogonal edge routing
```

#### Sequence Diagram
```
Create a UML sequence diagram for OAuth 2.0 authorization code flow:
- Participants: User, Client App, Auth Server, Resource Server
- Steps: authorization request, user login, auth code, token exchange, API call
- Show the redirect steps clearly
- Use dashed lines for responses
- Include activation boxes on Auth Server
```

#### Flowchart
```
Create a flowchart for a CI/CD pipeline:
- Start with code push
- Run linting and unit tests in parallel
- If tests pass, build Docker image
- Push to container registry
- Deploy to staging
- Run integration tests
- If pass, require manual approval
- Deploy to production
- End
- Use green for success paths, red for failure paths
- Horizontal swimlanes: Dev, CI, Staging, Production
```

#### ER Diagram
```
Create an ER diagram with Crow's foot notation for an e-commerce database:
- Tables: users, products, orders, order_items, categories, reviews
- Show primary keys, foreign keys, and key columns
- Users have many orders (1:N)
- Orders have many order_items (1:N)
- Products have many order_items (M:N through order_items)
- Products belong to categories (N:1)
- Users write reviews on products (M:N through reviews)
- Use table-style entity boxes with column lists
```

### Prompt Anti-Patterns

| Avoid | Why | Better |
|-------|-----|--------|
| "Make a diagram" | Too vague, no type specified | "Create a UML sequence diagram for..." |
| "Show everything" | Too broad, overwhelms the diagram | "Show the top-level components and their connections" |
| "Make it look nice" | Subjective, no actionable direction | "Use blue fill (#dae8fc), rounded corners, orthogonal edges" |
| "Add all the details" | Overloads the diagram | "Include service names, protocols, and port numbers" |
| Describing in paragraphs | Hard to extract structure | Use bullet points for entities and relationships |

---

## LLM-Generated Diagram Validation

### Validation Checklist

After generating a diagram, verify all of the following:

```
[ ] 1. Structural cells: id="0" (root) and id="1" (default layer) exist
[ ] 2. All IDs are unique across the entire document
[ ] 3. Every vertex has vertex="1" and mxGeometry with width/height
[ ] 4. Every edge has edge="1" and mxGeometry with relative="1"
[ ] 5. Edge source/target IDs reference existing vertex cells
[ ] 6. Parent references point to existing cells
[ ] 7. Style properties use exact camelCase names (fillColor not fill-color)
[ ] 8. Perimeter type matches shape type
[ ] 9. HTML labels have proper XML escaping (&lt; &gt; &amp;)
[ ] 10. Shapes don't overlap (distinct x, y positions)
[ ] 11. Shapes have reasonable dimensions (40-300px width, 30-200px height)
[ ] 12. Text is readable (fontSize >= 10 for labels)
[ ] 13. Colors are valid hex codes (#RRGGBB format)
[ ] 14. Edge routing style is specified for non-trivial diagrams
```

### Automated Validation Script

```python
#!/usr/bin/env python3
"""validate_drawio.py - Validate AI-generated draw.io XML."""

import xml.etree.ElementTree as ET
import sys
import re


def validate_drawio(xml_string: str) -> list[str]:
    """Validate draw.io XML and return list of errors."""
    errors = []

    try:
        root = ET.fromstring(xml_string)
    except ET.ParseError as e:
        return [f'XML parse error: {e}']

    # Find the root element containing cells
    if root.tag == 'mxfile':
        models = root.findall('.//mxGraphModel')
    elif root.tag == 'mxGraphModel':
        models = [root]
    else:
        return [f'Unknown root element: {root.tag}']

    for model in models:
        root_elem = model.find('root')
        if root_elem is None:
            errors.append('Missing <root> element inside mxGraphModel')
            continue

        cells = {}
        for cell in root_elem.iter('mxCell'):
            cell_id = cell.get('id')
            if cell_id is None:
                errors.append('mxCell missing id attribute')
                continue
            if cell_id in cells:
                errors.append(f'Duplicate cell id: {cell_id}')
            cells[cell_id] = cell

        # Also collect object-wrapped cells
        for obj in root_elem.iter('object'):
            obj_id = obj.get('id')
            if obj_id is None:
                errors.append('object element missing id attribute')
                continue
            if obj_id in cells:
                errors.append(f'Duplicate id (object): {obj_id}')
            inner = obj.find('mxCell')
            if inner is not None:
                cells[obj_id] = inner

        # Check structural cells
        if '0' not in cells:
            errors.append('Missing structural cell id="0" (root)')
        if '1' not in cells:
            errors.append('Missing structural cell id="1" (default layer)')

        # Validate each cell
        for cell_id, cell in cells.items():
            if cell_id in ('0', '1'):
                continue

            is_vertex = cell.get('vertex') == '1'
            is_edge = cell.get('edge') == '1'

            # Check parent reference
            parent = cell.get('parent')
            if parent and parent not in cells:
                errors.append(
                    f'Cell {cell_id}: parent "{parent}" does not exist')

            if is_vertex:
                geo = cell.find('mxGeometry')
                if geo is None:
                    errors.append(
                        f'Vertex {cell_id}: missing mxGeometry')
                else:
                    w = geo.get('width')
                    h = geo.get('height')
                    if not w or not h:
                        errors.append(
                            f'Vertex {cell_id}: missing width/height')

            if is_edge:
                source = cell.get('source')
                target = cell.get('target')
                if source and source not in cells:
                    errors.append(
                        f'Edge {cell_id}: source "{source}" does not exist')
                if target and target not in cells:
                    errors.append(
                        f'Edge {cell_id}: target "{target}" does not exist')

                geo = cell.find('mxGeometry')
                if geo is None:
                    errors.append(
                        f'Edge {cell_id}: missing mxGeometry')
                elif geo.get('relative') != '1':
                    errors.append(
                        f'Edge {cell_id}: mxGeometry missing relative="1"')

            # Validate style
            style = cell.get('style', '')
            if style:
                # Check for common misspellings
                misspellings = {
                    'fill=': 'fillColor=',
                    'stroke=': 'strokeColor=',
                    'color=': 'fontColor=',
                    'font-size=': 'fontSize=',
                    'font-family=': 'fontFamily=',
                    'font-color=': 'fontColor=',
                    'fill-color=': 'fillColor=',
                    'stroke-color=': 'strokeColor=',
                    'stroke-width=': 'strokeWidth=',
                    'border-radius=': 'arcSize=',
                    'text-align=': 'align=',
                }
                for wrong, correct in misspellings.items():
                    if wrong in style and correct not in style:
                        errors.append(
                            f'Cell {cell_id}: style uses "{wrong}" '
                            f'instead of "{correct}"')

                # Check color format
                color_props = re.findall(
                    r'(?:fill|stroke|font)Color=#([0-9a-fA-F]*)', style)
                for color in color_props:
                    if len(color) not in (3, 6, 8):
                        errors.append(
                            f'Cell {cell_id}: invalid color #{color}')

    return errors


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python validate_drawio.py <file.drawio>')
        sys.exit(1)

    with open(sys.argv[1]) as f:
        content = f.read()

    errors = validate_drawio(content)
    if errors:
        print(f'INVALID: {len(errors)} error(s) found:')
        for e in errors:
            print(f'  - {e}')
        sys.exit(1)
    else:
        print('VALID: No errors found')
        sys.exit(0)
```

---

## "Vibe Diagramming" Concept

Vibe Diagramming is a conversational, iterative approach to creating diagrams with AI. Instead of precise specifications, you describe what you want in natural language and refine through conversation.

### Workflow

1. **Describe loosely**: "I need a diagram showing how our microservices talk to each other"
2. **AI generates first draft**: Creates initial diagram based on interpretation
3. **Refine iteratively**:
   - "Add a message queue between the order service and notification service"
   - "Make the database shapes use cylinder icons"
   - "Color the external services gray"
   - "Add a load balancer in front of the API gateway"
4. **AI updates diagram**: Each refinement modifies the existing XML
5. **Polish**: "Align everything on a grid, add a title, improve spacing"

### Key Principles

- Start broad, add detail iteratively
- Each refinement step should be small and focused
- Describe the "what" not the "how" (the AI handles XML details)
- Review the visual output at each step before continuing
- Save intermediate versions for rollback

### Effective Refinement Prompts

```
"Move the database to the right side"
"Add arrows showing the data flow direction"
"Group the frontend services into a container labeled 'Presentation Layer'"
"Change all service boxes to use rounded corners and blue fill"
"Add labels on the edges showing the protocol (REST, gRPC, AMQP)"
"Make this look more like a hand-drawn sketch (enable sketch mode)"
"Add a legend in the bottom-right corner"
```

---

## Self-Editing Workflow

A structured approach for AI agents to iteratively improve diagram quality:

### Step 1: Generate Initial Diagram

```
Prompt: Create a [diagram type] showing [description]
Output: First-pass XML
```

### Step 2: Analyze Layout

Check the generated diagram for:
- Overlapping shapes
- Uneven spacing
- Missing connections
- Poor alignment
- Readability issues
- Missing labels

### Step 3: Identify Improvements

Common improvements:
- **Spacing**: Ensure minimum 40px gap between shapes
- **Alignment**: Snap to grid (multiples of 10px)
- **Flow direction**: Ensure consistent top-to-bottom or left-to-right flow
- **Color consistency**: Apply consistent color scheme
- **Label placement**: Ensure all edges have labels where meaningful
- **Container grouping**: Group related elements
- **Legend**: Add color/icon legend if using status colors

### Step 4: Regenerate Improved Version

Apply identified improvements and regenerate the XML.

### Step 5: Validate

Run the validation script to catch structural errors.

### Step 6: Repeat

Continue until quality threshold is met (typically 2-3 iterations).

### Auto-Layout Algorithm

For programmatic layout improvement:

```python
def auto_layout_grid(cells: list, columns: int = 3,
                     cell_width: int = 160, cell_height: int = 80,
                     h_gap: int = 60, v_gap: int = 60,
                     start_x: int = 50, start_y: int = 50) -> list:
    """
    Arrange cells in a grid layout.
    Returns list of (cell_id, x, y) tuples.
    """
    positions = []
    for i, cell in enumerate(cells):
        col = i % columns
        row = i // columns
        x = start_x + col * (cell_width + h_gap)
        y = start_y + row * (cell_height + v_gap)
        positions.append((cell['id'], x, y))
    return positions


def auto_layout_tree(root_id: str, children: dict,
                     cell_width: int = 160, cell_height: int = 60,
                     h_gap: int = 40, v_gap: int = 80,
                     start_x: int = 400, start_y: int = 50) -> dict:
    """
    Arrange cells in a top-down tree layout.
    children: dict mapping parent_id -> [child_ids]
    Returns dict of cell_id -> (x, y).
    """
    positions = {}
    level_counts = {}

    def count_leaves(node_id):
        kids = children.get(node_id, [])
        if not kids:
            return 1
        return sum(count_leaves(k) for k in kids)

    def layout(node_id, level, left_x):
        kids = children.get(node_id, [])
        if not kids:
            x = left_x
            y = start_y + level * (cell_height + v_gap)
            positions[node_id] = (x, y)
            return left_x + cell_width + h_gap

        child_left = left_x
        for kid in kids:
            child_left = layout(kid, level + 1, child_left)

        # Center parent over children
        first_child_x = positions[kids[0]][0]
        last_child_x = positions[kids[-1]][0]
        parent_x = (first_child_x + last_child_x) // 2
        y = start_y + level * (cell_height + v_gap)
        positions[node_id] = (parent_x, y)
        return child_left

    layout(root_id, 0, start_x - (count_leaves(root_id) *
           (cell_width + h_gap)) // 2)
    return positions
```

---

## MCP Server Integration for AI Diagramming

When using draw.io with an MCP server (see mcp-integration skill), AI agents can programmatically create and modify diagrams through tool calls rather than generating raw XML.

### Workflow with MCP Tools

1. Agent receives request: "Create an architecture diagram"
2. Agent calls MCP tool to create shapes
3. Agent calls MCP tool to create edges between shapes
4. Agent calls MCP tool to set styles
5. Result: Diagram is built incrementally through the MCP API

This approach is less error-prone than generating full XML, as the MCP server handles validation and structure.

### Hybrid Approach

For complex diagrams, combine approaches:
1. Generate the full XML structure using LLM knowledge
2. Validate with the validation script
3. Import into draw.io via MCP for fine-tuning
4. Export final version

---

## Common AI Generation Errors and Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| Blank diagram | Missing structural cells | Add `id="0"` and `id="1"` cells |
| Shapes don't connect | Edge source/target reference wrong IDs | Verify edge source/target match vertex IDs |
| Invisible shapes | Missing `vertex="1"` | Add `vertex="1"` to all shape cells |
| Edges render as shapes | Missing `edge="1"` | Add `edge="1"` to connector cells |
| Connections attach to wrong spot | Perimeter mismatch | Match perimeter to shape type |
| Text not visible | `fontColor` same as `fillColor` | Use contrasting colors |
| Shapes stacked on origin | All x=0, y=0 | Set distinct x, y coordinates |
| Style not applied | Typo in property name | Use exact camelCase names from reference |
| HTML tags visible | Missing `html=1` | Add `html=1` to style string |
| Overlapping labels | No `whiteSpace=wrap` | Add `whiteSpace=wrap;html=1;` |
| XML parse error | Unescaped characters in labels | Escape `<>&"` in value attributes |
