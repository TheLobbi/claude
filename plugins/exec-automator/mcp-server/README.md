# Exec-Automator MCP Server

A comprehensive Model Context Protocol (MCP) server that powers the exec-automator plugin. This server provides intelligent workflow orchestration via LangGraph, document analysis, automation scoring, and specialized agents for executive director responsibilities.

## Architecture

```
mcp-server/
├── src/
│   ├── server.py              # Main MCP server (resources, tools, handlers)
│   ├── langgraph_engine.py    # StateGraph workflows and execution
│   ├── langchain_tools.py     # LangChain tool definitions
│   ├── state_schemas.py       # TypedDict state schemas
│   └── agents/
│       └── __init__.py        # Domain agent configurations
├── requirements.txt           # Python dependencies
└── README.md                  # This file
```

## Key Features

### 1. Document Analysis
- Parse RFPs, job descriptions, bylaws, strategic plans
- Extract executive director responsibilities with semantic understanding
- Categorize responsibilities by domain (governance, financial, operations, etc.)
- Identify organizational type, structure, and stakeholders

### 2. Automation Scoring
- Proprietary algorithm scoring automation potential (0-100)
- Considers 12+ factors: repetitiveness, complexity, judgment needs, etc.
- Recommends automation approach (Full Automation, Human-in-Loop, AI-Assisted)
- Estimates time savings and ROI

### 3. Workflow Generation
- Design LangGraph StateGraph workflows for responsibilities
- Generate state schemas, nodes, routing logic, error handling
- Include human approval gates for high-stakes decisions
- Produce production-ready Python code

### 4. Workflow Deployment
- Deploy workflows to development, staging, production
- Initialize checkpoint databases for persistence
- Configure monitoring and health checks
- Manage environment variables and integrations

### 5. Execution and Monitoring
- Execute workflows with checkpointing
- Stream real-time updates
- Handle human-in-the-loop interrupts
- Track status and errors

### 6. Domain Agents
- 10 specialized agents for different responsibility domains
- Pre-configured system prompts and tools
- Leverage appropriate models (Opus for strategic, Sonnet for execution)

## Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export ANTHROPIC_API_KEY="your-key"
export OPENAI_API_KEY="your-key"

# Optional configuration
export CHECKPOINT_DIR="./checkpoints"
export PATTERN_LIBRARY="./data/patterns.json"
export TEMPLATES_DIR="./templates"
export DEFAULT_MODEL="claude-sonnet-4-6"
```

## Usage

### Running the Server

The server is designed to be run as a subprocess by Claude Code or other MCP clients:

```bash
python src/server.py
```

Configuration via `.mcp.json` in the exec-automator plugin:

```json
{
  "mcpServers": {
    "exec-automator": {
      "command": "python",
      "args": ["${CLAUDE_PLUGIN_ROOT}/mcp-server/src/server.py"],
      "env": {
        "OPENAI_API_KEY": "${OPENAI_API_KEY}",
        "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}"
      }
    }
  }
}
```

### Available Tools

#### Document Analysis

**analyze_document**
```python
result = await mcp.call_tool("analyze_document", {
    "file_path": "/path/to/rfp.pdf",
    "document_type": "auto"  # or "rfp", "job_description", "bylaws"
})
# Returns: analysis_id, organization profile, responsibility count
```

**map_responsibilities**
```python
result = await mcp.call_tool("map_responsibilities", {
    "analysis_id": "analysis_20231217_120000",
    "categories": ["FINANCIAL", "GOVERNANCE"]  # Optional filter
})
# Returns: responsibilities grouped by category
```

#### Automation Scoring

**score_automation**
```python
result = await mcp.call_tool("score_automation", {
    "analysis_id": "analysis_20231217_120000",
    "filters": {"min_complexity": "medium"}  # Optional
})
# Returns: scored responsibilities, high-priority opportunities, time savings
```

#### Workflow Generation

**generate_workflow**
```python
result = await mcp.call_tool("generate_workflow", {
    "responsibility_id": "resp_001",
    "workflow_type": "human_in_loop",  # or "autonomous", "assisted", "advisory"
    "options": {
        "model": "claude-sonnet-4-6",
        "approval_threshold": 0.8
    }
})
# Returns: workflow specification with state schema, nodes, edges, Python code
```

#### Deployment

**deploy_workflow**
```python
result = await mcp.call_tool("deploy_workflow", {
    "workflow_id": "workflow_gen_20231217_120000",
    "environment": "production",  # or "development", "staging"
    "config": {}
})
# Returns: deployment_id, endpoint, monitoring URL
```

#### Execution

**execute_workflow**
```python
result = await mcp.call_tool("execute_workflow", {
    "workflow_id": "workflow_gen_20231217_120000",
    "input_data": {
        "budget_year": 2024,
        "budget_amount": 500000
    },
    "stream": true
})
# Returns: execution_id (thread_id), status
```

**get_status**
```python
result = await mcp.call_tool("get_status", {
    "thread_id": "exec_20231217_120000"
})
# Returns: current status, step, errors, progress
```

**approve_step**
```python
result = await mcp.call_tool("approve_step", {
    "thread_id": "exec_20231217_120000",
    "approved": true,
    "feedback": "Looks good, proceed with deployment"
})
# Returns: updated status after approval
```

#### Template Management

**manage_templates**
```python
# List templates
result = await mcp.call_tool("manage_templates", {
    "action": "list"
})

# Create template
result = await mcp.call_tool("manage_templates", {
    "action": "create",
    "template_name": "financial-reporting",
    "template_data": {...}
})

# Update template
result = await mcp.call_tool("manage_templates", {
    "action": "update",
    "template_name": "financial-reporting",
    "template_data": {...}
})

# Delete template
result = await mcp.call_tool("manage_templates", {
    "action": "delete",
    "template_name": "financial-reporting"
})
```

#### Pattern Library

**query_patterns**
```python
result = await mcp.call_tool("query_patterns", {
    "query": "budget development",
    "filters": {"category": "FINANCIAL"},
    "limit": 10
})
# Returns: matching patterns with automation insights
```

### Available Resources

**Templates**
- URI: `template:///{template-name}`
- Example: `template:///financial-automation`

**Pattern Library**
- URI: `pattern-library:///main`

**Active Workflows**
- URI: `workflows:///active`

## LangGraph Workflows

### Organizational Analysis Workflow

```
Parse Document → Extract Responsibilities → Categorize → Identify Org Type → Score Automation → Generate Profile
```

State: `OrgAnalysisState`

Nodes:
- `parse`: Parse document and extract text
- `extract`: Extract responsibilities using LLM
- `categorize`: Categorize each responsibility
- `identify_org`: Identify organization type and structure
- `score`: Score automation potential
- `generate_profile`: Generate final organizational profile

### Workflow Generation Workflow

```
Analyze Responsibility → Generate Workflow Spec
```

State: `WorkflowGenerationState`

Nodes:
- `analyze`: Analyze responsibility and determine workflow requirements
- `generate`: Generate complete workflow specification

### Deployment Workflow

```
Prepare Deployment → Deploy → Verify
```

State: `DeploymentState`

Nodes:
- `prepare`: Prepare deployment environment
- `deploy`: Deploy workflow to target environment
- `verify`: Verify deployment health

## Domain Agents

The server includes 10 specialized domain agents:

| Domain | Description | Model |
|--------|-------------|-------|
| **governance** | Board relations, policy, compliance | Sonnet 4.6 |
| **financial** | Budgeting, financial reporting, audit | Sonnet 4.6 |
| **operations** | Process optimization, facilities, vendors | Sonnet 4.6 |
| **strategic** | Strategic planning, partnerships, growth | Opus 4.8 |
| **communications** | Marketing, PR, member communications | Sonnet 4.6 |
| **membership** | Recruitment, retention, engagement | Sonnet 4.6 |
| **programs** | Events, education, certification | Sonnet 4.6 |
| **staff** | Hiring, training, performance management | Sonnet 4.6 |
| **technology** | Systems, digital transformation, IT | Sonnet 4.6 |
| **external_relations** | Government relations, coalitions, advocacy | Sonnet 4.6 |

Each agent has:
- Specialized system prompt
- Domain-specific tools
- Defined capabilities
- Responsibility category mapping

## State Schemas

All workflows use TypedDict state schemas for type safety:

- `OrgAnalysisState`: Document analysis workflow
- `WorkflowGenerationState`: Workflow generation workflow
- `DeploymentState`: Deployment workflow
- `ExecutionState`: Generic execution state

Data structures:
- `Responsibility`: Executive director responsibility
- `AutomationScore`: Automation potential score
- `OrganizationalProfile`: Complete organizational profile
- `WorkflowSpec`: LangGraph workflow specification
- `AgentSpec`: Specialized agent configuration
- `Pattern`: Responsibility pattern from library

## Checkpointing

All workflows use SQLite checkpointing for persistence:

```python
# Checkpoint database per thread
checkpoint_db = f"{checkpoint_dir}/{thread_id}.db"

# JSON checkpoint for easy access
checkpoint_json = f"{checkpoint_dir}/{thread_id}.json"
```

Checkpoint features:
- Automatic state persistence
- Resume from interrupts
- Recover from failures
- Audit trail

## Error Handling

Robust error handling throughout:

- Errors captured in state
- Retry logic with exponential backoff
- Graceful degradation
- Human escalation for critical errors

## Logging

Structured logging with Brookside BI style:

```
2023-12-17 12:00:00 | INFO | exec-automator | 🚀 Server initializing...
2023-12-17 12:00:01 | INFO | langgraph_engine | Building workflow
2023-12-17 12:00:02 | INFO | langchain_tools | Extracting responsibilities
```

## Development

### Adding New Tools

1. Define tool function in `langchain_tools.py`:

```python
@tool
async def my_new_tool(param: str) -> Dict[str, Any]:
    """Tool description."""
    # Implementation
    return result
```

2. Register tool in `server.py` `list_tools()`:

```python
Tool(
    name="my_new_tool",
    description="...",
    inputSchema={...}
)
```

3. Add handler in `call_tool()`:

```python
elif name == "my_new_tool":
    result = await handle_my_new_tool(arguments)
```

### Adding New Workflows

1. Define state schema in `state_schemas.py`:

```python
class MyWorkflowState(TypedDict):
    # State fields
    pass
```

2. Create workflow in `langgraph_engine.py`:

```python
def create_my_workflow() -> StateGraph:
    workflow = StateGraph(MyWorkflowState)
    # Add nodes and edges
    return workflow
```

3. Add execution logic in appropriate tool handlers.

### Adding New Domain Agents

1. Add agent configuration in `agents/__init__.py`:

```python
DOMAIN_AGENTS["my_domain"] = {
    "name": "My Domain Agent",
    "description": "...",
    "model": "claude-sonnet-4-6",
    "system_prompt": "...",
    "tools": [...],
    "capabilities": [...]
}
```

2. Update category mapping in `get_agent_for_responsibility()`.

## Testing

```bash
# Run server in test mode
python src/server.py

# In another terminal, use MCP client to test tools
# Or use Claude Code with exec-automator plugin installed
```

## Performance

- Document parsing: < 10 seconds for typical RFP
- Responsibility extraction: < 30 seconds with LLM
- Automation scoring: < 1 second per responsibility
- Workflow generation: < 60 seconds for complete spec
- Concurrent workflow execution: Up to 10 workflows

## Security

- API keys via environment variables
- No secrets in checkpoints or logs
- Human approval required for high-stakes decisions
- Audit trail via checkpoint history

## Roadmap

- [ ] Dynamic workflow compilation from specs
- [ ] Vector search for pattern library
- [ ] Real-time streaming updates
- [ ] Multi-language document support
- [ ] Advanced workflow visualization
- [ ] Integration with external services (Calendar, Email, CRM)
- [ ] Benchmark database with real organization data
- [ ] Machine learning for automation score refinement

## License

Proprietary - Brookside BI

## Support

For issues or questions, contact: dev@brooksidebi.com

---

**Built by Brookside BI** - Amplifying executive capacity through intelligent automation.
