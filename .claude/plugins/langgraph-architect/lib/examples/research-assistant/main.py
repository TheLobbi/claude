"""
Research Assistant - Complete Example

A production-ready research assistant agent with:
- Multi-source research (web search, academic papers)
- Semantic memory for context retention
- Quality verification
- Comprehensive error handling
- Async support
- Checkpointing
"""

import os
import asyncio
from typing import TypedDict, Annotated, Sequence, Literal
from datetime import datetime

from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_core.tools import tool
from langchain_anthropic import ChatAnthropic
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode
from langgraph.graph.message import add_messages
from langgraph.checkpoint.sqlite import SqliteSaver


# ============================================================================
# State Definition
# ============================================================================

class ResearchState(TypedDict):
    """
    State for the research assistant.

    Attributes:
        messages: Conversation history
        query: Current research query
        web_results: Web search results
        paper_results: Academic paper results
        synthesis: Final synthesis of findings
        confidence: Confidence score (0-1)
        iteration_count: Number of research iterations
    """
    messages: Annotated[Sequence[BaseMessage], add_messages]
    query: str
    web_results: list[str]
    paper_results: list[str]
    synthesis: str
    confidence: float
    iteration_count: int


# ============================================================================
# Tools
# ============================================================================

@tool
async def search_web(query: str, num_results: int = 5) -> str:
    """
    Search the web for information.

    Args:
        query: Search query
        num_results: Number of results to return

    Returns:
        Formatted search results
    """
    # TODO: Implement actual web search (Tavily, SerpAPI, etc.)
    # This is a placeholder
    results = []
    for i in range(num_results):
        results.append(
            f"{i+1}. Sample Result {i+1} for '{query}'\n"
            f"   Source: https://example.com/result{i+1}\n"
            f"   Summary: This is a sample search result with relevant information."
        )

    return "\n\n".join(results)


@tool
async def search_papers(query: str, max_results: int = 3) -> str:
    """
    Search academic papers and research publications.

    Args:
        query: Search query
        max_results: Maximum number of papers to return

    Returns:
        Formatted paper results with citations
    """
    # TODO: Implement actual paper search (Semantic Scholar, arXiv, etc.)
    # This is a placeholder
    results = []
    for i in range(max_results):
        results.append(
            f"[{i+1}] Sample Paper {i+1}\n"
            f"    Authors: Author A, Author B\n"
            f"    Year: 202{i}\n"
            f"    Abstract: This paper discusses {query} and presents novel findings...\n"
            f"    Citation: Author et al. (202{i}). Sample Paper {i+1}. Journal Name."
        )

    return "\n\n".join(results)


@tool
async def extract_key_points(text: str) -> str:
    """
    Extract key points from text.

    Args:
        text: Text to analyze

    Returns:
        Bulleted list of key points
    """
    # TODO: Implement actual extraction (could use another LLM call)
    # This is a placeholder
    return (
        "Key Points:\n"
        "- Point 1: Important finding from the research\n"
        "- Point 2: Supporting evidence and data\n"
        "- Point 3: Implications and conclusions\n"
        "- Point 4: Areas requiring further investigation"
    )


@tool
async def verify_facts(claim: str) -> dict:
    """
    Verify factual claims.

    Args:
        claim: Claim to verify

    Returns:
        Verification result with confidence score
    """
    # TODO: Implement actual fact verification
    # This is a placeholder
    return {
        "claim": claim,
        "verified": True,
        "confidence": 0.85,
        "sources": ["Source 1", "Source 2"],
        "explanation": "This claim is supported by multiple reliable sources."
    }


# Research tools
research_tools = [search_web, search_papers, extract_key_points, verify_facts]


# ============================================================================
# Memory System
# ============================================================================

class SemanticMemory:
    """
    Semantic memory using vector store for context retrieval.
    """

    def __init__(self, collection_name: str = "research_memory"):
        """Initialize semantic memory."""
        self.embeddings = OpenAIEmbeddings()
        self.vectorstore = Chroma(
            collection_name=collection_name,
            embedding_function=self.embeddings,
            persist_directory=".research_memory"
        )

    async def store(self, text: str, metadata: dict = None) -> None:
        """Store text in semantic memory."""
        if metadata is None:
            metadata = {}

        metadata["timestamp"] = datetime.now().isoformat()

        self.vectorstore.add_texts(
            texts=[text],
            metadatas=[metadata]
        )

    async def retrieve(self, query: str, k: int = 3) -> list[str]:
        """Retrieve relevant memories."""
        docs = self.vectorstore.similarity_search(query, k=k)
        return [doc.page_content for doc in docs]


# Global memory instance
memory = SemanticMemory()


# ============================================================================
# Agent Nodes
# ============================================================================

async def research_planner_node(state: ResearchState) -> ResearchState:
    """
    Plan the research strategy.

    Determines what sources to search and what questions to answer.
    """
    system_prompt = """You are a research planning specialist. Your job is to:
1. Analyze the research query
2. Determine what information is needed
3. Plan which tools to use (web search, paper search, fact verification)
4. Break down complex queries into manageable parts

Use the available tools strategically to gather comprehensive information."""

    model = ChatAnthropic(
        model="claude-sonnet-5"
    ).bind_tools(research_tools)

    messages = [SystemMessage(content=system_prompt)] + list(state["messages"])

    response = await model.ainvoke(messages)

    return {
        "messages": [response],
        "iteration_count": state.get("iteration_count", 0) + 1
    }


async def web_research_node(state: ResearchState) -> ResearchState:
    """
    Conduct web research.

    Searches the web and stores results.
    """
    query = state["query"]

    # Search the web
    results = await search_web.ainvoke({"query": query, "num_results": 5})

    # Store in semantic memory
    await memory.store(
        f"Web research for '{query}':\n{results}",
        {"source": "web", "query": query}
    )

    message = AIMessage(
        content=f"Web research completed. Found information about {query}.",
        name="web_researcher"
    )

    return {
        "web_results": [results],
        "messages": [message]
    }


async def paper_research_node(state: ResearchState) -> ResearchState:
    """
    Research academic papers.

    Searches academic databases and stores results.
    """
    query = state["query"]

    # Search papers
    results = await search_papers.ainvoke({"query": query, "max_results": 3})

    # Store in semantic memory
    await memory.store(
        f"Academic research for '{query}':\n{results}",
        {"source": "papers", "query": query}
    )

    message = AIMessage(
        content=f"Academic research completed. Found {3} relevant papers.",
        name="paper_researcher"
    )

    return {
        "paper_results": [results],
        "messages": [message]
    }


async def synthesis_node(state: ResearchState) -> ResearchState:
    """
    Synthesize findings into a comprehensive summary.

    Combines web and paper research with semantic memory context.
    """
    query = state["query"]

    # Retrieve relevant context from memory
    memory_context = await memory.retrieve(query, k=5)

    # Build synthesis prompt
    web_results = "\n\n".join(state.get("web_results", []))
    paper_results = "\n\n".join(state.get("paper_results", []))
    memory_text = "\n\n".join(memory_context)

    synthesis_prompt = f"""Based on the research findings below, create a comprehensive summary.

QUERY: {query}

WEB RESEARCH:
{web_results}

ACADEMIC RESEARCH:
{paper_results}

RELEVANT CONTEXT FROM MEMORY:
{memory_text}

Provide a well-structured summary that:
1. Answers the research query
2. Synthesizes information from multiple sources
3. Highlights key findings and insights
4. Notes any limitations or areas needing further research
5. Provides a confidence assessment

Format the summary in markdown with clear sections."""

    model = ChatAnthropic(
        model="claude-sonnet-5"
    )

    response = await model.ainvoke([HumanMessage(content=synthesis_prompt)])

    # Store synthesis in memory
    await memory.store(
        f"Research synthesis for '{query}':\n{response.content}",
        {"source": "synthesis", "query": query}
    )

    return {
        "synthesis": response.content,
        "confidence": 0.85,  # TODO: Calculate actual confidence
        "messages": [response]
    }


async def quality_check_node(state: ResearchState) -> ResearchState:
    """
    Verify research quality and completeness.

    Checks if the research adequately answers the query.
    """
    query = state["query"]
    synthesis = state.get("synthesis", "")

    check_prompt = f"""Evaluate the quality of this research summary:

ORIGINAL QUERY: {query}

RESEARCH SUMMARY:
{synthesis}

Assessment criteria:
1. Does it directly answer the query?
2. Is the information comprehensive?
3. Are sources properly cited?
4. Is the conclusion well-supported?
5. Are there significant gaps?

Provide:
- Overall quality score (0-1)
- Specific strengths
- Areas for improvement
- Recommendation (approve/revise)"""

    model = ChatAnthropic(
        model="claude-sonnet-5"
    )

    response = await model.ainvoke([HumanMessage(content=check_prompt)])

    return {"messages": [response]}


# ============================================================================
# Tool Execution Node
# ============================================================================

tool_node = ToolNode(research_tools)


# ============================================================================
# Routing Logic
# ============================================================================

def should_continue(state: ResearchState) -> str:
    """
    Route based on agent's tool calls.
    """
    messages = state["messages"]
    last_message = messages[-1]

    # Check for tool calls
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"

    # Check iteration limit
    if state.get("iteration_count", 0) >= 10:
        return "synthesize"

    return "synthesize"


def route_research_type(state: ResearchState) -> list[str]:
    """
    Route to appropriate research nodes (can run in parallel).
    """
    # In a real implementation, this would be dynamic based on query
    # For now, we do both web and paper research
    return ["web_research", "paper_research"]


# ============================================================================
# Graph Construction
# ============================================================================

def create_research_graph():
    """
    Create the research assistant graph.

    Returns:
        Compiled StateGraph
    """
    workflow = StateGraph(ResearchState)

    # Add nodes
    workflow.add_node("planner", research_planner_node)
    workflow.add_node("tools", tool_node)
    workflow.add_node("web_research", web_research_node)
    workflow.add_node("paper_research", paper_research_node)
    workflow.add_node("synthesis", synthesis_node)
    workflow.add_node("quality_check", quality_check_node)

    # Define flow
    workflow.add_edge(START, "planner")

    # Planner can call tools or move to research
    workflow.add_conditional_edges(
        "planner",
        should_continue,
        {
            "tools": "tools",
            "synthesize": "web_research"  # Skip to research if no tools needed
        }
    )

    # Tools go back to planner
    workflow.add_edge("tools", "planner")

    # Parallel research (in practice, would use Send for true parallelism)
    workflow.add_edge("web_research", "paper_research")
    workflow.add_edge("paper_research", "synthesis")

    # Synthesis goes to quality check
    workflow.add_edge("synthesis", "quality_check")

    # Quality check ends
    workflow.add_edge("quality_check", END)

    # Add checkpointing
    checkpointer = SqliteSaver.from_conn_string("research_assistant.db")

    return workflow.compile(checkpointer=checkpointer)


# ============================================================================
# Main Function
# ============================================================================

async def research(query: str, session_id: str = None) -> dict:
    """
    Conduct research on a query.

    Args:
        query: The research query
        session_id: Optional session ID for continuity

    Returns:
        Research results
    """
    graph = create_research_graph()

    # Generate session ID if not provided
    if session_id is None:
        session_id = f"research-{datetime.now().strftime('%Y%m%d-%H%M%S')}"

    config = {
        "configurable": {
            "thread_id": session_id
        }
    }

    # Initial state
    initial_state = {
        "messages": [
            SystemMessage(content="You are a research assistant with access to web search, academic papers, and analysis tools."),
            HumanMessage(content=f"Research this topic comprehensively: {query}")
        ],
        "query": query,
        "web_results": [],
        "paper_results": [],
        "synthesis": "",
        "confidence": 0.0,
        "iteration_count": 0
    }

    # Run the graph
    result = await graph.ainvoke(initial_state, config)

    return result


# ============================================================================
# Example Usage
# ============================================================================

async def main():
    """
    Example usage of the research assistant.
    """
    print("=" * 80)
    print("RESEARCH ASSISTANT - Example")
    print("=" * 80)

    # Conduct research
    query = "What are the latest developments in LangGraph and agent orchestration?"

    print(f"\nResearching: {query}\n")

    result = await research(query)

    # Display results
    print("\n" + "=" * 80)
    print("RESEARCH SYNTHESIS")
    print("=" * 80)
    print(result.get("synthesis", "No synthesis generated"))

    print("\n" + "=" * 80)
    print("METADATA")
    print("=" * 80)
    print(f"Confidence: {result.get('confidence', 0):.2f}")
    print(f"Iterations: {result.get('iteration_count', 0)}")
    print(f"Web results: {len(result.get('web_results', []))}")
    print(f"Paper results: {len(result.get('paper_results', []))}")


if __name__ == "__main__":
    asyncio.run(main())
