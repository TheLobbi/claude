---
name: agentic-patterns
description: "Patterns from \"Agentic Design Patterns\" (Gulli & Sauco, 2025) applied to plugin marketplace architecture — federated registry, supply chain security, intent-based composition, and trust-scored plugin discovery."
---

# Agentic Design Patterns — Marketplace Pro

> Patterns from "Agentic Design Patterns" (Gulli & Sauco, 2025) applied to plugin marketplace architecture — federated registry, supply chain security, intent-based composition, and trust-scored plugin discovery.

## Applied Patterns

### 1. A2A Communication
**Relevance**: The federated registry protocol requires peer marketplaces to communicate — sharing plugin manifests, trust scores, and capability indexes — without a central authority.
**Current Implementation**: The federation module implements a federated registry protocol where peer nodes exchange plugin metadata. The composition engine uses A2A-style capability negotiation to assemble multi-plugin workflows.
**Enhancement**: Formalize the A2A message schema: `{ from: registryId, to: registryId|'broadcast', type: 'announce'|'query'|'trust-update'|'revoke', payload, signature }`. All federation messages are signed with the originating registry's key and logged to an append-only audit ledger. Revocation messages propagate to all peers within a TTL window.

### 2. Routing
**Relevance**: When a user expresses an intent ("I need to analyze my Jira backlog and generate a report"), the marketplace must decompose the intent and route each sub-need to the best-matching installed plugin or composition.
**Current Implementation**: Intent-based composition is a core feature — the composition engine parses user intent and maps it to plugin capability graphs. The `byTrigger` index in the registry enables fast trigger-based routing.
**Enhancement**: Build a two-stage router: (1) Intent Classifier extracts structured `{ primaryIntent, subIntents[], requiredCapabilities[] }` from natural language; (2) Capability Matcher scores each installed plugin against required capabilities using semantic similarity. Return a ranked list of plugin compositions rather than a single match.

### 3. Guardrails
**Relevance**: Plugin supply chain attacks (malicious code in dependencies, hijacked publisher accounts, typosquatting) are existential threats to a marketplace. Every install must be validated.
**Current Implementation**: Supply chain security includes lockfile management, trust scoring, sandboxing, and a policy engine. The security-guard hook validates plugin operations. SBOM generation tracks all dependencies.
**Enhancement**: Implement a multi-layer Guardrail pipeline: (1) Static analysis of plugin manifest for suspicious capability requests; (2) Dependency graph check against known-vulnerable package database; (3) Behavioral sandbox that executes hooks in isolation and flags unexpected system calls; (4) Publisher trust verification via signature chain. Any layer failure blocks install and logs to the audit trail.

### 4. Resource-Aware Optimization (Trust Scoring)
**Relevance**: Trust is a scarce resource — a marketplace with 0% trusted plugins is unusable; one with 100% unverified plugins is dangerous. Scoring must balance security rigor against plugin availability.
**Current Implementation**: Trust scoring assigns numeric scores based on publisher verification, download counts, community reviews, and dependency health. The trust-engine module implements the scoring algorithm.
**Enhancement**: Model trust as a multi-dimensional resource vector: `{ publisherTrust, codeIntegrity, dependencyHealth, communityReputation, behavioralScore }`. Each dimension has an independent score and weight. Users set minimum thresholds per dimension. The optimizer finds the plugin composition that maximizes capability coverage while staying above all trust thresholds.

### 5. Exploration
**Relevance**: Plugin discovery — finding the right plugin when you don't know it exists — requires structured exploration of the registry rather than exact-match search.
**Current Implementation**: The DevStudio hot-reload environment enables rapid plugin exploration during development. The contextual intelligence module suggests plugins based on current project context.
**Enhancement**: Implement a guided exploration agent that uses the Explore-Exploit pattern: (1) Explore phase — retrieve semantically similar plugins the user hasn't tried, with diversity sampling to avoid filter bubbles; (2) Exploit phase — surface the user's top-performing installed plugins for the detected intent. Track exploration history to avoid re-recommending rejected plugins.

### 6. Memory
**Relevance**: Installation history, user preferences, plugin performance metrics, and composition patterns should inform future recommendations — but this state must survive sessions.
**Current Implementation**: Plugin installation state is persisted in `plugins.index.json`. The registry tracks installed versions and install timestamps. The lockfile records the exact dependency tree at install time.
**Enhancement**: Build a structured Memory layer with three tiers: (1) Installation Memory — full history of installs, removals, and updates with timestamps and triggers; (2) Performance Memory — per-plugin latency, error rate, and user satisfaction scores aggregated over time; (3) Composition Memory — successful plugin combinations that solved specific user intents, retrievable by intent similarity. Use this memory to pre-rank search results for returning users.

### 7. Evaluation
**Relevance**: Plugin quality degrades — maintainers go inactive, dependencies develop vulnerabilities, APIs break. The marketplace must continuously evaluate installed plugins and surface degradation.
**Current Implementation**: Quality scoring is referenced in the composition engine. Trust scores incorporate community reviews. The dev-studio provides real-time validation during development.
**Enhancement**: Implement a continuous Evaluation agent that runs on a schedule: (1) Checks each installed plugin's dependencies for new CVEs; (2) Validates that plugin hooks still produce expected outputs via smoke tests; (3) Compares the plugin's current trust score against its score at install time; (4) Emits `{ plugin, evaluationDate, status: 'healthy'|'degraded'|'critical', findings[] }` events that surface in the `/plugin-list` dashboard with color-coded health indicators.

## Pattern Interaction Map

```
User Intent / Plugin Request
           │
           ▼
       [Routing] ←────────────────── [Memory (past compositions)]
           │                                    │
           ▼                                    │
  [Exploration] ──────────────────────────────► │
           │                                    │
           ▼                                    │
    [Guardrails] ──→ BLOCK (if violation)       │
           │                                    │
           ▼                                    │
  [Trust Scoring /                              │
   Resource-Aware                               │
   Optimization] ──→ THRESHOLD FAIL            │
           │                                    │
           ▼                                    │
    [A2A Communication] ←── Federated Peers     │
    (fetch from peer registry if local miss)    │
           │                                    │
           ▼                                    │
     [Evaluation] ──→ Quality Score             │
           │                                    │
           ▼                                    │
     Install / Compose ──────────────────────── ┘
           │                        ↑
           └──── [Memory] ──────────┘
                 (record outcome)
```

### Key Synergies
- **Routing + Memory**: Past successful compositions short-circuit intent resolution
- **Guardrails + Trust Scoring**: Guardrails enforce binary pass/fail; trust scoring provides a continuous quality signal above the guardrail floor
- **Exploration + Evaluation**: Exploration surfaces candidates; evaluation ranks them by quality and health
- **A2A + Memory**: Federated discovery results are cached in memory so subsequent requests avoid network round-trips
- **Evaluation + Guardrails**: Evaluation results can trigger automatic quarantine (a guardrail action) for critically degraded plugins

## Marketplace-Specific Pattern Extensions

### Supply Chain Trust Chain (Guardrails + A2A)
A specialized combination for the marketplace domain: every plugin in the federation carries a chain of trust attestations from publisher → registry → peer-registry. The guardrail layer validates this chain before allowing any plugin to execute. If any link in the chain is revoked (via A2A revocation message), the guardrail automatically quarantines the plugin across all peer registries.

### Capability Coverage Optimization (Routing + Resource-Aware Optimization)
When no single plugin covers all required capabilities, the composition engine applies a set-cover optimization: find the minimum set of plugins whose combined capabilities satisfy the intent, while maximizing trust score and minimizing resource overhead (install size, permission scope).

### Cold-Start Discovery (Exploration + Memory)
For new users with no installation history, the Exploration agent falls back to community-aggregate Memory: trending compositions among users with similar project fingerprints (detected from CLAUDE.md content and file structure). This provides personalized recommendations without requiring individual history.

## Quick Reference: Pattern → Feature Mapping

| Pattern | Feature | Implementation |
|---------|---------|----------------|
| A2A Communication | Federated Registry Protocol | `src/federation/registry.ts` |
| Routing | Intent-Based Composition | `src/composition/engine.ts` |
| Guardrails | Supply Chain Security | `src/security/`, hooks/security-guard |
| Resource-Aware Optimization | Trust Scoring | `src/trust/trust-engine.ts` |
| Exploration | Plugin Discovery | `src/intelligence/`, DevStudio |
| Memory | Install History + Perf Metrics | `plugins.index.json`, lockfile |
| Evaluation | Quality Scoring | `src/devstudio/`, trust-engine |

## References
- Gulli, A. & Sauco, M. (2025). *Agentic Design Patterns*. O'Reilly Media.
- Repository: github.com/Mathews-Tom/Agentic-Design-Patterns
- SLSA Supply Chain Framework: slsa.dev
- Sigstore Signing: sigstore.dev
- Related Skills: Supply Chain Security, Federated Registry, Plugin Composition
