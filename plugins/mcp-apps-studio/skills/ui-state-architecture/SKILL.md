---
name: ui-state-architecture
description: This skill should be used when deciding where state lives in an agent UI — the three ownership tiers (authoritative business data, ephemeral UI state, durable cross-session state), the write-through loop, updateModelContext vs setWidgetState, remount survival, and AG-UI shared-state reconciliation.
version: 1.0.0
trigger_phrases: [widget state, setWidgetState, updateModelContext, where should state live, widget remount lost state, durable storage widget, StateSnapshot StateDelta, optimistic update agent ui]
categories: [architecture, ui, state]
author: mcp-apps-studio
created: 2026-08-13
updated: 2026-08-13
---

# State architecture for agent UIs

Three tiers. Every value belongs to exactly one. Most agent-UI bugs are a value
stored in the wrong tier.

| Tier | Owner | Lifetime | Examples |
|---|---|---|---|
| **Authoritative business data** | Server or external service | Long-lived | Tasks, tickets, orders, documents |
| **Ephemeral UI state** | The rendered View instance | This instance only | Selected row, expanded panel, sort order, draft filter |
| **Durable cross-session state** | Storage you control | Across sessions and devices | Saved filters, view mode, workspace prefs |

```
Server / external service
│
├── Authoritative business data
│
▼
View
│
├── Ephemeral presentation state
│
└── Rendered view = business data + UI state
```

## Tier 1 — business data stays on the server

The View renders a snapshot; it does not own the data. The write-through loop:

1. View calls an MCP tool.
2. Server **validates and authorizes** the request and updates the data.
3. Server returns the updated authoritative snapshot.
4. View renders the snapshot, preserving compatible presentation state.

Return enough `structuredContent` for both the model and the View to understand
the new state — that is what keeps the conversation useful when the UI cannot
load at all.

Optimistic updates are fine for latency, with two conditions: keep the
pre-update snapshot so you can roll back, and never let the optimistic value
reach `updateModelContext` before the server confirms. Telling the model
something happened that then failed is worse than being slow.

## Tier 2 — ephemeral UI state stays in the View

Framework state (`useState`, a store, plain variables) for anything that only
affects presentation. Each rendered instance has its own.

Two things push a slice of it outward:

### `ui/update-model-context` — for the model

When the model needs to know what the user is looking at or has staged:

```ts
app.updateModelContext({ selectedIds: ["t-1", "t-9"], view: "board", total: 42 });
```

This is the **portable** mechanism and works in every MCP Apps host. Send
bounded, structured facts — IDs, counts, modes. Never raw third-party prose
(see `ui-security-sandbox`).

### `setWidgetState` — for remount survival (ChatGPT / Copilot)

```tsx
const [state, setState] = useState(window.openai?.widgetState ?? { selectedId: null });

function select(selectedId: string) {
  const next = { ...state, selectedId };
  setState(next);
  window.openai?.setWidgetState?.(next);   // synchronous; nothing to await
}
```

Call it after each meaningful change. It is **not** durable storage and **not**
a source of truth — it belongs to one rendered instance.

Structured form, when images must reach the model:

```ts
window.openai.setWidgetState({
  modelContent: "Review the currently selected images.",  // model sees
  privateContent: { currentView: "image-viewer" },        // model does not
  imageIds: ["file_123"],                                 // model receives
});
```

## Tier 3 — durable state on your server

Preferences that must survive conversations, devices, and sessions go in storage
you control, keyed to the authenticated user.

When you add it:

- Keep latency low enough for interactive UI (it is on the render path).
- Enforce authorization server-side; the View is not a trust boundary.
- Plan for data residency and compliance.
- Rate-limit — retries and concurrent View instances multiply traffic.
- Version stored objects so you can migrate without breaking live conversations.

**Avoid `localStorage` for core state.** The View runs in an isolated iframe;
browser storage gives you no cross-device or cross-session guarantee. The one
legitimate use is opportunistic recovery keyed by a server-provided `viewUUID`
from the tool result — cache-not-truth.

## Surviving remount

A View can remount whenever the host decides: display-mode change, scroll
recycling, conversation reload, a new tool call carrying the same resource.

Ranked defenses:

1. **Don't cause it.** Decouple data tools from render tools so refetching does
   not remount (see `openai-apps-sdk`). This eliminates most remounts outright.
2. **`setWidgetState`** on every meaningful change, hydrate from it at init.
3. **`onteardown`** to flush — but note it is unsupported in M365 Copilot, so
   never make it the only path.
4. **`viewUUID` + `localStorage`** as opportunistic recovery for anything
   genuinely expensive to rebuild.

## AG-UI shared state

AG-UI adds a fourth thing: state the agent and frontend *share*.

- `StateSnapshot` — the complete state. Apply on connect and after any desync.
- `StateDelta` — RFC 6902 JSON Patch. Apply in order.
- `MessagesSnapshot` — full conversation history.

Handle both snapshot and delta. Delta-only breaks on reconnect; snapshot-only
wastes bandwidth on every tick. On a failed patch application, request a
snapshot rather than guessing — silent divergence is the worst outcome.

Keep AG-UI shared state separate from local UI state in your store. Merging them
means an agent update clobbers the user's scroll position.

## A2UI data model

A2UI puts data in an explicit surface data model addressed by JSON Pointer,
strictly separate from component structure.

- Input components bind two-way; user edits update the **local** model
  immediately and reach the agent only when an action dispatches.
- `updateDataModel` is upsert: missing paths are created, `null` deletes.
- `sendDataModel: true` attaches the whole model to every renderer→agent
  message — expensive, but it removes "the agent doesn't know what the user
  typed" as a failure mode.

## Failure modes

| Symptom | Cause | Fix |
|---|---|---|
| Selection resets constantly | Data tool carries `resourceUri` | Decouple data/render tools |
| Model unaware of user selection | Never called `updateModelContext` | Push bounded facts on change |
| State lost on fullscreen toggle | Only in `useState` | Add `setWidgetState` |
| Prefs don't follow the user | Stored in widget state / `localStorage` | Move to server storage |
| Stale UI after a mutation | Rendered the request, not the response | Render the returned snapshot |
| Model told something that then failed | Optimistic value sent to model context | Confirm server-side first |
| AG-UI frontend drifts from agent | Delta applied out of order or patch failed silently | Request `StateSnapshot` on failure |

## Related

- `openai-apps-sdk` — the decoupled data/render pattern.
- `ag-ui-protocol` — snapshot/delta semantics.
- `a2ui-protocol` — the surface data model.
- `ui-security-sandbox` — what may safely enter model context.
