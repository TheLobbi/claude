"""
Executive Automator MCP Server

A comprehensive Model Context Protocol server that powers the exec-automator plugin.
This server provides workflow orchestration via LangGraph, intelligent document analysis,
and specialized agents for automating executive director responsibilities.

Author: Brookside BI
License: Proprietary
Version: 1.0.0

Brand Voice: We build intelligent automation that doesn't just replace tasks—it amplifies
human potential. Every workflow we design brings clarity, every agent we deploy adds capacity,
and every automation we implement creates space for strategic thinking.
"""

import asyncio
import json
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import (
    Resource,
    Tool,
    TextContent,
    ImageContent,
    EmbeddedResource,
)

from langgraph_engine import (
    create_org_analysis_workflow,
    create_workflow_generation_workflow,
    create_deployment_workflow,
    execute_workflow,
    get_workflow_status,
    resume_workflow,
)

from langchain_tools import (
    parse_document,
    extract_responsibilities,
    score_automation_potential,
    identify_org_type,
    find_similar_organizations,
    generate_workflow_spec,
    generate_agent_spec,
    query_pattern_library,
)

from state_schemas import (
    OrgAnalysisState,
    WorkflowGenerationState,
    DeploymentState,
    AutomationScore,
    Responsibility,
    OrganizationalProfile,
)

# Configure logging with Brookside BI style
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(name)s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger("exec-automator")

# Initialize MCP server
app = Server("exec-automator")

# Global configuration
CONFIG = {
    "checkpoint_dir": os.getenv("CHECKPOINT_DIR", "./checkpoints"),
    "pattern_library_path": os.getenv("PATTERN_LIBRARY", "./data/patterns.json"),
    "templates_dir": os.getenv("TEMPLATES_DIR", "./templates"),
    "default_model": os.getenv("DEFAULT_MODEL", "claude-sonnet-5"),
    "max_retries": int(os.getenv("MAX_RETRIES", "3")),
    "enable_streaming": os.getenv("ENABLE_STREAMING", "true").lower() == "true",
}

# Ensure required directories exist
Path(CONFIG["checkpoint_dir"]).mkdir(parents=True, exist_ok=True)
Path(CONFIG["templates_dir"]).mkdir(parents=True, exist_ok=True)

logger.info(f"🚀 Exec-Automator MCP Server initializing...")
logger.info(f"📁 Checkpoint directory: {CONFIG['checkpoint_dir']}")
logger.info(f"📚 Pattern library: {CONFIG['pattern_library_path']}")
logger.info(f"🤖 Default model: {CONFIG['default_model']}")


# ============================================================================
# RESOURCES
# ============================================================================

@app.list_resources()
async def list_resources() -> List[Resource]:
    """
    List available resources including templates, pattern libraries, and workflows.

    Resources are read-only references to data and templates that agents can access
    to inform their automation decisions.
    """
    resources = []

    # Template resources
    templates_dir = Path(CONFIG["templates_dir"])
    if templates_dir.exists():
        for template_file in templates_dir.glob("*.json"):
            resources.append(Resource(
                uri=f"template:///{template_file.stem}",
                name=f"Template: {template_file.stem}",
                mimeType="application/json",
                description=f"Workflow template for {template_file.stem}"
            ))

    # Pattern library resource
    pattern_lib_path = Path(CONFIG["pattern_library_path"])
    if pattern_lib_path.exists():
        resources.append(Resource(
            uri="pattern-library:///main",
            name="Responsibility Pattern Library",
            mimeType="application/json",
            description="Curated library of common executive director responsibility patterns"
        ))

    # Active workflows resource
    resources.append(Resource(
        uri="workflows:///active",
        name="Active Workflows",
        mimeType="application/json",
        description="List of currently executing workflows with status"
    ))

    logger.info(f"📋 Listed {len(resources)} resources")
    return resources


@app.read_resource()
async def read_resource(uri: str) -> str:
    """
    Read a specific resource by URI.

    Args:
        uri: Resource URI (e.g., "template:///financial-automation")

    Returns:
        Resource content as string
    """
    logger.info(f"📖 Reading resource: {uri}")

    if uri.startswith("template:///"):
        template_name = uri.replace("template:///", "")
        template_path = Path(CONFIG["templates_dir"]) / f"{template_name}.json"

        if not template_path.exists():
            raise ValueError(f"Template not found: {template_name}")

        with open(template_path, 'r') as f:
            return f.read()

    elif uri == "pattern-library:///main":
        pattern_path = Path(CONFIG["pattern_library_path"])

        if not pattern_path.exists():
            return json.dumps({"patterns": [], "version": "1.0.0"})

        with open(pattern_path, 'r') as f:
            return f.read()

    elif uri == "workflows:///active":
        # Get active workflows from checkpoint directory
        checkpoint_dir = Path(CONFIG["checkpoint_dir"])
        active_workflows = []

        for checkpoint_file in checkpoint_dir.glob("*.json"):
            try:
                with open(checkpoint_file, 'r') as f:
                    checkpoint_data = json.load(f)
                    if checkpoint_data.get("status") not in ["completed", "failed"]:
                        active_workflows.append({
                            "thread_id": checkpoint_file.stem,
                            "status": checkpoint_data.get("status"),
                            "current_step": checkpoint_data.get("current_step"),
                            "started_at": checkpoint_data.get("started_at"),
                        })
            except Exception as e:
                logger.warning(f"Error reading checkpoint {checkpoint_file}: {e}")

        return json.dumps({"workflows": active_workflows, "count": len(active_workflows)})

    else:
        raise ValueError(f"Unknown resource URI: {uri}")


# ============================================================================
# TOOLS
# ============================================================================

@app.list_tools()
async def list_tools() -> List[Tool]:
    """
    List all available tools for executive director automation.

    These tools cover the complete automation lifecycle:
    1. Document analysis and responsibility extraction
    2. Automation potential scoring
    3. Workflow generation and specification
    4. Deployment and execution
    5. Status monitoring and management
    """
    tools = [
        # Document Analysis Tools
        Tool(
            name="analyze_document",
            description="""
            Analyze organizational documents (RFPs, job descriptions, bylaws) to extract
            executive director responsibilities, organizational structure, and context.

            This is the starting point for automation planning. We parse documents with
            domain expertise, recognizing patterns in association management and nonprofit
            governance that general-purpose tools would miss.

            Args:
                file_path (str): Path to document (PDF, DOCX, TXT, MD)
                document_type (str): Type of document ("rfp", "job_description", "bylaws", "auto")

            Returns:
                Comprehensive analysis including responsibilities, org structure, stakeholders
            """,
            inputSchema={
                "type": "object",
                "properties": {
                    "file_path": {"type": "string", "description": "Path to document file"},
                    "document_type": {
                        "type": "string",
                        "enum": ["rfp", "job_description", "bylaws", "strategic_plan", "auto"],
                        "description": "Document type (use 'auto' for automatic detection)"
                    },
                },
                "required": ["file_path"]
            }
        ),

        Tool(
            name="map_responsibilities",
            description="""
            Extract and categorize executive director responsibilities from analyzed documents.

            We go beyond simple text extraction—we understand the semantic meaning of
            responsibilities, categorize them by domain, estimate effort, and identify
            dependencies. This creates the foundation for intelligent automation planning.

            Args:
                analysis_id (str): ID from previous analyze_document call
                categories (list[str], optional): Filter to specific categories

            Returns:
                Structured list of responsibilities with metadata and relationships
            """,
            inputSchema={
                "type": "object",
                "properties": {
                    "analysis_id": {"type": "string", "description": "Analysis ID from analyze_document"},
                    "categories": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Filter to specific categories (optional)"
                    },
                },
                "required": ["analysis_id"]
            }
        ),

        # Scoring and Planning Tools
        Tool(
            name="score_automation",
            description="""
            Score automation potential for each responsibility using our proprietary algorithm.

            Our scoring considers 12+ factors: repetitiveness, rule-based nature, data-driven
            requirements, stakeholder complexity, judgment needs, relationship intensity,
            and more. Each score comes with detailed rationale and recommended approach.

            Scores range 0-100:
            - 80-100: Highly automatable (deploy autonomous agent)
            - 60-79: Moderately automatable (human-in-loop)
            - 40-59: Partially automatable (AI-assisted)
            - 20-39: Low automation (light AI support)
            - 0-19: Human-only (strategic/relationship)

            Args:
                analysis_id (str): Analysis ID from analyze_document
                filters (dict, optional): Filter responsibilities before scoring

            Returns:
                Scored responsibilities with automation recommendations and ROI projections
            """,
            inputSchema={
                "type": "object",
                "properties": {
                    "analysis_id": {"type": "string", "description": "Analysis ID"},
                    "filters": {
                        "type": "object",
                        "description": "Filter criteria (category, min_complexity, etc.)"
                    },
                },
                "required": ["analysis_id"]
            }
        ),

        Tool(
            name="generate_workflow",
            description="""
            Generate LangGraph workflow specification for automating a responsibility.

            This is where strategy becomes code. We design StateGraph workflows with proper
            state management, conditional routing, error recovery, checkpointing, and
            human-in-the-loop gates. Each workflow is production-ready and maintainable.

            Our workflows follow proven patterns:
            - State machines with comprehensive state schemas
            - Conditional routing based on confidence and business rules
            - Retry logic with exponential backoff
            - Human approval gates for high-stakes decisions
            - Checkpoint persistence for long-running processes

            Args:
                responsibility_id (str): Responsibility to automate
                workflow_type (str): Type of workflow to generate
                options (dict, optional): Customization options

            Returns:
                Complete LangGraph workflow specification with Python code, state schemas,
                node implementations, routing logic, and deployment instructions
            """,
            inputSchema={
                "type": "object",
                "properties": {
                    "responsibility_id": {"type": "string", "description": "Responsibility ID"},
                    "workflow_type": {
                        "type": "string",
                        "enum": ["autonomous", "human_in_loop", "assisted", "advisory"],
                        "description": "Workflow automation level"
                    },
                    "options": {
                        "type": "object",
                        "description": "Customization options (model, approval_threshold, etc.)"
                    },
                },
                "required": ["responsibility_id", "workflow_type"]
            }
        ),

        # Deployment Tools
        Tool(
            name="deploy_workflow",
            description="""
            Deploy a generated workflow to production environment.

            Deployment handles:
            - Checkpoint database initialization
            - Tool and integration setup
            - Environment variable configuration
            - Health checks and validation
            - Monitoring and alerting setup

            We deploy with best practices: staged rollouts, rollback capability,
            comprehensive logging, and clear success criteria.

            Args:
                workflow_id (str): Workflow specification ID
                environment (str): Target environment
                config (dict, optional): Deployment configuration

            Returns:
                Deployment status with endpoint URLs and monitoring dashboards
            """,
            inputSchema={
                "type": "object",
                "properties": {
                    "workflow_id": {"type": "string", "description": "Workflow specification ID"},
                    "environment": {
                        "type": "string",
                        "enum": ["development", "staging", "production"],
                        "description": "Target environment"
                    },
                    "config": {
                        "type": "object",
                        "description": "Deployment configuration overrides"
                    },
                },
                "required": ["workflow_id", "environment"]
            }
        ),

        Tool(
            name="execute_workflow",
            description="""
            Execute a deployed workflow with specific input data.

            This triggers workflow execution, handles checkpointing for long-running
            processes, supports streaming updates, and manages human-in-the-loop
            interrupts. Returns execution handle for status monitoring.

            Args:
                workflow_id (str): Deployed workflow ID
                input_data (dict): Input data for workflow
                thread_id (str, optional): Thread ID for resuming previous execution
                stream (bool, optional): Enable streaming updates

            Returns:
                Execution handle with thread_id, status, and result (when completed)
            """,
            inputSchema={
                "type": "object",
                "properties": {
                    "workflow_id": {"type": "string", "description": "Deployed workflow ID"},
                    "input_data": {"type": "object", "description": "Workflow input data"},
                    "thread_id": {"type": "string", "description": "Thread ID for resuming"},
                    "stream": {"type": "boolean", "description": "Enable streaming updates"},
                },
                "required": ["workflow_id", "input_data"]
            }
        ),

        # Status and Management Tools
        Tool(
            name="get_status",
            description="""
            Get current status of a workflow execution.

            Returns detailed status including:
            - Current step and state
            - Progress percentage
            - Errors and warnings
            - Human approval requirements
            - Estimated completion time

            Args:
                thread_id (str): Workflow execution thread ID

            Returns:
                Detailed status information and current state
            """,
            inputSchema={
                "type": "object",
                "properties": {
                    "thread_id": {"type": "string", "description": "Execution thread ID"},
                },
                "required": ["thread_id"]
            }
        ),

        Tool(
            name="approve_step",
            description="""
            Provide human approval for workflow step awaiting review.

            Many workflows include human-in-the-loop gates for high-stakes decisions.
            This tool allows humans to review AI recommendations, provide feedback,
            approve or reject, and add context for downstream steps.

            Args:
                thread_id (str): Workflow execution thread ID
                approved (bool): Approval decision
                feedback (str, optional): Human feedback and context

            Returns:
                Updated workflow status after approval
            """,
            inputSchema={
                "type": "object",
                "properties": {
                    "thread_id": {"type": "string", "description": "Execution thread ID"},
                    "approved": {"type": "boolean", "description": "Approval decision"},
                    "feedback": {"type": "string", "description": "Human feedback"},
                },
                "required": ["thread_id", "approved"]
            }
        ),

        Tool(
            name="manage_templates",
            description="""
            Create, update, or delete workflow templates.

            Templates are reusable workflow patterns for common automation scenarios.
            Build a library of proven templates that can be quickly adapted to
            new organizations and responsibilities.

            Args:
                action (str): Action to perform (create, update, delete, list)
                template_name (str, optional): Template name
                template_data (dict, optional): Template specification

            Returns:
                Template information or list of available templates
            """,
            inputSchema={
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string",
                        "enum": ["create", "update", "delete", "list"],
                        "description": "Action to perform"
                    },
                    "template_name": {"type": "string", "description": "Template name"},
                    "template_data": {"type": "object", "description": "Template specification"},
                },
                "required": ["action"]
            }
        ),

        Tool(
            name="query_patterns",
            description="""
            Query the responsibility pattern library for similar patterns.

            Our pattern library contains hundreds of executive director responsibilities
            from analyzed organizations. Query it to find similar patterns, benchmark
            automation scores, and leverage proven workflow approaches.

            Args:
                query (str): Search query or responsibility description
                filters (dict, optional): Filter criteria (category, org_type, etc.)
                limit (int, optional): Maximum results to return

            Returns:
                Matching patterns with automation scores and workflow recommendations
            """,
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query"},
                    "filters": {"type": "object", "description": "Filter criteria"},
                    "limit": {"type": "integer", "description": "Maximum results"},
                },
                "required": ["query"]
            }
        ),
    ]

    logger.info(f"🛠️  Listed {len(tools)} tools")
    return tools


# ============================================================================
# TOOL HANDLERS
# ============================================================================

@app.call_tool()
async def call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
    """
    Handle tool calls from Claude or other MCP clients.

    This is the main dispatcher that routes tool calls to appropriate handlers,
    manages workflow orchestration, and returns structured results.
    """
    logger.info(f"🔧 Tool called: {name} with args: {arguments}")

    try:
        # Document Analysis Tools
        if name == "analyze_document":
            result = await handle_analyze_document(arguments)

        elif name == "map_responsibilities":
            result = await handle_map_responsibilities(arguments)

        # Scoring and Planning Tools
        elif name == "score_automation":
            result = await handle_score_automation(arguments)

        elif name == "generate_workflow":
            result = await handle_generate_workflow(arguments)

        # Deployment Tools
        elif name == "deploy_workflow":
            result = await handle_deploy_workflow(arguments)

        elif name == "execute_workflow":
            result = await handle_execute_workflow(arguments)

        # Status and Management Tools
        elif name == "get_status":
            result = await handle_get_status(arguments)

        elif name == "approve_step":
            result = await handle_approve_step(arguments)

        elif name == "manage_templates":
            result = await handle_manage_templates(arguments)

        elif name == "query_patterns":
            result = await handle_query_patterns(arguments)

        else:
            raise ValueError(f"Unknown tool: {name}")

        logger.info(f"✅ Tool {name} completed successfully")

        return [TextContent(
            type="text",
            text=json.dumps(result, indent=2)
        )]

    except Exception as e:
        logger.error(f"❌ Tool {name} failed: {e}", exc_info=True)

        return [TextContent(
            type="text",
            text=json.dumps({
                "error": str(e),
                "tool": name,
                "timestamp": datetime.utcnow().isoformat()
            }, indent=2)
        )]


# ============================================================================
# TOOL IMPLEMENTATIONS
# ============================================================================

async def handle_analyze_document(args: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze organizational document to extract responsibilities and context.
    """
    file_path = args["file_path"]
    document_type = args.get("document_type", "auto")

    logger.info(f"📄 Analyzing document: {file_path} (type: {document_type})")

    # Create workflow instance
    workflow = create_org_analysis_workflow()

    # Generate thread ID
    thread_id = f"analysis_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"

    # Initial state
    initial_state = {
        "document_path": file_path,
        "document_type": document_type,
        "organization_profile": {},
        "responsibilities": [],
        "stakeholders": [],
        "current_step": "parsing",
        "errors": [],
        "retry_count": 0,
    }

    # Execute workflow
    result = await execute_workflow(
        workflow=workflow,
        initial_state=initial_state,
        thread_id=thread_id,
        checkpoint_dir=CONFIG["checkpoint_dir"]
    )

    return {
        "analysis_id": thread_id,
        "document_path": file_path,
        "document_type": result.get("detected_document_type", document_type),
        "organization": result.get("organization_profile", {}),
        "responsibilities_count": len(result.get("responsibilities", [])),
        "status": result.get("status"),
        "created_at": datetime.utcnow().isoformat(),
    }


async def handle_map_responsibilities(args: Dict[str, Any]) -> Dict[str, Any]:
    """
    Map and categorize responsibilities from analysis.
    """
    analysis_id = args["analysis_id"]
    categories = args.get("categories")

    logger.info(f"🗺️  Mapping responsibilities for analysis: {analysis_id}")

    # Load analysis from checkpoint
    checkpoint_path = Path(CONFIG["checkpoint_dir"]) / f"{analysis_id}.json"

    if not checkpoint_path.exists():
        raise ValueError(f"Analysis not found: {analysis_id}")

    with open(checkpoint_path, 'r') as f:
        analysis_data = json.load(f)

    responsibilities = analysis_data.get("responsibilities", [])

    # Filter by categories if specified
    if categories:
        responsibilities = [
            r for r in responsibilities
            if r.get("category") in categories
        ]

    # Group by category
    by_category = {}
    for resp in responsibilities:
        cat = resp.get("category", "UNCATEGORIZED")
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append(resp)

    return {
        "analysis_id": analysis_id,
        "total_responsibilities": len(responsibilities),
        "by_category": {
            cat: {
                "count": len(resps),
                "responsibilities": resps
            }
            for cat, resps in by_category.items()
        },
        "categories": list(by_category.keys()),
    }


async def handle_score_automation(args: Dict[str, Any]) -> Dict[str, Any]:
    """
    Score automation potential for responsibilities.
    """
    analysis_id = args["analysis_id"]
    filters = args.get("filters", {})

    logger.info(f"🎯 Scoring automation potential for: {analysis_id}")

    # Load analysis from checkpoint
    checkpoint_path = Path(CONFIG["checkpoint_dir"]) / f"{analysis_id}.json"

    if not checkpoint_path.exists():
        raise ValueError(f"Analysis not found: {analysis_id}")

    with open(checkpoint_path, 'r') as f:
        analysis_data = json.load(f)

    responsibilities = analysis_data.get("responsibilities", [])

    # Score each responsibility
    scored_responsibilities = []
    total_time_savings = 0

    for resp in responsibilities:
        score = await score_automation_potential(resp)

        resp_with_score = {
            **resp,
            "automation_score": score.score,
            "automation_approach": score.approach,
            "automation_rationale": score.rationale,
            "estimated_time_savings_pct": score.time_savings_pct,
            "implementation_effort": score.implementation_effort,
            "roi_months": score.roi_months,
        }

        scored_responsibilities.append(resp_with_score)

        # Calculate time savings
        hours_per_period = resp.get("estimated_hours_per_period", 0)
        total_time_savings += hours_per_period * (score.time_savings_pct / 100)

    # Sort by automation score (descending)
    scored_responsibilities.sort(
        key=lambda r: r["automation_score"],
        reverse=True
    )

    # Identify high-priority opportunities (score >= 60)
    high_priority = [r for r in scored_responsibilities if r["automation_score"] >= 60]

    return {
        "analysis_id": analysis_id,
        "total_responsibilities": len(scored_responsibilities),
        "average_automation_score": sum(r["automation_score"] for r in scored_responsibilities) / len(scored_responsibilities),
        "high_priority_count": len(high_priority),
        "estimated_weekly_time_savings_hours": round(total_time_savings, 1),
        "responsibilities": scored_responsibilities,
        "high_priority_opportunities": high_priority[:10],  # Top 10
    }


async def handle_generate_workflow(args: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate LangGraph workflow specification for a responsibility.
    """
    responsibility_id = args["responsibility_id"]
    workflow_type = args["workflow_type"]
    options = args.get("options", {})

    logger.info(f"⚙️  Generating {workflow_type} workflow for: {responsibility_id}")

    # Create workflow generation workflow
    workflow = create_workflow_generation_workflow()

    # Generate thread ID
    thread_id = f"workflow_gen_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"

    # Initial state
    initial_state = {
        "responsibility_id": responsibility_id,
        "workflow_type": workflow_type,
        "options": options,
        "workflow_spec": {},
        "current_step": "analyzing",
        "errors": [],
    }

    # Execute workflow
    result = await execute_workflow(
        workflow=workflow,
        initial_state=initial_state,
        thread_id=thread_id,
        checkpoint_dir=CONFIG["checkpoint_dir"]
    )

    workflow_spec = result.get("workflow_spec", {})

    return {
        "workflow_id": thread_id,
        "responsibility_id": responsibility_id,
        "workflow_type": workflow_type,
        "specification": workflow_spec,
        "deployment_ready": result.get("status") == "completed",
        "created_at": datetime.utcnow().isoformat(),
    }


async def handle_deploy_workflow(args: Dict[str, Any]) -> Dict[str, Any]:
    """
    Deploy a generated workflow to target environment.
    """
    workflow_id = args["workflow_id"]
    environment = args["environment"]
    config = args.get("config", {})

    logger.info(f"🚀 Deploying workflow {workflow_id} to {environment}")

    # Create deployment workflow
    workflow = create_deployment_workflow()

    # Generate thread ID
    thread_id = f"deploy_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"

    # Initial state
    initial_state = {
        "workflow_id": workflow_id,
        "environment": environment,
        "config": config,
        "deployment_status": {},
        "current_step": "preparing",
        "errors": [],
    }

    # Execute deployment
    result = await execute_workflow(
        workflow=workflow,
        initial_state=initial_state,
        thread_id=thread_id,
        checkpoint_dir=CONFIG["checkpoint_dir"]
    )

    return {
        "deployment_id": thread_id,
        "workflow_id": workflow_id,
        "environment": environment,
        "status": result.get("status"),
        "endpoint": result.get("endpoint"),
        "monitoring_url": result.get("monitoring_url"),
        "deployed_at": datetime.utcnow().isoformat(),
    }


async def handle_execute_workflow(args: Dict[str, Any]) -> Dict[str, Any]:
    """
    Execute a deployed workflow with input data.
    """
    workflow_id = args["workflow_id"]
    input_data = args["input_data"]
    thread_id = args.get("thread_id")
    stream = args.get("stream", False)

    if not thread_id:
        thread_id = f"exec_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"

    logger.info(f"▶️  Executing workflow {workflow_id} (thread: {thread_id})")

    # Load workflow specification
    workflow_checkpoint = Path(CONFIG["checkpoint_dir"]) / f"{workflow_id}.json"

    if not workflow_checkpoint.exists():
        raise ValueError(f"Workflow not found: {workflow_id}")

    with open(workflow_checkpoint, 'r') as f:
        workflow_data = json.load(f)

    workflow_spec = workflow_data.get("workflow_spec", {})

    # TODO: Dynamically instantiate workflow from spec
    # For now, return execution handle

    return {
        "execution_id": thread_id,
        "workflow_id": workflow_id,
        "status": "running",
        "started_at": datetime.utcnow().isoformat(),
        "stream_enabled": stream,
    }


async def handle_get_status(args: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get status of workflow execution.
    """
    thread_id = args["thread_id"]

    logger.info(f"📊 Getting status for: {thread_id}")

    status = await get_workflow_status(thread_id, CONFIG["checkpoint_dir"])

    return status


async def handle_approve_step(args: Dict[str, Any]) -> Dict[str, Any]:
    """
    Approve human-in-the-loop workflow step.
    """
    thread_id = args["thread_id"]
    approved = args["approved"]
    feedback = args.get("feedback", "")

    logger.info(f"✋ Human approval for {thread_id}: {approved}")

    # Resume workflow with approval
    result = await resume_workflow(
        thread_id=thread_id,
        checkpoint_dir=CONFIG["checkpoint_dir"],
        updates={"human_approved": approved, "human_feedback": feedback}
    )

    return {
        "thread_id": thread_id,
        "approved": approved,
        "status": result.get("status"),
        "resumed_at": datetime.utcnow().isoformat(),
    }


async def handle_manage_templates(args: Dict[str, Any]) -> Dict[str, Any]:
    """
    Manage workflow templates.
    """
    action = args["action"]
    template_name = args.get("template_name")
    template_data = args.get("template_data")

    logger.info(f"📝 Template action: {action}")

    templates_dir = Path(CONFIG["templates_dir"])

    if action == "list":
        templates = []
        for template_file in templates_dir.glob("*.json"):
            with open(template_file, 'r') as f:
                template = json.load(f)
                templates.append({
                    "name": template_file.stem,
                    "description": template.get("description"),
                    "workflow_type": template.get("workflow_type"),
                })

        return {"templates": templates, "count": len(templates)}

    elif action == "create":
        if not template_name or not template_data:
            raise ValueError("template_name and template_data required for create")

        template_path = templates_dir / f"{template_name}.json"

        if template_path.exists():
            raise ValueError(f"Template already exists: {template_name}")

        with open(template_path, 'w') as f:
            json.dump(template_data, f, indent=2)

        return {"template_name": template_name, "action": "created"}

    elif action == "update":
        if not template_name or not template_data:
            raise ValueError("template_name and template_data required for update")

        template_path = templates_dir / f"{template_name}.json"

        if not template_path.exists():
            raise ValueError(f"Template not found: {template_name}")

        with open(template_path, 'w') as f:
            json.dump(template_data, f, indent=2)

        return {"template_name": template_name, "action": "updated"}

    elif action == "delete":
        if not template_name:
            raise ValueError("template_name required for delete")

        template_path = templates_dir / f"{template_name}.json"

        if not template_path.exists():
            raise ValueError(f"Template not found: {template_name}")

        template_path.unlink()

        return {"template_name": template_name, "action": "deleted"}

    else:
        raise ValueError(f"Unknown action: {action}")


async def handle_query_patterns(args: Dict[str, Any]) -> Dict[str, Any]:
    """
    Query responsibility pattern library.
    """
    query = args["query"]
    filters = args.get("filters", {})
    limit = args.get("limit", 10)

    logger.info(f"🔍 Querying patterns: {query}")

    patterns = await query_pattern_library(
        query=query,
        filters=filters,
        limit=limit,
        pattern_library_path=CONFIG["pattern_library_path"]
    )

    return {
        "query": query,
        "patterns": patterns,
        "count": len(patterns),
    }


# ============================================================================
# SERVER INITIALIZATION
# ============================================================================

async def main():
    """
    Main server entry point.

    Initializes the MCP server and starts listening for connections via stdio.
    This server runs as a subprocess managed by Claude Code or other MCP clients.
    """
    logger.info("=" * 80)
    logger.info("🎯 EXEC-AUTOMATOR MCP SERVER")
    logger.info("=" * 80)
    logger.info("Built by Brookside BI")
    logger.info("Amplifying executive capacity through intelligent automation")
    logger.info("=" * 80)

    # Run stdio server
    async with stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            app.create_initialization_options()
        )


if __name__ == "__main__":
    asyncio.run(main())
