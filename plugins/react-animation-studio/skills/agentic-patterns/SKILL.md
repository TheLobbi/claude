---
name: agentic-patterns
description: "Patterns from \"Agentic Design Patterns\" (Gulli & Sauco, 2025) applied to web animation composition, performance optimization, and multi-library orchestration for React and TypeScript."
---

# Agentic Design Patterns — React Animation Studio

> Patterns from "Agentic Design Patterns" (Gulli & Sauco, 2025) applied to web animation composition, performance optimization, and multi-library orchestration for React and TypeScript.

## Applied Patterns

### Prompt Chaining
**Relevance**: Complex animations are built in stages — concept → keyframe design → code generation → performance tuning → accessibility review. Each stage depends on the previous output.
**Current Implementation**: Individual commands (`/animate`, `/animate-sequence`, `/animate-transition`) handle discrete steps; users manually chain them.
**Enhancement**: Make the pipeline explicit: a single `/animate-compose` invocation triggers a typed chain — design intent → library selection → code generation → performance audit → a11y check. Each step receives the structured output of the prior step as its input context, enabling automatic course-correction (e.g., if performance audit fails, the code generation step is re-run with stricter constraints).

### Parallelization
**Relevance**: Generating multiple animation variants (e.g., three entrance effects, two hover states) is embarrassingly parallel — each variant is independent and can be rendered simultaneously.
**Current Implementation**: Variant generation is sequential; users run commands multiple times.
**Enhancement**: The `animate-preset` command spawns parallel generation tasks for each requested variant. Results are collected, ranked by a quality scorer, and presented together. Build times for multi-variant generation drop proportionally. Parallelization is also applied to multi-component animation audits — each component is analyzed concurrently.

### Reflection
**Relevance**: Generated animations may have subtle issues — janky frame rates, incorrect easing curves, inaccessible motion for users with vestibular disorders, or library API misuse.
**Current Implementation**: The `animate-audit` command provides a static analysis pass.
**Enhancement**: Add a self-review loop after every generation: the agent critiques its own output against a rubric (60fps target, reduced-motion support, bundle size impact, semantic correctness of the animation relative to the UI intent). If the score falls below threshold, the agent revises and re-checks before presenting the result. Users see only polished output.

### Planning
**Relevance**: Complex animation sequences (page transitions, orchestrated entrance flows, interactive 3D scenes) require a choreography plan before any code is written.
**Current Implementation**: `animate-sequence` accepts a list of steps but does not produce an explicit plan artifact.
**Enhancement**: For sequences with more than three steps or involving multiple libraries, generate a choreography document first: timeline, dependency graph (which animation must complete before the next begins), estimated total duration, and library assignments (Framer Motion for layout, GSAP for SVG, Three.js for 3D). The plan is shown to the user for confirmation before code generation.

### Tool Use
**Relevance**: The plugin wraps three animation libraries (Framer Motion, GSAP, Three.js) plus CSS animations, each with distinct APIs, performance characteristics, and React integration patterns.
**Current Implementation**: Commands target a specific library by convention (`animate-3d` → Three.js, `animate-scroll` → GSAP ScrollTrigger).
**Enhancement**: Treat each library as a typed tool with a declared capability surface. A tool-selection layer chooses the best library for the requested effect based on: performance budget, browser support requirements, existing project dependencies, and animation complexity. The selection is explained to the user. Tool-specific error messages are normalized into a common format.

### Routing
**Relevance**: Animation requests vary widely — micro-interactions need different handling than page transitions, which differ from 3D scenes. Routing the request to the right specialist pipeline avoids inappropriate library choices.
**Current Implementation**: Users must know which command to invoke for each animation type.
**Enhancement**: A classifier at the entry point (`/animate`) analyzes the request intent and routes to the appropriate sub-pipeline: `micro-interaction` → Framer Motion spring physics, `page-transition` → Framer Motion AnimatePresence, `scroll-narrative` → GSAP ScrollTrigger, `3d-scene` → Three.js, `svg-animation` → GSAP DrawSVG, `css-only` → pure CSS animations. The routing decision is shown, and users can override it.

### Resource-Aware
**Relevance**: Animations have real performance costs — bundle size (Three.js adds ~600KB), GPU layer promotion, main-thread JavaScript, and layout thrashing. Poor choices degrade UX.
**Current Implementation**: `animate-audit` checks for common performance issues after the fact.
**Enhancement**: Before generating code, assess the performance budget for the target context (mobile vs. desktop, low-end device profile, existing bundle size). Recommend the lightest adequate library. During generation, prefer `transform` and `opacity` over layout-triggering properties. After generation, output a performance scorecard: estimated JS cost, GPU layer count, and `will-change` recommendations. Flag anything that would drop frames on a mid-range mobile device.

## Pattern Interaction Map

```
User Request
    │
    ▼
Routing ──────────────────────────────────────────────────────┐
    │                                                          │
    ▼                                                          ▼
Planning (complex sequences) ──► Prompt Chaining         Resource-Aware
    │                                │                         │
    │                                ▼                         │
    │                           Tool Use ◄────────────────────┘
    │                                │
    │                                ▼
    │                      Parallelization (variants)
    │                                │
    │                                ▼
    └───────────────────────► Reflection (self-review)
                                     │
                                     ▼
                              Final Output (polished, scored)
```

**Key interactions**:
- **Routing → Planning**: Only complex routes (sequences, 3D scenes) trigger the planning step; simple micro-interactions skip it.
- **Tool Use + Resource-Aware**: Library selection is constrained by the performance budget computed by Resource-Aware.
- **Parallelization → Reflection**: All parallel variants pass through the same reflection rubric; only those scoring above threshold are surfaced.
- **Prompt Chaining ties it together**: The overall animation composition pipeline is a chain where each step's structured output is the next step's input, making the entire workflow resumable and auditable.

## References
- Gulli, A. & Sauco, M. (2025). *Agentic Design Patterns*.
- Repository: github.com/Mathews-Tom/Agentic-Design-Patterns
