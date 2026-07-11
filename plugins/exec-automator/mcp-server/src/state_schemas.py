"""
State Schema Definitions

TypedDict schemas for LangGraph workflows and data structures.

Author: Brookside BI
"""

from typing import TypedDict, Annotated, List, Dict, Any, Optional, Literal
from datetime import datetime
import operator


# ============================================================================
# WORKFLOW STATE SCHEMAS
# ============================================================================

class OrgAnalysisState(TypedDict):
    """
    State schema for organizational analysis workflow.

    This workflow parses documents, extracts responsibilities, and generates
    comprehensive organizational profiles.
    """
    # Input
    document_path: str
    document_type: str  # "rfp", "job_description", "bylaws", "auto"

    # Intermediate data
    raw_text: str
    detected_document_type: str
    metadata: Dict[str, Any]

    # Analysis results
    organization_profile: Dict[str, Any]
    responsibilities: List[Dict[str, Any]]
    stakeholders: List[Dict[str, Any]]

    # Workflow control
    current_step: str
    status: str
    errors: Annotated[List[Dict[str, Any]], operator.add]
    retry_count: int


class WorkflowGenerationState(TypedDict):
    """
    State schema for workflow generation workflow.

    Meta-workflow that designs new LangGraph workflows based on
    responsibility requirements.
    """
    # Input
    responsibility_id: str
    workflow_type: str  # "autonomous", "human_in_loop", "assisted", "advisory"
    options: Dict[str, Any]

    # Analysis
    responsibility_data: Dict[str, Any]
    workflow_analysis: str
    pattern_matches: List[Dict[str, Any]]

    # Output
    workflow_spec: Dict[str, Any]

    # Workflow control
    current_step: str
    status: str
    errors: Annotated[List[Dict[str, Any]], operator.add]


class DeploymentState(TypedDict):
    """
    State schema for workflow deployment workflow.

    Handles deployment of generated workflows to target environments.
    """
    # Input
    workflow_id: str
    environment: Literal["development", "staging", "production"]
    config: Dict[str, Any]

    # Deployment tracking
    deployment_status: Dict[str, Any]
    health_checks: Dict[str, Any]

    # Output
    endpoint: str
    monitoring_url: str

    # Workflow control
    current_step: str
    status: str
    errors: Annotated[List[Dict[str, Any]], operator.add]


class ExecutionState(TypedDict):
    """
    Generic state schema for dynamically created workflows.

    This flexible schema can be extended based on workflow requirements.
    """
    # Input data
    input_data: Dict[str, Any]

    # Processing results
    results: Annotated[Dict[str, Any], operator.add]

    # Human-in-the-loop
    human_approved: Optional[bool]
    human_feedback: Optional[str]

    # Workflow control
    current_step: str
    status: str
    errors: Annotated[List[Dict[str, Any]], operator.add]
    retry_count: int
    max_retries: int

    # Timestamps
    started_at: str
    completed_at: Optional[str]


# ============================================================================
# DATA STRUCTURE SCHEMAS
# ============================================================================

class Responsibility(TypedDict):
    """
    Executive director responsibility.

    Represents a single responsibility extracted from organizational documents.
    """
    id: str
    raw_text: str
    action: str
    object: str
    context: str
    outcome: str
    category: str
    frequency: Literal["daily", "weekly", "monthly", "quarterly", "annual", "as-needed"]
    estimated_hours_per_period: float
    complexity: Literal["low", "medium", "high"]
    criticality: Literal["optional", "important", "critical", "mission-critical"]
    automation_score: Optional[int]
    automation_approach: Optional[str]
    automation_rationale: Optional[str]
    stakeholders: List[str]
    success_metrics: List[str]
    dependencies: List[str]
    knowledge_required: List[str]
    tools_required: List[str]
    evidence: str  # Citation to source document


class AutomationScore(TypedDict):
    """
    Automation potential score for a responsibility.

    Score ranges:
    - 80-100: Highly automatable
    - 60-79: Moderately automatable
    - 40-59: Partially automatable
    - 20-39: Low automation potential
    - 0-19: Human-only
    """
    score: int  # 0-100
    approach: str  # "Full Automation", "Human-in-Loop", etc.
    rationale: str
    time_savings_pct: int  # Estimated time savings percentage
    implementation_effort: Literal["low", "medium", "high", "n/a"]
    roi_months: int  # Estimated payback period in months


class OrganizationalProfile(TypedDict):
    """
    Comprehensive organizational profile.

    Generated from document analysis and used for automation planning.
    """
    # Identity
    profile_id: str
    organization_name: str
    organization_type: str
    industry: List[str]
    sector: str
    geographic_scope: str
    mission: str

    # Scale
    budget_annual: Optional[float]
    budget_range: Optional[str]
    members_count: Optional[int]
    staff_count: Optional[int]

    # Governance
    governance_structure: Dict[str, Any]
    board_composition: Dict[str, Any]

    # Executive Director Profile
    ed_responsibilities: List[Responsibility]
    ed_time_allocation: Dict[str, float]  # Percentage by category

    # Automation Analysis
    automation_potential: float  # 0-100 overall score
    high_priority_opportunities: List[Dict[str, Any]]
    estimated_time_savings_hours_per_week: float

    # Metadata
    created_at: str
    updated_at: str
    source_documents: List[str]


class WorkflowSpec(TypedDict):
    """
    LangGraph workflow specification.

    Complete specification for generating executable workflow code.
    """
    workflow_id: str
    workflow_name: str
    workflow_type: str
    description: str

    # State schema definition
    state_schema: Dict[str, Any]

    # Node definitions
    nodes: List[Dict[str, Any]]

    # Edge definitions
    edges: List[Dict[str, Any]]

    # Entry point
    entry_point: str

    # Human approval gates
    human_approval_gates: List[str]

    # Error handling
    error_handling: Dict[str, Any]

    # Checkpointing configuration
    checkpointing: Dict[str, Any]

    # Tool requirements
    required_tools: List[str]

    # Integration requirements
    integrations: List[str]

    # Generated code (optional)
    python_code: Optional[str]

    # Metadata
    created_at: str
    responsibility_id: Optional[str]


class AgentSpec(TypedDict):
    """
    Specialized agent specification.

    Configuration for deploying domain-specific agents.
    """
    agent_id: str
    agent_name: str
    description: str
    model: str  # "claude-sonnet-5", "claude-opus-4-8", etc.
    tools: List[str]
    system_prompt: str
    capabilities: List[str]
    responsibility_id: Optional[str]
    deployment_config: Dict[str, Any]


class Pattern(TypedDict):
    """
    Responsibility pattern from pattern library.

    Represents a common executive director responsibility pattern
    with associated automation insights.
    """
    pattern_id: str
    category: str
    description: str
    variants: List[str]
    typical_tasks: List[str]
    automation_potential: int  # 0-100
    automation_opportunities: List[str]
    human_judgment_required: List[str]
    typical_time_allocation: str
    success_metrics: List[str]


class SimilarOrganization(TypedDict):
    """
    Similar organization for benchmarking.

    Used for comparative analysis and pattern matching.
    """
    organization_id: str
    organization_name: str
    organization_type: str
    industry: str
    budget_range: str
    similarity_score: float  # 0-1
    matching_attributes: List[str]
    automation_insights: Dict[str, Any]


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def create_initial_org_analysis_state(
    document_path: str,
    document_type: str = "auto"
) -> OrgAnalysisState:
    """
    Create initial state for organizational analysis workflow.

    Args:
        document_path: Path to document to analyze
        document_type: Type of document or "auto"

    Returns:
        Initial OrgAnalysisState
    """
    return OrgAnalysisState(
        document_path=document_path,
        document_type=document_type,
        raw_text="",
        detected_document_type="",
        metadata={},
        organization_profile={},
        responsibilities=[],
        stakeholders=[],
        current_step="initialized",
        status="pending",
        errors=[],
        retry_count=0,
    )


def create_initial_workflow_generation_state(
    responsibility_id: str,
    workflow_type: str,
    options: Optional[Dict[str, Any]] = None
) -> WorkflowGenerationState:
    """
    Create initial state for workflow generation workflow.

    Args:
        responsibility_id: Responsibility to automate
        workflow_type: Type of workflow to generate
        options: Customization options

    Returns:
        Initial WorkflowGenerationState
    """
    return WorkflowGenerationState(
        responsibility_id=responsibility_id,
        workflow_type=workflow_type,
        options=options or {},
        responsibility_data={},
        workflow_analysis="",
        pattern_matches=[],
        workflow_spec={},
        current_step="initialized",
        status="pending",
        errors=[],
    )


def create_initial_deployment_state(
    workflow_id: str,
    environment: str,
    config: Optional[Dict[str, Any]] = None
) -> DeploymentState:
    """
    Create initial state for deployment workflow.

    Args:
        workflow_id: Workflow to deploy
        environment: Target environment
        config: Deployment configuration

    Returns:
        Initial DeploymentState
    """
    return DeploymentState(
        workflow_id=workflow_id,
        environment=environment,
        config=config or {},
        deployment_status={},
        health_checks={},
        endpoint="",
        monitoring_url="",
        current_step="initialized",
        status="pending",
        errors=[],
    )


def create_initial_execution_state(
    input_data: Dict[str, Any],
    max_retries: int = 3
) -> ExecutionState:
    """
    Create initial state for workflow execution.

    Args:
        input_data: Input data for workflow
        max_retries: Maximum retry attempts

    Returns:
        Initial ExecutionState
    """
    return ExecutionState(
        input_data=input_data,
        results={},
        human_approved=None,
        human_feedback=None,
        current_step="initialized",
        status="pending",
        errors=[],
        retry_count=0,
        max_retries=max_retries,
        started_at=datetime.utcnow().isoformat(),
        completed_at=None,
    )
