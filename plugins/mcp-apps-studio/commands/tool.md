---
name: ui:tool
intent: Design or repair the tool surface behind an agent UI — naming, descriptions, schemas, the decoupled data/render split, visibility, and result channels
tags:
  - mcp-apps-studio
  - command
  - tools
inputs:
  - target
  - flags
risk: medium
cost: medium
description: Make the model actually call your widget — action-oriented names, trigger-situation descriptions, constrained schemas, decoupled data/render tools, and the structuredContent/content/_meta split
---

# /ui:tool

A beautiful widget the model never invokes is worth nothing. This command works
on the metadata layer that decides whether it gets called, and on the tool
topology that decides whether it remounts.

## Usage

```
/ui:tool                                   # audit the current server's tool surface
/ui:tool --design "expense approval widget with bulk actions"
/ui:tool --decouple                        # split data tools from render tools
/ui:tool --discovery                       # test whether real phrasings select the right tool
/ui:tool --fix                             # apply the safe findings
```

## Flags

| Flag | Effect |
|---|---|
| `--design <desc>` | Derive a tool surface from a product description. |
| `--decouple` | Find tools carrying `resourceUri` that also fetch/mutate, and split them. |
| `--discovery` | Generate user phrasings and check which tool each selects. |
| `--visibility` | Recommend `["app"]` for tools the model should not see. |
| `--schemas` | Tighten input/output schemas: enums, bounds, descriptions. |
| `--fix` | Apply findings that need no judgment. Prints a diff first. |
| `--server <path>` | Server source root. Default: auto-detect. |

## Checks

**Topology**
- Exactly the render tools carry `_meta.ui.resourceUri`.
- No tool both fetches/mutates and renders.
- Every referenced `ui://` URI resolves to a registered resource.
- Tools the View calls for local interactions are `visibility: ["app"]`.

**Naming and description**
- `verb_noun`, lowercase, consistent family prefixes.
- Description states what it does, when to call it, what it depends on, and when
  *not* to call it.
- Render tools name their prerequisite explicitly ("call `search_listings` first").

**Schemas**
- Every parameter described; enums over free strings; numeric and length bounds.
- `outputSchema` present wherever `structuredContent` is returned.
- Parameter count within reason — a 15-parameter tool gets called wrong.

**Result channels**
- `content` present and non-empty on every tool (the text-only fallback).
- `structuredContent` lean — no returning 500 rows to render 8.
- `_meta` holds only client-specific data the model must not reason over.

**Annotations**
- `readOnlyHint` set correctly.
- Nothing depends on `destructiveHint` for a confirmation prompt — several hosts
  ignore it.

## Discovery testing

`--discovery` writes the phrasings a real user would use and reports which tool
each selects:

```
"find me houses under 600k in Portland"      → search_listings        ✓
"show them on a map"                          → render_listings_widget ✓
"which ones are near a school"                → search_listings        ✗ expected: none
                                                 (model should filter, not re-search)
   FIX  add to search_listings description:
        "Do not call again for follow-up filtering the model can perform itself."
```

Wrong selection is a metadata bug, not a model failure. The fix is always the
description.

## Output

```
TOOL SURFACE  server.ts — 6 tools

TOPOLOGY
  ✗ get_forecast carries _meta.ui.resourceUri and performs a fetch
       → widget remounts on every refresh
       FIX  split into get_forecast (data) + render_forecast (render)
  ✓ render_forecast → ui://weather/v1.html (registered)
  ⚠ set_units is model-visible but only ever called from the View
       FIX  _meta.ui.visibility = ["app"]

DESCRIPTIONS
  ✗ list_cities — "Lists cities." states no trigger situation
  ⚠ render_forecast — does not name its prerequisite

SCHEMAS
  ✗ get_forecast.city — unbounded string   FIX  .max(120)
  ⚠ get_forecast — no outputSchema

RESULT CHANNELS
  ✗ render_forecast returns no `content` → breaks text-only hosts

3 blocking · 3 advisory   Run with --fix to apply 4 mechanical fixes.
```

## Related

- Skill `tool-metadata-design` — the full rules.
- Skill `openai-apps-sdk` — the decoupled pattern in depth.
- `/ui:audit` — this plus everything else.
