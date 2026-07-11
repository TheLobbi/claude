---
name: lg:mcp
description: Integrate LangGraph agents with Model Context Protocol including exposing agents as MCP servers and consuming MCP tools
version: 1.0.0
category: langgraph
author: Claude Code
arguments:
  - name: action
    description: Action to perform
    required: true
    type: choice
    choices: [expose, consume, generate, test, list, info]
  - name: name
    description: Server or tool name
    required: false
    type: string
flags:
  - name: project
    description: Project directory path
    type: string
    default: "."
  - name: server-name
    description: MCP server name
    type: string
    default: ""
  - name: transport
    description: MCP transport type
    type: choice
    choices: [stdio, sse, websocket]
    default: stdio
  - name: tools
    description: Comma-separated list of MCP tools to consume
    type: string
    default: "all"
  - name: server-url
    description: URL for MCP server (for consume action)
    type: string
    default: ""
  - name: streaming
    description: Enable streaming responses
    type: boolean
    default: true
  - name: auth
    description: Enable authentication
    type: boolean
    default: false
  - name: port
    description: Port for SSE/WebSocket server
    type: number
    default: 8000
  - name: config-path
    description: Path to Claude config file
    type: string
    default: ""
presets:
  - name: simple-server
    description: Basic stdio MCP server
    flags:
      transport: stdio
      streaming: true
  - name: web-server
    description: SSE-based web server
    flags:
      transport: sse
      port: 8000
      auth: true
  - name: websocket-server
    description: WebSocket server for real-time
    flags:
      transport: websocket
      port: 8001
      streaming: true
---

# lg:mcp - Model Context Protocol Integration

Integrate LangGraph agents with MCP to expose agents as servers or consume external MCP tools.

## Workflow Steps

### Expose Agent as MCP Server

1. **Validate Project**
   - Check project structure
   - Verify agent is functional
   - Validate configuration

2. **Generate MCP Server Code**
   - Create server wrapper
   - Define tool schemas
   - Setup transport layer
   - Configure authentication (if enabled)

3. **Generate Tool Definitions**
   - Extract agent capabilities
   - Create MCP tool schemas
   - Document parameters
   - Define return types

4. **Setup Transport**
   - Configure stdio/SSE/WebSocket
   - Setup request handling
   - Configure streaming (if enabled)
   - Add error handling

5. **Generate Claude Config**
   - Create claude_desktop_config.json
   - Add server configuration
   - Document setup instructions

6. **Create Tests**
   - Add MCP server tests
   - Test tool invocation
   - Test streaming (if enabled)
   - Test error handling

7. **Update Documentation**
   - Add MCP server docs
   - Document available tools
   - Add integration examples

### Consume MCP Tools

1. **Connect to MCP Server**
   - Load server configuration
   - Establish connection
   - Validate server availability

2. **Discover Tools**
   - Query available tools
   - Parse tool schemas
   - Validate compatibility

3. **Generate Tool Wrappers**
   - Create LangChain tool wrappers
   - Map MCP schemas to LangChain
   - Add type validation

4. **Integrate with Agent**
   - Add tools to agent
   - Update tool list
   - Configure tool binding

5. **Update Tests**
   - Add tool usage tests
   - Test MCP connection
   - Test tool execution

6. **Update Documentation**
   - Document available MCP tools
   - Add usage examples

## MCP Server Patterns

### Stdio Transport (Default)
Best for Claude Desktop integration.

```python
# mcp_server.py
import asyncio
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

from src.graph import app

# Create MCP server
server = Server("langgraph-agent")

@server.list_tools()
async def list_tools() -> list[Tool]:
    """List available tools."""
    return [
        Tool(
            name="run_agent",
            description="Run the LangGraph agent",
            inputSchema={
                "type": "object",
                "properties": {
                    "message": {
                        "type": "string",
                        "description": "Input message"
                    },
                    "thread_id": {
                        "type": "string",
                        "description": "Thread ID for conversation"
                    }
                },
                "required": ["message"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    """Execute tool."""
    if name == "run_agent":
        message = arguments["message"]
        thread_id = arguments.get("thread_id", "default")

        config = {"configurable": {"thread_id": thread_id}}
        result = app.invoke({"messages": [message]}, config)

        return [
            TextContent(
                type="text",
                text=result["messages"][-1].content
            )
        ]

    raise ValueError(f"Unknown tool: {name}")

async def main():
    """Run MCP server."""
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )

if __name__ == "__main__":
    asyncio.run(main())
```

### SSE Transport
For web-based integrations.

```python
# mcp_server_sse.py
from mcp.server.sse import SseServerTransport
from starlette.applications import Starlette
from starlette.routing import Route
import uvicorn

from src.graph import app
from mcp.server import Server

server = Server("langgraph-agent")

# ... (same list_tools and call_tool as above)

async def handle_sse(request):
    """Handle SSE connections."""
    async with SseServerTransport("/messages") as transport:
        await server.run(
            transport.read_stream,
            transport.write_stream,
            server.create_initialization_options()
        )

starlette_app = Starlette(
    routes=[
        Route("/sse", endpoint=handle_sse),
    ]
)

if __name__ == "__main__":
    uvicorn.run(starlette_app, host="0.0.0.0", port=8000)
```

### WebSocket Transport
For real-time bidirectional communication.

```python
# mcp_server_ws.py
from mcp.server.websocket import WebSocketTransport
from fastapi import FastAPI, WebSocket
import uvicorn

from src.graph import app
from mcp.server import Server

fastapi_app = FastAPI()
server = Server("langgraph-agent")

# ... (same list_tools and call_tool)

@fastapi_app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Handle WebSocket connections."""
    await websocket.accept()

    async with WebSocketTransport(websocket) as transport:
        await server.run(
            transport.read_stream,
            transport.write_stream,
            server.create_initialization_options()
        )

if __name__ == "__main__":
    uvicorn.run(fastapi_app, host="0.0.0.0", port=8001)
```

## Consuming MCP Tools

### Connect to MCP Server
```python
# src/tools/mcp_tools.py
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from langchain_core.tools import tool

async def connect_to_mcp_server():
    """Connect to MCP server and get tools."""
    server_params = StdioServerParameters(
        command="python",
        args=["path/to/mcp_server.py"]
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            # List available tools
            tools = await session.list_tools()
            return tools

# Create LangChain wrappers
@tool
async def mcp_tool_wrapper(
    tool_name: str,
    arguments: dict
) -> str:
    """Execute MCP tool."""
    server_params = StdioServerParameters(
        command="python",
        args=["path/to/mcp_server.py"]
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            result = await session.call_tool(tool_name, arguments)
            return result.content[0].text
```

### Add MCP Tools to Agent
```python
# src/graph.py
from langchain_anthropic import ChatAnthropic
from langgraph.prebuilt import create_react_agent
from .tools.mcp_tools import get_mcp_tools

# Get MCP tools
mcp_tools = get_mcp_tools()

# Create agent with MCP tools
llm = ChatAnthropic(model="claude-sonnet-5")
agent = create_react_agent(llm, mcp_tools)
```

## Examples

### Expose Agent as MCP Server (Stdio)
```bash
lg:mcp expose \
  --project ./my-agent \
  --server-name my-agent \
  --transport stdio
```

### Expose as Web Server (SSE)
```bash
lg:mcp expose \
  --project ./my-agent \
  --server-name my-agent \
  --transport sse \
  --port 8000 \
  --auth
```

### Expose as WebSocket Server
```bash
lg:mcp expose \
  --project ./my-agent \
  --server-name my-agent \
  --transport websocket \
  --port 8001 \
  --streaming
```

### Use Preset
```bash
lg:mcp expose --preset simple-server --project ./my-agent
lg:mcp expose --preset web-server --project ./my-agent
```

### Consume MCP Tools from Server
```bash
lg:mcp consume \
  --project ./my-agent \
  --server-url "stdio://path/to/server.py" \
  --tools "search,calculator"
```

### Consume All Tools from Server
```bash
lg:mcp consume \
  --project ./my-agent \
  --server-url "stdio://path/to/server.py" \
  --tools all
```

### Generate Claude Config
```bash
lg:mcp generate \
  --project ./my-agent \
  --server-name my-agent \
  --config-path ~/Library/Application\ Support/Claude/
```

### Test MCP Server
```bash
lg:mcp test --project ./my-agent
```

### List MCP Tools
```bash
lg:mcp list --project ./my-agent
```

Output:
```
MCP Server: my-agent (stdio)
Available Tools:
  run_agent        Run the LangGraph agent with a message
  get_state        Get current conversation state
  reset_state      Reset conversation state
  list_threads     List all conversation threads
```

### Get MCP Server Info
```bash
lg:mcp info --project ./my-agent
```

Output:
```
MCP Server: my-agent
Transport: stdio
Streaming: enabled
Auth: disabled
Entry Point: mcp_server.py
Tools: 4
Configuration:
  command: python
  args: ["-m", "my_agent.mcp_server"]
```

## Generated Files

### Project Structure
```
my-agent/
├── src/
│   ├── graph.py           # Main agent
│   └── tools/
│       └── mcp_tools.py   # MCP tool wrappers (if consuming)
├── mcp_server.py          # Stdio MCP server
├── mcp_server_sse.py      # SSE server (if requested)
├── mcp_server_ws.py       # WebSocket server (if requested)
├── tests/
│   └── test_mcp.py        # MCP tests
└── README.md              # Updated with MCP docs
```

### Claude Desktop Config
```json
{
  "mcpServers": {
    "my-agent": {
      "command": "python",
      "args": ["-m", "my_agent.mcp_server"],
      "env": {
        "ANTHROPIC_API_KEY": "your-key-here"
      }
    }
  }
}
```

### Dependencies Added
```toml
# pyproject.toml
dependencies = [
    "mcp>=1.0.0",
    "starlette>=0.27.0",    # if --transport sse
    "uvicorn>=0.23.0",      # if --transport sse/websocket
    "fastapi>=0.104.0",     # if --transport websocket
    "websockets>=12.0",     # if --transport websocket
]
```

## Advanced Features

### Multi-Agent MCP Server
Expose multiple agents through one server.

```python
# mcp_server.py
from mcp.server import Server
from src.agents.researcher import researcher_app
from src.agents.coder import coder_app
from src.agents.reviewer import reviewer_app

server = Server("multi-agent-system")

@server.list_tools()
async def list_tools() -> list[Tool]:
    """List all agent tools."""
    return [
        Tool(name="research", description="Research agent", ...),
        Tool(name="code", description="Coding agent", ...),
        Tool(name="review", description="Review agent", ...),
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    """Route to appropriate agent."""
    agents = {
        "research": researcher_app,
        "code": coder_app,
        "review": reviewer_app
    }

    if name in agents:
        result = agents[name].invoke(arguments)
        return [TextContent(type="text", text=result)]

    raise ValueError(f"Unknown tool: {name}")
```

### Streaming Responses
Stream agent output via MCP.

```python
@server.call_tool()
async def call_tool(name: str, arguments: dict):
    """Stream agent responses."""
    if name == "run_agent":
        config = {"configurable": {"thread_id": arguments.get("thread_id")}}

        # Stream chunks
        chunks = []
        for chunk in app.stream({"messages": [arguments["message"]]}, config):
            if "messages" in chunk:
                content = chunk["messages"][-1].content
                chunks.append(content)

        return [TextContent(type="text", text="".join(chunks))]
```

### Resource Exposure
Expose agent resources (state, history, etc.).

```python
@server.list_resources()
async def list_resources() -> list[Resource]:
    """List available resources."""
    return [
        Resource(
            uri="agent://state/{thread_id}",
            name="Agent State",
            description="Get conversation state"
        ),
        Resource(
            uri="agent://history/{thread_id}",
            name="Agent History",
            description="Get conversation history"
        )
    ]

@server.read_resource()
async def read_resource(uri: str) -> str:
    """Read agent resource."""
    if uri.startswith("agent://state/"):
        thread_id = uri.split("/")[-1]
        config = {"configurable": {"thread_id": thread_id}}
        state = app.get_state(config)
        return str(state.values)

    elif uri.startswith("agent://history/"):
        thread_id = uri.split("/")[-1]
        config = {"configurable": {"thread_id": thread_id}}
        history = list(app.get_state_history(config))
        return str(history)
```

### Authentication
Add authentication to MCP server.

```python
# mcp_server_sse.py with auth
from starlette.middleware import Middleware
from starlette.middleware.authentication import AuthenticationMiddleware
from starlette.authentication import (
    AuthenticationBackend,
    AuthCredentials,
    SimpleUser
)

class TokenAuthBackend(AuthenticationBackend):
    async def authenticate(self, conn):
        token = conn.headers.get("Authorization")
        if token == f"Bearer {os.getenv('MCP_TOKEN')}":
            return AuthCredentials(["authenticated"]), SimpleUser("user")
        return None

app = Starlette(
    routes=[...],
    middleware=[
        Middleware(AuthenticationMiddleware, backend=TokenAuthBackend())
    ]
)
```

## Testing Generated

### MCP Server Test Template
```python
# tests/test_mcp.py
import pytest
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

@pytest.mark.asyncio
async def test_mcp_server_connection():
    """Test MCP server connection."""
    server_params = StdioServerParameters(
        command="python",
        args=["mcp_server.py"]
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            # Connection successful
            assert session is not None

@pytest.mark.asyncio
async def test_list_tools():
    """Test listing MCP tools."""
    server_params = StdioServerParameters(
        command="python",
        args=["mcp_server.py"]
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            tools = await session.list_tools()
            assert len(tools) > 0
            assert any(tool.name == "run_agent" for tool in tools)

@pytest.mark.asyncio
async def test_call_tool():
    """Test calling MCP tool."""
    server_params = StdioServerParameters(
        command="python",
        args=["mcp_server.py"]
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            result = await session.call_tool(
                "run_agent",
                {"message": "Hello", "thread_id": "test"}
            )

            assert len(result.content) > 0
            assert result.content[0].type == "text"

@pytest.mark.integration
async def test_mcp_in_claude():
    """Test MCP server with Claude Desktop."""
    # Manual integration test
    # 1. Add server to claude_desktop_config.json
    # 2. Restart Claude Desktop
    # 3. Verify tool appears in Claude
    pass
```

## Deployment

### Docker Container
```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY pyproject.toml .
RUN pip install .

COPY . .

# Stdio server (for Claude Desktop)
CMD ["python", "-m", "my_agent.mcp_server"]

# Or SSE server (for web)
# CMD ["uvicorn", "mcp_server_sse:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'
services:
  mcp-server:
    build: .
    ports:
      - "8000:8000"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - POSTGRES_URL=${POSTGRES_URL}
    command: uvicorn mcp_server_sse:app --host 0.0.0.0 --port 8000
```

### Kubernetes
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mcp-server
  template:
    metadata:
      labels:
        app: mcp-server
    spec:
      containers:
      - name: mcp-server
        image: my-agent:latest
        ports:
        - containerPort: 8000
        env:
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-keys
              key: anthropic
---
apiVersion: v1
kind: Service
metadata:
  name: mcp-server
spec:
  selector:
    app: mcp-server
  ports:
  - port: 80
    targetPort: 8000
  type: LoadBalancer
```

## Error Handling

- **Connection failed**: Cannot connect to MCP server
- **Tool not found**: Requested tool doesn't exist
- **Invalid arguments**: Tool arguments don't match schema
- **Server error**: Agent execution failed
- **Timeout**: Operation exceeded timeout limit

## Notes

- Stdio transport best for Claude Desktop
- SSE/WebSocket for web integrations
- Always validate tool arguments
- Handle streaming carefully
- Consider rate limiting for production
- Authentication recommended for web servers
- Monitor server health and performance

## Related Commands

- `lg:create` - Create project with MCP support
- `lg:agent add` - Add agents to expose
- `lg:test run` - Test MCP server
- `lg:deploy` - Deploy MCP server

## See Also

- MCP Specification: https://modelcontextprotocol.io/
- MCP Python SDK: https://github.com/modelcontextprotocol/python-sdk
- Claude Desktop: https://claude.ai/download
- LangGraph + MCP: https://langchain-ai.github.io/langgraph/concepts/mcp/
