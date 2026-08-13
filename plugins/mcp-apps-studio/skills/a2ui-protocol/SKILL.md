---
name: a2ui-protocol
description: This skill should be used when building A2UI (Agent to UI) interfaces — the six streamed message types, surfaces, the flat adjacency-list component model, component catalogs, JSON Pointer data binding and two-way input binding, actions vs functionCalls, CheckRule validation, and progressive streaming.
version: 1.0.0
trigger_phrases: [a2ui, agent to ui, createSurface, updateComponents, updateDataModel, callRendererFunction, component catalog, catalogId, dataModel, adjacency list ui, declarative ui json]
categories: [protocol, a2ui, ui, reference]
author: mcp-apps-studio
created: 2026-08-13
updated: 2026-08-13
---

# A2UI — Agent to UI Protocol (v1.0)

A2UI takes the opposite bet from MCP Apps. Instead of shipping HTML into an
iframe, the agent streams a **declarative JSON description** of the UI and the
client renders it with **its own native components** — React, Flutter, SwiftUI,
web components, whatever the client is built from.

The security consequence is the point: **UI is data, not code.** The agent can
only reference components in a client-controlled catalog. There is no arbitrary
script from model output, so there is no UI injection surface.

The portability consequence is the other point: one payload renders on every
client, natively.

Choose A2UI when the client owns the design system, when you must render on
non-web surfaces, or when executing model-authored markup is unacceptable.
Choose MCP Apps when you need arbitrary web capability inside a chat host.

## The six messages

Every message is one JSON object with `"version": "v1.0"` and exactly one
envelope key. Typically streamed as JSONL.

| Message | Purpose |
|---|---|
| `createSurface` | Open a surface. May carry initial `components` and `dataModel`. |
| `updateComponents` | Add or replace components in a surface. |
| `updateDataModel` | Write values at JSON Pointer paths. Upsert semantics. |
| `deleteSurface` | Destroy the surface and everything in it. |
| `callRendererFunction` | Invoke a function the catalog registered on the renderer. |
| `agentFunctionResponse` | Return a result for a renderer→agent function call. |

```jsonl
{"version":"v1.0","createSurface":{"surfaceId":"contact_form_1","catalogId":"https://a2ui.org/specification/v1_0/catalogs/basic/catalog.json"}}
{"version":"v1.0","updateComponents":{"surfaceId":"contact_form_1","components":[{"id":"root","component":"Card","child":"form_container"},{"id":"form_container","component":"Column","children":["header","name_row"],"align":"stretch"}]}}
{"version":"v1.0","updateDataModel":{"surfaceId":"contact_form_1","path":"/contact","value":{"firstName":"John"}}}
{"version":"v1.0","deleteSurface":{"surfaceId":"contact_form_1"}}
```

`surfaceId` must be unique for the renderer's lifetime. A deleted surface cannot
be recreated under the same ID.

## The three schemas

| Schema | Defines |
|---|---|
| `common_types.json` | `DynamicString`, `DynamicNumber`, `ComponentId`, `ChildList`, `AccessibilityAttributes`, `CheckRule` |
| `agent_to_renderer.json` | The message envelope. Uses `catalog.json#/$defs/anyComponent` so it validates against *any* compliant catalog. |
| `catalogs/basic/catalog.json` | The baseline components (`Text`, `Button`, `TextField`, `Row`, `Column`, `Card`, `CheckBox`, `ChoicePicker`, …) and functions. |

## The component model

Components are a **flat adjacency list**, not a nested tree. Each entry has an
`id`; parents reference children by ID.

```json
{"id": "root",   "component": "Card",   "child": "col"}
{"id": "col",    "component": "Column", "children": ["title", "field"]}
{"id": "title",  "component": "Text",   "text": "Contact us"}
{"id": "field",  "component": "TextField", "value": {"path": "/contact/email"}}
```

Every surface implicitly contains a canonical `Surface` container whose child is
`"root"`. `Surface` is reserved and cannot be redefined by a catalog.

Flatness is what makes streaming and incremental patching work — you can update
one component without resending its ancestors.

## Catalogs

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/catalogs/mine/catalog.json",
  "catalogId": "https://example.com/catalogs/mine/catalog.json",
  "components": {
    "Badge": {
      "properties": {
        "component": { "const": "Badge" },
        "label": { "$ref": "common_types.json#/$defs/DynamicString" }
      },
      "allowedParents": ["Row", "Column"],
      "allowedChildren": []
    }
  },
  "functions": {
    "formatCurrency": { "returnType": "string", "callableFrom": ["renderer"] }
  },
  "instructions": "Use Badge for status only. Never for primary actions."
}
```

Rules that bite:

- `catalogId` is a unique string, conventionally a URI, **not required to
  resolve**.
- Every component schema must pin `"component": {"const": "<Name>"}`.
- Identifiers follow UAX #31: `^[\p{XID_Start}_][\p{XID_Continue}]*$`. The `@`
  prefix is reserved for system context.
- `allowedParents` / `allowedChildren` are enforced at runtime — violations emit
  `UNALLOWED_PARENT` / `UNALLOWED_CHILD`.
- Catalog resolution: explicit `catalogId` on the component → surface default
  from `createSurface` → **error**. There is no fallback to renderer defaults.
- `instructions` is prose for the LLM. Use it to encode design intent the schema
  cannot express.

## Data model and binding

UI structure and application data are strictly separate. Components reference
data by JSON Pointer.

- **Root scope** — absolute paths: `/user/name`.
- **Collection scope** — inside a template, relative paths (`firstName`) resolve
  against the current item; absolute paths still reach the root.

### Two-way binding

`TextField`, `CheckBox`, and `ChoicePicker` bind bidirectionally:

1. Component displays the value at its bound path.
2. User input updates the **local** model immediately.
3. The updated state reaches the agent **only when an action dispatches**.

```json
{"id": "email", "component": "TextField", "value": {"path": "/contact/email"}}
{"id": "submit", "component": "Button", "label": "Submit",
 "action": {"event": {"name": "submit_form", "context": {"email": {"path": "/contact/email"}}}}}
```

`updateDataModel` uses upsert semantics: a missing path is created, `null`
deletes the key.

Set `sendDataModel: true` on `createSurface` and the renderer attaches the whole
surface data model to the metadata of every message it sends back — expensive,
but it removes an entire class of "the agent doesn't know what the user typed"
bugs.

## Actions

Two kinds, and the distinction matters for latency.

```json
// Agent action — round-trips to the agent
"action": { "event": { "name": "submit_form", "context": { "itemId": "123" } } }

// Local action — the renderer handles it, no round trip
"action": { "functionCall": { "call": "openUrl", "args": { "url": "${/url}" } } }
```

Use local actions for anything that does not need agent reasoning: navigation,
expand/collapse, copy-to-clipboard, formatting.

## Functions

Catalog functions carry `returnType` and `callableFrom`, which fixes the
direction they may be invoked in. Standard basic-catalog functions:

| Function | Notes |
|---|---|
| `formatString` | `${...}` interpolation. `${/user/name}`, `${formatDate(value:${/date}, format:'yyyy-MM-dd')}`. `\${` escapes. |
| `@index` | 0-based index during template rendering. **Child scope only** — cannot use absolute paths internally. |
| `required`, `email` | Validation predicates for `CheckRule`. |

### `CheckRule` and validation

A `CheckRule` is a condition (data binding or function call) returning:

```json
{ "valid": true, "code": "…", "message": "…", "severity": "error|warning|info" }
```

Validation runs on the renderer, so an invalid form never costs an agent turn.

## Streaming and progressive rendering

The renderer buffers component definitions until a component with `"id": "root"`
exists, then renders incrementally as more messages arrive. References to
components that have not arrived yet render as placeholders.

This means you can stream a skeleton first and fill it in — the user sees
structure immediately.

**Transport patterns:**

- *Request/response (HTTP)* — `callRendererFunction` goes out in the HTTP
  response; the renderer replies with `functionResponse` in a subsequent POST.
- *Bidirectional (WebSocket/gRPC)* — messages flow asynchronously; correlate
  with `functionCallId`.

## Accessibility

`AccessibilityAttributes` (`label`, `description`, `live`, `hidden`) must be
plumbed to the framework's native accessibility API — WAI-ARIA on web, Semantics
in Flutter, and so on. Renderers infer defaults from component type and visible
content; explicit attributes override.

## Theming

v1.0 **removed** rigid theme properties. All visual styling defers to the
renderer's native theme system. Catalogs guide the LLM through `instructions`,
never through hardcoded colors. Do not attempt to send brand colors in the
payload — that is a v0.8/v0.9 habit and it no longer validates.

## Migrating from v0.9

- Function calls are now bidirectional and explicit: `callRendererFunction` /
  `callAgentFunction`, both verified against catalog definitions.
- `createSurface` can carry components and data in one message.
- Theme properties removed (see above).
- Catalog function definitions are object maps, with `$schema` / `$id`.
- UAX #31 naming enforced; `@` namespace reserved.

## Related

- `protocol-selection` — A2UI vs MCP Apps vs AG-UI.
- `ag-ui-protocol` — the other streaming-agent protocol; they compose.
- `ui-security-sandbox` — why "UI as data" removes a threat class.
