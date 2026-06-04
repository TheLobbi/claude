---
name: drawio:data-bind
intent: Bind diagram elements to live data sources for conditional formatting and dynamic updates
tags:
  - drawio-diagramming
  - command
  - data-bind
inputs: []
risk: medium
cost: high
description: |
  Bind draw.io diagram elements to external data sources such as Jira, GitHub Actions, Kubernetes, Prometheus, and custom REST APIs. Apply conditional formatting based on live status values, deploy state, test coverage, latency metrics, and resource utilization. Uses draw.io custom properties, placeholder variables, and UserObject XML tags to create data-driven diagrams that reflect real-time system state.
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
  - Edit
---

# drawio:data-bind

Bind diagram elements to live data sources for conditional formatting and dynamic updates.
This command transforms static architecture diagrams into living dashboards that reflect
real-time system state through color coding, icons, labels, and visual indicators.

---

## Flags

| Flag | Alias | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--source <type>` | `-s` | string | none | Data source type (jira, github, k8s, prometheus, rest, csv, json) |
| `--url <endpoint>` | `-u` | string | none | REST API endpoint or data source URL |
| `--repo <owner/repo>` | `-r` | string | auto-detect | GitHub repository for GitHub Actions / PR status binding |
| `--namespace <ns>` | `-N` | string | `default` | Kubernetes namespace for pod/service status binding |
| `--port <n>` | `-p` | number | varies | Port for data source connections (e.g., Prometheus 9090) |
| `--output <path>` | `-o` | string | in-place | Output path for the data-bound diagram |
| `--refresh-interval <sec>` | `-R` | number | `0` | Auto-refresh interval in seconds (0 = one-shot) |
| `--format <fmt>` | `-f` | string | `drawio` | Output format after binding (drawio, svg, png) |
| `--template <file>` | `-t` | string | none | Template diagram to use as the binding target |
| `--filter <expr>` | `-F` | string | none | Filter expression to select specific data points |
| `--transform <script>` | `-T` | string | none | JavaScript transform function applied to data before binding |
| `--staged` | | boolean | `false` | Only process staged (git add) diagram files |
| `--watch` | `-w` | boolean | `false` | Watch for data source changes and re-bind continuously |
| `--quiet` | `-q` | boolean | `false` | Suppress informational output |
| `--verbose` | `-v` | boolean | `false` | Show detailed data fetching and binding operations |
| `--dry-run` | `-n` | boolean | `false` | Fetch data and show what would change without modifying the diagram |

### Flag Details

#### Data Source Flags
- **`--source <type>`** (`-s`): The external data provider. `jira` fetches issue status and assignments. `github` reads CI/CD status, PR state, and deployments. `k8s` queries pod health, replica counts, and resource usage. `prometheus` pulls metrics. `rest` calls arbitrary REST APIs. `csv`/`json` reads local data files.
- **`--url <endpoint>`** (`-u`): Connection URL for the data source. For REST: the full API endpoint. For Prometheus: the query API URL. For K8s: the cluster API server (defaults to in-cluster config).
- **`--repo <owner/repo>`** (`-r`): GitHub repository identifier for binding CI status, PR comments, and deployment state. Auto-detected from git remote when omitted.
- **`--namespace <ns>`** (`-N`): Kubernetes namespace to query. Binds pod status, service endpoints, and resource metrics to diagram elements.
- **`--port <n>`** (`-p`): Override the default port for data source connections.

#### Binding Control Flags
- **`--template <file>`** (`-t`): Use a template diagram with placeholder `%variable%` syntax. Data values replace placeholders during binding.
- **`--filter <expr>`** (`-F`): Select specific data points. Syntax depends on source type. For Jira: JQL expression. For K8s: label selector. For REST: JSONPath expression.
- **`--transform <script>`** (`-T`): A JavaScript one-liner or file path to a transform function. Applied to each data point before binding. Example: `--transform "d => ({...d, status: d.health > 90 ? 'healthy' : 'degraded'})"`.

#### Refresh & Watch Flags
- **`--refresh-interval <sec>`** (`-R`): Re-fetch data and update the diagram at this interval. Use with `--output` to continuously update an exported image. Set to `0` for a single binding pass.
- **`--watch`** (`-w`): Continuously monitor the data source for changes and re-bind when detected. Uses webhooks or polling depending on the source type.

#### Output Flags
- **`--output <path>`** (`-o`): Write the bound diagram to a new file. Without this, the original file is updated in-place.
- **`--format <fmt>`** (`-f`): After binding data, optionally export to SVG or PNG. The `.drawio` file is always updated first.
- **`--dry-run`** (`-n`): Fetch data from the source, compute the bindings, and report what would change (cell colors, labels, values) without modifying any files.
- **`--verbose`** (`-v`): Show each data fetch, binding resolution, and style change as it happens.
- **`--quiet`** (`-q`): Suppress all output except errors. Useful in cron jobs and CI pipelines.

#### Examples with Flags

```bash
# Bind Kubernetes pod status to architecture diagram
drawio:data-bind architecture.drawio --source k8s --namespace production --verbose

# Bind GitHub Actions CI status
drawio:data-bind ci-pipeline.drawio --source github --repo myorg/myapp

# Bind Prometheus metrics with custom filter
drawio:data-bind infra.drawio --source prometheus --url http://prometheus:9090 --filter 'up{job="api"}'

# Bind from REST API with transform
drawio:data-bind services.drawio --source rest --url https://api.example.com/status --transform "d => ({status: d.healthy ? 'active' : 'degraded'})"

# Dry-run to preview bindings
drawio:data-bind architecture.drawio --source k8s --namespace staging --dry-run

# Watch mode with auto-refresh every 30 seconds
drawio:data-bind dashboard.drawio --source prometheus --url http://localhost:9090 --watch --refresh-interval 30
```

## Core Concepts

### Custom Properties on Diagram Cells

Draw.io supports custom properties on cells through two mechanisms: `<UserObject>` tags
(which replace `<mxCell>` as the outer element) and inline `style` attributes. The
data-bind command leverages both to attach metadata and drive conditional formatting.

### UserObject XML Structure

The `<UserObject>` tag wraps an `<mxCell>` and allows arbitrary key-value attributes
that serve as data-binding points:

```xml
<!-- A service cell with bound data properties -->
<UserObject label="%name%"
            name="API Gateway"
            status="healthy"
            latency="42ms"
            uptime="99.97%"
            last_deploy="2026-03-14T10:30:00Z"
            deploy_version="v2.4.1"
            pod_count="3"
            cpu_usage="23%"
            memory_usage="512MB"
            placeholders="1"
            id="svc-api-gateway">
  <mxCell style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;
                 strokeColor=#82b366;fontSize=12;fontStyle=1;
                 shadow=1;arcSize=10;"
          vertex="1" parent="1">
    <mxGeometry x="200" y="100" width="180" height="80" as="geometry"/>
  </mxCell>
</UserObject>
```

Key attributes:
- `placeholders="1"` — Enables `%variable%` substitution in labels.
- Custom attributes (`status`, `latency`, etc.) — Store bound data values.
- `label="%name%"` — Displays the `name` attribute value as the cell label.

### Object Tag Alternative

The `<object>` tag is functionally identical to `<UserObject>` and is the format
used in newer draw.io versions:

```xml
<object label="%name% (%status%)"
        name="Auth Service"
        status="warning"
        placeholders="1"
        id="svc-auth">
  <mxCell style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;
                 strokeColor=#d6b656;fontSize=12;fontStyle=1;"
          vertex="1" parent="1">
    <mxGeometry x="400" y="100" width="180" height="80" as="geometry"/>
  </mxCell>
</object>
```

---

## Placeholder Variables

### Cell-Level Placeholders

When `placeholders="1"` is set on a `<UserObject>` or `<object>`, any `%attributeName%`
in the `label` or `tooltip` is replaced with the corresponding attribute value.

```xml
<UserObject label="&lt;b&gt;%name%&lt;/b&gt;&lt;br&gt;Status: %status%&lt;br&gt;CPU: %cpu%"
            name="Worker Node 1"
            status="healthy"
            cpu="45%"
            placeholders="1"
            id="node-1">
  <mxCell style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;
                 strokeColor=#82b366;"
          vertex="1" parent="1">
    <mxGeometry x="100" y="100" width="200" height="80" as="geometry"/>
  </mxCell>
</UserObject>
```

Rendered label:
```
Worker Node 1
Status: healthy
CPU: 45%
```

### Supported Placeholder Patterns

| Pattern | Source | Example |
|---------|--------|---------|
| `%name%` | Cell attribute | Service name |
| `%status%` | Cell attribute | healthy/warning/critical |
| `%version%` | Cell attribute | v2.4.1 |
| `%timestamp%` | Cell attribute | ISO 8601 date |
| `%metric_value%` | Cell attribute | Any numeric metric |
| `%label%` | Built-in | Current cell label |
| `%tooltip%` | Built-in | Current tooltip text |
| `%page%` | Built-in | Current page number |
| `%pagenumber%` | Built-in | Same as %page% |
| `%pagecount%` | Built-in | Total page count |
| `%date{format}%` | Built-in | Formatted current date |

### File-Level Variables

Define variables at the diagram file level using the `<mxfile>` tag. These are
available to all cells in all pages of the diagram:

```xml
<mxfile host="app.diagrams.net"
        type="device"
        vars='{"environment":"production","region":"us-east-1","cluster":"main","last_updated":"2026-03-14T10:30:00Z"}'>
  <diagram id="arch" name="Architecture">
    <mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1"
                  tooltips="1" connect="1" arrows="1" fold="1" page="1"
                  pageScale="1" pageWidth="1169" pageHeight="827">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>

        <!-- This cell uses file-level variables -->
        <UserObject label="Environment: %environment%&#xa;Region: %region%&#xa;Cluster: %cluster%&#xa;Updated: %last_updated%"
                    placeholders="1"
                    id="info-panel">
          <mxCell style="text;html=1;strokeColor=#666666;fillColor=#f5f5f5;
                         align=left;verticalAlign=top;whiteSpace=wrap;
                         rounded=1;fontSize=11;spacingLeft=8;spacingTop=4;"
                  vertex="1" parent="1">
            <mxGeometry x="20" y="20" width="240" height="80" as="geometry"/>
          </mxCell>
        </UserObject>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

### Page-Level Variables

Variables can also be set per-page using diagram properties:

```xml
<diagram id="staging" name="Staging Environment"
         vars='{"env_name":"staging","env_color":"#fff2cc"}'>
  <!-- Page-level vars override file-level vars with the same name -->
</diagram>
```

---

## Conditional Formatting Rules

### Status-Based Formatting (Traffic Light Pattern)

The most common data-binding pattern maps a status field to fill and stroke colors:

```
Status Value    │ fillColor  │ strokeColor │ fontColor │ Icon
────────────────┼────────────┼─────────────┼───────────┼──────────────
healthy         │ #d5e8d4    │ #82b366     │ #2D6E0F   │ checkCircle
running         │ #d5e8d4    │ #82b366     │ #2D6E0F   │ play
warning         │ #fff2cc    │ #d6b656     │ #9A6700   │ alertTriangle
degraded        │ #fff2cc    │ #d6b656     │ #9A6700   │ alertTriangle
critical        │ #f8cecc    │ #b85450     │ #9C1A1A   │ xCircle
down            │ #f8cecc    │ #b85450     │ #9C1A1A   │ xCircle
unknown         │ #e1d5e7    │ #9673a6     │ #5B3A6E   │ helpCircle
maintenance     │ #dae8fc    │ #6c8ebf     │ #2B5C8A   │ wrench
deploying       │ #dae8fc    │ #6c8ebf     │ #2B5C8A   │ loader
```

### Implementation: Status Color Mapping Script

```python
#!/usr/bin/env python3
"""Apply conditional formatting to draw.io cells based on status attributes."""

import xml.etree.ElementTree as ET
import sys

STATUS_STYLES = {
    "healthy":     {"fillColor": "#d5e8d4", "strokeColor": "#82b366", "fontColor": "#2D6E0F"},
    "running":     {"fillColor": "#d5e8d4", "strokeColor": "#82b366", "fontColor": "#2D6E0F"},
    "warning":     {"fillColor": "#fff2cc", "strokeColor": "#d6b656", "fontColor": "#9A6700"},
    "degraded":    {"fillColor": "#fff2cc", "strokeColor": "#d6b656", "fontColor": "#9A6700"},
    "critical":    {"fillColor": "#f8cecc", "strokeColor": "#b85450", "fontColor": "#9C1A1A"},
    "down":        {"fillColor": "#f8cecc", "strokeColor": "#b85450", "fontColor": "#9C1A1A"},
    "unknown":     {"fillColor": "#e1d5e7", "strokeColor": "#9673a6", "fontColor": "#5B3A6E"},
    "maintenance": {"fillColor": "#dae8fc", "strokeColor": "#6c8ebf", "fontColor": "#2B5C8A"},
    "deploying":   {"fillColor": "#dae8fc", "strokeColor": "#6c8ebf", "fontColor": "#2B5C8A"},
}

def apply_status_formatting(drawio_path):
    tree = ET.parse(drawio_path)
    root = tree.getroot()
    updated = 0

    for obj in root.iter("UserObject"):
        status = obj.get("status", "").lower()
        if status in STATUS_STYLES:
            cell = obj.find("mxCell")
            if cell is not None:
                style = cell.get("style", "")
                for prop, value in STATUS_STYLES[status].items():
                    # Replace existing property or append
                    if f"{prop}=" in style:
                        import re
                        style = re.sub(f"{prop}=#[0-9a-fA-F]{{6}}", f"{prop}={value}", style)
                    else:
                        style = style.rstrip(";") + f";{prop}={value};"
                cell.set("style", style)
                updated += 1

    tree.write(drawio_path, xml_declaration=True, encoding="UTF-8")
    print(f"Updated {updated} cells in {drawio_path}")

if __name__ == "__main__":
    apply_status_formatting(sys.argv[1])
```

### Deployment State Formatting

Maps deployment lifecycle states to visual styles:

```xml
<!-- Deploying: animated dashed border + blue fill -->
<UserObject label="%name%&#xa;Deploying %version%..."
            name="Payment Service"
            status="deploying"
            version="v3.1.0"
            placeholders="1"
            id="svc-payment">
  <mxCell style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;
                 strokeColor=#6c8ebf;fontSize=12;fontStyle=1;
                 dashed=1;dashPattern=8 4;strokeWidth=2;
                 shadow=0;glass=0;"
          vertex="1" parent="1">
    <mxGeometry x="200" y="200" width="180" height="70" as="geometry"/>
  </mxCell>
</UserObject>

<!-- Deployed: solid green border + green fill + shadow -->
<UserObject label="%name%&#xa;%version% ✓"
            name="Payment Service"
            status="deployed"
            version="v3.1.0"
            placeholders="1"
            id="svc-payment">
  <mxCell style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;
                 strokeColor=#82b366;fontSize=12;fontStyle=1;
                 strokeWidth=2;shadow=1;"
          vertex="1" parent="1">
    <mxGeometry x="200" y="200" width="180" height="70" as="geometry"/>
  </mxCell>
</UserObject>

<!-- Failed: red fill + thick red border -->
<UserObject label="%name%&#xa;DEPLOY FAILED"
            name="Payment Service"
            status="failed"
            version="v3.1.0"
            placeholders="1"
            id="svc-payment">
  <mxCell style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f8cecc;
                 strokeColor=#b85450;fontSize=12;fontStyle=1;
                 strokeWidth=3;shadow=0;fontColor=#9C1A1A;"
          vertex="1" parent="1">
    <mxGeometry x="200" y="200" width="180" height="70" as="geometry"/>
  </mxCell>
</UserObject>
```

### Test Coverage Gradient

Map test coverage percentages to a color gradient from red through yellow to green:

```python
def coverage_to_color(percentage):
    """Convert coverage percentage to hex color on a red-yellow-green gradient."""
    if percentage < 0:
        percentage = 0
    if percentage > 100:
        percentage = 100

    if percentage < 50:
        # Red to Yellow (0-50%)
        r = 248
        g = int(206 + (242 - 206) * (percentage / 50))
        b = int(204 + (204 - 204) * (percentage / 50))
    else:
        # Yellow to Green (50-100%)
        r = int(255 - (255 - 213) * ((percentage - 50) / 50))
        g = int(242 + (232 - 242) * ((percentage - 50) / 50))
        b = int(204 + (212 - 204) * ((percentage - 50) / 50))

    return f"#{r:02x}{g:02x}{b:02x}"

# Coverage thresholds and their visual mapping
COVERAGE_THRESHOLDS = [
    (90, "#d5e8d4", "Excellent"),   # Green
    (75, "#c8e6c0", "Good"),        # Light green
    (60, "#fff2cc", "Adequate"),    # Yellow
    (40, "#fce5b0", "Low"),         # Orange-yellow
    (20, "#f8cecc", "Poor"),        # Light red
    (0,  "#e6b8b7", "Critical"),   # Red
]
```

```xml
<!-- Module with 92% coverage: green fill -->
<UserObject label="%module%&#xa;Coverage: %coverage%%"
            module="auth"
            coverage="92"
            placeholders="1"
            id="mod-auth">
  <mxCell style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;
                 strokeColor=#82b366;fontSize=11;"
          vertex="1" parent="1">
    <mxGeometry x="100" y="100" width="140" height="50" as="geometry"/>
  </mxCell>
</UserObject>

<!-- Module with 34% coverage: red fill -->
<UserObject label="%module%&#xa;Coverage: %coverage%%"
            module="payments"
            coverage="34"
            placeholders="1"
            id="mod-payments">
  <mxCell style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f8cecc;
                 strokeColor=#b85450;fontSize=11;"
          vertex="1" parent="1">
    <mxGeometry x="300" y="100" width="140" height="50" as="geometry"/>
  </mxCell>
</UserObject>
```

### API Latency Visual Indicators

```
Latency Range     │ Fill Color │ Border    │ Extra Style
──────────────────┼────────────┼───────────┼──────────────────
< 100ms           │ #d5e8d4    │ #82b366   │ (none)
100ms - 500ms     │ #fff2cc    │ #d6b656   │ strokeWidth=2
500ms - 1000ms    │ #fce5b0    │ #d4a020   │ strokeWidth=2
1000ms - 3000ms   │ #f8cecc    │ #b85450   │ strokeWidth=3
> 3000ms          │ #e6b8b7    │ #9C1A1A   │ strokeWidth=3;dashed=1
```

### Sprint Progress Bars

Represent sprint completion as a progress bar within a cell using nested rectangles:

```xml
<!-- Sprint card with progress bar -->
<UserObject label="Sprint 24&#xa;%completed%/%total% stories"
            completed="7"
            total="12"
            percentage="58"
            placeholders="1"
            id="sprint-24">
  <mxCell style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f5f5f5;
                 strokeColor=#666666;fontSize=12;fontStyle=1;
                 verticalAlign=top;spacingTop=8;"
          vertex="1" parent="1">
    <mxGeometry x="100" y="100" width="200" height="80" as="geometry"/>
  </mxCell>
</UserObject>

<!-- Progress bar background (gray) -->
<mxCell id="progress-bg" value=""
        style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e0e0e0;
               strokeColor=none;arcSize=40;"
        vertex="1" parent="1">
  <mxGeometry x="110" y="150" width="180" height="16" as="geometry"/>
</mxCell>

<!-- Progress bar fill (green, width = percentage * 180 / 100) -->
<mxCell id="progress-fill" value=""
        style="rounded=1;whiteSpace=wrap;html=1;fillColor=#82b366;
               strokeColor=none;arcSize=40;"
        vertex="1" parent="1">
  <mxGeometry x="110" y="150" width="104" height="16" as="geometry"/>
</mxCell>
```

### Resource Utilization Heat Map

Map CPU/memory utilization to heat map colors for infrastructure diagrams:

```python
def utilization_to_heatmap(percent):
    """Map utilization percentage to heat map color."""
    thresholds = [
        (95, "#67000d"),  # Dark red - critical
        (85, "#a50f15"),  # Red - danger
        (75, "#cb181d"),  # Medium red - high
        (60, "#ef3b2c"),  # Light red - elevated
        (45, "#fb6a4a"),  # Orange-red - moderate
        (30, "#fc9272"),  # Orange - normal
        (15, "#fcbba1"),  # Light orange - low
        (0,  "#fee0d2"),  # Very light - idle
    ]
    for threshold, color in thresholds:
        if percent >= threshold:
            return color
    return "#fff5f0"  # Near-white for 0%
```

```xml
<!-- Node with 87% CPU: red heat map color -->
<UserObject label="%hostname%&#xa;CPU: %cpu%%  MEM: %memory%%"
            hostname="worker-3"
            cpu="87"
            memory="62"
            placeholders="1"
            id="node-worker-3">
  <mxCell style="rounded=1;whiteSpace=wrap;html=1;fillColor=#a50f15;
                 fontColor=#ffffff;strokeColor=#67000d;fontSize=11;
                 fontStyle=1;"
          vertex="1" parent="1">
    <mxGeometry x="100" y="100" width="160" height="60" as="geometry"/>
  </mxCell>
</UserObject>
```

---

## Data Sources

### Jira Issue Status

Fetch Jira issue status and map to diagram cell formatting:

```bash
#!/usr/bin/env bash
# fetch-jira-status.sh - Update diagram cells with Jira issue statuses
# Usage: ./fetch-jira-status.sh <drawio_file> <jira_base_url>

DRAWIO_FILE="$1"
JIRA_URL="$2"
JIRA_TOKEN="${JIRA_API_TOKEN}"

# Extract all cells with a jira_key attribute
python3 << 'PYEOF'
import xml.etree.ElementTree as ET
import json
import subprocess
import sys
import os

drawio_file = sys.argv[1]
jira_url = sys.argv[2]
jira_token = os.environ.get("JIRA_API_TOKEN", "")

tree = ET.parse(drawio_file)
root = tree.getroot()

for obj in root.iter("UserObject"):
    jira_key = obj.get("jira_key")
    if not jira_key:
        continue

    # Fetch issue status from Jira API
    result = subprocess.run(
        ["curl", "-s", "-H", f"Authorization: Bearer {jira_token}",
         "-H", "Content-Type: application/json",
         f"{jira_url}/rest/api/3/issue/{jira_key}?fields=status,assignee,priority"],
        capture_output=True, text=True
    )

    if result.returncode == 0:
        issue = json.loads(result.stdout)
        status = issue["fields"]["status"]["name"].lower()
        assignee = issue["fields"].get("assignee", {})
        assignee_name = assignee.get("displayName", "Unassigned") if assignee else "Unassigned"

        # Update cell attributes
        obj.set("jira_status", status)
        obj.set("assignee", assignee_name)

        # Map Jira status to visual status
        status_map = {
            "to do": "unknown",
            "in progress": "deploying",
            "in review": "warning",
            "done": "healthy",
            "blocked": "critical",
        }
        obj.set("status", status_map.get(status, "unknown"))

tree.write(drawio_file, xml_declaration=True, encoding="UTF-8")
PYEOF
```

### GitHub Actions Workflow Status

```bash
#!/usr/bin/env bash
# fetch-github-actions.sh - Update diagram with GitHub Actions workflow statuses
# Usage: ./fetch-github-actions.sh <drawio_file> <owner/repo>

DRAWIO_FILE="$1"
REPO="$2"
GH_TOKEN="${GITHUB_TOKEN}"

python3 << 'PYEOF'
import xml.etree.ElementTree as ET
import json
import subprocess
import sys
import os

drawio_file = sys.argv[1]
repo = sys.argv[2]
gh_token = os.environ.get("GITHUB_TOKEN", "")

tree = ET.parse(drawio_file)
root = tree.getroot()

for obj in root.iter("UserObject"):
    workflow = obj.get("github_workflow")
    if not workflow:
        continue

    # Fetch latest workflow run
    result = subprocess.run(
        ["curl", "-s",
         "-H", f"Authorization: Bearer {gh_token}",
         "-H", "Accept: application/vnd.github+json",
         f"https://api.github.com/repos/{repo}/actions/workflows/{workflow}/runs?per_page=1"],
        capture_output=True, text=True
    )

    if result.returncode == 0:
        data = json.loads(result.stdout)
        runs = data.get("workflow_runs", [])
        if runs:
            run = runs[0]
            conclusion = run.get("conclusion", "pending")
            status_map = {
                "success": "healthy",
                "failure": "critical",
                "cancelled": "warning",
                "in_progress": "deploying",
                "pending": "deploying",
                None: "deploying",
            }
            obj.set("status", status_map.get(conclusion, "unknown"))
            obj.set("ci_run_url", run.get("html_url", ""))
            obj.set("ci_conclusion", conclusion or "running")
            obj.set("ci_updated", run.get("updated_at", ""))

tree.write(drawio_file, xml_declaration=True, encoding="UTF-8")
PYEOF
```

### Kubernetes Pod Health

```bash
#!/usr/bin/env bash
# fetch-k8s-status.sh - Update diagram cells with K8s pod status
# Usage: ./fetch-k8s-status.sh <drawio_file> [namespace]

DRAWIO_FILE="$1"
NAMESPACE="${2:-default}"

python3 << 'PYEOF'
import xml.etree.ElementTree as ET
import json
import subprocess
import sys

drawio_file = sys.argv[1]
namespace = sys.argv[2] if len(sys.argv) > 2 else "default"

# Get pod status from kubectl
result = subprocess.run(
    ["kubectl", "get", "pods", "-n", namespace, "-o", "json"],
    capture_output=True, text=True
)

if result.returncode != 0:
    print(f"Error fetching pods: {result.stderr}", file=sys.stderr)
    sys.exit(1)

pods_data = json.loads(result.stdout)
pod_status = {}
for pod in pods_data.get("items", []):
    name = pod["metadata"]["name"]
    # Derive the deployment/service name from the pod name
    # Convention: deployment-name-hash-hash
    parts = name.rsplit("-", 2)
    deploy_name = parts[0] if len(parts) >= 3 else name

    phase = pod["status"].get("phase", "Unknown")
    ready_conditions = [c for c in pod["status"].get("conditions", [])
                       if c["type"] == "Ready"]
    is_ready = ready_conditions[0]["status"] == "True" if ready_conditions else False

    if deploy_name not in pod_status:
        pod_status[deploy_name] = {"total": 0, "ready": 0, "phase": phase}
    pod_status[deploy_name]["total"] += 1
    if is_ready:
        pod_status[deploy_name]["ready"] += 1

tree = ET.parse(drawio_file)
root = tree.getroot()

for obj in root.iter("UserObject"):
    k8s_deploy = obj.get("k8s_deployment")
    if not k8s_deploy or k8s_deploy not in pod_status:
        continue

    info = pod_status[k8s_deploy]
    obj.set("pod_count", f"{info['ready']}/{info['total']}")
    obj.set("k8s_phase", info["phase"])

    # Determine status
    if info["ready"] == info["total"] and info["total"] > 0:
        obj.set("status", "healthy")
    elif info["ready"] > 0:
        obj.set("status", "degraded")
    elif info["total"] > 0:
        obj.set("status", "critical")
    else:
        obj.set("status", "unknown")

tree.write(drawio_file, xml_declaration=True, encoding="UTF-8")
PYEOF
```

### Prometheus / Grafana Metrics

```bash
#!/usr/bin/env bash
# fetch-prometheus-metrics.sh - Update diagram with Prometheus metric values
# Usage: ./fetch-prometheus-metrics.sh <drawio_file> <prometheus_url>

DRAWIO_FILE="$1"
PROM_URL="$2"

python3 << 'PYEOF'
import xml.etree.ElementTree as ET
import json
import subprocess
import sys
import urllib.parse

drawio_file = sys.argv[1]
prom_url = sys.argv[2].rstrip("/")

tree = ET.parse(drawio_file)
root = tree.getroot()

for obj in root.iter("UserObject"):
    prom_query = obj.get("prom_query")
    if not prom_query:
        continue

    # Query Prometheus instant API
    encoded_query = urllib.parse.quote(prom_query)
    result = subprocess.run(
        ["curl", "-s", f"{prom_url}/api/v1/query?query={encoded_query}"],
        capture_output=True, text=True
    )

    if result.returncode == 0:
        data = json.loads(result.stdout)
        results = data.get("data", {}).get("result", [])
        if results:
            value = float(results[0]["value"][1])
            metric_name = obj.get("metric_name", "metric")
            obj.set(metric_name, f"{value:.1f}")

            # Apply threshold-based formatting
            warn_threshold = float(obj.get("warn_threshold", "70"))
            crit_threshold = float(obj.get("crit_threshold", "90"))

            if value >= crit_threshold:
                obj.set("status", "critical")
            elif value >= warn_threshold:
                obj.set("status", "warning")
            else:
                obj.set("status", "healthy")

tree.write(drawio_file, xml_declaration=True, encoding="UTF-8")
PYEOF
```

### Azure DevOps Pipeline Status

```bash
#!/usr/bin/env bash
# fetch-azdo-pipeline.sh - Update diagram with Azure DevOps pipeline status
# Usage: ./fetch-azdo-pipeline.sh <drawio_file> <org> <project>

DRAWIO_FILE="$1"
ORG="$2"
PROJECT="$3"
AZDO_TOKEN="${AZDO_PAT}"

python3 << 'PYEOF'
import xml.etree.ElementTree as ET
import json
import subprocess
import sys
import os
import base64

drawio_file = sys.argv[1]
org = sys.argv[2]
project = sys.argv[3]
pat = os.environ.get("AZDO_PAT", "")
auth = base64.b64encode(f":{pat}".encode()).decode()

tree = ET.parse(drawio_file)
root = tree.getroot()

for obj in root.iter("UserObject"):
    pipeline_id = obj.get("azdo_pipeline_id")
    if not pipeline_id:
        continue

    result = subprocess.run(
        ["curl", "-s",
         "-H", f"Authorization: Basic {auth}",
         f"https://dev.azure.com/{org}/{project}/_apis/pipelines/{pipeline_id}/runs?$top=1&api-version=7.0"],
        capture_output=True, text=True
    )

    if result.returncode == 0:
        data = json.loads(result.stdout)
        runs = data.get("value", [])
        if runs:
            run = runs[0]
            result_val = run.get("result", "unknown")
            state = run.get("state", "unknown")

            status_map = {
                "succeeded": "healthy",
                "failed": "critical",
                "canceled": "warning",
                "inProgress": "deploying",
            }
            obj.set("status", status_map.get(result_val, status_map.get(state, "unknown")))
            obj.set("pipeline_run_id", str(run.get("id", "")))
            obj.set("pipeline_result", result_val)

tree.write(drawio_file, xml_declaration=True, encoding="UTF-8")
PYEOF
```

### Custom REST API Endpoints

Generic data binding from any REST API:

```xml
<!-- Cell with custom API binding configuration -->
<UserObject label="%service_name%&#xa;%metric_label%: %metric_value%"
            service_name="Order Processor"
            api_url="https://api.internal.example.com/health/order-processor"
            api_method="GET"
            api_headers='{"Authorization":"Bearer ${API_TOKEN}"}'
            api_jq_status=".status"
            api_jq_metric=".metrics.orders_per_minute"
            metric_label="Orders/min"
            metric_value="--"
            status="unknown"
            placeholders="1"
            id="svc-orders">
  <mxCell style="rounded=1;whiteSpace=wrap;html=1;fontSize=11;"
          vertex="1" parent="1">
    <mxGeometry x="100" y="100" width="180" height="60" as="geometry"/>
  </mxCell>
</UserObject>
```

```python
#!/usr/bin/env python3
"""Generic REST API data binder for draw.io diagrams."""

import xml.etree.ElementTree as ET
import json
import subprocess
import sys
import os
import re

def fetch_api_data(url, method="GET", headers=None):
    """Fetch data from a REST API endpoint."""
    cmd = ["curl", "-s", "-X", method]
    if headers:
        for key, value in headers.items():
            # Expand environment variables in header values
            expanded = os.path.expandvars(value)
            cmd.extend(["-H", f"{key}: {expanded}"])
    cmd.append(url)

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
    if result.returncode == 0:
        return json.loads(result.stdout)
    return None

def extract_jq(data, jq_path):
    """Simple jq-like path extraction (supports .field.subfield syntax)."""
    parts = jq_path.lstrip(".").split(".")
    current = data
    for part in parts:
        if isinstance(current, dict) and part in current:
            current = current[part]
        else:
            return None
    return current

def bind_api_data(drawio_path):
    tree = ET.parse(drawio_path)
    root = tree.getroot()
    updated = 0

    for obj in root.iter("UserObject"):
        api_url = obj.get("api_url")
        if not api_url:
            continue

        method = obj.get("api_method", "GET")
        headers_str = obj.get("api_headers", "{}")
        try:
            headers = json.loads(headers_str)
        except json.JSONDecodeError:
            headers = {}

        data = fetch_api_data(api_url, method, headers)
        if data is None:
            obj.set("status", "unknown")
            continue

        # Extract and set all api_jq_* attributes
        for attr_name in list(obj.keys()):
            if attr_name.startswith("api_jq_"):
                target_attr = attr_name[7:]  # Remove "api_jq_" prefix
                jq_path = obj.get(attr_name)
                value = extract_jq(data, jq_path)
                if value is not None:
                    obj.set(target_attr, str(value))
        updated += 1

    tree.write(drawio_path, xml_declaration=True, encoding="UTF-8")
    print(f"Updated {updated} API-bound cells")

if __name__ == "__main__":
    bind_api_data(sys.argv[1])
```

---

## Update Workflow

### Manual Update

Run the data-bind command to refresh all bound cells:

```bash
# Update all data bindings in a diagram
/drawio:data-bind refresh architecture.drawio

# Update only specific data sources
/drawio:data-bind refresh architecture.drawio --source=k8s
/drawio:data-bind refresh architecture.drawio --source=jira
/drawio:data-bind refresh architecture.drawio --source=github
```

### Automated Update via CI/CD

Add a workflow step to update diagrams on schedule or on deployment:

```yaml
# .github/workflows/update-diagrams.yml
name: Update Architecture Diagrams
on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Update diagram data bindings
        env:
          JIRA_API_TOKEN: ${{ secrets.JIRA_API_TOKEN }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PROM_URL: ${{ secrets.PROMETHEUS_URL }}
        run: |
          python3 scripts/update-diagram-bindings.py docs/architecture.drawio
      - name: Commit updated diagrams
        run: |
          git config user.name "diagram-bot"
          git config user.email "bot@example.com"
          git add docs/architecture.drawio
          git diff --staged --quiet || git commit -m "chore(diagrams): auto-update data bindings"
          git push
```

### Webhook-Triggered Updates

Configure webhook endpoints that trigger diagram updates when events occur:

```python
#!/usr/bin/env python3
"""Webhook handler for diagram auto-refresh."""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import subprocess

class DiagramWebhookHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)
        event = json.loads(body)

        diagram_file = "docs/architecture.drawio"

        if self.path == "/webhook/k8s":
            subprocess.run(["python3", "scripts/fetch-k8s-status.sh", diagram_file])
        elif self.path == "/webhook/github":
            subprocess.run(["python3", "scripts/fetch-github-actions.sh", diagram_file])
        elif self.path == "/webhook/jira":
            subprocess.run(["python3", "scripts/fetch-jira-status.sh", diagram_file])

        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'{"status":"updated"}')

if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", 8090), DiagramWebhookHandler)
    print("Diagram webhook listener on :8090")
    server.serve_forever()
```

---

## Status Badge Generation

Generate SVG badges from diagram data for use in READMEs and dashboards:

```python
#!/usr/bin/env python3
"""Generate SVG status badges from draw.io diagram data."""

import xml.etree.ElementTree as ET
import sys

BADGE_TEMPLATE = '''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="a"><rect width="{width}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#a)">
    <rect width="{label_width}" height="20" fill="#555"/>
    <rect x="{label_width}" width="{value_width}" height="20" fill="{color}"/>
    <rect width="{width}" height="20" fill="url(#b)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,sans-serif" font-size="11">
    <text x="{label_x}" y="15" fill="#010101" fill-opacity=".3">{label}</text>
    <text x="{label_x}" y="14">{label}</text>
    <text x="{value_x}" y="15" fill="#010101" fill-opacity=".3">{value}</text>
    <text x="{value_x}" y="14">{value}</text>
  </g>
</svg>'''

STATUS_COLORS = {
    "healthy": "#4c1",
    "running": "#4c1",
    "warning": "#dfb317",
    "degraded": "#dfb317",
    "critical": "#e05d44",
    "down": "#e05d44",
    "unknown": "#9f9f9f",
    "maintenance": "#007ec6",
    "deploying": "#007ec6",
}

def generate_badge(label, value, status):
    color = STATUS_COLORS.get(status, "#9f9f9f")
    label_width = len(label) * 7 + 10
    value_width = len(value) * 7 + 10
    width = label_width + value_width

    return BADGE_TEMPLATE.format(
        width=width, label_width=label_width, value_width=value_width,
        label_x=label_width / 2, value_x=label_width + value_width / 2,
        label=label, value=value, color=color
    )

def generate_badges_from_diagram(drawio_path, output_dir):
    tree = ET.parse(drawio_path)
    root = tree.getroot()

    for obj in root.iter("UserObject"):
        badge_label = obj.get("badge_label")
        if not badge_label:
            continue

        name = obj.get("name", obj.get("label", "unknown"))
        status = obj.get("status", "unknown")
        badge_value = obj.get("badge_value", status)
        cell_id = obj.get("id", "unknown")

        svg = generate_badge(badge_label, badge_value, status)
        output_path = f"{output_dir}/{cell_id}.svg"
        with open(output_path, "w") as f:
            f.write(svg)
        print(f"Generated badge: {output_path}")

if __name__ == "__main__":
    generate_badges_from_diagram(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else ".")
```

---

## Complete Data-Bound Diagram Example

A full architecture diagram with multiple data sources bound:

```xml
<mxfile host="app.diagrams.net" type="device"
        vars='{"environment":"production","region":"us-east-1","updated":"2026-03-14T10:30:00Z"}'>
  <diagram id="arch" name="Production Architecture">
    <mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1"
                  tooltips="1" connect="1" arrows="1" fold="1" page="1"
                  pageScale="1" pageWidth="1169" pageHeight="827">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>

        <!-- Info panel with file-level variables -->
        <UserObject label="Env: %environment% | Region: %region%&#xa;Last updated: %updated%"
                    placeholders="1" id="info">
          <mxCell style="text;html=1;fillColor=#f5f5f5;strokeColor=#666;
                         rounded=1;fontSize=10;align=left;spacingLeft=6;"
                  vertex="1" parent="1">
            <mxGeometry x="20" y="20" width="280" height="40" as="geometry"/>
          </mxCell>
        </UserObject>

        <!-- API Gateway - bound to K8s and GitHub Actions -->
        <UserObject label="&lt;b&gt;%name%&lt;/b&gt;&#xa;%pod_count% pods | %status%"
                    name="API Gateway"
                    status="healthy"
                    k8s_deployment="api-gateway"
                    github_workflow="deploy-api.yml"
                    pod_count="3/3"
                    badge_label="api-gateway"
                    badge_value="healthy"
                    placeholders="1"
                    id="svc-api">
          <mxCell style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;
                         strokeColor=#82b366;fontSize=11;fontStyle=0;shadow=1;"
                  vertex="1" parent="1">
            <mxGeometry x="400" y="100" width="200" height="70" as="geometry"/>
          </mxCell>
        </UserObject>

        <!-- Auth Service - bound to Jira and Prometheus -->
        <UserObject label="&lt;b&gt;%name%&lt;/b&gt;&#xa;Latency: %latency%ms | %status%"
                    name="Auth Service"
                    status="warning"
                    jira_key="AUTH-142"
                    prom_query="histogram_quantile(0.99, rate(http_request_duration_seconds_bucket{service='auth'}[5m]))"
                    metric_name="latency"
                    latency="340"
                    warn_threshold="200"
                    crit_threshold="1000"
                    placeholders="1"
                    id="svc-auth">
          <mxCell style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;
                         strokeColor=#d6b656;fontSize=11;fontStyle=0;shadow=1;"
                  vertex="1" parent="1">
            <mxGeometry x="200" y="250" width="200" height="70" as="geometry"/>
          </mxCell>
        </UserObject>

        <!-- Database - bound to custom health API -->
        <UserObject label="&lt;b&gt;%name%&lt;/b&gt;&#xa;Connections: %connections%/%max_connections%"
                    name="PostgreSQL Primary"
                    status="healthy"
                    api_url="https://db-monitor.internal/health/pg-primary"
                    api_jq_status=".status"
                    api_jq_connections=".metrics.active_connections"
                    api_jq_max_connections=".config.max_connections"
                    connections="42"
                    max_connections="200"
                    placeholders="1"
                    id="db-primary">
          <mxCell style="shape=cylinder3;whiteSpace=wrap;html=1;
                         boundedLbl=1;backgroundOutline=1;size=15;
                         fillColor=#d5e8d4;strokeColor=#82b366;
                         fontSize=11;fontStyle=0;"
                  vertex="1" parent="1">
            <mxGeometry x="600" y="240" width="160" height="90" as="geometry"/>
          </mxCell>
        </UserObject>

        <!-- Connections -->
        <mxCell style="edgeStyle=orthogonalEdgeStyle;rounded=1;strokeWidth=2;
                       endArrow=block;endFill=1;strokeColor=#666;"
                edge="1" source="svc-api" target="svc-auth" parent="1">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell style="edgeStyle=orthogonalEdgeStyle;rounded=1;strokeWidth=2;
                       endArrow=block;endFill=1;strokeColor=#666;"
                edge="1" source="svc-auth" target="db-primary" parent="1">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

---

## Usage Examples

```bash
# Bind K8s pod status to all cells with k8s_deployment attribute
/drawio:data-bind --source=k8s --namespace=production architecture.drawio

# Bind Jira issue statuses
/drawio:data-bind --source=jira --url=https://myorg.atlassian.net architecture.drawio

# Bind GitHub Actions workflow results
/drawio:data-bind --source=github --repo=myorg/myrepo architecture.drawio

# Bind Prometheus metrics
/drawio:data-bind --source=prometheus --url=http://prometheus:9090 architecture.drawio

# Bind all configured sources and apply conditional formatting
/drawio:data-bind refresh architecture.drawio

# Generate status badges from bound data
/drawio:data-bind badges architecture.drawio --output=docs/badges/

# Set up webhook listener for auto-refresh
/drawio:data-bind webhook --port=8090 architecture.drawio
```
