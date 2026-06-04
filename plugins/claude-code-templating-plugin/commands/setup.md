---
name: setup
intent: Initialize or refresh the Claude Code operating baseline inside an installed project, including nested .claude repositories, deep documentation, and project-specific LSP coverage
tags:
  - setup
  - update
  - claude
  - documentation
  - fingerprinting
inputs: []
risk: medium
cost: medium
category: project-operations
---

# `/setup`

The `/setup` command manages the **Claude Code baseline** for an installed project.

It is designed to be safely re-run after plugin upgrades so the target repository can pick up the latest Claude structure, documentation layout, nested repository `.claude` directories, and LSP plan without manually reconstructing files.

## Usage

```bash
/setup <setup|update> [path] [--install-lsps=true|false]
```

## Modes

### `setup`
Use when bootstrapping a fresh repository or immediately after scaffolding.

### `update`
Use when the plugin changes and you want to refresh the installed project's Claude assets.

## What it manages

### Root repository
- `CLAUDE.md`
- `README.md` managed Claude section
- `.claude/rules/*`
- `.claude/skills/*`
- `.claude/templates/*`
- `.claude/agents/*`
- `.claude/hooks/*`
- `.claude/lsp/manifest.json`
- `.claude/lsp/install.sh`
- `docs/context/*`

### Nested repositories under root `.claude`
During both `setup` and `update`, the command scans subdirectories under the root `.claude/` directory. If one of those folders looks like a repository, it gets its own nested `.claude/` directory with baseline docs.

## Examples

### Initialize the current repository
```bash
/setup setup
```

### Refresh an existing project after plugin updates
```bash
/setup update
```

### Refresh another project path without auto-installing LSPs
```bash
/setup update ../customer-project --install-lsps=false
```

## Fingerprinting behavior

The command fingerprints the repository to shape the generated Claude context. Current signals include:
- package manager
- languages
- frameworks
- testing tools
- infrastructure signals
- required LSP packages

## LSP behavior

By default the command attempts to install the detected LSP packages and also writes:
- `.claude/lsp/manifest.json`
- `.claude/lsp/install.sh`

If you want only the generated plan, use `--install-lsps=false`.

## Output expectations

After a successful run you should have:
- a nested, well-structured `CLAUDE.md`
- a managed README section explaining Claude operations
- `docs/context/project.md`
- `docs/context/lessons-learned.md`
- a baseline ADR in `docs/context/decisions/`
- nested `.claude/` directories for repository-like folders under root `.claude/`
