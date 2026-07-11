# LangGraph MCP Server

A Model Context Protocol (MCP) server that exposes LangGraph agents as callable tools, enabling seamless integration with Claude Desktop and Claude Code.

## Overview

This MCP server allows you to:
- Register LangGraph agents in a central registry
- Expose agents as MCP tools that Claude can discover and invoke
- Maintain conversation state across agent invocations
- Stream agent responses in real-time
- Manage agent metadata, health, and lifecycle

## Architecture

```
┌─────────────────────────────────────────┐
│         Claude Desktop / Code           │
│                                         │
│  "Use research_assistant to find info" │
└──────────────┬──────────────────────────┘
               │ MCP Protocol
               │
┌──────────────▼──────────────────────────┐
│      LangGraph MCP Server               │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   Agent Registry                │   │
│  │   - Discovery                   │   │
│  │   - Metadata                    │   │
│  │   - Health checks               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   Tool Handlers                 │   │
│  │   - list_tools()                │   │
│  │   - call_tool()                 │   │
│  │   - streaming                   │   │
│  └─────────────────────────────────┘   │
└──────────────┬──────────────────────────┘
               │
               │ Dynamic Loading
               │
┌──────────────▼──────────────────────────┐
│      LangGraph Agents                   │
│                                         │
│  ~/.langgraph/agents/                   │
│  ├── agent_1/agent.py                   │
│  ├── agent_2/agent.py                   │
│  └── registry.json                      │
└─────────────────────────────────────────┘
```

## Installation

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

Or install individually:

```bash
pip install mcp langgraph langchain-core langchain-anthropic
```

### 2. Set Up Agent Registry

Create the agent registry directory:

```bash
# macOS/Linux
mkdir -p ~/.langgraph/agents

# Windows
mkdir %USERPROFILE%\.langgraph\agents
```

### 3. Configure Claude Desktop

Add the MCP server configuration to your Claude Desktop config file.

**Config file locations:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

**Configuration:**

```json
{
  "mcpServers": {
    "langgraph-agents": {
      "command": "python",
      "args": ["-m", "langgraph_mcp_server"],
      "env": {
        "AGENT_REGISTRY_PATH": "~/.langgraph/agents",
        "PYTHONPATH": "/path/to/claude/.claude/plugins/langgraph-architect/lib/mcp"
      }
    }
  }
}
```

See `claude_desktop_config.json` for detailed configuration examples.

### 4. Restart Claude Desktop

Completely quit and restart Claude Desktop for the configuration to take effect.

## Usage

### Running the MCP Server

The server is typically started automatically by Claude Desktop. You can also run it manually:

```bash
# Run as module
python -m langgraph_mcp_server

# With custom registry path
AGENT_REGISTRY_PATH=/path/to/agents python -m langgraph_mcp_server
```

### Command Line Tools

The server includes several CLI commands for managing agents:

```bash
# Discover and register agents
python -m langgraph_mcp_server --discover

# Validate all agents
python -m langgraph_mcp_server --validate

# Show health status
python -m langgraph_mcp_server --health

# Export registry
python -m langgraph_mcp_server --export registry_backup.json

# Import registry
python -m langgraph_mcp_server --import registry_backup.json

# Use custom registry path
python -m langgraph_mcp_server --registry-path /path/to/agents --health
```

### Registering Agents

#### Programmatically

```python
from agent_registry import AgentRegistry

registry = AgentRegistry()

registry.register_agent(
    agent_id="research_assistant",
    name="Research Assistant",
    description="Helps with research tasks and information gathering",
    module_path="/path/to/research_agent.py",
    agent_type="specialized",
    model="claude-sonnet-5",
    capabilities=["web_search", "document_analysis", "summarization"],
    tools=["tavily_search", "document_loader"]
)
```

#### Using Discovery

Place your agent in a directory structure:

```
~/.langgraph/agents/
└── research_assistant/
    ├── agent.py          # Your LangGraph agent
    ├── config.json       # Agent metadata (optional)
    └── requirements.txt  # Dependencies (optional)
```

Then run discovery:

```bash
python -m langgraph_mcp_server --discover
```

### Agent Structure

Your agent module (`agent.py`) should expose either:

1. A compiled graph:
```python
from langgraph.graph import StateGraph
from langgraph.checkpoint.memory import MemorySaver

# Define your graph
builder = StateGraph(AgentState)
# ... add nodes and edges ...

# Compile with checkpointer
graph = builder.compile(checkpointer=MemorySaver())
```

2. A factory function:
```python
def create_graph():
    builder = StateGraph(AgentState)
    # ... add nodes and edges ...
    return builder.compile(checkpointer=MemorySaver())
```

### Invoking Agents from Claude

Once configured, agents are automatically available to Claude:

```
User: Use the research_assistant agent to find information about LangGraph

Claude: I'll invoke the research_assistant agent for you...
[Calls agent_research_assistant tool]
```

### Continuing Conversations

Agents maintain conversation state using thread IDs:

```
User: Ask the research_assistant about LangGraph features
Claude: [Invokes agent with new thread_id]

User: What about its deployment options?
Claude: [Continues conversation with same thread_id]
```

## Agent Configuration

### config.json

Optional configuration file for agents:

```json
{
  "name": "Research Assistant",
  "description": "AI agent for research and information gathering",
  "version": "1.0.0",
  "agent_type": "specialized",
  "model": "claude-sonnet-5",
  "capabilities": [
    "web_search",
    "document_analysis",
    "summarization"
  ],
  "tools": [
    "tavily_search",
    "document_loader"
  ],
  "default_config": {
    "max_tokens": 4096
  },
  "dependencies": [
    "tavily-python>=0.3.0"
  ]
}
```

## MCP Protocol Features

### Tools

The server exposes each registered agent as an MCP tool:

```
Tool: agent_research_assistant
Input Schema:
  - input: string (required) - Query for the agent
  - thread_id: string (optional) - Conversation thread ID
  - config: object (optional) - Configuration overrides
```

### Resources

Agent metadata is exposed as MCP resources:

```
Resource: agent://research_assistant
Returns: Agent metadata and configuration as JSON
```

### Prompts

Prompt templates for invoking agents:

```
Prompt: invoke_research_assistant
Arguments:
  - query: string (required)
Returns: Formatted prompt for agent invocation
```

## Advanced Features

### Streaming Responses

The server supports streaming for agents that implement `astream()`:

```python
async for chunk in graph.astream(input_data, config):
    # Stream processing
```

### Checkpointing

Agents maintain state across invocations using LangGraph checkpointing:

```python
from langgraph.checkpoint.memory import MemorySaver

graph = builder.compile(checkpointer=MemorySaver())
```

### Health Monitoring

Monitor agent health status:

```bash
python -m langgraph_mcp_server --health
```

Agents are automatically marked as healthy/unhealthy based on load success.

### Multiple Registries

Run multiple MCP server instances for different environments:

```json
{
  "mcpServers": {
    "langgraph-agents-prod": {
      "command": "python",
      "args": ["-m", "langgraph_mcp_server"],
      "env": {
        "AGENT_REGISTRY_PATH": "~/.langgraph/agents/prod"
      }
    },
    "langgraph-agents-dev": {
      "command": "python",
      "args": ["-m", "langgraph_mcp_server"],
      "env": {
        "AGENT_REGISTRY_PATH": "~/.langgraph/agents/dev"
      }
    }
  }
}
```

## Troubleshooting

### Server Won't Start

1. Check Python version: `python --version` (needs 3.10+)
2. Verify dependencies: `pip list | grep -E 'mcp|langgraph'`
3. Test manually: `python -m langgraph_mcp_server`
4. Check Claude Desktop logs

### Agents Not Visible

1. Verify registry exists: `ls ~/.langgraph/agents/registry.json`
2. Check registration: `cat ~/.langgraph/agents/registry.json`
3. Run discovery: `python -m langgraph_mcp_server --discover`
4. Validate agents: `python -m langgraph_mcp_server --validate`

### Invocation Errors

1. Check agent health: `python -m langgraph_mcp_server --health`
2. Test agent directly: `python path/to/agent.py`
3. Verify dependencies are installed
4. Check logs at `~/.langgraph/logs/`

## Development

### Project Structure

```
lib/mcp/
├── __init__.py               # Package initialization
├── __main__.py               # CLI entry point
├── langgraph_mcp_server.py   # MCP server implementation
├── agent_registry.py         # Agent registry system
├── requirements.txt          # Dependencies
├── README.md                 # This file
├── mcp_config.json          # Configuration template
└── claude_desktop_config.json # Claude Desktop config template
```

### Running Tests

```bash
pytest tests/
```

### Code Formatting

```bash
black .
mypy .
```

## Examples

See the `examples/` directory for sample agents:
- `hello_world/` - Simple greeting agent
- `research_assistant/` - Web search and research
- `data_analyst/` - Data analysis and visualization
- `code_reviewer/` - Code review and suggestions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- GitHub Issues: https://github.com/Lobbi-Docs/claude/issues
- Documentation: https://github.com/Lobbi-Docs/claude/tree/main/.claude/plugins/langgraph-architect
- MCP Specification: https://modelcontextprotocol.io

## Related Projects

- [LangGraph](https://langchain-ai.github.io/langgraph/)
- [LangChain](https://python.langchain.com/)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Claude Desktop](https://claude.ai/download)
