---
name: langchain-integrations
description: Expert knowledge in LangChain tools, chains, agents, and integrations for building production-grade AI workflows
triggers:
  - langchain
  - chains
  - agents
  - tools
  - llm
  - embeddings
  - vectorstore
  - retrieval
  - lcel
  - runnable
  - prompt template
  - output parser
  - memory
  - callbacks
  - tracing
tags:
  - langchain
  - tools
  - integrations
  - ai-orchestration
---

# LangChain Integrations Expert

You are a LangChain integration specialist for the Exec Automator platform. Your expertise covers the complete LangChain ecosystem, from foundational components to advanced patterns for production AI systems. You provide guidance on tool creation, chain composition, agent design, RAG pipelines, and integration strategies.

## Core LangChain Architecture

### LCEL (LangChain Expression Language)

LCEL is the declarative, composable way to build LangChain chains. It provides streaming, async support, and parallel execution out of the box.

#### Basic LCEL Chain

```python
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# Components
llm = ChatAnthropic(model="claude-sonnet-5")
prompt = ChatPromptTemplate.from_template(
    "You are an expert in {domain}. Answer this question: {question}"
)
output_parser = StrOutputParser()

# Chain composition with | operator
chain = prompt | llm | output_parser

# Invoke
result = chain.invoke({
    "domain": "executive management",
    "question": "What are key leadership competencies?"
})
```

#### Streaming LCEL

```python
# Stream responses
for chunk in chain.stream({"domain": "automation", "question": "ROI analysis"}):
    print(chunk, end="", flush=True)
```

#### Async LCEL

```python
import asyncio

# Async invocation
result = await chain.ainvoke({
    "domain": "process optimization",
    "question": "How to prioritize initiatives?"
})

# Async streaming
async for chunk in chain.astream({"domain": "AI", "question": "Implementation"}):
    print(chunk, end="", flush=True)
```

#### Parallel Execution

```python
from langchain_core.runnables import RunnableParallel

# Multiple chains in parallel
parallel_chain = RunnableParallel(
    analysis=analysis_chain,
    recommendation=recommendation_chain,
    risk_assessment=risk_chain
)

result = parallel_chain.invoke({"input": "Board meeting preparation"})
# Returns: {
#   "analysis": "...",
#   "recommendation": "...",
#   "risk_assessment": "..."
# }
```

#### Branching with RunnableBranch

```python
from langchain_core.runnables import RunnableBranch

# Conditional routing
branch = RunnableBranch(
    (lambda x: x["priority"] == "urgent", urgent_chain),
    (lambda x: x["priority"] == "high", high_priority_chain),
    standard_chain  # default
)

result = branch.invoke({"priority": "urgent", "task": "Crisis response"})
```

#### RunnablePassthrough

```python
from langchain_core.runnables import RunnablePassthrough

# Pass input through while transforming
chain = (
    {
        "context": retriever,  # Fetch context
        "question": RunnablePassthrough()  # Pass question through
    }
    | prompt
    | llm
    | output_parser
)
```

#### RunnableLambda for Custom Logic

```python
from langchain_core.runnables import RunnableLambda

def enrich_input(input_dict):
    """Add enrichment data."""
    return {
        **input_dict,
        "timestamp": datetime.now().isoformat(),
        "user_context": get_user_context(input_dict["user_id"])
    }

chain = (
    RunnableLambda(enrich_input)
    | prompt
    | llm
    | output_parser
)
```

## Tool Creation and Usage

### Defining Custom Tools

#### Function Tool with @tool Decorator

```python
from langchain_core.tools import tool
from typing import Optional

@tool
def search_organizational_policies(
    query: str,
    department: Optional[str] = None,
    effective_date: Optional[str] = None
) -> dict:
    """
    Search organizational policy database.

    Args:
        query: Search query string
        department: Filter by department (optional)
        effective_date: Filter by effective date (optional)

    Returns:
        Dictionary with matching policies and metadata
    """
    # Implementation
    results = policy_database.search(
        query=query,
        filters={
            "department": department,
            "effective_date": effective_date
        }
    )

    return {
        "policies": results,
        "count": len(results),
        "query": query
    }

# Tool automatically gets proper schema from function signature
print(search_organizational_policies.name)
print(search_organizational_policies.description)
print(search_organizational_policies.args_schema.schema())
```

#### Structured Tool with Pydantic

```python
from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field

class MeetingScheduleInput(BaseModel):
    """Input schema for meeting scheduling."""
    title: str = Field(description="Meeting title")
    attendees: list[str] = Field(description="List of attendee email addresses")
    duration_minutes: int = Field(description="Duration in minutes", ge=15, le=480)
    preferred_date: str = Field(description="Preferred date (YYYY-MM-DD)")
    priority: str = Field(description="Priority level", pattern="^(low|medium|high|urgent)$")

def schedule_meeting(
    title: str,
    attendees: list[str],
    duration_minutes: int,
    preferred_date: str,
    priority: str
) -> dict:
    """Schedule a meeting with conflict detection."""
    # Check availability
    conflicts = calendar_service.check_conflicts(attendees, preferred_date, duration_minutes)

    if conflicts:
        return {
            "success": False,
            "conflicts": conflicts,
            "suggested_times": calendar_service.suggest_alternatives(attendees, preferred_date)
        }

    # Create meeting
    meeting = calendar_service.create_meeting(
        title=title,
        attendees=attendees,
        duration=duration_minutes,
        date=preferred_date,
        priority=priority
    )

    return {
        "success": True,
        "meeting_id": meeting.id,
        "calendar_link": meeting.link
    }

# Create structured tool
schedule_meeting_tool = StructuredTool.from_function(
    func=schedule_meeting,
    name="schedule_meeting",
    description="Schedule a meeting with automatic conflict detection",
    args_schema=MeetingScheduleInput
)
```

#### BaseTool Class

```python
from langchain_core.tools import BaseTool
from typing import Type
from pydantic import BaseModel, Field

class BoardReportInput(BaseModel):
    """Input for board report generation."""
    reporting_period: str = Field(description="Period (e.g., 'Q1 2024')")
    sections: list[str] = Field(description="Report sections to include")
    format: str = Field(description="Output format (pdf, docx, pptx)")

class BoardReportTool(BaseTool):
    """Generate executive board reports."""

    name: str = "generate_board_report"
    description: str = "Generate comprehensive board reports with financial and operational metrics"
    args_schema: Type[BaseModel] = BoardReportInput

    def _run(self, reporting_period: str, sections: list[str], format: str) -> dict:
        """Synchronous execution."""
        # Gather data
        data = self._gather_board_data(reporting_period, sections)

        # Generate report
        report = self._generate_report(data, format)

        return {
            "report_id": report.id,
            "download_url": report.url,
            "sections_included": sections,
            "generated_at": datetime.now().isoformat()
        }

    async def _arun(self, reporting_period: str, sections: list[str], format: str) -> dict:
        """Async execution."""
        # Async implementation
        data = await self._gather_board_data_async(reporting_period, sections)
        report = await self._generate_report_async(data, format)

        return {
            "report_id": report.id,
            "download_url": report.url,
            "sections_included": sections,
            "generated_at": datetime.now().isoformat()
        }

    def _gather_board_data(self, period: str, sections: list[str]) -> dict:
        """Gather report data."""
        # Implementation
        pass

    def _generate_report(self, data: dict, format: str) -> object:
        """Generate formatted report."""
        # Implementation
        pass

# Instantiate tool
board_report_tool = BoardReportTool()
```

### Tool Integration Patterns

#### Tool-Calling Agent

```python
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate

# Define tools
tools = [
    search_organizational_policies,
    schedule_meeting_tool,
    board_report_tool
]

# Create agent prompt
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an executive assistant AI. Use tools to help with organizational tasks."),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}")
])

# Create agent
llm = ChatAnthropic(model="claude-sonnet-5")
agent = create_tool_calling_agent(llm, tools, prompt)

# Create executor
agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,
    max_iterations=5,
    return_intermediate_steps=True
)

# Run agent
result = agent_executor.invoke({
    "input": "Schedule a board meeting for next Tuesday and prepare the quarterly report"
})

print(result["output"])
print(result["intermediate_steps"])  # See tool calls
```

#### ReAct Agent

```python
from langchain.agents import create_react_agent

# ReAct prompt template
react_prompt = ChatPromptTemplate.from_template("""
Answer the following questions as best you can. You have access to the following tools:

{tools}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Begin!

Question: {input}
Thought: {agent_scratchpad}
""")

agent = create_react_agent(llm, tools, react_prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
```

#### OpenAI Functions Agent

```python
from langchain.agents import create_openai_functions_agent
from langchain_openai import ChatOpenAI

# Works with OpenAI or compatible APIs
llm = ChatOpenAI(model="gpt-4-turbo")

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful executive assistant."),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}")
])

agent = create_openai_functions_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools)
```

## Chains and LCEL Patterns

### Sequential Chains

```python
from langchain_core.runnables import RunnableSequence

# Multi-step processing
step1 = extract_requirements_chain
step2 = analyze_feasibility_chain
step3 = generate_recommendations_chain

sequential_chain = step1 | step2 | step3

result = sequential_chain.invoke({"request": "Implement new CRM system"})
```

### Map-Reduce Pattern

```python
from langchain_core.runnables import RunnableParallel

# Process multiple documents
def map_chain(docs):
    """Map operation over documents."""
    return [summarize_chain.invoke({"doc": doc}) for doc in docs]

def reduce_chain(summaries):
    """Reduce summaries to final output."""
    combined = "\n\n".join(summaries)
    return final_summary_chain.invoke({"summaries": combined})

# Complete map-reduce
documents = retriever.get_relevant_documents(query)
summaries = map_chain(documents)
final_summary = reduce_chain(summaries)
```

### Router Chain

```python
from langchain_core.runnables import RunnableBranch

# Route to specialized chains
def route_query(input_dict):
    """Determine query type."""
    query = input_dict["query"]

    if "policy" in query.lower() or "compliance" in query.lower():
        return "policy"
    elif "financial" in query.lower() or "budget" in query.lower():
        return "finance"
    elif "meeting" in query.lower() or "schedule" in query.lower():
        return "scheduling"
    else:
        return "general"

router = RunnableBranch(
    (lambda x: route_query(x) == "policy", policy_expert_chain),
    (lambda x: route_query(x) == "finance", finance_expert_chain),
    (lambda x: route_query(x) == "scheduling", scheduling_chain),
    general_assistant_chain
)

result = router.invoke({"query": "What's our travel reimbursement policy?"})
```

### Transform Chain

```python
from langchain_core.runnables import RunnableLambda

def preprocess(input_dict):
    """Clean and enrich input."""
    return {
        "cleaned_text": input_dict["text"].strip().lower(),
        "metadata": {
            "original_length": len(input_dict["text"]),
            "timestamp": datetime.now().isoformat()
        }
    }

def postprocess(output):
    """Format output."""
    return {
        "response": output,
        "formatted": f"**Answer:** {output}",
        "processed_at": datetime.now().isoformat()
    }

chain = (
    RunnableLambda(preprocess)
    | core_processing_chain
    | RunnableLambda(postprocess)
)
```

## Memory Systems

### Conversation Buffer Memory

```python
from langchain.memory import ConversationBufferMemory

# Simple message history
memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True
)

# In chain
chain = (
    {
        "input": RunnablePassthrough(),
        "chat_history": lambda x: memory.load_memory_variables({})["chat_history"]
    }
    | prompt
    | llm
    | output_parser
)

# After each interaction
result = chain.invoke({"input": "Hello"})
memory.save_context({"input": "Hello"}, {"output": result})
```

### Conversation Summary Memory

```python
from langchain.memory import ConversationSummaryMemory

# Summarize long conversations
memory = ConversationSummaryMemory(
    llm=llm,
    memory_key="history",
    return_messages=True
)

# Automatically summarizes old messages
memory.save_context(
    {"input": "We discussed Q1 budget allocation"},
    {"output": "The Q1 budget was approved with $500K for IT infrastructure"}
)
```

### Entity Memory

```python
from langchain.memory import ConversationEntityMemory

# Track entities across conversation
memory = ConversationEntityMemory(
    llm=llm,
    entity_store={},
    chat_history_key="history",
    entity_cache=["budget", "timeline", "stakeholders"]
)

# Remembers facts about entities
result = chain.invoke({
    "input": "What did we decide about the Q2 budget?",
    "entities": memory.entity_store
})
```

### Vector Store Memory

```python
from langchain.memory import VectorStoreRetrieverMemory
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma

# Semantic memory retrieval
embeddings = OpenAIEmbeddings()
vectorstore = Chroma(embedding_function=embeddings)

memory = VectorStoreRetrieverMemory(
    retriever=vectorstore.as_retriever(search_kwargs={"k": 3})
)

# Store memories
memory.save_context(
    {"input": "Project Alpha timeline"},
    {"output": "Project Alpha is scheduled for completion in Q3 2024"}
)

# Retrieve relevant memories
relevant_memories = memory.load_memory_variables(
    {"input": "When is Project Alpha due?"}
)
```

## Embeddings and Vector Stores

### OpenAI Embeddings

```python
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings(
    model="text-embedding-3-large",
    dimensions=1024  # Optional: reduce dimensions
)

# Embed query
query_embedding = embeddings.embed_query("What is the vacation policy?")

# Embed documents
doc_embeddings = embeddings.embed_documents([
    "Document 1 text",
    "Document 2 text"
])
```

### Chroma Vector Store

```python
from langchain_community.vectorstores import Chroma
from langchain_community.document_loaders import DirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Load documents
loader = DirectoryLoader("./policies", glob="**/*.txt")
documents = loader.load()

# Split documents
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)
splits = text_splitter.split_documents(documents)

# Create vector store
vectorstore = Chroma.from_documents(
    documents=splits,
    embedding=embeddings,
    persist_directory="./chroma_db"
)

# Similarity search
results = vectorstore.similarity_search(
    "vacation policy",
    k=3
)

# MMR search (diverse results)
results = vectorstore.max_marginal_relevance_search(
    "vacation policy",
    k=3,
    fetch_k=10
)
```

### Pinecone Vector Store

```python
from langchain_community.vectorstores import Pinecone
import pinecone

# Initialize Pinecone
pinecone.init(
    api_key="your-api-key",
    environment="us-west1-gcp"
)

# Create vector store
vectorstore = Pinecone.from_documents(
    documents=splits,
    embedding=embeddings,
    index_name="org-policies",
    namespace="hr-policies"
)

# Search with metadata filter
results = vectorstore.similarity_search(
    "remote work",
    k=5,
    filter={"department": "HR", "year": 2024}
)
```

### Weaviate Vector Store

```python
from langchain_community.vectorstores import Weaviate
import weaviate

# Connect to Weaviate
client = weaviate.Client(
    url="https://your-instance.weaviate.network",
    auth_client_secret=weaviate.AuthApiKey("your-api-key")
)

# Create vector store
vectorstore = Weaviate.from_documents(
    documents=splits,
    embedding=embeddings,
    client=client,
    index_name="OrgPolicies",
    text_key="content",
    by_text=False
)

# Hybrid search (semantic + keyword)
results = vectorstore.similarity_search(
    "remote work policy",
    k=5,
    alpha=0.5  # Balance between semantic and keyword
)
```

## RAG (Retrieval-Augmented Generation) Patterns

### Basic RAG Chain

```python
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

# RAG prompt
rag_prompt = ChatPromptTemplate.from_template("""
Answer the question based on the following context:

Context: {context}

Question: {question}

Answer:
""")

# Format documents
def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

# RAG chain
rag_chain = (
    {
        "context": retriever | format_docs,
        "question": RunnablePassthrough()
    }
    | rag_prompt
    | llm
    | StrOutputParser()
)

result = rag_chain.invoke("What is our remote work policy?")
```

### RAG with Sources

```python
from langchain_core.runnables import RunnableParallel

# Return answer and sources
rag_chain_with_sources = RunnableParallel(
    {
        "context": retriever,
        "question": RunnablePassthrough()
    }
).assign(
    answer=(
        lambda x: format_docs(x["context"])
        | rag_prompt
        | llm
        | StrOutputParser()
    )
)

result = rag_chain_with_sources.invoke("What is our remote work policy?")
# Returns: {"context": [docs], "question": "...", "answer": "..."}
```

### Conversational RAG

```python
from langchain.chains import create_history_aware_retriever
from langchain_core.prompts import MessagesPlaceholder

# Contextualize question with chat history
contextualize_prompt = ChatPromptTemplate.from_messages([
    ("system", "Given a chat history and the latest user question, reformulate the question to be standalone."),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}")
])

history_aware_retriever = create_history_aware_retriever(
    llm,
    retriever,
    contextualize_prompt
)

# RAG with history
qa_prompt = ChatPromptTemplate.from_messages([
    ("system", "Use the following context to answer:\n\n{context}"),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}")
])

conversational_rag_chain = (
    {
        "context": history_aware_retriever | format_docs,
        "input": RunnablePassthrough(),
        "chat_history": lambda x: x.get("chat_history", [])
    }
    | qa_prompt
    | llm
    | StrOutputParser()
)
```

### Multi-Query RAG

```python
from langchain.retrievers import MultiQueryRetriever

# Generate multiple query variations
multi_query_retriever = MultiQueryRetriever.from_llm(
    retriever=vectorstore.as_retriever(),
    llm=llm
)

# Automatically generates variations and retrieves from all
results = multi_query_retriever.get_relevant_documents(
    "What are the rules for working from home?"
)
# Generates: "remote work policy", "telecommuting guidelines", "WFH regulations", etc.
```

### Parent Document Retriever

```python
from langchain.retrievers import ParentDocumentRetriever
from langchain.storage import InMemoryStore

# Split documents
child_splitter = RecursiveCharacterTextSplitter(chunk_size=400)
parent_splitter = RecursiveCharacterTextSplitter(chunk_size=2000)

# Storage for parent documents
store = InMemoryStore()

# Retrieve small chunks but return larger parent context
retriever = ParentDocumentRetriever(
    vectorstore=vectorstore,
    docstore=store,
    child_splitter=child_splitter,
    parent_splitter=parent_splitter
)

retriever.add_documents(documents)
```

## Output Parsers

### Structured Output Parser

```python
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field

class ExecutiveSummary(BaseModel):
    """Executive summary structure."""
    key_points: list[str] = Field(description="Main points")
    recommendations: list[str] = Field(description="Action items")
    risks: list[str] = Field(description="Identified risks")
    timeline: str = Field(description="Proposed timeline")
    budget_impact: str = Field(description="Budget implications")

parser = JsonOutputParser(pydantic_object=ExecutiveSummary)

prompt = ChatPromptTemplate.from_template(
    "Analyze the following proposal and provide a structured summary.\n\n"
    "{format_instructions}\n\n"
    "Proposal: {proposal}"
)

chain = (
    prompt.partial(format_instructions=parser.get_format_instructions())
    | llm
    | parser
)

result = chain.invoke({"proposal": "..."})
# Returns typed ExecutiveSummary object
```

### Enum Output Parser

```python
from langchain_core.output_parsers import EnumOutputParser
from enum import Enum

class Priority(str, Enum):
    URGENT = "urgent"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

parser = EnumOutputParser(enum=Priority)

prompt = ChatPromptTemplate.from_template(
    "Categorize the priority of this request: {request}\n\n"
    "{format_instructions}"
)

chain = (
    prompt.partial(format_instructions=parser.get_format_instructions())
    | llm
    | parser
)

priority = chain.invoke({"request": "Board meeting in 2 hours, missing materials"})
# Returns: Priority.URGENT
```

### Pydantic Output Parser

```python
from langchain_core.output_parsers import PydanticOutputParser

class MeetingAnalysis(BaseModel):
    """Meeting analysis structure."""
    attendees: list[str]
    key_decisions: list[str]
    action_items: list[dict[str, str]]  # {"owner": "...", "task": "...", "deadline": "..."}
    next_meeting: str
    sentiment: str

parser = PydanticOutputParser(pydantic_object=MeetingAnalysis)

prompt = ChatPromptTemplate.from_template(
    "Analyze this meeting transcript and extract structured information.\n\n"
    "{format_instructions}\n\n"
    "Transcript: {transcript}"
)

chain = (
    prompt.partial(format_instructions=parser.get_format_instructions())
    | llm
    | parser
)

analysis = chain.invoke({"transcript": "..."})
# Returns MeetingAnalysis object with full type safety
```

## Callbacks and Tracing

### LangSmith Tracing

```python
from langsmith import Client
import os

# Set up tracing
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = "your-api-key"
os.environ["LANGCHAIN_PROJECT"] = "exec-automator"

# All chains automatically traced
result = chain.invoke({"input": "..."})

# View traces in LangSmith dashboard
```

### Custom Callbacks

```python
from langchain_core.callbacks import BaseCallbackHandler
from typing import Any

class ExecutionTrackerCallback(BaseCallbackHandler):
    """Track chain execution metrics."""

    def __init__(self):
        self.llm_calls = 0
        self.tool_calls = 0
        self.total_tokens = 0

    def on_llm_start(self, serialized: dict, prompts: list[str], **kwargs) -> None:
        """Called when LLM starts."""
        self.llm_calls += 1
        print(f"LLM Call #{self.llm_calls}")

    def on_llm_end(self, response, **kwargs) -> None:
        """Called when LLM ends."""
        tokens = response.llm_output.get("token_usage", {})
        self.total_tokens += tokens.get("total_tokens", 0)
        print(f"Tokens used: {tokens.get('total_tokens', 0)}")

    def on_tool_start(self, tool: dict, input_str: str, **kwargs) -> None:
        """Called when tool starts."""
        self.tool_calls += 1
        print(f"Tool Call: {tool['name']} with input: {input_str}")

    def on_tool_end(self, output: str, **kwargs) -> None:
        """Called when tool ends."""
        print(f"Tool Output: {output[:100]}...")

    def on_chain_start(self, serialized: dict, inputs: dict, **kwargs) -> None:
        """Called when chain starts."""
        print(f"Chain started with inputs: {inputs}")

    def on_chain_end(self, outputs: dict, **kwargs) -> None:
        """Called when chain ends."""
        print(f"Chain completed. Total LLM calls: {self.llm_calls}, Tool calls: {self.tool_calls}")

# Use callback
tracker = ExecutionTrackerCallback()
result = chain.invoke(
    {"input": "..."},
    config={"callbacks": [tracker]}
)
```

### Async Callbacks

```python
from langchain_core.callbacks import AsyncCallbackHandler

class AsyncMetricsCallback(AsyncCallbackHandler):
    """Async callback for metrics."""

    async def on_llm_start(self, serialized: dict, prompts: list[str], **kwargs) -> None:
        """Track LLM start asynchronously."""
        await log_to_metrics_service("llm_start", {"prompts": len(prompts)})

    async def on_llm_end(self, response, **kwargs) -> None:
        """Track LLM completion."""
        await log_to_metrics_service("llm_end", {"tokens": response.llm_output})

# Use in async chain
callback = AsyncMetricsCallback()
result = await chain.ainvoke(
    {"input": "..."},
    config={"callbacks": [callback]}
)
```

## Model Integration

### Anthropic (Claude)

```python
from langchain_anthropic import ChatAnthropic

# Claude Sonnet
# Note: Sonnet 5 / Opus 4.7+ reject sampling params (temperature/top_p/top_k)
# with a 400 — steer style via prompting instead.
llm = ChatAnthropic(
    model="claude-sonnet-5",
    max_tokens=4096,
    anthropic_api_key=os.getenv("ANTHROPIC_API_KEY")
)

# Claude Opus (for complex reasoning)
opus_llm = ChatAnthropic(
    model="claude-opus-4-8",
    max_tokens=8192
)

# With adaptive thinking (replaces the removed fixed budget_tokens config;
# no beta header required)
thinking_llm = ChatAnthropic(
    model="claude-sonnet-5",
    max_tokens=16000,
    model_kwargs={
        "thinking": {
            "type": "adaptive"
        }
    }
)
```

### OpenAI (GPT)

```python
from langchain_openai import ChatOpenAI

# GPT-4 Turbo
llm = ChatOpenAI(
    model="gpt-4-turbo-preview",
    temperature=0.7,
    openai_api_key=os.getenv("OPENAI_API_KEY")
)

# GPT-4 with function calling
llm_with_tools = ChatOpenAI(
    model="gpt-4-turbo",
    temperature=0.3
).bind_tools(tools)

# Structured output mode
llm_structured = ChatOpenAI(
    model="gpt-4-turbo",
    model_kwargs={
        "response_format": {"type": "json_object"}
    }
)
```

### Google (Gemini)

```python
from langchain_google_genai import ChatGoogleGenerativeAI

# Gemini Pro
llm = ChatGoogleGenerativeAI(
    model="gemini-pro",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0.7
)

# Gemini with safety settings
llm_safe = ChatGoogleGenerativeAI(
    model="gemini-pro",
    safety_settings={
        "harassment": "block_none",
        "hate_speech": "block_none",
        "sexually_explicit": "block_none",
        "dangerous_content": "block_none"
    }
)
```

### Multi-Model Routing

```python
from langchain_core.runnables import RunnableBranch

# Route to appropriate model based on task
def select_model(input_dict):
    """Choose model based on complexity."""
    complexity = input_dict.get("complexity", "medium")

    if complexity == "high":
        return opus_llm
    elif complexity == "medium":
        return sonnet_llm
    else:
        return haiku_llm

model_router = RunnableLambda(select_model)

chain = (
    {"input": RunnablePassthrough(), "complexity": analyze_complexity}
    | model_router
    | prompt
    | output_parser
)
```

## Production Patterns

### Error Handling and Retries

```python
from langchain_core.runnables import RunnableRetry
from tenacity import retry, stop_after_attempt, wait_exponential

# Retry with exponential backoff
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10)
)
def call_with_retry(chain, input_data):
    """Call chain with retry logic."""
    try:
        return chain.invoke(input_data)
    except Exception as e:
        print(f"Attempt failed: {e}")
        raise

# Fallback chain
from langchain_core.runnables import RunnableWithFallbacks

primary_chain = primary_llm | prompt | parser
fallback_chain = fallback_llm | prompt | parser

chain_with_fallback = primary_chain.with_fallbacks([fallback_chain])

result = chain_with_fallback.invoke({"input": "..."})
```

### Caching

```python
from langchain.cache import InMemoryCache, SQLiteCache
from langchain.globals import set_llm_cache

# In-memory cache
set_llm_cache(InMemoryCache())

# Persistent cache
set_llm_cache(SQLiteCache(database_path=".langchain.db"))

# Now all LLM calls are cached
result1 = llm.invoke("What is 2+2?")  # Calls LLM
result2 = llm.invoke("What is 2+2?")  # Returns cached result
```

### Batch Processing

```python
# Batch invocation
inputs = [
    {"query": "Policy 1"},
    {"query": "Policy 2"},
    {"query": "Policy 3"}
]

results = chain.batch(inputs)

# Async batch
results = await chain.abatch(inputs)

# With max concurrency
results = await chain.abatch(inputs, config={"max_concurrency": 5})
```

### Streaming Patterns

```python
# Stream final output
for chunk in chain.stream({"input": "..."}):
    print(chunk, end="", flush=True)

# Stream intermediate steps
for chunk in chain.stream({"input": "..."}, {"include_run_info": True}):
    print(f"Step: {chunk}")

# Async streaming
async for chunk in chain.astream({"input": "..."}):
    print(chunk, end="", flush=True)
```

## Executive Automation Use Cases

### Board Meeting Preparation Chain

```python
# Complete board prep workflow
board_prep_chain = (
    {
        "agenda": retrieve_agenda,
        "financials": fetch_financial_data,
        "kpis": calculate_kpis,
        "updates": gather_project_updates
    }
    | RunnableLambda(format_board_packet)
    | generate_executive_summary
    | create_presentation
)

result = board_prep_chain.invoke({
    "meeting_date": "2024-03-15",
    "board_members": ["CEO", "CFO", "Board Chair"]
})
```

### Policy Compliance Checker

```python
# Check documents against policies
compliance_chain = (
    {
        "document": RunnablePassthrough(),
        "policies": retrieve_applicable_policies
    }
    | analyze_compliance
    | generate_compliance_report
)

report = compliance_chain.invoke({"document": contract_text})
```

### Automated Meeting Summarization

```python
# Meeting transcript to action items
meeting_summary_chain = (
    load_transcript
    | extract_key_points
    | identify_action_items
    | assign_owners
    | generate_meeting_minutes
    | distribute_to_attendees
)

summary = meeting_summary_chain.invoke({
    "meeting_id": "board-2024-03-01",
    "transcript_path": "transcripts/board-meeting.txt"
})
```

## Best Practices

1. **Use LCEL for Composition**: Prefer LCEL chains for better streaming, async, and parallel support
2. **Type Your Tools**: Use Pydantic models for tool inputs to ensure proper validation
3. **Implement Retries**: Add retry logic for production robustness
4. **Enable Tracing**: Use LangSmith or custom callbacks for observability
5. **Cache Strategically**: Cache expensive operations and LLM calls
6. **Batch When Possible**: Use batch operations for multiple similar requests
7. **Handle Errors Gracefully**: Implement fallbacks and error handlers
8. **Monitor Token Usage**: Track and optimize token consumption
9. **Test Tool Schemas**: Validate tool schemas before deployment
10. **Document Chains**: Maintain clear documentation of chain logic and data flow

Remember: LangChain provides the foundation for production AI workflows. Use these patterns to build reliable, scalable systems for executive automation.
