---
name: agentic-patterns
description: "Patterns from \"Agentic Design Patterns\" (Gulli & Sauco, 2025) applied to design token management, component scaffolding, multi-tenant theming, and accessibility-compliant UI generation."
---

# Agentic Design Patterns — Frontend Design System

> Patterns from "Agentic Design Patterns" (Gulli & Sauco, 2025) applied to design token management, component scaffolding, multi-tenant theming, and accessibility-compliant UI generation.

## Applied Patterns

### Prompt Chaining
**Relevance**: A design token pipeline runs in ordered stages — brand input → token generation → CSS custom property output → component theming → Keycloak theme export. Each stage's output is the next stage's input.
**Current Implementation**: The `tokens`, `theme`, and `keycloak` commands are invoked separately; the user manually carries context between them.
**Enhancement**: Formalize a `/design-pipeline` chain: brand specification → design token generation → CSS variable compilation → component style injection → Keycloak realm export → accessibility validation. Each step receives a structured token manifest from the prior step. If accessibility validation fails, the chain backtracks to the token generation step with constraint annotations (minimum contrast ratios, required focus indicator sizes).

### Routing
**Relevance**: Design requests span distinct domains — color palette generation, component scaffolding, Keycloak theme customization, style conversion (CSS to Tailwind, Tailwind to CSS variables). Each domain requires a different specialist pipeline.
**Current Implementation**: Users invoke domain-specific commands directly (`/palette`, `/component`, `/keycloak`, `/convert`).
**Enhancement**: Add a natural-language entry point that classifies intent and routes: `"create a dark theme"` → palette + theme pipeline; `"build a card component"` → component scaffolding with design token injection; `"white-label for client X"` → multi-tenant token fork + Keycloak realm; `"check accessibility"` → audit pipeline. The routing decision is explained, and users can override to a specific command.

### Reflection
**Relevance**: Generated design systems can have subtle inconsistencies — token naming that breaks conventions, components that use hard-coded colors instead of tokens, or Keycloak themes that don't match the parent design system.
**Current Implementation**: The `audit` command provides a static consistency check.
**Enhancement**: Add a self-review step after every generation: the agent compares its output against the design system's own declared rules (naming conventions, token usage mandates, spacing scale conformance). If violations are found, the agent corrects them and re-checks before presenting. The audit command becomes a standalone invocation of this reflection step.

### Planning
**Relevance**: Building a design system from scratch — or migrating an existing codebase to a new system — requires an architecture plan: token taxonomy, component hierarchy, theming layers, Keycloak integration points.
**Current Implementation**: No explicit planning phase exists; design systems are built incrementally by command.
**Enhancement**: For new design system initialization or large-scale migrations, generate a design system architecture document first: token categories, naming conventions, component inventory, theming strategy (CSS variables vs. Tailwind config vs. CSS-in-JS), and Keycloak realm mapping. The plan is reviewed before any files are generated. Scope changes after planning require plan amendment, not ad-hoc additions.

### Tool Use
**Relevance**: CSS generation, Tailwind config synthesis, Keycloak theme packaging, and component scaffolding are distinct tool operations with different inputs, outputs, and failure modes.
**Current Implementation**: Each command internally calls its relevant generation logic; errors are surfaced as raw output.
**Enhancement**: Define each generator as a typed tool: `css-generator` (input: token manifest, output: CSS file), `tailwind-synthesizer` (input: token manifest, output: tailwind.config.js), `keycloak-packager` (input: theme manifest, output: JAR/directory), `component-scaffolder` (input: spec, output: TSX + story + test). Tools are composable — the palette command can feed directly into the CSS generator without manual file handoff.

### Memory
**Relevance**: Design preferences accumulate over time — a user's preferred color palette, their component naming conventions, their Keycloak realm structure. Re-asking for these on every session creates friction.
**Current Implementation**: No persistent memory of design preferences; each session starts fresh.
**Enhancement**: After each design session, persist key decisions to a project-scoped design memory: brand colors, typography scale, spacing system, active Keycloak realm IDs, preferred CSS methodology. On next invocation, design commands load this memory as default context. Users can inspect and edit stored preferences via `/tokens --memory`. This makes the system feel like it knows the project.

### Parallelization
**Relevance**: Multi-tenant systems require generating multiple theme variants simultaneously — each tenant has a distinct color palette but shares the same component structure. These are independent and can be generated in parallel.
**Current Implementation**: Theme generation is sequential; generating 5 tenant themes requires 5 sequential command invocations.
**Enhancement**: The `theme` command accepts a `--tenants` flag that triggers parallel generation: one worker per tenant, each applying tenant-specific overrides to the shared token base. Results are collected and validated together. Inconsistencies across tenants (e.g., a shared component that works for tenant A but fails contrast for tenant B) are surfaced in a unified report.

### Guardrails
**Relevance**: Accessibility is non-negotiable — WCAG 2.1 AA compliance requires minimum contrast ratios (4.5:1 for body text, 3:1 for large text), focus indicators, and color-independent information encoding. Generated designs must not ship inaccessible UI.
**Current Implementation**: The `audit` command checks accessibility after generation; violations require manual fixes.
**Enhancement**: Embed accessibility guardrails at the generation step, not the audit step. The CSS generator refuses to emit color combinations that fail WCAG AA contrast. The component scaffolder always includes visible focus styles. The Keycloak theme packager validates that all form fields have associated labels. Guardrail violations block output with a specific, actionable error (not just a warning). Override requires an explicit `--allow-inaccessible` flag with a documented justification.

## Pattern Interaction Map

```
User Request
    │
    ▼
Routing ──────────────────────────────────────────┐
    │                                              │
    ▼                                              ▼
Planning (new systems / migrations)           Memory (load prefs)
    │                                              │
    ▼                                              ▼
Prompt Chaining ──────────────────────────► Tool Use
    │                                              │
    │                                         Guardrails
    │                                         (a11y gate)
    │                                              │
    ▼                                              ▼
Parallelization (multi-tenant) ◄──────────── Reflection
    │                                              │
    └──────────────────────────────────────────────┘
                        │
                        ▼
              Final Output + Memory Update
```

**Key interactions**:
- **Routing → Planning**: Only new system initialization or migration requests trigger the planning phase; incremental changes skip it.
- **Memory → Prompt Chaining**: Stored design preferences are injected at the start of the chain, so token generation knows the brand baseline without re-asking.
- **Guardrails gate Tool Use**: The CSS generator and component scaffolder cannot emit inaccessible output; guardrails are enforced at the tool boundary, not as a post-hoc check.
- **Parallelization → Reflection**: Each parallel tenant theme variant is individually reflected upon; only cross-tenant inconsistencies require human resolution.
- **Memory is updated at the end**: After a successful pipeline run, new decisions (new brand color, new component naming convention) are persisted, continuously enriching the project's design memory.

## References
- Gulli, A. & Sauco, M. (2025). *Agentic Design Patterns*.
- Repository: github.com/Mathews-Tom/Agentic-Design-Patterns
