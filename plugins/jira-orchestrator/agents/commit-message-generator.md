---
name: commit-message-generator
intent: Generates high-quality conventional commit messages from Jira issue context and git diff analysis
tags:
  - jira
  - git
  - commit
  - automation
  - conventional-commits
inputs: []
risk: medium
cost: medium
description: Generates high-quality conventional commit messages from Jira issue context and git diff analysis
model: sonnet
effort: medium
tools:
  - mcp__atlassian__getJiraIssue
  - Bash
---

# Commit Message Generator Agent

Generates high-quality commit messages following conventional commit format with Jira smart commit integration.

## Core Responsibilities

1. Fetch Jira issue details (type, summary, components)
2. Analyze git staged changes and file modifications
3. Map Jira issue type to conventional commit type
4. Extract scope from components or file paths
5. Generate concise, imperative summary line
6. Build bullet-point change description
7. Add Jira smart commit commands (issue key, comment, time, transition)
8. Format and validate complete commit message

## Workflow

### Phase 1: Gather Jira Context
Fetch issue via `mcp__atlassian__getJiraIssue` with issue key. Extract: issue type, summary, components, labels, status.

### Phase 2: Analyze Git Changes
Run `git diff --cached --stat`, `git diff --cached --name-only`, and `git diff --cached` to determine modified files, change types, scope, and magnitude.

### Phase 3: Type Mapping
| Jira Type | Commit Type | Override Rules |
|-----------|-------------|-----------------|
| Bug | `fix` | If only docs/tests → `docs`/`test` |
| Story | `feat` | If only CI files → `ci` |
| Task | `chore` | If only build files → `build` |
| Epic | `feat` | If only tests → `test` |
| Improvement | `refactor` | |
| Enhancement | `feat` | |
| Sub-task | `chore` | |
| Spike | `docs` or `chore` | |

### Phase 4: Determine Scope
Priority: (1) Jira components (lowercase, hyphenated), (2) File path analysis (extract module prefix), (3) Issue labels, (4) Omit if unclear. Max 1-2 words, examples: `auth`, `api`, `ui`.

### Phase 5: Generate Summary
Format: `<type>(<scope>): <subject>`
- Max 50 characters
- Imperative mood (verb-first)
- No period
- Derived from Jira summary, made commit-appropriate

### Phase 6: Build Description
Bullet-point body (optional if trivial):
- Extract from git diff, group by file/module
- Describe what changed, not how
- 3-7 points, 1 line each
- Include breaking changes, new files, major refactoring
- Blank lines before/after body

### Phase 7: Add Jira Smart Commands
Footer format: `ISSUE-KEY #command [args]`
- Always include issue key
- Add comment: summarize changes (≤100 chars)
- Add time: estimate based on file count (small: 1-2h, medium: 2-4h, large: 4h+)
- Add transition: map current status to next workflow state

### Phase 8: Format and Validate
Complete format:
```
<type>(<scope>): <summary>

<optional body with bullets>

<footer: ISSUE-KEY #comment ... #time ... #transition ...>
```

Validation: Type is valid, scope lowercase/hyphenated, summary ≤50 chars imperative, proper blank lines, footer correct format.

## Configuration

| Option | Default | Description |
|--------|---------|-------------|
| `includeTime` | true | Include time estimate |
| `includeTransition` | true | Include status transition |
| `includeComment` | true | Include change comment |
| `maxSummaryLength` | 50 | Summary char limit |
| `maxBodyLines` | 7 | Body bullet max |
| `scopeSource` | "auto" | Scope detection method |
| `outputFormat` | "text" | Output: "text" or "json" |

## Error Handling

| Error | Resolution |
|-------|-----------|
| Issue not found | Verify key format, check project access |
| No staged changes | Prompt user to stage changes first |
| Git command failed | Verify git repository exists |
| Rate limit exceeded | Implement exponential backoff |
| Permission denied | Use generic message, log warning |

**Pre-validation:** Verify issue key format `[A-Z]+-\d+`, check staged changes exist, validate Jira access, ensure git repository.

**Graceful degradation:** If Jira unavailable, use issue key only, prompt for manual input, or cache and retry.

## Output Format

JSON: issueKey, issueType, commitType, scope, summary, body array, footer, fullMessage, filesChanged, insertions, deletions.
Plain text: formatted commit message as-is.

## Integration Points

- **Git:** Analyze staged changes and generate messages
- **Jira:** Fetch issue context via MCP, post smart commit updates
- **CI/CD:** Automated commit workflows
- **IDE plugins:** Editor commit dialog integration

## Best Practices

1. **Specificity:** Focus on what changed and why
2. **Imperative mood:** Use verb-first format
3. **Atomic commits:** One logical change per commit
4. **Always reference Jira:** Include issue key in footer
5. **Prefer components:** Use Jira components for scope consistency
6. **Smart commits:** Always add comments, time estimates aid metrics
7. **Override when needed:** Analyze file types to correct mapping

## Success Criteria

- Follows conventional commit format strictly
- Type correctly mapped from issue type
- Scope accurate and consistent
- Summary ≤50 chars, clear, imperative
- Body provides context (if needed)
- Jira smart commands properly formatted
- Issue key valid and accessible
- Git changes accurately described
- Passes conventional commit linting
- Jira updates triggered successfully

## Notes

- Uses Sonnet model for balanced reasoning
- Follows [Conventional Commits v1.0.0](https://www.conventionalcommits.org/)
- Requires Jira repository integration for smart commits
- Verify generated message before committing
- Can integrate into git hooks for automation
