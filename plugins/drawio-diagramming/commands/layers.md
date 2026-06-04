---
name: drawio:layers
intent: Manage diagram layers for complex multi-layered visualizations
tags:
  - drawio-diagramming
  - command
  - layers
inputs: []
risk: low
cost: low
description: |
  Manage draw.io diagram layers for organizing complex multi-layered visualizations. Create, toggle, lock, reorder, and export layers. Includes templates for infrastructure, application, C4, DevOps, and security layer patterns. Supports cross-layer connections, collapsible groups, layer-based selective export, and z-index management.
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
  - Edit
---

# drawio:layers

Manage diagram layers for complex multi-layered visualizations. Layers allow you to
organize diagram elements into logical groups that can be independently shown, hidden,
locked, and exported. This is essential for complex architecture diagrams where different
audiences need to see different levels of detail.

---

## Flags

| Flag | Alias | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--name <text>` | `-n` | string | none | Layer name for create, rename, or target operations |
| `--id <id>` | | string | auto-generated | Explicit layer ID (defaults to slugified name) |
| `--create` | `-c` | boolean | `false` | Create a new layer with the given name |
| `--delete <id>` | `-d` | string | none | Delete a layer by ID (moves orphaned elements to default layer) |
| `--locked` | `-L` | boolean | `false` | Set the layer as locked (not editable in draw.io) |
| `--hidden` | `-H` | boolean | `false` | Set the layer as hidden (not visible in draw.io) |
| `--elements <ids>` | `-e` | string | none | Comma-separated cell IDs to assign to the layer |
| `--to <layer-id>` | `-t` | string | none | Target layer for move operations |
| `--reorder <ids>` | `-r` | string | none | Comma-separated layer IDs in desired z-order (bottom to top) |
| `--merge-layers <ids>` | `-m` | string | none | Merge multiple layers into one (comma-separated IDs) |
| `--preset <name>` | `-p` | string | none | Apply a layer preset template (infra, c4, devops, security, app) |
| `--template <name>` | `-T` | string | none | Alias for --preset |
| `--layers <names>` | `-l` | string | none | Comma-separated layer names to create in bulk |
| `--output <path>` | `-o` | string | in-place | Write result to a different file |
| `--interactive` | `-i` | boolean | `false` | Interactive mode: prompt for layer assignments |
| `--verbose` | `-v` | boolean | `false` | Show detailed layer operations and element counts |
| `--dry-run` | | boolean | `false` | Preview layer changes without modifying files |

### Flag Details

#### Layer Creation & Deletion Flags
- **`--create`** (`-c`): Create a new layer. Requires `--name`. Optionally use `--id` for a custom ID, `--locked` to lock, and `--hidden` to hide. Example: `--create --name "Security" --locked`.
- **`--delete <id>`** (`-d`): Remove a layer by ID. All elements on the deleted layer are moved to the default layer (id="1") to prevent orphaning. Cannot delete the default layer.
- **`--layers <names>`** (`-l`): Bulk-create multiple layers. Example: `--layers "Infrastructure,Application,Data,Security"` creates four layers in one operation.

#### Layer Properties Flags
- **`--name <text>`** (`-n`): The display name for the layer. Used with `--create` or to rename an existing layer when combined with `--id`.
- **`--id <id>`**: Explicit XML id attribute. When omitted, the ID is auto-generated from the slugified name (e.g., "Security Overlay" becomes "layer-security-overlay").
- **`--locked`** (`-L`): Make the layer read-only. Locked layers cannot be edited in the draw.io UI. Adds `style="locked=1"` to the layer cell.
- **`--hidden`** (`-H`): Make the layer invisible. Hidden layers are not rendered in exports unless explicitly toggled. Sets `visible="0"` on the layer cell.

#### Element Assignment Flags
- **`--elements <ids>`** (`-e`): Move specific elements to a layer. Used with `--to` to specify the target layer. Example: `--elements "svc-api,svc-db,svc-cache" --to "layer-data"`.
- **`--to <layer-id>`** (`-t`): Target layer for move operations. Combined with `--elements` to reassign cells, or used alone to specify the destination for `--merge-layers`.

#### Organization Flags
- **`--reorder <ids>`** (`-r`): Set the z-order of layers. Layers listed first appear below layers listed later. Example: `--reorder "layer-infra,layer-app,layer-security"` puts infrastructure at the bottom and security on top.
- **`--merge-layers <ids>`** (`-m`): Combine multiple layers into a single layer. All elements are reparented to the first layer in the list. The other layers are deleted. Example: `--merge-layers "layer-network,layer-infra"`.

#### Preset & Template Flags
- **`--preset <name>`** (`-p`): Apply a predefined layer structure. Available presets:
  - `infra`: Network, Compute, Storage, Security
  - `c4`: Context, Container, Component, Code
  - `devops`: CI/CD, Monitoring, Logging, Infrastructure
  - `security`: Network Security, Identity, Data Protection, Compliance
  - `app`: Frontend, Backend, Database, External Services

#### Behavior Flags
- **`--output <path>`** (`-o`): Write the modified diagram to a new file instead of editing in-place.
- **`--interactive`** (`-i`): Step through each element and prompt for layer assignment. Useful for initial layer organization of a flat diagram.
- **`--verbose`** (`-v`): Show layer creation details, element counts per layer, and z-order changes.
- **`--dry-run`**: Preview all layer operations without writing to any file.

#### Examples with Flags

```bash
# Create a new locked security layer
drawio:layers architecture.drawio --create --name "Security" --locked

# Bulk create layers from preset
drawio:layers architecture.drawio --preset infra

# Move elements to a specific layer
drawio:layers architecture.drawio --elements "svc-api,svc-db" --to "layer-data"

# Reorder layers (bottom to top)
drawio:layers architecture.drawio --reorder "layer-infra,layer-app,layer-security"

# Delete a layer (elements moved to default)
drawio:layers architecture.drawio --delete "layer-temp"

# Merge layers
drawio:layers architecture.drawio --merge-layers "layer-network,layer-infra" --verbose

# Interactive layer assignment
drawio:layers architecture.drawio --interactive

# Preview layer changes
drawio:layers architecture.drawio --preset c4 --dry-run
```

## How Layers Work in draw.io XML

### Layer Structure

In draw.io, layers are `<mxCell>` elements with `parent="0"`. The default layer always
has `id="1"`. Additional layers are added as sibling cells, each with `parent="0"`.
All diagram content cells reference their layer via the `parent` attribute.

```xml
<mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1" tooltips="1"
              connect="1" arrows="1" fold="1" page="1" pageScale="1"
              pageWidth="1169" pageHeight="827">
  <root>
    <!-- Root cell (always present, id="0") -->
    <mxCell id="0"/>

    <!-- Layer 1: Default layer (always present, id="1") -->
    <mxCell id="1" parent="0"/>

    <!-- Layer 2: Custom layer -->
    <mxCell id="layer-network" value="Network" parent="0"/>

    <!-- Layer 3: Another custom layer -->
    <mxCell id="layer-compute" value="Compute" parent="0"/>

    <!-- Layer 4: Locked and hidden layer -->
    <mxCell id="layer-security" value="Security" style="locked=1" parent="0" visible="0"/>

    <!-- Content on default layer -->
    <mxCell id="box-1" value="Element on Default Layer"
            style="rounded=1;fillColor=#dae8fc;strokeColor=#6c8ebf;"
            vertex="1" parent="1">
      <mxGeometry x="100" y="100" width="160" height="60" as="geometry"/>
    </mxCell>

    <!-- Content on Network layer -->
    <mxCell id="net-1" value="Load Balancer"
            style="rounded=1;fillColor=#d5e8d4;strokeColor=#82b366;"
            vertex="1" parent="layer-network">
      <mxGeometry x="100" y="200" width="160" height="60" as="geometry"/>
    </mxCell>

    <!-- Content on Compute layer -->
    <mxCell id="vm-1" value="App Server"
            style="rounded=1;fillColor=#fff2cc;strokeColor=#d6b656;"
            vertex="1" parent="layer-compute">
      <mxGeometry x="100" y="300" width="160" height="60" as="geometry"/>
    </mxCell>

    <!-- Content on Security layer -->
    <mxCell id="fw-1" value="Firewall Rule"
            style="rounded=1;fillColor=#f8cecc;strokeColor=#b85450;"
            vertex="1" parent="layer-security">
      <mxGeometry x="100" y="400" width="160" height="60" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>
```

### Key Rules

1. The root cell `id="0"` is always the first element and serves as the document root.
2. Layer cells have `parent="0"` and an optional `value` attribute for the layer name.
3. The default layer `id="1"` is always present and cannot be deleted.
4. Content cells reference their layer via `parent="<layer-id>"`.
5. Edges can span layers by having their source on one layer and target on another.
6. Layer order in the XML determines z-index (later = on top).

---

## Layer Creation

### Adding a New Layer

To add a layer, insert a new `<mxCell>` with `parent="0"` after the existing layers:

```xml
<!-- Add a new "Monitoring" layer -->
<mxCell id="layer-monitoring" value="Monitoring" parent="0"/>
```

### Layer Creation Script

```python
#!/usr/bin/env python3
"""Add a new layer to a draw.io diagram."""

import xml.etree.ElementTree as ET
import sys

def add_layer(drawio_path, layer_id, layer_name, visible=True, locked=False):
    tree = ET.parse(drawio_path)
    root_element = tree.getroot()

    # Find the <root> element inside the diagram
    for diagram in root_element.iter("diagram"):
        graph_model = diagram.find("mxGraphModel")
        if graph_model is None:
            continue
        xml_root = graph_model.find("root")
        if xml_root is None:
            continue

        # Check if layer already exists
        for cell in xml_root.findall("mxCell"):
            if cell.get("id") == layer_id:
                print(f"Layer '{layer_id}' already exists")
                return

        # Create the new layer cell
        layer_cell = ET.SubElement(xml_root, "mxCell")
        layer_cell.set("id", layer_id)
        layer_cell.set("value", layer_name)
        layer_cell.set("parent", "0")

        if not visible:
            layer_cell.set("visible", "0")

        if locked:
            style = "locked=1"
            layer_cell.set("style", style)

        print(f"Added layer: {layer_name} (id={layer_id}, visible={visible}, locked={locked})")

    tree.write(drawio_path, xml_declaration=True, encoding="UTF-8")

if __name__ == "__main__":
    add_layer(
        drawio_path=sys.argv[1],
        layer_id=sys.argv[2],
        layer_name=sys.argv[3],
        visible="--hidden" not in sys.argv,
        locked="--locked" in sys.argv,
    )
```

### Batch Layer Creation

Create multiple layers at once for a standard architecture pattern:

```python
#!/usr/bin/env python3
"""Create a standard set of layers for an architecture diagram."""

import xml.etree.ElementTree as ET
import sys

LAYER_SETS = {
    "infrastructure": [
        {"id": "layer-network",    "name": "Network",    "color": "#d5e8d4"},
        {"id": "layer-compute",    "name": "Compute",    "color": "#dae8fc"},
        {"id": "layer-storage",    "name": "Storage",    "color": "#fff2cc"},
        {"id": "layer-security",   "name": "Security",   "color": "#f8cecc"},
    ],
    "application": [
        {"id": "layer-frontend",   "name": "Frontend",   "color": "#d5e8d4"},
        {"id": "layer-api",        "name": "API",        "color": "#dae8fc"},
        {"id": "layer-services",   "name": "Services",   "color": "#fff2cc"},
        {"id": "layer-database",   "name": "Database",   "color": "#e1d5e7"},
    ],
    "c4": [
        {"id": "layer-context",    "name": "Context",    "color": "#d5e8d4"},
        {"id": "layer-container",  "name": "Container",  "color": "#dae8fc"},
        {"id": "layer-component",  "name": "Component",  "color": "#fff2cc"},
        {"id": "layer-code",       "name": "Code",       "color": "#f8cecc"},
    ],
    "devops": [
        {"id": "layer-source",     "name": "Source",     "color": "#d5e8d4"},
        {"id": "layer-build",      "name": "Build",      "color": "#dae8fc"},
        {"id": "layer-test",       "name": "Test",       "color": "#fff2cc"},
        {"id": "layer-deploy",     "name": "Deploy",     "color": "#e1d5e7"},
        {"id": "layer-monitor",    "name": "Monitor",    "color": "#f8cecc"},
    ],
    "security": [
        {"id": "layer-perimeter",  "name": "Perimeter",  "color": "#f8cecc"},
        {"id": "layer-net-sec",    "name": "Network",    "color": "#fff2cc"},
        {"id": "layer-app-sec",    "name": "Application","color": "#dae8fc"},
        {"id": "layer-data-sec",   "name": "Data",       "color": "#d5e8d4"},
    ],
}

def create_layer_set(drawio_path, layer_set_name):
    if layer_set_name not in LAYER_SETS:
        print(f"Unknown layer set: {layer_set_name}")
        print(f"Available: {', '.join(LAYER_SETS.keys())}")
        sys.exit(1)

    layers = LAYER_SETS[layer_set_name]
    tree = ET.parse(drawio_path)
    root_element = tree.getroot()

    for diagram in root_element.iter("diagram"):
        graph_model = diagram.find("mxGraphModel")
        if graph_model is None:
            continue
        xml_root = graph_model.find("root")
        if xml_root is None:
            continue

        for layer_def in layers:
            # Check if layer already exists
            exists = False
            for cell in xml_root.findall("mxCell"):
                if cell.get("id") == layer_def["id"]:
                    exists = True
                    break

            if exists:
                print(f"  SKIP: {layer_def['name']} (already exists)")
                continue

            layer_cell = ET.SubElement(xml_root, "mxCell")
            layer_cell.set("id", layer_def["id"])
            layer_cell.set("value", layer_def["name"])
            layer_cell.set("parent", "0")
            print(f"  ADD:  {layer_def['name']} (id={layer_def['id']})")

    tree.write(drawio_path, xml_declaration=True, encoding="UTF-8")
    print(f"\nCreated '{layer_set_name}' layer set ({len(layers)} layers)")

if __name__ == "__main__":
    create_layer_set(sys.argv[1], sys.argv[2])
```

---

## Layer Organization Patterns

### Infrastructure Layers

Bottom-up view of infrastructure components, from physical network to security overlays.

```xml
<root>
  <mxCell id="0"/>

  <!-- Layer 1 (bottom): Network infrastructure -->
  <mxCell id="layer-network" value="Network" parent="0"/>

  <!-- Layer 2: Compute resources -->
  <mxCell id="layer-compute" value="Compute" parent="0"/>

  <!-- Layer 3: Storage systems -->
  <mxCell id="layer-storage" value="Storage" parent="0"/>

  <!-- Layer 4 (top): Security overlays -->
  <mxCell id="layer-security" value="Security" parent="0"/>

  <!-- Network layer content -->
  <mxCell id="vpc" value="VPC 10.0.0.0/16"
          style="rounded=1;fillColor=none;strokeColor=#82b366;dashed=1;
                 strokeWidth=2;fontSize=14;fontStyle=1;verticalAlign=top;"
          vertex="1" parent="layer-network">
    <mxGeometry x="40" y="40" width="900" height="500" as="geometry"/>
  </mxCell>

  <mxCell id="subnet-pub" value="Public Subnet&#xa;10.0.1.0/24"
          style="rounded=1;fillColor=#E9F3E6;strokeColor=#82b366;
                 verticalAlign=top;fontSize=11;"
          vertex="1" parent="layer-network">
    <mxGeometry x="60" y="80" width="400" height="200" as="geometry"/>
  </mxCell>

  <mxCell id="subnet-priv" value="Private Subnet&#xa;10.0.2.0/24"
          style="rounded=1;fillColor=#E6F2F8;strokeColor=#6c8ebf;
                 verticalAlign=top;fontSize=11;"
          vertex="1" parent="layer-network">
    <mxGeometry x="500" y="80" width="400" height="200" as="geometry"/>
  </mxCell>

  <!-- Compute layer content -->
  <mxCell id="alb" value="ALB"
          style="rounded=1;fillColor=#dae8fc;strokeColor=#6c8ebf;
                 fontSize=12;fontStyle=1;shadow=1;"
          vertex="1" parent="layer-compute">
    <mxGeometry x="200" y="140" width="120" height="50" as="geometry"/>
  </mxCell>

  <mxCell id="ec2-1" value="EC2 Instance&#xa;t3.large"
          style="rounded=1;fillColor=#dae8fc;strokeColor=#6c8ebf;
                 fontSize=11;shadow=1;"
          vertex="1" parent="layer-compute">
    <mxGeometry x="600" y="120" width="140" height="50" as="geometry"/>
  </mxCell>

  <mxCell id="ec2-2" value="EC2 Instance&#xa;t3.large"
          style="rounded=1;fillColor=#dae8fc;strokeColor=#6c8ebf;
                 fontSize=11;shadow=1;"
          vertex="1" parent="layer-compute">
    <mxGeometry x="600" y="200" width="140" height="50" as="geometry"/>
  </mxCell>

  <!-- Storage layer content -->
  <mxCell id="rds" value="RDS PostgreSQL"
          style="shape=cylinder3;boundedLbl=1;backgroundOutline=1;size=15;
                 fillColor=#fff2cc;strokeColor=#d6b656;fontSize=11;"
          vertex="1" parent="layer-storage">
    <mxGeometry x="600" y="320" width="140" height="80" as="geometry"/>
  </mxCell>

  <mxCell id="s3" value="S3 Bucket"
          style="shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.s3;
                 fillColor=#3F8624;strokeColor=none;fontSize=11;
                 verticalLabelPosition=bottom;verticalAlign=top;"
          vertex="1" parent="layer-storage">
    <mxGeometry x="200" y="340" width="48" height="48" as="geometry"/>
  </mxCell>

  <!-- Security layer content (overlay, initially visible) -->
  <mxCell id="sg-web" value="SG: web-tier"
          style="rounded=1;fillColor=none;strokeColor=#b85450;dashed=1;
                 dashPattern=4 4;strokeWidth=2;fontSize=10;
                 fontColor=#b85450;verticalAlign=bottom;"
          vertex="1" parent="layer-security">
    <mxGeometry x="55" y="70" width="410" height="220" as="geometry"/>
  </mxCell>

  <mxCell id="sg-app" value="SG: app-tier"
          style="rounded=1;fillColor=none;strokeColor=#b85450;dashed=1;
                 dashPattern=4 4;strokeWidth=2;fontSize=10;
                 fontColor=#b85450;verticalAlign=bottom;"
          vertex="1" parent="layer-security">
    <mxGeometry x="495" y="70" width="410" height="350" as="geometry"/>
  </mxCell>

  <!-- Cross-layer connections -->
  <mxCell style="edgeStyle=orthogonalEdgeStyle;rounded=1;strokeWidth=2;
                 endArrow=block;endFill=1;strokeColor=#666;"
          edge="1" source="alb" target="ec2-1" parent="layer-compute">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>

  <mxCell style="edgeStyle=orthogonalEdgeStyle;rounded=1;strokeWidth=2;
                 endArrow=block;endFill=1;strokeColor=#666;"
          edge="1" source="alb" target="ec2-2" parent="layer-compute">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>
</root>
```

### Application Layers

Logical application tiers from UI through data persistence.

```xml
<root>
  <mxCell id="0"/>

  <!-- Layer 1: Frontend / UI -->
  <mxCell id="layer-frontend" value="Frontend" parent="0"/>

  <!-- Layer 2: API Gateway / BFF -->
  <mxCell id="layer-api" value="API" parent="0"/>

  <!-- Layer 3: Business Services -->
  <mxCell id="layer-services" value="Services" parent="0"/>

  <!-- Layer 4: Database / Persistence -->
  <mxCell id="layer-database" value="Database" parent="0"/>

  <!-- Frontend layer -->
  <mxCell id="web-app" value="React Web App"
          style="rounded=1;fillColor=#d5e8d4;strokeColor=#82b366;
                 fontSize=12;fontStyle=1;shadow=1;"
          vertex="1" parent="layer-frontend">
    <mxGeometry x="200" y="40" width="160" height="50" as="geometry"/>
  </mxCell>

  <mxCell id="mobile-app" value="React Native App"
          style="rounded=1;fillColor=#d5e8d4;strokeColor=#82b366;
                 fontSize=12;fontStyle=1;shadow=1;"
          vertex="1" parent="layer-frontend">
    <mxGeometry x="500" y="40" width="160" height="50" as="geometry"/>
  </mxCell>

  <!-- API layer -->
  <mxCell id="api-gw" value="API Gateway&#xa;(Kong)"
          style="rounded=1;fillColor=#dae8fc;strokeColor=#6c8ebf;
                 fontSize=12;fontStyle=1;shadow=1;"
          vertex="1" parent="layer-api">
    <mxGeometry x="340" y="140" width="180" height="50" as="geometry"/>
  </mxCell>

  <!-- Services layer -->
  <mxCell id="auth-svc" value="Auth Service"
          style="rounded=1;fillColor=#fff2cc;strokeColor=#d6b656;
                 fontSize=11;fontStyle=1;"
          vertex="1" parent="layer-services">
    <mxGeometry x="100" y="260" width="140" height="50" as="geometry"/>
  </mxCell>

  <mxCell id="order-svc" value="Order Service"
          style="rounded=1;fillColor=#fff2cc;strokeColor=#d6b656;
                 fontSize=11;fontStyle=1;"
          vertex="1" parent="layer-services">
    <mxGeometry x="300" y="260" width="140" height="50" as="geometry"/>
  </mxCell>

  <mxCell id="payment-svc" value="Payment Service"
          style="rounded=1;fillColor=#fff2cc;strokeColor=#d6b656;
                 fontSize=11;fontStyle=1;"
          vertex="1" parent="layer-services">
    <mxGeometry x="500" y="260" width="140" height="50" as="geometry"/>
  </mxCell>

  <!-- Database layer -->
  <mxCell id="pg-db" value="PostgreSQL"
          style="shape=cylinder3;boundedLbl=1;backgroundOutline=1;size=15;
                 fillColor=#e1d5e7;strokeColor=#9673a6;fontSize=11;"
          vertex="1" parent="layer-database">
    <mxGeometry x="200" y="380" width="120" height="80" as="geometry"/>
  </mxCell>

  <mxCell id="redis-db" value="Redis Cache"
          style="shape=cylinder3;boundedLbl=1;backgroundOutline=1;size=15;
                 fillColor=#e1d5e7;strokeColor=#9673a6;fontSize=11;"
          vertex="1" parent="layer-database">
    <mxGeometry x="500" y="380" width="120" height="80" as="geometry"/>
  </mxCell>
</root>
```

### C4 Model Layers

The C4 model defines four levels of abstraction: Context, Container, Component, and Code.
Each level can be a separate layer in a single diagram.

```xml
<root>
  <mxCell id="0"/>

  <!-- C4 Level 1: System Context -->
  <mxCell id="layer-context" value="System Context (L1)" parent="0"/>

  <!-- C4 Level 2: Container -->
  <mxCell id="layer-container" value="Container (L2)" parent="0" visible="0"/>

  <!-- C4 Level 3: Component -->
  <mxCell id="layer-component" value="Component (L3)" parent="0" visible="0"/>

  <!-- C4 Level 4: Code -->
  <mxCell id="layer-code" value="Code (L4)" parent="0" visible="0"/>

  <!-- Context layer: external systems and users -->
  <mxCell id="c4-user" value="Customer&#xa;[Person]"
          style="shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;
                 fillColor=#08427B;fontColor=#ffffff;strokeColor=none;
                 fontSize=12;fontStyle=1;"
          vertex="1" parent="layer-context">
    <mxGeometry x="100" y="200" width="60" height="80" as="geometry"/>
  </mxCell>

  <mxCell id="c4-system" value="E-Commerce System&#xa;[Software System]"
          style="rounded=1;fillColor=#438DD5;strokeColor=#3C7FC0;
                 fontColor=#ffffff;fontSize=14;fontStyle=1;shadow=1;arcSize=6;"
          vertex="1" parent="layer-context">
    <mxGeometry x="340" y="200" width="220" height="100" as="geometry"/>
  </mxCell>

  <mxCell id="c4-ext-payment" value="Payment Gateway&#xa;[External System]"
          style="rounded=1;fillColor=#999999;strokeColor=#8A8A8A;
                 fontColor=#ffffff;fontSize=12;fontStyle=1;arcSize=6;"
          vertex="1" parent="layer-context">
    <mxGeometry x="700" y="200" width="200" height="80" as="geometry"/>
  </mxCell>

  <!-- Container layer: shows internal containers when zoomed in -->
  <mxCell id="c4-web-app" value="Web Application&#xa;[Container: React]"
          style="rounded=1;fillColor=#438DD5;strokeColor=#3C7FC0;
                 fontColor=#ffffff;fontSize=11;arcSize=6;"
          vertex="1" parent="layer-container">
    <mxGeometry x="200" y="80" width="180" height="70" as="geometry"/>
  </mxCell>

  <mxCell id="c4-api" value="API Application&#xa;[Container: Node.js]"
          style="rounded=1;fillColor=#438DD5;strokeColor=#3C7FC0;
                 fontColor=#ffffff;fontSize=11;arcSize=6;"
          vertex="1" parent="layer-container">
    <mxGeometry x="200" y="220" width="180" height="70" as="geometry"/>
  </mxCell>

  <mxCell id="c4-db" value="Database&#xa;[Container: PostgreSQL]"
          style="shape=cylinder3;boundedLbl=1;backgroundOutline=1;size=15;
                 fillColor=#438DD5;strokeColor=#3C7FC0;fontColor=#ffffff;
                 fontSize=11;"
          vertex="1" parent="layer-container">
    <mxGeometry x="200" y="380" width="160" height="80" as="geometry"/>
  </mxCell>

  <!-- Component layer: detailed breakdown within a container -->
  <mxCell id="c4-auth-ctrl" value="Auth Controller&#xa;[Component]"
          style="rounded=1;fillColor=#85BBF0;strokeColor=#78A8D8;
                 fontColor=#333333;fontSize=10;arcSize=6;"
          vertex="1" parent="layer-component">
    <mxGeometry x="100" y="100" width="160" height="50" as="geometry"/>
  </mxCell>

  <mxCell id="c4-order-ctrl" value="Order Controller&#xa;[Component]"
          style="rounded=1;fillColor=#85BBF0;strokeColor=#78A8D8;
                 fontColor=#333333;fontSize=10;arcSize=6;"
          vertex="1" parent="layer-component">
    <mxGeometry x="300" y="100" width="160" height="50" as="geometry"/>
  </mxCell>

  <mxCell id="c4-payment-svc" value="Payment Service&#xa;[Component]"
          style="rounded=1;fillColor=#85BBF0;strokeColor=#78A8D8;
                 fontColor=#333333;fontSize=10;arcSize=6;"
          vertex="1" parent="layer-component">
    <mxGeometry x="500" y="100" width="160" height="50" as="geometry"/>
  </mxCell>
</root>
```

### DevOps Pipeline Layers

Visualize the entire CI/CD pipeline from source to monitoring.

```xml
<root>
  <mxCell id="0"/>
  <mxCell id="layer-source"  value="Source"  parent="0"/>
  <mxCell id="layer-build"   value="Build"   parent="0"/>
  <mxCell id="layer-test"    value="Test"    parent="0"/>
  <mxCell id="layer-deploy"  value="Deploy"  parent="0"/>
  <mxCell id="layer-monitor" value="Monitor" parent="0"/>

  <!-- Source layer -->
  <mxCell id="git-repo" value="GitHub Repository"
          style="rounded=1;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=12;fontStyle=1;"
          vertex="1" parent="layer-source">
    <mxGeometry x="100" y="100" width="160" height="50" as="geometry"/>
  </mxCell>

  <!-- Build layer -->
  <mxCell id="ci-build" value="GitHub Actions&#xa;Build Job"
          style="rounded=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=11;fontStyle=1;"
          vertex="1" parent="layer-build">
    <mxGeometry x="340" y="100" width="160" height="50" as="geometry"/>
  </mxCell>

  <mxCell id="docker-build" value="Docker Build&#xa;&amp; Push to ACR"
          style="rounded=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=11;"
          vertex="1" parent="layer-build">
    <mxGeometry x="340" y="180" width="160" height="50" as="geometry"/>
  </mxCell>

  <!-- Test layer -->
  <mxCell id="unit-tests" value="Unit Tests"
          style="rounded=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=11;"
          vertex="1" parent="layer-test">
    <mxGeometry x="580" y="80" width="120" height="40" as="geometry"/>
  </mxCell>

  <mxCell id="int-tests" value="Integration Tests"
          style="rounded=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=11;"
          vertex="1" parent="layer-test">
    <mxGeometry x="580" y="140" width="120" height="40" as="geometry"/>
  </mxCell>

  <mxCell id="e2e-tests" value="E2E Tests"
          style="rounded=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=11;"
          vertex="1" parent="layer-test">
    <mxGeometry x="580" y="200" width="120" height="40" as="geometry"/>
  </mxCell>

  <!-- Deploy layer -->
  <mxCell id="staging-deploy" value="Deploy to Staging"
          style="rounded=1;fillColor=#e1d5e7;strokeColor=#9673a6;fontSize=11;fontStyle=1;"
          vertex="1" parent="layer-deploy">
    <mxGeometry x="780" y="100" width="160" height="50" as="geometry"/>
  </mxCell>

  <mxCell id="prod-deploy" value="Deploy to Production"
          style="rounded=1;fillColor=#e1d5e7;strokeColor=#9673a6;fontSize=11;fontStyle=1;"
          vertex="1" parent="layer-deploy">
    <mxGeometry x="780" y="200" width="160" height="50" as="geometry"/>
  </mxCell>

  <!-- Monitor layer -->
  <mxCell id="prometheus" value="Prometheus"
          style="rounded=1;fillColor=#f8cecc;strokeColor=#b85450;fontSize=11;"
          vertex="1" parent="layer-monitor">
    <mxGeometry x="1020" y="80" width="120" height="40" as="geometry"/>
  </mxCell>

  <mxCell id="grafana" value="Grafana"
          style="rounded=1;fillColor=#f8cecc;strokeColor=#b85450;fontSize=11;"
          vertex="1" parent="layer-monitor">
    <mxGeometry x="1020" y="140" width="120" height="40" as="geometry"/>
  </mxCell>

  <mxCell id="pagerduty" value="PagerDuty"
          style="rounded=1;fillColor=#f8cecc;strokeColor=#b85450;fontSize=11;"
          vertex="1" parent="layer-monitor">
    <mxGeometry x="1020" y="200" width="120" height="40" as="geometry"/>
  </mxCell>
</root>
```

### Security Layers

Defense-in-depth visualization from perimeter to data layer.

```xml
<root>
  <mxCell id="0"/>
  <mxCell id="layer-perimeter" value="Perimeter Security" parent="0"/>
  <mxCell id="layer-net-sec"   value="Network Security"   parent="0"/>
  <mxCell id="layer-app-sec"   value="Application Security" parent="0"/>
  <mxCell id="layer-data-sec"  value="Data Security"      parent="0"/>

  <!-- Perimeter: WAF, DDoS protection, CDN -->
  <mxCell id="waf" value="WAF (Cloudflare)"
          style="rounded=1;fillColor=#f8cecc;strokeColor=#b85450;
                 fontSize=12;fontStyle=1;"
          vertex="1" parent="layer-perimeter">
    <mxGeometry x="350" y="40" width="200" height="50" as="geometry"/>
  </mxCell>

  <!-- Network: firewall rules, VPN, network segmentation -->
  <mxCell id="firewall" value="Network Firewall&#xa;(NSG Rules)"
          style="rounded=1;fillColor=#fff2cc;strokeColor=#d6b656;
                 fontSize=11;fontStyle=1;"
          vertex="1" parent="layer-net-sec">
    <mxGeometry x="350" y="140" width="200" height="50" as="geometry"/>
  </mxCell>

  <!-- Application: auth, RBAC, input validation -->
  <mxCell id="auth" value="OAuth 2.0 + RBAC"
          style="rounded=1;fillColor=#dae8fc;strokeColor=#6c8ebf;
                 fontSize=11;fontStyle=1;"
          vertex="1" parent="layer-app-sec">
    <mxGeometry x="350" y="240" width="200" height="50" as="geometry"/>
  </mxCell>

  <!-- Data: encryption at rest, TLS, key management -->
  <mxCell id="encryption" value="AES-256 Encryption&#xa;+ TLS 1.3"
          style="rounded=1;fillColor=#d5e8d4;strokeColor=#82b366;
                 fontSize=11;fontStyle=1;"
          vertex="1" parent="layer-data-sec">
    <mxGeometry x="350" y="340" width="200" height="50" as="geometry"/>
  </mxCell>
</root>
```

---

## Layer Visibility

### Toggling Visibility

Set `visible="0"` on a layer cell to hide it and all its contents:

```xml
<!-- Hidden layer -->
<mxCell id="layer-debug" value="Debug Info" parent="0" visible="0"/>

<!-- Visible layer (default, attribute can be omitted) -->
<mxCell id="layer-main" value="Main" parent="0" visible="1"/>
```

### Visibility Toggle Script

```python
#!/usr/bin/env python3
"""Toggle layer visibility in a draw.io diagram."""

import xml.etree.ElementTree as ET
import sys

def toggle_layer(drawio_path, layer_id, visible=None):
    """Toggle or set layer visibility.

    Args:
        visible: None = toggle, True = show, False = hide
    """
    tree = ET.parse(drawio_path)
    root = tree.getroot()

    for cell in root.iter("mxCell"):
        if cell.get("id") == layer_id and cell.get("parent") == "0":
            current = cell.get("visible", "1")
            if visible is None:
                new_visible = "0" if current == "1" else "1"
            else:
                new_visible = "1" if visible else "0"
            cell.set("visible", new_visible)
            name = cell.get("value", layer_id)
            state = "visible" if new_visible == "1" else "hidden"
            print(f"Layer '{name}': {state}")
            break
    else:
        print(f"Layer '{layer_id}' not found")
        sys.exit(1)

    tree.write(drawio_path, xml_declaration=True, encoding="UTF-8")

def show_only(drawio_path, layer_ids):
    """Show only the specified layers, hide all others."""
    tree = ET.parse(drawio_path)
    root = tree.getroot()

    for cell in root.iter("mxCell"):
        if cell.get("parent") == "0" and cell.get("id") != "0":
            cell_id = cell.get("id")
            if cell_id in layer_ids or cell_id == "1":
                cell.set("visible", "1")
            else:
                cell.set("visible", "0")
            name = cell.get("value", cell_id)
            state = "visible" if cell.get("visible") == "1" else "hidden"
            print(f"  {name}: {state}")

    tree.write(drawio_path, xml_declaration=True, encoding="UTF-8")

if __name__ == "__main__":
    if sys.argv[2] == "toggle":
        toggle_layer(sys.argv[1], sys.argv[3])
    elif sys.argv[2] == "show":
        toggle_layer(sys.argv[1], sys.argv[3], visible=True)
    elif sys.argv[2] == "hide":
        toggle_layer(sys.argv[1], sys.argv[3], visible=False)
    elif sys.argv[2] == "show-only":
        show_only(sys.argv[1], sys.argv[3:])
```

---

## Layer Locking

Lock a layer to prevent accidental modifications to its contents:

```xml
<!-- Locked layer (read-only in the editor) -->
<mxCell id="layer-base" value="Base Infrastructure" style="locked=1" parent="0"/>
```

```python
def lock_layer(drawio_path, layer_id, locked=True):
    """Lock or unlock a layer."""
    tree = ET.parse(drawio_path)
    root = tree.getroot()

    for cell in root.iter("mxCell"):
        if cell.get("id") == layer_id and cell.get("parent") == "0":
            style = cell.get("style", "")
            if locked:
                if "locked=1" not in style:
                    style = (style.rstrip(";") + ";locked=1;").lstrip(";")
                    cell.set("style", style)
            else:
                style = style.replace("locked=1;", "").replace("locked=1", "")
                cell.set("style", style if style else None)
                if not style:
                    if "style" in cell.attrib:
                        del cell.attrib["style"]
            name = cell.get("value", layer_id)
            state = "locked" if locked else "unlocked"
            print(f"Layer '{name}': {state}")
            break

    tree.write(drawio_path, xml_declaration=True, encoding="UTF-8")
```

---

## Cross-Layer Connections

Edges can connect elements on different layers. The edge itself must be parented to
one of the layers, but its source and target can be on any layer.

```xml
<!-- Element on API layer -->
<mxCell id="api-server" value="API Server"
        style="rounded=1;fillColor=#dae8fc;strokeColor=#6c8ebf;"
        vertex="1" parent="layer-api">
  <mxGeometry x="300" y="100" width="140" height="50" as="geometry"/>
</mxCell>

<!-- Element on Database layer -->
<mxCell id="pg-primary" value="PostgreSQL"
        style="shape=cylinder3;fillColor=#e1d5e7;strokeColor=#9673a6;"
        vertex="1" parent="layer-database">
  <mxGeometry x="300" y="300" width="120" height="80" as="geometry"/>
</mxCell>

<!-- Cross-layer edge: API -> Database
     The edge is parented to layer-api but connects to an element on layer-database.
     Note: The edge is visible only when BOTH layers are visible. -->
<mxCell style="edgeStyle=orthogonalEdgeStyle;rounded=1;strokeWidth=2;
               endArrow=block;endFill=1;strokeColor=#666;
               entryX=0.5;entryY=0;exitX=0.5;exitY=1;"
        edge="1" source="api-server" target="pg-primary" parent="layer-api">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>
```

### Cross-Layer Edge Visibility Rules

- An edge is visible when its parent layer is visible.
- If the source or target element's layer is hidden, the edge endpoints may appear
  disconnected (the edge itself remains visible if its parent layer is visible).
- For best results, parent cross-layer edges to a dedicated "Connections" layer that
  is always visible:

```xml
<mxCell id="layer-connections" value="Connections" parent="0"/>

<!-- All cross-layer edges go on this layer -->
<mxCell style="edgeStyle=orthogonalEdgeStyle;rounded=1;strokeWidth=1.5;
               endArrow=block;endFill=1;"
        edge="1" source="api-server" target="pg-primary" parent="layer-connections">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>
```

---

## Collapsible Groups Within Layers

Use container cells (groups) within a layer to create collapsible subsections:

```xml
<!-- Collapsible group on the Services layer -->
<mxCell id="grp-auth" value="Authentication Services"
        style="group;rounded=1;fillColor=#f5f5f5;strokeColor=#666666;
               verticalAlign=top;fontSize=12;fontStyle=1;
               container=1;collapsible=1;swimlaneHead=1;"
        vertex="1" parent="layer-services">
  <mxGeometry x="60" y="60" width="300" height="200" as="geometry"/>
</mxCell>

<!-- Children of the group (parent = group cell, not layer) -->
<mxCell id="oauth-svc" value="OAuth Provider"
        style="rounded=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=11;"
        vertex="1" parent="grp-auth">
  <mxGeometry x="20" y="40" width="120" height="40" as="geometry"/>
</mxCell>

<mxCell id="jwt-svc" value="JWT Issuer"
        style="rounded=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=11;"
        vertex="1" parent="grp-auth">
  <mxGeometry x="160" y="40" width="120" height="40" as="geometry"/>
</mxCell>

<mxCell id="rbac-svc" value="RBAC Engine"
        style="rounded=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=11;"
        vertex="1" parent="grp-auth">
  <mxGeometry x="80" y="110" width="120" height="40" as="geometry"/>
</mxCell>
```

When collapsed in the draw.io editor, the group shrinks to show only its header,
hiding all child elements. This is useful for large diagrams where detail can be
toggled on demand.

---

## Layer-Based Export

Export specific layers only, useful for generating audience-specific views.

### Export Script

```python
#!/usr/bin/env python3
"""Export a draw.io diagram with only specific layers visible."""

import xml.etree.ElementTree as ET
import copy
import sys

def export_layers(drawio_path, output_path, include_layers):
    """Export diagram with only specified layers visible.

    Args:
        include_layers: list of layer IDs to include. Default layer (id="1")
                       is always included.
    """
    tree = ET.parse(drawio_path)
    root = copy.deepcopy(tree.getroot())

    # Collect all layer IDs
    layers_to_remove = []
    for cell in root.iter("mxCell"):
        if cell.get("parent") == "0" and cell.get("id") != "0":
            cell_id = cell.get("id")
            if cell_id not in include_layers and cell_id != "1":
                layers_to_remove.append(cell_id)

    # Remove cells belonging to excluded layers
    for diagram in root.iter("diagram"):
        graph_model = diagram.find("mxGraphModel")
        if graph_model is None:
            continue
        xml_root = graph_model.find("root")
        if xml_root is None:
            continue

        cells_to_remove = []
        for cell in xml_root.findall("mxCell"):
            parent = cell.get("parent", "")
            cell_id = cell.get("id", "")
            if cell_id in layers_to_remove or parent in layers_to_remove:
                cells_to_remove.append(cell)

        # Also remove UserObject elements on excluded layers
        for obj in xml_root.findall("UserObject"):
            inner_cell = obj.find("mxCell")
            if inner_cell is not None and inner_cell.get("parent", "") in layers_to_remove:
                cells_to_remove.append(obj)

        for cell in cells_to_remove:
            xml_root.remove(cell)

    tree_out = ET.ElementTree(root)
    tree_out.write(output_path, xml_declaration=True, encoding="UTF-8")

    included_names = []
    for cell in root.iter("mxCell"):
        if cell.get("parent") == "0" and cell.get("id") != "0":
            included_names.append(cell.get("value", cell.get("id")))

    print(f"Exported to {output_path}")
    print(f"  Included layers: {', '.join(included_names)}")
    print(f"  Excluded layers: {len(layers_to_remove)}")

if __name__ == "__main__":
    # Usage: python3 export_layers.py input.drawio output.drawio layer1 layer2
    export_layers(sys.argv[1], sys.argv[2], sys.argv[3:])
```

### Export Presets

Common export configurations for different audiences:

```bash
# Executive view: Context layer only
/drawio:layers export architecture.drawio --preset=executive \
  --layers=layer-context --output=docs/executive-view.drawio

# Developer view: All technical layers
/drawio:layers export architecture.drawio --preset=developer \
  --layers=layer-api,layer-services,layer-database --output=docs/developer-view.drawio

# Security view: Security overlay on infrastructure
/drawio:layers export architecture.drawio --preset=security \
  --layers=layer-network,layer-security --output=docs/security-view.drawio

# Operations view: Infrastructure + monitoring
/drawio:layers export architecture.drawio --preset=ops \
  --layers=layer-network,layer-compute,layer-storage,layer-monitor \
  --output=docs/ops-view.drawio
```

---

## Layer Ordering and Z-Index

Layer order in the XML determines rendering order (z-index). Later layers render
on top of earlier layers. To reorder layers:

```python
#!/usr/bin/env python3
"""Reorder layers in a draw.io diagram."""

import xml.etree.ElementTree as ET
import sys

def reorder_layers(drawio_path, layer_order):
    """Reorder layers according to the specified order (bottom to top).

    Args:
        layer_order: list of layer IDs in desired order (first = bottom)
    """
    tree = ET.parse(drawio_path)
    root = tree.getroot()

    for diagram in root.iter("diagram"):
        graph_model = diagram.find("mxGraphModel")
        if graph_model is None:
            continue
        xml_root = graph_model.find("root")
        if xml_root is None:
            continue

        # Separate root cell, layers, and content
        root_cell = None
        layers = {}
        content_by_layer = {}

        all_elements = list(xml_root)
        for elem in all_elements:
            xml_root.remove(elem)

        for elem in all_elements:
            elem_id = elem.get("id", "")
            parent = elem.get("parent", "")

            if elem_id == "0":
                root_cell = elem
            elif parent == "0":
                layers[elem_id] = elem
                content_by_layer[elem_id] = []
            else:
                if parent not in content_by_layer:
                    content_by_layer[parent] = []
                content_by_layer[parent].append(elem)

        # Rebuild in order
        xml_root.append(root_cell)

        # Add default layer first
        if "1" in layers:
            xml_root.append(layers["1"])
            for content in content_by_layer.get("1", []):
                xml_root.append(content)

        # Add layers in specified order
        for layer_id in layer_order:
            if layer_id in layers and layer_id != "1":
                xml_root.append(layers[layer_id])
                for content in content_by_layer.get(layer_id, []):
                    xml_root.append(content)

        # Add any remaining layers not in the order list
        for layer_id, layer_elem in layers.items():
            if layer_id != "1" and layer_id not in layer_order:
                xml_root.append(layer_elem)
                for content in content_by_layer.get(layer_id, []):
                    xml_root.append(content)

    tree.write(drawio_path, xml_declaration=True, encoding="UTF-8")
    print(f"Reordered layers: {' -> '.join(layer_order)} (bottom to top)")

if __name__ == "__main__":
    reorder_layers(sys.argv[1], sys.argv[2:])
```

---

## Layer Information and Listing

### List All Layers

```python
#!/usr/bin/env python3
"""List all layers in a draw.io diagram with their properties."""

import xml.etree.ElementTree as ET
import sys

def list_layers(drawio_path):
    tree = ET.parse(drawio_path)
    root = tree.getroot()

    for diagram in root.iter("diagram"):
        diagram_name = diagram.get("name", "Unnamed")
        print(f"Diagram: {diagram_name}")
        print(f"{'ID':<25} {'Name':<25} {'Visible':<10} {'Locked':<10} {'Elements':<10}")
        print("-" * 80)

        graph_model = diagram.find("mxGraphModel")
        if graph_model is None:
            continue
        xml_root = graph_model.find("root")
        if xml_root is None:
            continue

        # Count elements per layer
        element_counts = {}
        for cell in xml_root.findall("mxCell"):
            parent = cell.get("parent", "")
            if parent != "0":
                element_counts[parent] = element_counts.get(parent, 0) + 1
        for obj in xml_root.findall("UserObject"):
            inner = obj.find("mxCell")
            if inner is not None:
                parent = inner.get("parent", "")
                element_counts[parent] = element_counts.get(parent, 0) + 1

        # Print layer info
        for cell in xml_root.findall("mxCell"):
            if cell.get("parent") == "0" and cell.get("id") != "0":
                layer_id = cell.get("id")
                name = cell.get("value", "(default)")
                visible = "yes" if cell.get("visible", "1") == "1" else "no"
                style = cell.get("style", "")
                locked = "yes" if "locked=1" in style else "no"
                count = element_counts.get(layer_id, 0)
                print(f"{layer_id:<25} {name:<25} {visible:<10} {locked:<10} {count:<10}")

if __name__ == "__main__":
    list_layers(sys.argv[1])
```

---

## Layer Templates

Pre-built layer configurations for common diagram types:

```bash
# Create infrastructure layer set
/drawio:layers create architecture.drawio --template=infrastructure

# Create application layer set
/drawio:layers create architecture.drawio --template=application

# Create C4 model layer set
/drawio:layers create architecture.drawio --template=c4

# Create DevOps pipeline layer set
/drawio:layers create architecture.drawio --template=devops

# Create security defense-in-depth layer set
/drawio:layers create architecture.drawio --template=security

# List all layers
/drawio:layers list architecture.drawio

# Toggle layer visibility
/drawio:layers toggle architecture.drawio layer-security

# Show only specific layers
/drawio:layers show-only architecture.drawio layer-network layer-compute

# Lock a layer
/drawio:layers lock architecture.drawio layer-network

# Unlock a layer
/drawio:layers unlock architecture.drawio layer-network

# Reorder layers (bottom to top)
/drawio:layers reorder architecture.drawio layer-network layer-compute layer-storage layer-security

# Export specific layers
/drawio:layers export architecture.drawio --layers=layer-network,layer-security \
  --output=docs/network-security.drawio

# Add a single new layer
/drawio:layers add architecture.drawio --id=layer-monitoring --name="Monitoring"

# Add a hidden layer
/drawio:layers add architecture.drawio --id=layer-debug --name="Debug" --hidden

# Add a locked layer
/drawio:layers add architecture.drawio --id=layer-baseline --name="Baseline" --locked

# Move elements between layers
/drawio:layers move architecture.drawio --elements=svc-1,svc-2 --to=layer-services

# Count elements per layer
/drawio:layers stats architecture.drawio
```
