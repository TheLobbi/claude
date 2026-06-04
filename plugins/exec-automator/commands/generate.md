---
name: exec:generate
intent: Generate production-ready LangGraph workflow code from scored automation designs
tags:
  - generation
  - langgraph
  - langchain
  - code
  - automation
inputs: []
risk: medium
cost: medium
description: Generate production-ready LangGraph workflow code from scored automation designs
model: sonnet
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
  - TodoWrite
  - mcp__exec-automator__generate_langgraph_workflow
  - mcp__exec-automator__score_automation_potential
  - mcp__obsidian__obsidian_append_content
  - mcp__obsidian__obsidian_get_file_contents
---

# LangGraph Workflow Code Generator

Transform scored automation opportunities into production-ready LangGraph/LangChain workflow implementations. This command generates complete Python workflow files with state management, node implementations, conditional routing, error handling, checkpointing, and human-in-the-loop controls.

## COMMAND OVERVIEW

**Purpose:** Generate executable LangGraph workflow code from automation analysis results

**Inputs:** Scored responsibility analysis JSON (from `/exec:orchestrate` Phase 3 or manual scoring)

**Outputs:** Complete Python workflow files, agent configs, state schemas, tool definitions, tests, and documentation

**Automation Tiers:**
- **FULL** (Score 80-100): Fully autonomous workflows, minimal human oversight
- **PARTIAL** (Score 50-79): Semi-autonomous, human approval checkpoints
- **ASSISTED** (Score 20-49): AI-assisted workflows, human-in-the-loop at every step
- **ALL**: Generate workflows for all tiers

---

## EXECUTION PROTOCOL

You are the **LangGraph Code Generator**, a specialized agent that transforms automation designs into production-ready Python code. Your mission is to:

1. **Parse scored automation analysis** - Load JSON with automation scores and process maps
2. **Generate LangGraph workflows** - Create StateGraph implementations for each responsibility
3. **Configure specialized agents** - Design LangChain agent configurations with proper prompts
4. **Implement state management** - Define TypedDict schemas with proper annotations
5. **Build conditional routing** - Create routing functions for complex decision logic
6. **Add error handling** - Implement retry logic, fallbacks, and error recovery
7. **Configure checkpointing** - Set up persistence for long-running workflows
8. **Create tool integrations** - Connect external APIs, databases, and services
9. **Generate test scaffolding** - Create unit and integration tests
10. **Document everything** - Generate comprehensive documentation and runbooks

---

## INPUT PARAMETERS

Parse the user's command to extract:

### Required Arguments
- **input-file**: Path to scored analysis JSON file
  - From `/exec:orchestrate` Phase 3: `{output-dir}/03-scoring/automation-scores.json`
  - From manual scoring: Any JSON with required fields
  - Special value `"latest"`: Auto-find most recent analysis file

### Optional Arguments
- **--tier**: Which automation tier(s) to generate (default: `all`)
  - `full` - Generate only fully autonomous workflows (score 80-100)
  - `partial` - Generate semi-autonomous workflows (score 50-79)
  - `assisted` - Generate assisted workflows (score 20-49)
  - `all` - Generate workflows for all tiers

- **--output**: Output directory for generated code (default: `./generated-workflows`)
  - Creates subdirectories: `workflows/`, `configs/`, `schemas/`, `tools/`, `tests/`, `docs/`

- **--include-tests**: Generate pytest test files (default: `false`)
  - Creates test fixtures, mocks, and test cases for each workflow

- **--include-docs**: Generate detailed documentation (default: `true`)
  - Creates README.md, architecture diagrams, API docs, runbooks

- **--format**: Code format style (default: `production`)
  - `production` - Full error handling, logging, monitoring
  - `prototype` - Simplified code for quick testing
  - `tutorial` - Heavily commented code for learning

- **--models**: LLM models to use (default: `claude-sonnet-4-6`)
  - Comma-separated list: `claude-sonnet-4-6,gpt-4,gemini-pro`
  - Generator will create model-specific configurations

---

## OUTPUT STRUCTURE

Create the following directory structure:

```
{output-dir}/
├── workflows/
│   ├── full_automation/
│   │   ├── workflow_001_board_meeting_coordination.py
│   │   ├── workflow_003_member_communication.py
│   │   └── ...
│   ├── partial_automation/
│   │   ├── workflow_007_financial_reporting.py
│   │   ├── workflow_009_strategic_planning.py
│   │   └── ...
│   ├── assisted_automation/
│   │   ├── workflow_015_crisis_management.py
│   │   └── ...
│   └── __init__.py
├── configs/
│   ├── agents/
│   │   ├── board_coordinator_agent.json
│   │   ├── communication_agent.json
│   │   └── ...
│   ├── checkpointers/
│   │   ├── sqlite_checkpointer.json
│   │   ├── redis_checkpointer.json
│   │   └── ...
│   └── monitoring/
│       ├── langsmith_config.json
│       ├── logging_config.json
│       └── alerts_config.json
├── schemas/
│   ├── workflow_001_state.py
│   ├── workflow_003_state.py
│   └── common_types.py
├── tools/
│   ├── email_tools.py
│   ├── calendar_tools.py
│   ├── document_tools.py
│   ├── database_tools.py
│   └── __init__.py
├── tests/
│   ├── test_workflow_001.py
│   ├── test_workflow_003.py
│   ├── fixtures/
│   │   ├── sample_inputs.json
│   │   └── expected_outputs.json
│   └── conftest.py
├── docs/
│   ├── README.md
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   ├── RUNBOOK.md
│   ├── API_REFERENCE.md
│   └── diagrams/
│       ├── workflow_001_flow.mermaid
│       └── ...
├── requirements.txt
├── pyproject.toml
├── .env.example
└── GENERATION_REPORT.md
```

---

## GENERATION WORKFLOW

### STEP 1: Load and Parse Input

1. **Locate Input File**
   ```python
   if input_file == "latest":
       # Find most recent automation-scores.json
       input_file = find_latest_scoring_file()

   # Load scoring data
   scoring_data = Read(file_path=input_file)
   parsed_data = json.loads(scoring_data)
   ```

2. **Validate Input Schema**
   - Check required fields: `responsibility_id`, `title`, `automation_scores`, `composite_score`, `process_map`
   - Verify score ranges (0-100)
   - Validate process map structure

3. **Filter by Tier**
   ```python
   def filter_by_tier(responsibilities, tier):
       if tier == "full":
           return [r for r in responsibilities if r["composite_score"] >= 80]
       elif tier == "partial":
           return [r for r in responsibilities if 50 <= r["composite_score"] < 80]
       elif tier == "assisted":
           return [r for r in responsibilities if 20 <= r["composite_score"] < 50]
       else:  # all
           return [r for r in responsibilities if r["composite_score"] >= 20]
   ```

### STEP 2: Design Workflow Architecture

For each responsibility, spawn **Workflow Architect Agent** to design:

1. **State Schema**
   - Identify all state fields needed
   - Determine state reducers (operator.add, custom functions)
   - Plan for checkpointing fields

2. **Node Topology**
   - Map process steps to LangGraph nodes
   - Identify agent nodes (LLM-powered)
   - Identify tool nodes (API calls, database queries)
   - Identify human-in-the-loop nodes

3. **Edge Logic**
   - Simple sequential edges
   - Conditional routing edges
   - Loop detection and prevention
   - Error recovery paths

4. **Integration Requirements**
   - External APIs needed
   - Database connections
   - File system operations
   - Email/SMS/Slack notifications

### STEP 3: Generate State Schemas

For each workflow, generate a state schema file:

**File:** `schemas/workflow_{id}_state.py`

```python
"""
State schema for: {responsibility_title}
Automation Score: {composite_score}
Generated: {timestamp}
"""

from typing import TypedDict, Annotated, Literal, Sequence, Optional
from langchain_core.messages import BaseMessage
from datetime import datetime
import operator


class Workflow{ID}State(TypedDict):
    """State schema for {responsibility_title} workflow."""

    # Core Input/Output
    input_data: dict
    """Raw input data for the workflow"""

    output_data: Optional[dict]
    """Final output data after workflow completion"""

    # Agent Communication
    messages: Annotated[Sequence[BaseMessage], operator.add]
    """Message history for agent interactions"""

    # Workflow Control
    current_step: str
    """Current step in the workflow (node name)"""

    previous_step: Optional[str]
    """Previous step in the workflow"""

    step_history: Annotated[list[str], operator.add]
    """Complete history of steps executed"""

    # Error Handling
    errors: Annotated[list[dict], operator.add]
    """List of errors encountered during execution"""

    retry_count: int
    """Number of retry attempts for current step"""

    max_retries: int
    """Maximum retry attempts allowed"""

    # Business Context
    context: dict
    """Business-specific context and metadata"""

    responsibility_metadata: dict
    """Metadata about the responsibility being automated"""

    # Status Tracking
    status: Literal["pending", "processing", "awaiting_human", "completed", "failed"]
    """Current workflow status"""

    started_at: datetime
    """Workflow start timestamp"""

    completed_at: Optional[datetime]
    """Workflow completion timestamp"""

    # Results Accumulation
    step_results: Annotated[dict, operator.add]
    """Results from individual workflow steps"""

    final_result: Optional[dict]
    """Final workflow result"""

    # Human-in-the-Loop
    human_feedback: Optional[dict]
    """Human feedback provided at checkpoints"""

    requires_human_review: bool
    """Flag indicating if human review is required"""

    # Monitoring
    execution_metrics: dict
    """Performance and cost metrics"""


# Custom state reducer for merging context
def merge_context(existing: dict, new: dict) -> dict:
    """Merge context dictionaries, new values override existing."""
    return {**existing, **new}


# Alternative state with custom reducer
class Workflow{ID}StateWithReducer(TypedDict):
    """Enhanced state schema with custom reducers."""

    context: Annotated[dict, merge_context]
    # ... other fields same as above
```

### STEP 4: Generate Node Implementations

For each node in the workflow topology, generate implementation:

**File:** `workflows/{tier}/workflow_{id}_{name}.py` (excerpt - node section)

```python
"""
LangGraph Workflow: {responsibility_title}
Automation Tier: {tier}
Automation Score: {composite_score}/100
Estimated Monthly Hours Saved: {hours_saved}
Generated: {timestamp}
"""

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.sqlite import SqliteSaver
from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from typing import Optional
import logging
from datetime import datetime

from ..schemas.workflow_{id}_state import Workflow{ID}State
from ..tools.email_tools import send_email
from ..tools.calendar_tools import schedule_meeting
from ..tools.document_tools import generate_document

# Configure logging
logger = logging.getLogger(__name__)


# ============================================================================
# NODE IMPLEMENTATIONS
# ============================================================================

def initialize_node(state: Workflow{ID}State) -> Workflow{ID}State:
    """
    Initialize workflow with input validation and context setup.

    This is the entry point for the workflow. It validates input data,
    sets up business context, and initializes state fields.
    """
    logger.info(f"Initializing workflow for: {state['input_data']}")

    try:
        # Validate input
        required_fields = ["field1", "field2", "field3"]
        missing_fields = [f for f in required_fields if f not in state["input_data"]]

        if missing_fields:
            return {
                **state,
                "errors": [{
                    "type": "validation_error",
                    "message": f"Missing required fields: {missing_fields}",
                    "timestamp": datetime.now().isoformat()
                }],
                "status": "failed"
            }

        # Set up context
        context = {
            "workflow_id": "workflow_{id}",
            "responsibility_title": "{responsibility_title}",
            "automation_tier": "{tier}",
            "initiated_by": state["input_data"].get("user_id", "system"),
            "priority": state["input_data"].get("priority", "normal")
        }

        return {
            **state,
            "current_step": "initialized",
            "status": "processing",
            "started_at": datetime.now(),
            "context": {**state.get("context", {}), **context},
            "step_history": ["initialize"],
            "retry_count": 0,
            "max_retries": 3,
            "requires_human_review": False
        }

    except Exception as e:
        logger.error(f"Initialization error: {e}")
        return {
            **state,
            "errors": [{
                "type": "initialization_error",
                "message": str(e),
                "timestamp": datetime.now().isoformat()
            }],
            "status": "failed"
        }


def agent_analysis_node(state: Workflow{ID}State) -> Workflow{ID}State:
    """
    AI agent analyzes input and determines processing strategy.

    Uses Claude Sonnet to analyze the input data and make intelligent
    decisions about how to proceed with the workflow.
    """
    logger.info("Running agent analysis")

    try:
        # Initialize LLM
        llm = ChatAnthropic(
            model="claude-sonnet-4-6",
            temperature=0.3,
            max_tokens=4000
        )

        # Create prompt
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an AI assistant specializing in {responsibility_title}.

Your task is to analyze the input data and determine the best approach
for processing this request. Consider:

1. Complexity of the request
2. Available information completeness
3. Risk factors
4. Required approvals or reviews
5. Time sensitivity

Provide your analysis in JSON format with fields:
- complexity: "low" | "medium" | "high"
- completeness: 0-100 score
- risk_level: "low" | "medium" | "high"
- requires_human_review: true | false
- recommended_approach: string
- confidence: 0-100 score
"""),
            ("human", "Input data: {input_data}\n\nContext: {context}")
        ])

        # Invoke agent
        messages = prompt.format_messages(
            input_data=state["input_data"],
            context=state["context"]
        )

        response = llm.invoke(messages)

        # Parse analysis (simplified - add proper JSON parsing)
        analysis = eval(response.content)  # TODO: Use proper JSON parsing

        # Update state with analysis
        return {
            **state,
            "current_step": "analyzed",
            "messages": list(state.get("messages", [])) + [response],
            "step_results": {
                **state.get("step_results", {}),
                "analysis": analysis
            },
            "step_history": list(state.get("step_history", [])) + ["analyze"],
            "requires_human_review": analysis.get("requires_human_review", False),
            "context": {
                **state.get("context", {}),
                "complexity": analysis.get("complexity"),
                "risk_level": analysis.get("risk_level")
            }
        }

    except Exception as e:
        logger.error(f"Agent analysis error: {e}")
        return {
            **state,
            "errors": list(state.get("errors", [])) + [{
                "type": "agent_error",
                "message": str(e),
                "node": "agent_analysis",
                "timestamp": datetime.now().isoformat()
            }],
            "retry_count": state.get("retry_count", 0) + 1
        }


def tool_execution_node(state: Workflow{ID}State) -> Workflow{ID}State:
    """
    Execute external tools and API integrations.

    This node calls external services like email, calendar, database, etc.
    based on the workflow requirements.
    """
    logger.info("Executing external tools")

    try:
        results = {}

        # Example: Send email notification
        if state["context"].get("notify_stakeholders"):
            email_result = send_email(
                to=state["input_data"].get("stakeholder_emails"),
                subject=f"Update: {state['context']['responsibility_title']}",
                body=generate_email_body(state),
                attachments=state.get("attachments", [])
            )
            results["email_sent"] = email_result

        # Example: Schedule meeting
        if state["context"].get("schedule_meeting"):
            meeting_result = schedule_meeting(
                title=state["input_data"].get("meeting_title"),
                attendees=state["input_data"].get("attendees"),
                duration_minutes=state["input_data"].get("duration", 60),
                proposed_times=state["input_data"].get("proposed_times")
            )
            results["meeting_scheduled"] = meeting_result

        # Example: Generate document
        if state["context"].get("generate_document"):
            doc_result = generate_document(
                template=state["input_data"].get("template_id"),
                data=state["step_results"].get("analysis"),
                output_format=state["input_data"].get("format", "pdf")
            )
            results["document_generated"] = doc_result

        return {
            **state,
            "current_step": "tools_executed",
            "step_results": {
                **state.get("step_results", {}),
                "tool_execution": results
            },
            "step_history": list(state.get("step_history", [])) + ["execute_tools"]
        }

    except Exception as e:
        logger.error(f"Tool execution error: {e}")
        return {
            **state,
            "errors": list(state.get("errors", [])) + [{
                "type": "tool_error",
                "message": str(e),
                "node": "tool_execution",
                "timestamp": datetime.now().isoformat()
            }],
            "retry_count": state.get("retry_count", 0) + 1
        }


def human_review_node(state: Workflow{ID}State) -> Workflow{ID}State:
    """
    Pause workflow for human review and approval.

    This node marks the state as awaiting human input. The workflow
    will be interrupted here, and can be resumed via graph.update_state()
    after human provides feedback.
    """
    logger.info("Pausing for human review")

    # Prepare review package
    review_package = {
        "workflow_id": state["context"]["workflow_id"],
        "responsibility": state["context"]["responsibility_title"],
        "input_summary": summarize_input(state["input_data"]),
        "analysis_results": state["step_results"].get("analysis"),
        "tool_execution_results": state["step_results"].get("tool_execution"),
        "recommended_action": state["step_results"].get("analysis", {}).get("recommended_approach"),
        "risk_level": state["context"].get("risk_level", "unknown")
    }

    return {
        **state,
        "current_step": "awaiting_human_review",
        "status": "awaiting_human",
        "context": {
            **state.get("context", {}),
            "review_package": review_package
        },
        "step_history": list(state.get("step_history", [])) + ["human_review"]
    }


def finalize_node(state: Workflow{ID}State) -> Workflow{ID}State:
    """
    Finalize workflow and prepare final output.

    This is the exit node that aggregates all results, updates status,
    and prepares the final workflow output.
    """
    logger.info("Finalizing workflow")

    try:
        # Aggregate results
        final_result = {
            "workflow_id": state["context"]["workflow_id"],
            "responsibility": state["context"]["responsibility_title"],
            "status": "completed",
            "input_data": state["input_data"],
            "analysis": state["step_results"].get("analysis"),
            "tool_results": state["step_results"].get("tool_execution"),
            "human_feedback": state.get("human_feedback"),
            "execution_time_seconds": (
                datetime.now() - state["started_at"]
            ).total_seconds(),
            "steps_executed": state["step_history"],
            "error_count": len(state.get("errors", []))
        }

        return {
            **state,
            "current_step": "finalized",
            "status": "completed",
            "completed_at": datetime.now(),
            "final_result": final_result,
            "output_data": final_result,
            "step_history": list(state.get("step_history", [])) + ["finalize"]
        }

    except Exception as e:
        logger.error(f"Finalization error: {e}")
        return {
            **state,
            "errors": list(state.get("errors", [])) + [{
                "type": "finalization_error",
                "message": str(e),
                "timestamp": datetime.now().isoformat()
            }],
            "status": "failed"
        }


def error_handler_node(state: Workflow{ID}State) -> Workflow{ID}State:
    """
    Handle errors and determine recovery strategy.

    Centralized error handling node that analyzes errors and decides
    whether to retry, escalate, or fail gracefully.
    """
    logger.warning(f"Handling errors: {state['errors']}")

    errors = state.get("errors", [])
    retry_count = state.get("retry_count", 0)
    max_retries = state.get("max_retries", 3)

    # Analyze error types
    critical_errors = [e for e in errors if e.get("type") in ["validation_error", "critical_error"]]
    transient_errors = [e for e in errors if e.get("type") in ["agent_error", "tool_error"]]

    # Determine recovery strategy
    if critical_errors:
        # Critical errors cannot be retried
        recovery_strategy = "fail"
    elif retry_count >= max_retries:
        # Max retries exceeded
        recovery_strategy = "escalate"
    elif transient_errors:
        # Retry transient errors
        recovery_strategy = "retry"
    else:
        # Unknown error type, escalate
        recovery_strategy = "escalate"

    return {
        **state,
        "current_step": "error_handled",
        "context": {
            **state.get("context", {}),
            "recovery_strategy": recovery_strategy,
            "error_summary": {
                "total_errors": len(errors),
                "critical_errors": len(critical_errors),
                "transient_errors": len(transient_errors),
                "retry_count": retry_count
            }
        },
        "step_history": list(state.get("step_history", [])) + ["error_handler"]
    }


# ============================================================================
# ROUTING FUNCTIONS
# ============================================================================

def analysis_router(state: Workflow{ID}State) -> str:
    """
    Route based on agent analysis results.

    Determines next step based on the complexity and risk level
    identified during analysis.
    """
    analysis = state["step_results"].get("analysis", {})

    # Check if human review is required
    if state.get("requires_human_review") or analysis.get("requires_human_review"):
        return "human_review"

    # Check complexity and risk
    complexity = analysis.get("complexity", "medium")
    risk_level = analysis.get("risk_level", "medium")

    if complexity == "high" or risk_level == "high":
        return "human_review"
    elif complexity == "low" and risk_level == "low":
        return "auto_execute"
    else:
        return "careful_execution"


def error_recovery_router(state: Workflow{ID}State) -> str:
    """
    Route based on error recovery strategy.

    Determines whether to retry, escalate, or fail based on
    error analysis.
    """
    recovery_strategy = state["context"].get("recovery_strategy", "escalate")

    if recovery_strategy == "retry":
        # Clear errors and retry from previous step
        return "retry"
    elif recovery_strategy == "escalate":
        # Send to human review
        return "escalate_to_human"
    else:
        # Fail gracefully
        return "fail"


def completion_check_router(state: Workflow{ID}State) -> str:
    """
    Check if workflow is complete or needs more processing.
    """
    errors = state.get("errors", [])

    if errors:
        return "handle_errors"

    if state.get("requires_human_review") and not state.get("human_feedback"):
        return "await_human"

    return "finalize"


# ============================================================================
# WORKFLOW GRAPH CONSTRUCTION
# ============================================================================

def create_workflow() -> StateGraph:
    """
    Build the complete LangGraph workflow.

    Returns:
        Compiled StateGraph ready for execution
    """
    # Initialize graph
    workflow = StateGraph(Workflow{ID}State)

    # Add nodes
    workflow.add_node("initialize", initialize_node)
    workflow.add_node("analyze", agent_analysis_node)
    workflow.add_node("execute_tools", tool_execution_node)
    workflow.add_node("human_review", human_review_node)
    workflow.add_node("finalize", finalize_node)
    workflow.add_node("error_handler", error_handler_node)

    # Set entry point
    workflow.set_entry_point("initialize")

    # Add edges
    workflow.add_edge("initialize", "analyze")

    # Conditional routing after analysis
    workflow.add_conditional_edges(
        "analyze",
        analysis_router,
        {
            "human_review": "human_review",
            "auto_execute": "execute_tools",
            "careful_execution": "execute_tools"
        }
    )

    # After tool execution
    workflow.add_conditional_edges(
        "execute_tools",
        completion_check_router,
        {
            "handle_errors": "error_handler",
            "await_human": "human_review",
            "finalize": "finalize"
        }
    )

    # After human review
    workflow.add_edge("human_review", "finalize")

    # Error recovery routing
    workflow.add_conditional_edges(
        "error_handler",
        error_recovery_router,
        {
            "retry": "analyze",  # Retry from analysis
            "escalate_to_human": "human_review",
            "fail": "finalize"  # Fail gracefully
        }
    )

    # Finalize to END
    workflow.add_edge("finalize", END)

    return workflow


# ============================================================================
# WORKFLOW EXECUTION
# ============================================================================

def run_workflow(
    input_data: dict,
    thread_id: str,
    checkpointer_path: str = "checkpoints.db"
) -> dict:
    """
    Execute the workflow with checkpointing.

    Args:
        input_data: Input data for the workflow
        thread_id: Unique thread ID for checkpointing
        checkpointer_path: Path to SQLite checkpoint database

    Returns:
        Final workflow state
    """
    # Create checkpointer
    checkpointer = SqliteSaver.from_conn_string(checkpointer_path)

    # Compile workflow
    graph = create_workflow().compile(
        checkpointer=checkpointer,
        interrupt_before=["human_review"]  # Pause before human review
    )

    # Prepare initial state
    initial_state = {
        "input_data": input_data,
        "output_data": None,
        "messages": [],
        "current_step": "pending",
        "previous_step": None,
        "step_history": [],
        "errors": [],
        "retry_count": 0,
        "max_retries": 3,
        "context": {},
        "responsibility_metadata": {
            "id": "{id}",
            "title": "{responsibility_title}",
            "automation_score": {composite_score},
            "tier": "{tier}"
        },
        "status": "pending",
        "started_at": None,
        "completed_at": None,
        "step_results": {},
        "final_result": None,
        "human_feedback": None,
        "requires_human_review": False,
        "execution_metrics": {}
    }

    # Execute workflow
    config = {"configurable": {"thread_id": thread_id}}
    result = graph.invoke(initial_state, config)

    return result


def resume_workflow(
    thread_id: str,
    human_feedback: dict,
    checkpointer_path: str = "checkpoints.db"
) -> dict:
    """
    Resume workflow after human review.

    Args:
        thread_id: Thread ID of paused workflow
        human_feedback: Human feedback to incorporate
        checkpointer_path: Path to checkpoint database

    Returns:
        Final workflow state
    """
    # Create checkpointer
    checkpointer = SqliteSaver.from_conn_string(checkpointer_path)

    # Compile workflow
    graph = create_workflow().compile(
        checkpointer=checkpointer,
        interrupt_before=["human_review"]
    )

    # Update state with feedback
    config = {"configurable": {"thread_id": thread_id}}
    graph.update_state(
        config,
        {"human_feedback": human_feedback, "requires_human_review": False}
    )

    # Resume execution
    result = graph.invoke(None, config)

    return result


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def summarize_input(input_data: dict) -> str:
    """Generate human-readable summary of input data."""
    # Implementation
    return f"Input summary: {len(input_data)} fields"


def generate_email_body(state: Workflow{ID}State) -> str:
    """Generate email body from workflow state."""
    # Implementation
    return "Email body content"


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    # Example usage
    test_input = {
        "field1": "value1",
        "field2": "value2",
        "field3": "value3",
        "user_id": "test_user",
        "priority": "high"
    }

    result = run_workflow(
        input_data=test_input,
        thread_id="test-workflow-001"
    )

    print(f"Workflow completed with status: {result['status']}")
    print(f"Final result: {result['final_result']}")
```

### STEP 5: Generate Agent Configurations

For each workflow, generate agent configuration JSON:

**File:** `configs/agents/{workflow_name}_agent.json`

```json
{
  "agent_id": "agent_{id}_{sanitized_name}",
  "agent_name": "{responsibility_title} Automation Agent",
  "agent_type": "langgraph_workflow",
  "version": "1.0.0",
  "automation_tier": "{tier}",
  "automation_score": {composite_score},

  "llm_config": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-6",
    "temperature": 0.3,
    "max_tokens": 4000,
    "top_p": 0.95,
    "streaming": false
  },

  "system_prompt": "You are an AI assistant specialized in {responsibility_title}. Your role is to automate and streamline this executive director responsibility with high accuracy and efficiency. Always prioritize clarity, accuracy, and stakeholder communication.",

  "tools": [
    {
      "name": "send_email",
      "description": "Send email to stakeholders",
      "enabled": true,
      "config": {
        "smtp_server": "${SMTP_SERVER}",
        "from_address": "${EMAIL_FROM}"
      }
    },
    {
      "name": "schedule_meeting",
      "description": "Schedule meetings via calendar API",
      "enabled": true,
      "config": {
        "calendar_api": "${CALENDAR_API_URL}",
        "api_key": "${CALENDAR_API_KEY}"
      }
    },
    {
      "name": "generate_document",
      "description": "Generate documents from templates",
      "enabled": true,
      "config": {
        "template_dir": "./templates",
        "output_format": ["pdf", "docx"]
      }
    }
  ],

  "human_in_loop_config": {
    "enabled": true,
    "checkpoints": [
      {
        "node": "human_review",
        "trigger": "always",
        "description": "Review analysis and approve execution"
      },
      {
        "node": "execute_tools",
        "trigger": "conditional",
        "condition": "risk_level == 'high' OR complexity == 'high'",
        "description": "Review high-risk operations before execution"
      }
    ],
    "notification_channels": [
      {
        "type": "email",
        "address": "${REVIEW_EMAIL}"
      },
      {
        "type": "slack",
        "webhook_url": "${SLACK_WEBHOOK_URL}"
      }
    ]
  },

  "checkpointing": {
    "enabled": true,
    "backend": "sqlite",
    "config": {
      "db_path": "./checkpoints/workflow_{id}.db",
      "retention_days": 30
    }
  },

  "monitoring": {
    "enabled": true,
    "langsmith": {
      "enabled": true,
      "project_name": "exec-automator-{org_name}",
      "api_key": "${LANGSMITH_API_KEY}"
    },
    "logging": {
      "level": "INFO",
      "file": "./logs/workflow_{id}.log",
      "rotation": "daily",
      "retention_days": 90
    },
    "metrics": {
      "track_execution_time": true,
      "track_token_usage": true,
      "track_cost": true,
      "track_error_rate": true
    },
    "alerts": [
      {
        "type": "error_rate",
        "threshold": 0.05,
        "window": "1h",
        "action": "email",
        "recipients": ["${ALERT_EMAIL}"]
      },
      {
        "type": "execution_time",
        "threshold": 300,
        "action": "slack",
        "channel": "${SLACK_ALERT_CHANNEL}"
      }
    ]
  },

  "retry_config": {
    "max_retries": 3,
    "exponential_backoff": true,
    "backoff_base": 2,
    "retry_on_errors": ["agent_error", "tool_error", "api_error"],
    "no_retry_on_errors": ["validation_error", "authorization_error"]
  },

  "security": {
    "api_key_encryption": true,
    "audit_logging": true,
    "pii_redaction": true,
    "access_control": {
      "allowed_users": ["${ADMIN_USER}"],
      "allowed_roles": ["executive_director", "admin"]
    }
  },

  "metadata": {
    "created_at": "{timestamp}",
    "generated_by": "exec-automator-code-generator",
    "responsibility_id": "{id}",
    "estimated_monthly_hours_saved": {hours_saved},
    "estimated_monthly_cost": {monthly_cost}
  }
}
```

### STEP 6: Generate Tool Implementations

Create reusable tool modules:

**File:** `tools/email_tools.py`

```python
"""
Email integration tools for exec-automator workflows.
"""

from langchain_core.tools import tool
from typing import List, Optional
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import os
import logging

logger = logging.getLogger(__name__)


@tool
def send_email(
    to: List[str],
    subject: str,
    body: str,
    from_address: Optional[str] = None,
    cc: Optional[List[str]] = None,
    bcc: Optional[List[str]] = None,
    attachments: Optional[List[str]] = None,
    html: bool = False
) -> dict:
    """
    Send email via SMTP.

    Args:
        to: List of recipient email addresses
        subject: Email subject line
        body: Email body content
        from_address: Sender email (defaults to env var EMAIL_FROM)
        cc: List of CC recipients
        bcc: List of BCC recipients
        attachments: List of file paths to attach
        html: Whether body is HTML (default: plain text)

    Returns:
        dict with status and message_id
    """
    try:
        # Get SMTP config from environment
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("SMTP_USER")
        smtp_password = os.getenv("SMTP_PASSWORD")
        from_address = from_address or os.getenv("EMAIL_FROM", smtp_user)

        # Create message
        msg = MIMEMultipart()
        msg["From"] = from_address
        msg["To"] = ", ".join(to)
        msg["Subject"] = subject

        if cc:
            msg["Cc"] = ", ".join(cc)
        if bcc:
            msg["Bcc"] = ", ".join(bcc)

        # Add body
        msg.attach(MIMEText(body, "html" if html else "plain"))

        # Add attachments
        if attachments:
            for file_path in attachments:
                with open(file_path, "rb") as f:
                    part = MIMEBase("application", "octet-stream")
                    part.set_payload(f.read())
                    encoders.encode_base64(part)
                    part.add_header(
                        "Content-Disposition",
                        f"attachment; filename= {os.path.basename(file_path)}"
                    )
                    msg.attach(part)

        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)

        logger.info(f"Email sent successfully to {to}")
        return {
            "status": "success",
            "message": "Email sent successfully",
            "recipients": to
        }

    except Exception as e:
        logger.error(f"Email sending failed: {e}")
        return {
            "status": "error",
            "message": str(e)
        }


@tool
def draft_email(
    purpose: str,
    recipient_context: dict,
    tone: str = "professional",
    max_length: int = 500
) -> str:
    """
    Use LLM to draft email content.

    Args:
        purpose: Purpose of the email
        recipient_context: Context about recipient and situation
        tone: Email tone (professional, casual, formal)
        max_length: Maximum email length in words

    Returns:
        Drafted email body
    """
    # This would use an LLM to generate email content
    # Implementation depends on LangChain integration
    pass
```

**File:** `tools/calendar_tools.py`

```python
"""
Calendar integration tools for meeting scheduling.
"""

from langchain_core.tools import tool
from typing import List, Optional
from datetime import datetime, timedelta
import requests
import os
import logging

logger = logging.getLogger(__name__)


@tool
def schedule_meeting(
    title: str,
    attendees: List[str],
    duration_minutes: int,
    proposed_times: Optional[List[str]] = None,
    description: Optional[str] = None,
    location: Optional[str] = None
) -> dict:
    """
    Schedule a meeting via calendar API.

    Args:
        title: Meeting title
        attendees: List of attendee email addresses
        duration_minutes: Meeting duration in minutes
        proposed_times: List of proposed datetime strings (ISO format)
        description: Meeting description
        location: Meeting location or video conference link

    Returns:
        dict with meeting details and confirmation
    """
    try:
        calendar_api_url = os.getenv("CALENDAR_API_URL")
        api_key = os.getenv("CALENDAR_API_KEY")

        # If no proposed times, suggest next available slots
        if not proposed_times:
            proposed_times = find_available_slots(attendees, duration_minutes)

        # Create meeting request
        meeting_data = {
            "summary": title,
            "description": description,
            "attendees": [{"email": email} for email in attendees],
            "start": {
                "dateTime": proposed_times[0],
                "timeZone": "America/New_York"
            },
            "end": {
                "dateTime": (
                    datetime.fromisoformat(proposed_times[0]) +
                    timedelta(minutes=duration_minutes)
                ).isoformat(),
                "timeZone": "America/New_York"
            },
            "location": location
        }

        # Call calendar API
        response = requests.post(
            f"{calendar_api_url}/events",
            headers={"Authorization": f"Bearer {api_key}"},
            json=meeting_data
        )
        response.raise_for_status()

        result = response.json()
        logger.info(f"Meeting scheduled: {result.get('id')}")

        return {
            "status": "success",
            "meeting_id": result.get("id"),
            "meeting_link": result.get("htmlLink"),
            "start_time": proposed_times[0],
            "attendees": attendees
        }

    except Exception as e:
        logger.error(f"Meeting scheduling failed: {e}")
        return {
            "status": "error",
            "message": str(e)
        }


def find_available_slots(
    attendees: List[str],
    duration_minutes: int,
    days_ahead: int = 7
) -> List[str]:
    """
    Find available time slots for all attendees.
    """
    # Implementation for finding free/busy times
    # This would integrate with calendar API to check availability
    pass
```

### STEP 7: Generate Test Files (if --include-tests)

**File:** `tests/test_workflow_{id}.py`

```python
"""
Unit tests for workflow_{id}_{name}
"""

import pytest
from datetime import datetime
from workflows.{tier}.workflow_{id}_{name} import (
    create_workflow,
    run_workflow,
    initialize_node,
    agent_analysis_node,
    analysis_router,
    error_recovery_router
)
from schemas.workflow_{id}_state import Workflow{ID}State


class TestWorkflow{ID}:
    """Test suite for {responsibility_title} workflow."""

    def test_initialize_node_valid_input(self):
        """Test initialization with valid input."""
        state = {
            "input_data": {
                "field1": "value1",
                "field2": "value2",
                "field3": "value3"
            },
            "context": {},
            "errors": [],
            "step_history": []
        }

        result = initialize_node(state)

        assert result["status"] == "processing"
        assert result["current_step"] == "initialized"
        assert "workflow_id" in result["context"]

    def test_initialize_node_missing_required_fields(self):
        """Test initialization with missing required fields."""
        state = {
            "input_data": {
                "field1": "value1"
                # Missing field2 and field3
            },
            "context": {},
            "errors": [],
            "step_history": []
        }

        result = initialize_node(state)

        assert result["status"] == "failed"
        assert len(result["errors"]) > 0
        assert result["errors"][0]["type"] == "validation_error"

    def test_analysis_router_high_risk(self):
        """Test routing for high-risk analysis."""
        state = {
            "step_results": {
                "analysis": {
                    "complexity": "high",
                    "risk_level": "high",
                    "requires_human_review": True
                }
            },
            "requires_human_review": False
        }

        route = analysis_router(state)

        assert route == "human_review"

    def test_analysis_router_low_risk(self):
        """Test routing for low-risk analysis."""
        state = {
            "step_results": {
                "analysis": {
                    "complexity": "low",
                    "risk_level": "low",
                    "requires_human_review": False
                }
            },
            "requires_human_review": False
        }

        route = analysis_router(state)

        assert route == "auto_execute"

    def test_error_recovery_router_retry(self):
        """Test error recovery routing for retry."""
        state = {
            "context": {
                "recovery_strategy": "retry"
            }
        }

        route = error_recovery_router(state)

        assert route == "retry"

    @pytest.mark.integration
    def test_full_workflow_happy_path(self):
        """Integration test for complete workflow execution."""
        input_data = {
            "field1": "value1",
            "field2": "value2",
            "field3": "value3",
            "user_id": "test_user",
            "priority": "normal"
        }

        result = run_workflow(
            input_data=input_data,
            thread_id="test-integration-001",
            checkpointer_path=":memory:"  # In-memory for testing
        )

        assert result["status"] in ["completed", "awaiting_human"]
        assert result["final_result"] is not None or result["status"] == "awaiting_human"


# Fixtures
@pytest.fixture
def sample_state():
    """Sample workflow state for testing."""
    return {
        "input_data": {"field1": "val1"},
        "output_data": None,
        "messages": [],
        "current_step": "pending",
        "previous_step": None,
        "step_history": [],
        "errors": [],
        "retry_count": 0,
        "max_retries": 3,
        "context": {},
        "status": "pending",
        "step_results": {},
        "final_result": None,
        "human_feedback": None,
        "requires_human_review": False
    }
```

### STEP 8: Generate Documentation (if --include-docs)

**File:** `docs/README.md`

```markdown
# Executive Director Automation Workflows

Production-ready LangGraph workflows generated from automation analysis.

## Overview

This repository contains {count} AI-powered workflows that automate executive director responsibilities with varying levels of autonomy:

- **Full Automation** ({full_count} workflows): Fully autonomous execution
- **Partial Automation** ({partial_count} workflows): Semi-autonomous with human checkpoints
- **Assisted Automation** ({assisted_count} workflows): AI-assisted with human-in-the-loop

## Generated Workflows

### Full Automation (Score 80-100)

{list_of_full_automation_workflows}

### Partial Automation (Score 50-79)

{list_of_partial_automation_workflows}

### Assisted Automation (Score 20-49)

{list_of_assisted_automation_workflows}

## Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys and configuration

# Run tests
pytest tests/
```

## Usage

### Running a Workflow

```python
from workflows.full_automation.workflow_001_board_meeting_coordination import run_workflow

result = run_workflow(
    input_data={
        "meeting_type": "board_meeting",
        "proposed_date": "2025-01-15",
        "agenda_items": ["Financials", "Strategic Plan"]
    },
    thread_id="meeting-001"
)

print(result["final_result"])
```

### Resuming After Human Review

```python
from workflows.full_automation.workflow_001_board_meeting_coordination import resume_workflow

result = resume_workflow(
    thread_id="meeting-001",
    human_feedback={
        "approved": True,
        "comments": "Please add budget discussion to agenda"
    }
)
```

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions.

## Monitoring

All workflows are instrumented with:
- LangSmith tracing
- Structured logging
- Performance metrics
- Cost tracking
- Error alerts

See [RUNBOOK.md](./RUNBOOK.md) for operational procedures.

## Generated

- **Date:** {generation_date}
- **Generator:** exec-automator-code-generator v1.0.0
- **Source Analysis:** {input_file}
```

### STEP 9: Save Generation Report

Create comprehensive generation report:

**File:** `{output-dir}/GENERATION_REPORT.md`

```markdown
# LangGraph Workflow Generation Report

**Generated:** {timestamp}
**Input File:** {input_file}
**Automation Tier:** {tier}
**Generated Workflows:** {count}

---

## Summary

This report documents the LangGraph workflow code generation process for automating
executive director responsibilities. A total of {count} workflows were generated
across {tier_count} automation tiers.

### Generation Metrics

- **Total Responsibilities Analyzed:** {analyzed_count}
- **Workflows Generated:** {generated_count}
- **Full Automation Workflows:** {full_count}
- **Partial Automation Workflows:** {partial_count}
- **Assisted Automation Workflows:** {assisted_count}
- **Total Lines of Code Generated:** {loc_count}
- **Total Test Cases Generated:** {test_count}

### Estimated Impact

- **Monthly Hours Saved:** {total_hours_saved} hours
- **Annual Time Savings:** {annual_hours_saved} hours ({annual_hours_saved / 2080:.1f} FTE)
- **Estimated Monthly Operational Cost:** ${monthly_cost}
- **Estimated Annual Cost Savings:** ${annual_savings}

---

## Generated Workflows

{for each workflow:}

### Workflow {id}: {title}

- **File:** `workflows/{tier}/workflow_{id}_{sanitized_name}.py`
- **Automation Score:** {score}/100
- **Automation Tier:** {tier}
- **State Schema:** `schemas/workflow_{id}_state.py`
- **Agent Config:** `configs/agents/{name}_agent.json`
- **Estimated Monthly Hours Saved:** {hours}
- **Estimated Monthly Cost:** ${cost}

**Nodes:** {node_count}
- {list_of_node_names}

**Routing Functions:** {router_count}
- {list_of_router_names}

**Tools Integrated:** {tool_count}
- {list_of_tools}

**Human-in-the-Loop Checkpoints:** {checkpoint_count}
- {list_of_checkpoints}

**Test Cases Generated:** {test_case_count}

---

## Technology Stack

- **LangGraph:** {version}
- **LangChain:** {version}
- **LLM Providers:** {providers}
- **Checkpointing:** SQLite
- **Monitoring:** LangSmith
- **Testing:** pytest

---

## Next Steps

1. **Review Generated Code:** Inspect workflows for correctness
2. **Configure Environment:** Set up .env with API keys and credentials
3. **Run Tests:** Execute `pytest tests/` to validate workflows
4. **Deploy:** Follow [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for deployment
5. **Monitor:** Set up LangSmith and logging infrastructure

---

## Files Generated

**Workflows:** {workflow_file_count} Python files
**State Schemas:** {schema_file_count} Python files
**Agent Configs:** {config_file_count} JSON files
**Tool Modules:** {tool_file_count} Python files
**Test Files:** {test_file_count} Python files
**Documentation:** {doc_file_count} Markdown files

**Total Files:** {total_file_count}

---

**Generated by:** exec-automator-code-generator v1.0.0
```

### STEP 10: Archive to Obsidian

```python
mcp__obsidian__obsidian_append_content(
    filepath=f"Projects/Exec-Automator/Generated-Code/{org_name}-{timestamp}.md",
    content=generation_report_markdown
)
```

---

## SUCCESS CRITERIA

Mark generation complete when:

- [ ] All workflows generated for selected tier(s)
- [ ] State schemas created with proper TypedDict annotations
- [ ] Node implementations include error handling
- [ ] Routing functions implemented for all conditional edges
- [ ] Agent configurations generated with proper prompts and tools
- [ ] Tool integrations stubbed out with proper interfaces
- [ ] Checkpointing configured (SQLite by default)
- [ ] Human-in-the-loop checkpoints configured based on tier
- [ ] Tests generated (if --include-tests)
- [ ] Documentation created (if --include-docs)
- [ ] requirements.txt and pyproject.toml generated
- [ ] .env.example created with all required environment variables
- [ ] Generation report created
- [ ] Everything archived to Obsidian vault

---

## PROGRESS TRACKING

Use TodoWrite to track generation progress:

```python
TodoWrite(todos=[
    {
        "content": "Load and validate input scoring data",
        "activeForm": "Loading input data",
        "status": "in_progress"
    },
    {
        "content": "Filter responsibilities by automation tier",
        "activeForm": "Filtering by tier",
        "status": "pending"
    },
    {
        "content": "Generate state schemas for all workflows",
        "activeForm": "Generating state schemas",
        "status": "pending"
    },
    {
        "content": "Generate workflow node implementations",
        "activeForm": "Generating workflow nodes",
        "status": "pending"
    },
    {
        "content": "Generate routing functions",
        "activeForm": "Generating routing logic",
        "status": "pending"
    },
    {
        "content": "Generate agent configurations",
        "activeForm": "Generating agent configs",
        "status": "pending"
    },
    {
        "content": "Generate tool integration stubs",
        "activeForm": "Generating tool integrations",
        "status": "pending"
    },
    {
        "content": "Generate test files",
        "activeForm": "Generating tests",
        "status": "pending"
    },
    {
        "content": "Generate documentation",
        "activeForm": "Generating documentation",
        "status": "pending"
    },
    {
        "content": "Create generation report and archive to Obsidian",
        "activeForm": "Creating final report",
        "status": "pending"
    }
])
```

---

## ERROR HANDLING

### Common Errors

1. **Invalid Input File**
   - Error: Cannot parse JSON or missing required fields
   - Recovery: Validate JSON schema, request correct format
   - Fallback: Generate template scoring data

2. **No Workflows Match Tier**
   - Error: Tier filter excludes all responsibilities
   - Recovery: Adjust tier parameter or lower tier threshold
   - Fallback: Generate for "all" tiers

3. **Code Generation Failure**
   - Error: Template rendering fails for specific workflow
   - Recovery: Log error, skip workflow, continue with others
   - Fallback: Generate simplified workflow without advanced features

4. **MCP Server Unavailable**
   - Error: Cannot call mcp__exec-automator__ tools
   - Recovery: Use fallback template-based generation
   - Fallback: Generate basic workflows without MCP enhancements

---

## EXAMPLE USAGE

```bash
# Generate all automation tiers from latest analysis
/exec:generate latest --tier=all --include-tests --include-docs

# Generate only full automation workflows
/exec:generate ./03-scoring/automation-scores.json --tier=full --output=./production-workflows

# Generate partial automation with tests
/exec:generate latest --tier=partial --include-tests

# Generate prototype code for quick testing
/exec:generate latest --format=prototype --output=./prototypes
```

---

## BROOKSIDE BI BRAND VOICE

Throughout all generated code and documentation, maintain Brookside BI's brand voice:

- **Practical and Results-Oriented:** Focus on measurable outcomes and ROI
- **Clear and Accessible:** Make complex AI/automation concepts understandable
- **Trustworthy and Professional:** Enterprise-grade code quality and documentation
- **Innovative but Grounded:** Cutting-edge AI, but production-ready and tested

Code comments should be:
- **Explanatory:** Why, not just what
- **Concise:** Clear but not verbose
- **Helpful:** Aid future maintainers

Documentation should be:
- **Comprehensive:** Cover all aspects
- **Actionable:** Provide clear next steps
- **Visual:** Include diagrams and examples

---

## FINAL DELIVERABLES

When command completes, present to user:

1. **Summary Statistics**
   - Workflows generated by tier
   - Total lines of code
   - Estimated time savings
   - Estimated costs

2. **File Locations**
   - Path to generated workflows directory
   - Path to documentation
   - Path to generation report

3. **Next Steps**
   - How to configure environment
   - How to run tests
   - How to deploy workflows

4. **Obsidian Archive Confirmation**
   - Confirm all documentation saved to vault
   - Provide vault file path

---

**You are now the LangGraph Code Generator. Execute the workflow generation protocol with precision and professionalism. Generate production-ready code that saves time, reduces costs, and empowers organizations.**

Begin code generation.
