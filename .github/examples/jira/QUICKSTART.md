> Historical integration examples, retired from this repository’s CI on 2026-09-17. No Jira repository secrets are configured. These files are reference material; adopting them requires an owning project, credential configuration, and script/security review. They are not installed or exercised by this repository.

# Jira GitHub Actions - Quick Start Guide

Get Jira integration running in 10 minutes.

---

## Prerequisites

- Jira Cloud instance (e.g., `https://your-org.atlassian.net`)
- GitHub repository with Actions enabled
- Admin access to both platforms

---

## Step 1: Create Jira API Token (2 minutes)

1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Label: "GitHub Actions Integration"
4. Click "Create" and copy the token (shown only once)
5. Save it securely - you'll need it in Step 2

---

## Step 2: Add GitHub Secrets (3 minutes)

Go to your repository → **Settings → Secrets and variables → Actions → New repository secret**

Add these 4 secrets:

| Secret Name | Value | Example |
|------------|-------|---------|
| `JIRA_BASE_URL` | Your Jira instance URL | `https://your-org.atlassian.net` |
| `JIRA_USER_EMAIL` | Email of Jira user | `bot@your-org.com` |
| `JIRA_API_TOKEN` | Token from Step 1 | `ATATT3xFfGF0...` |
| `JIRA_PROJECT_KEY` | Your project key | `PROJ` |

**Via GitHub CLI:**
```bash
gh secret set JIRA_BASE_URL --body "https://your-org.atlassian.net"
gh secret set JIRA_USER_EMAIL --body "bot@your-org.com"
gh secret set JIRA_API_TOKEN --body "your-token-here"
gh secret set JIRA_PROJECT_KEY --body "PROJ"
```

---

## Step 3: Test Connection (1 minute)

Verify your credentials work:

```bash
# Replace with your actual values
curl -u "your-email@org.com:your-api-token" \
  https://your-org.atlassian.net/rest/api/3/myself
```

Expected response: Your Jira user information (JSON)

If this fails, double-check your email and API token.

---

## Step 4: Copy Workflow Files (2 minutes)

Copy these 4 workflow files to your repository's `.github/workflows/` directory:

1. `jira-pr-sync.yml` - PR lifecycle sync
2. `jira-deployment-track.yml` - Deployment tracking
3. `jira-build-status.yml` - Build status reporting
4. `jira-auto-create.yml` - Auto-create Jira issues

```bash
# If you cloned this template:
cp *.yml /path/to/your-repo/.github/workflows/

# Or create .github/workflows directory and copy manually
mkdir -p .github/workflows
```

---

## Step 5: Customize Transitions (2 minutes)

Edit each workflow file to match your Jira workflow status names.

**Find your Jira status names:**
1. Go to Jira Project Settings → Workflows
2. View your workflow
3. Note exact status names (case-sensitive)

**Update workflows:**

**jira-pr-sync.yml** (lines 68, 81, 94):
```yaml
# Line 68 - When PR is opened
transition: "In Review"  # Change to your status

# Line 81 - When PR is merged
transition: "Done"  # Change to your status

# Line 94 - When PR is closed without merge
transition: "Reopened"  # Change to your status
```

**jira-deployment-track.yml** (line 157):
```yaml
# Line 157 - When deployed to production
select(.name | test("Released|Closed|Done"; "i"))
# Add your production status name to this regex
```

**jira-build-status.yml** (line 241):
```yaml
# Line 241 - When build fails on main
select(.name | test("In Progress|Reopened"; "i"))
# Add your "in progress" status name
```

**jira-auto-create.yml** (no changes needed for basic setup)

**Common Jira status names:**
- "To Do"
- "In Progress"
- "In Review"
- "Done"
- "Closed"
- "Reopened"
- "Released"

---

## Step 6: Commit and Push (1 minute)

```bash
git add .github/workflows/jira-*.yml
git commit -m "Add Jira GitHub Actions integration"
git push
```

---

## Step 7: Test with a PR (5 minutes)

Create a test PR to verify integration:

1. **Create test branch:**
   ```bash
   git checkout -b feature/PROJ-123-test-jira-integration
   ```

   Replace `PROJ-123` with an actual issue key from your Jira project.

2. **Make a change:**
   ```bash
   echo "# Test" >> test-file.md
   git add test-file.md
   git commit -m "PROJ-123: Test Jira integration"
   git push -u origin feature/PROJ-123-test-jira-integration
   ```

3. **Create PR:**
   - Go to GitHub and create a PR
   - Title: `[PROJ-123] Test Jira integration`

4. **Verify:**
   - Check **Actions** tab → Should see "Jira PR Sync" running
   - Check Jira issue `PROJ-123` → Should have new comment with PR link
   - Jira issue should transition to "In Review" (or your configured status)

5. **Cleanup:**
   - Merge or close the PR
   - Check Jira issue status updated again

---

## Expected Results

After following these steps, your workflows will:

1. **jira-pr-sync.yml:**
   - Add PR link to Jira when PR is opened
   - Transition issue to "In Review"
   - Update status when PR is merged or closed

2. **jira-deployment-track.yml:**
   - Comment deployment status on Jira issues
   - Transition to "Released" on production deployments

3. **jira-build-status.yml:**
   - Comment build results on Jira issues
   - Add labels on build failures

4. **jira-auto-create.yml:**
   - Create Jira issue when GitHub issue has specific labels
   - Link GitHub and Jira issues bidirectionally

---

## Troubleshooting

### Issue: Workflow runs but doesn't update Jira

**Check:**
1. Secrets are set correctly (no typos)
2. Issue key format matches `PROJ-123` pattern
3. Issue exists in Jira project
4. Workflow logs show "Found issue keys"

**Test:**
```bash
# Verify secrets are set
gh secret list

# Check workflow logs
gh run list --workflow=jira-pr-sync.yml
gh run view <run-id> --log
```

---

### Issue: Transition fails

**Error:** "Transition 'In Review' not found"

**Fix:**
1. Get available transitions:
   ```bash
   curl -u "email:token" \
     https://your-org.atlassian.net/rest/api/3/issue/PROJ-123/transitions
   ```

2. Update workflow with exact transition name (case-sensitive)

---

### Issue: Authentication fails

**Error:** 401 Unauthorized

**Fix:**
1. Verify email and token are correct
2. Check token hasn't expired
3. Test connection:
   ```bash
   curl -u "email:token" \
     https://your-org.atlassian.net/rest/api/3/myself
   ```

---

## Next Steps

Once basic integration works:

1. **Customize for your team:**
   - Update label-to-issue-type mapping (jira-auto-create.yml)
   - Add component mapping (jira-auto-create.yml)
   - Configure user mapping for assignee sync

2. **Optimize workflows:**
   - Filter which workflows trigger updates
   - Add custom Jira fields
   - Configure environment-specific deployments

3. **Monitor and iterate:**
   - Review workflow logs weekly
   - Adjust transitions based on team feedback
   - Add custom notifications (Slack, email)

4. **Read full documentation:**
   - See `README-JIRA-INTEGRATION.md` for complete guide
   - See [`jira-config-example.yml`](jira-config-example.yml) for configuration examples (not an executable workflow)

---

## Branch Naming Convention

For automatic issue detection, use this format:

```
feature/PROJ-123-short-description
bugfix/PROJ-456-fix-description
hotfix/PROJ-789-critical-fix
```

**Pattern:** `<type>/<ISSUE-KEY>-<description>`

---

## PR Title Convention

Include issue key in PR title:

```
[PROJ-123] Add user authentication
[PROJ-456] Fix: Login timeout issue
[PROJ-789] Refactor: Database queries
```

---

## Commit Message Convention

Include issue key in commit message:

```
PROJ-123: Add user authentication

- Implement OAuth2 flow
- Add JWT validation
- Update tests

Fixes PROJ-123
```

---

## Required Jira Permissions

The Jira user (API token owner) needs these permissions:

- Browse Projects
- Create Issues
- Edit Issues
- Add Comments
- Transition Issues

**To verify:** Try manually updating an issue with the Jira user account.

---

## Recommended Jira Workflow

These workflows work best with this status flow:

```
To Do → In Progress → In Review → Done → Released
            ↓             ↓
        Reopened ← PR Closed
```

**Minimum required statuses:**
- In Review (for PR opened)
- Done (for PR merged)
- Reopened (for PR closed without merge)

---

## Common Patterns

### Multiple issues in one PR

Workflows automatically detect multiple issue keys:

**Branch:** `feature/PROJ-123-PROJ-124-combined-fix`

**Commits:**
```
PROJ-123: Fix authentication
PROJ-124: Update validation
```

All issues (PROJ-123, PROJ-124) will be updated.

---

### Skip Jira sync for specific PRs

**Method 1:** Don't include issue key in branch or title

**Method 2:** Add filter to workflow:
```yaml
if: |
  github.actor != 'dependabot[bot]' &&
  !contains(github.event.pull_request.labels.*.name, 'skip-jira')
```

Then add `skip-jira` label to PRs you want to skip.

---

## Validation Checklist

Before going live:

- [ ] Secrets configured correctly
- [ ] Test connection successful
- [ ] Workflows copied to repository
- [ ] Transitions customized for your workflow
- [ ] Test PR created and verified
- [ ] Jira issue updated correctly
- [ ] Team trained on branch naming convention
- [ ] Documentation shared with team

---

## Quick Commands

```bash
# Test connection
curl -u "email:token" https://your-org.atlassian.net/rest/api/3/myself

# Add secrets
gh secret set JIRA_BASE_URL --body "https://your-org.atlassian.net"
gh secret set JIRA_USER_EMAIL --body "email@org.com"
gh secret set JIRA_API_TOKEN --body "token"
gh secret set JIRA_PROJECT_KEY --body "PROJ"

# List secrets
gh secret list

# View workflow runs
gh run list --workflow=jira-pr-sync.yml

# View specific run
gh run view <run-id> --log

# Manually trigger workflow (add workflow_dispatch trigger first)
gh workflow run jira-pr-sync.yml
```

---

## Getting Help

1. **Check workflow logs:**
   - Actions tab → Failed workflow → View logs

2. **Test Jira API manually:**
   - Use curl commands above
   - Verify credentials and permissions

3. **Review full documentation:**
   - `README-JIRA-INTEGRATION.md`
   - `jira-config-example.yml` (reference configuration; keep outside `workflows/`)

4. **Common issues:**
   - Secrets not set or incorrect
   - Issue key not in branch/title
   - Transition name doesn't match Jira
   - User lacks permissions

---

## Success Indicators

You know it's working when:

- Workflow shows green checkmark in Actions tab
- Jira issue has comment with PR link
- Jira issue status changes automatically
- No manual status updates needed
- Team adopts branch naming convention

---

**Time to value:** 10 minutes setup → Automatic Jira updates for life

**Questions?** See full documentation or open an issue.

---

## One-Command Setup (Advanced)

For experienced users, here's a script to set up everything:

```bash
#!/bin/bash
# setup-jira-integration.sh

# Configuration
JIRA_BASE_URL="https://your-org.atlassian.net"
JIRA_USER_EMAIL="bot@your-org.com"
JIRA_API_TOKEN="your-token-here"
JIRA_PROJECT_KEY="PROJ"

# Add secrets
gh secret set JIRA_BASE_URL --body "$JIRA_BASE_URL"
gh secret set JIRA_USER_EMAIL --body "$JIRA_USER_EMAIL"
gh secret set JIRA_API_TOKEN --body "$JIRA_API_TOKEN"
gh secret set JIRA_PROJECT_KEY --body "$JIRA_PROJECT_KEY"

# Test connection
echo "Testing Jira connection..."
curl -u "$JIRA_USER_EMAIL:$JIRA_API_TOKEN" "$JIRA_BASE_URL/rest/api/3/myself"

# Create workflows directory
mkdir -p .github/workflows

# Copy workflow files (assuming they're in current directory)
cp jira-*.yml .github/workflows/

# Commit and push
git add .github/workflows/jira-*.yml
git commit -m "Add Jira GitHub Actions integration"
git push

echo "Setup complete! Create a test PR to verify."
```

Save as `setup-jira-integration.sh`, update variables, and run:

```bash
chmod +x setup-jira-integration.sh
./setup-jira-integration.sh
```

---

**Ready to go?** Follow the 7 steps above and start automating Jira updates!
