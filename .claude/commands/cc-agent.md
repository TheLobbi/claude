# /cc-agent — Custom Agent Builder

Create and manage custom agents for Claude Code.

## Usage
```
/cc-agent [action] [name]
```

## Actions

### create
Create a new custom agent.
```
/cc-agent create                      # Interactive
/cc-agent create my-specialist        # Create named agent
```

### list
List all available agents.
```
/cc-agent list                        # Show all agents
/cc-agent list --built-in             # Show built-in sub-agent types
```

### info
Show details about an agent.
```
/cc-agent info agent-name
```

## Built-in Sub-Agent Types

| Type | Purpose |
|------|---------|
| general-purpose | Multi-step tasks |
| Explore | Fast codebase exploration |
| Plan | Architecture planning |
| claude-code-guide | Claude Code questions |
| researcher | Deep research |
| test-writer | Test generation |
| code-reviewer | Code quality review |
| debugger | Error diagnosis |
| doc-writer | Documentation |
| security-reviewer | Security audit |

## Custom Agent Template

```markdown
---
name: my-agent
description: What this agent does
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
model: claude-sonnet-5
---

# Agent Name

Expert description and instructions.

## Capabilities
- What this agent can do

## Workflow
1. Step one
2. Step two

## Guidelines
- Rule one
- Rule two
```

## Implementation

When invoked:

### For `create`:
1. Ask about the agent's domain expertise
2. Ask about required tools
3. Ask about model preference
4. Generate agent markdown file
5. Save to .claude/agents/ directory
6. Verify the agent loads correctly

### For `list`:
1. Scan .claude/agents/ for agent files
2. Scan plugins/*/agents/ for plugin agents
3. List all with name, description, tools
4. Show built-in types separately
