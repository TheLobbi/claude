---
name: jira-orchestrator:install-hooks
intent: /jira:install-hooks
tags:
  - jira-orchestrator
  - command
  - install-hooks
inputs: []
risk: medium
cost: medium
description: /jira:install-hooks
---

# /jira:install-hooks

Manage git hooks for Jira smart commit integration. Auto-prepend issue keys, validate smart commits, process commands.

## Hook Overview

| Hook | Purpose | Runs |
|------|---------|------|
| prepare-commit-msg | Auto-prepend issue key from branch name | Before editor |
| commit-msg | Validate smart commit syntax | After save |
| post-commit | Process smart commands, sync Jira | After commit |

## Actions

### Install
```bash
/jira-orchestrator:install-hooks install
/jira-orchestrator:install-hooks install --hook-type prepare-commit-msg
/jira-orchestrator:install-hooks install --force true --sync-mode sync
```
**Process:** Locate repo → Check existing → Backup → Copy from jira-orchestrator/hooks/git/ → chmod +x → Configure env → Test → Report

**Options:** --hook-type (default: all), --force, --sync-mode (sync/async/manual, default: async), --debug, --notify

### Uninstall
```bash
/jira-orchestrator:install-hooks uninstall
/jira-orchestrator:install-hooks uninstall --hook-type post-commit --force true
```
**Process:** Locate hooks → Verify ownership → Backup → Remove → Restore previous if exist

### List
```bash
/jira-orchestrator:install-hooks list
/jira-orchestrator:install-hooks list --hook-type prepare-commit-msg
```
Shows installed hooks, status, location, size, config, sync queue, and recent commits.

### Test
```bash
/jira-orchestrator:install-hooks test
/jira-orchestrator:install-hooks test --hook-type commit-msg
```
**Cases:**
- prepare-commit-msg: Branch with key, without key, merge, duplicates
- commit-msg: Valid smart commit, invalid time/transition, missing key
- post-commit: Smart command detection, parsing, queue creation, sync trigger

### Status
```bash
/jira-orchestrator:install-hooks status
```
Reports: repo info, installed hooks, config, sync queue, recent commits, health checks.

### Configure
```bash
/jira-orchestrator:install-hooks configure --sync-mode sync
/jira-orchestrator:install-hooks configure --debug true --notify false
```
**Options:** --sync-mode (sync/async/manual), --debug (true/false), --notify (true/false)

**Sync Modes:**
- **sync**: Immediately sync to Jira (requires Claude CLI)
- **async**: Queue for later (`git jira-sync`)
- **manual**: Queue only, never auto-sync

## Smart Commit Syntax

### Branch Patterns
```
feature/LF-27-description  → Extracts LF-27
bugfix/PROJ-123-fix        → Extracts PROJ-123
hotfix/ABC-456             → Extracts ABC-456
```

### Valid Commands
```bash
git commit -m "LF-27: Fix bug #comment Text"          # Comment
git commit -m "LF-27: Add feature #time 2h 30m"       # Time log
git commit -m "LF-27: Complete #transition \"Done\""  # Transition
git commit -m "LF-27: Update #time 1h #comment Done #transition \"In Review\"" # Multiple
```

### Time Format
- Valid: 2h, 30m, 1d 4h, 2w 3d 4h 30m
- Units: w=weeks, d=days, h=hours, m=minutes

### Queue File (.git/jira-sync-queue.json)
```json
[{
  "issue_key": "LF-27",
  "commit_sha": "abc123",
  "commit_message": "LF-27: Add OAuth #time 2h",
  "commands": ["time:2h"],
  "status": "pending"
}]
```

## Workflows

### Standard Setup
```bash
/jira-orchestrator:install-hooks install
/jira-orchestrator:install-hooks status
/jira-orchestrator:install-hooks test
git checkout -b feature/LF-27-oauth
git commit -m "Add support #time 3h"
```

### Team Install
```bash
cat > .git/hooks/install-jira-hooks.sh << 'EOF'
#!/bin/bash
claude /jira-orchestrator:install-hooks install --force true
EOF
chmod +x .git/hooks/install-jira-hooks.sh
.git/hooks/install-jira-hooks.sh
```

### CI/CD Integration (Harness Pipeline)
```yaml
# Harness Pipeline Step
- step:
    type: ShellScript
    name: Process Jira Smart Commits
    identifier: process_jira_sync
    spec:
      shell: Bash
      source:
        type: Inline
        spec:
          script: claude /jira-orchestrator:sync --process-queue --ci-mode true
```

### Pre-Push Sync
```bash
# .git/hooks/pre-push
#!/bin/bash
if [ -f .git/jira-sync-queue.json ]; then
  claude /jira-orchestrator:sync --process-queue
fi
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Hook not running | `chmod +x .git/hooks/*` |
| Bad interpreter (Windows) | `dos2unix .git/hooks/*` or reinstall |
| jq not found | Install jq: macOS `brew install jq`, Linux `apt-get install jq` |
| Validation failing | Enable debug: `configure --debug true` |
| Sync not triggering | Check mode: `status`, verify queue: `cat .git/jira-sync-queue.json` |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `JIRA_SYNC_MODE` | sync/async/manual (default: async) |
| `JIRA_HOOK_DEBUG` | Enable debug logging |
| `JIRA_NOTIFY` | Show hook notifications |
| `CLAUDE_CLI` | Claude CLI path |

## Git Config

```bash
# .git/config
[jira]
  syncMode = async
  hookDebug = false
  notify = true
```

## Advanced: Custom Hooks

```bash
# .git/hooks/post-commit.local
#!/bin/bash
# Custom post-commit actions
echo "Running custom logic..."
```

Reference in main hook:
```bash
if [ -x .git/hooks/post-commit.local ]; then
  .git/hooks/post-commit.local
fi
```

## Related Commands

- `/jira-orchestrator:sync` - Process queue
- `/jira-orchestrator:work` - Full dev workflow
- `/jira-orchestrator:commit` - Create smart commit
- `/jira-orchestrator:branch` - Create branch

---
Generated with Golden Armada ✨
