"""
CLI Agent Template

A LangGraph agent with a full-featured CLI interface:
- Command-line argument parsing with Typer
- Interactive mode
- Streaming output
- Conversation history
- Configuration management
- Production-ready error handling
"""

import os
import sys
from pathlib import Path
from typing import TypedDict, Annotated, Sequence, Optional
from datetime import datetime

import typer
from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn

from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_core.tools import tool
from langchain_anthropic import ChatAnthropic
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode
from langgraph.graph.message import add_messages
from langgraph.checkpoint.sqlite import SqliteSaver


# ============================================================================
# Configuration
# ============================================================================

# CLI app
app = typer.Typer(
    name="agent",
    help="AI Agent CLI - A powerful AI assistant powered by LangGraph",
    add_completion=False
)

# Rich console for pretty output
console = Console()


# ============================================================================
# State Definition
# ============================================================================

class AgentState(TypedDict):
    """State for the CLI agent."""
    messages: Annotated[Sequence[BaseMessage], add_messages]
    user_name: str
    session_id: str


# ============================================================================
# Tools
# ============================================================================

@tool
async def search_web(query: str) -> str:
    """Search the web for information."""
    # TODO: Implement actual web search
    return f"Search results for '{query}':\n- Result 1\n- Result 2\n- Result 3"


@tool
async def get_current_time() -> str:
    """Get the current date and time."""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


@tool
async def calculate(expression: str) -> float:
    """Evaluate a mathematical expression."""
    try:
        result = eval(expression, {"__builtins__": {}}, {})
        return float(result)
    except Exception as e:
        raise ValueError(f"Invalid expression: {e}")


# Agent tools
agent_tools = [search_web, get_current_time, calculate]


# ============================================================================
# Agent Nodes
# ============================================================================

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


# ============================================================================
# Graph Construction
# ============================================================================

def create_graph(checkpoint_dir: Optional[Path] = None):
    """Create the agent graph."""
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

    # Setup checkpointing
    if checkpoint_dir is None:
        checkpoint_dir = Path.home() / ".agent" / "checkpoints"
    checkpoint_dir.mkdir(parents=True, exist_ok=True)

    db_path = checkpoint_dir / "checkpoints.db"
    checkpointer = SqliteSaver.from_conn_string(str(db_path))

    return workflow.compile(checkpointer=checkpointer)


# ============================================================================
# CLI Commands
# ============================================================================

@app.command()
def ask(
    query: str = typer.Argument(..., help="The question or task for the agent"),
    session: Optional[str] = typer.Option(None, "--session", "-s", help="Session ID for conversation continuity"),
    stream: bool = typer.Option(True, "--stream/--no-stream", help="Stream the response"),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Show detailed execution info")
):
    """
    Ask the agent a question or give it a task.

    Example:
        agent ask "What is LangGraph?"
        agent ask "Search for Python tutorials" --session my-session
    """
    import asyncio

    async def run_query():
        # Create or get session
        session_id = session or f"session-{datetime.now().strftime('%Y%m%d-%H%M%S')}"

        # Create graph
        graph = create_graph()

        # Configuration
        config = {
            "configurable": {
                "thread_id": session_id
            }
        }

        # Initial state
        initial_state = {
            "messages": [
                SystemMessage(content="You are a helpful AI assistant with access to tools."),
                HumanMessage(content=query)
            ],
            "user_name": os.getenv("USER", "User"),
            "session_id": session_id
        }

        if verbose:
            console.print(f"[dim]Session: {session_id}[/dim]")

        # Show spinner while processing
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console,
            transient=True
        ) as progress:
            task = progress.add_task("[cyan]Thinking...", total=None)

            # Run the agent
            result = await graph.ainvoke(initial_state, config)

        # Extract response
        final_message = result["messages"][-1]
        response_text = final_message.content if hasattr(final_message, "content") else str(final_message)

        # Display response
        console.print()
        console.print(Panel(
            Markdown(response_text),
            title="[bold cyan]Agent Response[/bold cyan]",
            border_style="cyan"
        ))

        if verbose:
            console.print(f"\n[dim]Total messages: {len(result['messages'])}[/dim]")

    # Run async
    asyncio.run(run_query())


@app.command()
def interactive(
    session: Optional[str] = typer.Option(None, "--session", "-s", help="Session ID for conversation continuity")
):
    """
    Start an interactive chat session with the agent.

    Example:
        agent interactive
        agent interactive --session my-session
    """
    import asyncio

    # Create or get session
    session_id = session or f"interactive-{datetime.now().strftime('%Y%m%d-%H%M%S')}"

    # Create graph
    graph = create_graph()

    # Configuration
    config = {
        "configurable": {
            "thread_id": session_id
        }
    }

    console.print(Panel(
        "[bold cyan]Interactive Agent Session[/bold cyan]\n\n"
        f"Session ID: [yellow]{session_id}[/yellow]\n"
        "Type your messages and press Enter.\n"
        "Commands: /exit, /clear, /history",
        border_style="cyan"
    ))

    # Initialize with system message
    messages = [
        SystemMessage(content="You are a helpful AI assistant with access to tools.")
    ]

    async def chat_loop():
        nonlocal messages

        while True:
            # Get user input
            try:
                user_input = console.input("\n[bold green]You:[/bold green] ")
            except (KeyboardInterrupt, EOFError):
                console.print("\n[yellow]Goodbye![/yellow]")
                break

            # Handle commands
            if user_input.strip().lower() == "/exit":
                console.print("[yellow]Goodbye![/yellow]")
                break

            elif user_input.strip().lower() == "/clear":
                messages = [messages[0]]  # Keep system message
                console.print("[dim]Conversation cleared.[/dim]")
                continue

            elif user_input.strip().lower() == "/history":
                console.print("\n[bold cyan]Conversation History:[/bold cyan]")
                for msg in messages[1:]:  # Skip system message
                    if isinstance(msg, HumanMessage):
                        console.print(f"[green]You:[/green] {msg.content}")
                    elif isinstance(msg, AIMessage):
                        console.print(f"[cyan]Agent:[/cyan] {msg.content}")
                continue

            if not user_input.strip():
                continue

            # Add user message
            messages.append(HumanMessage(content=user_input))

            # Show spinner
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                console=console,
                transient=True
            ) as progress:
                task = progress.add_task("[cyan]Thinking...", total=None)

                # Run agent
                state = {
                    "messages": messages,
                    "user_name": os.getenv("USER", "User"),
                    "session_id": session_id
                }

                result = await graph.ainvoke(state, config)

            # Update messages
            messages = result["messages"]

            # Display response
            final_message = messages[-1]
            response_text = final_message.content if hasattr(final_message, "content") else str(final_message)

            console.print(f"\n[bold cyan]Agent:[/bold cyan]")
            console.print(Markdown(response_text))

    # Run chat loop
    asyncio.run(chat_loop())


@app.command()
def history(
    session: str = typer.Argument(..., help="Session ID to view"),
    format: str = typer.Option("pretty", "--format", "-f", help="Output format: pretty, json, markdown")
):
    """
    View conversation history for a session.

    Example:
        agent history my-session
        agent history my-session --format json
    """
    import asyncio
    import json

    async def get_history():
        graph = create_graph()

        config = {
            "configurable": {
                "thread_id": session
            }
        }

        # Get state history
        try:
            state = graph.get_state(config)
            messages = state.values.get("messages", [])

            if not messages:
                console.print("[yellow]No history found for this session.[/yellow]")
                return

            if format == "json":
                # JSON output
                history_data = []
                for msg in messages:
                    history_data.append({
                        "type": msg.__class__.__name__,
                        "content": msg.content if hasattr(msg, "content") else str(msg)
                    })
                console.print_json(data=history_data)

            elif format == "markdown":
                # Markdown output
                for msg in messages:
                    if isinstance(msg, HumanMessage):
                        console.print(f"**User:** {msg.content}\n")
                    elif isinstance(msg, AIMessage):
                        console.print(f"**Agent:** {msg.content}\n")
                    elif isinstance(msg, SystemMessage):
                        console.print(f"*System:* {msg.content}\n")

            else:
                # Pretty output (default)
                console.print(f"\n[bold cyan]Session: {session}[/bold cyan]\n")
                for msg in messages:
                    if isinstance(msg, HumanMessage):
                        console.print(f"[bold green]User:[/bold green] {msg.content}\n")
                    elif isinstance(msg, AIMessage):
                        console.print(f"[bold cyan]Agent:[/bold cyan]")
                        console.print(Markdown(msg.content))
                        console.print()
                    elif isinstance(msg, SystemMessage):
                        console.print(f"[dim]System: {msg.content}[/dim]\n")

        except Exception as e:
            console.print(f"[red]Error: {e}[/red]")

    asyncio.run(get_history())


@app.command()
def sessions():
    """
    List all available sessions.

    Example:
        agent sessions
    """
    checkpoint_dir = Path.home() / ".agent" / "checkpoints"
    if not checkpoint_dir.exists():
        console.print("[yellow]No sessions found.[/yellow]")
        return

    # TODO: Implement session listing from SQLite
    console.print("[yellow]Session listing not yet implemented.[/yellow]")


# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    app()
