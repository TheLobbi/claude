---
name: cowork-sessions
description: Knowledge for launching, managing, and monitoring cowork sessions that orchestrate multiple plugin agents in parallel
allowed-tools:
  - Read
  - Bash
  - Task
  - Glob
  - Grep
triggers:
  - launch cowork session
  - start session
  - run cowork
  - parallel agents
  - session management
  - cowork orchestration
---

# Cowork Sessions Knowledge

Domain knowledge for launching and managing cowork sessions that coordinate multiple plugin agents.

## Use For
- Starting new cowork sessions from marketplace items
- Managing running sessions (pause, resume, cancel)
- Understanding session lifecycle and agent coordination
- Monitoring session progress and resource usage

## Session Lifecycle

```
1. INITIALIZING
   - Validate item is installed
   - Check plugin dependencies
   - Parse task description

2. PLANNING
   - Break task into subtasks
   - Match subtasks to available agents
   - Determine execution order and parallelism

3. RUNNING
   - Dispatch agents with their subtasks
   - Monitor progress (polling every 3-5 seconds)
   - Collect intermediate outputs

4. COMPLETING
   - Merge outputs from all agents
   - Generate session summary
   - Record metrics (tokens, cost, duration)

5. COMPLETED / FAILED
   - Present final outputs
   - Archive session for history
```

## Agent Coordination Model

Sessions use the Agent tool to spawn sub-agents. Key patterns:

### Sequential Execution
For dependent tasks (e.g., "generate code then write tests"):
```
Agent 1 completes → output feeds Agent 2 → Agent 2 completes
```

### Parallel Execution
For independent tasks (e.g., "review security AND check performance"):
```
Agent 1 ─────────────→ output ─┐
Agent 2 ─────────────→ output ─┤─→ merge
Agent 3 ─────────────→ output ─┘
```

### Fan-out/Fan-in
Common pattern for comprehensive analysis:
```
Coordinator decomposes task
    ├──→ Specialist Agent A
    ├──→ Specialist Agent B
    └──→ Specialist Agent C
         ↓
    Coordinator merges results
```

## Session Configuration

Each marketplace item defines defaults:
- `maxParallelAgents` - How many agents run simultaneously (1-10)
- `estimatedDuration` - Expected session length
- `avgSessionMinutes` - Historical average
- `completionRate` - Success rate (0.0-1.0)

## Resource Tracking

Sessions track:
- **Tokens used** - Total input + output tokens across all agents
- **Estimated cost** - Based on model pricing (opus/sonnet/haiku)
- **Duration** - Wall-clock time from start to completion
- **Agent count** - How many agents were activated

## Error Handling

If an agent fails during a session:
1. The error is captured but other agents continue
2. Failed subtasks are marked in the session output
3. The session completes with partial results
4. User is informed of which subtasks succeeded/failed

## Session Controls

| Action | When to Use |
|--------|------------|
| Pause | Long-running session, need to step away |
| Resume | Continue a paused session from where it stopped |
| Cancel | Task is no longer needed, stop all agents |
