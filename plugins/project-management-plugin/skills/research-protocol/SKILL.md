---
intent: "Run deep research before task execution using the 4-source protocol: codebase, Perplexity, Context7, Firecrawl"
description: "Deep research before task execution using 4-source protocol: codebase→Perplexity→Context7→Firecrawl"
---

# Research Protocol Skill

## Why Research Precedes Every Non-Trivial Task

The research protocol exists because the most expensive mistake in autonomous execution is working from a stale or incomplete mental model. A task that proceeds without understanding the existing codebase may duplicate logic that already exists, choose an approach incompatible with established patterns, or introduce a dependency that conflicts with existing constraints. Research is not a courtesy — it is a precondition for safe autonomous execution.

The protocol is ordered deliberately. Each source is consulted only when the previous source leaves a gap. This ordering minimizes token cost while ensuring the executor has the full context needed to make correct implementation decisions. Skipping the protocol entirely is prohibited for any task estimated above 15 minutes. For tasks under 15 minutes (micro-tasks), a lightweight codebase check is still required but the external source steps may be skipped.

## The Four-Source Ordered Protocol

**Source 1: Codebase scan.** Before any external query, the executor scans the local codebase for existing implementations, patterns, and constraints relevant to the task. This scan uses Grep for keyword matches in file contents, Glob for locating files by path pattern, and Read for inspecting the most relevant files in detail. The codebase scan answers: Does this functionality already exist? What patterns are used in adjacent code? What naming conventions, file layouts, and module boundaries apply? What test infrastructure exists that this task must integrate with?

The codebase scan produces a list of relevant files, a summary of existing patterns, and a list of open questions that the codebase alone cannot answer. If the codebase scan answers all questions with high confidence, the protocol terminates here and execution begins. This is the most common outcome for maintenance tasks on familiar codebases.

**Source 2: Perplexity MCP.** When the codebase scan leaves open questions about domain knowledge, best practices, or ecosystem state (e.g., "what is the current recommended approach for JWT refresh token rotation?"), Perplexity is consulted via the `mcp__perplexity__*` tools. Perplexity is the right source for questions that require current, factual knowledge about the world beyond the repository — API behavior, security advisories, framework conventions, architectural trade-offs, and version compatibility.

Queries to Perplexity should be precise and focused. A single query per open question is preferred over broad queries covering multiple concerns. Each query should be phrased as a specific technical question rather than a topic (e.g., "What HTTP status code should a REST API return when a resource is successfully deleted and no content is returned?" rather than "REST API best practices"). Perplexity results are treated as authoritative for factual, well-established topics and as advisory for evolving or opinion-driven topics.

**Source 3: Context7 MCP.** When the task involves a specific library, framework, or SDK and the open questions concern API signatures, configuration options, version-specific behavior, or migration paths, Context7 is consulted via `mcp__claude_ai_Context7__*` tools. Context7 provides library documentation at a level of precision that Perplexity may not match for niche APIs or recently released versions. Use Context7 when you need to know the exact parameter name, the exact return type, or the exact configuration key — not general patterns or philosophy.

The workflow for Context7 is: first call `resolve-library-id` to obtain the canonical library identifier, then call `query-docs` with a focused query string. Multiple queries to Context7 are acceptable if the task spans multiple libraries, but each query should be scoped to one specific question about one specific library.

**Source 4: Firecrawl MCP.** When open questions require inspecting a specific web page — such as an official changelog, a migration guide at a known URL, or a vendor's API reference not covered by Context7 — Firecrawl is used via `mcp__firecrawl__firecrawl_scrape`. Firecrawl is the last resort because it is the most expensive source (network latency, potential redirect failures) and the most brittle (pages may be unavailable or bot-protected). Use Firecrawl only when you have a specific URL and the required information cannot be obtained from the previous three sources.

## Cache Check Rules

Before initiating any external source query, check whether a research brief already exists for this task at `research/{task-id}.md` within the project state directory. If the file exists and its `researched_at` timestamp is less than 24 hours old, treat it as a cache hit and skip the research phase entirely, proceeding directly to execution with the cached brief. If the file is older than 24 hours, delete it and run the full protocol again — library APIs, security advisories, and best practices can shift meaningfully within a single day.

The 24-hour TTL is a default. For tasks tagged `time-sensitive` or for tasks in the `security` domain, the TTL is reduced to 4 hours. For tasks that are purely mechanical (e.g., "rename variable X to Y throughout codebase"), no cache check is needed because no external knowledge is required.

## Query Construction Templates by Task Type

The quality of research output depends heavily on query formulation. Generic queries produce generic answers; precise queries produce actionable guidance.

For API integration tasks, the query template is: "What is the [specific operation] API endpoint for [library/service], what are the required parameters, and what does the response body look like when [specific condition]?" Include the library version if known.

For architecture decision tasks, the query template is: "In a [tech stack] application, what are the trade-offs between [option A] and [option B] for [specific use case], considering [constraint 1] and [constraint 2]?"

For security tasks, the query template is: "What are the known vulnerabilities or recommended mitigations for [specific pattern or library version] as of [current year]?"

For performance tasks, the query template is: "What is the measured performance overhead of [specific approach] in [runtime/framework], and what is the recommended alternative when [threshold] is exceeded?"

For migration tasks, the query template is: "What breaking changes exist in [library] between version [X] and [Y], and what is the recommended migration path for [specific usage pattern]?"

## Research Brief Structure

Every completed research phase produces a research brief written to `research/{task-id}.md` in the project state directory. The brief follows a fixed structure so the autonomous loop can parse it predictably.

The **Task Summary** section restates the task title, its completion criteria, and the specific questions that motivated the research. This section serves as a sanity check — if the questions in the brief do not align with the task's completion criteria, the research was misdirected.

The **Codebase Findings** section documents what was found in the local repository: relevant files with their key contents, existing patterns that the task implementation must follow, and constraints imposed by the existing architecture. This section should be specific enough that an executor can open exactly the right files without a second scan.

The **Domain Knowledge** section documents what was learned from external sources. Each finding is attributed to its source (Perplexity / Context7 / Firecrawl) and annotated with confidence level (High / Medium / Low). Low-confidence findings should include the specific reason for uncertainty (e.g., "documentation for this version not found, extrapolated from v2.1 docs").

The **Recommended Approach** section translates findings into a concrete implementation plan. It names the specific files to create or modify, the specific functions or APIs to call, and the specific test strategy to apply. This section is directive — it does not present options unless a genuine decision point exists that requires human input.

The **Risks** section lists anything that could cause the task to fail or produce incorrect output. Risks are classified as Known (well-understood, with a mitigation) or Unknown (flagged for human attention before execution proceeds). A task with an Unknown risk should transition to BLOCKED status and surface the risk in the project's progress log before the autonomous loop attempts execution.

## Graceful Degradation When MCPs Are Unavailable

MCP availability is not guaranteed. When an external MCP tool call fails — whether due to network error, rate limiting, or configuration absence — the protocol degrades gracefully rather than halting.

If Perplexity is unavailable, the executor notes the gap in the research brief and proceeds with codebase findings plus general training knowledge, clearly marking any claims derived from training data (rather than live query) as `[training-data-derived]` to signal that they should be verified before the task is considered production-ready.

If Context7 is unavailable, the executor falls back to inspecting local `node_modules` type declaration files (`.d.ts`) if they exist, or uses Perplexity to answer library-specific questions. If neither is available, the task is flagged for human verification of any API signatures used.

If Firecrawl is unavailable, the specific URL is logged in the research brief under a "Manual Verification Required" subsection, and execution proceeds without that source. The task's completion criteria are not relaxed — but a note is appended indicating that the verification step at the end of execution should double-check the affected area.

When all external sources are unavailable, the executor completes the codebase scan, writes a partial brief marked `[DEGRADED - external sources unavailable]`, and proceeds to execution with reduced confidence. The task's actual_minutes field will include a note that external verification was skipped.
