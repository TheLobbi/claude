"""
MCP Server Agent Template

A LangGraph agent exposed as an MCP (Model Context Protocol) server:
- Exposes agent capabilities as MCP tools
- Handles MCP protocol communication
- Integrates with Claude Desktop and other MCP clients
- Production-ready with error handling
"""

import os
import asyncio
from typing import TypedDict, Annotated, Sequence, Any
from contextlib import asynccontextmanager

from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_core.tools import tool
from langchain_anthropic import ChatAnthropic
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode
from langgraph.graph.message import add_messages
from langgraph.checkpoint.memory import MemorySaver

# MCP imports
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent, ImageContent, EmbeddedResource


# ============================================================================
# LangGraph Agent Definition
# ============================================================================

class AgentState(TypedDict):
    """State for the research agent."""
    messages: Annotated[Sequence[BaseMessage], add_messages]
    query: str
    results: list[str]


@tool
async def research_web(query: str) -> str:
    """
    Research a topic on the web.

    Args:
        query: The research query

    Returns:
        Research findings
    """
    # TODO: Implement actual web research
    return f"Research findings for '{query}':\n- Finding 1\n- Finding 2\n- Finding 3"


@tool
async def analyze_data(data: str) -> str:
    """
    Analyze data and provide insights.

    Args:
        data: Data to analyze

    Returns:
        Analysis results
    """
    return f"Analysis of provided data:\n- Insight 1\n- Insight 2\n- Insight 3"


# Agent tools
agent_tools = [research_web, analyze_data]


async def agent_node(state: AgentState) -> AgentState:
    """Main agent node."""
    model = ChatAnthropic(
        model="claude-sonnet-5"
    ).bind_tools(agent_tools)

    response = await model.ainvoke(state["messages"])

    return {"messages": [response]}


def should_continue(state: AgentState) -> str:
    """Route to tools or end."""
    messages = state["messages"]
    last_message = messages[-1]

    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "continue"
    return "end"


def create_agent_graph():
    """Create the research agent graph."""
    workflow = StateGraph(AgentState)

    # Add nodes
    workflow.add_node("agent", agent_node)
    workflow.add_node("tools", ToolNode(agent_tools))

    # Define flow
    workflow.add_edge(START, "agent")
    workflow.add_conditional_edges(
        "agent",
        should_continue,
        {"continue": "tools", "end": END}
    )
    workflow.add_edge("tools", "agent")

    # Add checkpointing
    checkpointer = MemorySaver()

    return workflow.compile(checkpointer=checkpointer)


# ============================================================================
# MCP Server Definition
# ============================================================================

# Global agent graph instance
agent_graph = create_agent_graph()

# Create MCP server
mcp_server = Server("langgraph-research-agent")


@mcp_server.list_tools()
async def list_tools() -> list[Tool]:
    """
    List available MCP tools.

    This exposes the LangGraph agent's capabilities as MCP tools.
    """
    return [
        Tool(
            name="research_topic",
            description=(
                "Research a topic comprehensively using an AI agent with web search "
                "and analysis capabilities. Returns a detailed research summary."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "description": "The topic to research"
                    },
                    "depth": {
                        "type": "string",
                        "enum": ["shallow", "medium", "deep"],
                        "description": "Depth of research to perform",
                        "default": "medium"
                    },
                    "focus": {
                        "type": "string",
                        "description": "Specific focus or angle for the research (optional)"
                    }
                },
                "required": ["topic"]
            }
        ),
        Tool(
            name="analyze_content",
            description=(
                "Analyze content using AI to extract insights, patterns, and key information. "
                "Can analyze text, data, or structured information."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "content": {
                        "type": "string",
                        "description": "The content to analyze"
                    },
                    "analysis_type": {
                        "type": "string",
                        "enum": ["summary", "insights", "patterns", "sentiment"],
                        "description": "Type of analysis to perform",
                        "default": "insights"
                    }
                },
                "required": ["content"]
            }
        ),
        Tool(
            name="ask_agent",
            description=(
                "Ask the AI agent a question. The agent can use its tools and reasoning "
                "capabilities to provide comprehensive answers."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "question": {
                        "type": "string",
                        "description": "The question to ask"
                    },
                    "context": {
                        "type": "string",
                        "description": "Additional context for the question (optional)"
                    }
                },
                "required": ["question"]
            }
        )
    ]


@mcp_server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    """
    Handle MCP tool calls by routing them to the LangGraph agent.

    Args:
        name: Name of the tool to call
        arguments: Tool arguments

    Returns:
        List of text content responses
    """
    try:
        if name == "research_topic":
            return await handle_research_topic(arguments)

        elif name == "analyze_content":
            return await handle_analyze_content(arguments)

        elif name == "ask_agent":
            return await handle_ask_agent(arguments)

        else:
            return [TextContent(
                type="text",
                text=f"Unknown tool: {name}"
            )]

    except Exception as e:
        return [TextContent(
            type="text",
            text=f"Error executing tool '{name}': {str(e)}"
        )]


async def handle_research_topic(arguments: dict) -> list[TextContent]:
    """Handle research_topic tool calls."""
    topic = arguments.get("topic")
    depth = arguments.get("depth", "medium")
    focus = arguments.get("focus", "")

    # Create a unique thread ID for this research session
    import time
    thread_id = f"research-{int(time.time())}"

    config = {
        "configurable": {
            "thread_id": thread_id
        }
    }

    # Build the research prompt
    prompt = f"Research the topic: {topic}\n"
    if focus:
        prompt += f"Focus on: {focus}\n"
    prompt += f"Depth: {depth}\n\nProvide a comprehensive research summary."

    # Initial state
    initial_state = {
        "messages": [
            SystemMessage(content="You are a research specialist with web search capabilities."),
            HumanMessage(content=prompt)
        ],
        "query": topic,
        "results": []
    }

    # Run the agent
    result = await agent_graph.ainvoke(initial_state, config)

    # Extract the final response
    final_message = result["messages"][-1]
    response_text = final_message.content if hasattr(final_message, "content") else str(final_message)

    return [TextContent(
        type="text",
        text=response_text
    )]


async def handle_analyze_content(arguments: dict) -> list[TextContent]:
    """Handle analyze_content tool calls."""
    content = arguments.get("content")
    analysis_type = arguments.get("analysis_type", "insights")

    import time
    thread_id = f"analyze-{int(time.time())}"

    config = {
        "configurable": {
            "thread_id": thread_id
        }
    }

    prompt = f"Analyze the following content and provide {analysis_type}:\n\n{content}"

    initial_state = {
        "messages": [
            SystemMessage(content="You are an expert analyst."),
            HumanMessage(content=prompt)
        ],
        "query": analysis_type,
        "results": []
    }

    result = await agent_graph.ainvoke(initial_state, config)

    final_message = result["messages"][-1]
    response_text = final_message.content if hasattr(final_message, "content") else str(final_message)

    return [TextContent(
        type="text",
        text=response_text
    )]


async def handle_ask_agent(arguments: dict) -> list[TextContent]:
    """Handle ask_agent tool calls."""
    question = arguments.get("question")
    context = arguments.get("context", "")

    import time
    thread_id = f"question-{int(time.time())}"

    config = {
        "configurable": {
            "thread_id": thread_id
        }
    }

    prompt = question
    if context:
        prompt = f"Context: {context}\n\nQuestion: {question}"

    initial_state = {
        "messages": [
            SystemMessage(content="You are a helpful AI assistant with research and analysis capabilities."),
            HumanMessage(content=prompt)
        ],
        "query": question,
        "results": []
    }

    result = await agent_graph.ainvoke(initial_state, config)

    final_message = result["messages"][-1]
    response_text = final_message.content if hasattr(final_message, "content") else str(final_message)

    return [TextContent(
        type="text",
        text=response_text
    )]


# ============================================================================
# Server Entry Point
# ============================================================================

async def main():
    """
    Run the MCP server using stdio transport.

    This allows the server to communicate with MCP clients like Claude Desktop.
    """
    async with stdio_server() as (read_stream, write_stream):
        await mcp_server.run(
            read_stream,
            write_stream,
            mcp_server.create_initialization_options()
        )


if __name__ == "__main__":
    # Run the MCP server
    asyncio.run(main())


# ============================================================================
# Claude Desktop Configuration
# ============================================================================

"""
To use this MCP server with Claude Desktop, add to your Claude Desktop config:

On macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
On Windows: %APPDATA%/Claude/claude_desktop_config.json

{
  "mcpServers": {
    "langgraph-research-agent": {
      "command": "python",
      "args": ["/path/to/mcp-server-agent.py"]
    }
  }
}

Then restart Claude Desktop. The tools will be available in Claude's UI.
"""

# ============================================================================
# Testing the MCP Server
# ============================================================================

"""
Test the MCP server from command line:

1. Start the server:
   python mcp-server-agent.py

2. Test with MCP client:
   mcp call langgraph-research-agent research_topic '{"topic": "LangGraph"}'

3. Or use the MCP Inspector:
   npx @modelcontextprotocol/inspector python mcp-server-agent.py
"""
