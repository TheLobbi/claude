---
name: agentic-patterns
description: "Patterns from \"Agentic Design Patterns\" (Gulli & Sauco, 2025) applied to plugin marketplace orchestration and agent-as-tool composition"
---

# Agentic Design Patterns — Cowork Marketplace

> Patterns from "Agentic Design Patterns" (Gulli & Sauco, 2025) applied to plugin marketplace orchestration and agent-as-tool composition

## Applied Patterns

### Routing (Plugin Selection)
**Relevance**: When a user describes a need ("I need to automate my Kubernetes deployments"), the marketplace must route that intent to the correct plugin, bundle, or collection — not just keyword-match, but understand the semantic fit.
**Current Implementation**: The `/browse` and `/details` commands surface relevant items from the 18-item catalog and 9 bundles, with the `marketplace-curator` agent making recommendations based on user needs.
**Enhancement**: Apply intent-based hierarchical routing — a router agent classifies the user's need by domain, complexity, and integration requirements, then queries the catalog with structured filters. Ambiguous intents trigger clarifying questions before routing rather than defaulting to the highest-download item.

### Agent-to-Agent (A2A) Communication
**Relevance**: When a cowork session spans multiple installed plugins (e.g., a Jira-to-PR workflow using both the jira-orchestrator and deployment-pipeline plugins), agents from different plugins must coordinate without manual handoffs.
**Current Implementation**: The `session-orchestrator` agent coordinates multi-agent cowork sessions, bridging agents across installed plugins during `/launch` sessions.
**Enhancement**: Apply formal A2A messaging with typed interfaces — each plugin exposes an agent capability manifest listing what requests its agents can fulfill and what they produce. The session orchestrator uses these manifests to build inter-plugin communication graphs, routing messages via structured contracts rather than free-form prompt delegation.

### Resource-Aware (Bundle Optimization)
**Relevance**: Bundles merge multiple plugins into a single distributable — the merge must be intelligent about deduplicating shared skills, resolving agent name conflicts, and staying within context budget limits.
**Current Implementation**: The `/bundle-export` command merges plugin assets (commands, agents, skills) into a unified Cowork-compatible ZIP, tracking merged totals across component plugins.
**Enhancement**: Apply resource-aware optimization — the bundle builder profiles each component plugin's context footprint (token cost per skill, agent overlap) and produces a merged manifest that minimizes redundancy. Users receive a resource report showing context savings from deduplication and warnings when a bundle exceeds recommended context limits.

### Exploration (Marketplace Discovery)
**Relevance**: Users often don't know exactly what plugin they need — discovery requires guided exploration, not just search.
**Current Implementation**: The `/collections` command surfaces 10 curated domain collections, and `/browse` supports search across catalog items, enabling structured exploration of the 18-item catalog.
**Enhancement**: Apply the exploration pattern with progressive disclosure — start with broad collection browsing, surface related items as the user narrows focus, and present "users who installed X also use Y" recommendations. Each exploration step remembers context so the session builds a model of the user's needs and pre-filters subsequent suggestions.

### Memory (Install and Usage Tracking)
**Relevance**: A marketplace that doesn't remember what you've installed, what sessions you've run, and what worked well offers no personalization value.
**Current Implementation**: The `/install` and `/update` commands manage plugin state, and the `/stats` command reflects the current state of the ecosystem including installed items.
**Enhancement**: Implement usage memory with preference inference — track which installed items are actively used, which are dormant, and what session patterns correlate with satisfaction. Surface proactive upgrade and cleanup suggestions based on usage history, and use preference data to personalize future browse and recommend outputs.

### Guardrails (Plugin Safety Validation)
**Relevance**: A marketplace is a potential attack surface — malformed plugins, overly permissive agents, or conflicting hook configurations can destabilize the Claude Code environment.
**Current Implementation**: Plugin trust scores are surfaced in `/details`, helping users evaluate safety before installation.
**Enhancement**: Apply formal guardrails at install time — a validation pipeline checks each plugin against a safety ruleset: manifest schema conformance, hook script safety (no shell injection vectors), agent permission scope (no unauthorized tool access), and conflict detection against already-installed plugins. Installation is blocked for critical violations and warned for advisory findings, with remediation guidance provided.

### Tool Use (Plugins as Tools)
**Relevance**: Individual plugin commands and skills are fundamentally tools that agents can invoke — making this explicit enables higher-order compositions where agents assemble multi-tool workflows on the fly.
**Current Implementation**: Installed plugins expose commands and agents that the `session-orchestrator` coordinates during `/launch` sessions, effectively treating plugin capabilities as callable tools within a cowork session.
**Enhancement**: Apply the tool-use pattern formally — generate a structured tool registry from all installed plugins at session start, with typed signatures, descriptions, and usage examples for each command. Agent system prompts include the relevant tool subset, enabling agents to autonomously compose multi-plugin workflows without pre-scripted orchestration logic.

## Pattern Interaction Map

```
Exploration ──────► Routing ──────────────────► Memory
     │                 │                           │
     │                 ▼                           ▼
     │           Guardrails ◄──── Install ──────► Tool Use
     │           (Validation)                      │
     │                                             ▼
     └─────────────────────────────► A2A ◄── Resource-Aware
                                 (Sessions)   (Bundle Optimize)
```

**Flow**: Users discover plugins through Exploration, guided by Memory-personalized recommendations. Routing matches intent to catalog items. Guardrails validate plugins at install time before they enter the Tool Use registry. Installed plugins become tools that A2A messaging connects across sessions. Bundle exports are optimized for resource efficiency. Usage outcomes feed back into Memory, personalizing the next discovery cycle.

## References
- Gulli, A. & Sauco, M. (2025). Agentic Design Patterns.
- Repository: github.com/Mathews-Tom/Agentic-Design-Patterns
