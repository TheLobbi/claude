---
name: ui:protocol
intent: Choose between MCP Apps, mcp-ui, OpenAI Apps SDK, A2UI, and AG-UI for a stated requirement and produce a justified recommendation with a migration path
tags:
  - mcp-apps-studio
  - command
  - architecture
inputs:
  - requirement
  - flags
risk: low
cost: low
description: Decide which agent-UI protocol fits — asks the three questions that actually discriminate, then recommends a stack with reasoning, rejected alternatives, and the constraints that would change the answer
---

# /ui:protocol

Answers "which of these should I use" without guessing. Reads the requirement,
resolves the three discriminating questions, and returns a recommendation you
can defend in review.

## Usage

```
/ui:protocol "show a sortable table when our search tool returns results"
/ui:protocol --host chatgpt "let users pick a seat and pay"
/ui:protocol --host m365-copilot "approve expense reports inline"
/ui:protocol --own-frontend "our Flutter app needs agent-driven screens"
/ui:protocol --compare mcp-apps,a2ui
/ui:protocol --audit                       # infer from the current repo
```

## Flags

| Flag | Effect |
|---|---|
| `--host <name>` | Target host: `claude`, `chatgpt`, `m365-copilot`, `goose`, `custom`. |
| `--own-frontend` | You control the rendering client. Shifts toward A2UI/AG-UI. |
| `--compare a,b` | Head-to-head on the axes that matter, no recommendation. |
| `--audit` | Infer the current stack from the repo and evaluate whether it still fits. |
| `--constraints <list>` | e.g. `no-remote-code`, `native-widgets`, `long-running`, `existing-web-app`. |

## What it does

1. **Resolves the three questions.** Who renders the UI? Must the client use its
   own native components? Is the agent long-running with progress and interrupts?
   Asks only what it cannot infer.
2. **Applies the decision tree** from the `protocol-selection` skill.
3. **Checks host reality** against `host-capability-matrix` — a recommendation
   that depends on an unsupported API is not a recommendation.
4. **Names the combination**, not just one protocol. MCP Apps + Apps SDK
   extensions and AG-UI + A2UI are both single answers.
5. **Records what would change the answer** so the decision survives contact
   with new requirements.

## Output

```
RECOMMENDATION   MCP Apps (@modelcontextprotocol/ext-apps)
                 + OpenAI Apps SDK extensions, feature-detected

WHY
  · A chat host renders the UI, so the MCP Apps family is the only option
  · Portable across Claude, ChatGPT, and M365 Copilot unchanged
  · Checkout is ChatGPT-only → window.openai.requestCheckout behind a guard

REJECTED
  · mcp-ui        — no externalUrl/remoteDom need; no pre-extension host to reach
  · A2UI          — ChatGPT does not render A2UI surfaces
  · AG-UI         — single request/response; the event machinery buys nothing

HOST CONSTRAINTS (m365-copilot also targeted)
  ✗ frameDomains unsupported  → no nested map embed; use openLink
  ✗ onteardown unsupported    → persist on change, not at unmount
  ✓ setWidgetState supported  → remount survival is fine

WOULD CHANGE THE ANSWER
  · A native mobile surface enters scope        → A2UI
  · The workflow becomes a multi-minute run     → add AG-UI for the run
  · A design system must own every pixel        → A2UI

NEXT   /ui:new --protocol mcp-apps --host chatgpt,m365-copilot
```

## Notes

Read-only. It writes an ADR under `docs/decisions/` only with `--record`.

If the repo already has an agent UI, prefer `--audit` — the interesting question
is usually whether the existing choice still holds, not what to pick from scratch.

## Related

- Skill `protocol-selection` — the decision tree and axes.
- Skill `host-capability-matrix` — per-host support.
- `/ui:new` — scaffold once the choice is made.
- `/ui:port` — act on a `--audit` that says the choice no longer fits.
