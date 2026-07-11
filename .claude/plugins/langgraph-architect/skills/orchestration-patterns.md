# Orchestration Patterns Skill

```yaml
---
category: architecture
activation_keywords:
  - multi-agent
  - orchestration
  - supervisor
  - swarm
  - coordinator
  - agent coordination
  - handoff
  - parallel agents
  - team coordination
description: Multi-agent orchestration patterns for coordinating teams of specialized agents in LangGraph
---
```

## Overview

Multi-agent orchestration is the art of coordinating specialized agents to solve complex problems collaboratively. This skill covers pattern selection, implementation strategies, and best practices for building effective agent teams.

## Pattern Selection Framework

### Decision Matrix

| Pattern | Control | Flexibility | Complexity | Best For |
|---------|---------|-------------|------------|----------|
| **Supervisor** | Centralized | Low | Low | Clear task delegation, monitoring |
| **Swarm** | Decentralized | High | Medium | Peer collaboration, emergent behavior |
| **Hierarchical** | Multi-level | Medium | High | Large-scale, organizational structure |
| **Parallel** | Coordinated | Low | Medium | Independent tasks, batch processing |
| **Pipeline** | Sequential | Low | Low | Linear workflows, ETL processes |

### When to Use What

```python
def select_orchestration_pattern(requirements: dict) -> str:
    """Expert system for pattern selection"""

    # Analyze requirements
    agent_count = requirements.get("agent_count", 1)
    need_control = requirements.get("centralized_control", False)
    need_flexibility = requirements.get("flexibility", False)
    need_monitoring = requirements.get("monitoring", False)
    tasks_independent = requirements.get("independent_tasks", False)
    sequential_stages = requirements.get("sequential", False)

    # Decision logic
    if sequential_stages:
        return "pipeline"

    if tasks_independent and agent_count > 5:
        return "parallel"

    if agent_count > 15:
        return "hierarchical"

    if need_control or need_monitoring:
        return "supervisor"

    if need_flexibility and agent_count <= 10:
        return "swarm"

    return "supervisor"  # Safe default
```

---

## 1. Supervisor Pattern

### Pattern Overview

**Architecture:**
```
        ┌─────────────┐
        │ Supervisor  │
        └──────┬──────┘
               │
       ┌───────┼───────┐
       │       │       │
   ┌───▼──┐ ┌──▼──┐ ┌─▼───┐
   │Agent1│ │Agent2│ │Agent3│
   └───┬──┘ └──┬──┘ └─┬───┘
       │       │      │
       └───────┼──────┘
               │
        ┌──────▼──────┐
        │  Supervisor │
        └─────────────┘
```

**When to Use:**
- Clear routing logic between specialized agents
- Need centralized decision-making
- Want explicit monitoring and control
- Building hierarchical systems

**When NOT to Use:**
- Agents should self-organize
- Need emergent collaborative behavior
- No clear authority hierarchy

### Implementation

```python
from langgraph_supervisor import create_supervisor_node
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated
import operator

class SupervisorState(TypedDict):
    """Shared state for supervisor pattern"""
    messages: Annotated[list[BaseMessage], operator.add]
    next: str  # Which agent to route to
    context: dict  # Shared context
    agent_outputs: dict  # Track agent results

# Create specialized agents
def create_research_agent():
    """Agent specialized in research"""
    def research(state: SupervisorState):
        query = extract_query(state["messages"])
        findings = conduct_research(query)

        return {
            "messages": [HumanMessage(content=f"Research findings: {findings}")],
            "context": {"research_data": findings},
            "agent_outputs": {"research": findings}
        }
    return research

def create_analysis_agent():
    """Agent specialized in analysis"""
    def analyze(state: SupervisorState):
        data = state["context"].get("research_data", {})
        analysis = analyze_data(data)

        return {
            "messages": [HumanMessage(content=f"Analysis: {analysis}")],
            "context": {"analysis": analysis},
            "agent_outputs": {"analysis": analysis}
        }
    return analyze

def create_synthesis_agent():
    """Agent specialized in synthesis"""
    def synthesize(state: SupervisorState):
        research = state["agent_outputs"].get("research", {})
        analysis = state["agent_outputs"].get("analysis", {})

        synthesis = create_synthesis(research, analysis)

        return {
            "messages": [HumanMessage(content=f"Synthesis: {synthesis}")],
            "agent_outputs": {"synthesis": synthesis}
        }
    return synthesize

# Create supervisor
members = ["researcher", "analyst", "synthesizer"]

supervisor_prompt = f"""
You are a supervisor coordinating a team of specialists: {members}.

Your team:
- researcher: Gathers information from various sources
- analyst: Analyzes data and identifies patterns
- synthesizer: Combines research and analysis into coherent output

Route tasks to appropriate specialists based on:
1. Current state of work
2. What information is still needed
3. Which specialist is best suited

When all work is complete and synthesis is done, return FINISH.
"""

supervisor = create_supervisor_node(
    llm=ChatAnthropic(model="claude-opus-4-8"),
    prompt=supervisor_prompt,
    agents=members
)

# Build graph
workflow = StateGraph(SupervisorState)

# Add supervisor
workflow.add_node("supervisor", supervisor)

# Add agents
workflow.add_node("researcher", create_research_agent())
workflow.add_node("analyst", create_analysis_agent())
workflow.add_node("synthesizer", create_synthesis_agent())

# All agents return to supervisor
for agent in members:
    workflow.add_edge(agent, "supervisor")

# Supervisor routes
workflow.add_conditional_edges(
    "supervisor",
    lambda x: x["next"],
    {
        "researcher": "researcher",
        "analyst": "analyst",
        "synthesizer": "synthesizer",
        "FINISH": END
    }
)

workflow.set_entry_point("supervisor")

graph = workflow.compile(checkpointer=memory)
```

### Advanced: Context-Aware Supervisor

```python
def create_smart_supervisor(agents: list[str], agent_capabilities: dict):
    """Supervisor that understands agent capabilities"""

    supervisor_prompt = f"""
    You are an intelligent supervisor managing: {agents}

    Agent Capabilities:
    {format_capabilities(agent_capabilities)}

    Consider:
    1. Agent expertise and past performance
    2. Current workload and availability
    3. Task complexity and requirements
    4. Dependencies between tasks

    Route to the most suitable agent. Return FINISH when complete.
    """

    def supervisor_with_metrics(state: SupervisorState):
        # Track agent performance
        performance = state.get("agent_performance", {})

        # Analyze current state
        current_context = analyze_context(state)

        # Get supervisor decision
        llm = ChatAnthropic(model="claude-opus-4-8")
        decision = llm.invoke([
            SystemMessage(content=supervisor_prompt),
            *state["messages"],
            HumanMessage(content=f"Context: {current_context}\nPerformance: {performance}")
        ])

        next_agent = extract_next_agent(decision)

        # Update metrics
        if next_agent != "FINISH":
            performance[next_agent] = performance.get(next_agent, 0) + 1

        return {
            "next": next_agent,
            "messages": [decision],
            "agent_performance": performance
        }

    return supervisor_with_metrics
```

---

## 2. Swarm Pattern

### Pattern Overview

**Architecture:**
```
   ┌────────┐         ┌────────┐
   │ Agent1 │◄───────►│ Agent2 │
   └───┬────┘         └───┬────┘
       │                  │
       │    ┌────────┐    │
       └───►│ Agent3 │◄───┘
            └───┬────┘
                │
            ┌───▼────┐
            │ Agent4 │
            └────────┘
```

**When to Use:**
- Peer-to-peer collaboration needed
- Agents should self-organize
- Want emergent problem-solving behavior
- No clear hierarchy

**When NOT to Use:**
- Need centralized control
- Require predictable routing
- Want explicit monitoring
- Clear authority needed

### Implementation

```python
from langgraph_swarm import create_swarm_agent, Handoff, create_swarm_graph

class SwarmState(TypedDict):
    """Shared state for swarm agents"""
    messages: Annotated[list[BaseMessage], operator.add]
    context: dict
    handoff_history: list[str]
    current_agent: str

# Create swarm agents with handoff capabilities
def create_research_swarm_agent():
    """Research agent with peer handoffs"""

    # Define who this agent can hand off to
    handoff_to_analyst = Handoff(
        target="analyst",
        description="Hand off to analyst when research data needs analysis"
    )

    handoff_to_fact_checker = Handoff(
        target="fact_checker",
        description="Hand off to fact checker to verify findings"
    )

    handoff_to_writer = Handoff(
        target="writer",
        description="Hand off to writer when research is complete"
    )

    return create_swarm_agent(
        name="researcher",
        instructions="""
        You are a research specialist in the swarm.

        Your role:
        - Gather information from sources
        - Identify key findings
        - Hand off to fact checker for verification
        - Hand off to analyst if data analysis needed
        - Hand off to writer when research complete

        Collaborate with peers via handoffs.
        """,
        llm=ChatAnthropic(model="claude-sonnet-5"),
        handoffs=[handoff_to_analyst, handoff_to_fact_checker, handoff_to_writer]
    )

def create_analyst_swarm_agent():
    """Analysis agent with peer handoffs"""

    handoff_to_researcher = Handoff(
        target="researcher",
        description="Request more data from researcher"
    )

    handoff_to_writer = Handoff(
        target="writer",
        description="Hand off analysis to writer"
    )

    return create_swarm_agent(
        name="analyst",
        instructions="""
        You are an analysis specialist in the swarm.

        Your role:
        - Analyze data and identify patterns
        - Request more data if needed
        - Hand off insights to writer

        Collaborate with peers via handoffs.
        """,
        llm=ChatAnthropic(model="claude-sonnet-5"),
        handoffs=[handoff_to_researcher, handoff_to_writer]
    )

def create_fact_checker_swarm_agent():
    """Fact checking agent"""

    handoff_to_researcher = Handoff(
        target="researcher",
        description="Request re-research if facts don't check out"
    )

    handoff_to_writer = Handoff(
        target="writer",
        description="Approve and hand to writer"
    )

    return create_swarm_agent(
        name="fact_checker",
        instructions="""
        You are a fact checker in the swarm.

        Your role:
        - Verify research findings
        - Request re-research if issues found
        - Approve and hand to writer when verified

        Collaborate with peers via handoffs.
        """,
        llm=ChatAnthropic(model="claude-sonnet-5"),
        handoffs=[handoff_to_researcher, handoff_to_writer]
    )

def create_writer_swarm_agent():
    """Writer agent (can complete workflow)"""

    handoff_to_researcher = Handoff(
        target="researcher",
        description="Request more information"
    )

    handoff_to_analyst = Handoff(
        target="analyst",
        description="Request deeper analysis"
    )

    return create_swarm_agent(
        name="writer",
        instructions="""
        You are a writer in the swarm.

        Your role:
        - Create final output from research and analysis
        - Request more information if needed
        - Mark task complete when output is ready

        You can complete the workflow or hand back for more work.
        """,
        llm=ChatAnthropic(model="claude-sonnet-5"),
        handoffs=[handoff_to_researcher, handoff_to_analyst],
        can_complete=True  # Can end the workflow
    )

# Build swarm
agents = {
    "researcher": create_research_swarm_agent(),
    "analyst": create_analyst_swarm_agent(),
    "fact_checker": create_fact_checker_swarm_agent(),
    "writer": create_writer_swarm_agent()
}

swarm = create_swarm_graph(
    agents=agents,
    initial_agent="researcher",
    state_schema=SwarmState
)

graph = swarm.compile(checkpointer=memory)
```

### Advanced: Adaptive Swarm

```python
def create_adaptive_swarm_agent(
    name: str,
    base_instructions: str,
    potential_handoffs: dict[str, Handoff]
):
    """Swarm agent that adapts handoffs based on context"""

    def adaptive_handoff_logic(state: SwarmState) -> list[Handoff]:
        """Determine available handoffs based on state"""
        available = []

        # Analyze state to determine relevant handoffs
        complexity = assess_complexity(state)
        urgency = assess_urgency(state)
        quality = assess_quality(state)

        # Add handoffs based on conditions
        if complexity > 0.8 and "expert" in potential_handoffs:
            available.append(potential_handoffs["expert"])

        if urgency < 0.3 and "researcher" in potential_handoffs:
            available.append(potential_handoffs["researcher"])

        if quality < 0.7 and "reviewer" in potential_handoffs:
            available.append(potential_handoffs["reviewer"])

        # Always include completion if applicable
        if "complete" in potential_handoffs:
            available.append(potential_handoffs["complete"])

        return available

    return create_swarm_agent(
        name=name,
        instructions=base_instructions,
        llm=ChatAnthropic(model="claude-opus-4-8"),
        handoffs=adaptive_handoff_logic  # Dynamic handoffs
    )
```

---

## 3. Hierarchical Teams Pattern

### Pattern Overview

**Architecture:**
```
            ┌─────────────────┐
            │ Main Supervisor │
            └────────┬─────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
   ┌────▼─────┐ ┌───▼────┐ ┌────▼─────┐
   │Research  │ │  Dev   │ │   QA     │
   │Supervisor│ │Supervisor│ │Supervisor│
   └────┬─────┘ └───┬────┘ └────┬─────┘
        │           │            │
   ┌────┼─────┐ ┌───┼────┐  ┌───┼─────┐
   │    │     │ │   │    │  │   │     │
  R1   R2   R3 D1  D2  D3 Q1  Q2  Q3
```

**When to Use:**
- Large teams (> 15 agents)
- Clear organizational structure
- Multiple coordination levels needed
- Different teams with different responsibilities

**When NOT to Use:**
- Small teams (< 5 agents)
- Flat organization preferred
- Simplicity prioritized over structure

### Implementation

```python
def create_team_subgraph(
    team_name: str,
    members: list[str],
    supervisor_prompt: str
) -> StateGraph:
    """Create team with internal supervisor"""

    class TeamState(TypedDict):
        messages: Annotated[list[BaseMessage], operator.add]
        next: str
        team_context: dict
        team_output: dict

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
        member_node = create_agent_node(member)
        team_graph.add_node(member, member_node)
        team_graph.add_edge(member, "team_supervisor")

    # Routing
    team_graph.add_conditional_edges(
        "team_supervisor",
        lambda x: x["next"],
        {**{m: m for m in members}, "FINISH": END}
    )

    team_graph.set_entry_point("team_supervisor")

    return team_graph.compile()

# Create specialized teams
research_team = create_team_subgraph(
    team_name="research_team",
    members=["web_researcher", "paper_researcher", "data_analyst"],
    supervisor_prompt="""
    You manage research specialists:
    - web_researcher: Searches web sources
    - paper_researcher: Searches academic papers
    - data_analyst: Analyzes collected data

    Coordinate research tasks and return FINISH when research complete.
    """
)

dev_team = create_team_subgraph(
    team_name="dev_team",
    members=["frontend_dev", "backend_dev", "devops"],
    supervisor_prompt="""
    You manage development specialists:
    - frontend_dev: UI implementation
    - backend_dev: API and business logic
    - devops: Deployment and infrastructure

    Coordinate development tasks and return FINISH when implementation complete.
    """
)

qa_team = create_team_subgraph(
    team_name="qa_team",
    members=["test_writer", "test_runner", "bug_reporter"],
    supervisor_prompt="""
    You manage QA specialists:
    - test_writer: Creates test cases
    - test_runner: Executes tests
    - bug_reporter: Documents issues

    Coordinate QA tasks and return FINISH when testing complete.
    """
)

# Main supervisor coordinates teams
class HierarchicalState(TypedDict):
    messages: Annotated[list[BaseMessage], operator.add]
    next_team: str
    team_outputs: dict
    project_status: dict

main_supervisor_prompt = """
You are the main supervisor coordinating three teams:
- research_team: Gathers requirements and information
- dev_team: Implements solutions
- qa_team: Tests and validates

Route work to appropriate teams. Typical flow:
1. Research team gathers requirements
2. Dev team implements
3. QA team validates
4. Iterate as needed

Return FINISH when project complete.
"""

main_supervisor = create_supervisor_node(
    llm=ChatAnthropic(model="claude-opus-4-8"),
    prompt=main_supervisor_prompt,
    agents=["research_team", "dev_team", "qa_team"]
)

# Build main graph
workflow = StateGraph(HierarchicalState)
workflow.add_node("main_supervisor", main_supervisor)
workflow.add_node("research_team", research_team)
workflow.add_node("dev_team", dev_team)
workflow.add_node("qa_team", qa_team)

# Teams report back to main supervisor
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

graph = workflow.compile(checkpointer=memory)
```

---

## 4. Parallel Execution Pattern

### Pattern Overview

**Architecture:**
```
      ┌─────────────┐
      │ Coordinator │
      └──────┬──────┘
             │
     ┌───────┼───────┐
     │       │       │
 ┌───▼──┐ ┌──▼──┐ ┌─▼───┐
 │Agent1│ │Agent2│ │Agent3│
 └───┬──┘ └──┬──┘ └─┬───┘
     │       │      │
     └───────┼──────┘
             │
      ┌──────▼──────┐
      │  Aggregator │
      └─────────────┘
```

**When to Use:**
- Independent tasks that can run concurrently
- Batch processing requirements
- Need to maximize throughput
- Tasks don't depend on each other

**Implementation:**

```python
from langgraph.constants import Send

class ParallelState(TypedDict):
    """State for parallel execution"""
    tasks: list[dict]
    results: Annotated[list, operator.add]
    aggregated_result: dict

def coordinator(state: ParallelState):
    """Fan out to parallel workers"""
    return [
        Send("worker", {"task": task, "index": i})
        for i, task in enumerate(state["tasks"])
    ]

def worker(state: dict):
    """Process individual task"""
    task = state["task"]
    index = state["index"]

    result = process_task(task)

    return {"results": [{"index": index, "result": result}]}

def aggregator(state: ParallelState):
    """Aggregate parallel results"""
    sorted_results = sorted(state["results"], key=lambda x: x["index"])
    final = combine_results([r["result"] for r in sorted_results])

    return {"aggregated_result": final}

# Build graph
workflow = StateGraph(ParallelState)
workflow.add_node("coordinator", coordinator)
workflow.add_node("worker", worker)
workflow.add_node("aggregator", aggregator)

workflow.add_edge(START, "coordinator")
workflow.add_conditional_edges(
    "coordinator",
    lambda x: x,  # Returns Send objects
    ["worker"]
)
workflow.add_edge("worker", "aggregator")
workflow.add_edge("aggregator", END)

graph = workflow.compile()
```

---

## Communication Protocols

### 1. Message Passing

```python
class AgentMessage(TypedDict):
    """Structured message between agents"""
    from_agent: str
    to_agent: str
    message_type: str  # "request", "response", "notification"
    content: str
    metadata: dict
    timestamp: datetime

def send_agent_message(
    state: State,
    from_agent: str,
    to_agent: str,
    content: str,
    message_type: str = "request"
) -> State:
    """Send structured message to another agent"""

    message = AgentMessage(
        from_agent=from_agent,
        to_agent=to_agent,
        message_type=message_type,
        content=content,
        metadata={"context": state.get("context", {})},
        timestamp=datetime.now()
    )

    return {"messages": [HumanMessage(content=str(message))]}
```

### 2. Shared Context

```python
def update_shared_context(
    state: State,
    agent_name: str,
    updates: dict
) -> State:
    """Update shared context visible to all agents"""

    context = state.get("shared_context", {})

    # Add agent attribution
    updates["_updated_by"] = agent_name
    updates["_updated_at"] = datetime.now().isoformat()

    # Merge updates
    context = deep_merge(context, updates)

    return {"shared_context": context}
```

### 3. Event Broadcasting

```python
class AgentEvent(TypedDict):
    """Event broadcast to all agents"""
    event_type: str  # "task_complete", "error", "status_update"
    agent: str
    data: dict
    timestamp: datetime

def broadcast_event(
    state: State,
    event_type: str,
    agent: str,
    data: dict
) -> State:
    """Broadcast event to all agents"""

    event = AgentEvent(
        event_type=event_type,
        agent=agent,
        data=data,
        timestamp=datetime.now()
    )

    events = state.get("events", [])
    events.append(event)

    return {"events": events}
```

---

## Best Practices

### 1. Pattern Selection
- Start simple (supervisor) and evolve to complex (hierarchical) as needed
- Use swarm for creative/collaborative tasks
- Use supervisor for structured/predictable tasks
- Use hierarchical only for large-scale (> 15 agents)

### 2. State Management
- Minimize shared state
- Use clear communication protocols
- Track agent history
- Implement state cleanup

### 3. Error Handling
- Timeout handling for stuck agents
- Fallback agents for failures
- Circuit breakers for repeated failures
- Graceful degradation

### 4. Monitoring
- Track agent utilization
- Measure handoff efficiency
- Monitor coordination overhead
- Identify bottlenecks

### 5. Testing
- Test each agent independently
- Test coordination logic
- Test failure scenarios
- Load testing for parallel patterns

---

## Resources

- **LangGraph Supervisor:** https://github.com/langchain-ai/langgraph/tree/main/libs/supervisor
- **LangGraph Swarm:** https://github.com/langchain-ai/langgraph/tree/main/libs/swarm
- **Multi-Agent Examples:** https://github.com/langchain-ai/langgraph/tree/main/examples/multi_agent

---

**Use this skill when designing multi-agent systems to select and implement the optimal orchestration pattern for your requirements.**
