# Jira GitHub Actions Integration Setup Guide

This guide covers setup and configuration for automated Jira integration using GitHub Actions and the Gajira action suite.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Required Secrets](#required-secrets)
4. [Workflow Descriptions](#workflow-descriptions)
5. [Configuration](#configuration)
6. [Customization](#customization)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## Overview

These workflows automate Jira integration across the development lifecycle:

| Workflow | Purpose | Triggers |
|----------|---------|----------|
| **jira-pr-sync.yml** | Sync PR lifecycle events to Jira | PR opened, updated, merged, closed |
| **jira-deployment-track.yml** | Track deployments in Jira | Deployment status events |
| **jira-build-status.yml** | Report CI/CD build results | Workflow run completion |
| **jira-auto-create.yml** | Create Jira issues from GitHub | GitHub issue opened/labeled |

**Business Value:**
- Eliminate manual status updates in Jira
- Improve visibility across development and deployment
- Maintain single source of truth for issue tracking
- Reduce context switching between tools

---

## Prerequisites

### 1. Jira Cloud Instance
- Active Jira Cloud subscription
- Admin access to create API tokens
- Project with configured workflow statuses

### 2. GitHub Repository
- GitHub Actions enabled
- Admin access to configure secrets
- Write permissions for workflows

### 3. Jira Project Configuration
- Project key (e.g., "PROJ", "TEAM")
- Configured issue types (Bug, Story, Task, etc.)
- Defined workflow transitions

---

## Required Secrets

Configure these secrets in your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

### Core Secrets (REQUIRED)

| Secret Name | Description | Example | How to Obtain |
|------------|-------------|---------|---------------|
| `JIRA_BASE_URL` | Your Jira instance URL | `https://your-org.atlassian.net` | Your Jira domain |
| `JIRA_USER_EMAIL` | Email for Jira user | `bot@your-org.com` | Jira user account email |
| `JIRA_API_TOKEN` | Jira API authentication token | `ATATT3x...` | See [Creating API Token](#creating-jira-api-token) |
| `JIRA_PROJECT_KEY` | Default project key for issues | `PROJ` | From your Jira project settings |

### Optional Secrets

| Secret Name | Description | Used By |
|------------|-------------|---------|
| `JIRA_DEPLOYMENT_URL_FIELD_ID` | Custom field ID for deployment URLs | jira-deployment-track.yml |

---

## Creating Jira API Token

### Step-by-Step Instructions

1. **Log into Jira Cloud**
   - Navigate to your Jira instance (e.g., `https://your-org.atlassian.net`)

2. **Access Account Settings**
   - Click your profile picture (top right)
   - Select "Account settings" or "Manage account"
   - Or go directly to: https://id.atlassian.com/manage-profile/security/api-tokens

3. **Create API Token**
   - Navigate to "Security" tab
   - Click "Create and manage API tokens"
   - Click "Create API token"
   - Enter label: "GitHub Actions Integration"
   - Click "Create"

4. **Copy Token**
   - **IMPORTANT:** Copy the token immediately (shown only once)
   - Store securely in GitHub Secrets

5. **Verify Permissions**
   - Ensure the user account has:
     - Browse projects permission
     - Create issues permission
     - Edit issues permission
     - Add comments permission
     - Transition issues permission

---

## Workflow Descriptions

### 1. jira-pr-sync.yml

**Triggers:** PR lifecycle events (opened, updated, merged, closed)

**Workflow Steps:**
1. Authenticate with Jira
2. Extract Jira issue key from PR branch name or title
3. Add PR link comment to Jira issue
4. Transition issue based on PR status:
   - **PR opened/reopened** → "In Review"
   - **PR merged** → "Done"
   - **PR closed (not merged)** → "Reopened"
5. Extract all issue keys from commit messages
6. Link all related issues to PR

**Issue Key Detection:**
- Branch names: `feature/PROJ-123-description`, `bugfix/TEAM-456`
- PR titles: `[PROJ-123] Fix authentication bug`
- Commit messages: `Fix PROJ-123: Update validation`

**Expected Outcomes:**
- Jira issues automatically updated with PR status
- No manual status transitions needed
- Clear audit trail of PR activity in Jira

---

### 2. jira-deployment-track.yml

**Triggers:** Deployment status events (created, success, failure, in_progress)

**Workflow Steps:**
1. Authenticate with Jira
2. Extract all issue keys from deployment commits
3. Post deployment status comment to all related issues
4. On production success: Transition issues to "Released"
5. Optionally update custom deployment URL field
6. Generate deployment summary

**Deployment Status Mapping:**
- ✅ Success → "Released" (production only)
- ❌ Failure → Comment with error details
- 🚀 In Progress → Comment with deployment start

**Expected Outcomes:**
- Complete deployment visibility in Jira
- Automatic release tracking
- Deployment URL captured in issues

---

### 3. jira-build-status.yml

**Triggers:** Any workflow run completion (CI/CD pipelines)

**Workflow Steps:**
1. Authenticate with Jira
2. Extract issue keys from recent commits
3. Post build status comment to issues
4. On failure:
   - Parse test results (if available)
   - Add "build-failed" label
   - Transition to "In Progress" (main branch only)
5. On success:
   - Remove "build-failed" label
6. Generate build summary

**Build Status Mapping:**
- ✅ Success → Green build notification
- ❌ Failure → Red build notification + test failure details
- ⚠️ Cancelled → Warning notification
- ⏱️ Timed out → Timeout notification

**Expected Outcomes:**
- Immediate build failure visibility
- Test failure metrics in Jira
- Automatic issue reopening on main branch failures

---

### 4. jira-auto-create.yml

**Triggers:** GitHub issue opened or labeled

**Workflow Steps:**
1. Check for trigger labels (`jira-sync`, `bug`, `feature`)
2. Verify no existing Jira link in issue body
3. Determine Jira issue type from GitHub labels
4. Create Jira issue with GitHub issue details
5. Add bidirectional links (GitHub ↔ Jira)
6. Sync assignee (if configured)
7. Map labels to Jira components

**Label to Issue Type Mapping:**
- `bug` → Jira Bug (High priority)
- `feature` → Jira Story (Medium priority)
- `enhancement` → Jira Improvement (Medium priority)
- `task` → Jira Task (Low priority)

**Expected Outcomes:**
- Unified issue tracking across tools
- Automatic bidirectional linking
- Reduced manual data entry

---

## Configuration

### Step 1: Add Secrets to GitHub

```bash
# Via GitHub UI:
# Settings → Secrets and variables → Actions → New repository secret

# Or via GitHub CLI:
gh secret set JIRA_BASE_URL --body "https://your-org.atlassian.net"
gh secret set JIRA_USER_EMAIL --body "bot@your-org.com"
gh secret set JIRA_API_TOKEN --body "your-api-token-here"
gh secret set JIRA_PROJECT_KEY --body "PROJ"
```

### Step 2: Copy Workflows to Repository

```bash
# Copy all workflow files to your repository
cp jira-*.yml /path/to/your-repo/.github/workflows/
```

### Step 3: Customize Workflow Transitions

Edit workflow files to match your Jira workflow:

**jira-pr-sync.yml:**
```yaml
# Line 68: Customize transition name
transition: "In Review"  # Change to your status name

# Line 81: Customize "done" transition
transition: "Done"  # Change to your status name

# Line 94: Customize "reopened" transition
transition: "Reopened"  # Change to your status name
```

**jira-deployment-track.yml:**
```yaml
# Line 157: Customize production transition
# Finds "Released", "Closed", or "Done"
select(.name | test("Released|Closed|Done"; "i"))
```

**jira-build-status.yml:**
```yaml
# Line 241: Customize failure transition
select(.name | test("In Progress|Reopened"; "i"))
```

### Step 4: Configure Jira Workflow Statuses

Ensure your Jira project has these statuses configured:

**Recommended Status Flow:**
```
To Do → In Progress → In Review → Done → Released
                          ↓
                      Reopened
```

**Minimum Required Statuses:**
- In Review (for PR opened)
- Done (for PR merged)
- Reopened (for PR closed without merge)

**To Add Status:**
1. Jira Project Settings → Workflows
2. Edit workflow
3. Add status or transition
4. Publish workflow

### Step 5: Enable Workflows

```bash
# Commit and push workflows
git add .github/workflows/jira-*.yml
git commit -m "Add Jira GitHub Actions integration"
git push

# Verify workflows appear in:
# Actions tab → Workflows (left sidebar)
```

---

## Customization

### Modify Workflow Triggers

**Example: Only sync PRs to main/develop branches**

```yaml
# jira-pr-sync.yml
on:
  pull_request:
    branches:
      - main
      - develop
    types: [opened, synchronize, reopened, closed]
```

**Example: Only track specific workflows**

```yaml
# jira-build-status.yml
on:
  workflow_run:
    workflows: ["CI", "Tests", "Build"]  # Specific workflow names
    types: [completed]
```

### Customize Issue Key Pattern

**Default pattern:** `[A-Z]{2,10}-[0-9]+` (e.g., PROJ-123, TEAM-456)

**Modify in workflows:**
```bash
# Find in all workflows:
grep -oE '[A-Z]{2,10}-[0-9]+' commits.txt

# Change to match your pattern, e.g., single letter:
grep -oE '[A-Z]-[0-9]+' commits.txt
```

### Add Custom Labels

**jira-build-status.yml - Add severity labels:**

```yaml
- name: Add severity label
  run: |
    if [ "${{ steps.test-results.outputs.failures }}" -gt "10" ]; then
      LABEL="critical-failure"
    else
      LABEL="build-failed"
    fi

    curl -X PUT \
      -H "Authorization: ..." \
      -d "{\"update\": {\"labels\": [{\"add\": \"$LABEL\"}]}}"
```

### Map GitHub Users to Jira Users

**jira-auto-create.yml - User mapping:**

```yaml
- name: Map assignee
  run: |
    case "${{ github.event.issue.assignee.login }}" in
      "github-user1")
        JIRA_ACCOUNT_ID="5d1234567890abcdef"
        ;;
      "github-user2")
        JIRA_ACCOUNT_ID="5d0987654321fedcba"
        ;;
      *)
        JIRA_ACCOUNT_ID=""
        ;;
    esac
```

### Add Custom Jira Fields

**Example: Set sprint field on creation**

```yaml
# jira-auto-create.yml - Add to fields section
fields: |
  {
    "priority": {"name": "High"},
    "labels": ["github"],
    "customfield_10020": 123  # Sprint field ID and value
  }
```

**Find field IDs:**
```bash
# Get all fields
curl -H "Authorization: Basic $(echo -n email:token | base64)" \
  https://your-org.atlassian.net/rest/api/3/field
```

---

## Troubleshooting

### Issue: Workflow runs but doesn't update Jira

**Symptoms:**
- Workflow completes successfully
- No Jira comments or transitions

**Solutions:**

1. **Verify secrets are set correctly:**
   ```bash
   # Check secret names (values are hidden)
   gh secret list
   ```

2. **Test Jira API authentication:**
   ```bash
   # Test API connection
   curl -u "email:api-token" \
     https://your-org.atlassian.net/rest/api/3/myself
   ```

3. **Check Jira permissions:**
   - User must have "Browse Projects" permission
   - User must have "Create Issues" permission
   - User must have "Edit Issues" permission

4. **Verify issue key format:**
   - Ensure branch/PR follows pattern: `PROJ-123`
   - Check workflow logs for "Found issue keys" output

---

### Issue: Transition fails (404 or 400 error)

**Symptoms:**
- Error: "Transition 'In Review' not found"
- 404 or 400 HTTP status code

**Solutions:**

1. **Verify status exists in workflow:**
   ```bash
   # Get available transitions for an issue
   curl -u "email:token" \
     https://your-org.atlassian.net/rest/api/3/issue/PROJ-123/transitions
   ```

2. **Update workflow with correct transition name:**
   - Transitions are case-sensitive
   - Use exact name from Jira workflow

3. **Check transition is available from current status:**
   - Some transitions only work from specific statuses
   - Workflow may need to be in "In Progress" before "In Review"

---

### Issue: Multiple issue keys found, only one updated

**Symptoms:**
- PR has commits referencing PROJ-123, PROJ-124, PROJ-125
- Only PROJ-123 gets updated

**Solutions:**

This is expected for `gajira-find-issue-key` (returns first match only).

**Workaround:** The workflows include bulk update logic:

```yaml
# Step 8 in jira-pr-sync.yml handles multiple issues
- name: Extract issue keys from commits
  # ... extracts all issue keys
- name: Link all related Jira issues
  # ... loops through all keys
```

Verify this step runs successfully in workflow logs.

---

### Issue: Deployment tracking doesn't trigger

**Symptoms:**
- Deployments succeed
- No Jira updates

**Solutions:**

1. **Verify deployment events are sent:**
   - GitHub deployments must use Deployments API
   - Direct pushes to production don't trigger `deployment_status`

2. **Create deployment using GitHub API:**
   ```yaml
   # Example deployment creation
   - name: Create deployment
     uses: chrnorm/deployment-action@v2
     with:
       token: ${{ secrets.GITHUB_TOKEN }}
       environment: production
   ```

3. **Check deployment status is set:**
   ```yaml
   - name: Update deployment status
     uses: chrnorm/deployment-status@v2
     with:
       token: ${{ secrets.GITHUB_TOKEN }}
       state: success
   ```

---

### Issue: Build status workflow runs for every workflow

**Symptoms:**
- Too many Jira comments
- Workflows like "pages-build-deployment" trigger updates

**Solutions:**

**Filter specific workflows:**

```yaml
# jira-build-status.yml
on:
  workflow_run:
    workflows: ["CI", "Tests"]  # Only these workflows
    types: [completed]
```

**Filter by workflow conclusion:**

```yaml
jobs:
  report-build-status:
    if: |
      github.event.workflow_run.conclusion != 'skipped' &&
      github.event.workflow_run.name != 'pages-build-deployment'
```

---

### Issue: API rate limits exceeded

**Symptoms:**
- Error: "API rate limit exceeded"
- 429 HTTP status code

**Solutions:**

1. **Add rate limiting delays:**
   ```yaml
   - name: Update with delay
     run: |
       for KEY in "${KEYS[@]}"; do
         # Update Jira
         sleep 1  # 1 second delay between requests
       done
   ```

2. **Batch API calls:**
   - Use Jira bulk update APIs where possible
   - Combine multiple updates into single request

3. **Reduce workflow triggers:**
   - Filter workflows by branch
   - Skip non-critical updates (e.g., draft PRs)

---

## Best Practices

### 1. Branch Naming Convention

**Enforce consistent branch naming to ensure issue detection:**

```
feature/PROJ-123-short-description
bugfix/PROJ-456-fix-auth-bug
hotfix/TEAM-789-critical-fix
```

**GitHub Branch Protection:**
- Settings → Branches → Branch name pattern
- Pattern: `feature/*`, `bugfix/*`, etc.

### 2. Commit Message Format

**Include issue key for comprehensive tracking:**

```
PROJ-123: Add user authentication

- Implement OAuth2 flow
- Add JWT token validation
- Update documentation

Fixes PROJ-123
```

**Multiple issues:**
```
PROJ-123, PROJ-124: Refactor authentication

Related to PROJ-125
```

### 3. PR Title Format

**Use consistent PR title format:**

```
[PROJ-123] Add user authentication feature
[TEAM-456] Fix: Resolve login timeout issue
[API-789] Refactor: Improve database queries
```

### 4. Workflow Monitoring

**Set up alerts for workflow failures:**

1. **GitHub Actions monitoring:**
   - Settings → Notifications → Actions
   - Enable "Send notifications for failed workflows"

2. **Slack integration:**
   ```yaml
   - name: Notify on failure
     if: failure()
     uses: slackapi/slack-github-action@v1
     with:
       payload: |
         {
           "text": "Jira sync failed: ${{ github.workflow }}"
         }
   ```

### 5. Security Considerations

**Never expose secrets in logs:**

```yaml
# BAD - Exposes token
- run: echo "Token: ${{ secrets.JIRA_API_TOKEN }}"

# GOOD - No token exposure
- run: |
    if [ -z "${{ secrets.JIRA_API_TOKEN }}" ]; then
      echo "::error::JIRA_API_TOKEN not configured"
    fi
```

**Use environment secrets for production:**
- Settings → Environments → production
- Add secrets scoped to production environment only

### 6. Testing Changes

**Test workflow changes safely:**

1. **Create test branch:**
   ```bash
   git checkout -b test/workflow-updates
   ```

2. **Update workflow with test mode:**
   ```yaml
   # Add to workflow for testing
   on:
     workflow_dispatch:  # Manual trigger
   ```

3. **Test manually:**
   - Actions → Workflow name → Run workflow
   - Verify output in logs
   - Check Jira for updates

4. **Use test Jira project:**
   ```yaml
   # Temporarily override for testing
   project: TEST  # Instead of PROJ
   ```

### 7. Documentation Maintenance

**Keep documentation in sync with workflows:**

- Document custom transitions in README
- Maintain changelog for workflow updates
- Include examples of expected behavior
- Document any custom field mappings

---

## Advanced Configuration

### Environment-Specific Deployments

**Track deployments by environment:**

```yaml
# jira-deployment-track.yml - Custom per environment
- name: Determine environment action
  run: |
    ENV="${{ github.event.deployment.environment }}"

    case "$ENV" in
      production)
        TRANSITION="Released"
        LABEL="production-deployed"
        ;;
      staging)
        TRANSITION="In QA"
        LABEL="staging-deployed"
        ;;
      development)
        TRANSITION="In Development"
        LABEL="dev-deployed"
        ;;
    esac

    echo "transition=$TRANSITION" >> $GITHUB_OUTPUT
    echo "label=$LABEL" >> $GITHUB_OUTPUT
```

### Custom Comment Formatting

**Rich text Jira comments using Atlassian Document Format:**

```yaml
- name: Post formatted comment
  run: |
    curl -X POST \
      -H "Authorization: ..." \
      -d '{
        "body": {
          "type": "doc",
          "version": 1,
          "content": [
            {
              "type": "heading",
              "attrs": {"level": 2},
              "content": [{"type": "text", "text": "Build Status"}]
            },
            {
              "type": "paragraph",
              "content": [
                {"type": "text", "text": "Status: ", "marks": [{"type": "strong"}]},
                {"type": "text", "text": "Success ✅"}
              ]
            },
            {
              "type": "codeBlock",
              "attrs": {"language": "bash"},
              "content": [{"type": "text", "text": "npm run build"}]
            }
          ]
        }
      }'
```

---

## Migration Guide

### Migrating from Manual Jira Updates

**Phase 1: Parallel Run (Week 1-2)**
- Enable workflows
- Continue manual updates
- Verify workflow accuracy
- Adjust transitions as needed

**Phase 2: Hybrid Mode (Week 3-4)**
- Reduce manual updates to 50%
- Monitor for missed updates
- Gather team feedback
- Document edge cases

**Phase 3: Full Automation (Week 5+)**
- Stop manual updates
- Workflows handle all transitions
- Monitor for issues
- Iterate on improvements

---

## Support Resources

### Official Documentation

- [Gajira Actions](https://github.com/atlassian/gajira)
- [Jira REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- [GitHub Actions](https://docs.github.com/en/actions)

### Getting Help

1. **Check workflow logs:**
   - Actions tab → Failed workflow → View logs
   - Look for error messages in steps

2. **Test Jira API manually:**
   - Use curl or Postman
   - Verify credentials and permissions

3. **Community support:**
   - GitHub Discussions (this repo)
   - Atlassian Community
   - Stack Overflow

---

## Changelog

### Version 1.0.0 (2025-12-19)

**Initial Release:**
- jira-pr-sync.yml - PR lifecycle synchronization
- jira-deployment-track.yml - Deployment tracking
- jira-build-status.yml - Build status reporting
- jira-auto-create.yml - Automated issue creation

**Features:**
- Bidirectional GitHub ↔ Jira linking
- Multi-issue support in single PR
- Environment-aware deployment tracking
- Comprehensive error handling
- Rich Jira comment formatting

---

## License

These workflows are provided as-is under MIT License. Customize as needed for your organization.

---

## Quick Reference Card

```yaml
# Secrets Required
JIRA_BASE_URL: "https://your-org.atlassian.net"
JIRA_USER_EMAIL: "bot@your-org.com"
JIRA_API_TOKEN: "ATATT3x..."
JIRA_PROJECT_KEY: "PROJ"

# Branch Naming
feature/PROJ-123-description
bugfix/TEAM-456-fix
hotfix/API-789-critical

# PR Title Format
[PROJ-123] Feature description

# Commit Message
PROJ-123: Change description

# Workflow Customization Points
- Transition names (In Review, Done, Released)
- Issue type mapping (Bug, Story, Task)
- Label to component mapping
- Deployment environment handling

# Testing
gh workflow run jira-pr-sync.yml
gh workflow run jira-deployment-track.yml
gh workflow run jira-build-status.yml
gh workflow run jira-auto-create.yml

# Monitoring
gh run list --workflow=jira-pr-sync.yml
gh run list --workflow=jira-deployment-track.yml
gh run view <run-id>
```

---

**Questions?** Open an issue or contact your DevOps team.
