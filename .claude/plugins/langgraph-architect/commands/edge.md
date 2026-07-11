---
name: lg:edge
description: Manage edges between nodes in LangGraph including regular edges, conditional edges, and dynamic routing
version: 1.0.0
category: langgraph
author: Claude Code
arguments:
  - name: action
    description: Edge action to perform
    required: true
    type: choice
    choices: [add, conditional, remove, list, info, validate]
  - name: name
    description: Edge name or identifier
    required: false
    type: string
flags:
  - name: project
    description: Project directory path
    type: string
    default: "."
  - name: from
    description: Source node
    type: string
    default: ""
  - name: to
    description: Target node (or multiple for conditional)
    type: string
    default: ""
  - name: condition
    description: Condition function for conditional edges
    type: string
    default: ""
  - name: condition-type
    description: Type of conditional logic
    type: choice
    choices: [simple, mapping, dynamic, llm-based]
    default: simple
  - name: default
    description: Default target for conditional edges
    type: string
    default: ""
  - name: paths
    description: JSON mapping of conditions to targets
    type: string
    default: "{}"
  - name: bidirectional
    description: Create bidirectional edge
    type: boolean
    default: false
  - name: weight
    description: Edge weight (for weighted routing)
    type: number
    default: 1.0
presets:
  - name: simple-flow
    description: Simple A->B flow
    flags:
      action: add
  - name: tool-loop
    description: Agent-tool loop with condition
    flags:
      action: conditional
      condition-type: simple
  - name: supervisor-routing
    description: Supervisor to worker routing
    flags:
      action: conditional
      condition-type: llm-based
---

# lg:edge - Edge Management

Manage edges (connections) between nodes in LangGraph graphs including regular edges, conditional edges, and dynamic routing.

## Workflow Steps

### Add Regular Edge

1. **Validate Nodes**
   - Check source node exists
   - Check target node exists
   - Verify compatible state schemas

2. **Create Edge**
   - Add edge to graph definition
   - Update routing logic
   - Add to graph compilation

3. **Update Tests**
   - Add edge test
   - Update integration tests

4. **Update Documentation**
   - Update graph diagram
   - Document flow

### Add Conditional Edge

1. **Validate Configuration**
   - Check source node exists
   - Check target nodes exist
   - Validate condition function

2. **Generate Condition Function**
   - Create routing logic
   - Add condition checks
   - Handle default case

3. **Add Conditional Edge**
   - Add to graph definition
   - Configure routing map
   - Add error handling

4. **Update Tests**
   - Test all routing paths
   - Test edge cases
   - Test default routing

5. **Update Documentation**
   - Document routing logic
   - Add decision tree diagram

### Remove Edge

1. **Identify Edge**
   - Find edge in graph
   - Check for dependencies

2. **Remove Edge**
   - Remove from graph definition
   - Clean up routing logic
   - Remove condition function (if orphaned)

3. **Update Tests**
   - Remove edge tests
   - Update integration tests

4. **Update Documentation**
   - Update graph diagram

## Edge Types

### Regular Edge
Simple one-way connection.

```python
graph.add_edge("node_a", "node_b")
```

Flow:
```
node_a → node_b
```

### Conditional Edge
Branch based on condition.

```python
def route_condition(state: State) -> str:
    """Determine next node based on state."""
    if state["score"] > 0.8:
        return "high_score_path"
    elif state["score"] > 0.5:
        return "medium_score_path"
    else:
        return "low_score_path"

graph.add_conditional_edges(
    "node_a",
    route_condition,
    {
        "high_score_path": "node_b",
        "medium_score_path": "node_c",
        "low_score_path": "node_d"
    }
)
```

Flow:
```
           /→ node_b (high)
node_a →<  →  node_c (medium)
           \→ node_d (low)
```

### Tool Routing Edge
Route based on tool calls.

```python
from langgraph.prebuilt import tools_condition

graph.add_conditional_edges(
    "agent",
    tools_condition,  # Built-in: checks for tool_calls
    {
        "tools": "tools",
        END: END
    }
)
```

Flow:
```
agent →< tools → (loop back to agent)
        \
         → END
```

### LLM-Based Routing
Let LLM decide next step.

```python
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage

def llm_router(state: State) -> str:
    """Use LLM to decide next step."""
    llm = ChatAnthropic(model="claude-sonnet-5")

    routing_prompt = """
    Based on the conversation, decide the next step:
    - "researcher" if we need to gather information
    - "coder" if we need to write code
    - "reviewer" if we need to review work
    - "end" if we're done

    Respond with only the step name.
    """

    messages = [
        SystemMessage(content=routing_prompt)
    ] + state["messages"]

    response = llm.invoke(messages)
    return response.content.strip().lower()

graph.add_conditional_edges(
    "supervisor",
    llm_router,
    {
        "researcher": "researcher",
        "coder": "coder",
        "reviewer": "reviewer",
        "end": END
    }
)
```

### Dynamic Routing
Computed targets at runtime.

```python
def dynamic_router(state: State) -> str:
    """Dynamically determine target based on state."""
    available_agents = state.get("available_agents", [])

    # Pick least busy agent
    agent_loads = state.get("agent_loads", {})
    next_agent = min(available_agents, key=lambda a: agent_loads.get(a, 0))

    return next_agent

# Targets determined at runtime
graph.add_conditional_edges(
    "router",
    dynamic_router,
    # All possible targets must be in the graph
)
```

### Parallel Edges (Send/Receive)
Execute multiple nodes in parallel.

```python
from langgraph.constants import Send

def parallel_router(state: State) -> list[Send]:
    """Send to multiple nodes in parallel."""
    tasks = state["tasks"]

    # Send each task to a worker
    return [
        Send("worker", {"task": task})
        for task in tasks
    ]

graph.add_conditional_edges(
    "dispatcher",
    parallel_router
)
```

### Weighted Edges
Probabilistic routing.

```python
import random

def weighted_router(state: State) -> str:
    """Route based on weights."""
    choices = [
        ("node_a", 0.7),  # 70% probability
        ("node_b", 0.2),  # 20% probability
        ("node_c", 0.1),  # 10% probability
    ]

    rand = random.random()
    cumulative = 0

    for node, weight in choices:
        cumulative += weight
        if rand < cumulative:
            return node

    return choices[-1][0]  # Fallback

graph.add_conditional_edges(
    "router",
    weighted_router,
    {choice[0]: choice[0] for choice in choices}
)
```

## Examples

### Add Simple Edge
```bash
lg:edge add \
  --from node_a \
  --to node_b \
  --project ./my-graph
```

### Add Conditional Edge
```bash
lg:edge conditional \
  --from agent \
  --to "tools,end" \
  --condition should_continue \
  --project ./my-graph
```

### Add LLM-Based Routing
```bash
lg:edge conditional \
  --from supervisor \
  --to "researcher,coder,reviewer,end" \
  --condition-type llm-based \
  --project ./my-graph
```

### Add Edge with Paths Mapping
```bash
lg:edge conditional \
  --from classifier \
  --condition classify_intent \
  --paths '{"question":"qa_agent","task":"task_agent","chat":"chat_agent"}' \
  --project ./my-graph
```

### Add Bidirectional Edge
```bash
lg:edge add \
  --from node_a \
  --to node_b \
  --bidirectional \
  --project ./my-graph
```

Result:
```
node_a ⟷ node_b
```

### List All Edges
```bash
lg:edge list --project ./my-graph
```

Output:
```
Edges in my-graph:

Regular Edges:
  __start__ → agent
  tools → agent
  agent → summarize
  summarize → __end__

Conditional Edges:
  agent → should_continue → {tools, __end__}
  supervisor → route_to_worker → {researcher, coder, reviewer, __end__}
```

### Get Edge Info
```bash
lg:edge info agent-tools --project ./my-graph
```

Output:
```
Edge: agent → should_continue
Type: Conditional
Source: agent
Condition: should_continue
Targets:
  - tools (if tool_calls present)
  - __end__ (if no tool_calls)
Default: __end__
```

### Remove Edge
```bash
lg:edge remove \
  --from node_a \
  --to node_b \
  --project ./my-graph
```

### Validate All Edges
```bash
lg:edge validate --project ./my-graph
```

Output:
```
Edge Validation:
  ✓ All source nodes exist
  ✓ All target nodes exist
  ✓ All condition functions defined
  ✓ No unreachable nodes
  ⚠ Warning: Circular path detected (non-conditional): node_a → node_b → node_a
  ✓ All conditional edges have valid mappings
```

## Common Patterns

### ReAct Agent Loop
```bash
# Agent decides whether to use tools or finish
lg:edge conditional \
  --from agent \
  --condition tools_condition \
  --to "tools,end" \
  --project ./my-agent

# Tools always go back to agent
lg:edge add \
  --from tools \
  --to agent \
  --project ./my-agent
```

Result:
```
      ┌─────────┐
  ┌──→│  agent  │
  │   └────┬────┘
  │        │
  │        ▼
  │   tools_condition?
  │       / \
  │      /   \
  │  tools  END
  │    │
  └────┘
```

### Supervisor Pattern
```bash
# Supervisor routes to workers
lg:edge conditional \
  --from supervisor \
  --condition route_worker \
  --to "worker1,worker2,worker3,end" \
  --condition-type llm-based \
  --project ./my-system

# Workers report back to supervisor
for worker in worker1 worker2 worker3; do
  lg:edge add \
    --from $worker \
    --to supervisor \
    --project ./my-system
done
```

Result:
```
           ┌───────────┐
      ┌───→│  worker1  │───┐
      │    └───────────┘   │
      │                    │
  ┌───┴────┐           ┌───▼───┐
  │ super- │◄──────────│ super-│
  │ visor  │           │ visor │
  └───┬────┘           └───────┘
      │    ┌───────────┐   │
      ├───→│  worker2  │───┤
      │    └───────────┘   │
      │                    │
      │    ┌───────────┐   │
      └───→│  worker3  │───┘
           └───────────┘
```

### Pipeline with Error Handling
```bash
# Main pipeline
lg:edge add --from step1 --to step2 --project ./pipeline
lg:edge add --from step2 --to step3 --project ./pipeline

# Error handling
lg:edge conditional \
  --from step2 \
  --condition check_error \
  --to "step3,error_handler" \
  --project ./pipeline

lg:edge add --from error_handler --to step1 --project ./pipeline
```

Result:
```
step1 → step2 →< step3
         │ \
         │  └─→ error_handler ──┐
         │                      │
         └──────────────────────┘
```

### Parallel Processing
```bash
# Dispatcher sends to workers in parallel
lg:edge conditional \
  --from dispatcher \
  --condition parallel_send \
  --project ./parallel

# Workers converge to aggregator
for worker in worker1 worker2 worker3; do
  lg:edge add \
    --from $worker \
    --to aggregator \
    --project ./parallel
done
```

Result:
```
              ┌─→ worker1 ─┐
dispatcher ───┼─→ worker2 ─┼─→ aggregator
              └─→ worker3 ─┘
```

### Human-in-the-Loop
```bash
# Automatic flow
lg:edge add --from agent --to process --project ./hitl

# Conditional human review
lg:edge conditional \
  --from process \
  --condition needs_review \
  --to "human_review,finalize" \
  --project ./hitl

lg:edge add --from human_review --to finalize --project ./hitl
```

Result:
```
agent → process →< finalize
                \
                 └→ human_review → finalize
```

## Generated Code

### Regular Edge
```python
# graph.py
graph.add_edge("node_a", "node_b")
```

### Conditional Edge with Simple Condition
```python
# routing.py
from typing import Literal

def should_continue(state: State) -> Literal["tools", "end"]:
    """Determine if tools should be called."""
    last_message = state["messages"][-1]

    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    return "end"

# graph.py
from langgraph.graph import END
from .routing import should_continue

graph.add_conditional_edges(
    "agent",
    should_continue,
    {
        "tools": "tools",
        "end": END
    }
)
```

### Conditional Edge with LLM Router
```python
# routing.py
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage
from typing import Literal

def llm_router(state: State) -> Literal["researcher", "coder", "reviewer", "end"]:
    """Use LLM to route to next agent."""
    llm = ChatAnthropic(model="claude-sonnet-5")

    system_prompt = """
    You are a supervisor managing these agents:
    - researcher: Gathers information and researches topics
    - coder: Writes and modifies code
    - reviewer: Reviews and critiques work

    Based on the current state, decide which agent should act next.
    If the task is complete, respond with "end".

    Respond with only: researcher, coder, reviewer, or end
    """

    messages = [SystemMessage(content=system_prompt)] + state["messages"]
    response = llm.invoke(messages)

    choice = response.content.strip().lower()
    if choice in ["researcher", "coder", "reviewer", "end"]:
        return choice
    return "end"  # Default

# graph.py
from langgraph.graph import END
from .routing import llm_router

graph.add_conditional_edges(
    "supervisor",
    llm_router,
    {
        "researcher": "researcher",
        "coder": "coder",
        "reviewer": "reviewer",
        "end": END
    }
)
```

### Parallel Routing
```python
# routing.py
from langgraph.constants import Send

def parallel_dispatcher(state: State) -> list[Send]:
    """Dispatch tasks to workers in parallel."""
    tasks = state.get("tasks", [])

    # Send each task to a worker node
    return [
        Send("worker", {"task": task, "task_id": i})
        for i, task in enumerate(tasks)
    ]

# graph.py
from .routing import parallel_dispatcher

graph.add_conditional_edges(
    "dispatcher",
    parallel_dispatcher
)
```

### Dynamic Routing
```python
# routing.py
def dynamic_router(state: State) -> str:
    """Dynamically route based on runtime state."""
    intent = state.get("intent")

    # Map intents to nodes
    intent_map = {
        "question": "qa_agent",
        "task": "task_agent",
        "chat": "chat_agent",
        "search": "search_agent"
    }

    return intent_map.get(intent, "chat_agent")  # Default to chat

# graph.py
from .routing import dynamic_router

# All possible targets must be added to graph
graph.add_node("qa_agent", qa_agent_node)
graph.add_node("task_agent", task_agent_node)
graph.add_node("chat_agent", chat_agent_node)
graph.add_node("search_agent", search_agent_node)

graph.add_conditional_edges(
    "intent_classifier",
    dynamic_router,
    {
        "qa_agent": "qa_agent",
        "task_agent": "task_agent",
        "chat_agent": "chat_agent",
        "search_agent": "search_agent"
    }
)
```

## Testing Generated

### Edge Test Template
```python
# tests/test_edges.py
import pytest
from src.routing import should_continue, llm_router
from src.graph import app

def test_should_continue_with_tools():
    """Test routing when tools should be called."""
    state = {
        "messages": [{
            "role": "assistant",
            "tool_calls": [{"name": "search", "args": {}}]
        }]
    }

    result = should_continue(state)
    assert result == "tools"

def test_should_continue_without_tools():
    """Test routing when no tools needed."""
    state = {
        "messages": [{
            "role": "assistant",
            "content": "Done"
        }]
    }

    result = should_continue(state)
    assert result == "end"

@pytest.mark.integration
def test_edge_in_graph():
    """Test edge routing in full graph."""
    config = {"configurable": {"thread_id": "test"}}

    # Input that should trigger tool use
    result = app.invoke(
        {"messages": [{"role": "user", "content": "Search for LangGraph"}]},
        config
    )

    # Should have gone through tools node
    # Verify by checking state or output
    assert "messages" in result

def test_llm_router():
    """Test LLM-based routing."""
    state = {
        "messages": [{
            "role": "user",
            "content": "Research the latest AI developments"
        }]
    }

    result = llm_router(state)
    assert result in ["researcher", "coder", "reviewer", "end"]
    # For research request, should route to researcher
    assert result == "researcher"

def test_parallel_dispatcher():
    """Test parallel task dispatch."""
    from src.routing import parallel_dispatcher

    state = {
        "tasks": ["task1", "task2", "task3"]
    }

    sends = parallel_dispatcher(state)

    assert len(sends) == 3
    assert all(send.node == "worker" for send in sends)
```

## Validation

### Graph Validation Checks
```python
def validate_graph():
    """Validate graph structure."""
    errors = []
    warnings = []

    # Check all nodes exist
    for edge in edges:
        if edge.source not in nodes:
            errors.append(f"Source node '{edge.source}' not found")
        if edge.target not in nodes:
            errors.append(f"Target node '{edge.target}' not found")

    # Check for unreachable nodes
    reachable = set()
    def dfs(node):
        if node in reachable:
            return
        reachable.add(node)
        for edge in get_outgoing_edges(node):
            dfs(edge.target)

    dfs(START)

    unreachable = set(nodes) - reachable
    if unreachable:
        warnings.append(f"Unreachable nodes: {unreachable}")

    # Check conditional edge mappings
    for edge in conditional_edges:
        if not edge.condition_function:
            errors.append(f"Conditional edge missing condition: {edge}")

        for target in edge.targets:
            if target not in nodes and target != END:
                errors.append(f"Invalid target in conditional edge: {target}")

    return errors, warnings
```

## Error Handling

- **Source node not found**: Node doesn't exist
- **Target node not found**: Node doesn't exist
- **Circular dependency**: Non-conditional loop detected
- **Missing condition**: Conditional edge missing function
- **Invalid target**: Target not in conditional mapping
- **Unreachable nodes**: Nodes with no incoming edges

## Notes

- Regular edges create deterministic flow
- Conditional edges enable branching logic
- All targets in conditional edges must exist
- Circular flows require conditional edges
- END is a special target representing completion
- Parallel edges (Send) allow concurrent execution
- LLM-based routing adds flexibility but latency
- Always test all routing paths
- Validate graph structure before deployment
- Use type hints for routing functions

## Related Commands

- `lg:node add` - Add nodes before connecting
- `lg:agent add` - Add agents to connect
- `lg:test validate` - Validate graph structure
- `lg:test visualize` - Visualize graph with edges

## See Also

- Edges Documentation: https://langchain-ai.github.io/langgraph/concepts/low_level/#edges
- Conditional Edges: https://langchain-ai.github.io/langgraph/concepts/low_level/#conditional-edges
- Map-Reduce: https://langchain-ai.github.io/langgraph/how-tos/map-reduce/
- Dynamic Routing: https://langchain-ai.github.io/langgraph/how-tos/branching/
