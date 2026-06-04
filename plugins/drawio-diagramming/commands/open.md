---
name: drawio:open
intent: Open draw.io diagrams in the desktop application or browser editor
tags:
  - drawio-diagramming
  - command
  - open
  - desktop
inputs: []
risk: low
cost: low
description: |
  Opens .drawio diagram files in the draw.io desktop application (Electron) or falls back to the browser-based editor at app.diagrams.net. Supports OS detection (macOS, Windows, Linux), custom editor paths, file watching for live reload, and opening specific pages within multi-page diagrams. Essential for desktop Claude Code workflows where users want visual editing alongside AI-powered generation.
allowed-tools:
  - Read
  - Bash
  - Grep
  - Glob
---

# drawio:open — Open Diagrams in Desktop Editor

## Overview

Opens `.drawio` files in the draw.io desktop application for visual editing. When
the desktop app is not installed, falls back to the browser editor at
`https://app.diagrams.net`. Designed for Claude Code desktop workflows where the
AI generates or edits diagram XML and the user wants to immediately see and
refine the result visually.

## Flags

| Flag | Alias | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--file <path>` | `-f` | string | none | Path to the .drawio file to open |
| `--page <n>` | `-p` | number | `0` | Zero-based page index to open (for multi-page diagrams) |
| `--editor <path>` | `-e` | string | auto-detect | Custom path to the draw.io desktop executable |
| `--browser` | `-b` | boolean | `false` | Force open in browser editor instead of desktop app |
| `--watch` | `-w` | boolean | `false` | Watch the file for changes and report back to the conversation |
| `--new-window` | `-N` | boolean | `false` | Open in a new window instead of reusing existing |
| `--verbose` | `-v` | boolean | `false` | Show detection steps and editor path resolution |
| `--dry-run` | `-n` | boolean | `false` | Show what would be opened without launching the editor |

### Flag Details

#### File Selection
- **`--file <path>`** (`-f`): Path to the `.drawio` file. If omitted, searches the
  current directory for `.drawio` files. If exactly one is found, opens it; if
  multiple are found, lists them and asks for selection.
- **`--page <n>`** (`-p`): For multi-page diagrams, open a specific page. The desktop
  app supports page selection via command-line on some platforms.

#### Editor Configuration
- **`--editor <path>`** (`-e`): Override the auto-detected editor path. Useful when
  draw.io is installed in a non-standard location.
- **`--browser`** (`-b`): Skip desktop app detection and open in the default browser
  at `https://app.diagrams.net`. The file is loaded via a `file://` URL or the
  user manually loads it.
- **`--new-window`** (`-N`): Force a new window. By default, the desktop app reuses
  existing windows.

#### Monitoring
- **`--watch`** (`-w`): After opening, watch the file for modifications. When the
  user saves changes in the desktop editor, report the changes back. Useful for
  an iterative workflow: AI generates → user refines visually → AI picks up changes.

## Execution Flow

### Step 1: Detect Operating System

```bash
# Detect OS
OS="$(uname -s)"
case "$OS" in
    Darwin)  PLATFORM="macos" ;;
    Linux)   PLATFORM="linux" ;;
    MINGW*|MSYS*|CYGWIN*) PLATFORM="windows" ;;
    *)       PLATFORM="unknown" ;;
esac

# For Windows detection in non-MSYS environments
if [[ -n "${USERPROFILE:-}" ]] || [[ -d "/mnt/c/Users" ]]; then
    PLATFORM="windows"
fi
```

### Step 2: Locate draw.io Desktop Application

```bash
# macOS
MACOS_PATHS=(
    "/Applications/draw.io.app/Contents/MacOS/draw.io"
    "$HOME/Applications/draw.io.app/Contents/MacOS/draw.io"
)

# Linux
LINUX_PATHS=(
    "/usr/bin/drawio"
    "/usr/local/bin/drawio"
    "/snap/bin/drawio"
    "/opt/drawio/drawio"
    "$HOME/.local/bin/drawio"
)

# Windows (from WSL or native)
WINDOWS_PATHS=(
    "/mnt/c/Program Files/draw.io/draw.io.exe"
    "$LOCALAPPDATA/Programs/draw.io/draw.io.exe"
    "$PROGRAMFILES/draw.io/draw.io.exe"
)

# Check each path for the detected platform
find_drawio() {
    local paths=()
    case "$PLATFORM" in
        macos)   paths=("${MACOS_PATHS[@]}") ;;
        linux)   paths=("${LINUX_PATHS[@]}") ;;
        windows) paths=("${WINDOWS_PATHS[@]}") ;;
    esac

    for p in "${paths[@]}"; do
        if [[ -x "$p" ]] || [[ -f "$p" ]]; then
            echo "$p"
            return 0
        fi
    done

    # Try PATH lookup
    if command -v drawio &>/dev/null; then
        command -v drawio
        return 0
    fi

    return 1
}
```

### Step 3: Open the Diagram

```bash
# Desktop app available
open_desktop() {
    local file="$1"
    local editor="$2"

    case "$PLATFORM" in
        macos)
            open -a "draw.io" "$file" 2>/dev/null || "$editor" "$file" &
            ;;
        linux)
            "$editor" "$file" &
            ;;
        windows)
            # From WSL
            if [[ -f "/mnt/c/Program Files/draw.io/draw.io.exe" ]]; then
                cmd.exe /C "start \"\" \"$(wslpath -w "$file")\"" 2>/dev/null
            else
                "$editor" "$file" &
            fi
            ;;
    esac
}

# Browser fallback
open_browser() {
    local file="$1"
    local url="https://app.diagrams.net/"

    case "$PLATFORM" in
        macos)   open "$url" ;;
        linux)   xdg-open "$url" 2>/dev/null || sensible-browser "$url" ;;
        windows) cmd.exe /C "start $url" 2>/dev/null || explorer.exe "$url" ;;
    esac

    echo "Browser opened at $url"
    echo "Load your file manually: $file"
    echo ""
    echo "Tip: Install draw.io desktop for seamless opening:"
    echo "  macOS:  brew install --cask drawio"
    echo "  Linux:  sudo snap install drawio"
    echo "  Windows: winget install JGraph.Draw"
}
```

### Step 4: MCP Tool Server Integration

When the `@drawio/mcp` Tool Server is configured, prefer using its `open_diagram`
tool for the most reliable desktop integration:

```json
{
  "tool": "open_diagram",
  "arguments": {
    "path": "/absolute/path/to/diagram.drawio"
  }
}
```

The MCP Tool Server handles editor detection internally and works across all
platforms. Check if the MCP server is available before falling back to direct
CLI invocation.

### Step 5: File Watching (--watch)

```bash
# Watch for changes and report back
watch_file() {
    local file="$1"
    local last_hash
    last_hash=$(md5sum "$file" 2>/dev/null || md5 -q "$file" 2>/dev/null)

    echo "Watching $file for changes... (Ctrl+C to stop)"

    while true; do
        sleep 2
        local current_hash
        current_hash=$(md5sum "$file" 2>/dev/null || md5 -q "$file" 2>/dev/null)

        if [[ "$current_hash" != "$last_hash" ]]; then
            echo "File changed at $(date '+%H:%M:%S')"
            last_hash="$current_hash"
        fi
    done
}
```

## Desktop Installation Guide

### macOS

```bash
# Homebrew (recommended)
brew install --cask drawio

# Or download directly
# https://github.com/jgraph/drawio-desktop/releases/latest
```

### Linux

```bash
# Snap (recommended)
sudo snap install drawio

# Debian/Ubuntu (.deb)
wget https://github.com/jgraph/drawio-desktop/releases/download/v24.7.17/drawio-amd64-24.7.17.deb
sudo dpkg -i drawio-amd64-24.7.17.deb

# Flatpak
flatpak install flathub com.jgraph.drawio.desktop
```

### Windows

```powershell
# Winget (recommended)
winget install JGraph.Draw

# Chocolatey
choco install drawio

# Or download from:
# https://github.com/jgraph/drawio-desktop/releases/latest
```

## Examples

```bash
# Open a diagram (auto-detects editor)
drawio:open --file docs/architecture.drawio

# Open in browser instead of desktop app
drawio:open --file docs/architecture.drawio --browser

# Open with custom editor path
drawio:open --file docs/architecture.drawio --editor /opt/drawio/drawio

# Open specific page of a multi-page diagram
drawio:open --file docs/c4-model.drawio --page 2

# Open and watch for changes
drawio:open --file docs/architecture.drawio --watch

# Dry run - show what would happen
drawio:open --file docs/architecture.drawio --dry-run --verbose
```

## Integration with Other Commands

### Create and Open

```bash
# Create a diagram then open it for visual editing
drawio:create --type c4 --analyze src/ --output docs/architecture.drawio --open
```

### Export and Open

```bash
# Export to SVG and open the result
drawio:export --file docs/architecture.drawio --format svg --open
```

### Iterative Workflow (AI + Desktop)

1. AI generates diagram: `drawio:create --output diagram.drawio`
2. User opens in desktop: `drawio:open --file diagram.drawio --watch`
3. User makes visual tweaks in the desktop editor and saves
4. AI detects changes via `--watch` and can further refine
5. AI enriches: `drawio:enrich --level 2 diagram.drawio`
6. User sees updated diagram live in the desktop editor

## Troubleshooting

### "draw.io not found"

```bash
# Check if it's installed
which drawio 2>/dev/null || echo "Not in PATH"

# Check common locations
ls /Applications/draw.io.app 2>/dev/null        # macOS
ls /snap/bin/drawio 2>/dev/null                  # Linux snap
ls /usr/bin/drawio 2>/dev/null                   # Linux deb
ls "$LOCALAPPDATA/Programs/draw.io" 2>/dev/null  # Windows
```

### WSL (Windows Subsystem for Linux)

When running Claude Code in WSL, open diagrams in the Windows draw.io app:

```bash
# Convert WSL path to Windows path and open
WINPATH=$(wslpath -w "/home/user/project/docs/arch.drawio")
"/mnt/c/Program Files/draw.io/draw.io.exe" "$WINPATH"

# Or use Windows file association
cmd.exe /C "start \"\" \"$WINPATH\""
```

### Headless / Container Environments

When no desktop is available (CI/CD, Docker, remote SSH without X11):

```bash
# Use the browser-based editor with a tunnel
drawio:open --browser --file diagram.drawio

# Or use MCP App Server for inline rendering
# Configure in .mcp.json:
# { "mcpServers": { "drawio-app": { "url": "https://mcp.draw.io/mcp" } } }
```
