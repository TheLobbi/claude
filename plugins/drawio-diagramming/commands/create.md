---
name: drawio:create
intent: Create a new draw.io diagram with AI-powered type selection and generation
tags:
  - drawio-diagramming
  - command
  - create
inputs: []
risk: low
cost: medium
description: |
  Analyzes project context (code, conversation, explicit request) to automatically select the best diagram type and generate production-quality draw.io XML with proper mxGraphModel structure, style presets, color themes, multi-page support, and layer organization.
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
  - Edit
---

# drawio:create — Create a New draw.io Diagram

## Overview

This command creates a new draw.io diagram by analyzing context to determine the
optimal diagram type, then generating well-structured XML with proper styling,
color themes, and layout. It supports 15+ diagram types, 6 style presets, and
multiple output formats.

## Flags

| Flag | Alias | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--type <type>` | `-t` | string | auto-detect | Diagram type to create (sequence, er, c4, flowchart, class, network, bpmn, swimlane, mindmap, gantt, orgchart, k8s, aws, azure, gcp, state) |
| `--style <preset>` | `-s` | string | `professional` | Style preset to apply (professional, sketch, dark, colorful, minimal, blueprint) |
| `--title <text>` | `-T` | string | auto-generated | Diagram title displayed in the page tab |
| `--output <path>` | `-o` | string | `./<title>.drawio` | Output file path for the generated diagram |
| `--pages <names>` | `-p` | string | single page | Comma-separated page names for multi-page diagrams |
| `--theme <name>` | | string | `standard` | Color theme palette (standard, dark, pastel, monochrome, high-contrast) |
| `--format <fmt>` | `-f` | string | `drawio` | Output format (drawio, svg, png, pdf) |
| `--width <px>` | `-W` | number | `1169` | Page width in pixels |
| `--height <px>` | `-H` | number | `827` | Page height in pixels |
| `--template <name>` | | string | none | Use a named template as the starting point |
| `--layers <names>` | `-l` | string | single layer | Comma-separated layer names to create |
| `--multi-page` | `-m` | boolean | `false` | Create a multi-page diagram with drill-down structure |
| `--analyze <path>` | `-a` | string | none | Analyze source files at path to inform diagram generation |
| `--embed-diagram` | `-e` | boolean | `false` | Embed diagram XML in exported SVG/PNG for editability |
| `--export <format>` | `-E` | string | none | Auto-export to format after creation (svg, png, pdf) |
| `--interactive` | `-i` | boolean | `false` | Prompt for confirmation at each generation step |
| `--verbose` | `-v` | boolean | `false` | Show detailed processing output |
| `--dry-run` | `-n` | boolean | `false` | Preview what would be created without writing files |
| `--open` | `-O` | boolean | `false` | Open the created diagram in draw.io desktop app after generation |
| `--overwrite` | | boolean | `false` | Overwrite existing file without prompting |

### Flag Details

#### Output & Format Flags
- **`--output <path>`** (`-o`): Destination file path. Defaults to `./<title>.drawio` where title is derived from the diagram content or `--title` flag. Parent directories are created automatically.
- **`--format <fmt>`** (`-f`): Final output format. When set to `svg` or `png`, the command generates the `.drawio` XML first, then exports. Requires draw.io CLI for non-XML formats.
- **`--width <px>`** / **`--height <px>`**: Set the `pageWidth` and `pageHeight` attributes on the `mxGraphModel` element. Affects export dimensions.
- **`--export <format>`** (`-E`): Trigger automatic export after creation. The `.drawio` file is always created; this flag adds an additional exported file.

#### Style & Theme Flags
- **`--style <preset>`** (`-s`): Apply a coordinated style preset to all diagram elements. Presets control fill colors, stroke colors, font family, font size, rounded corners, shadows, and sketch effects.
- **`--theme <name>`**: Select a color palette. Works independently of `--style`. For example, `--style minimal --theme dark` creates a minimal layout with dark colors.
- **`--template <name>`**: Start from a pre-built template instead of generating from scratch. Templates include placeholders that are auto-filled from context.

#### Structure Flags
- **`--type <type>`** (`-t`): Override automatic diagram type detection. Use when the auto-detection picks the wrong type or you want a specific visualization.
- **`--pages <names>`** (`-p`): Create multiple pages in one file. Example: `--pages "Context,Container,Component"` creates a C4 drill-down.
- **`--layers <names>`** (`-l`): Pre-create named layers. Example: `--layers "Infrastructure,Application,Data,Security"`.
- **`--multi-page`** (`-m`): Automatically decompose complex diagrams into multiple pages with cross-page links.
- **`--analyze <path>`** (`-a`): Point to source code for the auto-detection engine to analyze. Overrides the default working directory scan.

#### Behavior Flags
- **`--dry-run`** (`-n`): Preview the diagram type, element count, and output path without creating any files. Useful for validating auto-detection.
- **`--verbose`** (`-v`): Show step-by-step processing: context analysis, type selection, template resolution, XML generation, and export.
- **`--interactive`** (`-i`): Pause after type selection and style application to allow manual overrides before writing.
- **`--open`** (`-O`): After creating the `.drawio` file, open it in the draw.io desktop application for visual editing. Auto-detects the editor on macOS, Linux, and Windows (including WSL). Falls back to the browser editor at `https://app.diagrams.net` if the desktop app is not installed. See `drawio:open` for editor detection details.
- **`--overwrite`**: Skip the confirmation prompt when the output file already exists.

#### Examples with Flags

```bash
# Create with explicit type, style, and export
drawio:create --type sequence --style sketch --title "Auth Flow" --export svg

# Multi-page C4 architecture with dark theme
drawio:create --type c4 --pages "Context,Container,Component" --theme dark --title "Platform Architecture"

# Analyze source code and auto-detect, with verbose output
drawio:create --analyze src/api/ --verbose --output docs/diagrams/api-flow.drawio

# Dry run to preview what would be generated
drawio:create --analyze src/ --dry-run

# Create with custom dimensions and layers
drawio:create --type k8s --width 1920 --height 1080 --layers "Network,Compute,Storage" --title "K8s Cluster"
```

## Context-Based Diagram Type Selection

### Decision Tree

Analyze the available context and select the diagram type using this priority:

1. **Explicit request** — user says "create a sequence diagram" → use that type
2. **Code analysis** — scan nearby source files for patterns:
   - REST controllers, route handlers, API endpoints → **Sequence Diagram**
   - Database models, schemas, migrations, ORMs → **ER Diagram**
   - Class hierarchies, interfaces, abstract classes → **UML Class Diagram**
   - Microservices, docker-compose, K8s manifests → **C4 Architecture Diagram**
   - Dockerfile, K8s YAML, Helm charts → **Kubernetes Diagram**
   - AWS CDK, CloudFormation, Terraform → **Cloud Architecture (AWS/Azure/GCP)**
   - Network configs, load balancers, firewalls → **Network Topology Diagram**
   - CI/CD pipelines, GitHub Actions, Jenkins → **Flowchart / Pipeline Diagram**
   - State machines, Redux reducers, XState → **State Diagram**
   - Business logic, approval workflows → **BPMN Process Diagram**
   - Cross-team handoffs, multi-department flows → **Swimlane Diagram**
   - Org structures, team hierarchies → **Org Chart**
   - Project timelines, milestones → **Gantt Chart**
3. **Conversation context** — infer from recent discussion topics
4. **Default** — if no context, create a general-purpose flowchart

### Diagram Type Reference

| Type | Best For | Key Indicators |
|------|----------|----------------|
| Sequence | API calls, request flows | HTTP handlers, REST endpoints, gRPC |
| ER | Data models, schemas | ORM models, CREATE TABLE, Prisma/Drizzle |
| C4 (Context/Container/Component) | System architecture | Microservices, multi-repo, service mesh |
| Flowchart | Processes, algorithms | Decision logic, if/else chains, pipelines |
| UML Class | Object-oriented design | Classes, interfaces, inheritance, abstract |
| Network Topology | Infrastructure | VPCs, subnets, load balancers, DNS |
| BPMN | Business processes | Approval flows, SLAs, escalations |
| Swimlane | Cross-team workflows | Multi-department, handoffs, responsibilities |
| Mind Map | Brainstorming, planning | Ideation, feature breakdown, exploration |
| Gantt | Timelines, scheduling | Milestones, sprints, deadlines |
| Org Chart | Team structure | Reporting lines, departments, roles |
| Kubernetes | Container orchestration | Pods, services, deployments, ingress |
| AWS Architecture | AWS cloud infra | EC2, S3, Lambda, RDS, VPC |
| Azure Architecture | Azure cloud infra | App Service, AKS, Cosmos DB, VNET |
| GCP Architecture | GCP cloud infra | GCE, GKE, Cloud Run, BigQuery |
| State Diagram | State machines | States, transitions, guards, actions |

## Required XML Structure Rules

Every draw.io diagram MUST follow these rules:

1. **Full mxfile wrapper (CRITICAL)**: Root element MUST be `<mxfile>` wrapping `<diagram>` wrapping `<mxGraphModel>`. The bare `<mxGraphModel>` format causes **blank files** in draw.io desktop and web editor — it only works for clipboard import
2. **Graph model**: each `<diagram>` contains `<mxGraphModel>` with a `<root>` child
3. **Mandatory cells**: always include cell `id="0"` (root) and `id="1"` (default layer, parent="0")
4. **Unique IDs**: every cell must have a unique `id` attribute (use descriptive IDs like `"api-gateway"` or sequential like `"cell-3"`)
5. **Shapes**: use `vertex="1"` with `parent="1"` (or layer ID)
6. **Connectors**: use `edge="1"` with `source` and `target` attributes referencing cell IDs. Always include `rounded=1;jettySize=auto;` in edge styles for clean routing
7. **Uncompressed XML**: always write uncompressed, human-readable XML (never base64-encoded)
8. **Geometry**: every vertex needs `<mxGeometry>` with `x`, `y`, `width`, `height` attributes set to `as="geometry"`
9. **Labels**: set as the `value` attribute on `<mxCell>`
10. **Layers**: always create at least 2 layers with `parent="0"` for semantic grouping
11. **Containers**: group related shapes using `container=1;collapsible=1;` parent cells

### Minimal Valid Structure

```xml
<mxfile host="Claude" modified="2026-03-17T00:00:00.000Z" agent="Claude Code" version="24.0.0" type="device">
  <diagram id="diagram-1" name="Page-1">
    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" math="0" shadow="0" background="none">
      <root>
        <mxCell id="0" />
        <mxCell id="1" value="Main" parent="0" />
        <mxCell id="layer-notes" value="Annotations" parent="0" />
        <!-- All diagram cells go here with parent="1" or parent="layer-notes" -->
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

**CRITICAL rules**:
- Always use `background="none"` (transparent) — never solid white
- Always use the full `<mxfile>` wrapper — bare `<mxGraphModel>` causes blank files
- Always include at least 2 layers (content + annotations)

## Color Themes

### Standard Palette

| Color Name | Fill | Border | Use For |
|-----------|------|--------|---------|
| Blue | `#DAE8FC` | `#6C8EBF` | Services, APIs, components |
| Green | `#D5E8D4` | `#82B366` | Databases, success states, data stores |
| Yellow | `#FFF2CC` | `#D6B656` | Warnings, decisions, queues |
| Orange | `#FFCD28` | `#D79B00` | External services, triggers |
| Red | `#F8CECC` | `#B85450` | Errors, critical paths, security |
| Purple | `#E1D5E7` | `#9673A6` | Users, actors, external systems |
| Gray | `#F5F5F5` | `#666666` | Containers, boundaries, groups |
| White | `#FFFFFF` | `#000000` | Notes, annotations, labels |

### Theme Presets

Each preset defines a coordinated set of styles applied across the entire diagram.

#### Professional (Default)
```
rounded=1;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontFamily=Helvetica;fontSize=12;shadow=1;
```
Note: All presets should use `shadow=1;` for depth. Use `fontColor=#333333;` (not black) for softer contrast. Always set `background="none"` on the `<mxGraphModel>` for transparent backgrounds.

#### Sketch / Hand-Drawn
```
rounded=1;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontFamily=Comic Sans MS;fontSize=12;sketch=1;curveFitting=1;jiggle=2;
```

#### Dark Mode
```
rounded=1;whiteSpace=wrap;html=1;fillColor=#1B1B1B;strokeColor=#67AB9F;fontColor=#FFFFFF;fontFamily=Helvetica;fontSize=12;
```

#### Colorful
```
rounded=1;whiteSpace=wrap;html=1;fillColor=#FF6B6B;strokeColor=#C92A2A;fontFamily=Helvetica;fontSize=12;shadow=1;glass=1;
```

#### Minimal
```
rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#333333;fontFamily=Helvetica;fontSize=11;
```

#### Blueprint
```
rounded=0;whiteSpace=wrap;html=1;fillColor=#143642;strokeColor=#0F8B8D;fontColor=#DADADA;fontFamily=Courier New;fontSize=11;
```

## Template Library

### Flowchart Template

```xml
<mxfile host="Claude" modified="2026-03-14T00:00:00.000Z" agent="Claude Code" version="24.0.0" type="device">
  <diagram id="flowchart-1" name="Flowchart">
    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" value="Process Flow" parent="0" />
        <mxCell id="layer-annotations" value="Annotations" parent="0" />
        <!-- Title annotation on annotations layer -->
        <mxCell id="title" value="&lt;b&gt;Process Flowchart&lt;/b&gt;&lt;br&gt;&lt;font style=&quot;font-size:10px;color:#666;&quot;&gt;Generated by Claude&lt;/font&gt;" style="text;html=1;align=left;verticalAlign=top;whiteSpace=wrap;overflow=hidden;fontSize=16;" vertex="1" parent="layer-annotations">
          <mxGeometry x="40" y="10" width="300" height="40" as="geometry" />
        </mxCell>
        <!-- Process flow container -->
        <mxCell id="flow-group" value="" style="group;container=1;collapsible=0;fillColor=none;strokeColor=none;" vertex="1" parent="1">
          <mxGeometry x="120" y="40" width="560" height="540" as="geometry" />
        </mxCell>
        <mxCell id="start" value="Start" style="ellipse;whiteSpace=wrap;html=1;fillColor=#D5E8D4;strokeColor=#82B366;fontSize=14;fontStyle=1;shadow=1;" vertex="1" parent="flow-group">
          <mxGeometry x="220" y="0" width="120" height="60" as="geometry" />
        </mxCell>
        <mxCell id="process-1" value="&lt;b&gt;Process Step&lt;/b&gt;&lt;br&gt;Description here" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=12;shadow=1;" vertex="1" parent="flow-group">
          <mxGeometry x="200" y="100" width="160" height="60" as="geometry" />
        </mxCell>
        <mxCell id="decision-1" value="&lt;b&gt;Decision?&lt;/b&gt;" style="rhombus;whiteSpace=wrap;html=1;fillColor=#FFF2CC;strokeColor=#D6B656;fontSize=12;shadow=1;" vertex="1" parent="flow-group">
          <mxGeometry x="210" y="200" width="140" height="100" as="geometry" />
        </mxCell>
        <mxCell id="process-2a" value="&lt;b&gt;Path A&lt;/b&gt;&lt;br&gt;Success flow" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=12;shadow=1;" vertex="1" parent="flow-group">
          <mxGeometry x="40" y="350" width="160" height="60" as="geometry" />
        </mxCell>
        <mxCell id="process-2b" value="&lt;b&gt;Path B&lt;/b&gt;&lt;br&gt;Alternate flow" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#F8CECC;strokeColor=#B85450;fontSize=12;shadow=1;" vertex="1" parent="flow-group">
          <mxGeometry x="360" y="350" width="160" height="60" as="geometry" />
        </mxCell>
        <mxCell id="end" value="End" style="ellipse;whiteSpace=wrap;html=1;fillColor=#D5E8D4;strokeColor=#82B366;fontSize=14;fontStyle=1;shadow=1;" vertex="1" parent="flow-group">
          <mxGeometry x="220" y="460" width="120" height="60" as="geometry" />
        </mxCell>
        <!-- Edges with proper routing -->
        <mxCell id="edge-1" style="edgeStyle=orthogonalEdgeStyle;rounded=1;jettySize=auto;strokeWidth=2;" edge="1" source="start" target="process-1" parent="flow-group">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="edge-2" style="edgeStyle=orthogonalEdgeStyle;rounded=1;jettySize=auto;strokeWidth=2;" edge="1" source="process-1" target="decision-1" parent="flow-group">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="edge-3" value="Yes" style="edgeStyle=orthogonalEdgeStyle;rounded=1;jettySize=auto;strokeWidth=2;exitX=0;exitY=0.5;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;" edge="1" source="decision-1" target="process-2a" parent="flow-group">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="edge-4" value="No" style="edgeStyle=orthogonalEdgeStyle;rounded=1;jettySize=auto;strokeWidth=2;exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;" edge="1" source="decision-1" target="process-2b" parent="flow-group">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="edge-5" style="edgeStyle=orthogonalEdgeStyle;rounded=1;jettySize=auto;strokeWidth=2;exitX=0.5;exitY=1;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;" edge="1" source="process-2a" target="end" parent="flow-group">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="edge-6" style="edgeStyle=orthogonalEdgeStyle;rounded=1;jettySize=auto;strokeWidth=2;exitX=0.5;exitY=1;exitDx=0;exitDy=0;entryX=1;entryY=0.5;entryDx=0;entryDy=0;" edge="1" source="process-2b" target="end" parent="flow-group">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <!-- Legend on annotations layer -->
        <mxCell id="legend-group" value="&lt;b&gt;Legend&lt;/b&gt;" style="swimlane;container=1;collapsible=0;startSize=20;fillColor=#F5F5F5;strokeColor=#666666;fontSize=10;fontStyle=1;" vertex="1" parent="layer-annotations">
          <mxGeometry x="740" y="40" width="150" height="100" as="geometry" />
        </mxCell>
        <mxCell id="legend-1" value="Process" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=9;" vertex="1" parent="legend-group">
          <mxGeometry x="10" y="25" width="60" height="25" as="geometry" />
        </mxCell>
        <mxCell id="legend-2" value="Decision" style="rhombus;whiteSpace=wrap;html=1;fillColor=#FFF2CC;strokeColor=#D6B656;fontSize=9;" vertex="1" parent="legend-group">
          <mxGeometry x="80" y="25" width="50" height="30" as="geometry" />
        </mxCell>
        <mxCell id="legend-3" value="Terminal" style="ellipse;whiteSpace=wrap;html=1;fillColor=#D5E8D4;strokeColor=#82B366;fontSize=9;" vertex="1" parent="legend-group">
          <mxGeometry x="10" y="60" width="60" height="25" as="geometry" />
        </mxCell>
        <mxCell id="legend-4" value="Error" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#F8CECC;strokeColor=#B85450;fontSize=9;" vertex="1" parent="legend-group">
          <mxGeometry x="80" y="63" width="60" height="25" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

### Sequence Diagram Template

```xml
<mxfile host="Claude" modified="2026-03-14T00:00:00.000Z" agent="Claude Code" version="24.0.0" type="device">
  <diagram id="sequence-1" name="Sequence Diagram">
    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <!-- Actor: Client -->
        <mxCell id="actor-client" value="Client" style="shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;dropTarget=0;collapsible=0;recursiveResize=0;outlineConnect=0;portConstraint=eastwest;newEdgeStyle={&quot;edgeStyle&quot;:&quot;elbowEdgeStyle&quot;,&quot;elbow&quot;:&quot;vertical&quot;,&quot;curved&quot;:0,&quot;rounded&quot;:0};fillColor=#E1D5E7;strokeColor=#9673A6;fontSize=13;fontStyle=1;size=40;" vertex="1" parent="1">
          <mxGeometry x="120" y="40" width="100" height="500" as="geometry" />
        </mxCell>
        <!-- Actor: API Gateway -->
        <mxCell id="actor-gateway" value="API Gateway" style="shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;dropTarget=0;collapsible=0;recursiveResize=0;outlineConnect=0;portConstraint=eastwest;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=13;fontStyle=1;size=40;" vertex="1" parent="1">
          <mxGeometry x="340" y="40" width="120" height="500" as="geometry" />
        </mxCell>
        <!-- Actor: Service -->
        <mxCell id="actor-service" value="Service" style="shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;dropTarget=0;collapsible=0;recursiveResize=0;outlineConnect=0;portConstraint=eastwest;fillColor=#D5E8D4;strokeColor=#82B366;fontSize=13;fontStyle=1;size=40;" vertex="1" parent="1">
          <mxGeometry x="580" y="40" width="100" height="500" as="geometry" />
        </mxCell>
        <!-- Actor: Database -->
        <mxCell id="actor-db" value="Database" style="shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;dropTarget=0;collapsible=0;recursiveResize=0;outlineConnect=0;portConstraint=eastwest;fillColor=#D5E8D4;strokeColor=#82B366;fontSize=13;fontStyle=1;size=40;" vertex="1" parent="1">
          <mxGeometry x="800" y="40" width="100" height="500" as="geometry" />
        </mxCell>
        <!-- Message 1: Request -->
        <mxCell id="msg-1" value="POST /api/resource" style="html=1;verticalAlign=bottom;endArrow=block;curved=0;rounded=0;fontSize=11;" edge="1" parent="1">
          <mxGeometry x="170" y="120" width="220" height="10" as="geometry">
            <mxPoint x="170" y="120" as="sourcePoint" />
            <mxPoint x="400" y="120" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        <!-- Message 2: Forward -->
        <mxCell id="msg-2" value="validate &amp; forward" style="html=1;verticalAlign=bottom;endArrow=block;curved=0;rounded=0;fontSize=11;" edge="1" parent="1">
          <mxGeometry x="400" y="160" width="230" height="10" as="geometry">
            <mxPoint x="400" y="160" as="sourcePoint" />
            <mxPoint x="630" y="160" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        <!-- Message 3: DB Query -->
        <mxCell id="msg-3" value="INSERT INTO ..." style="html=1;verticalAlign=bottom;endArrow=block;curved=0;rounded=0;fontSize=11;" edge="1" parent="1">
          <mxGeometry x="630" y="200" width="220" height="10" as="geometry">
            <mxPoint x="630" y="200" as="sourcePoint" />
            <mxPoint x="850" y="200" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        <!-- Message 4: DB Response -->
        <mxCell id="msg-4" value="OK (id: 42)" style="html=1;verticalAlign=bottom;endArrow=open;dashed=1;curved=0;rounded=0;fontSize=11;" edge="1" parent="1">
          <mxGeometry x="630" y="240" width="220" height="10" as="geometry">
            <mxPoint x="850" y="240" as="sourcePoint" />
            <mxPoint x="630" y="240" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        <!-- Message 5: Service Response -->
        <mxCell id="msg-5" value="201 Created" style="html=1;verticalAlign=bottom;endArrow=open;dashed=1;curved=0;rounded=0;fontSize=11;" edge="1" parent="1">
          <mxGeometry x="400" y="280" width="230" height="10" as="geometry">
            <mxPoint x="630" y="280" as="sourcePoint" />
            <mxPoint x="400" y="280" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        <!-- Message 6: Client Response -->
        <mxCell id="msg-6" value="201 Created + body" style="html=1;verticalAlign=bottom;endArrow=open;dashed=1;curved=0;rounded=0;fontSize=11;" edge="1" parent="1">
          <mxGeometry x="170" y="320" width="220" height="10" as="geometry">
            <mxPoint x="400" y="320" as="sourcePoint" />
            <mxPoint x="170" y="320" as="targetPoint" />
          </mxGeometry>
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

### ER Diagram Template

```xml
<mxfile host="Claude" modified="2026-03-14T00:00:00.000Z" agent="Claude Code" version="24.0.0" type="device">
  <diagram id="er-1" name="ER Diagram">
    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <!-- Table: users -->
        <mxCell id="users-header" value="users" style="shape=table;startSize=30;container=1;collapsible=1;childLayout=tableLayout;fixedRows=1;rowLines=0;fontStyle=1;align=center;resizeLast=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=13;" vertex="1" parent="1">
          <mxGeometry x="80" y="120" width="260" height="150" as="geometry" />
        </mxCell>
        <mxCell id="users-r1" value="" style="shape=tableRow;horizontal=0;startSize=0;swimlaneHead=0;swimlaneBody=0;fillColor=none;collapsible=0;dropTarget=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;fontSize=11;top=0;left=0;right=0;bottom=1;" vertex="1" parent="users-header">
          <mxGeometry y="30" width="260" height="30" as="geometry" />
        </mxCell>
        <mxCell id="users-r1-k" value="PK" style="shape=partialRectangle;connectable=0;fillColor=none;top=0;left=0;bottom=0;right=0;fontStyle=1;overflow=hidden;fontSize=11;whiteSpace=wrap;" vertex="1" parent="users-r1">
          <mxGeometry width="40" height="30" as="geometry" />
        </mxCell>
        <mxCell id="users-r1-v" value="id: UUID" style="shape=partialRectangle;connectable=0;fillColor=none;top=0;left=0;bottom=0;right=0;overflow=hidden;fontSize=11;whiteSpace=wrap;fontStyle=4;" vertex="1" parent="users-r1">
          <mxGeometry x="40" width="220" height="30" as="geometry" />
        </mxCell>
        <mxCell id="users-r2" value="" style="shape=tableRow;horizontal=0;startSize=0;swimlaneHead=0;swimlaneBody=0;fillColor=none;collapsible=0;dropTarget=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;fontSize=11;top=0;left=0;right=0;bottom=1;" vertex="1" parent="users-header">
          <mxGeometry y="60" width="260" height="30" as="geometry" />
        </mxCell>
        <mxCell id="users-r2-k" value="" style="shape=partialRectangle;connectable=0;fillColor=none;top=0;left=0;bottom=0;right=0;overflow=hidden;fontSize=11;whiteSpace=wrap;" vertex="1" parent="users-r2">
          <mxGeometry width="40" height="30" as="geometry" />
        </mxCell>
        <mxCell id="users-r2-v" value="email: VARCHAR(255) NOT NULL UNIQUE" style="shape=partialRectangle;connectable=0;fillColor=none;top=0;left=0;bottom=0;right=0;overflow=hidden;fontSize=11;whiteSpace=wrap;" vertex="1" parent="users-r2">
          <mxGeometry x="40" width="220" height="30" as="geometry" />
        </mxCell>
        <mxCell id="users-r3" value="" style="shape=tableRow;horizontal=0;startSize=0;swimlaneHead=0;swimlaneBody=0;fillColor=none;collapsible=0;dropTarget=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;fontSize=11;top=0;left=0;right=0;bottom=1;" vertex="1" parent="users-header">
          <mxGeometry y="90" width="260" height="30" as="geometry" />
        </mxCell>
        <mxCell id="users-r3-k" value="" style="shape=partialRectangle;connectable=0;fillColor=none;top=0;left=0;bottom=0;right=0;overflow=hidden;fontSize=11;whiteSpace=wrap;" vertex="1" parent="users-r3">
          <mxGeometry width="40" height="30" as="geometry" />
        </mxCell>
        <mxCell id="users-r3-v" value="name: VARCHAR(100) NOT NULL" style="shape=partialRectangle;connectable=0;fillColor=none;top=0;left=0;bottom=0;right=0;overflow=hidden;fontSize=11;whiteSpace=wrap;" vertex="1" parent="users-r3">
          <mxGeometry x="40" width="220" height="30" as="geometry" />
        </mxCell>
        <mxCell id="users-r4" value="" style="shape=tableRow;horizontal=0;startSize=0;swimlaneHead=0;swimlaneBody=0;fillColor=none;collapsible=0;dropTarget=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;fontSize=11;top=0;left=0;right=0;bottom=0;" vertex="1" parent="users-header">
          <mxGeometry y="120" width="260" height="30" as="geometry" />
        </mxCell>
        <mxCell id="users-r4-k" value="" style="shape=partialRectangle;connectable=0;fillColor=none;top=0;left=0;bottom=0;right=0;overflow=hidden;fontSize=11;whiteSpace=wrap;" vertex="1" parent="users-r4">
          <mxGeometry width="40" height="30" as="geometry" />
        </mxCell>
        <mxCell id="users-r4-v" value="created_at: TIMESTAMP DEFAULT NOW()" style="shape=partialRectangle;connectable=0;fillColor=none;top=0;left=0;bottom=0;right=0;overflow=hidden;fontSize=11;whiteSpace=wrap;" vertex="1" parent="users-r4">
          <mxGeometry x="40" width="220" height="30" as="geometry" />
        </mxCell>
        <!-- Table: orders -->
        <mxCell id="orders-header" value="orders" style="shape=table;startSize=30;container=1;collapsible=1;childLayout=tableLayout;fixedRows=1;rowLines=0;fontStyle=1;align=center;resizeLast=1;fillColor=#D5E8D4;strokeColor=#82B366;fontSize=13;" vertex="1" parent="1">
          <mxGeometry x="500" y="120" width="260" height="150" as="geometry" />
        </mxCell>
        <!-- Relationship edge -->
        <mxCell id="rel-1" value="1:N" style="edgeStyle=orthogonalEdgeStyle;endArrow=ERmany;startArrow=ERone;rounded=0;fontSize=11;exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;" edge="1" source="users-r1" target="orders-header" parent="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

### C4 Architecture Template

```xml
<mxfile host="Claude" modified="2026-03-14T00:00:00.000Z" agent="Claude Code" version="24.0.0" type="device">
  <diagram id="c4-context" name="C4 Context">
    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <!-- Person -->
        <mxCell id="user" value="&lt;b&gt;User&lt;/b&gt;&lt;br&gt;[Person]&lt;br&gt;&lt;br&gt;Uses the web application&lt;br&gt;to manage resources" style="shape=mxgraph.c4.person2;whiteSpace=wrap;html=1;align=center;metaEdit=1;points=[[0.5,0,0],[1,0.5,0],[1,0.75,0],[0.75,1,0],[0.5,1,0],[0.25,1,0],[0,0.75,0],[0,0.5,0]];resizable=0;fillColor=#08427B;fontColor=#ffffff;strokeColor=#073B6F;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="380" y="20" width="200" height="180" as="geometry" />
        </mxCell>
        <!-- System Boundary -->
        <mxCell id="system" value="&lt;b&gt;Platform&lt;/b&gt;&lt;br&gt;[Software System]&lt;br&gt;&lt;br&gt;Core application providing&lt;br&gt;REST API and web UI" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#438DD5;fontColor=#ffffff;strokeColor=#3C7FC0;fontSize=11;arcSize=5;labelBackgroundColor=none;align=center;verticalAlign=middle;" vertex="1" parent="1">
          <mxGeometry x="330" y="280" width="300" height="160" as="geometry" />
        </mxCell>
        <!-- External System -->
        <mxCell id="external-db" value="&lt;b&gt;Database&lt;/b&gt;&lt;br&gt;[External System]&lt;br&gt;&lt;br&gt;PostgreSQL" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#999999;fontColor=#ffffff;strokeColor=#8A8A8A;fontSize=11;arcSize=5;" vertex="1" parent="1">
          <mxGeometry x="680" y="280" width="200" height="160" as="geometry" />
        </mxCell>
        <!-- Edges -->
        <mxCell id="c4-edge-1" value="Uses&lt;br&gt;[HTTPS]" style="endArrow=blockThin;html=1;fontSize=10;fontColor=#404040;strokeWidth=2;endFill=1;strokeColor=#828282;elbow=vertical;metaEdit=1;endSize=14;startSize=14;jumpStyle=arc;jumpSize=16;rounded=0;edgeStyle=orthogonalEdgeStyle;" edge="1" source="user" target="system" parent="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="c4-edge-2" value="Reads/Writes&lt;br&gt;[TCP/5432]" style="endArrow=blockThin;html=1;fontSize=10;fontColor=#404040;strokeWidth=2;endFill=1;strokeColor=#828282;elbow=vertical;metaEdit=1;endSize=14;startSize=14;jumpStyle=arc;jumpSize=16;rounded=0;edgeStyle=orthogonalEdgeStyle;" edge="1" source="system" target="external-db" parent="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

### UML Class Diagram Template

```xml
<mxfile host="Claude" modified="2026-03-14T00:00:00.000Z" agent="Claude Code" version="24.0.0" type="device">
  <diagram id="uml-class-1" name="Class Diagram">
    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <!-- Interface -->
        <mxCell id="irepository" value="&lt;&lt;interface&gt;&gt;&#xa;IRepository&lt;T&gt;" style="swimlane;fontStyle=1;align=center;startSize=40;fontSize=12;fillColor=#DAE8FC;strokeColor=#6C8EBF;" vertex="1" parent="1">
          <mxGeometry x="280" y="40" width="240" height="130" as="geometry" />
        </mxCell>
        <mxCell id="irepository-attrs" value="+ findById(id: string): T&#xa;+ findAll(): T[]&#xa;+ save(entity: T): T&#xa;+ delete(id: string): void" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;fontFamily=Courier New;fontSize=11;" vertex="1" parent="irepository">
          <mxGeometry y="40" width="240" height="90" as="geometry" />
        </mxCell>
        <!-- Concrete Class -->
        <mxCell id="userrepo" value="UserRepository" style="swimlane;fontStyle=1;align=center;startSize=26;fontSize=12;fillColor=#D5E8D4;strokeColor=#82B366;" vertex="1" parent="1">
          <mxGeometry x="80" y="260" width="240" height="160" as="geometry" />
        </mxCell>
        <mxCell id="userrepo-attrs" value="- db: Database&#xa;- cache: Cache" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;fontFamily=Courier New;fontSize=11;" vertex="1" parent="userrepo">
          <mxGeometry y="26" width="240" height="44" as="geometry" />
        </mxCell>
        <mxCell id="userrepo-sep" value="" style="line;strokeWidth=1;fillColor=none;align=left;verticalAlign=middle;spacingTop=-1;spacingLeft=3;spacingRight=10;rotatable=0;labelPosition=left;points=[];portConstraint=eastwest;" vertex="1" parent="userrepo">
          <mxGeometry y="70" width="240" height="8" as="geometry" />
        </mxCell>
        <mxCell id="userrepo-methods" value="+ findById(id: string): User&#xa;+ findByEmail(email: string): User&#xa;+ save(entity: User): User&#xa;+ delete(id: string): void" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;fontFamily=Courier New;fontSize=11;" vertex="1" parent="userrepo">
          <mxGeometry y="78" width="240" height="82" as="geometry" />
        </mxCell>
        <!-- Implements edge -->
        <mxCell id="impl-1" style="endArrow=block;endSize=16;endFill=0;dashed=1;html=1;" edge="1" source="userrepo" target="irepository" parent="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

### Kubernetes Diagram Template

```xml
<mxfile host="Claude" modified="2026-03-14T00:00:00.000Z" agent="Claude Code" version="24.0.0" type="device">
  <diagram id="k8s-1" name="Kubernetes">
    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <!-- Cluster boundary -->
        <mxCell id="cluster" value="K8s Cluster" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#F5F5F5;strokeColor=#666666;dashed=1;dashPattern=5 5;verticalAlign=top;fontStyle=1;fontSize=14;spacingTop=5;arcSize=5;" vertex="1" parent="1">
          <mxGeometry x="40" y="40" width="900" height="500" as="geometry" />
        </mxCell>
        <!-- Namespace -->
        <mxCell id="ns-prod" value="namespace: production" style="rounded=1;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#6C8EBF;dashed=1;verticalAlign=top;fontStyle=2;fontSize=12;spacingTop=5;" vertex="1" parent="1">
          <mxGeometry x="60" y="80" width="860" height="440" as="geometry" />
        </mxCell>
        <!-- Ingress -->
        <mxCell id="ingress" value="Ingress&#xa;nginx-ingress" style="shape=mxgraph.kubernetes.icon2;prIcon=ing;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontStyle=1;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="420" y="110" width="80" height="70" as="geometry" />
        </mxCell>
        <!-- Service -->
        <mxCell id="svc-api" value="Service&#xa;api-svc&#xa;:8080" style="shape=mxgraph.kubernetes.icon2;prIcon=svc;fillColor=#FFCD28;strokeColor=#D79B00;fontStyle=1;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="200" y="240" width="80" height="70" as="geometry" />
        </mxCell>
        <!-- Deployment -->
        <mxCell id="deploy-api" value="Deployment&#xa;api (3 replicas)" style="shape=mxgraph.kubernetes.icon2;prIcon=deploy;fillColor=#D5E8D4;strokeColor=#82B366;fontStyle=1;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="180" y="370" width="120" height="70" as="geometry" />
        </mxCell>
        <!-- Pod -->
        <mxCell id="pod-api" value="Pod&#xa;api-xyz" style="shape=mxgraph.kubernetes.icon2;prIcon=pod;fillColor=#D5E8D4;strokeColor=#82B366;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="100" y="460" width="60" height="50" as="geometry" />
        </mxCell>
        <!-- ConfigMap -->
        <mxCell id="cm" value="ConfigMap&#xa;api-config" style="shape=mxgraph.kubernetes.icon2;prIcon=cm;fillColor=#E1D5E7;strokeColor=#9673A6;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="620" y="370" width="80" height="70" as="geometry" />
        </mxCell>
        <!-- Secret -->
        <mxCell id="secret" value="Secret&#xa;db-credentials" style="shape=mxgraph.kubernetes.icon2;prIcon=secret;fillColor=#F8CECC;strokeColor=#B85450;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="760" y="370" width="80" height="70" as="geometry" />
        </mxCell>
        <!-- Edges -->
        <mxCell id="k-e1" style="edgeStyle=orthogonalEdgeStyle;strokeWidth=2;" edge="1" source="ingress" target="svc-api" parent="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="k-e2" style="edgeStyle=orthogonalEdgeStyle;strokeWidth=2;" edge="1" source="svc-api" target="deploy-api" parent="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

### Swimlane Diagram Template

```xml
<mxfile host="Claude" modified="2026-03-14T00:00:00.000Z" agent="Claude Code" version="24.0.0" type="device">
  <diagram id="swimlane-1" name="Swimlane">
    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <!-- Pool -->
        <mxCell id="pool" value="Order Processing" style="shape=pool;startSize=30;horizontal=1;fillColor=none;fontStyle=1;fontSize=14;swimlaneLine=1;swimlaneHead=1;" vertex="1" parent="1">
          <mxGeometry x="40" y="40" width="900" height="450" as="geometry" />
        </mxCell>
        <!-- Lane: Customer -->
        <mxCell id="lane-customer" value="Customer" style="shape=swimlane;startSize=30;horizontal=0;fillColor=#E1D5E7;strokeColor=#9673A6;fontStyle=1;fontSize=12;" vertex="1" parent="pool">
          <mxGeometry y="30" width="900" height="140" as="geometry" />
        </mxCell>
        <!-- Lane: Sales -->
        <mxCell id="lane-sales" value="Sales" style="shape=swimlane;startSize=30;horizontal=0;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontStyle=1;fontSize=12;" vertex="1" parent="pool">
          <mxGeometry y="170" width="900" height="140" as="geometry" />
        </mxCell>
        <!-- Lane: Fulfillment -->
        <mxCell id="lane-fulfill" value="Fulfillment" style="shape=swimlane;startSize=30;horizontal=0;fillColor=#D5E8D4;strokeColor=#82B366;fontStyle=1;fontSize=12;" vertex="1" parent="pool">
          <mxGeometry y="310" width="900" height="140" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

### Mind Map Template

```xml
<mxfile host="Claude" modified="2026-03-14T00:00:00.000Z" agent="Claude Code" version="24.0.0" type="device">
  <diagram id="mindmap-1" name="Mind Map">
    <mxGraphModel dx="1422" dy="794" grid="0" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <!-- Central topic -->
        <mxCell id="central" value="Project" style="ellipse;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=16;fontStyle=1;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="460" y="340" width="140" height="80" as="geometry" />
        </mxCell>
        <!-- Branch: Features -->
        <mxCell id="b-features" value="Features" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#D5E8D4;strokeColor=#82B366;fontSize=13;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="200" y="180" width="120" height="50" as="geometry" />
        </mxCell>
        <!-- Branch: Tech -->
        <mxCell id="b-tech" value="Tech Stack" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFF2CC;strokeColor=#D6B656;fontSize=13;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="700" y="180" width="120" height="50" as="geometry" />
        </mxCell>
        <!-- Branch: Timeline -->
        <mxCell id="b-timeline" value="Timeline" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#E1D5E7;strokeColor=#9673A6;fontSize=13;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="200" y="520" width="120" height="50" as="geometry" />
        </mxCell>
        <!-- Branch: Team -->
        <mxCell id="b-team" value="Team" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#F8CECC;strokeColor=#B85450;fontSize=13;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="700" y="520" width="120" height="50" as="geometry" />
        </mxCell>
        <!-- Edges (curved for mind map style) -->
        <mxCell id="mm-e1" style="edgeStyle=elbowEdgeStyle;elbow=vertical;curved=1;rounded=1;strokeWidth=2;strokeColor=#6C8EBF;" edge="1" source="central" target="b-features" parent="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="mm-e2" style="edgeStyle=elbowEdgeStyle;elbow=vertical;curved=1;rounded=1;strokeWidth=2;strokeColor=#D6B656;" edge="1" source="central" target="b-tech" parent="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="mm-e3" style="edgeStyle=elbowEdgeStyle;elbow=vertical;curved=1;rounded=1;strokeWidth=2;strokeColor=#9673A6;" edge="1" source="central" target="b-timeline" parent="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="mm-e4" style="edgeStyle=elbowEdgeStyle;elbow=vertical;curved=1;rounded=1;strokeWidth=2;strokeColor=#B85450;" edge="1" source="central" target="b-team" parent="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

## Multi-Page Diagram Support

Create diagrams with multiple pages by adding multiple `<diagram>` elements inside the `<mxfile>` root:

```xml
<mxfile host="Claude">
  <diagram id="page-1" name="Overview">
    <mxGraphModel>
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <!-- Page 1 content -->
      </root>
    </mxGraphModel>
  </diagram>
  <diagram id="page-2" name="Detail View">
    <mxGraphModel>
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <!-- Page 2 content — IDs are scoped per page -->
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

Each page has its own independent ID namespace so cell IDs can be reused across pages.

## Layer Organization

Use layers to separate concerns within a single page. Create additional cells with `parent="0"` after the default layer:

```xml
<root>
  <mxCell id="0" />
  <mxCell id="1" value="Infrastructure" parent="0" />
  <mxCell id="2" value="Application" parent="0" />
  <mxCell id="3" value="Data" parent="0" />
  <mxCell id="4" value="Security" parent="0" style="locked=1;" />

  <!-- Infrastructure layer elements use parent="1" -->
  <mxCell id="vpc" value="VPC" parent="1" ... />

  <!-- Application layer elements use parent="2" -->
  <mxCell id="api" value="API Server" parent="2" ... />

  <!-- Data layer elements use parent="3" -->
  <mxCell id="db" value="PostgreSQL" parent="3" ... />

  <!-- Security layer elements use parent="4" -->
  <mxCell id="fw" value="Firewall Rules" parent="4" ... />
</root>
```

Toggle layer visibility in draw.io to focus on specific concerns.

## Output Format Options

### .drawio (XML)
The native format. Write directly as XML:
```bash
# Write the diagram
cat > architecture.drawio << 'DRAWIO'
<mxfile host="Claude">
  <!-- ... diagram content ... -->
</mxfile>
DRAWIO
```

### .drawio.svg (SVG with embedded diagram)
Export to SVG while preserving editability:
```bash
drawio --export --format svg --embed-diagram architecture.drawio -o architecture.drawio.svg
```

### .drawio.png (PNG with embedded diagram)
Export to PNG while preserving editability:
```bash
drawio --export --format png --embed-diagram architecture.drawio -o architecture.drawio.png
```

## Execution Steps

1. **Analyze context**: scan the working directory, recent conversation, and any explicit instructions
2. **Select diagram type**: use the decision tree above to pick the best type
3. **Choose style preset**: default to Professional unless user specifies otherwise
4. **Select color theme**: assign colors by semantic role (blue=services, green=data, etc.)
5. **Plan layers**: determine 2-4 semantic layers for the diagram (e.g., "Infrastructure"/"Application"/"Data" for architecture, "Actors"/"Process"/"Data" for flowcharts). Layers are NOT optional — they are standard.
6. **Generate XML**: build the full `<mxfile>` wrapped XML with:
   - **CRITICAL**: Always use `<mxfile><diagram><mxGraphModel>` structure — bare `<mxGraphModel>` causes blank files in draw.io
   - Multiple layers as cells with `parent="0"` (not just the default layer)
   - Containers/groups (`container=1;collapsible=1;`) for related elements
   - Edge routing with `rounded=1;jettySize=auto;` on all orthogonal edges
   - Explicit `exitX/exitY/entryX/entryY` on edges between non-aligned shapes
   - `shadow=1;` on primary shapes for depth
   - HTML labels (`html=1;`) with `<b>` for titles and `<br>` for descriptions
   - A title annotation cell at the top
   - A legend group if 3+ color categories are used
   - `jumpStyle=arc;jumpSize=16;` on edges that may cross other edges
   - `strokeWidth=2;` on primary flow edges
7. **Interactive review (ask before writing)**: Before writing the file, ask the user:
   - Confirm diagram type and scope ("I'll create a [type] diagram covering [scope]. Good?")
   - For complex diagrams (10+ elements), propose the layer structure
   - If multiple approaches exist, present options with previews
8. **Write the file**: save as `.drawio` in the appropriate directory
9. **Visual quality critique**: Self-review the generated XML against these standards:
   - **Layout**: Are shapes evenly spaced? No overlaps? Grid-aligned?
   - **Connections**: Do edges use `rounded=1;jettySize=auto;`? Are exit/entry points explicit for non-aligned shapes? No edges crossing through shapes?
   - **Contrast**: Are labels readable against their fill colors? Is font size >= 11pt?
   - **Hierarchy**: Are containers used for related elements? Are layers semantic?
   - **Completeness**: Are all relationships represented? Missing any obvious elements?
   - **Background**: Is `background="none"` set? (transparent, not white)
   - If any issue is found, fix it before reporting
10. **Report**: list the file path, diagram type chosen, layer count, and number of elements created

### Platform-Specific Output Notes

- **Azure DevOps**: Diagrams must be embedded as PNG (not SVG). Use `--export png` or `drawio:export --format png` after creation. Azure DevOps wiki and repos do not render `.drawio.svg` with embedded XML.
- **GitHub**: Use `.drawio.svg` with `--embed-diagram` for editable diagrams in repos
- **Confluence**: Use the draw.io macro for native integration

## Usage Examples

```
# Automatic — analyzes src/ for patterns
drawio:create

# Explicit type
drawio:create --type sequence --title "Auth Flow"

# With style
drawio:create --type er --style sketch --title "Data Model"

# Multi-page
drawio:create --type c4 --pages "Context,Container,Component" --title "System Architecture"

# From code analysis
drawio:create --analyze src/api/routes/ --title "API Sequence Diagram"

# Dark mode
drawio:create --type flowchart --style dark --title "CI/CD Pipeline"
```
