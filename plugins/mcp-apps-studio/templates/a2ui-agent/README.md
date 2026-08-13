# __APP_TITLE__ — A2UI agent

A2UI describes UI as **data**. The agent streams JSON; the client renders it with
its own native components. Nothing executable crosses the boundary, so there is
no UI-injection surface.

## Files

| File | Purpose |
|---|---|
| `catalog.json` | Extension catalog — the components and functions **your client** implements. |
| `surface.jsonl` | The message stream for one surface, in emit order. |

## The message sequence

```
createSurface       open the surface, name the default catalog
updateComponents    flat adjacency list — emit `root` first
updateDataModel     seed the JSON Pointer data model
updateComponents    incremental patches as data arrives
deleteSurface       tear it down
```

Read `surface.jsonl` top to bottom: it opens a surface, renders a skeleton, then
patches in the real form and seeds its data. That ordering is deliberate — the
renderer buffers until a component with `"id": "root"` exists and then renders
incrementally, so a skeleton first means structure appears immediately.

## Rules that bite

- **Flat, not nested.** Components are an adjacency list; parents reference
  children by ID. That is what makes streaming and incremental patching work.
- **`root` first.** Anything referencing a component that has not arrived renders
  as a placeholder.
- **Catalog resolution has no fallback.** Explicit `catalogId` on the entity →
  surface default from `createSurface` → **error**. One must always be present.
  Note how `copy` in the sample carries an explicit `catalogId` because it uses
  a function from the extension catalog rather than the basic one.
- **UAX #31 identifiers.** `^[\p{XID_Start}_][\p{XID_Continue}]*$` — no hyphens.
  `@` is reserved. `Surface` can never be redefined.
- **`allowedParents` / `allowedChildren` are enforced at runtime.** Violations
  emit `UNALLOWED_PARENT` / `UNALLOWED_CHILD`.
- **Local vs agent actions.** `action.functionCall` for anything the renderer can
  do alone — navigation, expand, copy, formatting. `action.event` only when the
  agent must reason. The sample's "Copy email" costs no agent turn.
- **Validation belongs in `CheckRule`.** An invalid form should never cost an
  agent turn.
- **No theme properties in v1.0.** All visual styling defers to the renderer's
  native theme. Design intent goes in the catalog's `instructions` field.
- **`sendDataModel: true`** attaches the whole surface data model to every
  renderer→agent message. It removes "the agent doesn't know what the user
  typed" as a failure mode, and it costs bandwidth. The sample enables it; drop
  it if the action `context` already carries what you need.

## Two-way binding

`TextField` and `CheckBox` bind bidirectionally. User input updates the **local**
model immediately; it reaches the agent only when an action dispatches. That is
why `submit` names the bound paths in its `context`.

## Validate

```bash
node <plugin>/scripts/validate-mcp-app.mjs --json .    # not A2UI-aware; use /ui:a2ui --validate
```

Use `/ui:a2ui --validate .` for schema conformance against `common_types.json`,
`agent_to_renderer.json`, and your catalog.

## Renderer

Your client maps each `component` name to a native widget — React, Flutter,
SwiftUI, web components. Plumb `AccessibilityAttributes` (`label`,
`description`, `live`, `hidden`) to the framework's native accessibility API;
unplumbed attributes are worse than absent ones because they look handled.
