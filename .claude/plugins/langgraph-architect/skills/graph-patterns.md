# Graph Patterns Skill

```yaml
---
category: architecture
activation_keywords:
  - graph pattern
  - workflow pattern
  - agent pattern
  - stategraph design
  - react pattern
  - multi-agent
  - pipeline
  - map-reduce
  - reflection
  - human-in-loop
description: Comprehensive catalog of LangGraph architectural patterns for building production-ready agent systems
---
```

## Overview

This skill provides a comprehensive catalog of proven LangGraph patterns for building agent systems. Each pattern includes decision criteria, implementation examples, and best practices.

## Pattern Catalog

### 1. ReAct Agent Pattern

**Description:** Reasoning and Acting pattern where agents reason about actions, execute tools, and iterate until completion.

**When to Use:**
- Need autonomous tool-calling agents
- Task requires iterative problem-solving
- Agent must reason about which tools to use
- Want built-in retry and error handling

**When NOT to Use:**
- Simple linear workflows (use pipeline instead)
- No tool calling needed (use simple chain)
- Need parallel execution (use map-reduce instead)

**Implementation:**

```python
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_core.messages import BaseMessage
from typing import TypedDict, Annotated, Sequence
import operator

# State Schema
class ReActState(TypedDict):
    """State for ReAct pattern"""
    messages: Annotated[Sequence[BaseMessage], add_messages]
    iteration_count: int

# Agent Node
def agent_node(state: ReActState) -> ReActState:
    """Agent reasons and decides actions"""
    messages = state["messages"]
    model_with_tools = model.bind_tools(tools)
    response = model_with_tools.invoke(messages)

    return {
        "messages": [response],
        "iteration_count": state.get("iteration_count", 0) + 1
    }

# Tool Executor
tool_node = ToolNode(tools)

# Routing Logic
def should_continue(state: ReActState) -> str:
    """Decide whether to continue or end"""
    messages = state["messages"]
    last_message = messages[-1]

    # Max iterations safety check
    if state.get("iteration_count", 0) > 10:
        return "end"

    # If agent called tools, continue to tools
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "continue"

    # Otherwise end
    return "end"

# Build Graph
workflow = StateGraph(ReActState)
workflow.add_node("agent", agent_node)
workflow.add_node("tools", tool_node)

workflow.add_edge(START, "agent")
workflow.add_conditional_edges(
    "agent",
    should_continue,
    {"continue": "tools", "end": END}
)
workflow.add_edge("tools", "agent")

graph = workflow.compile(checkpointer=memory)
```

**Variations:**
- **Streaming ReAct:** Add streaming for real-time output
- **Fallback Tools:** Graceful tool failure handling
- **Dynamic Tools:** Change available tools based on state

**Best Practices:**
- Always set max iteration limit
- Log each reasoning step
- Implement tool error handling
- Use checkpointing for long-running tasks

**Anti-Patterns:**
- No max iteration limit (infinite loops)
- Synchronous tool execution (slow)
- Missing tool error handling (crashes)

---

### 2. Multi-Agent Supervisor Pattern

**Description:** Centralized coordinator routes tasks to specialized agents based on requirements.

**When to Use:**
- Need clear task delegation
- Centralized coordination required
- Multiple specialized agents
- Want explicit control flow
- Need monitoring and oversight

**When NOT to Use:**
- Agents should self-organize (use swarm)
- No clear authority hierarchy
- Need emergent behavior
- Simple sequential flow (use pipeline)

**Implementation:**

```python
from langgraph_supervisor import create_supervisor_node

class SupervisorState(TypedDict):
    """State for supervisor pattern"""
    messages: Annotated[list[BaseMessage], operator.add]
    next: str  # Which agent to route to
    context: dict

# Create specialized agents
def researcher_agent(state: SupervisorState):
    """Research specialist"""
    return {"messages": [HumanMessage(content="Research complete")]}

def coder_agent(state: SupervisorState):
    """Coding specialist"""
    return {"messages": [HumanMessage(content="Code written")]}

def reviewer_agent(state: SupervisorState):
    """Review specialist"""
    return {"messages": [HumanMessage(content="Review complete")]}

# Create supervisor
members = ["researcher", "coder", "reviewer"]
supervisor_prompt = f"""
You are a supervisor managing: {members}.
Route tasks to appropriate agents. When done, return FINISH.
"""

supervisor = create_supervisor_node(
    llm=ChatAnthropic(model="claude-opus-4-8"),
    prompt=supervisor_prompt,
    agents=members
)

# Build graph
workflow = StateGraph(SupervisorState)
workflow.add_node("supervisor", supervisor)
workflow.add_node("researcher", researcher_agent)
workflow.add_node("coder", coder_agent)
workflow.add_node("reviewer", reviewer_agent)

# All agents return to supervisor
for agent in members:
    workflow.add_edge(agent, "supervisor")

# Supervisor routes
workflow.add_conditional_edges(
    "supervisor",
    lambda x: x["next"],
    {
        "researcher": "researcher",
        "coder": "coder",
        "reviewer": "reviewer",
        "FINISH": END
    }
)

workflow.set_entry_point("supervisor")
graph = workflow.compile(checkpointer=memory)
```

**Decision Matrix:**

| Factor | Supervisor | Swarm | Hierarchical |
|--------|-----------|-------|--------------|
| Control | Centralized | Decentralized | Multi-level |
| Flexibility | Low | High | Medium |
| Predictability | High | Low | Medium |
| Complexity | Low | Medium | High |
| Scalability | Medium | High | High |

**Best Practices:**
- Clear agent responsibilities
- Simple routing logic
- Track agent utilization
- Implement timeout handling
- Monitor supervisor decisions

**Anti-Patterns:**
- Complex routing logic in supervisor (move to agents)
- Too many agents reporting to one supervisor (create hierarchies)
- Supervisor doing work (delegate to agents)

---

### 3. Hierarchical Teams Pattern

**Description:** Multi-level supervisor hierarchy where supervisors manage teams of agents or other supervisors.

**When to Use:**
- Large-scale systems (10+ agents)
- Clear organizational structure
- Different abstraction levels
- Need departmental boundaries
- Complex multi-stage workflows

**When NOT to Use:**
- Small teams (< 5 agents)
- Flat organization preferred
- Want simplicity over structure
- All agents at same level

**Implementation:**

```python
# Level 1: Team Subgraphs
research_team = create_team_subgraph(
    team_name="research_team",
    members=["web_researcher", "paper_researcher", "data_analyst"],
    supervisor_prompt="Coordinate research tasks..."
)

dev_team = create_team_subgraph(
    team_name="dev_team",
    members=["frontend_dev", "backend_dev", "devops"],
    supervisor_prompt="Coordinate development tasks..."
)

qa_team = create_team_subgraph(
    team_name="qa_team",
    members=["test_writer", "test_runner", "bug_reporter"],
    supervisor_prompt="Coordinate QA tasks..."
)

# Level 2: Main Supervisor
class HierarchicalState(TypedDict):
    messages: Annotated[list[BaseMessage], operator.add]
    next_team: str
    team_outputs: dict

main_supervisor = create_supervisor_node(
    llm=ChatAnthropic(model="claude-opus-4-8"),
    prompt="Coordinate research_team, dev_team, and qa_team...",
    agents=["research_team", "dev_team", "qa_team"]
)

# Build main graph
workflow = StateGraph(HierarchicalState)
workflow.add_node("main_supervisor", main_supervisor)
workflow.add_node("research_team", research_team)
workflow.add_node("dev_team", dev_team)
workflow.add_node("qa_team", qa_team)

# Teams report back
for team in ["research_team", "dev_team", "qa_team"]:
    workflow.add_edge(team, "main_supervisor")

workflow.add_conditional_edges(
    "main_supervisor",
    lambda x: x["next_team"],
    {
        "research": "research_team",
        "dev": "dev_team",
        "qa": "qa_team",
        "FINISH": END
    }
)

workflow.set_entry_point("main_supervisor")
graph = workflow.compile()
```

**Helper Function:**

```python
def create_team_subgraph(team_name: str, members: list[str], supervisor_prompt: str):
    """Create team with internal supervisor"""

    class TeamState(TypedDict):
        messages: Annotated[list[BaseMessage], operator.add]
        next: str
        team_context: dict

    # Create team supervisor
    team_supervisor = create_supervisor_node(
        llm=ChatAnthropic(model="claude-sonnet-5"),
        prompt=supervisor_prompt,
        agents=members
    )

    # Create team graph
    team_graph = StateGraph(TeamState)
    team_graph.add_node("team_supervisor", team_supervisor)

    # Add team members
    for member in members:
        team_graph.add_node(member, create_agent_node(member))
        team_graph.add_edge(member, "team_supervisor")

    team_graph.add_conditional_edges(
        "team_supervisor",
        lambda x: x["next"],
        {**{m: m for m in members}, "FINISH": END}
    )

    team_graph.set_entry_point("team_supervisor")
    return team_graph.compile()
```

**Best Practices:**
- 3-7 agents per supervisor (span of control)
- Clear team boundaries and responsibilities
- State isolation between teams
- Aggregate results at each level
- Monitor team performance

---

### 4. Swarm Collaboration Pattern

**Description:** Decentralized peer-to-peer agent collaboration with explicit handoffs.

**When to Use:**
- Need collaborative problem-solving
- Agents as equal peers
- Want emergent behavior
- Self-organizing workflows
- No clear hierarchy

**When NOT to Use:**
- Need centralized control
- Clear authority required
- Predictable routing needed
- Monitoring is critical

**Implementation:**

```python
from langgraph_swarm import create_swarm_agent, Handoff

# Create swarm agents with handoff tools
def create_research_agent():
    handoff_to_writer = Handoff(
        target="writer",
        description="Hand off to writer when research complete"
    )
    handoff_to_fact_checker = Handoff(
        target="fact_checker",
        description="Hand off to fact checker for verification"
    )

    return create_swarm_agent(
        name="researcher",
        instructions="Research and gather information. Hand off to fact checker or writer.",
        llm=ChatAnthropic(model="claude-sonnet-5"),
        handoffs=[handoff_to_writer, handoff_to_fact_checker]
    )

def create_writer_agent():
    handoff_to_reviewer = Handoff(
        target="reviewer",
        description="Hand off to reviewer for quality check"
    )
    handoff_to_researcher = Handoff(
        target="researcher",
        description="Request more research if needed"
    )

    return create_swarm_agent(
        name="writer",
        instructions="Create content. Request more research or hand off to reviewer.",
        llm=ChatAnthropic(model="claude-sonnet-5"),
        handoffs=[handoff_to_reviewer, handoff_to_researcher]
    )

def create_reviewer_agent():
    handoff_to_writer = Handoff(
        target="writer",
        description="Hand off back for revisions"
    )

    return create_swarm_agent(
        name="reviewer",
        instructions="Review quality. Request revisions or approve.",
        llm=ChatAnthropic(model="claude-sonnet-5"),
        handoffs=[handoff_to_writer],
        can_approve=True  # Can end workflow
    )

# Build swarm
from langgraph_swarm import create_swarm_graph

agents = {
    "researcher": create_research_agent(),
    "writer": create_writer_agent(),
    "reviewer": create_reviewer_agent(),
    "fact_checker": create_fact_checker_agent()
}

swarm = create_swarm_graph(
    agents=agents,
    initial_agent="researcher",
    state_schema=SwarmState
)

graph = swarm.compile()
```

**Decision Guide:**

```python
def choose_orchestration_pattern(requirements):
    """Help choose between supervisor and swarm"""

    # Use Supervisor if:
    if (
        requirements["need_centralized_control"] or
        requirements["clear_task_delegation"] or
        requirements["monitoring_required"] or
        requirements["predictable_flow"]
    ):
        return "supervisor"

    # Use Swarm if:
    if (
        requirements["peer_collaboration"] or
        requirements["emergent_behavior"] or
        requirements["self_organizing"] or
        requirements["flexible_routing"]
    ):
        return "swarm"

    # Use Hierarchical if:
    if (
        requirements["large_scale"] or
        requirements["multi_level_coordination"] or
        requirements["complex_structure"]
    ):
        return "hierarchical"
```

**Best Practices:**
- Clear handoff descriptions
- Prevent circular handoffs
- Track handoff history
- Set max handoff limit
- Test all handoff paths

---

### 5. Pipeline Processing Pattern

**Description:** Sequential stages with quality gates and validation checkpoints.

**When to Use:**
- Clear sequential stages
- Each stage transforms data
- Quality gates needed
- Assembly line workflows
- Data processing pipelines

**When NOT to Use:**
- Need parallelism (use map-reduce)
- Non-linear flow required
- Dynamic routing needed
- Stages can execute concurrently

**Implementation:**

```python
class PipelineState(TypedDict):
    """State flows through pipeline stages"""
    data: dict
    stage_results: Annotated[list, operator.add]
    quality_score: float
    errors: list

# Stage 1: Extract
def extract_stage(state: PipelineState):
    """Extract data from sources"""
    data = extract_from_sources()
    return {
        "data": data,
        "stage_results": [{"stage": "extract", "status": "complete"}]
    }

# Stage 2: Transform
def transform_stage(state: PipelineState):
    """Transform and enrich data"""
    transformed = transform_data(state["data"])
    return {
        "data": transformed,
        "stage_results": [{"stage": "transform", "status": "complete"}]
    }

# Stage 3: Validate
def validate_stage(state: PipelineState):
    """Validate data quality"""
    quality = validate_data(state["data"])
    return {
        "quality_score": quality,
        "stage_results": [{"stage": "validate", "score": quality}]
    }

# Quality Gate
def quality_gate(state: PipelineState) -> str:
    """Route based on quality score"""
    if state["quality_score"] >= 0.9:
        return "load"
    elif state["quality_score"] >= 0.7:
        return "refine"
    else:
        return "reject"

# Stage 4: Load
def load_stage(state: PipelineState):
    """Load data to destination"""
    load_data(state["data"])
    return {"stage_results": [{"stage": "load", "status": "complete"}]}

# Build pipeline
workflow = StateGraph(PipelineState)
workflow.add_node("extract", extract_stage)
workflow.add_node("transform", transform_stage)
workflow.add_node("validate", validate_stage)
workflow.add_node("load", load_stage)
workflow.add_node("refine", refine_stage)
workflow.add_node("reject", reject_stage)

# Linear flow with quality gate
workflow.add_edge(START, "extract")
workflow.add_edge("extract", "transform")
workflow.add_edge("transform", "validate")

workflow.add_conditional_edges(
    "validate",
    quality_gate,
    {
        "load": "load",
        "refine": "refine",
        "reject": "reject"
    }
)

workflow.add_edge("refine", "transform")  # Retry
workflow.add_edge("load", END)
workflow.add_edge("reject", END)

graph = workflow.compile()
```

**Best Practices:**
- Clear stage boundaries
- Validate at each stage
- Implement retry logic
- Log stage transitions
- Monitor pipeline health

---

### 6. Map-Reduce Parallelism Pattern

**Description:** Dynamic parallel execution with aggregation using the Send API.

**When to Use:**
- Independent parallel tasks
- Batch processing
- Fan-out/fan-in needed
- Variable number of tasks
- Aggregation required

**When NOT to Use:**
- Tasks have dependencies
- Sequential execution required
- Simple linear flow
- No aggregation needed

**Implementation:**

```python
from langgraph.constants import Send

class MapReduceState(TypedDict):
    """State for parallel map-reduce"""
    items: list
    results: Annotated[list, operator.add]
    final_result: dict

# Map Node (runs in parallel)
def map_worker(state: dict):
    """Process individual item"""
    item = state["item"]
    index = state["index"]

    # Process item
    result = process_item(item)

    return {"results": [{"index": index, "result": result}]}

# Fan Out
def fan_out(state: MapReduceState):
    """Create parallel sends for each item"""
    return [
        Send("map_worker", {"item": item, "index": i})
        for i, item in enumerate(state["items"])
    ]

# Reduce
def reduce_results(state: MapReduceState):
    """Aggregate all parallel results"""
    # Sort by index to maintain order
    sorted_results = sorted(state["results"], key=lambda x: x["index"])

    # Aggregate
    final = aggregate([r["result"] for r in sorted_results])

    return {"final_result": final}

# Build graph
workflow = StateGraph(MapReduceState)
workflow.add_node("fan_out", fan_out)
workflow.add_node("map_worker", map_worker)
workflow.add_node("reduce", reduce_results)

workflow.add_edge(START, "fan_out")
workflow.add_conditional_edges(
    "fan_out",
    lambda x: x,  # Returns Send objects
    ["map_worker"]
)
workflow.add_edge("map_worker", "reduce")
workflow.add_edge("reduce", END)

graph = workflow.compile()
```

**Advanced: Nested Map-Reduce:**

```python
def nested_map_reduce(state: MapReduceState):
    """Map-reduce with hierarchical aggregation"""

    # Level 1: Split into batches
    batches = chunk_items(state["items"], batch_size=10)

    # Level 2: Each batch creates parallel workers
    batch_sends = []
    for batch_id, batch in enumerate(batches):
        # Create worker sends for this batch
        worker_sends = [
            Send("map_worker", {
                "item": item,
                "batch_id": batch_id,
                "index": i
            })
            for i, item in enumerate(batch)
        ]
        batch_sends.append(Send("batch_reduce", {
            "batch_id": batch_id,
            "worker_sends": worker_sends
        }))

    return batch_sends

# Two-level reduce
def batch_reduce(state: dict):
    """Reduce within batch"""
    results = state["results"]
    batch_result = aggregate(results)
    return {"batch_results": [batch_result]}

def final_reduce(state: MapReduceState):
    """Reduce across batches"""
    batch_results = state["batch_results"]
    final = aggregate(batch_results)
    return {"final_result": final}
```

**Best Practices:**
- Use reducers for concurrent updates
- Preserve order with indexing
- Implement error handling per worker
- Monitor parallel execution
- Use batch processing for large datasets

---

### 7. Reflection Loop Pattern

**Description:** Agents evaluate and refine their own outputs iteratively.

**When to Use:**
- Need self-correction
- Quality improvement iterations
- Multi-attempt problem solving
- Critique and revision workflows

**When NOT to Use:**
- Single-pass sufficient
- External review preferred
- Time-critical tasks
- Quality threshold met on first try

**Implementation:**

```python
class ReflectionState(TypedDict):
    """State for reflection loops"""
    messages: Annotated[list[BaseMessage], operator.add]
    draft: str
    reflections: list[str]
    iteration: int
    quality_score: float

def generate_draft(state: ReflectionState):
    """Create initial draft"""
    draft = llm.invoke(state["messages"])
    return {
        "draft": draft,
        "iteration": state.get("iteration", 0) + 1
    }

def reflect_on_draft(state: ReflectionState):
    """Critique current draft"""
    reflection_prompt = f"""
    Reflect on this draft:
    {state["draft"]}

    Provide:
    1. Quality score (0-1)
    2. Specific improvements needed
    3. Reasoning for changes
    """

    reflection = llm.invoke(reflection_prompt)
    score = extract_score(reflection)

    return {
        "reflections": [reflection],
        "quality_score": score
    }

def revise_draft(state: ReflectionState):
    """Revise based on reflection"""
    revision_prompt = f"""
    Original: {state["draft"]}
    Feedback: {state["reflections"][-1]}

    Create improved version addressing feedback.
    """

    revised = llm.invoke(revision_prompt)
    return {"draft": revised}

def should_continue_reflection(state: ReflectionState) -> str:
    """Decide to refine or finish"""
    if state["iteration"] >= 5:
        return "finish"  # Max iterations

    if state["quality_score"] >= 0.9:
        return "finish"  # Quality threshold met

    return "continue"

# Build reflection loop
workflow = StateGraph(ReflectionState)
workflow.add_node("generate", generate_draft)
workflow.add_node("reflect", reflect_on_draft)
workflow.add_node("revise", revise_draft)

workflow.add_edge(START, "generate")
workflow.add_edge("generate", "reflect")

workflow.add_conditional_edges(
    "reflect",
    should_continue_reflection,
    {"continue": "revise", "finish": END}
)

workflow.add_edge("revise", "reflect")

graph = workflow.compile()
```

**Best Practices:**
- Set max iterations
- Track improvement over iterations
- Use different models for generation vs reflection
- Preserve reflection history
- Define clear quality metrics

---

### 8. Human-in-the-Loop Pattern

**Description:** Workflows that pause for human input, approval, or editing.

**When to Use:**
- Need human approval gates
- Want human editing capability
- Require judgment calls
- Compliance/audit requirements
- High-stakes decisions

**When NOT to Use:**
- Fully automated workflows
- Real-time requirements
- No human available
- Trust in automation complete

**Implementation:**

```python
from langgraph.checkpoint.memory import MemorySaver

class HumanLoopState(TypedDict):
    """State with human interaction"""
    messages: Annotated[list[BaseMessage], operator.add]
    draft: str
    approval_status: str
    human_feedback: str

def generate_draft(state: HumanLoopState):
    """Generate content needing approval"""
    draft = llm.invoke(state["messages"])
    return {"draft": draft}

def human_review(state: HumanLoopState):
    """Node where execution pauses for human"""
    # Execution interrupts here
    # Human updates state via graph.update_state()

    status = state.get("approval_status", "pending")

    if status == "approved":
        return {"messages": [HumanMessage(content="Approved")]}
    elif status == "rejected":
        feedback = state.get("human_feedback", "")
        return {
            "messages": [HumanMessage(content=f"Revise: {feedback}")]
        }

    return state

def route_after_human(state: HumanLoopState) -> str:
    """Route based on human decision"""
    status = state.get("approval_status", "pending")

    if status == "approved":
        return "finalize"
    elif status == "rejected":
        return "revise"
    else:
        return "wait"

# Build with checkpointing
workflow = StateGraph(HumanLoopState)
workflow.add_node("generate", generate_draft)
workflow.add_node("human_review", human_review)
workflow.add_node("finalize", finalize_node)
workflow.add_node("revise", revise_node)

workflow.add_edge(START, "generate")
workflow.add_edge("generate", "human_review")

workflow.add_conditional_edges(
    "human_review",
    route_after_human,
    {
        "finalize": "finalize",
        "revise": "revise",
        "wait": "human_review"
    }
)

workflow.add_edge("revise", "human_review")
workflow.add_edge("finalize", END)

# Compile with interrupt
memory = MemorySaver()
graph = workflow.compile(
    checkpointer=memory,
    interrupt_before=["human_review"]
)

# Usage
config = {"configurable": {"thread_id": "123"}}

# Start - will pause at human_review
result = graph.invoke({"messages": []}, config)

# Human reviews
print(result["draft"])

# Update state with decision
graph.update_state(
    config,
    {"approval_status": "approved"},
    as_node="human_review"
)

# Resume
final = graph.invoke(None, config)
```

**Best Practices:**
- Use checkpointing for persistence
- Clear interrupt points
- Timeout handling for human delays
- Track approval history
- Provide context to humans

---

### 9. Error Recovery Pattern

**Description:** Graceful error handling with fallbacks and retries.

**When to Use:**
- External API calls (can fail)
- Tool execution (can error)
- Production systems (need resilience)
- Long-running workflows

**Implementation:**

```python
class ErrorRecoveryState(TypedDict):
    """State with error tracking"""
    messages: Annotated[list[BaseMessage], operator.add]
    errors: list[dict]
    retry_count: int
    fallback_used: bool

def try_primary_action(state: ErrorRecoveryState):
    """Primary action with error handling"""
    try:
        result = risky_operation()
        return {"messages": [HumanMessage(content=result)]}
    except Exception as e:
        return {
            "errors": [{
                "operation": "primary",
                "error": str(e),
                "timestamp": time.time()
            }],
            "retry_count": state.get("retry_count", 0) + 1
        }

def fallback_action(state: ErrorRecoveryState):
    """Fallback when primary fails"""
    result = safe_alternative()
    return {
        "messages": [HumanMessage(content=result)],
        "fallback_used": True
    }

def route_on_error(state: ErrorRecoveryState) -> str:
    """Decide retry, fallback, or fail"""
    if not state.get("errors"):
        return "success"

    retry_count = state.get("retry_count", 0)

    if retry_count < 3:
        return "retry"
    elif not state.get("fallback_used"):
        return "fallback"
    else:
        return "fail"

# Build with error handling
workflow = StateGraph(ErrorRecoveryState)
workflow.add_node("try_primary", try_primary_action)
workflow.add_node("fallback", fallback_action)
workflow.add_node("fail", fail_node)

workflow.add_edge(START, "try_primary")

workflow.add_conditional_edges(
    "try_primary",
    route_on_error,
    {
        "success": END,
        "retry": "try_primary",
        "fallback": "fallback",
        "fail": "fail"
    }
)

workflow.add_edge("fallback", END)
workflow.add_edge("fail", END)

graph = workflow.compile()
```

---

## Pattern Selection Decision Tree

```python
def select_pattern(requirements: dict) -> str:
    """Decision tree for pattern selection"""

    # Tool calling?
    if requirements.get("needs_tools"):
        if requirements.get("iterative_reasoning"):
            return "ReAct Agent"

    # Multiple agents?
    if requirements.get("multiple_agents"):
        if requirements.get("centralized_control"):
            if requirements.get("large_scale"):
                return "Hierarchical Teams"
            else:
                return "Supervisor"
        elif requirements.get("peer_collaboration"):
            return "Swarm"

    # Parallel execution?
    if requirements.get("parallel_tasks"):
        if requirements.get("aggregation_needed"):
            return "Map-Reduce"
        else:
            return "Parallel Execution"

    # Sequential stages?
    if requirements.get("sequential_stages"):
        if requirements.get("quality_gates"):
            return "Pipeline"

    # Quality iteration?
    if requirements.get("self_improvement"):
        return "Reflection Loop"

    # Human involvement?
    if requirements.get("human_approval"):
        return "Human-in-the-Loop"

    # Error handling priority?
    if requirements.get("high_reliability"):
        return "Error Recovery"

    return "ReAct Agent"  # Default
```

## Anti-Patterns to Avoid

### 1. Pattern Misuse
- Using supervisor when swarm would be better
- Using swarm when clear control needed
- Using map-reduce for sequential tasks

### 2. Missing Safety Checks
- No max iteration limits
- No timeout handling
- No error recovery

### 3. Poor State Design
- State bloat (too much data)
- Missing reducers for concurrent updates
- No state validation

### 4. Incomplete Error Handling
- No fallback strategies
- Missing retry logic
- Crashes on tool failures

### 5. Over-Engineering
- Too many patterns combined
- Unnecessary complexity
- Deep nesting of subgraphs

## Resources

- **LangGraph Docs:** https://langchain-ai.github.io/langgraph/
- **Pattern Examples:** https://github.com/langchain-ai/langgraph/tree/main/examples
- **LangGraph Supervisor:** https://github.com/langchain-ai/langgraph/tree/main/libs/supervisor
- **LangGraph Swarm:** https://github.com/langchain-ai/langgraph/tree/main/libs/swarm

## Success Criteria

A well-implemented pattern has:

1. **Clear Use Case:** Pattern fits requirements
2. **Proper State:** Schema with appropriate reducers
3. **Error Handling:** Graceful failure recovery
4. **Safety Limits:** Max iterations, timeouts
5. **Observability:** Logging and monitoring
6. **Documentation:** Clear implementation notes
7. **Testing:** Unit and integration tests
8. **Performance:** Appropriate parallelization

---

**Use this skill when designing LangGraph architectures to select and implement the right patterns for your requirements.**
