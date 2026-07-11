---
name: lg:node
description: Create, modify, and manage nodes in LangGraph graphs including LLM nodes, tool nodes, human-in-the-loop, subgraphs, and conditional nodes
version: 1.0.0
category: langgraph
author: Claude Code
arguments:
  - name: action
    description: Action to perform
    required: true
    type: choice
    choices: [add, remove, connect, disconnect, modify, list, info]
  - name: name
    description: Node name (required for most actions)
    required: false
    type: string
flags:
  - name: project
    description: Project directory path
    type: string
    default: "."
  - name: type
    description: Node type (for add action)
    type: choice
    choices: [llm, tool, tools, human, subgraph, conditional, passthrough, reducer, mapper, filter]
    default: llm
  - name: function
    description: Python function/callable for the node
    type: string
    default: ""
  - name: from
    description: Source node for connect action
    type: string
    default: ""
  - name: to
    description: Target node for connect action
    type: string
    default: ""
  - name: condition
    description: Condition function for conditional edges
    type: string
    default: ""
  - name: tools
    description: Tools for tool node (comma-separated)
    type: string
    default: ""
  - name: subgraph
    description: Subgraph to embed
    type: string
    default: ""
  - name: interrupt
    description: Add interrupt before/after node
    type: choice
    choices: [before, after, both, none]
    default: none
  - name: retry
    description: Enable automatic retry on failure
    type: boolean
    default: false
  - name: max-retries
    description: Maximum retry attempts
    type: number
    default: 3
presets:
  - name: tool-executor
    description: Prebuilt tool execution node
    flags:
      type: tools
      retry: true
  - name: human-review
    description: Human-in-the-loop review point
    flags:
      type: human
      interrupt: before
  - name: llm-chain
    description: LLM processing node with retry
    flags:
      type: llm
      retry: true
      max-retries: 3
---

# lg:node - Node Management

Manage nodes in LangGraph graphs including creation, connection, and modification of various node types.

## Workflow Steps

### Add Node

1. **Validate Input**
   - Check project structure
   - Verify node name is unique
   - Validate node type

2. **Generate Node Code**
   - Create node function/class
   - Setup node configuration
   - Add error handling
   - Configure retries (if enabled)

3. **Update Graph**
   - Add node to graph
   - Configure interrupts (if specified)
   - Update state schema (if needed)

4. **Generate Tests**
   - Create node test file
   - Add unit tests
   - Add integration tests

5. **Update Documentation**
   - Add node to README
   - Document node behavior
   - Update architecture diagram

### Connect Nodes

1. **Validate Connection**
   - Check source and target exist
   - Verify no circular dependencies (for non-conditional edges)
   - Validate edge type

2. **Add Edge**
   - Add regular edge or conditional edge
   - Update routing logic
   - Configure edge conditions

3. **Update Tests**
   - Add edge tests
   - Test routing logic

4. **Update Documentation**
   - Update graph visualization
   - Document flow

### Remove Node

1. **Analyze Dependencies**
   - Find all edges to/from node
   - Check for dependent nodes
   - Identify routing impacts

2. **Remove Components**
   - Remove edges
   - Remove node from graph
   - Remove node file
   - Clean up routing

3. **Update Tests**
   - Remove node tests
   - Update integration tests

4. **Update Documentation**
   - Remove from README
   - Update diagrams

## Node Types

### LLM Node
Language model processing node.

```python
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage

def llm_node(state: State):
    """LLM processing node."""
    llm = ChatAnthropic(model="claude-sonnet-5")

    system_prompt = "You are a helpful assistant."
    messages = [SystemMessage(content=system_prompt)] + state["messages"]

    response = llm.invoke(messages)
    return {"messages": [response]}
```

### Tool Node
Single tool execution.

```python
from langchain_core.tools import tool

@tool
def my_tool(query: str) -> str:
    """My custom tool."""
    return f"Result for {query}"

def tool_node(state: State):
    """Execute a specific tool."""
    result = my_tool.invoke(state["query"])
    return {"result": result}
```

### Tools Node (Prebuilt)
Execute multiple tools based on LLM output.

```python
from langgraph.prebuilt import ToolNode

# Automatically executes tools requested by LLM
tools_node = ToolNode(tools=[tool1, tool2, tool3])

# Add to graph
graph.add_node("tools", tools_node)
```

### Human-in-the-Loop Node
Interrupt for human input/review.

```python
def human_review_node(state: State):
    """Human review point."""
    # Node automatically interrupts before execution
    # Human can modify state and continue

    # Optional: Add validation logic
    if state.get("requires_review"):
        # State is saved, execution pauses
        return state

    return state
```

### Subgraph Node
Embed another graph as a node.

```python
from langgraph.graph import StateGraph

# Define subgraph
subgraph = StateGraph(SubState)
subgraph.add_node("step1", step1_node)
subgraph.add_node("step2", step2_node)
subgraph.add_edge("step1", "step2")
compiled_subgraph = subgraph.compile()

# Add as node
graph.add_node("subgraph", compiled_subgraph)
```

### Conditional Node
Routing logic node.

```python
from typing import Literal

def conditional_node(state: State) -> Literal["path_a", "path_b", "path_c"]:
    """Determine next path based on state."""
    if state["score"] > 0.8:
        return "path_a"
    elif state["score"] > 0.5:
        return "path_b"
    else:
        return "path_c"
```

### Passthrough Node
Pass state unchanged (useful for branching).

```python
def passthrough_node(state: State):
    """Pass state through unchanged."""
    return state
```

### Reducer Node
Aggregate/reduce data from previous steps.

```python
def reducer_node(state: State):
    """Reduce multiple results to single output."""
    results = state["results"]

    # Aggregate results
    summary = aggregate(results)

    return {"summary": summary, "results": results}
```

### Mapper Node
Map operation over data.

```python
def mapper_node(state: State):
    """Map operation over items."""
    items = state["items"]

    # Process each item
    processed = [process_item(item) for item in items]

    return {"processed_items": processed}
```

### Filter Node
Filter data based on criteria.

```python
def filter_node(state: State):
    """Filter items based on criteria."""
    items = state["items"]
    threshold = state.get("threshold", 0.5)

    # Filter items
    filtered = [item for item in items if item["score"] > threshold]

    return {"filtered_items": filtered}
```

## Examples

### List All Nodes
```bash
lg:node list --project ./my-graph
```

Output:
```
Nodes in my-graph:
  agent        (llm)         - Main agent
  tools        (tools)       - Tool executor
  human        (human)       - Human review
  summarize    (llm)         - Summarization
  __start__    (special)     - Entry point
  __end__      (special)     - Exit point
```

### Add LLM Node
```bash
lg:node add summarizer \
  --project ./my-graph \
  --type llm \
  --function summarize_text \
  --retry
```

### Add Tool Node with Multiple Tools
```bash
lg:node add tool_executor \
  --project ./my-graph \
  --type tools \
  --tools "search,calculator,file_reader" \
  --retry \
  --max-retries 3
```

### Add Human Review Node
```bash
lg:node add review \
  --project ./my-graph \
  --type human \
  --interrupt before
```

### Add Subgraph
```bash
lg:node add research_subgraph \
  --project ./my-graph \
  --type subgraph \
  --subgraph ./subgraphs/research.py
```

### Connect Two Nodes
```bash
lg:node connect \
  --from agent \
  --to tools \
  --project ./my-graph
```

### Add Conditional Connection
```bash
lg:node connect \
  --from agent \
  --to router \
  --project ./my-graph \
  --condition should_continue
```

### Disconnect Nodes
```bash
lg:node disconnect \
  --from agent \
  --to old_node \
  --project ./my-graph
```

### Modify Node
```bash
lg:node modify summarizer \
  --project ./my-graph \
  --retry true \
  --max-retries 5
```

### Get Node Info
```bash
lg:node info agent --project ./my-graph
```

Output:
```
Node: agent
Type: llm
Function: agent_node
Retry: enabled (max 3 attempts)
Interrupt: none
Incoming edges: __start__
Outgoing edges: tools (conditional), __end__ (conditional)
```

### Remove Node
```bash
lg:node remove old_node --project ./my-graph
```

## Graph Patterns

### Linear Flow
```bash
lg:node add step1 --type llm
lg:node add step2 --type llm
lg:node add step3 --type llm
lg:node connect --from step1 --to step2
lg:node connect --from step2 --to step3
```

Result:
```
START -> step1 -> step2 -> step3 -> END
```

### ReAct Loop
```bash
lg:node add agent --type llm
lg:node add tools --type tools --tools "search,calculator"
lg:node connect --from agent --to tools --condition should_use_tools
lg:node connect --from tools --to agent
```

Result:
```
START -> agent <-> tools (loop) -> END
```

### Human-in-the-Loop
```bash
lg:node add agent --type llm
lg:node add review --type human --interrupt before
lg:node add finalize --type llm
lg:node connect --from agent --to review
lg:node connect --from review --to finalize
```

Result:
```
START -> agent -> [INTERRUPT] review -> finalize -> END
```

### Parallel Processing
```bash
lg:node add router --type conditional
lg:node add worker1 --type llm
lg:node add worker2 --type llm
lg:node add worker3 --type llm
lg:node add aggregator --type reducer

lg:node connect --from router --to worker1 --condition route_to_worker1
lg:node connect --from router --to worker2 --condition route_to_worker2
lg:node connect --from router --to worker3 --condition route_to_worker3
lg:node connect --from worker1 --to aggregator
lg:node connect --from worker2 --to aggregator
lg:node connect --from worker3 --to aggregator
```

Result:
```
              /--> worker1 --\
START -> router --> worker2 --> aggregator -> END
              \--> worker3 --/
```

### Subgraph Composition
```bash
lg:node add preprocess --type llm
lg:node add research_flow --type subgraph --subgraph ./research_graph.py
lg:node add postprocess --type llm

lg:node connect --from preprocess --to research_flow
lg:node connect --from research_flow --to postprocess
```

Result:
```
START -> preprocess -> [research_flow subgraph] -> postprocess -> END
```

## Generated Code

### Node File Template
```python
# src/nodes/summarizer.py
from typing import TypedDict
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage

class SummarizerState(TypedDict):
    """State for summarizer node."""
    messages: list
    text: str
    summary: str

def summarizer_node(state: SummarizerState):
    """
    Summarize text content.

    Processes text and generates concise summary.
    """
    llm = ChatAnthropic(model="claude-sonnet-5")

    system_prompt = """
    You are a summarization expert.
    Create concise, accurate summaries of the provided text.
    """

    text = state.get("text", "")
    messages = [
        SystemMessage(content=system_prompt),
        {"role": "user", "content": f"Summarize: {text}"}
    ]

    response = llm.invoke(messages)

    return {"summary": response.content}
```

### Graph Update
```python
# graph.py - Updated automatically
from langgraph.graph import StateGraph, END
from .nodes.summarizer import summarizer_node

graph = StateGraph(State)

# Existing nodes
graph.add_node("agent", agent_node)
graph.add_node("tools", tools_node)

# New node
graph.add_node("summarizer", summarizer_node)

# Edges
graph.add_edge("agent", "tools")
graph.add_edge("tools", "summarizer")
graph.add_edge("summarizer", END)
```

### Conditional Edge
```python
# routing.py - Updated for conditional edges
def should_use_tools(state: State) -> str:
    """Determine if tools should be used."""
    last_message = state["messages"][-1]

    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    return END

# In graph.py
graph.add_conditional_edges(
    "agent",
    should_use_tools,
    {
        "tools": "tools",
        END: END
    }
)
```

### Retry Configuration
```python
# With retry enabled
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10)
)
def summarizer_node(state: State):
    # Node implementation
    pass
```

### Interrupt Configuration
```python
# graph.py
graph = StateGraph(State)
graph.add_node("review", review_node)

# Compile with interrupt
app = graph.compile(
    checkpointer=checkpointer,
    interrupt_before=["review"]  # or interrupt_after=["review"]
)
```

## Testing Generated

### Node Test Template
```python
# tests/nodes/test_summarizer.py
import pytest
from src.nodes.summarizer import summarizer_node

def test_summarizer_basic():
    """Test basic summarization."""
    state = {
        "text": "Long text here...",
        "messages": []
    }
    result = summarizer_node(state)
    assert "summary" in result
    assert len(result["summary"]) < len(state["text"])

def test_summarizer_empty_text():
    """Test with empty text."""
    state = {"text": "", "messages": []}
    result = summarizer_node(state)
    assert "summary" in result

@pytest.mark.integration
def test_summarizer_in_graph():
    """Test summarizer in full graph."""
    # Test as part of complete flow
    pass
```

### Edge Test Template
```python
# tests/test_routing.py
def test_should_use_tools():
    """Test tool routing logic."""
    # With tool calls
    state_with_tools = {
        "messages": [
            {"role": "assistant", "tool_calls": [{"name": "search"}]}
        ]
    }
    assert should_use_tools(state_with_tools) == "tools"

    # Without tool calls
    state_no_tools = {
        "messages": [{"role": "assistant", "content": "Done"}]
    }
    assert should_use_tools(state_no_tools) == END
```

## Advanced Features

### Custom Node Decorators
```python
from functools import wraps

def logged_node(func):
    """Log node execution."""
    @wraps(func)
    def wrapper(state):
        print(f"Executing {func.__name__}")
        result = func(state)
        print(f"Completed {func.__name__}")
        return result
    return wrapper

@logged_node
def my_node(state: State):
    # Implementation
    pass
```

### State Validation
```python
from pydantic import BaseModel, validator

class ValidatedState(BaseModel):
    """State with validation."""
    messages: list
    score: float

    @validator("score")
    def score_range(cls, v):
        if not 0 <= v <= 1:
            raise ValueError("Score must be between 0 and 1")
        return v

def validated_node(state: ValidatedState):
    # State is automatically validated
    pass
```

## Error Handling

- **Duplicate node name**: Node already exists
- **Invalid connection**: Source or target node doesn't exist
- **Circular dependency**: Would create invalid cycle (for non-conditional)
- **Invalid node type**: Type not recognized
- **Missing function**: Function not found for custom node

## Notes

- Node names must be valid Python identifiers
- Special nodes `__start__` and `__end__` are reserved
- Conditional edges must return one of the specified next nodes
- Interrupts only work with checkpointing enabled
- Subgraphs must have compatible state schemas
- Tool nodes automatically handle tool execution and errors

## Related Commands

- `lg:agent add` - Add agent nodes
- `lg:edge add` - Alternative edge management
- `lg:test visualize` - Visualize graph structure
- `lg:memory setup` - Configure checkpointing for interrupts
- `lg:deploy` - Deploy graph to production

## See Also

- Node Concepts: https://langchain-ai.github.io/langgraph/concepts/low_level/#nodes
- Conditional Edges: https://langchain-ai.github.io/langgraph/concepts/low_level/#conditional-edges
- Human-in-the-Loop: https://langchain-ai.github.io/langgraph/concepts/human_in_the_loop/
- Subgraphs: https://langchain-ai.github.io/langgraph/how-tos/subgraph/
