"""
ReAct Agent Template

A production-ready ReAct (Reasoning and Acting) agent with:
- Tool calling loop
- State management
- Checkpointing
- Error handling
- Async support
"""

import os
from typing import TypedDict, Annotated, Sequence
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_core.tools import tool
from langchain_anthropic import ChatAnthropic
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode
from langgraph.graph.message import add_messages
from langgraph.checkpoint.memory import MemorySaver


# ============================================================================
# State Definition
# ============================================================================

class AgentState(TypedDict):
    """
    State schema for the ReAct agent.

    Attributes:
        messages: Conversation history with automatic message merging
        iteration_count: Track number of agent iterations
        error: Store any error information
    """
    messages: Annotated[Sequence[BaseMessage], add_messages]
    iteration_count: int
    error: str | None


# ============================================================================
# Tools
# ============================================================================

@tool
async def search_web(query: str) -> str:
    """
    Search the web for information.

    Args:
        query: The search query

    Returns:
        Search results as a formatted string
    """
    # TODO: Implement actual web search (e.g., using Tavily, SerpAPI, etc.)
    # This is a placeholder implementation
    return f"Search results for '{query}':\n1. Result 1\n2. Result 2\n3. Result 3"


@tool
async def calculate(expression: str) -> float:
    """
    Evaluate a mathematical expression.

    Args:
        expression: A mathematical expression to evaluate

    Returns:
        The result of the calculation
    """
    try:
        # WARNING: Using eval() is dangerous in production!
        # Replace with a safe math parser like sympy or py_expression_eval
        result = eval(expression, {"__builtins__": {}}, {})
        return float(result)
    except Exception as e:
        raise ValueError(f"Invalid expression: {e}")


@tool
async def get_current_time() -> str:
    """
    Get the current date and time.

    Returns:
        Current date and time as a formatted string
    """
    from datetime import datetime
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


# Tool collection
tools = [search_web, calculate, get_current_time]


# ============================================================================
# Nodes
# ============================================================================

async def agent_node(state: AgentState) -> AgentState:
    """
    The main agent node that calls the LLM with tools.

    Args:
        state: Current agent state

    Returns:
        Updated state with the agent's response
    """
    try:
        # Initialize the model with tools
        model = ChatAnthropic(
            model="claude-sonnet-5"
        ).bind_tools(tools)

        # Get the conversation history
        messages = state["messages"]

        # Call the model
        response = await model.ainvoke(messages)

        # Update iteration count
        iteration_count = state.get("iteration_count", 0) + 1

        # Return updated state
        return {
            "messages": [response],
            "iteration_count": iteration_count,
            "error": None
        }

    except Exception as e:
        # Handle errors gracefully
        error_message = AIMessage(
            content=f"I encountered an error: {str(e)}. Let me try a different approach."
        )
        return {
            "messages": [error_message],
            "error": str(e)
        }


# Tool execution node (using prebuilt ToolNode)
tool_node = ToolNode(tools)


# ============================================================================
# Routing Logic
# ============================================================================

def should_continue(state: AgentState) -> str:
    """
    Determine if the agent should continue or end.

    Args:
        state: Current agent state

    Returns:
        "continue" to call tools, "end" to finish
    """
    messages = state["messages"]
    last_message = messages[-1]

    # Check if there are tool calls to execute
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "continue"

    # Check iteration limit to prevent infinite loops
    iteration_count = state.get("iteration_count", 0)
    if iteration_count >= 10:
        return "end"

    # No tool calls, we're done
    return "end"


# ============================================================================
# Graph Construction
# ============================================================================

def create_graph() -> StateGraph:
    """
    Create and compile the ReAct agent graph.

    Returns:
        Compiled StateGraph ready for execution
    """
    # Create the graph
    workflow = StateGraph(AgentState)

    # Add nodes
    workflow.add_node("agent", agent_node)
    workflow.add_node("tools", tool_node)

    # Define the flow
    workflow.add_edge(START, "agent")
    workflow.add_conditional_edges(
        "agent",
        should_continue,
        {
            "continue": "tools",
            "end": END
        }
    )
    workflow.add_edge("tools", "agent")

    # Add checkpointing for memory
    checkpointer = MemorySaver()

    # Compile the graph
    graph = workflow.compile(checkpointer=checkpointer)

    return graph


# ============================================================================
# Usage Example
# ============================================================================

async def main():
    """
    Example usage of the ReAct agent.
    """
    # Create the graph
    graph = create_graph()

    # Configuration with thread_id for checkpointing
    config = {
        "configurable": {
            "thread_id": "example-thread-1"
        }
    }

    # Initial state
    initial_state = {
        "messages": [
            SystemMessage(content="You are a helpful AI assistant with access to tools."),
            HumanMessage(content="What time is it? Then search for LangGraph information.")
        ],
        "iteration_count": 0,
        "error": None
    }

    # Run the agent
    print("Running agent...")
    result = await graph.ainvoke(initial_state, config)

    # Print the conversation
    print("\nConversation:")
    for message in result["messages"]:
        if isinstance(message, HumanMessage):
            print(f"Human: {message.content}")
        elif isinstance(message, AIMessage):
            print(f"AI: {message.content}")

    # Check for errors
    if result.get("error"):
        print(f"\nError occurred: {result['error']}")

    print(f"\nTotal iterations: {result.get('iteration_count', 0)}")

    # Stream updates (optional)
    print("\n\nStreaming next query...")
    stream_config = config.copy()

    async for event in graph.astream_events(
        {"messages": [HumanMessage(content="Calculate 42 * 137")]},
        stream_config,
        version="v1"
    ):
        kind = event["event"]
        if kind == "on_chat_model_stream":
            content = event["data"]["chunk"].content
            if content:
                print(content, end="", flush=True)
    print()


# ============================================================================
# CLI Entry Point
# ============================================================================

if __name__ == "__main__":
    import asyncio

    # Run the example
    asyncio.run(main())
