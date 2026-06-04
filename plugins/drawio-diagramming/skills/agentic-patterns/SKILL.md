---
name: agentic-patterns
description: "Patterns from \"Agentic Design Patterns\" (Gulli & Sauco, 2025) applied to AI-powered diagram generation and multi-platform embedding"
---

# Agentic Design Patterns — draw.io Diagramming

> Patterns from "Agentic Design Patterns" (Gulli & Sauco, 2025) applied to AI-powered diagram generation and multi-platform embedding

## Applied Patterns

### Prompt Chaining
**Relevance**: Generating a high-quality draw.io diagram is a multi-stage pipeline — understanding intent, selecting diagram type, producing XML structure, applying styles, validating output, and embedding. Each stage feeds the next.
**Current Implementation**: Individual commands (`drawio:create`, `drawio:style`, `drawio:export`, `drawio:embed`) handle discrete steps. Users chain them manually.
**Enhancement**: Formalise a diagram generation chain: (1) intent extraction → extract entities, relationships, and domain from user input; (2) type selection → route to the correct diagram type from the 196-type catalog; (3) skeleton generation → produce minimal valid XML structure; (4) style application → apply theme and professional defaults; (5) quality critique → invoke the quality-critique skill; (6) export/embed → route to target platforms. Each step's output is the next step's input. Failed steps trigger targeted regeneration, not full restarts.

### Reflection
**Relevance**: AI-generated XML diagrams frequently contain layout collisions, missing connections, style inconsistencies, or structural errors that degrade diagram quality.
**Current Implementation**: The `quality-critique` skill exists in `skills/quality-critique/SKILL.md` and provides post-generation analysis.
**Enhancement**: Embed reflection as an automatic loop within diagram generation, not a separate manual step. After initial XML generation, a reflection agent scores the diagram on five axes — completeness, layout clarity, style consistency, semantic accuracy, and platform compatibility — and produces a structured critique. The generator incorporates the critique and regenerates targeted sections. Allow up to three reflection passes before delivering the final diagram. Surface the final quality score to the user.

### Planning
**Relevance**: Complex diagrams (C4 architecture, network topology, BPMN processes) require upfront layout strategy to avoid crowded, unreadable output. Ad hoc generation produces poor spatial organisation.
**Current Implementation**: The diagram-architect agent uses domain knowledge to guide structure, but planning is implicit and embedded in the prompt.
**Enhancement**: Add an explicit planning phase before XML generation. The planning agent produces: (1) a layer plan (which semantic layers will be created); (2) a spatial grid (rough coordinates for major element groups); (3) a connection manifest (all edges with source, target, and label); (4) a style plan (colour theme, shape families, font sizes). The XML generator then fills in this plan rather than generating freely, producing more predictable and maintainable output.

### Tool Use
**Relevance**: Diagram generation requires coordinated use of multiple tools: code analysis tools (Grep, Glob, Read) to discover architecture facts, XML validation tools, MCP diagram servers for live editing, and embedding tools for each target platform.
**Current Implementation**: Commands invoke the appropriate tools within their scope. The MCP server integration (`drawio:mcp-setup`) enables programmatic diagram operations.
**Enhancement**: Define a tool manifest for diagram generation that explicitly maps diagram phases to tool sets. Code-analysis tools are called during the intent-extraction phase; XML tools during generation and validation; MCP tools during live-editing sessions; platform-specific export tools during embedding. Agents should declare their tool intent before calling, enabling tool-use logging and rate limiting for expensive operations (e.g., Firecrawl calls during enrichment).

### Routing
**Relevance**: The plugin supports 196 diagram types across 20+ domains. Selecting the wrong type for a given context produces a diagram that fails to communicate its intent.
**Current Implementation**: The `drawio:auto-diagram` command uses heuristics to select diagram type. The CLAUDE.md routing table maps contexts to types.
**Enhancement**: Implement a diagram-type routing agent that scores multiple candidate diagram types for the given input using weighted criteria: domain fit, entity count, relationship density, target audience, and platform constraints. Present the top-3 candidates with rationale before generating, allowing the user to confirm or redirect. Store routing decisions in a session log to improve future routing.

### Parallelization
**Relevance**: Multi-format export (SVG, PNG, PDF, `.drawio.svg`) and multi-platform embedding (GitHub, Confluence, Azure DevOps, Notion, Teams, Harness) are independent operations that do not need to be sequential.
**Current Implementation**: `drawio:export` and `drawio:batch` handle multiple outputs but execute sequentially.
**Enhancement**: Parallelise export and embedding operations. After a diagram is finalised, spawn parallel export workers — one per output format — and parallel embedding workers — one per target platform. A merge agent collects results, surfaces any per-platform failures without blocking others, and produces a summary manifest of all exported artefacts with their paths and embedding snippets.

### Resource-Aware
**Relevance**: Very large diagrams (200+ nodes, complex C4 systems, full enterprise architecture maps) can produce XML files that are expensive to process, slow to render in draw.io, and difficult to read without progressive disclosure.
**Current Implementation**: No resource budgeting exists. Complex diagrams are generated at full fidelity regardless of output size.
**Enhancement**: Implement resource-aware diagram generation with three complexity tiers: (1) standard — up to 50 nodes, full fidelity; (2) simplified — 51–150 nodes, group related elements into containers with expandable child diagrams; (3) summary — 151+ nodes, generate a high-level overview diagram with links to per-domain detail diagrams. Estimate output size from the planning phase and select the appropriate tier automatically. Warn the user when dropping to a lower tier and offer to generate detail pages on demand.

## Pattern Interaction Map

```
User Intent / Source Code / Description
        │
        ▼
   [ROUTING] ──── select diagram type from 196-type catalog
        │
        ▼
   [PLANNING] ──── layer plan + spatial grid + connection manifest
        │
        ├─ Check entity count ──► [RESOURCE-AWARE] ──► tier selection
        │
        ▼
   [TOOL USE] ──── code analysis / MCP server / XML tools
        │
        ▼
   XML Generation
        │
        ▼
   [REFLECTION] ──── quality critique (up to 3 passes)
        │
        ▼
   Final Diagram XML
        │
        ▼
   [PARALLELIZATION] ──── concurrent export + platform embedding
        │
        ▼
   [PROMPT CHAINING] ties all stages together as a managed pipeline
```

Key interactions:
- **Prompt Chaining** is the meta-pattern that sequences all others into a coherent pipeline.
- **Planning + Resource-Aware**: The planning phase determines entity count, triggering tier selection before any XML is generated.
- **Routing + Planning**: Routing determines the diagram type, which constrains the planning agent's spatial and layer choices.
- **Tool Use + Reflection**: Reflection may trigger additional Tool Use calls (re-reading source code) to validate that the diagram accurately reflects the codebase.
- **Parallelization** is the terminal stage, running only after Reflection has approved the diagram quality.

## References
- Gulli, A. & Sauco, M. (2025). *Agentic Design Patterns*. O'Reilly Media.
- Repository: github.com/Mathews-Tom/Agentic-Design-Patterns
- draw.io / diagrams.net: https://www.diagrams.net
- draw.io XML Reference: https://jgraph.github.io/mxgraph/docs/js-api/files/model/mxCell-js.html
