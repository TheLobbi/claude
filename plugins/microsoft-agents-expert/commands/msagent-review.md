---
name: msagent-review
intent: Review a Microsoft agent implementation against current best practices
tags:
  - microsoft-agents-expert
  - review
  - quality
inputs:
  - path to agent code or Copilot Studio solution export
  - focus (security|reliability|cost|ux|all)
risk: low
cost: high
description: Structured review of an Agent Framework, M365 Agents SDK, Teams, or Foundry agent covering security, reliability, tool design, memory, observability, and cost
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# /msagent-review — Review a Microsoft Agent Implementation

Review dimensions (apply the ones matching the detected stack):

1. **Security & identity** — Entra ID / managed identity over raw keys; on-behalf-of flows
   done correctly; no secrets in code or config committed to the repo; least-privilege
   Graph/connector scopes; prompt-injection surface on tool inputs and retrieved content.
2. **Tool design** — clear names/descriptions with trigger conditions; input schemas typed
   and validated; destructive actions gated on confirmation; tool errors returned to the
   model rather than swallowed.
3. **Reliability** — retry/backoff on model and tool calls; timeout and cancellation
   handling; idempotency for actions that may re-fire; thread/state persistence matching
   the hosting model.
4. **Memory & state** — conversation state scoped correctly (user vs conversation vs
   tenant); persistence backing appropriate for scale; no unbounded history growth without
   summarization/pruning.
5. **Observability** — OpenTelemetry (or stack-native) tracing on agent runs and tool
   calls; token/cost metrics captured; failed runs diagnosable from telemetry alone.
6. **UX & channel fit** — streaming where the channel supports it; adaptive cards valid;
   citation/feedback affordances in M365 surfaces; graceful degradation across channels.
7. **Cost** — model tier matched to task; caching used where available; autonomous
   triggers bounded (loop/credit guards in Copilot Studio).

## Output format

Findings grouped **BLOCK / REQUEST / SUGGEST / PRAISE** (repo review convention), each with
file:line references and a concrete fix. End with a one-paragraph overall assessment.
