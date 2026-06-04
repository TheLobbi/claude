---
name: batch-commit-processor
intent: Process multiple commits in batch with time aggregation and comment deduplication
tags:
  - jira
  - git
  - batch-processing
  - smart-commits
  - aggregation
inputs: []
risk: medium
cost: medium
description: Process multiple commits in batch with time aggregation and comment deduplication
model: sonnet
effort: medium
tools:
  - Bash
  - Read
  - Grep
---

# Batch Commit Processor Agent

## Purpose

Process multiple Git commits in batch, extracting smart commit commands, aggregating time logs per issue, deduplicating comments, and executing batch updates to Jira. Designed for efficient processing of commit ranges with graceful error handling.

## Core Capabilities

### 1. Commit Range Parsing
- Parse Git commit ranges (HEAD~5..HEAD, main..feature-branch, date ranges)
- Extract commit messages and handle various range formats
- Support author filters and custom date ranges

### 2. Smart Command Extraction
- Extract `#time` commands with duration parsing (1h, 30m, 2h30m, 1.5h)
- Extract `#comment` commands with message content
- Extract `#transition` commands for workflow state changes
- Parse issue keys from commit messages (PROJ-123, TEAM-456)

### 3. Time Aggregation
- Sum all time entries per issue key
- Convert various time formats to seconds with validation
- Handle fractional hours and compound durations
- Format aggregated time for Jira worklog API

### 4. Comment Deduplication
- Remove exact duplicate comments
- Merge similar comments using fuzzy matching (>80% similarity)
- Preserve unique information while maintaining chronological order

### 5. Batch Execution
- Group updates by issue key
- Execute Jira API calls efficiently with partial failure handling
- Support dry-run mode for preview
- Provide detailed success/error reporting

## Input Format

```yaml
commit_range: "HEAD~5..HEAD"  # Git range
dry_run: false                 # Preview mode
author_filter: null            # Optional
since: "2025-12-01"           # Optional date
until: "2025-12-19"           # Optional date
```

## Processing Workflow

**Phase 1: Extraction** - Parse commit messages for issue keys and smart commands
**Phase 2: Aggregation** - Group commands by issue key, sum times, collect comments
**Phase 3: Validation** - Verify issues exist, check transitions, validate time values
**Phase 4: Execution** - Add worklogs, comments, apply transitions
**Phase 5: Reporting** - Generate batch summary with results and errors

## Time Duration Parsing

Supported formats: `1h`, `30m`, `2h30m`, `1.5h`, `90m`, `0.5h`, `1h 30m`

Conversion logic:
- Extract hours portion: multiply by 3600
- Extract minutes portion: multiply by 60
- Sum for total seconds
- Format back to readable h/m format

## Comment Deduplication

Strategy:
- **Exact match**: Keep first occurrence
- **Fuzzy match**: Merge similar comments (>80% similarity using Levenshtein distance)
- **Semantic grouping**: Combine related comments into single entry

## MCP Tools Usage

| Tool | Purpose | Input | Error Handling |
|------|---------|-------|-----------------|
| getJiraIssue | Verify issue exists | issueIdOrKey | Skip issue, log error |
| addWorklogToJiraIssue | Add aggregated time | issueIdOrKey, timeSpent | Continue batch, retry with backoff |
| addCommentToJiraIssue | Add deduplicated comments | issueIdOrKey, commentBody | Continue batch |
| transitionJiraIssue | Apply workflow transition | issueIdOrKey, transition.id | Skip transition, continue |

## Output Format

### Success Response
```yaml
batch_result:
  commit_range: "HEAD~5..HEAD"
  commits_processed: 5
  issues_affected: 2
  dry_run: false
  execution_time_ms: 3421
  results:
    PROJ-123:
      status: "success"
      total_time_logged: "3h 30m"
      comments_added: 1
      transition: "In Review"
      commits: ["abc123", "def456", "ghi789"]
    PROJ-456:
      status: "success"
      total_time_logged: "30m"
      comments_added: 1
  summary:
    total_time_logged: "4h"
    total_comments: 2
    success_rate: 100
  errors: []
```

### Partial Failure Response
Includes failed issues with error types: `issue_not_found`, `transition_failed`, `api_timeout`

### Dry Run Response
Returns preview with `would_log_time`, `would_add_comments`, `would_transition_to` and validation warnings

## Error Handling

**Validation Errors**: issue_not_found, invalid_time, invalid_transition (skip specific operation, continue)
**Execution Errors**: api_timeout, rate_limit, permission_denied, network_error (retry with exponential backoff)
**Partial Failures**: Continue batch processing, include errors in final report

**Retry Strategy**: Max 3 attempts, exponential backoff (1s-10s delay), skip non-retryable errors

## Configuration

```yaml
Environment Variables:
  BATCH_COMMIT_DRY_RUN: false
  BATCH_COMMIT_MAX_COMMITS: 100
  BATCH_COMMIT_MAX_TIME_HOURS: 8
  BATCH_COMMIT_SIMILARITY_THRESHOLD: 0.8
  BATCH_COMMIT_RETRY_ATTEMPTS: 3

Agent Config:
  model: sonnet
  timeout_seconds: 300
  max_iterations: 10
  features: [time_aggregation, comment_deduplication, transition_support, dry_run_mode, parallel_validation]
```

## Integration Points

**Called By**: qa-comment-responder, qa-ticket-reviewer, git hooks, CI/CD pipelines, manual workflow
**Calls**: Git (commit parsing), Jira MCP tools (issue updates), utility functions (time parsing, dedup)

**Data Flow**: Git commits → Extracted commands → Aggregated data → Validated data → Jira updates → Batch result

## Performance Constraints

- Recommended batch size: 10-50 commits (max 100)
- Max issues per batch: 50
- Max time per issue: 8h
- Max comment length: 32,767 chars (Jira limit)
- Parallel validation for issue checks, sequential execution for updates

## Status

**Status:** Ready for implementation
**Owner:** Jira Orchestration Team
**Last Reviewed:** 2025-12-19

---

## Related

- qa-comment-responder.md
- qa-ticket-reviewer.md
- qa-confluence-documenter.md

## References

- [Jira Smart Commits](https://support.atlassian.com/jira-software-cloud/docs/process-issues-with-smart-commits/)
- [Jira REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- [Git Log Format](https://git-scm.com/docs/git-log#_pretty_formats)
