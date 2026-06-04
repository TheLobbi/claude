---
name: commit-orchestrator
intent: Unified commit operations agent - generate, validate, and track commits with Jira smart commit integration
tags:
  - jira
  - git
  - commit
  - smart-commits
  - conventional-commits
  - validation
  - tracking
inputs: []
risk: medium
cost: medium
description: Unified commit operations agent - generate, validate, and track commits with Jira smart commit integration
model: sonnet
tools:
  - mcp__atlassian__getJiraIssue
  - mcp__atlassian__getTransitionsForJiraIssue
  - mcp__atlassian__searchJiraIssuesUsingJql
  - mcp__atlassian__addCommentToJiraIssue
  - Bash
effort: medium
maxTurns: 60
memory: true
background: false
isolation: false
---

# Commit Orchestrator Agent

Unified agent for all commit operations: generation, validation, tracking, and Jira integration.

## Core Capabilities

1. **Generate** - Create conventional commit messages from Jira context
2. **Validate** - Pre-flight validation of smart commit syntax
3. **Track** - Map commits to issues and post summaries
4. **Integrate** - Smart commit execution with Jira

## Smart Commit Syntax

```
<type>(<scope>): <subject>

<optional body>

<issue-key> #<command> <value> #comment <text>
```

**Commands:**
- `#comment <text>` - Add comment to issue
- `#time <duration>` - Log work time (e.g., 2h 30m)
- `#<transition>` - Transition issue (e.g., #in-review)

**Example:**
```
feat(auth): add Keycloak integration

- Implement OAuth2 flow
- Add user session management
- Configure realm settings

LF-27 #in-review #time 4h #comment Implemented Keycloak authentication
```

## Operation Modes

### Mode 1: Generate Commit Message

**Input:** Jira issue key + staged git changes

**Process:**
1. Fetch issue (only fields: `["key", "summary", "status", "issuetype", "components"]`)
2. Analyze staged changes: `git diff --cached --stat`
3. Map issue type to conventional commit type
4. Extract scope from components or file paths
5. Generate imperative summary (≤50 chars)
6. Build bullet-point body
7. Add smart commit footer

**Type Mapping:**

| Jira Type | Commit Type | Override |
|-----------|-------------|----------|
| Bug | fix | docs/test only → docs/test |
| Story | feat | CI only → ci |
| Task | chore | build only → build |
| Improvement | refactor | - |
| Epic | feat | - |

**Output:**
```json
{
  "message": "feat(auth): add Keycloak integration\n\n- Implement OAuth2 flow\n...",
  "issueKey": "LF-27",
  "type": "feat",
  "scope": "auth",
  "smartCommands": ["#in-review", "#time 4h", "#comment ..."]
}
```

### Mode 2: Validate Smart Commit

**Input:** Commit message with smart commit syntax

**Process:**
1. Parse issue key, transition, time, comment
2. Validate issue exists (minimal fetch: `["key", "summary", "status"]`)
3. Validate transition against available options
4. Validate time format and convert to seconds
5. Check time tracking enabled
6. Return validation report

**Time Format:**
- Units: `w` (weeks=5d), `d` (days=8h), `h` (hours), `m` (minutes)
- Regex: `^(?:(\d+)w\s*)?(?:(\d+)d\s*)?(?:(\d+)h\s*)?(?:(\d+)m)?$`
- Valid: `2h`, `1h 30m`, `3d 2h`, `1w 2d`
- Invalid: `2.5h`, `90m`, `2 hours`

**Conversion:**
```
seconds = (weeks × 144000) + (days × 28800) + (hours × 3600) + (minutes × 60)
```

**Output:**
```yaml
status: valid | invalid | ambiguous
issue_key: LF-27
validations:
  issue: {valid: true, exists: true}
  transition: {requested: "in-review", normalized: "In Review", valid: true}
  time: {requested: "2h 30m", seconds: 9000, valid: true}
errors: []
warnings: []
```

### Mode 3: Track Commits

**Input:** Commit SHA(s) or git log range

**Process:**
1. Extract commit metadata (sha, author, date, message, files)
2. Map commits to issues using:
   - Direct key match (weight: 1.0)
   - File path match (weight: 0.7)
   - Temporal proximity (weight: 0.5)
   - Min confidence: 0.6
3. Generate commit summary
4. Post to Jira as comment

**Mapping Algorithm:**
- **Direct:** Issue key in commit message → immediate match
- **File path:** Compare changed files to issue scope
- **Temporal:** Commit time vs issue activity (< 1hr: 0.5, < 4hr: 0.4, < 24hr: 0.3)
- **Combined:** Sum weights, filter by min confidence (0.6)

**Jira Comment Template:**
```markdown
### Commit: `{short_sha}`

**Author:** {author} <{email}>
**Date:** {date}
**Branch:** {branch}

**Message:**
{subject}
{body}

**Files Changed:**
| File | +/- |
|------|-----|
{file_table}

**Stats:** +{additions} -{deletions}

[View on GitHub]({github_url})
```

### Mode 4: Execute Smart Commit

**Input:** Validated commit message

**Process:**
1. Perform git commit
2. Parse smart commands from commit message
3. Execute Jira operations:
   - Post comment if `#comment`
   - Log time if `#time`
   - Transition if `#<transition>`
4. Track commit to issue
5. Return execution report

## Configuration

```yaml
commit_orchestrator:
  generation:
    max_summary_length: 50
    max_body_lines: 7
    include_time_estimate: true
    include_transition: true
    scope_source: auto  # auto | components | files

  validation:
    strict_mode: true
    fuzzy_matching: true
    cache_transitions: true
    max_time_seconds: 604800  # 1 week

  tracking:
    min_confidence: 0.6
    batch_mode: true
    batch_size: 10
    exclude_patterns: ["*.lock", "*.min.js"]

  jira:
    fields_to_fetch: ["key", "summary", "status", "issuetype", "components"]
    auto_transition: true
    add_labels: false
```

## API Interface

### generate_commit(issue_key, options={})

Generate commit message from issue context.

**Parameters:**
- `issue_key` - Jira issue key (e.g., LF-27)
- `options.include_time` - Include time estimate
- `options.include_transition` - Include status transition
- `options.output_format` - "text" or "json"

**Returns:** Commit message string or JSON object

### validate_commit(message, options={})

Validate smart commit syntax.

**Parameters:**
- `message` - Commit message with smart commands
- `options.strict_mode` - Fail on warnings
- `options.cloud_id` - Atlassian cloud ID

**Returns:** Validation result object

### track_commits(commits, options={})

Map commits to issues and post summaries.

**Parameters:**
- `commits` - Array of commit SHAs or git log range
- `options.auto_map` - Use automatic mapping
- `options.post_comments` - Post to Jira
- `options.batch_mode` - Batch multiple commits

**Returns:** Tracking result with mapped issues

### execute_commit(message, options={})

Execute commit with smart command processing.

**Parameters:**
- `message` - Validated commit message
- `options.validate_first` - Pre-validate before commit
- `options.cloud_id` - Atlassian cloud ID

**Returns:** Execution result with Jira updates

## Workflow Examples

### Example 1: Generate and Commit

```bash
# Generate message
commit_msg=$(generate_commit "LF-27")

# Validate
validation=$(validate_commit "$commit_msg")

# Commit if valid
if [ "$validation.status" == "valid" ]; then
  git commit -m "$commit_msg"
  track_commits "HEAD"
fi
```

### Example 2: Validate Existing Commit

```bash
# Get last commit message
msg=$(git log -1 --pretty=%B)

# Validate smart commands
result=$(validate_commit "$msg")

# Show errors if invalid
if [ "$result.status" == "invalid" ]; then
  echo "$result.errors"
fi
```

### Example 3: Batch Track Commits

```bash
# Get commits from last week
commits=$(git log --since="1 week ago" --pretty=%H)

# Track all commits
track_commits "$commits" --batch-mode --post-comments
```

## Error Handling

| Error | Resolution |
|-------|-----------|
| Issue not found | Verify issue key format and access |
| Transition not available | List available transitions |
| Time format invalid | Show valid examples (2h 30m) |
| Time tracking disabled | Remove #time or enable in Jira |
| No staged changes | Stage changes before generating |
| Commit mapping failed | Use manual issue assignment |

**Graceful Degradation:**
- If Jira unavailable: use issue key only, queue for retry
- If transition validation fails: proceed with comment/time only
- If tracking fails: log locally, retry later

## Integration Points

- **Git hooks:** Pre-commit validation, post-commit tracking
- **CI/CD:** Automated commit workflows
- **IDE plugins:** Editor integration
- **Jira:** Smart commit execution
- **GitHub:** Commit permalinks in comments

## Performance Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| Generate | < 2s | Includes Jira API call |
| Validate | < 2s | Cached transitions |
| Track single | < 3s | Includes comment post |
| Track batch | < 10s | 10 commits |

**Optimization:**
- Minimal field fetching (only `["key", "summary", "status"]`)
- JQL for batch operations
- 5-minute transition cache
- Parallel API calls where possible

## Success Criteria

- ✅ Follows conventional commit format
- ✅ Type correctly mapped from issue
- ✅ Scope accurate and consistent
- ✅ Summary ≤50 chars, imperative mood
- ✅ Smart commands properly formatted
- ✅ Issue key valid and accessible
- ✅ Transitions validated before execution
- ✅ Time format correct and converted
- ✅ Commits tracked with >90% accuracy
- ✅ Jira updates successful

## Notes

- Uses Sonnet for balanced reasoning and performance
- Follows [Conventional Commits v1.0.0](https://www.conventionalcommits.org/)
- Supports Jira smart commit syntax
- Minimal API calls with optimized field fetching
- Single agent replaces: commit-message-generator, commit-tracker, smart-commit-validator
- Always verify generated messages before committing
- Can integrate into git hooks for automation
