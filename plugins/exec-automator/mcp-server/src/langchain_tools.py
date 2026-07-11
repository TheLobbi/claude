"""
LangChain Tool Definitions

Custom tools for document parsing, automation scoring, workflow generation,
and integration with external services.

Author: Brookside BI
"""

import json
import logging
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

from langchain_core.tools import tool
from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from langchain_core.prompts import ChatPromptTemplate

from state_schemas import AutomationScore, Responsibility

logger = logging.getLogger("langchain_tools")


# ============================================================================
# DOCUMENT PARSING TOOLS
# ============================================================================

@tool
async def parse_document(file_path: str, document_type: str = "auto") -> Dict[str, Any]:
    """
    Parse organizational document and extract text.

    Supports PDF, DOCX, TXT, MD formats. Uses appropriate parsing strategy
    based on document type.

    Args:
        file_path: Path to document file
        document_type: Type of document or "auto" for detection

    Returns:
        Dictionary with text, document_type, and metadata
    """
    logger.info(f"Parsing document: {file_path}")

    path = Path(file_path)

    if not path.exists():
        raise ValueError(f"File not found: {file_path}")

    # Detect document type from extension if auto
    if document_type == "auto":
        ext = path.suffix.lower()
        if ext == ".pdf":
            document_type = "pdf"
        elif ext in [".docx", ".doc"]:
            document_type = "docx"
        elif ext in [".txt", ".md"]:
            document_type = "text"
        else:
            raise ValueError(f"Unsupported file type: {ext}")

    # Parse based on type
    if document_type == "pdf":
        text = await parse_pdf(path)
    elif document_type == "docx":
        text = await parse_docx(path)
    else:
        with open(path, 'r', encoding='utf-8') as f:
            text = f.read()

    # Detect specific document type (RFP, job description, etc.)
    detected_type = await detect_document_type(text)

    return {
        "text": text,
        "document_type": detected_type,
        "metadata": {
            "file_path": str(path),
            "file_size": path.stat().st_size,
            "extension": path.suffix,
        }
    }


async def parse_pdf(path: Path) -> str:
    """Parse PDF document."""
    try:
        import pypdf

        text = ""
        with open(path, 'rb') as f:
            pdf = pypdf.PdfReader(f)
            for page in pdf.pages:
                text += page.extract_text() + "\n\n"

        return text

    except ImportError:
        logger.warning("pypdf not installed, using basic text extraction")
        # Fallback to basic extraction
        return f"[PDF content from {path.name}]"


async def parse_docx(path: Path) -> str:
    """Parse DOCX document."""
    try:
        import docx

        doc = docx.Document(path)
        text = "\n\n".join([para.text for para in doc.paragraphs])

        return text

    except ImportError:
        logger.warning("python-docx not installed, using basic text extraction")
        return f"[DOCX content from {path.name}]"


async def detect_document_type(text: str) -> str:
    """
    Detect specific document type from content.

    Returns: "rfp", "job_description", "bylaws", "strategic_plan", or "unknown"
    """
    text_lower = text.lower()

    # RFP indicators
    rfp_indicators = [
        "request for proposal",
        "rfp",
        "proposal submission",
        "scope of work",
        "evaluation criteria"
    ]

    # Job description indicators
    jd_indicators = [
        "position description",
        "job description",
        "essential functions",
        "qualifications required",
        "reports to"
    ]

    # Bylaws indicators
    bylaws_indicators = [
        "bylaws",
        "articles of incorporation",
        "governance",
        "board of directors",
        "membership requirements"
    ]

    # Strategic plan indicators
    strategic_indicators = [
        "strategic plan",
        "vision statement",
        "strategic goals",
        "initiatives",
        "objectives"
    ]

    # Count matches
    rfp_score = sum(1 for ind in rfp_indicators if ind in text_lower)
    jd_score = sum(1 for ind in jd_indicators if ind in text_lower)
    bylaws_score = sum(1 for ind in bylaws_indicators if ind in text_lower)
    strategic_score = sum(1 for ind in strategic_indicators if ind in text_lower)

    # Return type with highest score
    scores = {
        "rfp": rfp_score,
        "job_description": jd_score,
        "bylaws": bylaws_score,
        "strategic_plan": strategic_score,
    }

    max_type = max(scores, key=scores.get)

    if scores[max_type] > 0:
        return max_type
    else:
        return "unknown"


# ============================================================================
# RESPONSIBILITY EXTRACTION TOOLS
# ============================================================================

@tool
async def extract_responsibilities(text: str, document_type: str) -> List[Responsibility]:
    """
    Extract executive director responsibilities from document text.

    Uses LLM to identify responsibilities with semantic understanding.

    Args:
        text: Document text
        document_type: Type of document

    Returns:
        List of Responsibility objects
    """
    logger.info(f"Extracting responsibilities from {document_type}")

    llm = ChatAnthropic(model="claude-sonnet-5")

    prompt = f"""You are an expert in association management and nonprofit governance.

Extract ALL executive director responsibilities from this {document_type} document.

For each responsibility, provide:
- id: Unique identifier (e.g., "resp_001")
- raw_text: Original text from document
- action: Main action verb (manage, oversee, develop, etc.)
- object: What is being acted upon
- context: Collaborators, timing, constraints
- outcome: Expected result or deliverable
- frequency: How often (daily, weekly, monthly, quarterly, annual, as-needed)
- estimated_hours_per_period: Rough estimate of time required
- complexity: low, medium, or high
- criticality: optional, important, critical, or mission-critical

Return ONLY a JSON array of responsibilities. No other text.

Document:
{text}
"""

    response = llm.invoke([HumanMessage(content=prompt)])

    # Parse JSON response
    try:
        # Extract JSON from response (handle markdown code blocks)
        content = response.content
        if "```json" in content:
            json_str = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            json_str = content.split("```")[1].split("```")[0].strip()
        else:
            json_str = content.strip()

        responsibilities = json.loads(json_str)

        logger.info(f"Extracted {len(responsibilities)} responsibilities")

        return responsibilities

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse LLM response as JSON: {e}")
        logger.error(f"Response: {response.content}")
        return []


@tool
async def categorize_responsibility(responsibility: Responsibility) -> str:
    """
    Categorize a responsibility into domain.

    Categories:
    - GOVERNANCE: Board relations, policy, compliance
    - FINANCIAL: Budget, fundraising, audit
    - OPERATIONS: Daily management, processes
    - STRATEGIC: Planning, partnerships, growth
    - COMMUNICATIONS: Marketing, PR, advocacy
    - MEMBERSHIP: Recruitment, retention, engagement
    - PROGRAMS: Events, education, services
    - STAFF: Hiring, training, management
    - TECHNOLOGY: Systems, digital transformation
    - EXTERNAL_RELATIONS: Government, coalitions, partnerships

    Args:
        responsibility: Responsibility object

    Returns:
        Category string
    """
    llm = ChatAnthropic(model="claude-haiku-4-5")

    prompt = f"""Categorize this executive director responsibility into ONE category.

Categories:
- GOVERNANCE
- FINANCIAL
- OPERATIONS
- STRATEGIC
- COMMUNICATIONS
- MEMBERSHIP
- PROGRAMS
- STAFF
- TECHNOLOGY
- EXTERNAL_RELATIONS

Responsibility: {responsibility.get('raw_text')}

Return ONLY the category name. No other text.
"""

    response = llm.invoke([HumanMessage(content=prompt)])

    category = response.content.strip().upper()

    # Validate category
    valid_categories = [
        "GOVERNANCE", "FINANCIAL", "OPERATIONS", "STRATEGIC",
        "COMMUNICATIONS", "MEMBERSHIP", "PROGRAMS", "STAFF",
        "TECHNOLOGY", "EXTERNAL_RELATIONS"
    ]

    if category not in valid_categories:
        logger.warning(f"Invalid category: {category}, defaulting to OPERATIONS")
        category = "OPERATIONS"

    return category


# ============================================================================
# AUTOMATION SCORING TOOLS
# ============================================================================

@tool
async def score_automation_potential(responsibility: Responsibility) -> AutomationScore:
    """
    Score automation potential for a responsibility.

    Uses proprietary algorithm considering:
    - Repetitiveness and frequency
    - Rule-based vs judgment-based
    - Data-driven vs relationship-driven
    - Stakeholder complexity
    - Strategic vs operational
    - Risk and compliance factors

    Args:
        responsibility: Responsibility object

    Returns:
        AutomationScore object
    """
    logger.info(f"Scoring automation potential: {responsibility.get('id')}")

    # Base score
    base_score = 50

    # Positive factors (increase score)

    # Repetitive and frequent
    frequency = responsibility.get("frequency", "as-needed")
    if frequency == "daily":
        base_score += 15
    elif frequency == "weekly":
        base_score += 10
    elif frequency == "monthly":
        base_score += 5

    # Low complexity
    complexity = responsibility.get("complexity", "medium")
    if complexity == "low":
        base_score += 15
    elif complexity == "medium":
        base_score += 5

    # Data-driven (check for keywords)
    text_lower = responsibility.get("raw_text", "").lower()
    data_keywords = ["report", "analyze", "track", "measure", "calculate", "monitor"]
    if any(kw in text_lower for kw in data_keywords):
        base_score += 10

    # Process-oriented
    process_keywords = ["process", "coordinate", "schedule", "organize", "prepare"]
    if any(kw in text_lower for kw in process_keywords):
        base_score += 10

    # Negative factors (decrease score)

    # High criticality (needs oversight)
    criticality = responsibility.get("criticality", "important")
    if criticality == "mission-critical":
        base_score -= 20
    elif criticality == "critical":
        base_score -= 10

    # Strategic or relationship-intensive
    strategic_keywords = ["strategic", "vision", "partnership", "relationship", "negotiate"]
    if any(kw in text_lower for kw in strategic_keywords):
        base_score -= 15

    # Judgment required
    judgment_keywords = ["evaluate", "decide", "judgment", "assess", "prioritize"]
    if any(kw in text_lower for kw in judgment_keywords):
        base_score -= 15

    # High stakeholder interaction
    stakeholder_keywords = ["board", "members", "stakeholders", "community", "partners"]
    stakeholder_count = sum(1 for kw in stakeholder_keywords if kw in text_lower)
    if stakeholder_count > 2:
        base_score -= 10

    # Clamp score to 0-100
    final_score = max(0, min(100, base_score))

    # Determine approach based on score
    if final_score >= 80:
        approach = "Full Automation"
        time_savings = 85
        effort = "low"
        roi_months = 3
    elif final_score >= 60:
        approach = "Human-in-Loop Automation"
        time_savings = 65
        effort = "medium"
        roi_months = 6
    elif final_score >= 40:
        approach = "AI-Assisted"
        time_savings = 40
        effort = "medium"
        roi_months = 9
    elif final_score >= 20:
        approach = "Light AI Support"
        time_savings = 15
        effort = "low"
        roi_months = 12
    else:
        approach = "Human-Only"
        time_savings = 5
        effort = "n/a"
        roi_months = 999

    # Generate rationale
    rationale = f"Score: {final_score}/100. "

    if final_score >= 60:
        rationale += "High automation potential due to repetitive, data-driven nature. "
    elif final_score >= 40:
        rationale += "Moderate automation potential. AI can assist but human oversight needed. "
    else:
        rationale += "Low automation potential. Requires human judgment and relationship skills. "

    return AutomationScore(
        score=final_score,
        approach=approach,
        rationale=rationale,
        time_savings_pct=time_savings,
        implementation_effort=effort,
        roi_months=roi_months,
    )


# ============================================================================
# ORGANIZATIONAL ANALYSIS TOOLS
# ============================================================================

@tool
async def identify_org_type(text: str, responsibilities: List[Responsibility]) -> Dict[str, Any]:
    """
    Identify organization type and structure from document.

    Args:
        text: Document text
        responsibilities: Extracted responsibilities

    Returns:
        Organization profile dictionary
    """
    logger.info("Identifying organization type")

    llm = ChatAnthropic(model="claude-sonnet-5")

    prompt = f"""Analyze this organizational document and extract:

1. Organization name
2. Organization type (nonprofit_501c3, nonprofit_501c6, trade_association, professional_association)
3. Industry/sector
4. Geographic scope (local, regional, national, international)
5. Estimated budget size (if mentioned)
6. Estimated staff size (if mentioned)
7. Mission statement (if present)

Return ONLY a JSON object. No other text.

Document excerpt:
{text[:3000]}
"""

    response = llm.invoke([HumanMessage(content=prompt)])

    try:
        # Parse JSON
        content = response.content
        if "```json" in content:
            json_str = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            json_str = content.split("```")[1].split("```")[0].strip()
        else:
            json_str = content.strip()

        profile = json.loads(json_str)

        return profile

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse org profile: {e}")
        return {
            "organization_name": "Unknown",
            "organization_type": "unknown",
            "industry": "unknown",
        }


@tool
async def find_similar_organizations(profile: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Find similar organizations based on profile.

    Args:
        profile: Organization profile

    Returns:
        List of similar organizations
    """
    logger.info("Finding similar organizations")

    # In production, this would query a database of organizations
    # For now, return placeholder

    return [
        {
            "name": "Example Association",
            "similarity_score": 0.85,
            "matching_attributes": ["industry", "budget_size", "geographic_scope"]
        }
    ]


# ============================================================================
# WORKFLOW GENERATION TOOLS
# ============================================================================

@tool
async def generate_workflow_spec(
    responsibility_id: str,
    workflow_type: str,
    analysis: str,
    options: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Generate LangGraph workflow specification.

    Args:
        responsibility_id: Responsibility to automate
        workflow_type: Type of workflow
        analysis: Workflow analysis from previous step
        options: Customization options

    Returns:
        Workflow specification dictionary
    """
    logger.info(f"Generating workflow spec: {workflow_type}")

    llm = ChatAnthropic(model="claude-sonnet-5")

    prompt = f"""Generate a complete LangGraph workflow specification for this responsibility automation.

Workflow Type: {workflow_type}
Analysis: {analysis}
Options: {options}

Generate a specification including:
1. state_schema: TypedDict fields for workflow state
2. nodes: List of node definitions with descriptions
3. edges: List of edges (simple and conditional)
4. entry_point: Starting node
5. human_approval_gates: Nodes requiring human review
6. error_handling: Error recovery strategy
7. checkpointing: Persistence configuration

Return ONLY a JSON object. No other text.
"""

    response = llm.invoke([HumanMessage(content=prompt)])

    try:
        content = response.content
        if "```json" in content:
            json_str = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            json_str = content.split("```")[1].split("```")[0].strip()
        else:
            json_str = content.strip()

        spec = json.loads(json_str)

        return spec

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse workflow spec: {e}")
        return {
            "error": "Failed to generate workflow spec",
            "raw_response": response.content
        }


@tool
async def generate_agent_spec(responsibility: Responsibility) -> Dict[str, Any]:
    """
    Generate specialized agent specification for a responsibility.

    Args:
        responsibility: Responsibility to create agent for

    Returns:
        Agent specification
    """
    logger.info("Generating agent specification")

    # Generate agent configuration
    agent_spec = {
        "name": f"agent_{responsibility['id']}",
        "description": f"Specialized agent for: {responsibility['raw_text']}",
        "model": "claude-sonnet-5",
        "tools": [],
        "system_prompt": f"You are a specialized AI agent responsible for: {responsibility['raw_text']}",
        "capabilities": [],
    }

    return agent_spec


# ============================================================================
# PATTERN LIBRARY TOOLS
# ============================================================================

@tool
async def query_pattern_library(
    query: str,
    filters: Dict[str, Any],
    limit: int,
    pattern_library_path: str
) -> List[Dict[str, Any]]:
    """
    Query responsibility pattern library.

    Args:
        query: Search query
        filters: Filter criteria
        limit: Maximum results
        pattern_library_path: Path to pattern library JSON

    Returns:
        Matching patterns
    """
    logger.info(f"Querying pattern library: {query}")

    # Load pattern library
    pattern_path = Path(pattern_library_path)

    if not pattern_path.exists():
        logger.warning(f"Pattern library not found: {pattern_library_path}")
        return []

    with open(pattern_path, 'r') as f:
        library = json.load(f)

    patterns = library.get("patterns", [])

    # Simple text search (in production, use vector search)
    query_lower = query.lower()

    matching = []
    for pattern in patterns:
        description = pattern.get("description", "").lower()
        if query_lower in description:
            matching.append(pattern)

    # Apply filters
    if filters.get("category"):
        matching = [p for p in matching if p.get("category") == filters["category"]]

    # Limit results
    return matching[:limit]


logger.info("LangChain tools initialized")
