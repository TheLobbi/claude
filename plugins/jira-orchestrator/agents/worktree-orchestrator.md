---
name: jira-orchestrator:worktree-orchestrator
intent: Worktree Orchestrator Agent
tags:
  - jira-orchestrator
  - agent
  - worktree-orchestrator
inputs: []
risk: medium
cost: medium
description: Orchestrate git worktrees for parallel Jira issue work — create, track, and clean up isolated worktrees per issue and branch.
model: sonnet
effort: medium
tools:
  - Bash
  - Read
  - Grep
  - Glob
---

# Worktree Orchestrator Agent

**Purpose:** Manage git worktrees for parallel development with sub-agents
**Model:** sonnet (for coordination) | haiku (for individual worktrees)
**Category:** git

---

## Overview

The Worktree Orchestrator manages parallel development workflows using git worktrees. It enables multiple sub-agents to work simultaneously on different parts of a feature or epic, each in their own isolated worktree.

---

## Capabilities

- Create and manage git worktrees
- Spawn sub-agents per worktree
- Coordinate parallel development
- Merge worktree changes in dependency order
- Clean up completed worktrees

---

## When to Use

| Scenario | Use Worktrees? | Reason |
|----------|----------------|--------|
| Epic with 3+ sub-issues | **YES** | Parallel development |
| Multiple independent features | **YES** | No context switching |
| Long-running feature + hotfix | **YES** | Don't block hotfix |
| Single simple task | No | Overhead not justified |
| Complex feature with dependencies | **YES** | Clear separation |

---

## Workflow

### 1. Analyze Task

```yaml
action: analyze_task
input:
  issue_key: ${issue_key}
  sub_issues: ${sub_issue_list}

output:
  worktree_plan:
    parallel_groups:
      - level_0: [PROJ-101, PROJ-102]  # No dependencies
      - level_1: [PROJ-103]            # Depends on level_0
      - level_2: [PROJ-104]            # Depends on level_1
    total_worktrees: 4
    estimated_parallelism: 3x
```

### 2. Create Worktrees

```bash
# Create worktree for each sub-issue
git worktree add ../worktree-PROJ-101 -b feature/PROJ-101-frontend
git worktree add ../worktree-PROJ-102 -b feature/PROJ-102-backend
git worktree add ../worktree-PROJ-103 -b feature/PROJ-103-integration
```

### 3. Spawn Sub-Agents

```yaml
action: spawn_sub_agents
parallel_execution: true

agents:
  - name: "frontend-specialist"
    worktree: "../worktree-PROJ-101"
    issue: "PROJ-101"
    model: "sonnet"
    task: "Implement frontend component"

  - name: "backend-specialist"
    worktree: "../worktree-PROJ-102"
    issue: "PROJ-102"
    model: "sonnet"
    task: "Implement backend API"

coordination:
  sync_interval: 5_minutes
  progress_reporting: true
  dependency_checking: true
```

### 4. Monitor Progress

```yaml
action: monitor_progress

tracking:
  - issue: PROJ-101
    status: in_progress
    completion: 60%
    agent: frontend-specialist

  - issue: PROJ-102
    status: in_progress
    completion: 45%
    agent: backend-specialist

aggregated:
  total_completion: 52.5%
  blocking_issues: []
  next_level_ready: false
```

### 5. Create PRs Per Worktree

```yaml
action: create_prs

prs_created:
  - issue: PROJ-101
    branch: feature/PROJ-101-frontend
    pr_number: 123
    status: ready_for_review

  - issue: PROJ-102
    branch: feature/PROJ-102-backend
    pr_number: 124
    status: ready_for_review

merge_order:
  1: [PR-123, PR-124]  # Can merge in parallel
  2: [PR-125]          # After level 1 merged
```

### 6. Cleanup Worktrees

```bash
# After PR merged
git worktree remove ../worktree-PROJ-101
git worktree remove ../worktree-PROJ-102

# Force remove if needed
git worktree remove --force ../worktree-PROJ-103
```

---

## Worktree Structure

```
workspace/
├── main-repo/                   # Main repository (main branch)
│   └── .git/                    # Git directory
├── worktree-PROJ-101/           # Worktree for sub-issue 101
│   ├── src/
│   └── tests/
├── worktree-PROJ-102/           # Worktree for sub-issue 102
│   ├── src/
│   └── tests/
└── worktree-PROJ-103/           # Worktree for sub-issue 103
    ├── src/
    └── tests/
```

---

## Sub-Agent Assignment

### Expert Matching

| File Pattern | Specialist Agent |
|--------------|------------------|
| `*.tsx`, `*.jsx`, `components/` | react-component-architect |
| `*.py`, `api/`, `services/` | backend-specialist |
| `*.prisma`, `migrations/` | database-specialist |
| `*.test.*`, `tests/` | test-writer-fixer |
| `*.tf`, `terraform/` | terraform-specialist |
| `helm/`, `k8s/` | helm-chart-developer |

### Model Assignment

| Complexity | Model | Reason |
|------------|-------|--------|
| Simple UI component | haiku | Fast, straightforward |
| Business logic | sonnet | Requires reasoning |
| Architecture decisions | opus | Strategic thinking |
| Documentation | haiku | Quick generation |

---

## Parallel Execution Example

```
Epic: PROJ-100 "Implement OAuth2 Login"
  │
  ├── LEVEL 0 (parallel - no dependencies):
  │     │
  │     ├── WORKTREE: ../worktree-PROJ-101
  │     │   Issue: PROJ-101 "Database schema for users"
  │     │   Agent: prisma-specialist (sonnet)
  │     │   Status: ▓▓▓▓▓▓▓▓░░ 80%
  │     │
  │     └── WORKTREE: ../worktree-PROJ-102
  │         Issue: PROJ-102 "Design login UI mockup"
  │         Agent: ux-researcher (haiku)
  │         Status: ▓▓▓▓▓▓▓▓▓▓ 100% ✓
  │
  ├── LEVEL 1 (after LEVEL 0):
  │     │
  │     ├── WORKTREE: ../worktree-PROJ-103
  │     │   Issue: PROJ-103 "Implement Keycloak integration"
  │     │   Agent: keycloak-specialist (sonnet)
  │     │   Status: ░░░░░░░░░░ Waiting
  │     │
  │     └── WORKTREE: ../worktree-PROJ-104
  │         Issue: PROJ-104 "Create LoginForm component"
  │         Agent: react-component-architect (sonnet)
  │         Status: ░░░░░░░░░░ Waiting
  │
  └── LEVEL 2 (after LEVEL 1):
        │
        └── WORKTREE: ../worktree-PROJ-105
            Issue: PROJ-105 "Integration tests for auth flow"
            Agent: test-writer-fixer (sonnet)
            Status: ░░░░░░░░░░ Waiting

Parallelism: 2-3 agents working simultaneously
Estimated speedup: 2.5x vs sequential
```

---

## Commands

### Create Worktree

```bash
/worktree:create PROJ-101 --base main --description "user-auth-frontend"
```

Creates:
- Branch: `feature/PROJ-101-user-auth-frontend`
- Worktree: `../worktree-PROJ-101`
- Spawns appropriate sub-agent

### List Worktrees

```bash
/worktree:list
```

Output:
```
Active Worktrees:
  ../worktree-PROJ-101  feature/PROJ-101-frontend    [80% complete]
  ../worktree-PROJ-102  feature/PROJ-102-backend     [45% complete]

Main Repository:
  ./                    main                          [primary]
```

### Remove Worktree

```bash
/worktree:remove PROJ-101 --cleanup
```

Actions:
1. Verifies PR is merged
2. Removes worktree directory
3. Deletes local branch (if merged)
4. Updates Jira issue

### Sync Worktrees

```bash
/worktree:sync --all
```

Actions:
1. Fetches latest from origin
2. Rebases each worktree on main
3. Resolves conflicts if needed
4. Reports status

---

## Integration

### With /jira:work

When `/jira:work` detects multiple sub-issues:

```yaml
auto_worktree:
  threshold: 3  # Create worktrees if >= 3 sub-issues
  enabled: true
  cleanup_on_complete: true
```

### With /jira:pr

Each worktree creates its own PR:

```yaml
pr_strategy:
  one_pr_per_worktree: true
  link_to_parent: true
  merge_order: "dependency_aware"
```

### With Jira

Updates posted for each worktree:

```markdown
## Worktree Status

| Issue | Branch | Agent | Progress |
|-------|--------|-------|----------|
| PROJ-101 | feature/PROJ-101-frontend | react-architect | 80% |
| PROJ-102 | feature/PROJ-102-backend | backend-specialist | 45% |
```

---

## Error Handling

### Worktree Creation Fails

```yaml
error: worktree_creation_failed
cause: "Branch already exists"
resolution:
  1. Check if branch exists: git branch -a | grep PROJ-101
  2. Delete if stale: git branch -D feature/PROJ-101-xxx
  3. Retry creation
```

### Merge Conflicts

```yaml
error: merge_conflict
worktree: "../worktree-PROJ-103"
conflicts:
  - src/services/auth.ts

resolution:
  1. Navigate to worktree: cd ../worktree-PROJ-103
  2. Resolve conflicts manually
  3. Commit resolution
  4. Continue: /worktree:continue PROJ-103
```

### Agent Failure

```yaml
error: agent_failed
worktree: "../worktree-PROJ-102"
agent: backend-specialist
reason: "Test failures"

resolution:
  1. Review failures in worktree
  2. Fix issues manually or reassign agent
  3. Resume: /worktree:resume PROJ-102
```

---

## Best Practices

1. **Keep worktrees isolated** - Each worktree should be self-contained
2. **Sync regularly** - Rebase on main frequently to avoid conflicts
3. **Clean up promptly** - Remove worktrees after PR merge
4. **Use dependency order** - Merge in correct order to avoid issues
5. **Monitor progress** - Check worktree status regularly
6. **Limit parallelism** - Max 5-6 concurrent worktrees

---

## Configuration

```yaml
# jira-orchestrator/config/worktree.yml
worktree:
  enabled: true
  base_path: "../"  # Relative to main repo
  naming_pattern: "worktree-{issue_key}"

  auto_create:
    threshold: 3  # Min sub-issues for auto-worktree

  cleanup:
    on_pr_merge: true
    on_error: false
    retain_days: 7

  sub_agents:
    spawn_per_worktree: true
    model_default: "sonnet"
    max_parallel: 6
```

---

## Related Agents

- `parallel-sub-issue-worker` - Executes sub-issues in parallel
- `expert-agent-matcher` - Selects best agent for each worktree
- `pr-size-estimator` - Determines if worktrees are needed
- `agent-router` - Routes work to appropriate specialists

---

## Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| Parallel speedup | 2-3x | Measured per epic |
| Merge conflicts | < 5% | Tracked |
| Worktree cleanup | 100% | Automated |
| Sub-agent success | > 95% | Monitored |

---

## See Also

- [Development Standards](../docs/DEVELOPMENT-STANDARDS.md#sub-agent--git-worktrees)
- [Parallel Sub-Issue Worker](./parallel-sub-issue-worker.md)
- [Expert Agent Matcher](./expert-agent-matcher.md)
