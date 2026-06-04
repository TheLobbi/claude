---
name: agentic-patterns
description: "Patterns from \"Agentic Design Patterns\" (Gulli & Sauco, 2025) applied to universal project templating and scaffold automation"
---

# Agentic Design Patterns — Claude Code Templating Plugin

> Patterns from "Agentic Design Patterns" (Gulli & Sauco, 2025) applied to universal project templating and scaffold automation

## Applied Patterns

### Prompt Chaining
**Relevance**: Template generation is inherently sequential — detect format, resolve variables, validate structure, render output, post-process.
**Current Implementation**: Each command (`/template`, `/scaffold`, `/generate`) runs a discrete step before passing results to the next stage.
**Enhancement**: Formalize the chain as an explicit pipeline with typed handoff contracts between stages. Each step validates its output schema before forwarding, enabling early-exit on malformed templates without wasting downstream tool calls.

### Planning
**Relevance**: Project scaffolding requires upfront decomposition — which directories to create, which files to render, which post-install hooks to run, in what order.
**Current Implementation**: The `scaffold-agent` determines structure from template metadata at runtime.
**Enhancement**: Generate a structured scaffold plan (JSON manifest of operations) before any file is written. Present the plan for review when `--dry-run` is passed. This separates intent from execution and allows partial rollback on failure.

### Tool Use
**Relevance**: The plugin wraps five distinct templating engines (Handlebars, Cookiecutter, Copier, Maven Archetype, Harness YAML) and MCP servers (harness, scaffold, github).
**Current Implementation**: Agents call the appropriate MCP tool based on detected template format.
**Enhancement**: Apply structured tool-selection reasoning — log which tool was chosen and why, surface tool errors as typed exceptions rather than raw strings, and retry with fallback tools when the primary engine is unavailable.

### Routing
**Relevance**: Incoming template requests must be dispatched to the correct engine, agent, or MCP server based on format detection.
**Current Implementation**: Format detection is implicit inside each command handler.
**Enhancement**: Introduce an explicit routing layer that inspects the request (file extension, config file presence, explicit `--engine` flag) and returns a structured `{ engine, agent, mcp }` routing decision before any work begins. Makes routing testable and auditable.

### Reflection
**Relevance**: Generated templates and scaffolded projects should be validated for correctness, completeness, and security before delivery.
**Current Implementation**: The `testing-agent` generates tests post-scaffold but does not feed results back into the scaffold itself.
**Enhancement**: After scaffold completion, run a lightweight reflection pass: check for placeholder variables left unresolved, verify required files exist, scan for secrets accidentally included in templates. Feed failures back as a correction loop before surfacing output to the user.

### Multi-Agent
**Relevance**: Five specialized agents (harness-expert, scaffold-agent, codegen-agent, database-agent, testing-agent) handle distinct domains.
**Current Implementation**: Agents are invoked sequentially based on command context.
**Enhancement**: Enable parallel agent execution for independent sub-tasks (e.g., codegen-agent and database-agent run concurrently during a full-stack scaffold). Use a lightweight coordinator to merge outputs and resolve conflicts (e.g., overlapping file paths).

### Memory
**Relevance**: Users repeatedly scaffold similar project types with the same variable overrides and engine preferences.
**Current Implementation**: No cross-session preference persistence.
**Enhancement**: Persist template preferences, variable defaults, and engine choices per project/repo. On subsequent invocations, pre-populate variable prompts with remembered values and surface the most recently used templates first.

### Guardrails
**Relevance**: Template rendering can produce unsafe output — credentials in generated files, insecure default configs, path traversal via template variables.
**Current Implementation**: No systematic safety checks on rendered output.
**Enhancement**: Add a post-render guardrail pass that scans for: hardcoded secrets patterns, world-writable file permissions in scaffold scripts, `../` path traversal in template variable substitutions, and Harness pipeline stages that disable required approval gates. Block or warn before writing to disk.

## Pattern Interaction Map

```
User Request
     │
     ▼
[Routing] ──────────────────────────────────────────┐
     │ engine/agent/mcp decision                     │
     ▼                                               │
[Planning] ── scaffold manifest ──────────┐          │
     │                                   │          │
     ▼                                   ▼          │
[Prompt Chaining]                    [Memory]       │
  detect → resolve → render           recall prefs  │
     │                                   │          │
     ▼                                   ▼          │
[Tool Use] ─── Handlebars/Cookiecutter/Copier/Maven/Harness
     │
     ▼
[Multi-Agent] ── scaffold-agent + codegen-agent + database-agent (parallel)
     │                │                    │
     └────────────────┘                    │
              │                            │
              ▼                            │
[Reflection] ── validate output ◄──────────┘
     │
     ▼
[Guardrails] ── security/safety scan
     │
     ▼
Delivered Output + Memory update
```

## References
- Gulli, A. & Sauco, M. (2025). Agentic Design Patterns.
- Repository: github.com/Mathews-Tom/Agentic-Design-Patterns
