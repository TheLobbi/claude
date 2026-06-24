---
name: cc-worktree-management
description: Git worktree creation, agent isolation, parallel task execution with EnterWorktree/ExitWorktree, branch-per-worktree patterns, and cleanup lifecycle for Claude Code
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
triggers:
  - worktree
  - git worktree
  - parallel tasks
  - agent isolation
  - EnterWorktree
  - ExitWorktree
  - branch isolation
  - concurrent agents
---

# Worktree Management

Git worktrees let each agent or task operate on its own branch without interfering with the main working directory. Claude Code exposes this through `EnterWorktree` / `ExitWorktree` tools.

## Why worktrees

A worktree is a second (or third, or tenth) checked-out copy of the same repository, each on its own branch. Agents working in separate worktrees:

- Cannot corrupt each other's in-progress changes
- Do not share unstaged edits or index state
- Can be abandoned cleanly if the task fails
- Leave `main` (or your feature branch) undisturbed

This project itself runs in a worktree at `.claude/worktrees/<branch-name>`.

## Core commands

```bash
# Create a worktree for a task branch
git worktree add .claude/worktrees/<name> -b <branch>

# List all active worktrees
git worktree list

# Remove a worktree (branch must be merged or explicitly deleted)
git worktree remove .claude/worktrees/<name>
git worktree prune   # remove stale entries
```

## Claude Code tools

### EnterWorktree

Switches the agent's working context into an isolated worktree. Subsequent tool calls (Read, Write, Bash, etc.) run inside that worktree's directory.

```json
{
  "tool": "EnterWorktree",
  "params": {
    "branch": "feat/my-task",
    "worktreePath": ".claude/worktrees/feat-my-task"
  }
}
```

If the branch does not exist, `EnterWorktree` creates it from the current HEAD. If the worktree directory already exists, the agent re-enters it.

### ExitWorktree

Returns the agent to the main working directory. Always pair with `EnterWorktree` in the same task — leaving a worktree open wastes disk and can block `git worktree remove`.

```json
{
  "tool": "ExitWorktree"
}
```

### Isolation: automatic vs manual

The `Agent` tool's `isolation: "worktree"` parameter handles this automatically:

```json
{
  "tool": "Agent",
  "params": {
    "isolation": "worktree",
    "prompt": "Implement the auth middleware changes on a clean branch."
  }
}
```

Claude Code creates the worktree, runs the sub-agent inside it, then either:
- Cleans it up if the agent made no changes
- Returns the worktree path and branch name so you can review and merge

## Branch-per-worktree pattern

Each parallel task gets its own branch:

```
main
├── .claude/worktrees/feat-auth-refactor    ← branch: feat/auth-refactor
├── .claude/worktrees/fix-token-expiry      ← branch: fix/token-expiry
└── .claude/worktrees/docs-update-api       ← branch: docs/update-api
```

Name the worktree directory after the branch slug. This makes `git worktree list` readable and `git worktree remove` unambiguous.

## Parallel agent coordination

Fan-out multiple agents across independent tasks:

```
Orchestrator (main worktree)
  │
  ├── Agent A → worktree/feat-part-1   (writes auth.ts)
  ├── Agent B → worktree/feat-part-2   (writes middleware.ts)
  └── Agent C → worktree/docs-update   (writes README.md)
  │
  └── Orchestrator merges or PRs each branch after completion
```

Send all three in a single `Agent` tool call (parallel launch). The orchestrator collects results and decides merge order.

## Lifecycle protocol

1. **Create** — `EnterWorktree` or `Agent isolation: worktree` creates the worktree
2. **Work** — all edits are scoped to the worktree's branch
3. **Commit** — commit inside the worktree; the commit belongs to its branch, not main
4. **Exit** — `ExitWorktree` or natural agent completion
5. **Merge or PR** — from main, `git merge` or open a PR for the branch
6. **Remove** — `git worktree remove` + `git branch -d` after merge

Never leave worktrees open indefinitely. Stale worktrees accumulate disk usage and cause `git worktree prune` noise.

## Safe removal checklist

Before `git worktree remove <path>`:

- [ ] Branch has been merged (or explicitly abandoned)
- [ ] No unstaged changes in the worktree (`git -C <path> status`)
- [ ] No open processes with the worktree as cwd
- [ ] Agent that created it has exited or been stopped

```bash
# Check worktree status before removal
git -C .claude/worktrees/<name> status
git worktree remove .claude/worktrees/<name>
git branch -d <branch>        # safe: refuses if unmerged
git branch -D <branch>        # force: use only if abandoning
```

## Conflict avoidance

Worktrees share the same `.git` directory. Two agents cannot check out the **same** branch in different worktrees — git will refuse with `fatal: '<branch>' is already checked out`.

Rules:
- Every worktree must have a **unique branch**
- Agents should never write to files that another concurrent agent's worktree branch will also modify (merge conflicts on PR)
- Task decomposition should minimize file overlap between parallel branches

## When to use worktrees vs subagents in main context

| Situation | Use worktree | Use main context |
|-----------|:---:|:---:|
| Long-running tasks (>10 min) | ✓ | |
| Tasks touching many files | ✓ | |
| Parallel independent tasks | ✓ | |
| Quick single-file fix | | ✓ |
| Research-only (read-only) | | ✓ |
| Task must share context with parent | | ✓ |

## Session forking (programmatic SDK)

When using the **Claude Agent SDK** (Python/TypeScript) rather than the CLI, the equivalent of a worktree is a **forked session**. Sessions are stored at:

```
~/.claude/projects/<url-encoded-cwd>/<session-id>.jsonl
```

Fork a session to branch history without touching the original:

```python
# Python
result = await query(prompt="implement auth changes", options={"forkSession": True})
# → new session branched from current history; original session untouched
```

```typescript
// TypeScript
const result = await query({ prompt: "implement auth changes", options: { forkSession: true } });
```

**Worktree vs forked session:**

| | Git worktree | Forked session |
|---|---|---|
| Isolates | File system state (branch) | Conversation history |
| Parallel? | Yes — each has own branch | Yes — each has own session ID |
| Resumable? | Via `EnterWorktree` | Via `resume: sessionId` |
| Cleanup | `git worktree remove` | Sessions expire or are deleted |
| Use in | Claude Code CLI | Agent SDK programmatic use |

For CLI-based orchestration (this plugin's default), use worktrees. Use `forkSession` when building applications on top of the SDK.

To resume a specific session: `resume: "<session-id>"` in SDK options, or `--resume` in `/cc-orchestrate` (reads `.claude/active-task.md` for the last wave's session ID).

## Integration with cc-orchestrate

The `cc-orchestrate` command uses `isolation: "worktree"` for any template that fans out to multiple implementation agents. Each agent gets its own branch. The orchestrator collects the branch names and opens PRs or merges in sequence.

See `skills/cc-agent-teams/SKILL.md` for full multi-agent coordination patterns.
