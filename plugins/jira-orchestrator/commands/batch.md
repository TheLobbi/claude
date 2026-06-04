---
name: jira-orchestrator:batch
intent: Jira Batch Operations
tags:
  - jira-orchestrator
  - command
  - batch
inputs: []
risk: medium
cost: medium
description: Jira Batch Operations
---

# Jira Batch Operations

## Workflow

**PHASE 1:** Parse & validate operation, target, action
**PHASE 2:** Resolve targets (JQL → issues, keys → validate, file → parse)
**PHASE 3:** Pre-validate all operations
**PHASE 4:** Dry-run if enabled
**PHASE 5:** User confirmation
**PHASE 6:** Execute in batches (25 default, rate-limited)
**PHASE 7:** Real-time progress tracking
**PHASE 8:** Final report with rollback info

## Operations

- **update:** Bulk field updates → `{"priority": "High", "labels": ["urgent"]}`
- **transition:** Mass status change → `"In Progress"`
- **assign:** Bulk reassignment → `{"strategy": "round_robin", "assignees": [...]}`
- **link:** Batch issue linking → `{"link_type": "relates to", "link_to": "JQL"}`
- **import:** CSV/Excel/JSON file → auto-detect format, map fields, import
- **rollback:** Revert by job ID → `--rollback batch_20250115_160000_a8f3`

## Target Formats

- **JQL:** `"project = MYPROJ AND status = 'To Do'"`
- **Keys:** `"PROJ-1,PROJ-2,PROJ-3"`
- **File:** `/path/to/issues.csv`

## Usage Examples

```bash
# Bulk update with dry-run
/jira:batch update --target "project = MYPROJ AND status = 'To Do'" \
  --action '{"priority": "High"}' --dry-run

# Mass transition
/jira:batch transition --target "PROJ-1,PROJ-2,PROJ-3" --action "In Progress"

# Round-robin assignment
/jira:batch assign --target "project = SUPPORT AND assignee is EMPTY" \
  --action '{"strategy": "round_robin", "assignees": ["user1", "user2"]}'

# Import from file
/jira:batch import --target /path/to/issues.csv --template "Story Import"

# Rollback operation
/jira:batch --rollback batch_20250115_160000_a8f3
```

## Key Features

- **Validation:** Pre-validate all changes before execution
- **Dry-run:** Preview changes (success rate, sample changes)
- **Rate-limiting:** 100 req/min, exponential backoff on throttle
- **Concurrency:** 10 parallel operations per batch
- **Progress:** Real-time tracking with ETA
- **Rollback:** 7-day retention, revert by job ID
- **Error handling:** Skip invalid ops, continue valid ones

## Agents

- **batch-processor:** Validates, executes, tracks (update/transition/assign/link)
- **bulk-importer:** Parses files, maps fields, detects duplicates (import)

## Error Handling

- Validation errors → skip, log, continue
- API errors → retry 3x (exponential backoff), rate-limit queue
- Critical errors → abort, rollback if configured

## Output Artifacts

- Job ID: `batch_YYYYMMDD_HHMMSS_xxxx`
- Rollback file: `/tmp/rollback_[job_id].json` (7-day expiry)
- Final report: Success count, failures, execution time, next steps

## Best Practices

1. Always use --dry-run for large batches
2. Verify JQL queries return expected issues
3. Use appropriate batch sizes (10-50)
4. Schedule large operations off-peak
5. Review failed operations manually

---

**⚓ Golden Armada** | *You ask - The Fleet Ships*
