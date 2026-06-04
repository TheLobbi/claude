---
name: jira-orchestrator:reason
intent: Reasoning Command
tags:
  - jira-orchestrator
  - command
  - reason
inputs: []
risk: medium
cost: medium
description: Reasoning Command
---

# Reasoning Command

Invoke structured reasoning frameworks with mandatory documentation lookup.

## Usage

```bash
/jira:reason --framework=<framework> [--issue=<ISSUE-KEY>] [--problem="<description>"]
```

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `--framework` | Yes | Reasoning framework: `cot`, `tot`, `debug`, `rca` |
| `--issue` | No | Jira issue key for context |
| `--problem` | No | Problem description (required if no issue) |
| `--budget` | No | Thinking budget: `simple`, `moderate`, `complex`, `critical` |

## Frameworks

### Chain-of-Thought (cot)
**Best for**: Linear, sequential problems

```bash
/jira:reason --framework=cot --issue=PROJ-123
```

### Tree-of-Thought (tot)
**Best for**: Multiple valid approaches, decisions

```bash
/jira:reason --framework=tot --issue=PROJ-123 --problem="Choose authentication method"
```

### Hypothesis-Driven Debugging (debug)
**Best for**: Complex bugs, intermittent failures

```bash
/jira:reason --framework=debug --issue=PROJ-123
```

### Root Cause Analysis (rca)
**Best for**: Incidents, systemic issues, post-mortems

```bash
/jira:reason --framework=rca --issue=INC-456 --budget=critical
```

## Execution Protocol

### Step 1: Documentation Lookup (MANDATORY)

Before ANY reasoning begins, the system MUST:

1. **Identify Technologies**: Extract all technologies from the issue/problem
2. **Resolve Library IDs**: Use Context7 to get documentation IDs
3. **Query Documentation**: Get current documentation for each technology
4. **Cache Findings**: Store key findings in memory

```typescript
// MANDATORY: Always query documentation first
for (const tech of technologies) {
  const libraryId = await resolveLibraryId({
    libraryName: tech,
    query: problem
  });

  const docs = await queryDocs({
    libraryId,
    query: specificQuestion
  });
}
```

### Step 2: Select Reasoning Agent

Based on framework selection:

| Framework | Agent | Model | Thinking Budget |
|-----------|-------|-------|-----------------|
| `cot` | chain-of-thought-reasoner | sonnet | 5000 |
| `tot` | tree-of-thought-reasoner | sonnet | 8000 |
| `debug` | hypothesis-debugger | sonnet | 8000 |
| `rca` | root-cause-analyzer | opus | 10000 |

### Step 3: Execute Reasoning Chain

Use Sequential Thinking MCP for structured thought chains:

```typescript
await sequentialthinking({
  thought: "Based on ${tech} documentation: ...",
  thoughtNumber: 1,
  totalThoughts: estimatedSteps,
  nextThoughtNeeded: true
});
```

### Step 4: Store Insights

Save reasoning results to Memory MCP:

```typescript
await createEntities({
  entities: [{
    name: `reasoning-${issueKey}-${timestamp}`,
    entityType: "ReasoningChain",
    observations: [
      `Problem: ${summary}`,
      `Solution: ${solution}`,
      `Key Insight: ${insight}`,
      `Documentation: ${docRefs}`
    ]
  }]
});
```

## Examples

### Debug a React Component Issue

```bash
/jira:reason --framework=debug --issue=PROJ-456

# Automatically:
# 1. Queries Context7 for React documentation
# 2. Loads hypothesis-debugger agent
# 3. Generates ranked hypotheses
# 4. Tests systematically
# 5. Stores root cause in memory
```

### Architecture Decision

```bash
/jira:reason --framework=tot --problem="Should we use Redux or Context API for state management?"

# Automatically:
# 1. Queries Context7 for Redux AND Context API docs
# 2. Creates decision matrix
# 3. Scores alternatives
# 4. Stores decision record
```

### Production Incident Analysis

```bash
/jira:reason --framework=rca --issue=INC-789 --budget=critical

# Automatically:
# 1. Gathers all system documentation
# 2. Applies 5 Whys analysis
# 3. Creates fishbone diagram
# 4. Generates prevention plan
# 5. Stores RCA for future reference
```

## Quality Gates

All reasoning chains must pass:

| Gate | Requirement |
|------|-------------|
| Documentation | At least 1 Context7 lookup |
| Evidence | At least 2 evidence points |
| Confidence | Minimum 60% confidence |
| Memory Storage | Store decisions/RCAs |

## Output

The command produces:

1. **Jira Comment**: Summary of reasoning and conclusions
2. **Memory Entity**: Stored insights for organizational learning
3. **Template Output**: Completed reasoning template (if applicable)

## Configuration

See: `config/reasoning/reasoning-config.yaml`

## Related

- `/jira:triage` - Issue analysis
- `/jira:intelligence` - Pattern recognition
- `/jira:docs` - Documentation generation
