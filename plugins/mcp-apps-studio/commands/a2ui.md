---
name: ui:a2ui
intent: Author A2UI surfaces, component catalogs, data models, and streaming message sequences, and validate them against the v1.0 schemas
tags:
  - mcp-apps-studio
  - command
  - a2ui
inputs:
  - description
  - flags
risk: medium
cost: medium
description: Build agent-driven UI as data — design a component catalog, emit createSurface/updateComponents/updateDataModel streams, wire JSON Pointer bindings and CheckRule validation, and validate against the three A2UI schemas
---

# /ui:a2ui

A2UI describes UI as **data**, not code — the client renders it with its own
native components. No markup from the model, so no UI injection surface.

## Usage

```
/ui:a2ui "a contact form with validation"
/ui:a2ui --catalog "our design system: Badge, Stat, Timeline"
/ui:a2ui --surface checkout --stream          # emit the JSONL message sequence
/ui:a2ui --validate specs/                    # check against the v1.0 schemas
/ui:a2ui --renderer react                     # scaffold a renderer for a catalog
/ui:a2ui --migrate 0.9-to-1.0
```

## Flags

| Flag | Effect |
|---|---|
| `--catalog <desc>` | Author a component catalog: schemas, `allowedParents`/`allowedChildren`, functions, `instructions`. |
| `--surface <id>` | Build one surface's message sequence. |
| `--stream` | Emit the JSONL the agent should send, in order. |
| `--validate <path>` | Validate against `common_types.json`, `agent_to_renderer.json`, and the catalog. |
| `--renderer <fw>` | Scaffold a renderer: `react`, `flutter`, `swiftui`, `web-components`. |
| `--migrate 0.9-to-1.0` | Apply the v1.0 migration, including theme stripping. |

## What it produces

**Catalog** — a JSON Schema document with `catalogId`, `components`,
`functions`, and `instructions`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/catalogs/ds/catalog.json",
  "catalogId": "https://example.com/catalogs/ds/catalog.json",
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
  "functions": { "formatCurrency": { "returnType": "string", "callableFrom": ["renderer"] } },
  "instructions": "Use Badge for status only. Never for primary actions."
}
```

**Message stream** — flat adjacency-list components plus a JSON Pointer data
model:

```jsonl
{"version":"v1.0","createSurface":{"surfaceId":"contact_1","catalogId":"…/basic/catalog.json"}}
{"version":"v1.0","updateComponents":{"surfaceId":"contact_1","components":[
  {"id":"root","component":"Card","child":"col"},
  {"id":"col","component":"Column","children":["email","submit"],"align":"stretch"},
  {"id":"email","component":"TextField","value":{"path":"/contact/email"}},
  {"id":"submit","component":"Button","label":"Submit",
   "action":{"event":{"name":"submit_form","context":{"email":{"path":"/contact/email"}}}}}]}}
{"version":"v1.0","updateDataModel":{"surfaceId":"contact_1","path":"/contact","value":{"email":""}}}
```

## What it gets right

- **Flat adjacency list**, never a nested tree — that is what makes streaming and
  incremental patching work.
- **`root` first.** The renderer buffers until a component with `"id": "root"`
  exists. Emit the skeleton early so structure appears immediately.
- **Catalog resolution.** Explicit `catalogId` → surface default → **error**.
  There is no fallback, so one of the two must always be present.
- **UAX #31 identifiers** (`^[\p{XID_Start}_][\p{XID_Continue}]*$`); `@`
  reserved; `Surface` never redefined.
- **Local vs agent actions.** `action.functionCall` for anything the renderer can
  do alone (navigation, expand, copy, format) — no round trip. `action.event`
  only when the agent must reason.
- **`CheckRule` validation** on the renderer, so an invalid form never costs an
  agent turn.
- **No theme properties.** v1.0 defers all visuals to the renderer's native
  theme. Design intent goes in `instructions`, not in colors.
- **`AccessibilityAttributes`** plumbed to the native API — WAI-ARIA on web,
  Semantics in Flutter.
- **`sendDataModel`** recommended when the agent must see full UI state at action
  time, with the bandwidth cost stated.

## Validation

```
A2UI VALIDATE  specs/checkout/

SCHEMA
  ✓ agent_to_renderer.json — 14 messages, all single-envelope, all version v1.0
  ✗ components[7] "Row" declares child "summary_grid" — not in the catalog
  ✗ components[3] "Badge" nested in "Text" — UNALLOWED_PARENT (allowed: Row, Column)

CATALOG
  ✗ component "line-item" violates UAX #31 (hyphen)   FIX  lineItem
  ⚠ function "formatMoney" has no callableFrom        → defaults are not portable
  ⚠ no `instructions` field — the LLM has no design guidance

DATA MODEL
  ✗ TextField "email" binds /contact/email; no updateDataModel ever seeds it
  ⚠ @index used with an absolute path — child scope only

V1.0
  ✗ 3 theme properties present — removed in v1.0; move intent to `instructions`

5 blocking · 3 advisory
```

## Related

- Skill `a2ui-protocol` — messages, catalogs, binding, streaming.
- Skill `protocol-selection` — when A2UI beats MCP Apps.
- `/ui:agui` — the event stream A2UI payloads often ride on.
