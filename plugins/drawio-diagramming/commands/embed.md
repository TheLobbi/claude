---
name: drawio:embed
intent: Embed draw.io diagrams into GitHub PRs, wikis, Confluence, Jira, Azure DevOps, Notion, Teams, and Harness
tags:
  - drawio-diagramming
  - command
  - embed
inputs: []
risk: low
cost: medium
description: |
  Generates platform-specific embedding code for draw.io diagrams across 7+ platforms including GitHub, Confluence, Jira, Azure DevOps, Notion, Microsoft Teams, and Harness. Auto-detects target platform from context, handles image sizing, responsive display, and links diagrams to source code.
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
  - Edit
---

# drawio:embed — Embed draw.io Diagrams Across Platforms

## Overview

This command generates the correct embedding code for draw.io diagrams on any
supported platform. It auto-detects the target platform from the working context
(git remote, file types, project structure) and produces the right snippet format.

## Flags

| Flag | Alias | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--platform <name>` | `-p` | string | auto-detect | Target platform (github, confluence, jira, azure-devops, notion, teams, harness) |
| `--target <file>` | `-t` | string | none | Target file to insert the embed snippet into (e.g., README.md) |
| `--format <fmt>` | `-f` | string | `svg` | Export format for embedding (svg, png, pdf) |
| `--output <path>` | `-o` | string | stdout | Write embed snippet to file instead of stdout |
| `--all-platforms` | `-A` | boolean | `false` | Generate embed snippets for all supported platforms |
| `--pr-comment` | | boolean | `false` | Generate a GitHub PR comment with the diagram |
| `--wiki-page <name>` | | string | none | Target wiki page name (GitHub Wiki or Azure DevOps Wiki) |
| `--issue <key>` | | string | none | Jira issue key or GitHub issue number to attach diagram to |
| `--page-id <id>` | | string | none | Confluence page ID for diagram attachment |
| `--embed-diagram` | `-e` | boolean | `true` | Embed draw.io XML in exported SVG/PNG for editability |
| `--link-source` | `-L` | boolean | `false` | Add source code links to diagram elements |
| `--code-map <path>` | | string | none | Source directory for generating component-to-code mapping |
| `--scale <factor>` | `-S` | number | `1.0` | Scale factor for exported images |
| `--export` | `-E` | boolean | `false` | Export the diagram before embedding (auto-detect format) |
| `--branch <name>` | `-b` | string | current branch | Git branch for raw file URLs |
| `--auto-update` | `-u` | boolean | `false` | Generate CI workflow to auto-export on diagram changes |
| `--ci-mode` | | boolean | `false` | Optimize output for CI/CD pipeline consumption (no prompts, JSON output) |
| `--git-dir <path>` | | string | auto-detect | Git repository root for URL generation |
| `--show-current` | | boolean | `false` | Show currently embedded diagrams in the target file |
| `--staged` | | boolean | `false` | Only process staged (git add) diagram files |
| `--quiet` | `-q` | boolean | `false` | Suppress informational output; only emit the snippet |
| `--verbose` | `-v` | boolean | `false` | Show detailed platform detection and URL generation steps |
| `--dry-run` | `-n` | boolean | `false` | Preview the embed snippet without writing to any files |

### Flag Details

#### Platform & Target Flags
- **`--platform <name>`** (`-p`): Override automatic platform detection. When omitted, the command inspects git remotes, project files, and directory structure to determine the target platform.
- **`--target <file>`** (`-t`): Specify a file where the embed snippet should be inserted. The command finds an appropriate insertion point (e.g., after an `## Architecture` heading in a README).
- **`--all-platforms`** (`-A`): Generate embedding code for every supported platform. Useful for creating a reference document with copy-paste snippets.

#### Platform-Specific Flags
- **`--pr-comment`**: Format the output as a GitHub PR comment with collapsible edit instructions. Includes raw URL from the current branch.
- **`--wiki-page <name>`**: Target a specific wiki page. For GitHub Wiki, uses the wiki repo convention. For Azure DevOps, uses the wiki API path.
- **`--issue <key>`**: Attach the diagram to a Jira issue (e.g., `PROJ-1234`) or GitHub issue (e.g., `#42`). Requires API credentials in environment.
- **`--page-id <id>`**: Confluence page ID for uploading diagram as an attachment and inserting the draw.io macro.

#### Export & Format Flags
- **`--format <fmt>`** (`-f`): Choose the image format for embedding. SVG is recommended for GitHub/web (scalable, editable). PNG for email/chat. PDF for formal docs.
- **`--embed-diagram`** (`-e`): Include the draw.io XML data inside the exported SVG/PNG. This allows the exported image to be re-opened and edited in draw.io. Enabled by default.
- **`--scale <factor>`** (`-S`): Control image resolution. Use `2.0` for retina displays, `0.5` for thumbnails.
- **`--export`** (`-E`): Run the draw.io CLI export before generating the embed snippet. Ensures the exported image is up to date.

#### Source Linking Flags
- **`--link-source`** (`-L`): Add clickable links from diagram elements to source code files. Elements are matched by ID or label to source file paths.
- **`--code-map <path>`**: Specify the source directory root for building the component-to-file mapping table appended to the embed.

#### Behavior Flags
- **`--branch <name>`** (`-b`): Use a specific branch for constructing raw file URLs. Defaults to the current git branch.
- **`--auto-update`** (`-u`): Generate a CI/CD workflow file (GitHub Actions, Azure Pipelines, or GitLab CI) that auto-exports diagrams on push.
- **`--ci-mode`**: Machine-friendly output. Suppresses interactive prompts, outputs JSON with embed URLs and snippet text.
- **`--dry-run`** (`-n`): Show the generated embed snippet and any file modifications without actually writing them.
- **`--verbose`** (`-v`): Show platform detection reasoning, URL construction, and export command details.
- **`--quiet`** (`-q`): Output only the embed snippet with no surrounding information. Useful for piping into other commands.

#### Examples with Flags

```bash
# Auto-detect platform, embed in README
drawio:embed architecture.drawio --target README.md

# GitHub PR comment with source links
drawio:embed architecture.drawio --pr-comment --link-source --code-map src/

# Confluence page with specific page ID
drawio:embed architecture.drawio --platform confluence --page-id 123456

# All platforms at once, quiet mode for scripting
drawio:embed architecture.drawio --all-platforms --quiet

# Export first, then embed with 2x scale
drawio:embed architecture.drawio --export --scale 2 --format png --target docs/README.md

# CI mode for pipeline integration
drawio:embed architecture.drawio --ci-mode --format svg --branch main
```

## Platform Auto-Detection

```bash
python3 << 'PYEOF'
import subprocess
import os
import json

def detect_platform():
    platforms = []

    # Check git remote for GitHub
    try:
        remote = subprocess.check_output(
            ["git", "remote", "get-url", "origin"], stderr=subprocess.DEVNULL
        ).decode().strip()
        if "github.com" in remote or "github" in remote:
            platforms.append("github")
        if "dev.azure.com" in remote or "visualstudio.com" in remote:
            platforms.append("azure-devops")
    except Exception:
        pass

    # Check for Confluence/Jira config
    if os.path.exists(".atlassian") or os.path.exists("confluence.json"):
        platforms.append("confluence")
        platforms.append("jira")

    # Check for Notion
    if os.path.exists(".notion") or os.path.exists("notion.json"):
        platforms.append("notion")

    # Check for Harness
    if os.path.exists(".harness") or os.path.exists("harness.yaml"):
        platforms.append("harness")

    # Check for Teams/SharePoint
    if os.path.exists(".teams") or os.path.exists("teams-manifest.json"):
        platforms.append("teams")

    # Default to GitHub if git repo detected
    if not platforms:
        try:
            subprocess.check_output(["git", "rev-parse", "--git-dir"], stderr=subprocess.DEVNULL)
            platforms.append("github")
        except Exception:
            pass

    return platforms if platforms else ["github"]

detected = detect_platform()
print(f"Detected platforms: {', '.join(detected)}")
print(f"Primary: {detected[0]}")
PYEOF
```

## GitHub Embedding

### Method 1: .drawio.svg in Repository (Recommended)

The best approach for GitHub is to store diagrams as `.drawio.svg` files. GitHub
renders SVG natively in markdown, and the embedded draw.io XML preserves full
editability.

**Step 1: Export to .drawio.svg**

```bash
# Export with embedded diagram data for editability
drawio --export --format svg --embed-diagram architecture.drawio -o docs/diagrams/architecture.drawio.svg
```

**Step 2: Reference in Markdown**

```markdown
## Architecture

![System Architecture](./docs/diagrams/architecture.drawio.svg)
```

**Step 3: With clickable link to edit**

```markdown
## Architecture

[![System Architecture](./docs/diagrams/architecture.drawio.svg)](https://app.diagrams.net/#Uhttps%3A%2F%2Fraw.githubusercontent.com%2FOWNER%2FREPO%2Fmain%2Fdocs%2Fdiagrams%2Farchitecture.drawio.svg)

> Click the diagram to edit in draw.io
```

### Method 2: PR Comments with Inline SVG

For pull request comments, generate an inline SVG snippet:

```bash
python3 << 'PYEOF'
import subprocess
import base64

DIAGRAM = "architecture.drawio"
REPO_PATH = "docs/diagrams/architecture.drawio.svg"

# Get the raw GitHub URL
try:
    remote = subprocess.check_output(
        ["git", "remote", "get-url", "origin"], stderr=subprocess.DEVNULL
    ).decode().strip()
    # Parse owner/repo from remote URL
    if "github.com" in remote:
        parts = remote.replace(".git", "").split("github.com")[-1].strip("/:")
        owner_repo = parts.replace(":", "/")
    else:
        owner_repo = "OWNER/REPO"
except Exception:
    owner_repo = "OWNER/REPO"

branch = subprocess.check_output(
    ["git", "branch", "--show-current"], stderr=subprocess.DEVNULL
).decode().strip()

raw_url = f"https://raw.githubusercontent.com/{owner_repo}/{branch}/{REPO_PATH}"

# Generate PR comment markdown
pr_comment = f"""## Architecture Diagram

![Architecture]({raw_url})

<details>
<summary>Edit this diagram</summary>

Open in draw.io: [Edit online](https://app.diagrams.net/#U{raw_url})

Or edit the source file: `{REPO_PATH}`
</details>
"""

print(pr_comment)
PYEOF
```

### Method 3: GitHub Wiki Pages

```markdown
<!-- In a GitHub wiki page (.md file in the wiki repo) -->

# System Architecture

The following diagram shows the high-level architecture:

![Architecture](./uploads/architecture.drawio.svg)

## How to update this diagram

1. Download the `.drawio.svg` file from this page
2. Open it at [app.diagrams.net](https://app.diagrams.net)
3. Make your changes
4. Export as SVG with "Include a copy of my diagram" checked
5. Upload the new file to replace the existing one
```

### Method 4: GitHub README

```markdown
# Project Name

## Architecture

<p align="center">
  <img src="./docs/diagrams/architecture.drawio.svg" alt="Architecture Diagram" width="800" />
</p>

> [Edit this diagram](https://app.diagrams.net/#Uhttps%3A%2F%2Fraw.githubusercontent.com%2FOWNER%2FREPO%2Fmain%2Fdocs%2Fdiagrams%2Farchitecture.drawio.svg)
```

### Method 5: GitHub Issue Comments

```markdown
## Bug Report: Payment Flow

The issue occurs at step 3 in the following flow:

![Payment Flow](https://raw.githubusercontent.com/OWNER/REPO/main/docs/diagrams/payment-flow.drawio.svg)

Steps to reproduce:
1. User initiates checkout
2. Payment gateway validates card
3. **HERE** — webhook fails to fire (see red highlighted path in diagram)
```

### GitHub-Specific Sizing

```markdown
<!-- Fixed width -->
<img src="./diagram.drawio.svg" width="600" />

<!-- Responsive (full width) -->
<img src="./diagram.drawio.svg" width="100%" />

<!-- With max-width constraint -->
<div align="center">
  <img src="./diagram.drawio.svg" style="max-width: 800px; width: 100%;" />
</div>

<!-- Side by side -->
<table>
  <tr>
    <td><img src="./before.drawio.svg" width="400" /></td>
    <td><img src="./after.drawio.svg" width="400" /></td>
  </tr>
  <tr>
    <td align="center"><em>Before</em></td>
    <td align="center"><em>After</em></td>
  </tr>
</table>
```

### GitHub Actions: Auto-Export on Push

```yaml
# .github/workflows/export-diagrams.yml
name: Export draw.io diagrams
on:
  push:
    paths:
      - '**/*.drawio'
jobs:
  export:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Export diagrams to SVG
        uses: rlespinasse/drawio-export-action@v2
        with:
          format: svg
          transparent: true
          output: docs/diagrams/exported
      - name: Commit exported diagrams
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add docs/diagrams/exported/
          git diff --staged --quiet || git commit -m "chore: auto-export draw.io diagrams"
          git push
```

## Confluence Embedding

### Method 1: draw.io for Confluence App (Recommended)

If the draw.io app is installed in Confluence, use the native macro:

```html
<!-- Confluence storage format — draw.io macro -->
<ac:structured-macro ac:name="drawio" ac:schema-version="1" ac:macro-id="unique-id">
  <ac:parameter ac:name="diagramName">architecture</ac:parameter>
  <ac:parameter ac:name="width">800</ac:parameter>
  <ac:parameter ac:name="border">false</ac:parameter>
  <ac:parameter ac:name="simpleViewer">false</ac:parameter>
  <ac:parameter ac:name="tbstyle">top</ac:parameter>
  <ac:parameter ac:name="links">auto</ac:parameter>
  <ac:parameter ac:name="zoom">100</ac:parameter>
  <ac:plain-text-body><![CDATA[<!-- draw.io XML goes here -->]]></ac:plain-text-body>
</ac:structured-macro>
```

### Method 2: Embed from Page Attachment

Upload the `.drawio` file as a Confluence page attachment, then reference it:

```html
<ac:structured-macro ac:name="drawio" ac:schema-version="1">
  <ac:parameter ac:name="diagramName">architecture</ac:parameter>
  <ac:parameter ac:name="pageId">123456789</ac:parameter>
  <ac:parameter ac:name="diagramWidth">900</ac:parameter>
</ac:structured-macro>
```

### Method 3: Embed as Image from Attachment

For Confluence instances without the draw.io app:

```html
<!-- Upload .drawio.png as attachment then embed -->
<ac:image ac:width="800">
  <ri:attachment ri:filename="architecture.drawio.png" />
</ac:image>
```

### Method 4: Link Confluence Diagram to Jira

```html
<!-- In Confluence, create a diagram that links to a Jira issue -->
<ac:structured-macro ac:name="drawio" ac:schema-version="1">
  <ac:parameter ac:name="diagramName">feature-flow</ac:parameter>
  <ac:parameter ac:name="links">auto</ac:parameter>
  <!-- Elements in the diagram can have links like:
       https://jira.company.com/browse/PROJ-1234 -->
</ac:structured-macro>
```

### Confluence REST API Upload

```bash
# Upload a .drawio file as a Confluence page attachment via REST API
CONFLUENCE_URL="https://your-domain.atlassian.net/wiki"
PAGE_ID="123456789"
FILE="architecture.drawio.png"

curl -X POST \
  "${CONFLUENCE_URL}/rest/api/content/${PAGE_ID}/child/attachment" \
  -H "Authorization: Bearer ${CONFLUENCE_TOKEN}" \
  -H "X-Atlassian-Token: nocheck" \
  -F "file=@${FILE}" \
  -F "comment=Updated architecture diagram"
```

## Jira Embedding

### Method 1: draw.io for Jira App

If the draw.io for Jira app is installed:

1. Open a Jira issue
2. Click "draw.io Diagrams" in the issue panel
3. Create or import a diagram
4. The diagram is stored as an issue attachment and displayed inline

### Method 2: Attach Exported Image

```bash
# Export and attach to Jira issue via REST API
JIRA_URL="https://your-domain.atlassian.net"
ISSUE_KEY="PROJ-1234"

# Export to PNG
drawio --export --format png --scale 2 architecture.drawio -o architecture.png

# Upload as attachment
curl -X POST \
  "${JIRA_URL}/rest/api/3/issue/${ISSUE_KEY}/attachments" \
  -H "Authorization: Bearer ${JIRA_TOKEN}" \
  -H "X-Atlassian-Token: no-check" \
  -F "file=@architecture.png"
```

### Method 3: Embed Confluence Diagram in Jira

If the diagram exists in Confluence, reference it from Jira:

1. In the Jira issue description, use the Confluence page link macro
2. Or embed a direct image link:

```
!https://your-domain.atlassian.net/wiki/download/attachments/PAGE_ID/architecture.drawio.png|width=600!
```

### Method 4: Jira Issue Description with Diagram

```markdown
h2. Architecture Context

!architecture.drawio.png|width=700,border=1!

h3. Changes in this ticket
* Modified the API Gateway routing (highlighted in yellow)
* Added Redis cache layer (new green box)

{panel:title=Edit Diagram}
Download the attached .drawio file and open at [app.diagrams.net|https://app.diagrams.net]
{panel}
```

## Azure DevOps Embedding

**IMPORTANT**: Azure DevOps wikis and repos do NOT render `.drawio.svg` files with embedded XML correctly. Always use **PNG format** for Azure DevOps embedding. Export with `--scale 2` for retina-quality images.

### Method 1: Azure DevOps Wiki (Markdown — PNG only)

```markdown
## Architecture

![Architecture Diagram](/docs/diagrams/architecture.png)

**Last updated:** 2026-03-17
**Source:** [architecture.drawio](/docs/diagrams/architecture.drawio)
```

### Method 2: Export via Pipeline

```yaml
# azure-pipelines.yml
trigger:
  paths:
    include:
      - '**/*.drawio'

pool:
  vmImage: 'ubuntu-latest'

steps:
  - task: Bash@3
    displayName: 'Install draw.io CLI'
    inputs:
      targetType: 'inline'
      script: |
        wget -q https://github.com/jgraph/drawio-desktop/releases/download/v24.0.4/drawio-amd64-24.0.4.deb
        sudo apt-get install -y xvfb ./drawio-amd64-24.0.4.deb

  - task: Bash@3
    displayName: 'Export diagrams to SVG and PNG'
    inputs:
      targetType: 'inline'
      script: |
        mkdir -p docs/diagrams/exported
        for f in $(find . -name "*.drawio" -not -path "./node_modules/*"); do
          base=$(basename "$f" .drawio)
          xvfb-run -a drawio --export --format svg --embed-diagram "$f" \
            -o "docs/diagrams/exported/${base}.drawio.svg"
          xvfb-run -a drawio --export --format png --scale 2 "$f" \
            -o "docs/diagrams/exported/${base}.png"
          echo "Exported: $f"
        done

  - task: Bash@3
    displayName: 'Commit exported diagrams'
    inputs:
      targetType: 'inline'
      script: |
        git config user.email "azure-pipelines@dev.azure.com"
        git config user.name "Azure Pipelines"
        git add docs/diagrams/exported/
        git diff --staged --quiet || git commit -m "chore: auto-export draw.io diagrams [skip ci]"
        git push origin HEAD:$(Build.SourceBranch)
```

### Method 3: Work Item Attachments

```bash
# Attach diagram to Azure DevOps work item
ORG="https://dev.azure.com/your-org"
PROJECT="your-project"
WORK_ITEM_ID="12345"

# Export to PNG first
drawio --export --format png --scale 2 architecture.drawio -o architecture.png

# Upload via REST API
curl -X POST \
  "${ORG}/${PROJECT}/_apis/wit/attachments?fileName=architecture.png&api-version=7.0" \
  -H "Authorization: Bearer ${AZURE_PAT}" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @architecture.png
```

### Method 4: Azure DevOps PR Description (PNG only)

```markdown
## Changes

### Architecture Update

![Architecture](docs/diagrams/exported/architecture.png)

### What changed
- Added new caching layer between API and database
- Moved auth service to separate container

### How to verify
1. Review the diagram above for correctness
2. Check the source `.drawio` file for details
```

**Note**: Azure DevOps PR descriptions and comments only reliably render PNG images. SVG files (especially `.drawio.svg` with embedded XML) may not display.

## Notion Embedding

### Method 1: Upload as Image Block

```bash
# Export to SVG or PNG for Notion
drawio --export --format svg architecture.drawio -o architecture.svg

# Upload to Notion via API
python3 << 'PYEOF'
import requests
import os

NOTION_TOKEN = os.environ.get("NOTION_TOKEN")
PAGE_ID = "your-page-id"
IMAGE_URL = "https://your-hosted-url.com/architecture.svg"  # must be publicly accessible

# Add image block to Notion page
response = requests.patch(
    f"https://api.notion.com/v1/blocks/{PAGE_ID}/children",
    headers={
        "Authorization": f"Bearer {NOTION_TOKEN}",
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
    },
    json={
        "children": [
            {
                "object": "block",
                "type": "image",
                "image": {
                    "type": "external",
                    "external": {
                        "url": IMAGE_URL
                    }
                }
            }
        ]
    }
)
print(f"Status: {response.status_code}")
print(response.json())
PYEOF
```

### Method 2: Embed via URL

In Notion:
1. Type `/embed` in a page
2. Paste the raw GitHub URL of your `.drawio.svg` file
3. Notion renders it inline

```
https://raw.githubusercontent.com/OWNER/REPO/main/docs/diagrams/architecture.drawio.svg
```

### Method 3: Notion + draw.io Chrome Extension

1. Install the "diagrams.net for Notion" Chrome extension
2. Create a new diagram block in Notion via the extension
3. Edit diagrams inline without leaving Notion
4. Diagrams are stored as Notion file attachments

### Method 4: .drawio.svg in Notion Page

```markdown
# Architecture

The system architecture is shown below:

[Embed: architecture.drawio.svg]

> To edit: download the SVG, open at app.diagrams.net, edit, re-upload
```

## Microsoft Teams Embedding

### Method 1: OneDrive/SharePoint Shared Link

```bash
# Upload .drawio.svg to SharePoint/OneDrive, then share in Teams
# The diagram will be viewable inline in the Teams conversation

python3 << 'PYEOF'
# Generate an adaptive card for Teams with diagram preview
import json

card = {
    "type": "AdaptiveCard",
    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
    "version": "1.4",
    "body": [
        {
            "type": "TextBlock",
            "text": "Architecture Diagram Updated",
            "weight": "Bolder",
            "size": "Large"
        },
        {
            "type": "Image",
            "url": "https://your-sharepoint.sharepoint.com/sites/team/Shared%20Documents/diagrams/architecture.png",
            "altText": "Architecture Diagram",
            "size": "Stretch"
        },
        {
            "type": "TextBlock",
            "text": "Updated by CI/CD pipeline on 2026-03-14",
            "isSubtle": True,
            "size": "Small"
        }
    ],
    "actions": [
        {
            "type": "Action.OpenUrl",
            "title": "Edit in draw.io",
            "url": "https://app.diagrams.net/#Uhttps%3A%2F%2Fyour-sharepoint.sharepoint.com%2Fsites%2Fteam%2FShared%2520Documents%2Fdiagrams%2Farchitecture.drawio.svg"
        },
        {
            "type": "Action.OpenUrl",
            "title": "View Full Size",
            "url": "https://your-sharepoint.sharepoint.com/sites/team/Shared%20Documents/diagrams/architecture.png"
        }
    ]
}

print(json.dumps(card, indent=2))
PYEOF
```

### Method 2: Teams Channel Tab

1. In a Teams channel, click "+" to add a tab
2. Select "Website" tab type
3. Enter the draw.io URL with your diagram:
   ```
   https://app.diagrams.net/#Uhttps%3A%2F%2Fraw.githubusercontent.com%2FOWNER%2FREPO%2Fmain%2Farchitecture.drawio.svg
   ```
4. Name the tab "Architecture Diagram"

### Method 3: Teams Bot / Incoming Webhook

```bash
# Send diagram notification to Teams channel via incoming webhook
WEBHOOK_URL="https://outlook.office.com/webhook/YOUR-WEBHOOK-URL"

curl -X POST "${WEBHOOK_URL}" \
  -H "Content-Type: application/json" \
  -d '{
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    "summary": "Diagram Updated",
    "themeColor": "0078D4",
    "title": "Architecture Diagram Updated",
    "sections": [{
      "activityTitle": "CI/CD Pipeline",
      "activitySubtitle": "2026-03-14T12:00:00Z",
      "facts": [
        {"name": "Diagram", "value": "architecture.drawio"},
        {"name": "Changes", "value": "Added caching layer"},
        {"name": "Author", "value": "developer@company.com"}
      ],
      "markdown": true
    }],
    "potentialAction": [{
      "@type": "OpenUri",
      "name": "View Diagram",
      "targets": [{
        "os": "default",
        "uri": "https://raw.githubusercontent.com/OWNER/REPO/main/docs/diagrams/architecture.drawio.svg"
      }]
    }]
  }'
```

### Method 4: Teams Meeting Whiteboard Integration

Share a draw.io diagram in a Teams meeting:
1. Export to PNG/SVG
2. Upload to the meeting's OneDrive folder
3. Share screen or use the "Present" feature with the image
4. For collaborative editing, share the draw.io web editor URL in chat

## Harness Embedding

### Method 1: Pipeline Documentation

Embed diagrams in Harness pipeline documentation:

```markdown
<!-- In Harness pipeline step description or documentation -->
## Deployment Pipeline

![Pipeline Flow](https://raw.githubusercontent.com/OWNER/REPO/main/docs/diagrams/pipeline.drawio.svg)

### Stages
1. Build & Test (blue)
2. Security Scan (yellow)
3. Deploy to Staging (green)
4. Approval Gate (orange)
5. Deploy to Production (red)
```

### Method 2: Harness Wiki

```markdown
<!-- In Harness wiki page -->
# Infrastructure Architecture

The following diagram shows the production infrastructure:

![Infrastructure](../docs/diagrams/infrastructure.drawio.svg)

## Runbook

When an incident occurs, refer to the diagram above to identify:
- Which services are affected (highlighted in red)
- Communication paths between services (arrows)
- External dependencies (gray boxes)
```

### Method 3: Pipeline Step Annotations

```yaml
# In harness.yaml pipeline configuration
pipeline:
  name: Deploy API
  stages:
    - stage:
        name: Build
        description: |
          Build stage - see architecture diagram:
          ![Build Flow](https://raw.githubusercontent.com/OWNER/REPO/main/docs/diagrams/build-flow.drawio.svg)
        spec:
          execution:
            steps:
              - step:
                  type: Run
                  name: Build Docker Image
                  spec:
                    command: docker build -t api:latest .
```

### Method 4: Harness + CI Export

```yaml
# Harness CI step to auto-export diagrams
- step:
    type: Run
    name: Export Diagrams
    spec:
      connectorRef: account.DockerHub
      image: rlespinasse/drawio-export:latest
      command: |
        find /harness/docs -name "*.drawio" | while read f; do
          base=$(basename "$f" .drawio)
          drawio-export --format svg --embed-diagram "$f" \
            --output "/harness/docs/exported/${base}.drawio.svg"
        done
```

## Linking Diagrams to Source Code

### Generate Source-Code-Linked Diagram

```bash
python3 << 'PYEOF'
import xml.etree.ElementTree as ET
import os

DIAGRAM = "architecture.drawio"
REPO_BASE = "https://github.com/OWNER/REPO/tree/main"

# Map diagram cell IDs to source code paths
CODE_LINKS = {
    "api-gateway":    "src/gateway/index.ts",
    "auth-service":   "src/services/auth/",
    "user-service":   "src/services/users/",
    "db-postgres":    "src/database/schema.prisma",
    "queue-redis":    "src/queue/worker.ts",
    "frontend":       "src/app/",
}

tree = ET.parse(DIAGRAM)
root_el = tree.find(".//root")

linked = 0
for cell in root_el.findall("mxCell"):
    cid = cell.get("id")
    if cid in CODE_LINKS:
        code_path = CODE_LINKS[cid]
        link_url = f"{REPO_BASE}/{code_path}"
        style = cell.get("style", "")
        # Add link as a tooltip and make clickable
        cell.set("tooltip", f"Source: {code_path}")
        # Add link style property
        if ";" not in style or style.endswith(";"):
            style += f"link={link_url};"
        else:
            style += f";link={link_url};"
        cell.set("style", style)
        linked += 1
        print(f"  Linked {cid} -> {code_path}")

tree.write(DIAGRAM, xml_declaration=True, encoding="UTF-8")
print(f"\nLinked {linked} elements to source code")
PYEOF
```

### Generate Embed Snippet with Code Links

```bash
python3 << 'PYEOF'
DIAGRAM_URL = "https://raw.githubusercontent.com/OWNER/REPO/main/docs/diagrams/architecture.drawio.svg"

# Generate a markdown section with diagram + linked code paths
markdown = f"""## Architecture

![Architecture]({DIAGRAM_URL})

### Component → Source Code Map

| Component | Source |
|-----------|--------|
| API Gateway | [`src/gateway/index.ts`](src/gateway/index.ts) |
| Auth Service | [`src/services/auth/`](src/services/auth/) |
| User Service | [`src/services/users/`](src/services/users/) |
| Database | [`src/database/schema.prisma`](src/database/schema.prisma) |
| Queue Worker | [`src/queue/worker.ts`](src/queue/worker.ts) |
| Frontend | [`src/app/`](src/app/) |

> Click elements in the diagram to navigate to source code (when viewed in draw.io).
"""

print(markdown)
PYEOF
```

## Responsive Display Helpers

### Generate Platform-Aware Embed

```bash
python3 << 'PYEOF'
import sys

def generate_embed(platform, diagram_path, title="Diagram", width=800):
    """Generate platform-specific embed code."""

    if platform == "github":
        return f"""![{title}]({diagram_path})

> [Edit in draw.io](https://app.diagrams.net/#U{diagram_path.replace('/', '%2F').replace(':', '%3A')})
"""

    elif platform == "confluence":
        return f"""<ac:structured-macro ac:name="drawio">
  <ac:parameter ac:name="diagramName">{title}</ac:parameter>
  <ac:parameter ac:name="width">{width}</ac:parameter>
</ac:structured-macro>
"""

    elif platform == "jira":
        return f"""!{diagram_path}|width={width}!

_Edit: Download .drawio attachment and open at app.diagrams.net_
"""

    elif platform == "azure-devops":
        return f"""![{title}]({diagram_path})

_Source: [{diagram_path}]({diagram_path})_
"""

    elif platform == "notion":
        return f"""[Embed: {diagram_path}]

To edit: Download the .drawio.svg file and open at https://app.diagrams.net
"""

    elif platform == "teams":
        return f"""**{title}**

![{title}]({diagram_path})

[Edit in draw.io](https://app.diagrams.net/#U{diagram_path})
"""

    elif platform == "harness":
        return f"""![{title}]({diagram_path})

Source: `{diagram_path}`
"""

    else:
        return f"![{title}]({diagram_path})"

# Generate for all platforms
platforms = ["github", "confluence", "jira", "azure-devops", "notion", "teams", "harness"]
diagram = "docs/diagrams/architecture.drawio.svg"

for p in platforms:
    print(f"=== {p.upper()} ===")
    print(generate_embed(p, diagram, "Architecture Diagram"))
    print()
PYEOF
```

## Execution Steps

1. **Detect platform**: analyze git remote, project files, and user context
2. **Locate diagram**: find the .drawio file to embed
3. **Export if needed**: convert to .drawio.svg or .drawio.png for the target platform
4. **Generate snippet**: produce platform-specific embedding code
5. **Insert snippet**: write the embedding code into the target file (README, wiki, PR, etc.)
6. **Report**: show the generated embed code and file path

## Usage Examples

```
# Auto-detect platform and embed
drawio:embed architecture.drawio

# Explicit platform
drawio:embed architecture.drawio --platform github --target README.md

# PR comment
drawio:embed architecture.drawio --platform github --pr-comment

# Confluence page
drawio:embed architecture.drawio --platform confluence --page-id 123456

# Jira issue
drawio:embed architecture.drawio --platform jira --issue PROJ-1234

# Azure DevOps wiki (MUST use PNG format)
drawio:embed architecture.drawio --platform azure-devops --format png --wiki-page "Architecture"

# All platforms at once
drawio:embed architecture.drawio --all-platforms

# With source code links
drawio:embed architecture.drawio --link-source --code-map src/

# Inline in Claude Code chat (SVG for visual display)
drawio:embed architecture.drawio --platform chat --format svg
```

## Chat / Inline Embedding

For displaying diagrams directly in Claude Code chat or terminal-based conversations:

### Method 1: Inline SVG (Claude Code Desktop)

When running in Claude Code Desktop, diagrams can be rendered inline by outputting
raw SVG markup. The desktop app's webview renders SVG natively.

```bash
# Export to SVG and output inline
drawio --export --format svg --embed-diagram diagram.drawio -o /dev/stdout
```

### Method 2: Claude Visualize Feature

Claude's `visualize` capability can render interactive diagrams directly in chat.
Instead of generating a `.drawio` file, output a self-contained HTML/SVG artifact:

```
Use the visualize feature to create an interactive diagram:
1. Generate the diagram as SVG markup (not a file)
2. Wrap it in an HTML container with zoom/pan controls
3. Output via Claude's artifact/visualize system

The visualize approach supports:
- Pan and zoom with mouse/touch
- Hover tooltips on elements
- Click-to-expand for containers
- Dark/light mode auto-detection
- No external file needed — renders in the chat window
```

### Method 3: Mermaid Fallback (Terminal/CLI)

For pure CLI environments where SVG rendering is not available, convert the
draw.io diagram to Mermaid.js syntax for text-based display:

```bash
drawio:export diagram.drawio --format mermaid
# Outputs mermaid syntax that can be rendered by markdown viewers
```
