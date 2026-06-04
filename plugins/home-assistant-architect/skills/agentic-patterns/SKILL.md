---
name: agentic-patterns
description: "Patterns from \"Agentic Design Patterns\" (Gulli & Sauco, 2025) applied to smart home automation and IoT orchestration"
---

# Agentic Design Patterns — Home Assistant Architect

> Patterns from "Agentic Design Patterns" (Gulli & Sauco, 2025) applied to smart home automation and IoT orchestration

## Applied Patterns

### Tool Use
**Relevance**: Home Assistant exposes a rich REST/WebSocket API surface — lights, thermostats, media players, locks, cameras, and hundreds of integrations all require precise tool invocations.
**Current Implementation**: Commands like `ha-control`, `ha-sensor`, and `ha-mcp` already issue direct API calls to HA's `/api/services`, `/api/states`, and `/api/events` endpoints.
**Enhancement**: Formalise a tool registry that maps device domains (light, climate, cover, alarm_control_panel) to their allowed service calls with typed parameters. Agents should select tools from this registry rather than constructing raw API paths, enabling safe service discovery and preventing invalid call combinations.

### Routing
**Relevance**: Automation triggers arrive from many sources — time schedules, state changes, Zigbee events, webhook callbacks, and voice commands — each requiring a different response pipeline.
**Current Implementation**: `ha-automation` creates automations with trigger/condition/action blocks. Routing logic lives inside individual YAML automations.
**Enhancement**: Implement a trigger-routing agent that classifies incoming events by domain (presence, energy, security, comfort, maintenance) and dispatches them to the correct specialist sub-agent or automation group. Add confidence scoring so ambiguous triggers fall through to a human-review queue.

### Planning
**Relevance**: Smart home configuration is inherently multi-step: discover devices → group by room/domain → create automations → set schedules → validate dependencies → deploy.
**Current Implementation**: `ha-deploy` handles deployment sequencing. Individual commands handle discrete configuration tasks.
**Enhancement**: Add a planning agent that generates a full configuration plan before any changes are applied. The plan should enumerate all entities affected, order steps by dependency (e.g., helpers must exist before automations that reference them), and produce a diff preview. Use a scratchpad for intermediate reasoning before committing the plan.

### Exception Handling
**Relevance**: IoT devices fail silently — sensors go unavailable, integrations time out, firmware updates break entity IDs. Unhandled exceptions cascade into broken automations.
**Current Implementation**: Basic error reporting exists in deployment commands. Device unavailability is not systematically handled.
**Enhancement**: Wrap all device API calls in a structured exception handler with three tiers: (1) transient — retry with exponential back-off; (2) recoverable — switch to fallback device or mode; (3) fatal — notify owner and disable dependent automations gracefully. Log all exceptions with entity_id, service, and timestamp for post-mortem analysis.

### Memory
**Relevance**: Device state is inherently temporal. Automations need awareness of recent history (was the front door opened in the last 10 minutes?) not just current state.
**Current Implementation**: HA's own recorder integration persists history. Agent context does not leverage this history beyond the current request.
**Enhancement**: Implement a state-memory layer that maintains a rolling window of significant state transitions per entity, occupancy patterns by time-of-day, and anomaly baselines. Agents query this memory before making decisions — e.g., "lights usually on at 18:00 → investigate why they are off today."

### Guardrails
**Relevance**: Home automation mistakes can be dangerous: unlocking doors at the wrong time, disabling smoke alarm bypass, overriding HVAC safety limits.
**Current Implementation**: No programmatic safety constraints exist beyond what individual automations enforce.
**Enhancement**: Define a guardrail policy layer that intercepts all service calls before execution. Policies include: never unlock exterior doors without presence confirmation, never disable security entities between 22:00–06:00, cap climate setpoints at configurable safety bounds, require dual confirmation for alarm-related services. Guardrails run as a pre-execution hook and can block or escalate calls.

### Human-in-the-Loop (HITL)
**Relevance**: Some home control actions — firmware updates, security mode changes, guest access grants — warrant explicit human approval before execution.
**Current Implementation**: `ha-deploy` includes a dry-run preview, but there is no interactive approval gate.
**Enhancement**: Add a HITL checkpoint for high-impact actions. The agent pauses, renders a human-readable action summary (affected entities, expected outcome, rollback plan), and waits for explicit approval via HA's persistent_notification integration or a companion app notification before proceeding.

### Parallelization
**Relevance**: Many home automation tasks are independent: turning off all lights in different rooms, polling sensors across areas, or running diagnostics on multiple integrations simultaneously.
**Current Implementation**: Commands execute sequentially. `ha-control` can issue a single service call at a time.
**Enhancement**: Introduce a parallel execution engine that groups non-conflicting service calls by domain and fires them concurrently using HA's `/api/services` batch endpoint or simultaneous async calls. Include a merge step that collects results and surfaces any per-device failures without blocking the overall action.

### Learning
**Relevance**: Optimal home automation rules are highly personal and shift with seasons, household routines, and lifestyle changes. Static rules degrade in quality over time.
**Current Implementation**: Automations are static YAML once deployed. No feedback loop exists.
**Enhancement**: Implement a learning loop that tracks manual overrides (user manually turns off what an automation turned on) as negative signals and automation outcomes (comfort sensor satisfied after climate adjustment) as positive signals. Periodically surface suggested automation adjustments for human review. Over time, time-based triggers self-calibrate to observed occupancy patterns.

## Pattern Interaction Map

```
User Request / External Event
        │
        ▼
   [ROUTING] ──── classify trigger by domain
        │
        ├─ Security domain ──► [GUARDRAILS] ──► [HITL] ──► Tool Use
        │
        ├─ Comfort / Energy ──► [PLANNING] ──► [PARALLELIZATION] ──► Tool Use
        │                             │
        │                        [MEMORY] ◄─── state history queries
        │
        └─ Maintenance ──► [EXCEPTION HANDLING] ──► retry / escalate
                │
                └─ patterns captured ──► [LEARNING] ──► automation refinement
```

Key interactions:
- **Routing + Guardrails**: Every routed action passes through the guardrail layer before Tool Use.
- **Planning + Memory**: The planning agent queries memory to produce dependency-aware plans.
- **Parallelization + Exception Handling**: Parallel batch calls require per-device exception handling to avoid total failure on a single device error.
- **HITL + Guardrails**: Guardrails decide whether to block outright or escalate to HITL.
- **Learning + Memory**: The learning loop reads from memory's override history to generate improvement signals.

## References
- Gulli, A. & Sauco, M. (2025). *Agentic Design Patterns*. O'Reilly Media.
- Repository: github.com/Mathews-Tom/Agentic-Design-Patterns
- Home Assistant REST API: https://developers.home-assistant.io/docs/api/rest
- Home Assistant Automations: https://www.home-assistant.io/docs/automation/
