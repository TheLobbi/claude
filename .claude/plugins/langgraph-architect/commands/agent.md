---
name: lg:agent
description: Create, modify, and manage agents in LangGraph projects including adding new agents to multi-agent systems
version: 1.0.0
category: langgraph
author: Claude Code
arguments:
  - name: action
    description: Action to perform
    required: true
    type: choice
    choices: [add, remove, modify, list, info]
  - name: name
    description: Agent name (required for add, remove, modify, info)
    required: false
    type: string
flags:
  - name: project
    description: Project directory path
    type: string
    default: "."
  - name: type
    description: Agent type (for add action)
    type: choice
    choices: [react, tool-calling, conversational, supervisor, worker, researcher, coder, reviewer]
    default: react
  - name: llm
    description: LLM model to use
    type: string
    default: "claude-sonnet-5"
  - name: tools
    description: Comma-separated list of tools
    type: string
    default: ""
  - name: system-prompt
    description: System prompt for the agent
    type: string
    default: ""
  - name: parent
    description: Parent agent (for hierarchical systems)
    type: string
    default: ""
  - name: max-iterations
    description: Maximum iterations for agent loop
    type: number
    default: 10
  - name: streaming
    description: Enable streaming
    type: boolean
    default: true
  - name: memory
    description: Enable agent-specific memory
    type: boolean
    default: true
presets:
  - name: researcher
    description: Research agent with search tools
    flags:
      type: researcher
      tools: "search,scrape,summarize"
      system-prompt: "You are a research assistant. Find accurate information and cite sources."
  - name: coder
    description: Coding agent with development tools
    flags:
      type: coder
      tools: "read_file,write_file,execute_code"
      system-prompt: "You are a coding assistant. Write clean, tested code."
  - name: reviewer
    description: Code/content reviewer
    flags:
      type: reviewer
      tools: "read_file,lint,test"
      system-prompt: "You are a reviewer. Provide constructive feedback."
  - name: supervisor
    description: Supervisor agent for orchestration
    flags:
      type: supervisor
      system-prompt: "You coordinate other agents. Delegate tasks efficiently."
---

# lg:agent - Agent Management

Manage agents in LangGraph projects including creating, modifying, and organizing multi-agent systems.

## Workflow Steps

### Add Agent

1. **Validate Input**
   - Check project structure exists
   - Verify agent name is unique
   - Validate agent type

2. **Generate Agent Code**
   - Create agent class/function
   - Setup LLM configuration
   - Add tool bindings
   - Configure system prompt

3. **Update Graph**
   - Add agent node to graph
   - Setup routing logic
   - Add conditional edges (if needed)
   - Update state schema (if needed)

4. **Generate Tests**
   - Create agent test file
   - Add unit tests
   - Add integration tests

5. **Update Documentation**
   - Add agent to README
   - Document agent capabilities
   - Update architecture diagram

### Remove Agent

1. **Analyze Dependencies**
   - Find all references to agent
   - Check for dependent edges
   - Identify impacted routes

2. **Remove Components**
   - Remove agent node from graph
   - Remove agent file
   - Clean up edges
   - Update routing logic

3. **Update Tests**
   - Remove agent tests
   - Update integration tests

4. **Update Documentation**
   - Remove from README
   - Update architecture diagram

### Modify Agent

1. **Load Current Configuration**
   - Read agent definition
   - Parse current settings

2. **Apply Changes**
   - Update specified parameters
   - Preserve unchanged settings
   - Validate new configuration

3. **Update Tests**
   - Adjust test cases
   - Add new test coverage

4. **Update Documentation**
   - Document changes
   - Update examples

## Agent Types

### ReAct Agent
Reasoning and Acting pattern with tool use.

```python
from langchain_anthropic import ChatAnthropic
from langgraph.prebuilt import create_react_agent

llm = ChatAnthropic(model="claude-sonnet-5")
agent = create_react_agent(
    llm,
    tools=tools,
    state_modifier="You are a helpful assistant."
)
```

### Tool-Calling Agent
Optimized for structured tool usage.

```python
from langchain_core.messages import SystemMessage

def tool_agent(state: State):
    llm = ChatAnthropic(model="claude-sonnet-5")
    llm_with_tools = llm.bind_tools(tools)

    messages = [
        SystemMessage(content="You are a tool-using agent.")
    ] + state["messages"]

    return {"messages": [llm_with_tools.invoke(messages)]}
```

### Conversational Agent
Simple conversation handler.

```python
def conversational_agent(state: State):
    llm = ChatAnthropic(model="claude-sonnet-5")
    response = llm.invoke(state["messages"])
    return {"messages": [response]}
```

### Supervisor Agent
Orchestrates other agents.

```python
from typing import Literal

def supervisor_agent(state: State) -> Literal["researcher", "coder", "END"]:
    llm = ChatAnthropic(model="claude-sonnet-5")

    system_prompt = """
    You are a supervisor managing these agents:
    - researcher: Finds information
    - coder: Writes code

    Decide which agent should act next, or if we're done (END).
    """

    response = llm.invoke([
        SystemMessage(content=system_prompt)
    ] + state["messages"])

    # Parse response to determine next agent
    return parse_next_agent(response)
```

### Worker Agent
Specialized task executor in multi-agent system.

```python
def worker_agent(state: State):
    llm = ChatAnthropic(model="claude-sonnet-5")
    llm_with_tools = llm.bind_tools(worker_tools)

    system_prompt = f"You are {state['current_agent']}. {state['task']}"

    response = llm_with_tools.invoke([
        SystemMessage(content=system_prompt)
    ] + state["messages"])

    return {"messages": [response]}
```

### Researcher Agent
Information gathering and analysis.

```python
from langchain_community.tools import DuckDuckGoSearchRun

search = DuckDuckGoSearchRun()

def researcher_agent(state: State):
    llm = ChatAnthropic(model="claude-sonnet-5")
    llm_with_tools = llm.bind_tools([search, scrape_tool, summarize_tool])

    system_prompt = """
    You are a research assistant. Your job is to:
    1. Search for relevant information
    2. Scrape and analyze sources
    3. Summarize findings with citations
    """

    response = llm_with_tools.invoke([
        SystemMessage(content=system_prompt)
    ] + state["messages"])

    return {"messages": [response]}
```

### Coder Agent
Code generation and modification.

```python
def coder_agent(state: State):
    llm = ChatAnthropic(model="claude-sonnet-5")
    llm_with_tools = llm.bind_tools([
        read_file_tool,
        write_file_tool,
        execute_code_tool,
        test_code_tool
    ])

    system_prompt = """
    You are a coding assistant. Write clean, tested code.
    Always:
    1. Read existing code first
    2. Write tests
    3. Execute and verify
    """

    response = llm_with_tools.invoke([
        SystemMessage(content=system_prompt)
    ] + state["messages"])

    return {"messages": [response]}
```

### Reviewer Agent
Quality assurance and feedback.

```python
def reviewer_agent(state: State):
    llm = ChatAnthropic(model="claude-sonnet-5")
    llm_with_tools = llm.bind_tools([
        read_file_tool,
        lint_tool,
        test_tool
    ])

    system_prompt = """
    You are a code reviewer. Provide constructive feedback on:
    1. Code quality and style
    2. Test coverage
    3. Documentation
    4. Potential bugs
    """

    response = llm_with_tools.invoke([
        SystemMessage(content=system_prompt)
    ] + state["messages"])

    return {"messages": [response]}
```

## Examples

### List All Agents
```bash
lg:agent list --project ./my-system
```

Output:
```
Agents in my-system:
  supervisor    (supervisor)  - Orchestrates workflow
  researcher    (researcher)  - Finds information
  coder         (coder)       - Writes code
  reviewer      (reviewer)    - Reviews output
```

### Add Research Agent
```bash
lg:agent add researcher \
  --project ./my-system \
  --type researcher \
  --tools "search,scrape,summarize" \
  --system-prompt "You are a research assistant. Find accurate information and cite sources."
```

### Add Worker Agent to Supervisor System
```bash
lg:agent add data-analyst \
  --project ./my-system \
  --type worker \
  --parent supervisor \
  --tools "query_database,analyze_data,create_chart" \
  --system-prompt "You analyze data and create visualizations."
```

### Use Preset
```bash
lg:agent add researcher --preset researcher --project ./my-system
lg:agent add coder --preset coder --project ./my-system
```

### Modify Agent
```bash
lg:agent modify researcher \
  --project ./my-system \
  --tools "search,scrape,summarize,verify" \
  --max-iterations 15
```

### Get Agent Info
```bash
lg:agent info researcher --project ./my-system
```

Output:
```
Agent: researcher
Type: researcher
LLM: claude-sonnet-5
Tools: search, scrape, summarize
Max Iterations: 10
Streaming: enabled
Memory: enabled
System Prompt: "You are a research assistant..."
```

### Remove Agent
```bash
lg:agent remove old-agent --project ./my-system
```

## Generated File Structure

### Single Agent Addition
```
src/
├── agents/
│   ├── __init__.py
│   ├── researcher.py      # New agent
│   └── ...
├── graph.py               # Updated with new node
└── routing.py             # Updated routing logic

tests/
├── agents/
│   ├── test_researcher.py # New tests
│   └── ...
```

### Agent File Template
```python
# src/agents/researcher.py
from typing import TypedDict
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage

class ResearcherState(TypedDict):
    """State for researcher agent."""
    messages: list
    findings: list
    sources: list

def researcher_agent(state: ResearcherState):
    """
    Research agent that finds and summarizes information.

    Tools:
    - search: DuckDuckGo search
    - scrape: Web scraping
    - summarize: Text summarization
    """
    llm = ChatAnthropic(model="claude-sonnet-5")
    llm_with_tools = llm.bind_tools([search, scrape, summarize])

    system_prompt = """
    You are a research assistant. Your job is to:
    1. Search for relevant information
    2. Scrape and analyze sources
    3. Summarize findings with citations

    Always verify information from multiple sources.
    """

    response = llm_with_tools.invoke([
        SystemMessage(content=system_prompt)
    ] + state["messages"])

    return {"messages": [response]}
```

## Multi-Agent Integration

### Adding to Supervisor System
```python
# graph.py - Updated automatically
from langgraph.graph import StateGraph, END
from .agents.supervisor import supervisor_agent
from .agents.researcher import researcher_agent
from .agents.coder import coder_agent

graph = StateGraph(State)

# Add nodes
graph.add_node("supervisor", supervisor_agent)
graph.add_node("researcher", researcher_agent)
graph.add_node("coder", coder_agent)

# Add edges
graph.add_edge(START, "supervisor")
graph.add_conditional_edges(
    "supervisor",
    lambda x: x["next"],
    {
        "researcher": "researcher",
        "coder": "coder",
        "END": END
    }
)
graph.add_edge("researcher", "supervisor")
graph.add_edge("coder", "supervisor")
```

### Adding to Swarm System
```python
# All agents can communicate with each other
graph = StateGraph(State)

agents = ["researcher", "coder", "reviewer"]
for agent in agents:
    graph.add_node(agent, agent_functions[agent])

# Each agent can route to any other
for agent in agents:
    graph.add_conditional_edges(
        agent,
        route_next_agent,
        {other: other for other in agents} | {"END": END}
    )
```

## Agent Configuration

### config.py Updates
```python
# Automatically updated when agent added
AGENTS = {
    "researcher": {
        "type": "researcher",
        "llm": "claude-sonnet-5",
        "tools": ["search", "scrape", "summarize"],
        "system_prompt": "You are a research assistant...",
        "max_iterations": 10,
        "streaming": True,
        "memory": True
    },
    # ... other agents
}
```

## Testing Generated

### Unit Test Template
```python
# tests/agents/test_researcher.py
import pytest
from src.agents.researcher import researcher_agent

def test_researcher_basic():
    """Test basic researcher functionality."""
    state = {
        "messages": [{"role": "user", "content": "Research LangGraph"}]
    }
    result = researcher_agent(state)
    assert "messages" in result
    assert len(result["messages"]) > 0

def test_researcher_with_tools():
    """Test researcher using tools."""
    # Test tool invocation
    pass

@pytest.mark.integration
def test_researcher_in_graph():
    """Test researcher integrated in graph."""
    # Test as part of full graph
    pass
```

## Error Handling

- **Duplicate agent name**: Agent with name already exists
- **Invalid project**: Not a LangGraph project
- **Invalid agent type**: Type not recognized
- **Missing dependencies**: Tools not available
- **Graph structure**: Cannot remove agent with active dependencies

## Notes

- Agent names must be valid Python identifiers
- Tools must be defined or imported
- System prompts can be loaded from files with `@file:prompts/researcher.txt`
- Agents can be disabled without removal using `lg:agent modify agent --disabled`
- Agent memory is separate from graph checkpointing

## Related Commands

- `lg:create` - Create new project with agents
- `lg:node add` - Add custom nodes
- `lg:edge add` - Connect agents
- `lg:test run` - Test agents
- `lg:memory setup` - Configure agent memory

## See Also

- Agent Architectures: https://langchain-ai.github.io/langgraph/concepts/agentic_concepts/
- Multi-Agent Systems: https://langchain-ai.github.io/langgraph/tutorials/multi_agent/
- Tool Use: https://python.langchain.com/docs/modules/agents/tools/
