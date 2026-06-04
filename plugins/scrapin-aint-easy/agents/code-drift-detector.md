---
name: code-drift-detector
intent: Scans codebase imports to detect missing documentation, deprecated API usage, and stale references
tags:
  - scrapin-aint-easy
  - agent
  - code-drift-detector
inputs: []
risk: medium
cost: medium
description: Scans codebase imports to detect missing documentation, deprecated API usage, and stale references
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Agent: code-drift-detector

**Trigger:** `code-drift-scan` cron job (every 4 hours) or `scrapin_code_drift_scan` tool
**Mode:** Runs in separate context window to keep main context clean

## Task

1. Walk the project file tree, respecting `.gitignore` and excluding `node_modules`, `dist`, `build`
2. For each source file (.ts, .tsx, .js, .jsx, .py, .cs):
   a. Parse import statements:
      - TypeScript/JavaScript: `import { X } from 'pkg'`, `import X from 'pkg'`, `const X = require('pkg')`
      - Python: `import X`, `from X import Y`
      - C#: `using X;`
   b. Map package names to Source keys via `sources.yaml` `package_aliases`
   c. For each imported symbol, check if a corresponding Symbol node exists in the graph
3. Generate report:
   - **missing_docs**: Imports with no graph node — these are symbols we have no documentation for
   - **deprecated_usage**: Usage of symbols marked `deprecated: true` in the graph
   - **stale_docs**: Symbols where the documentation was updated since the last code scan
4. Save report to `data/drift-reports/code-drift-<timestamp>.json`

## Report Schema

```json
{
  "missing_docs": [{
    "symbol": "string",
    "package": "string",
    "files": ["string"],
    "line_numbers": [0],
    "crawl_queued": false
  }],
  "deprecated_usage": [{
    "symbol": "string",
    "package": "string",
    "files": ["string"],
    "line_numbers": [0],
    "deprecated_since": "string",
    "replacement": "string"
  }],
  "stale_docs": [{
    "symbol": "string",
    "package": "string",
    "doc_updated": "string",
    "last_code_scan": "string",
    "files": ["string"]
  }],
  "scan_timestamp": "string",
  "files_scanned": 0,
  "duration_ms": 0
}
```

## Output

CodeDriftReport JSON saved to drift-reports directory.
