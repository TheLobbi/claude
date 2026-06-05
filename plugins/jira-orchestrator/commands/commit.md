---
name: jira:commit
intent: Create git commit with Jira smart commit syntax for automatic issue updates
tags:
  - jira
  - git
  - smart-commit
  - automation
inputs: []
risk: medium
cost: medium
description: Create git commit with Jira smart commit syntax for automatic issue updates
examples:
  - command: /jira:commit "Fixed auth bug" --time 2h
  - command: /jira:commit auto --issue PROJ-123 --transition "In Review"
  - command: /jira:commit "Add OAuth2" --comment "Implemented" --time 3h --transition "In Review"
---

# Jira Smart Commit Command

Automatically create git commits with Jira smart commit syntax for instant issue updates (comments, time tracking, transitions).

## Prerequisites

- Git repository initialized with staged changes
- Atlassian Cloud access configured
- Jira project access with edit permissions

## Core Workflow

**Detect Issue → Validate → Generate Message → Commit → Sync to Jira**

## Quick Start

```bash
# Basic commit with time
/jira:commit "Fixed auth bug" --time 2h

# Auto-generate from issue context
/jira:commit auto --issue PROJ-123 --transition "In Review"

# Full commit with all options
/jira:commit "Feature complete" --comment "Tested" --time 3h --transition "Done"

# Preview (no commit)
/jira:commit "My message" --validate
```

## Smart Commit Syntax

**Format:** `ISSUE-KEY #command value #command value`

**Commands:**
| Command | Format | Example |
|---------|--------|---------|
| comment | `#comment <text>` | `#comment Fixed bug` |
| time | `#time <duration>` | `#time 2h 30m` |
| transition | `#transition "<status>"` | `#transition "In Review"` |

**Time Formats:** `30m`, `2h`, `1d`, `1w`, `2h 30m`, `1d 4h 30m`

**Full Example:**
```
PROJ-123 #comment Implemented OAuth2 #time 3h 15m #transition "In Review"
```

## Validation Options

| Flag | Purpose |
|------|---------|
| `--validate-transitions` | Pre-validate workflow transition |
| `--check-worklog` | Verify time tracking enabled |
| `--strict` | Fail on validation warnings |

## Issue Key Detection

Detected automatically (in order):
1. `--issue PROJ-123` argument
2. Current branch name (`feature/PROJ-123-desc`)
3. Environment variable `JIRA_ISSUE_KEY`

## Output

Success shows:
- Commit SHA and branch
- Files changed count
- Jira issue link
- Comment added (if specified)
- Time logged (if specified)
- Issue transitioned (if specified)

## Troubleshooting

**Issue key not found:** Provide explicitly with `--issue PROJ-123`

**Invalid time format:** Use `2h`, `30m`, `1d` (not `2 hours`)

**Transition failed:** Check available transitions with `--validate-transitions`

**No staged changes:** Stage changes first with `git add .`

## Related Commands

- `/jira-orchestrator:pr` - Create pull request
- `/jira:sync` - Manually sync commit to Jira
- `/jira:bulk-commit` - Process multiple commits in batch

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
