---
name: ui:state
intent: Design or repair where state lives in an agent UI across the three ownership tiers and make it survive remount
tags:
  - mcp-apps-studio
  - command
  - state
inputs:
  - target
  - flags
risk: medium
cost: low
description: Place every value in the right tier — authoritative server data, ephemeral View state, durable cross-session storage — wire the write-through loop, and stop losing selections on remount
---

# /ui:state

Most agent-UI bugs are a value stored in the wrong tier. This command finds them
and moves them.

## Usage

```
/ui:state                      # audit where state currently lives
/ui:state --design             # propose the tier map for a new widget
/ui:state --remount            # make state survive remount
/ui:state --model-context      # decide what the model should be told, and when
/ui:state --agui               # reconcile AG-UI shared state with local UI state
/ui:state --fix
```

## The three tiers

| Tier | Owner | Lifetime | Examples |
|---|---|---|---|
| Authoritative business data | Server / external service | Long-lived | Tasks, tickets, orders |
| Ephemeral UI state | This View instance | This instance | Selection, expansion, sort, draft filter |
| Durable cross-session | Storage you control | Across sessions and devices | Saved filters, view mode, workspace |

## What it checks

**Tier placement**
- No business data held only in the View.
- No presentation state round-tripping to the server on every click.
- No user preference stored in widget state or `localStorage` as a source of truth.

**Write-through loop**
- View calls a tool → server validates and authorizes → server returns the
  updated snapshot → View renders the **response**, not the request.
- Optimistic updates keep a rollback snapshot, and the optimistic value never
  reaches `updateModelContext` before the server confirms.

**Remount survival**, in order of preference:
1. Do not cause it — data and render tools decoupled.
2. `setWidgetState` on every meaningful change; hydrate at init.
3. `onteardown` flush — with the note that Copilot does not support it, so it
   can never be the only path.
4. `viewUUID` + `localStorage` as opportunistic recovery for expensive state.

**Model context**
- `updateModelContext` carries bounded structured facts (IDs, counts, mode).
- One update per meaningful user action, not per keystroke.
- `ui/message` used only when the *user* should say something next.

**AG-UI**
- Both `StateSnapshot` and `StateDelta` handled — delta-only breaks on
  reconnect, snapshot-only wastes bandwidth.
- Failed patch application requests a snapshot instead of diverging silently.
- Shared state kept separate from local UI state so an agent update does not
  clobber scroll position.

## Output

```
STATE MAP  src/mcp-app.tsx

TIER 1 — server (authoritative)
  ✓ approvals[]        via list_approvals / approve_expense
  ✗ approvedIds        held only in View state
       → lost on remount; the server never learns about it
       FIX  approve_expense returns the updated snapshot; render that

TIER 2 — View (ephemeral)
  ✓ selectedId, sortKey, drawerOpen
  ⚠ selectedId not persisted → resets when the host remounts
       FIX  setWidgetState({ selectedId }) on change; hydrate at init

TIER 3 — durable
  ✗ defaultSort in localStorage
       → no cross-device guarantee; iframe storage is unreliable
       FIX  move to server prefs keyed to the authenticated user

MODEL CONTEXT
  ✗ updateModelContext called on every keystroke (line 71)  FIX  debounce to selection change
  ⚠ payload includes vendorBlurb (raw third-party text)     FIX  send IDs and counts only

REMOUNT
  ✗ get_approvals carries _meta.ui.resourceUri → remounts on every refresh
       FIX  decouple; call get_approvals as an app-only tool from the View

4 blocking · 2 advisory
```

## Related

- Skill `ui-state-architecture` — the tiers, the loop, and the failure table.
- Skill `ag-ui-protocol` — snapshot/delta semantics.
- Skill `ui-security-sandbox` — what may safely enter model context.
- `/ui:tool --decouple` — the structural fix for remount.
