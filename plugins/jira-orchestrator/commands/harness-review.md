---
name: jira-orchestrator:harness-review
intent: Harness PR Review Command
tags:
  - jira-orchestrator
  - command
  - harness-review
inputs: []
risk: medium
cost: medium
description: Harness PR Review Command
---

# Harness PR Review Command

Review pull requests in Harness Code repositories with Claude-powered analysis and Jira synchronization.

## Usage

```bash
/harness-review <repo> <pr-number> [--jira <issue-key>] [--auto-approve]
```

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `repo` | Yes | Repository identifier in Harness |
| `pr-number` | Yes | Pull request number |
| `--jira` | No | Jira issue key to sync review status |
| `--auto-approve` | No | Auto-approve if no critical issues found |
| `--workspace` | No | Review all PRs in VS Code workspace |

## Examples

```bash
# Review a single PR
/harness-review my-service 42

# Review with Jira sync
/harness-review my-service 42 --jira PROJ-123

# Review all PRs in workspace
/harness-review --workspace --jira PROJ-123
```

## Workflow

When invoked, this command will:

1. **Fetch PR Details** via Harness MCP
   - Get PR metadata, files changed, and commit information
   - Retrieve existing comments and review status

2. **Analyze Code Changes**
   - Review each changed file for potential issues
   - Check for security vulnerabilities
   - Identify code quality concerns
   - Look for missing tests or documentation

3. **Add Inline Comments** via Harness REST API
   - Add comments on specific lines where issues are found
   - Include severity (critical, warning, info)
   - Provide suggestions for improvement

4. **Submit Review Decision**
   - `approved` - No critical issues found
   - `changereq` - Critical issues require changes
   - `reviewed` - Issues found but not blocking

5. **Sync to Jira** (if --jira provided)
   - Add comment with review summary
   - Update custom fields with PR status
   - Transition issue if configured

## Multi-Repository Workspace Support

When using `--workspace`, the command will:

1. Detect all repositories in the VS Code workspace
2. Find open PRs linked to the specified Jira issue
3. Review each PR and aggregate results
4. Provide a consolidated review summary

### VS Code Workspace Detection

The command looks for repositories in:

1. `.code-workspace` file (multi-root workspace)
2. Git repositories in current directory tree
3. Submodules in main repository

### Configuration

Create `.jira/harness-config.yml` in your workspace root:

```yaml
harness:
  api:
    base_url: "${HARNESS_BASE_URL}"
    api_key: "${HARNESS_API_KEY}"

  workspace:
    # Repositories in this workspace
    repositories:
      - identifier: frontend-app
        path: ./frontend
        jira_project: FRONT

      - identifier: backend-api
        path: ./backend
        jira_project: BACK

      - identifier: shared-libs
        path: ./libs
        jira_project: SHARED

    # Default branch for PRs
    default_branch: main

    # Auto-create repos if missing
    auto_create_repos: true

  review:
    # Review rules
    require_tests: true
    require_docs: false
    security_scan: true

    # Auto-approval rules
    auto_approve:
      enabled: false
      max_files_changed: 5
      excluded_patterns:
        - "*.md"
        - "*.txt"
        - ".gitignore"

    # Severity thresholds
    severity:
      critical:
        - security_vulnerability
        - data_exposure
        - authentication_bypass
      warning:
        - missing_error_handling
        - code_smell
        - performance_issue
      info:
        - style_suggestion
        - documentation_improvement

  jira:
    # Jira integration
    connector_ref: jira_connector
    sync_enabled: true

    # Status mapping
    status_mapping:
      approved: "In Review"
      changereq: "In Progress"
      reviewed: "In Review"

    # Fields to update
    fields:
      pr_status: customfield_10200
      review_comments: customfield_10201
      last_reviewed: customfield_10202
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `HARNESS_API_KEY` | Yes | Harness API key |
| `HARNESS_BASE_URL` | No | Harness instance URL (default: https://app.harness.io) |
| `HARNESS_ACCOUNT_ID` | No | Harness account ID |
| `HARNESS_ORG_ID` | No | Organization ID |
| `HARNESS_PROJECT_ID` | No | Project ID |

## Implementation

```python
# This command uses the harness_code_api.py library
from lib.harness_code_api import HarnessCodeAPI

def review_pr(repo: str, pr_number: int, jira_key: str = None):
    client = HarnessCodeAPI()

    # 1. Get PR details via MCP
    pr = harness_get_pull_request(repo_id=repo, pr_number=pr_number)
    activities = harness_get_pull_request_activities(repo_id=repo, pr_number=pr_number)

    # 2. Analyze changes (Claude performs analysis)
    issues = analyze_code_changes(pr.diff)

    # 3. Add inline comments
    for issue in issues:
        client.create_comment(
            repo=repo,
            pr_number=pr_number,
            text=f"**{issue['severity']}**: {issue['message']}\\n\\n{issue['suggestion']}",
            path=issue['file'],
            line_start=issue['line_start'],
            line_end=issue['line_end']
        )

    # 4. Submit review
    decision = "changereq" if any(i['severity'] == 'critical' for i in issues) else "approved"
    client.submit_review(repo, pr_number, pr.source_sha, decision)

    # 5. Sync to Jira
    if jira_key:
        client.review_with_jira_sync(
            repo, pr_number, pr.source_sha, decision,
            jira_key=jira_key,
            issues_found=issues
        )

    return {
        "pr": pr_number,
        "decision": decision,
        "issues": len(issues),
        "jira_synced": jira_key is not None
    }
```

## REST API Reference

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Create Comment | POST | `/v1/repos/{repo}/pullreq/{pr}/comments` |
| Submit Review | POST | `/v1/repos/{repo}/pullreq/{pr}/reviews` |
| Merge PR | POST | `/v1/repos/{repo}/pullreq/{pr}/merge` |

### Review Decision Types

| Decision | Description |
|----------|-------------|
| `approved` | Approve PR for merge |
| `changereq` | Request changes before merge |
| `reviewed` | Mark as reviewed without approval |

## Related Commands

- `/jira-work` - Start working on a Jira issue
- `/jira-pr` - Create a PR linked to Jira
- `/jira-sync` - Sync changes with Jira
- `/harness-deploy` - Deploy via Harness pipeline

## Related Documentation

- [Harness MCP Server](https://developer.harness.io/docs/platform/harness-aida/harness-mcp-server/)
- [Harness Code Repository](https://developer.harness.io/docs/code-repository/)
- [Review PRs in Harness](https://developer.harness.io/docs/code-repository/pull-requests/review-pr/)
