---
name: drawio:auto-diagram
intent: Automatically generate the right diagram by analyzing code, PRs, or conversation context
tags:
  - drawio-diagramming
  - command
  - auto-diagram
inputs: []
risk: low
cost: medium
description: |
  Intelligent diagram generation engine that analyzes source code, git diffs, PR descriptions, and conversation context to automatically select the optimal diagram type and produce production-quality draw.io XML. Supports 12+ diagram types with self-editing refinement, multi-file analysis, incremental updates, and deeply nested hierarchy detection.
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
  - Edit
---

# drawio:auto-diagram

Automatically generate the right diagram by analyzing code, PRs, or conversation context.
This command inspects the codebase, determines the most appropriate diagram type, generates
draw.io-compatible XML, and then self-edits the output for optimal layout and clarity.

---

## Flags

| Flag | Alias | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--scope <level>` | `-s` | string | `directory` | Analysis scope (file, directory, repo, pr) |
| `--type <type>` | `-t` | string | auto-detect | Force a specific diagram type instead of auto-detecting |
| `--output <path>` | `-o` | string | `docs/diagrams/<type>.drawio` | Output file path |
| `--format <fmt>` | `-f` | string | `drawio` | Output format (drawio, svg, png, mermaid) |
| `--update <file>` | `-u` | string | none | Update an existing diagram incrementally instead of regenerating |
| `--pr` | `-P` | boolean | `false` | Analyze PR changes and generate a diagram focused on modified components |
| `--max-depth <n>` | `-d` | number | `5` | Maximum directory depth to scan for source files |
| `--include-tests` | | boolean | `false` | Include test files in analysis (normally excluded) |
| `--include-private` | | boolean | `false` | Include private/internal symbols in class diagrams |
| `--style <preset>` | `-S` | string | `professional` | Visual style preset (professional, sketch, dark, minimal, blueprint) |
| `--theme <name>` | | string | `standard` | Color theme (standard, dark, pastel, high-contrast) |
| `--stat` | | boolean | `false` | Show analysis statistics without generating a diagram |
| `--oneline` | | boolean | `false` | One-line summary output (type, element count, path) |
| `--name-only` | | boolean | `false` | Output only the generated filename |
| `--verbose` | `-v` | boolean | `false` | Show detailed context analysis and type selection reasoning |
| `--dry-run` | `-n` | boolean | `false` | Analyze and report what would be generated without creating files |

### Flag Details

#### Scope & Source Flags
- **`--scope <level>`** (`-s`): Control how much of the project is analyzed. `file` analyzes only the specified file(s). `directory` (default) scans the current or specified directory. `repo` performs a full repository scan. `pr` examines the git diff against the base branch.
- **`--pr`** (`-P`): Shortcut for `--scope pr`. Reads the current branch diff against main/master, identifies changed components, and generates a diagram highlighting additions (green), modifications (yellow), and deletions (red outline).
- **`--max-depth <n>`** (`-d`): Limit directory traversal depth. Set lower for faster analysis in large monorepos. Set higher to discover deeply nested services.
- **`--include-tests`**: By default, test files (`*.test.*`, `*.spec.*`, `__tests__/`) are excluded from analysis. Enable this to include them in class and dependency diagrams.
- **`--include-private`**: By default, private class members and unexported symbols are excluded. Enable for complete class diagrams.

#### Type & Output Flags
- **`--type <type>`** (`-t`): Override the automatic type selection. Options: `class`, `sequence`, `er`, `c4`, `k8s`, `aws`, `azure`, `gcp`, `flowchart`, `component`, `state`, `event`, `network`, `bpmn`.
- **`--output <path>`** (`-o`): Specify the output file. Default path uses the detected diagram type: `docs/diagrams/sequence-api.drawio`.
- **`--format <fmt>`** (`-f`): Output format. `drawio` produces native XML. `svg`/`png` additionally exports the image. `mermaid` generates Mermaid.js text instead of draw.io XML.
- **`--update <file>`** (`-u`): Incremental update mode. Reads an existing diagram, re-analyzes source code, and patches only the changed elements while preserving manual customizations.

#### Style Flags
- **`--style <preset>`** (`-S`): Apply a visual style preset to all generated elements. Affects fill colors, stroke styles, font family, corners, and shadows.
- **`--theme <name>`**: Independent color theme selection. Can be combined with `--style` for fine-grained control.

#### Output Control Flags
- **`--stat`**: Print analysis results (detected patterns, file counts, dominant type) without generating a diagram. Useful for understanding what auto-diagram would produce.
- **`--oneline`**: Compact one-line output: `sequence | 4 participants, 6 messages | docs/diagrams/sequence-api.drawio`.
- **`--name-only`**: Print only the output filename. Useful for scripting: `file=$(drawio:auto-diagram --name-only)`.
- **`--dry-run`** (`-n`): Full analysis pass with detailed output, but no files are written.
- **`--verbose`** (`-v`): Show the complete decision tree evaluation: which patterns were detected, confidence scores, and why the final type was selected.

#### Examples with Flags

```bash
# Auto-detect from current directory
drawio:auto-diagram

# Analyze specific API routes
drawio:auto-diagram src/api/routes/*.ts --type sequence

# PR-based diagram
drawio:auto-diagram --pr --style sketch --output docs/pr-changes.drawio

# Repository-wide architecture
drawio:auto-diagram --scope repo --type c4 --verbose

# Update existing diagram incrementally
drawio:auto-diagram --update docs/architecture.drawio --verbose

# Dry run to preview detection
drawio:auto-diagram --scope repo --dry-run --stat

# Include tests and private members for detailed class diagram
drawio:auto-diagram src/services/ --type class --include-tests --include-private
```

## Context Analysis Engine

The auto-diagram command begins by gathering context from multiple sources to determine
what should be diagrammed and which diagram type best represents the content.

### Source Scanning Priority

1. **Explicit user input** — If the user specifies files, directories, or topics, use those.
2. **Git diff / PR context** — Scan recent changes to identify what was modified.
3. **Conversation history** — Extract mentions of systems, services, or components.
4. **Directory structure** — Analyze the project layout to infer architecture.

### File Analysis Steps

```bash
# Step 1: Identify the primary language and framework
# Scan package.json, requirements.txt, go.mod, Cargo.toml, etc.
cat package.json 2>/dev/null | python3 -c "
import json, sys
pkg = json.load(sys.stdin)
deps = {**pkg.get('dependencies', {}), **pkg.get('devDependencies', {})}
frameworks = []
if 'react' in deps: frameworks.append('react')
if 'vue' in deps: frameworks.append('vue')
if '@angular/core' in deps: frameworks.append('angular')
if 'express' in deps: frameworks.append('express')
if 'fastify' in deps: frameworks.append('fastify')
if 'next' in deps: frameworks.append('next')
print(','.join(frameworks))
"

# Step 2: Identify file patterns
# Count files by type to determine the dominant pattern
find . -type f -name "*.py" | head -50
find . -type f -name "*.ts" -o -name "*.tsx" | head -50
find . -type f -name "Dockerfile" -o -name "docker-compose*.yml" | head -20
find . -type f -name "*.tf" -o -name "*.hcl" | head -20
find . -type f -name "*.prisma" -o -name "*.schema" | head -20

# Step 3: Analyze git diff for PR-based diagrams
git diff --name-only HEAD~5..HEAD 2>/dev/null
git log --oneline -10 2>/dev/null
```

### PR Context Analysis

When triggered in the context of a pull request:

1. Parse the PR title and description for keywords (e.g., "refactor auth", "add API endpoint").
2. Examine the list of changed files to identify affected subsystems.
3. Group changes by directory to find the scope of modification.
4. Generate a diagram focused on the changed components and their relationships.

```bash
# Extract PR context from git
git log --format="%s%n%b" origin/main..HEAD 2>/dev/null | head -50

# Identify changed modules
git diff --stat origin/main..HEAD 2>/dev/null
```

---

## Automatic Diagram Type Selection

The decision tree below maps detected file patterns to the optimal diagram type.
When multiple patterns are detected, the command selects the most specific match
or generates multiple complementary diagrams.

### Decision Tree

```
INPUT FILES / CONTEXT
│
├─ Python/JS/TS class files with inheritance
│  └─► UML Class Diagram
│      Detect: class declarations, extends/implements, decorators
│      Trigger files: *.py with `class`, *.ts with `class`, *.java
│
├─ API route files (Express, FastAPI, Flask, NestJS)
│  └─► Sequence Diagram
│      Detect: @app.route, router.get/post, @Controller, @Get/@Post
│      Trigger files: routes/*.ts, **/controllers/**, **/api/**
│
├─ Database models (Prisma, SQLAlchemy, Mongoose, TypeORM)
│  └─► ER Diagram (Entity-Relationship)
│      Detect: model declarations, @Entity, Schema({, relation fields
│      Trigger files: *.prisma, models/*.py, **/entities/**
│
├─ Docker/Kubernetes files
│  └─► Container Architecture / K8s Diagram
│      Detect: FROM, services:, kind: Deployment/Service/Ingress
│      Trigger files: Dockerfile, docker-compose*.yml, k8s/*.yaml
│
├─ Terraform/Pulumi/CloudFormation files
│  └─► Cloud Infrastructure Diagram (AWS/Azure/GCP)
│      Detect: resource blocks, provider blocks, AWS::, azurerm_
│      Trigger files: *.tf, Pulumi.yaml, *.template.json
│
├─ CI/CD pipeline files
│  └─► BPMN / Flowchart
│      Detect: jobs:, stages:, pipeline:, steps:
│      Trigger files: .github/workflows/*.yml, Jenkinsfile, .gitlab-ci.yml,
│                     .harness/*.yaml, azure-pipelines.yml
│
├─ React/Vue/Angular component files
│  └─► Component Hierarchy Diagram
│      Detect: import Component, export default, <template>, @Component
│      Trigger files: *.tsx, *.vue, *.component.ts
│
├─ Microservice repository (multiple services detected)
│  └─► C4 Container / Component Diagram
│      Detect: multiple Dockerfiles, service directories, API gateways
│      Trigger: 3+ services with independent package.json or requirements.txt
│
├─ State machine definitions
│  └─► UML State Diagram
│      Detect: createMachine, states:, transitions:, reducers, createSlice
│      Trigger files: **/machines/**, **/store/**, **/reducers/**
│
├─ Message queue configurations
│  └─► Event Flow Diagram
│      Detect: kafka, rabbitmq, AMQP, SQS, pub/sub, event emitters
│      Trigger files: **/events/**, **/queues/**, **/messaging/**
│
└─ Network configuration files
   └─► Network Topology Diagram
       Detect: subnet, CIDR, firewall rules, load balancer, VPC, VLAN
       Trigger files: **/network/**, *.tf with aws_vpc/azurerm_virtual_network
```

### Multi-Pattern Resolution

When multiple patterns are detected simultaneously:

1. **Primary diagram**: The pattern with the most matching files.
2. **Secondary diagrams**: Suggested as follow-up generation targets.
3. **Composite diagram**: For tightly coupled patterns (e.g., Docker + K8s), generate a single unified diagram.

```
Priority ranking:
  1. Cloud infrastructure (broadest scope)
  2. C4 / Microservice architecture
  3. Container / K8s architecture
  4. ER diagrams (data layer)
  5. Component hierarchy (UI layer)
  6. Sequence diagrams (interaction layer)
  7. Class diagrams (code layer)
  8. State diagrams (behavior layer)
  9. Event flow (messaging layer)
  10. Network topology (network layer)
  11. CI/CD flowcharts (pipeline layer)
```

---

## Diagram Generation Templates

### UML Class Diagram

Generated when Python/JS/TS class files with inheritance are detected.

```xml
<mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1" tooltips="1"
              connect="1" arrows="1" fold="1" page="1" pageScale="1"
              pageWidth="1169" pageHeight="827" math="0" shadow="0">
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>

    <!-- Class: BaseModel -->
    <mxCell id="class-1" value="&lt;b&gt;BaseModel&lt;/b&gt;"
            style="swimlane;fontStyle=1;align=center;startSize=26;
                   fillColor=#dae8fc;strokeColor=#6c8ebf;rounded=1;
                   arcSize=10;fontSize=12;fontFamily=Helvetica;"
            vertex="1" parent="1">
      <mxGeometry x="340" y="40" width="200" height="120" as="geometry"/>
    </mxCell>
    <!-- Attributes section -->
    <mxCell id="class-1-attrs" value="+ id: string&#xa;+ created_at: datetime&#xa;+ updated_at: datetime"
            style="text;align=left;verticalAlign=top;spacingLeft=4;
                   spacingRight=4;overflow=hidden;rotatable=0;
                   whiteSpace=wrap;fontSize=11;fontFamily=Courier New;"
            vertex="1" parent="class-1">
      <mxGeometry y="26" width="200" height="54" as="geometry"/>
    </mxCell>
    <!-- Methods section -->
    <mxCell id="class-1-methods" value="+ save(): void&#xa;+ delete(): void"
            style="text;align=left;verticalAlign=top;spacingLeft=4;
                   spacingRight=4;overflow=hidden;rotatable=0;
                   whiteSpace=wrap;fontSize=11;fontFamily=Courier New;"
            vertex="1" parent="class-1">
      <mxGeometry y="80" width="200" height="40" as="geometry"/>
    </mxCell>

    <!-- Class: User extends BaseModel -->
    <mxCell id="class-2" value="&lt;b&gt;User&lt;/b&gt;"
            style="swimlane;fontStyle=1;align=center;startSize=26;
                   fillColor=#dae8fc;strokeColor=#6c8ebf;rounded=1;
                   arcSize=10;fontSize=12;fontFamily=Helvetica;"
            vertex="1" parent="1">
      <mxGeometry x="140" y="240" width="200" height="120" as="geometry"/>
    </mxCell>
    <mxCell id="class-2-attrs" value="+ email: string&#xa;+ name: string&#xa;+ role: Role"
            style="text;align=left;verticalAlign=top;spacingLeft=4;
                   spacingRight=4;overflow=hidden;rotatable=0;
                   whiteSpace=wrap;fontSize=11;fontFamily=Courier New;"
            vertex="1" parent="class-2">
      <mxGeometry y="26" width="200" height="54" as="geometry"/>
    </mxCell>
    <mxCell id="class-2-methods" value="+ authenticate(): bool&#xa;+ getPermissions(): list"
            style="text;align=left;verticalAlign=top;spacingLeft=4;
                   spacingRight=4;overflow=hidden;rotatable=0;
                   whiteSpace=wrap;fontSize=11;fontFamily=Courier New;"
            vertex="1" parent="class-2">
      <mxGeometry y="80" width="200" height="40" as="geometry"/>
    </mxCell>

    <!-- Inheritance arrow: User -> BaseModel -->
    <mxCell id="inherit-1" value=""
            style="endArrow=block;endSize=16;endFill=0;
                   strokeColor=#6c8ebf;strokeWidth=2;"
            edge="1" source="class-2" target="class-1" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>
```

### Sequence Diagram

Generated when API route files are detected.

```xml
<mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1" tooltips="1"
              connect="1" arrows="1" fold="1" page="1" pageScale="1"
              pageWidth="1169" pageHeight="827" math="0" shadow="0">
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>

    <!-- Participant: Client -->
    <mxCell id="p1" value="Client"
            style="shape=umlLifeline;perimeter=lifelinePerimeter;
                   whiteSpace=wrap;container=1;dropTarget=0;
                   collapsible=0;recursiveResize=0;outlineConnect=0;
                   portConstraint=eastwest;newEdgeStyle={&quot;curved&quot;:0,
                   &quot;rounded&quot;:0};fillColor=#d5e8d4;strokeColor=#82b366;
                   fontSize=13;fontStyle=1;"
            vertex="1" parent="1">
      <mxGeometry x="80" y="40" width="100" height="400" as="geometry"/>
    </mxCell>

    <!-- Participant: API Gateway -->
    <mxCell id="p2" value="API Gateway"
            style="shape=umlLifeline;perimeter=lifelinePerimeter;
                   whiteSpace=wrap;container=1;dropTarget=0;
                   collapsible=0;recursiveResize=0;outlineConnect=0;
                   portConstraint=eastwest;newEdgeStyle={&quot;curved&quot;:0,
                   &quot;rounded&quot;:0};fillColor=#dae8fc;strokeColor=#6c8ebf;
                   fontSize=13;fontStyle=1;"
            vertex="1" parent="1">
      <mxGeometry x="280" y="40" width="120" height="400" as="geometry"/>
    </mxCell>

    <!-- Participant: Auth Service -->
    <mxCell id="p3" value="Auth Service"
            style="shape=umlLifeline;perimeter=lifelinePerimeter;
                   whiteSpace=wrap;container=1;dropTarget=0;
                   collapsible=0;recursiveResize=0;outlineConnect=0;
                   portConstraint=eastwest;newEdgeStyle={&quot;curved&quot;:0,
                   &quot;rounded&quot;:0};fillColor=#fff2cc;strokeColor=#d6b656;
                   fontSize=13;fontStyle=1;"
            vertex="1" parent="1">
      <mxGeometry x="500" y="40" width="120" height="400" as="geometry"/>
    </mxCell>

    <!-- Participant: Database -->
    <mxCell id="p4" value="Database"
            style="shape=umlLifeline;perimeter=lifelinePerimeter;
                   whiteSpace=wrap;container=1;dropTarget=0;
                   collapsible=0;recursiveResize=0;outlineConnect=0;
                   portConstraint=eastwest;newEdgeStyle={&quot;curved&quot;:0,
                   &quot;rounded&quot;:0};fillColor=#f8cecc;strokeColor=#b85450;
                   fontSize=13;fontStyle=1;"
            vertex="1" parent="1">
      <mxGeometry x="720" y="40" width="100" height="400" as="geometry"/>
    </mxCell>

    <!-- Message: POST /api/login -->
    <mxCell id="msg1" value="POST /api/login"
            style="html=1;verticalAlign=bottom;endArrow=block;curved=0;
                   rounded=0;fontSize=11;strokeWidth=1;"
            edge="1" parent="1">
      <mxGeometry relative="1" as="geometry">
        <mxPoint x="130" y="120" as="sourcePoint"/>
        <mxPoint x="340" y="120" as="targetPoint"/>
      </mxGeometry>
    </mxCell>

    <!-- Message: validateToken() -->
    <mxCell id="msg2" value="validateToken()"
            style="html=1;verticalAlign=bottom;endArrow=block;curved=0;
                   rounded=0;fontSize=11;strokeWidth=1;"
            edge="1" parent="1">
      <mxGeometry relative="1" as="geometry">
        <mxPoint x="340" y="160" as="sourcePoint"/>
        <mxPoint x="560" y="160" as="targetPoint"/>
      </mxGeometry>
    </mxCell>

    <!-- Message: SELECT user -->
    <mxCell id="msg3" value="SELECT * FROM users WHERE..."
            style="html=1;verticalAlign=bottom;endArrow=block;curved=0;
                   rounded=0;fontSize=11;strokeWidth=1;"
            edge="1" parent="1">
      <mxGeometry relative="1" as="geometry">
        <mxPoint x="560" y="200" as="sourcePoint"/>
        <mxPoint x="770" y="200" as="targetPoint"/>
      </mxGeometry>
    </mxCell>

    <!-- Response: user record -->
    <mxCell id="msg4" value="user record"
            style="html=1;verticalAlign=bottom;endArrow=open;dashed=1;
                   curved=0;rounded=0;fontSize=11;strokeWidth=1;"
            edge="1" parent="1">
      <mxGeometry relative="1" as="geometry">
        <mxPoint x="770" y="240" as="sourcePoint"/>
        <mxPoint x="560" y="240" as="targetPoint"/>
      </mxGeometry>
    </mxCell>

    <!-- Response: JWT token -->
    <mxCell id="msg5" value="JWT token"
            style="html=1;verticalAlign=bottom;endArrow=open;dashed=1;
                   curved=0;rounded=0;fontSize=11;strokeWidth=1;"
            edge="1" parent="1">
      <mxGeometry relative="1" as="geometry">
        <mxPoint x="560" y="280" as="sourcePoint"/>
        <mxPoint x="340" y="280" as="targetPoint"/>
      </mxGeometry>
    </mxCell>

    <!-- Response: 200 OK { token } -->
    <mxCell id="msg6" value="200 OK { token }"
            style="html=1;verticalAlign=bottom;endArrow=open;dashed=1;
                   curved=0;rounded=0;fontSize=11;strokeWidth=1;"
            edge="1" parent="1">
      <mxGeometry relative="1" as="geometry">
        <mxPoint x="340" y="320" as="sourcePoint"/>
        <mxPoint x="130" y="320" as="targetPoint"/>
      </mxGeometry>
    </mxCell>
  </root>
</mxGraphModel>
```

### ER Diagram

Generated when database model files are detected.

```xml
<mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1" tooltips="1"
              connect="1" arrows="1" fold="1" page="1" pageScale="1"
              pageWidth="1169" pageHeight="827" math="0" shadow="0">
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>

    <!-- Entity: users -->
    <mxCell id="entity-users" value="users"
            style="shape=table;startSize=30;container=1;collapsible=1;
                   childLayout=tableLayout;fixedRows=1;rowLines=0;
                   fontStyle=1;align=center;resizeLast=1;
                   fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=13;"
            vertex="1" parent="1">
      <mxGeometry x="80" y="80" width="240" height="180" as="geometry"/>
    </mxCell>
    <!-- PK row -->
    <mxCell id="users-pk" value=""
            style="shape=tableRow;horizontal=0;startSize=0;swimlaneHead=0;
                   swimlaneBody=0;fillColor=none;collapsible=0;dropTarget=0;
                   points=[[0,0.5],[1,0.5]];portConstraint=eastwest;
                   fontSize=11;top=0;left=0;right=0;bottom=1;"
            vertex="1" parent="entity-users">
      <mxGeometry y="30" width="240" height="30" as="geometry"/>
    </mxCell>
    <mxCell id="users-pk-icon" value="PK"
            style="shape=partialRectangle;connectable=0;fillColor=none;
                   top=0;left=0;bottom=0;right=1;fontStyle=1;
                   overflow=hidden;fontSize=10;fontColor=#6c8ebf;"
            vertex="1" parent="users-pk">
      <mxGeometry width="40" height="30" as="geometry"/>
    </mxCell>
    <mxCell id="users-pk-name" value="id UUID NOT NULL"
            style="shape=partialRectangle;connectable=0;fillColor=none;
                   top=0;left=0;bottom=0;right=0;align=left;spacingLeft=6;
                   fontStyle=5;overflow=hidden;fontSize=11;"
            vertex="1" parent="users-pk">
      <mxGeometry x="40" width="200" height="30" as="geometry"/>
    </mxCell>
    <!-- Column rows follow the same pattern for email, name, role_id, etc. -->
  </root>
</mxGraphModel>
```

### Container / Kubernetes Architecture Diagram

Generated when Docker and Kubernetes files are detected.

```xml
<mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1" tooltips="1"
              connect="1" arrows="1" fold="1" page="1" pageScale="1"
              pageWidth="1169" pageHeight="827" math="0" shadow="0">
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>

    <!-- K8s Cluster boundary -->
    <mxCell id="cluster" value="Kubernetes Cluster"
            style="rounded=1;whiteSpace=wrap;html=1;fillColor=none;
                   strokeColor=#666666;dashed=1;dashPattern=8 4;
                   strokeWidth=2;fontSize=14;fontStyle=1;
                   verticalAlign=top;spacingTop=10;arcSize=6;"
            vertex="1" parent="1">
      <mxGeometry x="40" y="40" width="900" height="500" as="geometry"/>
    </mxCell>

    <!-- Namespace: production -->
    <mxCell id="ns-prod" value="namespace: production"
            style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f5f5f5;
                   strokeColor=#999999;dashed=1;strokeWidth=1;
                   fontSize=12;fontStyle=1;verticalAlign=top;
                   spacingTop=8;arcSize=4;"
            vertex="1" parent="1">
      <mxGeometry x="60" y="80" width="860" height="440" as="geometry"/>
    </mxCell>

    <!-- Ingress -->
    <mxCell id="ingress" value="Ingress&#xa;nginx-ingress"
            style="shape=mxgraph.kubernetes.icon2;prIcon=ing;
                   fillColor=#326CE5;fontColor=#ffffff;strokeColor=none;
                   fontSize=11;fontStyle=1;labelPosition=center;
                   verticalLabelPosition=bottom;align=center;"
            vertex="1" parent="1">
      <mxGeometry x="420" y="110" width="50" height="48" as="geometry"/>
    </mxCell>

    <!-- Service: api-gateway -->
    <mxCell id="svc-api" value="Service&#xa;api-gateway:8080"
            style="shape=mxgraph.kubernetes.icon2;prIcon=svc;
                   fillColor=#326CE5;fontColor=#ffffff;strokeColor=none;
                   fontSize=10;labelPosition=center;
                   verticalLabelPosition=bottom;"
            vertex="1" parent="1">
      <mxGeometry x="420" y="220" width="50" height="48" as="geometry"/>
    </mxCell>

    <!-- Deployment: api-gateway (3 replicas) -->
    <mxCell id="deploy-api" value="Deployment&#xa;api-gateway (3)"
            style="shape=mxgraph.kubernetes.icon2;prIcon=deploy;
                   fillColor=#326CE5;fontColor=#ffffff;strokeColor=none;
                   fontSize=10;labelPosition=center;
                   verticalLabelPosition=bottom;"
            vertex="1" parent="1">
      <mxGeometry x="420" y="330" width="50" height="48" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>
```

### Cloud Infrastructure Diagram

Generated when Terraform, Pulumi, or CloudFormation files are detected.

```xml
<!-- AWS Example: VPC with public/private subnets -->
<mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1" tooltips="1"
              connect="1" arrows="1" fold="1" page="1" pageScale="1"
              pageWidth="1169" pageHeight="827" math="0" shadow="0">
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>

    <!-- AWS Cloud boundary -->
    <mxCell id="aws-cloud" value="AWS Cloud"
            style="points=[[0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],[1,0.25],
                   [1,0.5],[1,0.75],[1,1],[0.75,1],[0.5,1],[0.25,1],[0,1],
                   [0,0.75],[0,0.5],[0,0.25]];outlineConnect=0;
                   gradientColor=none;html=1;whiteSpace=wrap;fontSize=14;
                   fontStyle=1;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_aws_cloud;
                   strokeColor=#AAB7B8;fillColor=none;verticalAlign=top;
                   align=left;spacingLeft=30;spacingTop=4;dashed=0;"
            vertex="1" parent="1">
      <mxGeometry x="20" y="20" width="1100" height="700" as="geometry"/>
    </mxCell>

    <!-- VPC -->
    <mxCell id="vpc" value="VPC 10.0.0.0/16"
            style="points=[[0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],[1,0.25],
                   [1,0.5],[1,0.75],[1,1],[0.75,1],[0.5,1],[0.25,1],[0,1],
                   [0,0.75],[0,0.5],[0,0.25]];outlineConnect=0;
                   gradientColor=none;html=1;whiteSpace=wrap;fontSize=13;
                   fontStyle=1;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_vpc2;
                   strokeColor=#8C4FFF;fillColor=none;verticalAlign=top;
                   align=left;spacingLeft=30;dashed=0;"
            vertex="1" parent="1">
      <mxGeometry x="40" y="60" width="1060" height="640" as="geometry"/>
    </mxCell>

    <!-- Public Subnet -->
    <mxCell id="pub-subnet" value="Public Subnet&#xa;10.0.1.0/24"
            style="points=[[0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],[1,0.25],
                   [1,0.5],[1,0.75],[1,1],[0.75,1],[0.5,1],[0.25,1],[0,1],
                   [0,0.75],[0,0.5],[0,0.25]];outlineConnect=0;
                   gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;
                   fontStyle=1;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_security_group;
                   strokeColor=#7AA116;fillColor=#E9F3E6;verticalAlign=top;
                   align=left;spacingLeft=30;dashed=0;"
            vertex="1" parent="1">
      <mxGeometry x="60" y="100" width="480" height="280" as="geometry"/>
    </mxCell>

    <!-- Private Subnet -->
    <mxCell id="priv-subnet" value="Private Subnet&#xa;10.0.2.0/24"
            style="points=[[0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],[1,0.25],
                   [1,0.5],[1,0.75],[1,1],[0.75,1],[0.5,1],[0.25,1],[0,1],
                   [0,0.75],[0,0.5],[0,0.25]];outlineConnect=0;
                   gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;
                   fontStyle=1;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_security_group;
                   strokeColor=#147EBA;fillColor=#E6F2F8;verticalAlign=top;
                   align=left;spacingLeft=30;dashed=0;"
            vertex="1" parent="1">
      <mxGeometry x="580" y="100" width="480" height="280" as="geometry"/>
    </mxCell>

    <!-- ALB in public subnet -->
    <mxCell id="alb" value="Application&#xa;Load Balancer"
            style="outlineConnect=0;fontColor=#232F3E;gradientColor=none;
                   fillColor=#8C4FFF;strokeColor=none;dashed=0;
                   verticalLabelPosition=bottom;verticalAlign=top;
                   align=center;html=1;fontSize=11;fontStyle=0;
                   aspect=fixed;pointerEvents=1;
                   shape=mxgraph.aws4.application_load_balancer;"
            vertex="1" parent="1">
      <mxGeometry x="240" y="180" width="60" height="60" as="geometry"/>
    </mxCell>

    <!-- EC2 instances in private subnet -->
    <mxCell id="ec2-1" value="EC2&#xa;App Server"
            style="outlineConnect=0;fontColor=#232F3E;gradientColor=none;
                   fillColor=#ED7100;strokeColor=none;dashed=0;
                   verticalLabelPosition=bottom;verticalAlign=top;
                   align=center;html=1;fontSize=11;fontStyle=0;
                   aspect=fixed;pointerEvents=1;
                   shape=mxgraph.aws4.ec2_instance;"
            vertex="1" parent="1">
      <mxGeometry x="720" y="160" width="60" height="60" as="geometry"/>
    </mxCell>

    <!-- RDS in private subnet -->
    <mxCell id="rds" value="RDS&#xa;PostgreSQL"
            style="outlineConnect=0;fontColor=#232F3E;gradientColor=none;
                   fillColor=#C925D1;strokeColor=none;dashed=0;
                   verticalLabelPosition=bottom;verticalAlign=top;
                   align=center;html=1;fontSize=11;fontStyle=0;
                   aspect=fixed;pointerEvents=1;
                   shape=mxgraph.aws4.rds_instance;"
            vertex="1" parent="1">
      <mxGeometry x="900" y="160" width="60" height="60" as="geometry"/>
    </mxCell>

    <!-- Connections -->
    <mxCell id="conn-alb-ec2" style="edgeStyle=orthogonalEdgeStyle;rounded=1;
            strokeColor=#666666;strokeWidth=2;endArrow=block;endFill=1;"
            edge="1" source="alb" target="ec2-1" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="conn-ec2-rds" style="edgeStyle=orthogonalEdgeStyle;rounded=1;
            strokeColor=#666666;strokeWidth=2;endArrow=block;endFill=1;"
            edge="1" source="ec2-1" target="rds" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>
```

### CI/CD Pipeline Flowchart

Generated when workflow or pipeline files are detected.

```xml
<mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1" tooltips="1"
              connect="1" arrows="1" fold="1" page="1" pageScale="1"
              pageWidth="1169" pageHeight="827" math="0" shadow="0">
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>

    <!-- Start -->
    <mxCell id="start" value="Push to main"
            style="ellipse;whiteSpace=wrap;html=1;fillColor=#d5e8d4;
                   strokeColor=#82b366;fontSize=12;fontStyle=1;"
            vertex="1" parent="1">
      <mxGeometry x="80" y="180" width="120" height="60" as="geometry"/>
    </mxCell>

    <!-- Build step -->
    <mxCell id="build" value="Build &amp;&#xa;Unit Tests"
            style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;
                   strokeColor=#6c8ebf;fontSize=12;fontStyle=1;arcSize=20;"
            vertex="1" parent="1">
      <mxGeometry x="260" y="180" width="120" height="60" as="geometry"/>
    </mxCell>

    <!-- Decision: Tests pass? -->
    <mxCell id="decision" value="Tests&#xa;pass?"
            style="rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;
                   strokeColor=#d6b656;fontSize=12;fontStyle=1;"
            vertex="1" parent="1">
      <mxGeometry x="440" y="165" width="100" height="90" as="geometry"/>
    </mxCell>

    <!-- Deploy to staging -->
    <mxCell id="staging" value="Deploy to&#xa;Staging"
            style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;
                   strokeColor=#6c8ebf;fontSize=12;fontStyle=1;arcSize=20;"
            vertex="1" parent="1">
      <mxGeometry x="620" y="180" width="120" height="60" as="geometry"/>
    </mxCell>

    <!-- Notify failure -->
    <mxCell id="fail" value="Notify&#xa;Failure"
            style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f8cecc;
                   strokeColor=#b85450;fontSize=12;fontStyle=1;arcSize=20;"
            vertex="1" parent="1">
      <mxGeometry x="440" y="340" width="100" height="60" as="geometry"/>
    </mxCell>

    <!-- Edges -->
    <mxCell id="e1" style="edgeStyle=orthogonalEdgeStyle;rounded=1;
            strokeWidth=2;endArrow=block;endFill=1;"
            edge="1" source="start" target="build" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="e2" style="edgeStyle=orthogonalEdgeStyle;rounded=1;
            strokeWidth=2;endArrow=block;endFill=1;"
            edge="1" source="build" target="decision" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="e3" value="Yes" style="edgeStyle=orthogonalEdgeStyle;rounded=1;
            strokeWidth=2;endArrow=block;endFill=1;fontSize=11;"
            edge="1" source="decision" target="staging" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="e4" value="No" style="edgeStyle=orthogonalEdgeStyle;rounded=1;
            strokeWidth=2;endArrow=block;endFill=1;fontSize=11;
            strokeColor=#b85450;"
            edge="1" source="decision" target="fail" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>
```

### Component Hierarchy Diagram

Generated for React/Vue/Angular component trees.

```xml
<mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1" tooltips="1"
              connect="1" arrows="1" fold="1" page="1" pageScale="1"
              pageWidth="1169" pageHeight="827" math="0" shadow="0">
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>

    <!-- App (root) -->
    <mxCell id="app" value="&lt;App /&gt;"
            style="rounded=1;whiteSpace=wrap;html=1;fillColor=#6d8764;
                   fontColor=#ffffff;strokeColor=#3A5431;fontSize=14;
                   fontStyle=1;arcSize=20;shadow=1;"
            vertex="1" parent="1">
      <mxGeometry x="400" y="40" width="140" height="50" as="geometry"/>
    </mxCell>

    <!-- Layout -->
    <mxCell id="layout" value="&lt;Layout /&gt;"
            style="rounded=1;whiteSpace=wrap;html=1;fillColor=#647687;
                   fontColor=#ffffff;strokeColor=#314354;fontSize=12;
                   fontStyle=1;arcSize=20;"
            vertex="1" parent="1">
      <mxGeometry x="400" y="140" width="140" height="40" as="geometry"/>
    </mxCell>

    <!-- Header -->
    <mxCell id="header" value="&lt;Header /&gt;"
            style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;
                   strokeColor=#6c8ebf;fontSize=11;fontStyle=1;arcSize=20;"
            vertex="1" parent="1">
      <mxGeometry x="160" y="240" width="120" height="36" as="geometry"/>
    </mxCell>

    <!-- Sidebar -->
    <mxCell id="sidebar" value="&lt;Sidebar /&gt;"
            style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;
                   strokeColor=#6c8ebf;fontSize=11;fontStyle=1;arcSize=20;"
            vertex="1" parent="1">
      <mxGeometry x="340" y="240" width="120" height="36" as="geometry"/>
    </mxCell>

    <!-- MainContent -->
    <mxCell id="main" value="&lt;MainContent /&gt;"
            style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;
                   strokeColor=#6c8ebf;fontSize=11;fontStyle=1;arcSize=20;"
            vertex="1" parent="1">
      <mxGeometry x="520" y="240" width="140" height="36" as="geometry"/>
    </mxCell>

    <!-- Footer -->
    <mxCell id="footer" value="&lt;Footer /&gt;"
            style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;
                   strokeColor=#6c8ebf;fontSize=11;fontStyle=1;arcSize=20;"
            vertex="1" parent="1">
      <mxGeometry x="720" y="240" width="120" height="36" as="geometry"/>
    </mxCell>

    <!-- Tree edges -->
    <mxCell edge="1" source="app" target="layout" parent="1"
            style="edgeStyle=orthogonalEdgeStyle;rounded=1;strokeWidth=2;
                   endArrow=none;strokeColor=#666;">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" source="layout" target="header" parent="1"
            style="edgeStyle=orthogonalEdgeStyle;rounded=1;strokeWidth=1.5;
                   endArrow=none;strokeColor=#999;">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" source="layout" target="sidebar" parent="1"
            style="edgeStyle=orthogonalEdgeStyle;rounded=1;strokeWidth=1.5;
                   endArrow=none;strokeColor=#999;">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" source="layout" target="main" parent="1"
            style="edgeStyle=orthogonalEdgeStyle;rounded=1;strokeWidth=1.5;
                   endArrow=none;strokeColor=#999;">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell edge="1" source="layout" target="footer" parent="1"
            style="edgeStyle=orthogonalEdgeStyle;rounded=1;strokeWidth=1.5;
                   endArrow=none;strokeColor=#999;">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>
```

---

## Self-Editing Refinement

After initial diagram generation, the auto-diagram command performs a self-editing pass
to improve quality. This is a critical step that distinguishes auto-diagram from simple
template filling.

### Refinement Steps

1. **Layout analysis**: Check for overlapping cells by comparing geometry bounds.
2. **Spacing normalization**: Ensure consistent gaps between elements (minimum 40px).
3. **Connection routing**: Verify edges do not cross unnecessarily; reroute if needed.
4. **Label readability**: Ensure text fits within cell bounds; resize cells if text overflows.
5. **Alignment**: Snap elements to grid and align rows/columns of related elements.
6. **Color consistency**: Verify all elements of the same type share the same style.
7. **Legend addition**: For diagrams with 4+ distinct element types, add a legend.

### Overlap Detection Algorithm

```python
def detect_overlaps(cells):
    """Check all cell pairs for geometric overlap."""
    overlaps = []
    for i, a in enumerate(cells):
        for b in cells[i+1:]:
            if (a.x < b.x + b.width and a.x + a.width > b.x and
                a.y < b.y + b.height and a.y + a.height > b.y):
                overlaps.append((a.id, b.id))
    return overlaps

def resolve_overlaps(cells, overlaps):
    """Shift overlapping cells apart with minimum displacement."""
    for a_id, b_id in overlaps:
        a = get_cell(cells, a_id)
        b = get_cell(cells, b_id)
        # Move b to the right or below a, whichever requires less displacement
        shift_right = (a.x + a.width + 40) - b.x
        shift_down = (a.y + a.height + 40) - b.y
        if shift_right < shift_down:
            b.x += shift_right
        else:
            b.y += shift_down
```

### Connection Crossing Minimization

After placing all elements, the command counts edge crossings and attempts to reduce
them by reordering sibling elements within the same layer. For tree-like diagrams,
the barycenter heuristic is used to minimize crossings between adjacent layers.

---

## Multi-File Analysis

When analyzing entire directories or repositories, the command performs a breadth-first
scan to build a comprehensive system model before generating the diagram.

### Scan Strategy

```bash
# Phase 1: Identify entry points
find . -name "main.*" -o -name "index.*" -o -name "app.*" -o -name "server.*" \
  | grep -v node_modules | grep -v .git | head -20

# Phase 2: Trace imports/dependencies
# For each entry point, follow import chains to build the dependency graph

# Phase 3: Identify clusters
# Group tightly-coupled files into subsystems based on import density

# Phase 4: Generate the appropriate diagram level
# If 1-5 files: detailed class/sequence diagram
# If 6-20 files: component diagram
# If 20+ files: C4 container diagram (high-level)
```

### Directory-to-Subsystem Mapping

```
src/
├── auth/          → "Auth Service" component
├── api/           → "API Gateway" component
│   ├── routes/    → Sequence diagram candidates
│   └── middleware/ → Cross-cutting concern
├── models/        → ER diagram candidates
├── services/      → Business logic components
├── workers/       → Background processing component
└── utils/         → Shared utilities (omit from architecture diagrams)
```

---

## Incremental Updates

When a diagram already exists, the command detects changes and updates only the
affected portions rather than regenerating from scratch.

### Change Detection

1. Parse the existing `.drawio` file to extract all cell IDs and their metadata.
2. Re-analyze the source code to build the current state model.
3. Compute a diff between the diagram model and the code model.
4. Apply minimal edits: add new cells, remove deleted cells, update changed labels/styles.

### Preserving User Customization

The command respects cells that have been manually repositioned or restyled by the user.
It does this by:

- Checking for a `data-auto="true"` custom attribute on auto-generated cells.
- Only modifying cells that have this attribute.
- Never moving or restyling cells without the attribute (assumed to be user-customized).
- Adding new cells in available whitespace near related existing cells.

```xml
<!-- Auto-generated cell (safe to update) -->
<UserObject label="UserService" data-auto="true" id="svc-1">
  <mxCell style="rounded=1;fillColor=#dae8fc;strokeColor=#6c8ebf;"
          vertex="1" parent="1">
    <mxGeometry x="200" y="100" width="140" height="50" as="geometry"/>
  </mxCell>
</UserObject>

<!-- User-customized cell (do not touch) -->
<mxCell id="custom-1" value="My Custom Note"
        style="shape=note;fillColor=#fff2cc;strokeColor=#d6b656;"
        vertex="1" parent="1">
  <mxGeometry x="600" y="300" width="120" height="60" as="geometry"/>
</mxCell>
```

---

## Deeply Nested Hierarchy Detection

For complex systems with deep nesting (4+ levels), the command automatically selects
an appropriate visualization strategy.

### Nesting Strategies

| Depth | Strategy | Example |
|-------|----------|---------|
| 1-2   | Flat layout with grouping | Simple component diagram |
| 3-4   | Nested containers | C4 with Context > Container > Component |
| 5+    | Multi-page with drill-down links | Separate pages linked via `data-link` |

### Multi-Page Generation

For deeply nested systems, generate multiple diagram pages within a single `.drawio` file:

```xml
<mxfile host="app.diagrams.net" pages="3">
  <!-- Page 1: System Context (L1) -->
  <diagram id="context" name="System Context">
    <mxGraphModel>
      <root>
        <mxCell id="0"/><mxCell id="1" parent="0"/>
        <!-- High-level system boxes with links to detail pages -->
        <UserObject label="Order Service" link="data:page/id,containers" id="sys-1">
          <mxCell style="rounded=1;fillColor=#438DD5;fontColor=#ffffff;
                         strokeColor=#3C7FC0;fontSize=14;fontStyle=1;"
                  vertex="1" parent="1">
            <mxGeometry x="200" y="100" width="160" height="80" as="geometry"/>
          </mxCell>
        </UserObject>
      </root>
    </mxGraphModel>
  </diagram>

  <!-- Page 2: Container diagram (L2) -->
  <diagram id="containers" name="Containers">
    <mxGraphModel>
      <root>
        <mxCell id="0"/><mxCell id="1" parent="0"/>
        <!-- Detailed container breakdown -->
      </root>
    </mxGraphModel>
  </diagram>

  <!-- Page 3: Component diagram (L3) -->
  <diagram id="components" name="Components">
    <mxGraphModel>
      <root>
        <mxCell id="0"/><mxCell id="1" parent="0"/>
        <!-- Individual component details -->
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

---

## Usage Examples

### Basic: Auto-detect from current directory

```
/drawio:auto-diagram
```

Scans the current working directory, detects the dominant pattern, and generates
the most appropriate diagram.

### Targeted: Specific files

```
/drawio:auto-diagram src/api/routes/*.ts
```

Analyzes the specified route files and generates a sequence diagram showing
request flows through the API endpoints.

### PR context: Diagram the changes

```
/drawio:auto-diagram --pr
```

Reads the current branch diff against main and generates a diagram focused on
the changed components, highlighting additions in green and modifications in yellow.

### Full system: Repository-wide analysis

```
/drawio:auto-diagram --scope=repo
```

Performs a full repository scan and generates a C4-style architecture diagram
showing all major subsystems and their relationships.

### Incremental: Update existing diagram

```
/drawio:auto-diagram --update docs/architecture.drawio
```

Re-analyzes the codebase and updates the existing diagram with any structural
changes while preserving manual customizations.

---

## Output

The command writes a `.drawio` file (XML format) to the specified output path or
defaults to `docs/diagrams/<diagram-type>.drawio`. The file can be opened in:

- draw.io desktop application
- diagrams.net web editor
- VS Code with the Draw.io Integration extension
- Any text editor (it is plain XML)

The command also outputs a summary to the console:

```
Generated: docs/diagrams/sequence-api-auth.drawio
  Type: Sequence Diagram
  Elements: 4 participants, 6 messages
  Source: src/api/routes/auth.ts (42 lines analyzed)
  Refinement: 2 overlaps resolved, 1 label resized
```
