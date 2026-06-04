---
name: agentic-patterns
description: "Patterns from \"Agentic Design Patterns\" (Gulli & Sauco, 2025) applied to async Python API development, MongoDB/Beanie data modeling, and production-ready backend services"
---

# Agentic Design Patterns — FastAPI Backend

> Patterns from "Agentic Design Patterns" (Gulli & Sauco, 2025) applied to async Python API development, MongoDB/Beanie data modeling, and production-ready backend services

## Applied Patterns

### Prompt Chaining
**Relevance**: HTTP request processing in FastAPI is inherently a chain — middleware → auth → validation → business logic → response serialization — each step consuming the output of the previous.
**Current Implementation**: FastAPI's dependency injection system implements implicit chaining through `Depends()` chains; the `endpoint` command scaffolds these chains.
**Enhancement**: Model the request pipeline explicitly as a prompt chain where each stage has a declared input schema, output schema, and failure mode. Document the chain topology in endpoint scaffolding so that each dependency layer knows what structured context it receives and produces. This makes the chain auditable, testable at each link, and easier to extend without breaking downstream stages.

### Tool Use
**Relevance**: In an agentic context, every API endpoint is a tool — a callable with a name, description, input schema, and output schema. FastAPI's OpenAPI spec is already a tool manifest.
**Current Implementation**: The `endpoint` command generates FastAPI routes with Pydantic models; the OpenAPI spec is auto-generated.
**Enhancement**: Treat the generated OpenAPI spec as a first-class tool registry. Add an `/agent/tools` meta-endpoint that returns a structured tool manifest compatible with LLM function-calling formats (OpenAI, Anthropic). Each endpoint decorated with `@tool_enabled` is automatically registered. This allows the backend to serve as an MCP-compatible tool server without additional infrastructure.

### Exception Handling
**Relevance**: Async Python introduces subtle error propagation challenges — exceptions in background tasks, timeout cascades, and partial failures in concurrent operations require structured handling beyond standard try/except.
**Current Implementation**: The `task` command scaffolds background tasks with ARQ/Celery; error handling is left to the developer.
**Enhancement**: Implement a layered exception taxonomy: `ValidationError` (400), `AuthorizationError` (403), `ResourceNotFoundError` (404), `ExternalServiceError` (502), `TaskTimeoutError` (504). Each exception type has a structured handler that: logs with trace context, returns a machine-readable error body (RFC 7807 Problem Details), triggers appropriate retry or dead-letter logic for async tasks, and emits an observability event. The `endpoint` scaffolder includes exception handler registration by default.

### Guardrails
**Relevance**: Production APIs must enforce input validity, authentication, rate limiting, and content safety before business logic executes — these are non-negotiable constraints, not optional middleware.
**Current Implementation**: Keycloak auth is scaffolded via the `scaffold` command; input validation uses Pydantic models.
**Enhancement**: Formalize guardrails as a declarative middleware stack applied at the router level: (1) Authentication — Keycloak JWT validation with role extraction, (2) Authorization — RBAC/ABAC policy evaluation, (3) Input validation — Pydantic with custom validators and business rules, (4) Rate limiting — Redis-backed sliding window per user/IP/endpoint, (5) Content safety — field-level sanitization for user-supplied strings. The `endpoint` scaffolder prompts for which guardrails to enable and generates the appropriate middleware chain.

### Memory
**Relevance**: Stateless HTTP APIs need external memory for session state, user preferences, conversation context (for AI-adjacent endpoints), and cache of expensive computations.
**Current Implementation**: Redis integration is included in the plugin stack; the `scaffold` command can generate caching middleware.
**Enhancement**: Implement a three-tier memory system: (1) Request-scoped memory — FastAPI request state for within-request context sharing, (2) Session memory — Redis TTL keys for user session data, structured as typed Pydantic models, (3) Persistent memory — MongoDB documents for long-lived state. The `model` command generates data models with explicit memory-tier annotations. Provide a `MemoryClient` abstraction that transparently routes reads/writes to the correct tier based on declared scope.

### RAG (Retrieval-Augmented Generation)
**Relevance**: Backend APIs increasingly need to retrieve and surface relevant knowledge — product documentation, policy text, historical records — as part of request processing for AI-augmented features.
**Current Implementation**: MongoDB/Beanie is the data layer; no vector search or retrieval scaffolding exists.
**Enhancement**: Add a `retrieval` module scaffold (via `endpoint --type retrieval`) that wires: MongoDB Atlas Vector Search (or a configurable vector store), a chunking/embedding pipeline for document ingestion, a retrieval endpoint that accepts a query and returns ranked context chunks, and a generation endpoint that combines retrieved context with an LLM call. The retrieval layer integrates with the existing Keycloak auth so that document access respects user permissions.

### Parallelization
**Relevance**: FastAPI's async architecture allows concurrent I/O operations — fetching from multiple external services, running multiple database queries, processing batch requests — but developers often write sequential code by habit.
**Current Implementation**: The `task` command scaffolds background tasks; async/await patterns are used throughout.
**Enhancement**: Provide `parallel_fetch` and `parallel_execute` utility helpers using `asyncio.gather` with structured error collection (not fail-fast). The `endpoint` scaffolder detects when multiple independent `Depends()` calls exist and suggests converting them to a parallel gather. For batch endpoints, scaffold a fan-out pattern that processes items concurrently with configurable concurrency limits to avoid overwhelming downstream services.

### Resource-Aware
**Relevance**: FastAPI services under load must manage database connections, Redis connections, HTTP client sessions, and thread pool workers carefully. Exhausting any pool degrades or crashes the service.
**Current Implementation**: The plugin scaffolds connection pools for MongoDB and Redis; configuration is static.
**Enhancement**: Add a resource-awareness layer that: monitors current pool utilization via the `/metrics` endpoint (Prometheus), dynamically adjusts pool sizes within configured min/max bounds based on request rate, sheds load gracefully when resource limits are approached (return 503 with `Retry-After` header rather than hanging), and emits pool exhaustion alerts before they become outages. The `deploy` command includes a resource sizing guide based on expected RPS.

## Pattern Interaction Map

```
Inbound HTTP Request
    │
    ▼
[Guardrails] — declarative middleware stack
  ├── Auth (Keycloak JWT)
  ├── RBAC/ABAC policy
  ├── Rate limiting (Redis)
  └── Input validation (Pydantic)
    │
    ▼
[Prompt Chaining] — dependency injection chain
  Each Depends() link: typed input → typed output
    │
    ├── [Memory] — read session/cache state
    │     ├── Request scope (FastAPI state)
    │     ├── Session scope (Redis TTL)
    │     └── Persistent scope (MongoDB)
    │
    ├── [Parallelization] — concurrent I/O
    │     asyncio.gather for independent fetches
    │
    ├── [RAG] — retrieval for AI-augmented endpoints
    │     Vector search → ranked context → LLM call
    │
    └── [Tool Use] — endpoint as callable tool
          OpenAPI spec → /agent/tools manifest
    │
    ▼
[Exception Handling] — typed exception taxonomy
  ├── Sync errors → structured HTTP response (RFC 7807)
  └── Async task errors → retry / dead-letter queue
    │
    ▼
[Resource-Aware] — pool monitoring + adaptive sizing
  Prometheus metrics → dynamic pool adjustment → load shedding
```

## References
- Gulli, A. & Sauco, M. (2025). Agentic Design Patterns.
- Repository: github.com/Mathews-Tom/Agentic-Design-Patterns
