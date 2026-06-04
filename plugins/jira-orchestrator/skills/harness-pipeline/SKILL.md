---
name: harness-pipeline
description: This skill should be used when the user asks to "run a Harness pipeline", "trigger a deployment pipeline", "monitor a Harness execution", or "check pipeline status" — executing and watching Harness pipelines with Jira integration.
scope: development, ci-cd, pipeline
requires_env:
  - HARNESS_ACCOUNT_ID
  - HARNESS_API_KEY
  - HARNESS_ORG_ID
  - HARNESS_PROJECT_ID
---

# Harness Pipeline Skill

Execute and monitor Harness CI/CD pipelines with automatic Jira issue linking.

## Usage

```
/harness-pipeline <action> [options]
```

## Actions

### trigger

Trigger a pipeline execution.

```bash
/harness-pipeline trigger --pipeline <pipeline-id> --branch <branch-name> --jira <issue-key>
```

**Steps:**
1. Validate Jira issue exists (using issue-validator)
2. Execute pipeline via Harness REST API
3. Add comment to Jira issue with execution link
4. Return execution ID for monitoring

### status

Check pipeline execution status.

```bash
/harness-pipeline status --execution <execution-id>
```

**Returns:**
- Pipeline name
- Current status (Running, Success, Failed, Aborted)
- Stage statuses
- Duration
- Error details (if failed)

### logs

Get pipeline execution logs.

```bash
/harness-pipeline logs --execution <execution-id> --stage <stage-name>
```

### list

List recent pipeline executions.

```bash
/harness-pipeline list --pipeline <pipeline-id> --limit 10
```

## Jira Integration

When triggering a pipeline with `--jira` flag:

1. **Pre-execution:**
   - Validates issue exists
   - Checks issue is in appropriate status
   - Adds "Pipeline Triggered" comment

2. **During execution:**
   - Optionally updates issue status to "In Progress"

3. **Post-execution:**
   - Adds execution result comment
   - Links build artifacts
   - Transitions issue based on result (configurable)

## Example Workflow

```bash
# 1. Validate the Jira issue first
/jira validate PROJ-163

# 2. Trigger pipeline with Jira link
/harness-pipeline trigger \
  --pipeline my-ci-pipeline \
  --branch feature/PROJ-163 \
  --jira PROJ-163

# 3. Monitor execution
/harness-pipeline status --execution <returned-execution-id>

# 4. View logs if needed
/harness-pipeline logs --execution <execution-id> --stage build
```

## REST API Calls

This skill uses the Harness REST API (NOT MCP):

```bash
# Trigger pipeline
curl -X POST "${HARNESS_API_URL}/pipeline/api/pipeline/execute/${PIPELINE_ID}" \
  -H "x-api-key: ${HARNESS_API_KEY}" \
  -H "Harness-Account: ${HARNESS_ACCOUNT_ID}" \
  -H "Content-Type: application/json" \
  --data-urlencode "accountIdentifier=${HARNESS_ACCOUNT_ID}" \
  --data-urlencode "orgIdentifier=${HARNESS_ORG_ID}" \
  --data-urlencode "projectIdentifier=${HARNESS_PROJECT_ID}"
```

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| 401 Unauthorized | Invalid or expired PAT | Regenerate PAT token |
| 403 Forbidden | Insufficient permissions | Check PAT scope |
| 404 Not Found | Pipeline/execution not found | Verify identifiers |
| 429 Too Many Requests | Rate limited | Wait and retry |

## Security

- PAT tokens stored in `.env` only
- Never logged or exposed
- Minimal required permissions
- Rotate regularly
