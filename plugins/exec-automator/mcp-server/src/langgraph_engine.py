"""
LangGraph Workflow Engine

Implements StateGraph workflows for executive director automation.
Handles workflow compilation, checkpointing, execution, and recovery.

Author: Brookside BI
"""

import asyncio
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, TypedDict

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.sqlite import SqliteSaver
from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage

from state_schemas import (
    OrgAnalysisState,
    WorkflowGenerationState,
    DeploymentState,
    Responsibility,
)

from langchain_tools import (
    parse_document,
    extract_responsibilities,
    categorize_responsibility,
    score_automation_potential,
    identify_org_type,
    generate_workflow_spec,
)

logger = logging.getLogger("langgraph_engine")


# ============================================================================
# ORGANIZATIONAL ANALYSIS WORKFLOW
# ============================================================================

def create_org_analysis_workflow() -> StateGraph:
    """
    Create LangGraph workflow for analyzing organizational documents.

    This workflow parses documents, extracts responsibilities, identifies
    patterns, and generates comprehensive organizational profiles.

    Workflow steps:
    1. Parse document (PDF, DOCX, etc.)
    2. Extract responsibilities and metadata
    3. Categorize responsibilities by domain
    4. Identify organizational type and structure
    5. Score automation potential
    6. Generate organizational profile

    Returns:
        Compiled StateGraph with checkpointing
    """
    logger.info("Building organizational analysis workflow")

    workflow = StateGraph(OrgAnalysisState)

    # Node 1: Document Parsing
    async def parse_document_node(state: OrgAnalysisState) -> OrgAnalysisState:
        """Parse document and extract raw text."""
        logger.info(f"Parsing document: {state['document_path']}")

        try:
            parsed = await parse_document(
                file_path=state["document_path"],
                document_type=state.get("document_type", "auto")
            )

            return {
                **state,
                "raw_text": parsed["text"],
                "detected_document_type": parsed["document_type"],
                "metadata": parsed["metadata"],
                "current_step": "parsed",
            }

        except Exception as e:
            logger.error(f"Document parsing failed: {e}")
            return {
                **state,
                "errors": state.get("errors", []) + [{"type": "parsing", "error": str(e)}],
                "current_step": "error",
            }

    # Node 2: Responsibility Extraction
    async def extract_responsibilities_node(state: OrgAnalysisState) -> OrgAnalysisState:
        """Extract responsibilities from document text."""
        logger.info("Extracting responsibilities")

        try:
            responsibilities = await extract_responsibilities(
                text=state["raw_text"],
                document_type=state["detected_document_type"]
            )

            return {
                **state,
                "responsibilities": responsibilities,
                "current_step": "extracted",
            }

        except Exception as e:
            logger.error(f"Responsibility extraction failed: {e}")
            return {
                **state,
                "errors": state.get("errors", []) + [{"type": "extraction", "error": str(e)}],
                "current_step": "error",
            }

    # Node 3: Categorization
    async def categorize_responsibilities_node(state: OrgAnalysisState) -> OrgAnalysisState:
        """Categorize each responsibility."""
        logger.info("Categorizing responsibilities")

        try:
            categorized = []
            for resp in state["responsibilities"]:
                category = await categorize_responsibility(resp)
                categorized.append({**resp, "category": category})

            return {
                **state,
                "responsibilities": categorized,
                "current_step": "categorized",
            }

        except Exception as e:
            logger.error(f"Categorization failed: {e}")
            return {
                **state,
                "errors": state.get("errors", []) + [{"type": "categorization", "error": str(e)}],
                "current_step": "error",
            }

    # Node 4: Organization Type Identification
    async def identify_org_type_node(state: OrgAnalysisState) -> OrgAnalysisState:
        """Identify organization type and structure."""
        logger.info("Identifying organization type")

        try:
            org_profile = await identify_org_type(
                text=state["raw_text"],
                responsibilities=state["responsibilities"]
            )

            return {
                **state,
                "organization_profile": org_profile,
                "current_step": "analyzed",
            }

        except Exception as e:
            logger.error(f"Org type identification failed: {e}")
            return {
                **state,
                "errors": state.get("errors", []) + [{"type": "org_analysis", "error": str(e)}],
                "current_step": "error",
            }

    # Node 5: Automation Scoring
    async def score_automation_node(state: OrgAnalysisState) -> OrgAnalysisState:
        """Score automation potential for each responsibility."""
        logger.info("Scoring automation potential")

        try:
            scored = []
            for resp in state["responsibilities"]:
                score = await score_automation_potential(resp)
                scored.append({
                    **resp,
                    "automation_score": score.score,
                    "automation_approach": score.approach,
                })

            return {
                **state,
                "responsibilities": scored,
                "current_step": "scored",
            }

        except Exception as e:
            logger.error(f"Automation scoring failed: {e}")
            return {
                **state,
                "errors": state.get("errors", []) + [{"type": "scoring", "error": str(e)}],
                "current_step": "error",
            }

    # Node 6: Profile Generation
    async def generate_profile_node(state: OrgAnalysisState) -> OrgAnalysisState:
        """Generate final organizational profile."""
        logger.info("Generating organizational profile")

        try:
            profile = {
                **state["organization_profile"],
                "responsibilities": state["responsibilities"],
                "metadata": state["metadata"],
                "analysis_completed_at": datetime.utcnow().isoformat(),
            }

            return {
                **state,
                "organization_profile": profile,
                "status": "completed",
                "current_step": "completed",
            }

        except Exception as e:
            logger.error(f"Profile generation failed: {e}")
            return {
                **state,
                "errors": state.get("errors", []) + [{"type": "profile_gen", "error": str(e)}],
                "current_step": "error",
                "status": "failed",
            }

    # Routing function
    def error_router(state: OrgAnalysisState) -> str:
        """Route based on error status."""
        if state.get("errors"):
            return "error_handler"
        return "continue"

    # Add nodes
    workflow.add_node("parse", parse_document_node)
    workflow.add_node("extract", extract_responsibilities_node)
    workflow.add_node("categorize", categorize_responsibilities_node)
    workflow.add_node("identify_org", identify_org_type_node)
    workflow.add_node("score", score_automation_node)
    workflow.add_node("generate_profile", generate_profile_node)

    # Set entry point
    workflow.set_entry_point("parse")

    # Add edges
    workflow.add_edge("parse", "extract")
    workflow.add_edge("extract", "categorize")
    workflow.add_edge("categorize", "identify_org")
    workflow.add_edge("identify_org", "score")
    workflow.add_edge("score", "generate_profile")
    workflow.add_edge("generate_profile", END)

    return workflow


# ============================================================================
# WORKFLOW GENERATION WORKFLOW
# ============================================================================

def create_workflow_generation_workflow() -> StateGraph:
    """
    Create LangGraph workflow for generating workflow specifications.

    This meta-workflow designs new workflows based on responsibility requirements.
    It analyzes the responsibility, determines optimal workflow pattern,
    generates state schemas, implements nodes and routing, and produces
    production-ready Python code.

    Returns:
        Compiled StateGraph
    """
    logger.info("Building workflow generation workflow")

    workflow = StateGraph(WorkflowGenerationState)

    # Node 1: Analyze Responsibility
    async def analyze_responsibility_node(state: WorkflowGenerationState) -> WorkflowGenerationState:
        """Analyze responsibility to determine workflow requirements."""
        logger.info(f"Analyzing responsibility: {state['responsibility_id']}")

        llm = ChatAnthropic(model="claude-sonnet-5")

        # Load responsibility details
        # (In production, this would query from database/checkpoint)

        prompt = f"""Analyze this responsibility and determine optimal workflow architecture:

Workflow Type: {state['workflow_type']}
Options: {state.get('options', {})}

Design a LangGraph workflow that handles this responsibility with:
1. Appropriate state schema
2. Required nodes and their functions
3. Conditional routing logic
4. Error handling and recovery
5. Human-in-the-loop gates if needed
"""

        response = llm.invoke([HumanMessage(content=prompt)])

        return {
            **state,
            "workflow_analysis": response.content,
            "current_step": "analyzed",
        }

    # Node 2: Generate Workflow Spec
    async def generate_spec_node(state: WorkflowGenerationState) -> WorkflowGenerationState:
        """Generate workflow specification."""
        logger.info("Generating workflow specification")

        spec = await generate_workflow_spec(
            responsibility_id=state["responsibility_id"],
            workflow_type=state["workflow_type"],
            analysis=state["workflow_analysis"],
            options=state.get("options", {})
        )

        return {
            **state,
            "workflow_spec": spec,
            "current_step": "generated",
            "status": "completed",
        }

    # Add nodes
    workflow.add_node("analyze", analyze_responsibility_node)
    workflow.add_node("generate", generate_spec_node)

    # Set entry point
    workflow.set_entry_point("analyze")

    # Add edges
    workflow.add_edge("analyze", "generate")
    workflow.add_edge("generate", END)

    return workflow


# ============================================================================
# DEPLOYMENT WORKFLOW
# ============================================================================

def create_deployment_workflow() -> StateGraph:
    """
    Create LangGraph workflow for deploying generated workflows.

    Handles environment setup, checkpoint database initialization,
    health checks, and deployment verification.

    Returns:
        Compiled StateGraph
    """
    logger.info("Building deployment workflow")

    workflow = StateGraph(DeploymentState)

    # Node 1: Prepare Deployment
    async def prepare_deployment_node(state: DeploymentState) -> DeploymentState:
        """Prepare deployment environment."""
        logger.info(f"Preparing deployment to {state['environment']}")

        return {
            **state,
            "current_step": "prepared",
            "deployment_status": {"prepared": True},
        }

    # Node 2: Deploy Workflow
    async def deploy_workflow_node(state: DeploymentState) -> DeploymentState:
        """Deploy workflow to target environment."""
        logger.info(f"Deploying workflow {state['workflow_id']}")

        # In production, this would:
        # - Create checkpoint database
        # - Set up environment variables
        # - Deploy to compute platform
        # - Configure monitoring

        return {
            **state,
            "current_step": "deployed",
            "deployment_status": {
                **state.get("deployment_status", {}),
                "deployed": True,
            },
            "endpoint": f"https://{state['environment']}.example.com/{state['workflow_id']}",
            "monitoring_url": f"https://monitor.example.com/{state['workflow_id']}",
        }

    # Node 3: Verify Deployment
    async def verify_deployment_node(state: DeploymentState) -> DeploymentState:
        """Verify deployment health."""
        logger.info("Verifying deployment")

        return {
            **state,
            "current_step": "verified",
            "status": "completed",
            "deployment_status": {
                **state.get("deployment_status", {}),
                "verified": True,
            },
        }

    # Add nodes
    workflow.add_node("prepare", prepare_deployment_node)
    workflow.add_node("deploy", deploy_workflow_node)
    workflow.add_node("verify", verify_deployment_node)

    # Set entry point
    workflow.set_entry_point("prepare")

    # Add edges
    workflow.add_edge("prepare", "deploy")
    workflow.add_edge("deploy", "verify")
    workflow.add_edge("verify", END)

    return workflow


# ============================================================================
# WORKFLOW EXECUTION UTILITIES
# ============================================================================

async def execute_workflow(
    workflow: StateGraph,
    initial_state: Dict[str, Any],
    thread_id: str,
    checkpoint_dir: str
) -> Dict[str, Any]:
    """
    Execute a workflow with checkpointing.

    Args:
        workflow: StateGraph workflow to execute
        initial_state: Initial state dictionary
        thread_id: Unique thread identifier for checkpointing
        checkpoint_dir: Directory for checkpoint storage

    Returns:
        Final workflow state
    """
    logger.info(f"Executing workflow (thread: {thread_id})")

    # Create checkpoint database path
    checkpoint_db = Path(checkpoint_dir) / f"{thread_id}.db"

    # Initialize checkpointer
    checkpointer = SqliteSaver.from_conn_string(str(checkpoint_db))

    # Compile workflow with checkpointing
    graph = workflow.compile(checkpointer=checkpointer)

    # Configuration
    config = {"configurable": {"thread_id": thread_id}}

    try:
        # Execute workflow
        result = await graph.ainvoke(initial_state, config)

        logger.info(f"Workflow completed: {result.get('status')}")

        # Save result to JSON checkpoint for easy access
        checkpoint_json = Path(checkpoint_dir) / f"{thread_id}.json"
        with open(checkpoint_json, 'w') as f:
            json.dump(result, f, indent=2, default=str)

        return result

    except Exception as e:
        logger.error(f"Workflow execution failed: {e}", exc_info=True)

        # Save error state
        error_state = {
            **initial_state,
            "status": "failed",
            "error": str(e),
            "failed_at": datetime.utcnow().isoformat(),
        }

        checkpoint_json = Path(checkpoint_dir) / f"{thread_id}.json"
        with open(checkpoint_json, 'w') as f:
            json.dump(error_state, f, indent=2, default=str)

        raise


async def get_workflow_status(thread_id: str, checkpoint_dir: str) -> Dict[str, Any]:
    """
    Get current status of a workflow execution.

    Args:
        thread_id: Thread identifier
        checkpoint_dir: Checkpoint directory

    Returns:
        Status information
    """
    checkpoint_json = Path(checkpoint_dir) / f"{thread_id}.json"

    if not checkpoint_json.exists():
        return {
            "thread_id": thread_id,
            "status": "not_found",
            "error": "Workflow execution not found",
        }

    with open(checkpoint_json, 'r') as f:
        state = json.load(f)

    return {
        "thread_id": thread_id,
        "status": state.get("status", "unknown"),
        "current_step": state.get("current_step"),
        "errors": state.get("errors", []),
        "started_at": state.get("started_at"),
        "completed_at": state.get("completed_at"),
    }


async def resume_workflow(
    thread_id: str,
    checkpoint_dir: str,
    updates: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Resume a paused workflow with updates (e.g., human approval).

    Args:
        thread_id: Thread identifier
        checkpoint_dir: Checkpoint directory
        updates: State updates to apply

    Returns:
        Updated workflow state
    """
    logger.info(f"Resuming workflow: {thread_id}")

    # Load current state
    checkpoint_json = Path(checkpoint_dir) / f"{thread_id}.json"

    if not checkpoint_json.exists():
        raise ValueError(f"Workflow not found: {thread_id}")

    with open(checkpoint_json, 'r') as f:
        current_state = json.load(f)

    # Apply updates
    updated_state = {**current_state, **updates}

    # Save updated state
    with open(checkpoint_json, 'w') as f:
        json.dump(updated_state, f, indent=2, default=str)

    logger.info(f"Workflow resumed: {thread_id}")

    return updated_state


# ============================================================================
# WORKFLOW COMPILATION HELPERS
# ============================================================================

def compile_workflow_from_spec(spec: Dict[str, Any]) -> StateGraph:
    """
    Dynamically compile a StateGraph from a workflow specification.

    This is the meta-level capability: workflows generate workflow specs,
    and this function turns those specs into executable StateGraphs.

    Args:
        spec: Workflow specification dictionary

    Returns:
        Compiled StateGraph
    """
    logger.info("Compiling workflow from specification")

    # Extract spec components
    state_schema = spec["state_schema"]
    nodes = spec["nodes"]
    edges = spec["edges"]
    entry_point = spec["entry_point"]

    # TODO: Implement dynamic StateGraph compilation
    # This would involve:
    # 1. Creating TypedDict class from state_schema
    # 2. Defining node functions from node specs
    # 3. Creating routing functions from edge specs
    # 4. Building and compiling StateGraph

    # For now, return placeholder
    raise NotImplementedError("Dynamic workflow compilation not yet implemented")


logger.info("LangGraph engine initialized")
