"""
Domain Agent Definitions

Specialized agents for different executive director responsibility domains.

Author: Brookside BI
"""

from typing import Dict, List, Any
from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool


# ============================================================================
# AGENT CONFIGURATIONS
# ============================================================================

DOMAIN_AGENTS = {
    "governance": {
        "name": "Governance Agent",
        "description": "Specialist in board relations, policy development, and compliance",
        "model": "claude-sonnet-5",
        "system_prompt": """You are a governance specialist for nonprofit and association management.

Your expertise includes:
- Board relations and executive director-board dynamics
- Policy development and implementation
- Compliance with nonprofit regulations
- Governance best practices
- Meeting facilitation and board reporting
- Bylaw interpretation and application

You provide strategic guidance on governance matters while respecting the critical
role of human judgment in board-level decisions.""",
        "tools": ["board_meeting_scheduler", "policy_drafter", "compliance_checker"],
        "capabilities": [
            "board_meeting_preparation",
            "policy_analysis",
            "compliance_monitoring",
            "governance_reporting",
        ]
    },

    "financial": {
        "name": "Financial Agent",
        "description": "Specialist in budgeting, financial reporting, and fiscal management",
        "model": "claude-sonnet-5",
        "system_prompt": """You are a financial management specialist for nonprofit organizations.

Your expertise includes:
- Budget development and monitoring
- Financial reporting and analysis
- Audit coordination
- Cash flow management
- Grant financial management
- Financial policy compliance
- Investment oversight

You provide data-driven financial insights while ensuring transparency and
accountability in all financial matters.""",
        "tools": ["budget_analyzer", "financial_reporter", "audit_coordinator"],
        "capabilities": [
            "budget_variance_analysis",
            "financial_report_generation",
            "cash_flow_forecasting",
            "grant_tracking",
        ]
    },

    "operations": {
        "name": "Operations Agent",
        "description": "Specialist in daily operations, process optimization, and facilities",
        "model": "claude-sonnet-5",
        "system_prompt": """You are an operations management specialist for associations.

Your expertise includes:
- Process optimization and workflow design
- Facilities management
- Vendor management
- Technology systems
- Operational efficiency
- Resource allocation

You streamline operations to create capacity for strategic initiatives.""",
        "tools": ["process_optimizer", "vendor_manager", "facilities_coordinator"],
        "capabilities": [
            "process_mapping",
            "efficiency_analysis",
            "vendor_evaluation",
            "resource_planning",
        ]
    },

    "strategic": {
        "name": "Strategic Agent",
        "description": "Specialist in strategic planning, partnerships, and growth",
        "model": "claude-opus-4-8",  # Use Opus for strategic thinking
        "system_prompt": """You are a strategic planning specialist for nonprofit organizations.

Your expertise includes:
- Strategic planning and goal setting
- Partnership development
- Growth strategies
- Market analysis
- Competitive positioning
- Innovation and adaptation

You think long-term and help organizations navigate change while staying
true to their mission.""",
        "tools": ["strategic_planner", "partnership_analyzer", "market_researcher"],
        "capabilities": [
            "strategic_planning",
            "partnership_identification",
            "market_analysis",
            "scenario_planning",
        ]
    },

    "communications": {
        "name": "Communications Agent",
        "description": "Specialist in marketing, PR, and member communications",
        "model": "claude-sonnet-5",
        "system_prompt": """You are a communications and marketing specialist for associations.

Your expertise includes:
- Marketing strategy and execution
- Public relations
- Member communications
- Content creation
- Social media management
- Brand management
- Crisis communications

You craft compelling messages that engage stakeholders and advance
organizational objectives.""",
        "tools": ["content_generator", "social_media_scheduler", "pr_coordinator"],
        "capabilities": [
            "content_creation",
            "campaign_management",
            "stakeholder_communications",
            "brand_monitoring",
        ]
    },

    "membership": {
        "name": "Membership Agent",
        "description": "Specialist in member recruitment, retention, and engagement",
        "model": "claude-sonnet-5",
        "system_prompt": """You are a membership development specialist for associations.

Your expertise includes:
- Member recruitment strategies
- Retention and renewal
- Member engagement programs
- Value proposition development
- Member satisfaction analysis
- Segmentation and targeting

You build strong member relationships and demonstrate clear value.""",
        "tools": ["member_analyzer", "retention_optimizer", "engagement_tracker"],
        "capabilities": [
            "recruitment_campaign_design",
            "retention_analysis",
            "engagement_scoring",
            "value_proposition_development",
        ]
    },

    "programs": {
        "name": "Programs Agent",
        "description": "Specialist in events, education, and member services",
        "model": "claude-sonnet-5",
        "system_prompt": """You are a program management specialist for associations.

Your expertise includes:
- Event planning and management
- Educational program development
- Certification programs
- Conference management
- Program evaluation
- ROI analysis

You design and deliver programs that create value for members and
achieve organizational goals.""",
        "tools": ["event_planner", "program_evaluator", "certification_manager"],
        "capabilities": [
            "event_planning",
            "program_development",
            "evaluation_design",
            "participant_management",
        ]
    },

    "staff": {
        "name": "Staff Management Agent",
        "description": "Specialist in hiring, training, and performance management",
        "model": "claude-sonnet-5",
        "system_prompt": """You are a human resources and staff management specialist.

Your expertise includes:
- Recruitment and hiring
- Onboarding and training
- Performance management
- Professional development
- Compensation and benefits
- Team culture building

You help build high-performing teams while maintaining compliance
with employment law.""",
        "tools": ["recruiting_assistant", "performance_tracker", "training_coordinator"],
        "capabilities": [
            "job_description_development",
            "candidate_screening",
            "performance_evaluation",
            "training_planning",
        ]
    },

    "technology": {
        "name": "Technology Agent",
        "description": "Specialist in systems, digital transformation, and IT oversight",
        "model": "claude-sonnet-5",
        "system_prompt": """You are a technology and digital transformation specialist.

Your expertise includes:
- Technology strategy
- System selection and implementation
- Digital transformation
- Data management
- Cybersecurity
- IT vendor management

You leverage technology to enhance organizational effectiveness and
member value.""",
        "tools": ["system_evaluator", "data_analyzer", "security_auditor"],
        "capabilities": [
            "technology_assessment",
            "system_integration",
            "data_analysis",
            "security_review",
        ]
    },

    "external_relations": {
        "name": "External Relations Agent",
        "description": "Specialist in government relations, coalitions, and partnerships",
        "model": "claude-sonnet-5",
        "system_prompt": """You are an external relations and advocacy specialist.

Your expertise includes:
- Government relations
- Coalition building
- Partnership development
- Advocacy strategy
- Legislative tracking
- Stakeholder engagement

You build strategic relationships that amplify organizational impact
and advance policy goals.""",
        "tools": ["advocacy_tracker", "coalition_manager", "legislative_monitor"],
        "capabilities": [
            "advocacy_planning",
            "coalition_coordination",
            "legislative_tracking",
            "stakeholder_mapping",
        ]
    },
}


# ============================================================================
# AGENT FACTORY
# ============================================================================

def create_domain_agent(domain: str, custom_config: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Create a domain-specific agent configuration.

    Args:
        domain: Domain name (governance, financial, operations, etc.)
        custom_config: Optional custom configuration overrides

    Returns:
        Agent configuration dictionary

    Raises:
        ValueError: If domain is not recognized
    """
    if domain not in DOMAIN_AGENTS:
        raise ValueError(f"Unknown domain: {domain}. Available: {list(DOMAIN_AGENTS.keys())}")

    config = DOMAIN_AGENTS[domain].copy()

    if custom_config:
        config.update(custom_config)

    return config


def get_agent_for_responsibility(responsibility: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get appropriate domain agent for a responsibility.

    Args:
        responsibility: Responsibility object with category

    Returns:
        Agent configuration

    Raises:
        ValueError: If category doesn't map to a domain
    """
    category = responsibility.get("category", "").upper()

    # Map category to domain
    category_to_domain = {
        "GOVERNANCE": "governance",
        "FINANCIAL": "financial",
        "OPERATIONS": "operations",
        "STRATEGIC": "strategic",
        "COMMUNICATIONS": "communications",
        "MEMBERSHIP": "membership",
        "PROGRAMS": "programs",
        "STAFF": "staff",
        "TECHNOLOGY": "technology",
        "EXTERNAL_RELATIONS": "external_relations",
    }

    domain = category_to_domain.get(category)

    if not domain:
        raise ValueError(f"No agent domain for category: {category}")

    return create_domain_agent(domain)


def list_available_agents() -> List[Dict[str, Any]]:
    """
    List all available domain agents.

    Returns:
        List of agent configurations
    """
    return [
        {
            "domain": domain,
            "name": config["name"],
            "description": config["description"],
            "model": config["model"],
            "capabilities": config["capabilities"],
        }
        for domain, config in DOMAIN_AGENTS.items()
    ]


# ============================================================================
# AGENT TOOLS
# ============================================================================

# Placeholder tool definitions
# In production, these would be implemented as full LangChain tools

@tool
def board_meeting_scheduler(meeting_date: str, agenda_items: List[str]) -> Dict[str, Any]:
    """Schedule board meeting and prepare materials."""
    return {"scheduled": True, "meeting_id": "meeting_001"}


@tool
def budget_analyzer(budget_data: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze budget variance and trends."""
    return {"variance_pct": 2.5, "status": "on_track"}


@tool
def process_optimizer(process_name: str) -> Dict[str, Any]:
    """Analyze and optimize operational process."""
    return {"efficiency_gain": 25, "recommendations": []}


@tool
def strategic_planner(goals: List[str], timeframe: str) -> Dict[str, Any]:
    """Develop strategic plan based on goals."""
    return {"plan_id": "plan_001", "initiatives": []}


@tool
def content_generator(topic: str, format: str) -> Dict[str, Any]:
    """Generate content for communications."""
    return {"content_id": "content_001", "draft": "..."}


@tool
def member_analyzer(member_data: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze member engagement and satisfaction."""
    return {"engagement_score": 75, "insights": []}


@tool
def event_planner(event_type: str, attendee_count: int) -> Dict[str, Any]:
    """Plan and coordinate event logistics."""
    return {"event_id": "event_001", "timeline": []}


@tool
def recruiting_assistant(job_description: str) -> Dict[str, Any]:
    """Assist with recruiting and candidate screening."""
    return {"candidates": [], "recommendations": []}


@tool
def system_evaluator(requirements: List[str]) -> Dict[str, Any]:
    """Evaluate technology systems against requirements."""
    return {"scores": {}, "recommendation": ""}


@tool
def advocacy_tracker(issue: str) -> Dict[str, Any]:
    """Track advocacy issues and legislative activity."""
    return {"status": "active", "updates": []}


# Export all
__all__ = [
    "DOMAIN_AGENTS",
    "create_domain_agent",
    "get_agent_for_responsibility",
    "list_available_agents",
]
