---
name: drawio:export
intent: Export draw.io diagrams to SVG, PNG, PDF with embedded editability
tags:
  - drawio-diagramming
  - command
  - export
inputs: []
risk: low
cost: medium
description: |
  Exports draw.io diagrams to SVG, PNG, PDF, raw XML, self-editing HTML, and Mermaid.js format. Supports CLI export via draw.io desktop, programmatic export via the draw.io export server, quality settings, multi-page export, batch processing, dark mode, transparent backgrounds, crop-to-content, and CI/CD pipeline integration.
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
  - Edit
---

# drawio:export — Export draw.io Diagrams

## Overview

This command exports draw.io diagrams to multiple output formats while preserving
editability where possible. It supports CLI-based export using the draw.io desktop
application, programmatic export via a headless server, and conversion to
Mermaid.js for text-based diagram portability.

## Flags

| Flag | Alias | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--format <fmt>` | `-f` | string | `svg` | Output format (svg, png, pdf, html, mermaid, xml) |
| `--output <path>` | `-o` | string | auto-generated | Output file path |
| `--embed-diagram` | `-e` | boolean | `false` | Embed draw.io XML in SVG/PNG for re-editability |
| `--all-formats` | `-A` | boolean | `false` | Export to all supported formats simultaneously |
| `--all-pages` | | boolean | `false` | Export all pages in a multi-page diagram |
| `--page-index <n>` | `-P` | number | `0` | Zero-based page index to export |
| `--page <n>` | | number | none | One-based page number to export (alias for page-index + 1) |
| `--pages <range>` | | string | none | Page range to export (e.g., "1-3", "all") |
| `--dpi <n>` | | number | `96` | DPI for raster exports (PNG) |
| `--scale <factor>` | `-s` | number | `1.0` | Scale factor for export (2.0 = 2x resolution) |
| `--quality <pct>` | `-q` | number | `100` | JPEG/PNG quality percentage (1-100) |
| `--width <px>` | `-W` | number | auto | Output width in pixels (height auto-calculated) |
| `--height <px>` | `-H` | number | auto | Output height in pixels (width auto-calculated) |
| `--border <px>` | `-b` | number | `0` | Padding border around exported content in pixels |
| `--crop` | `-c` | boolean | `false` | Crop to diagram content (remove whitespace) |
| `--transparent` | `-t` | boolean | `false` | Use transparent background instead of white |
| `--dark` | `-d` | boolean | `false` | Export with dark mode color remapping |
| `--batch` | `-B` | boolean | `false` | Batch export all .drawio files in a directory |
| `--include <glob>` | | string | `*.drawio` | File glob pattern for batch export |
| `--ci` | | boolean | `false` | CI/CD mode: headless export, non-interactive |
| `--no-sandbox` | | boolean | `false` | Disable Chromium sandbox (required in some CI environments) |
| `--page-width <in>` | | number | auto | PDF page width in inches |
| `--page-height <in>` | | number | auto | PDF page height in inches |
| `--export` | | boolean | `true` | Explicit export flag (used by draw.io CLI) |
| `--open` | `-O` | boolean | `false` | Open the exported file in the default viewer or draw.io desktop after export |
| `--verbose` | `-v` | boolean | `false` | Show detailed export progress and file sizes |
| `--dry-run` | `-n` | boolean | `false` | Preview export operations without writing files |

### Flag Details

#### Format & Output Flags
- **`--format <fmt>`** (`-f`): Target export format. `svg` produces scalable vector graphics ideal for web and docs. `png` produces raster images for presentations and chat. `pdf` for printing. `html` creates a self-editing viewer. `mermaid` converts to Mermaid.js text syntax.
- **`--output <path>`** (`-o`): Destination file. Defaults to the input filename with the appropriate extension (e.g., `arch.drawio` becomes `arch.drawio.svg` with `--embed-diagram`, or `arch.svg` without).
- **`--embed-diagram`** (`-e`): Critical for preserving editability. When enabled, the draw.io XML is stored inside the SVG/PNG metadata, allowing the file to be reopened and edited in draw.io.
- **`--all-formats`** (`-A`): Export to SVG, PNG (1x and 2x), and PDF in a single operation. Files are placed in the same directory as the output path.

#### Quality & Dimension Flags
- **`--dpi <n>`**: Dots per inch for PNG exports. Use `300` for print, `96` for screen, `192` for retina.
- **`--scale <factor>`** (`-s`): Multiplier for output resolution. `--scale 2` produces a 2x image suitable for high-DPI displays.
- **`--quality <pct>`** (`-q`): Compression quality for lossy formats. `100` = maximum quality, `75` = good balance of quality and size.
- **`--width <px>`** / **`--height <px>`**: Force specific output dimensions. When only one is specified, the other is auto-calculated to maintain aspect ratio.
- **`--border <px>`** (`-b`): Add padding around the diagram content. Useful for slides and documents where the diagram needs breathing room.

#### Page Selection Flags
- **`--all-pages`**: Export every page in a multi-page diagram as separate files. Output filenames are suffixed with the page name.
- **`--page-index <n>`** (`-P`): Select a specific page by zero-based index. Use with multi-page diagrams.
- **`--page <n>`**: Human-friendly one-based page number. `--page 1` exports the first page.
- **`--pages <range>`**: Range syntax: `"1-3"` exports pages 1 through 3, `"1,3,5"` exports specific pages, `"all"` exports all.

#### Appearance Flags
- **`--crop`** (`-c`): Remove empty space around the diagram. The exported image is trimmed to the bounding box of all elements.
- **`--transparent`** (`-t`): Set the background to transparent instead of white. Useful for overlaying diagrams on colored backgrounds.
- **`--dark`** (`-d`): Apply automatic dark mode color remapping before export. Light fills become dark, dark strokes become light.

#### Batch & CI Flags
- **`--batch`** (`-B`): Process all `.drawio` files matching `--include` pattern. Results are written to the same directory or `--output` directory.
- **`--include <glob>`**: File pattern for batch mode. Default `*.drawio`. Example: `--include "docs/**/*.drawio"`.
- **`--ci`**: Headless operation mode. Suppresses interactive prompts, uses xvfb wrapper automatically, returns non-zero exit code on failure.
- **`--no-sandbox`**: Required in Docker containers and some CI runners where Chromium sandboxing is not available.

#### Desktop Integration Flags
- **`--open`** (`-O`): After exporting, open the output file. For `.drawio` and `.drawio.svg` files, opens in draw.io desktop. For `.png`, `.pdf`, and `.svg` files, opens in the OS default viewer. Auto-detects platform (macOS `open`, Linux `xdg-open`, Windows `start`). See `drawio:open` for details.

#### Examples with Flags

```bash
# High-res editable SVG
drawio:export architecture.drawio --format svg --embed-diagram --crop

# Retina PNG for presentation
drawio:export architecture.drawio --format png --scale 2 --border 20

# Print-quality PDF with all pages
drawio:export architecture.drawio --format pdf --all-pages --crop

# Dark mode transparent SVG
drawio:export architecture.drawio --format svg --dark --transparent --crop

# Batch export entire docs directory
drawio:export docs/diagrams/ --batch --format svg --embed-diagram --verbose

# CI pipeline export
drawio:export architecture.drawio --format svg --ci --no-sandbox --embed-diagram

# Dry run to see what would be exported
drawio:export docs/diagrams/ --batch --format png --dry-run
```

## Export Format Reference

| Format | Extension | Editable | Best For |
|--------|-----------|----------|----------|
| SVG (embedded) | `.drawio.svg` | Yes | GitHub, web, docs, version control |
| PNG (embedded) | `.drawio.png` | Yes | Presentations, chat, email |
| SVG (plain) | `.svg` | No | Web embedding, design tools |
| PNG (plain) | `.png` | No | Documents, slides, sharing |
| PDF | `.pdf` | No | Printing, formal documentation |
| Raw XML | `.drawio` / `.xml` | Yes | Source control, backup |
| HTML (self-editing) | `.html` | Yes | Standalone sharing, offline viewing |
| Mermaid.js | `.mmd` | Yes (text) | Markdown, GitLab, Notion, text-based |

## CLI Export with draw.io Desktop

### Prerequisites

```bash
# Check if draw.io CLI is available
drawio --version 2>/dev/null && echo "draw.io CLI available" || echo "draw.io CLI not found"

# Install on Ubuntu/Debian
wget -q https://github.com/jgraph/drawio-desktop/releases/download/v24.0.4/drawio-amd64-24.0.4.deb
sudo apt-get install -y ./drawio-amd64-24.0.4.deb

# Install on macOS
brew install --cask drawio

# On headless Linux (CI/CD), use xvfb wrapper
sudo apt-get install -y xvfb
alias drawio='xvfb-run -a drawio'
```

### SVG Export (with Embedded XML for Editability)

```bash
# Export with embedded diagram data — the SVG file can be reopened and edited in draw.io
drawio --export --format svg --embed-diagram input.drawio -o output.drawio.svg

# With transparent background
drawio --export --format svg --embed-diagram --transparent input.drawio -o output.drawio.svg

# Crop to content (remove whitespace)
drawio --export --format svg --embed-diagram --crop input.drawio -o output.drawio.svg

# Specific page (0-indexed)
drawio --export --format svg --embed-diagram --page-index 0 input.drawio -o page1.drawio.svg
drawio --export --format svg --embed-diagram --page-index 1 input.drawio -o page2.drawio.svg

# Without grid and page border
drawio --export --format svg --embed-diagram --no-sandbox input.drawio -o output.drawio.svg

# Scale factor (default 1.0)
drawio --export --format svg --embed-diagram --scale 1.5 input.drawio -o output.drawio.svg
```

### PNG Export (with Embedded XML for Editability)

```bash
# Export with embedded diagram data — the PNG file can be reopened in draw.io
drawio --export --format png --embed-diagram input.drawio -o output.drawio.png

# High resolution (2x DPI for retina displays)
drawio --export --format png --embed-diagram --scale 2 input.drawio -o output@2x.drawio.png

# Specific DPI
drawio --export --format png --embed-diagram --dpi 300 input.drawio -o output-300dpi.drawio.png

# Custom dimensions (width in pixels, height auto-calculated)
drawio --export --format png --embed-diagram --width 1920 input.drawio -o output-1920.drawio.png

# With border padding (pixels)
drawio --export --format png --embed-diagram --border 20 input.drawio -o output.drawio.png

# Transparent background
drawio --export --format png --embed-diagram --transparent input.drawio -o output.drawio.png

# Crop to content
drawio --export --format png --embed-diagram --crop input.drawio -o output.drawio.png

# Specific page
drawio --export --format png --embed-diagram --page-index 2 input.drawio -o page3.drawio.png
```

### PDF Export

```bash
# Standard PDF export
drawio --export --format pdf input.drawio -o output.pdf

# Crop to content
drawio --export --format pdf --crop input.drawio -o output.pdf

# All pages in one PDF
drawio --export --format pdf --all-pages input.drawio -o output-all-pages.pdf

# Specific page
drawio --export --format pdf --page-index 0 input.drawio -o page1.pdf

# Custom page size
drawio --export --format pdf --page-width 11 --page-height 8.5 input.drawio -o landscape.pdf
```

### Plain SVG / PNG (without Embedded XML)

```bash
# Plain SVG (smaller file, not re-editable in draw.io)
drawio --export --format svg input.drawio -o output.svg

# Plain PNG
drawio --export --format png input.drawio -o output.png
```

## Quality Settings

### DPI / Scale Matrix

| Use Case | Scale | DPI | Approximate Size |
|----------|-------|-----|------------------|
| Web thumbnail | 0.5 | 72 | Small |
| Web standard | 1.0 | 96 | Medium |
| Retina display | 2.0 | 192 | Large |
| Print (A4) | 1.0 | 300 | Large |
| Print (poster) | 1.0 | 600 | Very large |
| Presentation (1080p) | — | — | `--width 1920` |
| Presentation (4K) | — | — | `--width 3840` |

### Export Quality Script

```bash
python3 << 'PYEOF'
import subprocess
import os
import sys

INPUT = "architecture.drawio"
OUTPUT_DIR = "exports"

os.makedirs(OUTPUT_DIR, exist_ok=True)

EXPORTS = [
    # (format, args, output_name, description)
    ("svg", ["--embed-diagram", "--crop"], "architecture.drawio.svg", "Editable SVG"),
    ("svg", ["--crop", "--transparent"], "architecture-plain.svg", "Plain SVG"),
    ("png", ["--embed-diagram", "--scale", "1"], "architecture.drawio.png", "Editable PNG (1x)"),
    ("png", ["--embed-diagram", "--scale", "2"], "architecture@2x.drawio.png", "Editable PNG (2x retina)"),
    ("png", ["--scale", "1", "--transparent"], "architecture-transparent.png", "Transparent PNG"),
    ("png", ["--dpi", "300"], "architecture-print.png", "Print quality PNG (300dpi)"),
    ("pdf", ["--crop"], "architecture.pdf", "PDF (cropped)"),
    ("pdf", ["--all-pages"], "architecture-all-pages.pdf", "PDF (all pages)"),
]

for fmt, args, output_name, desc in EXPORTS:
    output_path = os.path.join(OUTPUT_DIR, output_name)
    cmd = ["drawio", "--export", "--format", fmt] + args + [INPUT, "-o", output_path]

    print(f"Exporting: {desc}...")
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            size = os.path.getsize(output_path)
            print(f"  OK: {output_path} ({size:,} bytes)")
        else:
            print(f"  FAIL: {result.stderr.strip()}")
    except subprocess.TimeoutExpired:
        print(f"  FAIL: Timeout after 30s")
    except FileNotFoundError:
        print(f"  FAIL: drawio CLI not found")
        break

print(f"\nAll exports saved to: {OUTPUT_DIR}/")
PYEOF
```

## Multi-Page Export

### Export All Pages Individually

```bash
python3 << 'PYEOF'
import xml.etree.ElementTree as ET
import subprocess
import os

INPUT = "architecture.drawio"
OUTPUT_DIR = "exports/pages"

os.makedirs(OUTPUT_DIR, exist_ok=True)

# Parse to find page names
tree = ET.parse(INPUT)
mxfile = tree.getroot()
diagrams = mxfile.findall("diagram")

print(f"Found {len(diagrams)} pages in {INPUT}")

for i, diagram in enumerate(diagrams):
    page_name = diagram.get("name", f"Page-{i+1}")
    safe_name = page_name.replace(" ", "-").replace("/", "-").lower()

    # Export each page as SVG
    svg_out = os.path.join(OUTPUT_DIR, f"{safe_name}.drawio.svg")
    cmd = [
        "drawio", "--export", "--format", "svg",
        "--embed-diagram", "--crop",
        "--page-index", str(i),
        INPUT, "-o", svg_out
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    if result.returncode == 0:
        print(f"  Page {i}: '{page_name}' -> {svg_out}")
    else:
        print(f"  Page {i}: '{page_name}' FAILED: {result.stderr.strip()}")

    # Export each page as PNG
    png_out = os.path.join(OUTPUT_DIR, f"{safe_name}.png")
    cmd = [
        "drawio", "--export", "--format", "png",
        "--scale", "2", "--crop",
        "--page-index", str(i),
        INPUT, "-o", png_out
    ]
    subprocess.run(cmd, capture_output=True, text=True, timeout=30)

print(f"\nAll pages exported to: {OUTPUT_DIR}/")
PYEOF
```

### Export Specific Pages

```bash
# Export only pages 1 and 3 (0-indexed)
for page in 0 2; do
  drawio --export --format svg --embed-diagram --page-index "$page" \
    architecture.drawio -o "exports/page-$((page+1)).drawio.svg"
done
```

## Batch Export

### Export All .drawio Files in a Directory

```bash
python3 << 'PYEOF'
import subprocess
import os
import glob

SOURCE_DIR = "docs/diagrams"
OUTPUT_DIR = "docs/diagrams/exported"
FORMAT = "svg"
EXTRA_ARGS = ["--embed-diagram", "--crop", "--transparent"]

os.makedirs(OUTPUT_DIR, exist_ok=True)

drawio_files = glob.glob(os.path.join(SOURCE_DIR, "*.drawio"))
print(f"Found {len(drawio_files)} .drawio files in {SOURCE_DIR}")

success = 0
failed = 0

for filepath in sorted(drawio_files):
    basename = os.path.basename(filepath).replace(".drawio", "")
    output_ext = f".drawio.{FORMAT}" if "--embed-diagram" in EXTRA_ARGS else f".{FORMAT}"
    output_path = os.path.join(OUTPUT_DIR, f"{basename}{output_ext}")

    cmd = ["drawio", "--export", "--format", FORMAT] + EXTRA_ARGS + [filepath, "-o", output_path]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        if result.returncode == 0:
            size = os.path.getsize(output_path)
            print(f"  OK: {filepath} -> {output_path} ({size:,} bytes)")
            success += 1
        else:
            print(f"  FAIL: {filepath}: {result.stderr.strip()}")
            failed += 1
    except subprocess.TimeoutExpired:
        print(f"  TIMEOUT: {filepath}")
        failed += 1

print(f"\nBatch export complete: {success} succeeded, {failed} failed")
PYEOF
```

### Batch Export with File Watcher

```bash
# Watch for .drawio file changes and auto-export (requires inotifywait)
inotifywait -m -e modify,create --include '\.drawio$' docs/diagrams/ | while read dir event file; do
  echo "[$(date)] Changed: ${dir}${file}"
  base="${file%.drawio}"
  drawio --export --format svg --embed-diagram --crop \
    "${dir}${file}" -o "docs/diagrams/exported/${base}.drawio.svg" 2>/dev/null
  echo "  Exported to: docs/diagrams/exported/${base}.drawio.svg"
done
```

## Export Options Matrix

### Background Options

```bash
# White background (default)
drawio --export --format png input.drawio -o output.png

# Transparent background
drawio --export --format png --transparent input.drawio -o output.png

# Custom background color (set in the XML)
# Modify mxGraphModel: background="#1E1E1E"
```

### Grid and Border Options

```bash
# With grid visible
drawio --export --format svg input.drawio -o output-grid.svg

# Without grid (clean export)
# The grid is controlled by the grid="1" attribute in mxGraphModel
# To export without grid, temporarily set grid="0" or use --crop
drawio --export --format svg --crop input.drawio -o output-clean.svg

# With page border
drawio --export --format png input.drawio -o output-bordered.png

# Without page border (crop to content)
drawio --export --format png --crop input.drawio -o output-cropped.png
```

### Dark Mode Export

```bash
python3 << 'PYEOF'
import xml.etree.ElementTree as ET
import subprocess
import shutil
import os

INPUT = "architecture.drawio"
DARK_TEMP = "architecture-dark-temp.drawio"
OUTPUT = "architecture-dark.drawio.svg"

DARK_REMAP = {
    "#DAE8FC": "#1A3A5C", "#6C8EBF": "#4A90D9",
    "#D5E8D4": "#1A3C1A", "#82B366": "#5CB85C",
    "#FFF2CC": "#3C3500", "#D6B656": "#D4A017",
    "#F8CECC": "#3C1A1A", "#B85450": "#D9534F",
    "#E1D5E7": "#2D1F3D", "#9673A6": "#B07CC6",
    "#F5F5F5": "#2D2D2D", "#666666": "#999999",
    "#FFFFFF": "#1E1E1E", "#000000": "#E0E0E0",
}

# Create dark mode copy
shutil.copy2(INPUT, DARK_TEMP)

tree = ET.parse(DARK_TEMP)

# Set dark background
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
    # Add white font color to vertices without explicit fontColor
    if cell.get("vertex") == "1" and "fontColor=" not in style:
        style += "fontColor=#E0E0E0;"
    cell.set("style", style)

tree.write(DARK_TEMP, xml_declaration=True, encoding="UTF-8")

# Export the dark version
result = subprocess.run(
    ["drawio", "--export", "--format", "svg", "--embed-diagram", "--crop",
     DARK_TEMP, "-o", OUTPUT],
    capture_output=True, text=True, timeout=30
)

if result.returncode == 0:
    print(f"Dark mode export: {OUTPUT}")
else:
    print(f"Export failed: {result.stderr}")

# Clean up temp file
os.remove(DARK_TEMP)
PYEOF
```

## HTML Self-Editing Export

Generate a standalone HTML file that includes the draw.io editor for offline viewing and editing:

```bash
python3 << 'PYEOF'
import xml.etree.ElementTree as ET
import html
import os

INPUT = "architecture.drawio"
OUTPUT = "architecture-editor.html"

# Read the diagram XML
with open(INPUT, "r") as f:
    diagram_xml = f.read()

# Escape for embedding in HTML
escaped_xml = html.escape(diagram_xml)

html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Architecture Diagram</title>
    <style>
        body {{
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #f5f5f5;
        }}
        .toolbar {{
            background: #2d2d2d;
            color: white;
            padding: 10px 20px;
            display: flex;
            align-items: center;
            gap: 15px;
        }}
        .toolbar h1 {{
            margin: 0;
            font-size: 16px;
            font-weight: 500;
        }}
        .toolbar button {{
            background: #4a90d9;
            color: white;
            border: none;
            padding: 6px 14px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
        }}
        .toolbar button:hover {{
            background: #357abd;
        }}
        #diagram-container {{
            width: 100%;
            height: calc(100vh - 50px);
            overflow: auto;
            display: flex;
            justify-content: center;
            padding: 20px;
            box-sizing: border-box;
        }}
        #diagram-container img {{
            max-width: 100%;
            height: auto;
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            border-radius: 4px;
        }}
    </style>
</head>
<body>
    <div class="toolbar">
        <h1>Architecture Diagram</h1>
        <button onclick="editInDrawio()">Edit in draw.io</button>
        <button onclick="downloadXml()">Download .drawio</button>
        <button onclick="copyXml()">Copy XML</button>
    </div>
    <div id="diagram-container">
        <p>Loading diagram...</p>
    </div>

    <textarea id="diagram-xml" style="display:none">{escaped_xml}</textarea>

    <script>
        const diagramXml = document.getElementById('diagram-xml').value;

        // Render as SVG using draw.io's viewer
        const container = document.getElementById('diagram-container');

        // Create an iframe with the draw.io viewer
        const viewerUrl = 'https://viewer.diagrams.net/?highlight=0000ff&nav=1&title=Diagram#R'
            + encodeURIComponent(diagramXml);

        // For offline: render a static representation
        container.innerHTML = '<iframe src="' + viewerUrl + '" '
            + 'style="width:100%;height:100%;border:none;" '
            + 'frameborder="0"></iframe>';

        function editInDrawio() {{
            const editorUrl = 'https://app.diagrams.net/#R' + encodeURIComponent(diagramXml);
            window.open(editorUrl, '_blank');
        }}

        function downloadXml() {{
            const blob = new Blob([diagramXml], {{ type: 'application/xml' }});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'architecture.drawio';
            a.click();
            URL.revokeObjectURL(url);
        }}

        function copyXml() {{
            navigator.clipboard.writeText(diagramXml).then(() => {{
                alert('Diagram XML copied to clipboard');
            }});
        }}
    </script>
</body>
</html>
"""

with open(OUTPUT, "w") as f:
    f.write(html_content)

size = os.path.getsize(OUTPUT)
print(f"Created self-editing HTML: {OUTPUT} ({size:,} bytes)")
print(f"Open in a browser to view. Click 'Edit in draw.io' to modify.")
PYEOF
```

## Mermaid.js Conversion

### Convert draw.io Flowchart to Mermaid

```bash
python3 << 'PYEOF'
import xml.etree.ElementTree as ET
import re

INPUT = "flowchart.drawio"
OUTPUT = "flowchart.mmd"

tree = ET.parse(INPUT)
root_el = tree.find(".//root")

vertices = {}
edges = []

for cell in root_el.findall("mxCell"):
    cid = cell.get("id")
    value = cell.get("value", "").strip()
    style = cell.get("style", "")

    if cid in ("0", "1"):
        continue

    if cell.get("vertex") == "1":
        # Clean HTML from label
        label = re.sub(r"<[^>]+>", "", value).replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").strip()
        if not label:
            label = cid

        # Determine shape from style
        if "ellipse" in style:
            shape = "circle"
        elif "rhombus" in style:
            shape = "diamond"
        elif "cylinder" in style:
            shape = "cylinder"
        elif "rounded=1" in style:
            shape = "rounded"
        else:
            shape = "rectangle"

        vertices[cid] = {"label": label, "shape": shape}

    elif cell.get("edge") == "1":
        source = cell.get("source")
        target = cell.get("target")
        edge_label = re.sub(r"<[^>]+>", "", value).strip() if value else ""
        if source and target:
            edges.append({"source": source, "target": target, "label": edge_label})

# Generate Mermaid syntax
lines = ["graph TD"]

# Define nodes with shapes
for cid, v in vertices.items():
    label = v["label"]
    safe_id = re.sub(r"[^a-zA-Z0-9_]", "_", cid)

    if v["shape"] == "circle":
        lines.append(f"    {safe_id}(({label}))")
    elif v["shape"] == "diamond":
        lines.append(f"    {safe_id}{{{{{label}}}}}")
    elif v["shape"] == "cylinder":
        lines.append(f"    {safe_id}[({label})]")
    elif v["shape"] == "rounded":
        lines.append(f"    {safe_id}({label})")
    else:
        lines.append(f"    {safe_id}[{label}]")

lines.append("")

# Define edges
for edge in edges:
    src = re.sub(r"[^a-zA-Z0-9_]", "_", edge["source"])
    tgt = re.sub(r"[^a-zA-Z0-9_]", "_", edge["target"])
    if edge["label"]:
        lines.append(f"    {src} -->|{edge['label']}| {tgt}")
    else:
        lines.append(f"    {src} --> {tgt}")

mermaid = "\n".join(lines) + "\n"

with open(OUTPUT, "w") as f:
    f.write(mermaid)

print(f"Converted to Mermaid: {OUTPUT}")
print(f"Nodes: {len(vertices)}, Edges: {len(edges)}")
print(f"\n--- Mermaid Output ---")
print(mermaid)
PYEOF
```

### Convert draw.io Sequence Diagram to Mermaid

```bash
python3 << 'PYEOF'
import xml.etree.ElementTree as ET
import re

INPUT = "sequence.drawio"
OUTPUT = "sequence.mmd"

tree = ET.parse(INPUT)
root_el = tree.find(".//root")

# Extract lifelines and messages
lifelines = {}
messages = []

for cell in root_el.findall("mxCell"):
    style = cell.get("style", "")
    value = cell.get("value", "").strip()
    cid = cell.get("id")

    if "umlLifeline" in style:
        label = re.sub(r"<[^>]+>", "", value).strip()
        lifelines[cid] = label

    elif cell.get("edge") == "1" and value:
        label = re.sub(r"<[^>]+>", "", value).strip()
        # Determine arrow type from style
        if "dashed=1" in style:
            arrow = "-->>"  # return/response
        else:
            arrow = "->>"   # request

        # Get approximate y-position for ordering
        geom = cell.find("mxGeometry")
        y_pos = 0
        if geom is not None:
            y_pos = float(geom.get("y", "0"))

        messages.append({
            "label": label,
            "arrow": arrow,
            "y": y_pos,
            "source_point": geom.find("mxPoint[@as='sourcePoint']") if geom is not None else None,
            "target_point": geom.find("mxPoint[@as='targetPoint']") if geom is not None else None,
        })

# Sort messages by y position
messages.sort(key=lambda m: m["y"])

# Generate Mermaid
lines = ["sequenceDiagram"]

# Add participants in order
for lid, label in lifelines.items():
    lines.append(f"    participant {label}")

lines.append("")

# Add messages (simplified — without source/target resolution, use labels)
for msg in messages:
    lines.append(f"    Note over {list(lifelines.values())[0]}: {msg['label']}")

mermaid = "\n".join(lines) + "\n"

with open(OUTPUT, "w") as f:
    f.write(mermaid)

print(f"Converted sequence diagram to Mermaid: {OUTPUT}")
print(f"\n--- Mermaid Output ---")
print(mermaid)
PYEOF
```

### Convert Mermaid Back to draw.io

```bash
python3 << 'PYEOF'
import re

INPUT = "flowchart.mmd"
OUTPUT = "from-mermaid.drawio"

with open(INPUT, "r") as f:
    mermaid = f.read()

lines = mermaid.strip().split("\n")
direction = "TB"  # default top-to-bottom

nodes = {}
edges = []
node_id_counter = 2  # start after 0 and 1

for line in lines:
    line = line.strip()

    # Parse direction
    m = re.match(r"graph\s+(TD|TB|LR|RL|BT)", line)
    if m:
        direction = m.group(1)
        continue

    # Parse node definitions
    # id[label], id(label), id{label}, id((label)), id[(label)]
    m = re.match(r"(\w+)\s*(\[|\(|\{|\[\(|\(\()(.+?)(\]|\)|\}|\)\]|\)\))\s*$", line)
    if m:
        nid = m.group(1)
        shape_open = m.group(2)
        label = m.group(3)

        if shape_open == "((":
            shape = "ellipse"
        elif shape_open == "{":
            shape = "rhombus"
        elif shape_open == "[(":
            shape = "cylinder3"
        elif shape_open == "(":
            shape = "rounded"
        else:
            shape = "rectangle"

        nodes[nid] = {"label": label, "shape": shape}
        continue

    # Parse edges: A --> B, A -->|label| B, A --- B
    m = re.match(r"(\w+)\s*(-->|---|-\.->|==>)\s*(\|([^|]+)\|\s*)?(\w+)", line)
    if m:
        src = m.group(1)
        arrow = m.group(2)
        label = m.group(4) or ""
        tgt = m.group(5)
        dashed = "1" if arrow == "-.->" else "0"
        edges.append({"source": src, "target": tgt, "label": label.strip(), "dashed": dashed})

        # Auto-create nodes if not explicitly defined
        for nid in (src, tgt):
            if nid not in nodes:
                nodes[nid] = {"label": nid, "shape": "rectangle"}

# Layout
x_start = 200
y_start = 80
x_gap = 220
y_gap = 120

is_horizontal = direction in ("LR", "RL")

# Generate draw.io XML
xml_cells = []
for i, (nid, node) in enumerate(nodes.items()):
    if is_horizontal:
        x = x_start + i * x_gap
        y = y_start
    else:
        x = x_start
        y = y_start + i * y_gap

    style_map = {
        "ellipse": "ellipse;whiteSpace=wrap;html=1;fillColor=#D5E8D4;strokeColor=#82B366;fontSize=12;",
        "rhombus": "rhombus;whiteSpace=wrap;html=1;fillColor=#FFF2CC;strokeColor=#D6B656;fontSize=12;",
        "cylinder3": "shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#D5E8D4;strokeColor=#82B366;fontSize=12;",
        "rounded": "rounded=1;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=12;",
        "rectangle": "rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=12;",
    }

    style = style_map.get(node["shape"], style_map["rectangle"])
    w = 160
    h = 80 if node["shape"] != "rhombus" else 100

    xml_cells.append(
        f'        <mxCell id="{nid}" value="{node["label"]}" '
        f'style="{style}" vertex="1" parent="1">\n'
        f'          <mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry" />\n'
        f'        </mxCell>'
    )

for i, edge in enumerate(edges):
    dashed_style = "dashed=1;" if edge["dashed"] == "1" else ""
    label_attr = f' value="{edge["label"]}"' if edge["label"] else ""
    xml_cells.append(
        f'        <mxCell id="edge-{i}"{label_attr} '
        f'style="edgeStyle=orthogonalEdgeStyle;rounded=0;{dashed_style}html=1;fontSize=10;" '
        f'edge="1" source="{edge["source"]}" target="{edge["target"]}" parent="1">\n'
        f'          <mxGeometry relative="1" as="geometry" />\n'
        f'        </mxCell>'
    )

xml_content = f"""<mxfile host="Claude" modified="2026-03-14T00:00:00.000Z" agent="Claude Code" version="24.0.0" type="device">
  <diagram id="mermaid-import" name="Imported from Mermaid">
    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
{chr(10).join(xml_cells)}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
"""

with open(OUTPUT, "w") as f:
    f.write(xml_content)

print(f"Converted Mermaid to draw.io: {OUTPUT}")
print(f"Nodes: {len(nodes)}, Edges: {len(edges)}")
PYEOF
```

## Programmatic Export via draw.io Export Server

### Using the draw.io Export API

```bash
# The draw.io export server can be self-hosted or used via the public endpoint
# Self-host: docker run -p 8000:8000 jgraph/export-server

EXPORT_SERVER="http://localhost:8000"

# Read the diagram XML
DIAGRAM_XML=$(cat architecture.drawio)

# Export to PNG via the export server
curl -X POST "${EXPORT_SERVER}/export" \
  -H "Content-Type: application/json" \
  -d "{
    \"format\": \"png\",
    \"xml\": $(python3 -c "import json; print(json.dumps(open('architecture.drawio').read()))"),
    \"scale\": 2,
    \"border\": 10,
    \"transparent\": false
  }" \
  -o architecture.png

echo "Exported via export server: architecture.png"
```

### Docker-Based Export (CI/CD Friendly)

```bash
# Use the official draw.io export Docker image
docker run --rm \
  -v "$(pwd):/data" \
  jgraph/drawio-export \
  --format svg \
  --embed-diagram \
  --crop \
  /data/architecture.drawio \
  -o /data/exports/architecture.drawio.svg
```

## CI/CD Pipeline Integration

### GitHub Actions

```yaml
# .github/workflows/export-diagrams.yml
name: Export draw.io Diagrams
on:
  push:
    paths:
      - 'docs/diagrams/**/*.drawio'
  pull_request:
    paths:
      - 'docs/diagrams/**/*.drawio'

jobs:
  export:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Export all diagrams
        uses: rlespinasse/drawio-export-action@v2
        with:
          format: svg
          transparent: true
          embed-diagram: true
          crop: true
          output: docs/diagrams/exported

      - name: Also export as PNG
        uses: rlespinasse/drawio-export-action@v2
        with:
          format: png
          scale: 2
          output: docs/diagrams/exported

      - name: Upload artifacts
        if: github.event_name == 'pull_request'
        uses: actions/upload-artifact@v4
        with:
          name: exported-diagrams
          path: docs/diagrams/exported/

      - name: Commit exports (push only)
        if: github.event_name == 'push'
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add docs/diagrams/exported/
          git diff --staged --quiet || git commit -m "chore: auto-export draw.io diagrams"
          git push
```

### GitLab CI

```yaml
# .gitlab-ci.yml
export-diagrams:
  stage: build
  image: rlespinasse/drawio-export:latest
  script:
    - mkdir -p exports
    - find docs -name "*.drawio" -exec sh -c '
        base=$(basename "$1" .drawio)
        drawio-export --format svg --embed-diagram --crop "$1" --output "exports/${base}.drawio.svg"
      ' _ {} \;
  artifacts:
    paths:
      - exports/
    expire_in: 1 week
  only:
    changes:
      - "**/*.drawio"
```

### Azure Pipelines

```yaml
# azure-pipelines.yml
trigger:
  paths:
    include:
      - '**/*.drawio'

pool:
  vmImage: 'ubuntu-latest'

steps:
  - script: |
      wget -q https://github.com/jgraph/drawio-desktop/releases/download/v24.0.4/drawio-amd64-24.0.4.deb
      sudo apt-get install -y xvfb ./drawio-amd64-24.0.4.deb
    displayName: 'Install draw.io'

  - script: |
      mkdir -p exports
      find . -name "*.drawio" -not -path "*/node_modules/*" | while read f; do
        base=$(basename "$f" .drawio)
        xvfb-run -a drawio --export --format svg --embed-diagram --crop \
          "$f" -o "exports/${base}.drawio.svg"
        echo "Exported: $f"
      done
    displayName: 'Export diagrams'

  - publish: exports
    artifact: diagrams
    displayName: 'Publish diagram artifacts'
```

### Harness CI

```yaml
# .harness/pipeline.yml
- step:
    type: Run
    name: Export Diagrams
    identifier: export_diagrams
    spec:
      connectorRef: account.DockerHub
      image: rlespinasse/drawio-export:latest
      shell: Sh
      command: |
        mkdir -p /harness/exports
        find /harness -name "*.drawio" -not -path "*/node_modules/*" | while read f; do
          base=$(basename "$f" .drawio)
          drawio-export --format svg --embed-diagram --crop "$f" \
            --output "/harness/exports/${base}.drawio.svg"
        done
        echo "Exported $(ls /harness/exports/*.svg 2>/dev/null | wc -l) diagrams"
```

## Export Validation

### Validate Exported Files

```bash
python3 << 'PYEOF'
import os
import glob

EXPORT_DIR = "exports"

files = glob.glob(os.path.join(EXPORT_DIR, "*"))
print(f"=== Export Validation: {EXPORT_DIR} ===\n")

for filepath in sorted(files):
    basename = os.path.basename(filepath)
    size = os.path.getsize(filepath)
    ext = os.path.splitext(filepath)[1]

    status = "OK"
    issues = []

    # Check minimum file size
    if size < 100:
        issues.append("suspiciously small")
        status = "WARN"
    if size == 0:
        issues.append("empty file")
        status = "FAIL"

    # Check SVG validity
    if ext == ".svg" and size > 0:
        with open(filepath, "r") as f:
            content = f.read(200)
        if "<svg" not in content:
            issues.append("not valid SVG")
            status = "FAIL"
        if ".drawio.svg" in basename and "content=" not in open(filepath).read():
            issues.append("missing embedded diagram data")
            status = "WARN"

    # Check PNG validity
    if ext == ".png" and size > 0:
        with open(filepath, "rb") as f:
            header = f.read(8)
        if header[:4] != b"\x89PNG":
            issues.append("not valid PNG")
            status = "FAIL"

    # Check PDF validity
    if ext == ".pdf" and size > 0:
        with open(filepath, "rb") as f:
            header = f.read(5)
        if header != b"%PDF-":
            issues.append("not valid PDF")
            status = "FAIL"

    issue_str = f" ({', '.join(issues)})" if issues else ""
    print(f"  [{status}] {basename:40s} {size:>10,} bytes{issue_str}")

print(f"\nTotal files: {len(files)}")
PYEOF
```

## Execution Steps

1. **Locate diagram**: find the .drawio file(s) to export
2. **Determine format**: based on user request or target platform
3. **Check prerequisites**: verify draw.io CLI or export server availability
4. **Set quality options**: DPI, scale, transparency, crop settings
5. **Run export**: execute the appropriate export command
6. **Validate output**: check file size and format validity
7. **Report**: list exported files with sizes and paths

## Usage Examples

```
# Basic SVG export with editability
drawio:export architecture.drawio --format svg

# High-res PNG for presentation
drawio:export architecture.drawio --format png --scale 2 --dpi 300

# PDF for printing
drawio:export architecture.drawio --format pdf --crop

# All formats at once
drawio:export architecture.drawio --all-formats

# Batch export entire directory
drawio:export docs/diagrams/ --format svg --batch

# Dark mode export
drawio:export architecture.drawio --format svg --dark

# Convert to Mermaid
drawio:export architecture.drawio --format mermaid

# Self-editing HTML
drawio:export architecture.drawio --format html

# Multi-page export (all pages separately)
drawio:export architecture.drawio --format svg --pages all

# Specific page
drawio:export architecture.drawio --format png --page 2

# CI/CD pipeline export
drawio:export --ci --format svg --batch docs/diagrams/
```
