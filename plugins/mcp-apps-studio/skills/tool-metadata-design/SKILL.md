---
name: tool-metadata-design
description: This skill should be used when designing the tool surface behind an agent UI — action-oriented naming, descriptions that drive correct model selection, input and output schemas, structuredContent vs content vs _meta, safety annotations, tool visibility, and the discovery metadata that decides whether the app ever gets invoked.
version: 1.0.0
trigger_phrases: [tool description mcp, structuredContent vs content, outputSchema, readOnlyHint, tool discovery metadata, tool naming mcp, widgetAccessible, tool visibility app, when should the model call this]
categories: [design, mcp, tools, reference]
author: mcp-apps-studio
created: 2026-08-13
updated: 2026-08-13
---

# Designing the tool surface

A widget nobody triggers is worth nothing. Discovery is a metadata problem, and
metadata is where most agent UIs quietly fail — the UI is beautiful and the
model never calls it.

## Naming

Action-oriented `verb_noun`, lowercase, underscore-separated.

```
✅ search_listings    render_listings_widget    complete_checkout
❌ listings           handler                   doStuff             get_data
```

The name is the model's strongest signal. `render_listings_widget` announces
what it does and that it produces UI; `listings` announces nothing.

Consistent prefixes across a server help the model reason about a family:
`search_*`, `get_*`, `render_*`, `create_*`, `update_*`.

## Descriptions

The description is a prompt. Write it for the model, not for a docs page.

Cover four things:

1. **What it does**, concretely, including the return shape.
2. **When to call it** — the user situations that should trigger it.
3. **What it depends on** — required prior calls, spelled out.
4. **When *not* to call it** — the near-miss cases it should not absorb.

```ts
description:
  "Render the listings widget from prepared listing data. " +
  "Call search_listings first and pass the filtered listing IDs here. " +
  "Use when the user should visually compare properties. " +
  "Do not use for a single property — use render_listing_detail instead.",
```

Dependency statements are load-bearing in the decoupled pattern. Without
"call `roll_dice` first", the model will invent arguments for the render tool.

## Schemas

### Input

- Every parameter needs a description; the model reads them.
- Constrain: enums over free strings, `min`/`max` on numbers, `maxLength` on
  strings, `maxItems` on arrays.
- Required means required. Optional parameters with sensible defaults reduce
  malformed calls.
- Keep the surface small. A 15-parameter tool gets called wrong.

```ts
inputSchema: {
  city: z.string().min(1).max(120).describe("City name, e.g. 'Portland, OR'"),
  days: z.number().int().min(1).max(14).default(7).describe("Forecast length in days"),
  units: z.enum(["metric", "imperial"]).default("metric"),
}
```

### Output

Declare `outputSchema` whenever you return `structuredContent`. It documents the
contract for the model, for the View, and for your own tests.

## The three result channels

```ts
return {
  structuredContent: { city, days },                       // View renders this; model can inspect it
  content: [{ type: "text", text: `7-day forecast for ${city}.` }],  // model reads; text-only hosts read
  _meta: { /* client-specific, hidden from the model */ },
};
```

| Channel | Who sees it | Put here |
|---|---|---|
| `structuredContent` | View + model | The data. Concise, typed, matching `outputSchema`. |
| `content` | Model + text-only hosts | A short natural-language summary. |
| `_meta` | Client only | Rendering hints, session tokens, anything the model must not reason over. |

**`content` is not optional.** It is what makes the tool work in a host that
does not render UI, and what lets the model answer a follow-up without
re-calling. A tool whose only output is pixels is broken.

Keep `structuredContent` lean. It enters the model's context on every call —
returning 500 rows to render 8 wastes budget and degrades reasoning.

## Visibility

| Setting | Effect | Use for |
|---|---|---|
| `["model", "app"]` (default) | Model and View may call | Normal tools |
| `["app"]` | View only; hidden from the model | Pagination, polling, cart mutations, chunked transfer |
| `["model"]` | Model only | Sensitive operations the UI must not initiate |

App-only tools are the main lever for keeping conversation context clean. A View
that calls a model-visible tool on every interaction floods the transcript.

`visibility` is **context hygiene, not access control**. Authorize server-side
regardless.

ChatGPT's `_meta["openai/widgetAccessible"]` is the older equivalent; M365
Copilot honors `openai/visibility` but not `widgetAccessible`. Prefer
`_meta.ui.visibility`.

## Safety annotations

```ts
annotations: {
  readOnlyHint: true,       // widely honored
  destructiveHint: false,   // ignored by M365 Copilot
  idempotentHint: true,     // ignored by M365 Copilot
  openWorldHint: false,     // ignored by M365 Copilot
}
```

Set them all — they are cheap and some hosts use them. But **never rely on
`destructiveHint` to produce a confirmation prompt.** Build confirmation into
your own UI for anything irreversible.

## Invocation status text

```ts
_meta: {
  "openai/toolInvocation/invoking": "Searching listings…",
  "openai/toolInvocation/invoked": "Found 12 listings.",
}
```

ChatGPT-only; unsupported in M365 Copilot. Put a real status in the widget
itself so the experience holds up everywhere.

## Discovery

Whether the model reaches for your tool at all comes down to:

- **Name** — the primary signal.
- **Description** — trigger situations in the user's vocabulary, not yours.
- **Parameter descriptions** — they disambiguate between similar tools.
- **Server/app description** — the umbrella context.

Test discovery explicitly: write the five phrasings a real user would use and
verify each selects the right tool. Wrong selection is a metadata bug, not a
model failure — fix the description.

## Tool count

Under ~10 well-named tools, models select reliably. Past ~20, selection degrades
noticeably.

- Prefer one tool with an enum parameter over five near-identical tools.
- Hide mechanical helpers with `visibility: ["app"]` — they cost nothing in the
  model's list.
- Split a server that has genuinely outgrown one domain.

## Anti-patterns

| Anti-pattern | Why it fails |
|---|---|
| `resourceUri` on every tool | Widget remounts on every call; state lost |
| No `content`, only `structuredContent` | Breaks text-only hosts and follow-ups |
| Description written for humans | Model cannot tell when to use it |
| Unconstrained string parameters | Malformed calls, injection surface |
| Returning the whole dataset | Burns context, degrades reasoning |
| Business logic in the render handler | Untestable; re-renders do real work |
| Relying on `destructiveHint` for confirmation | Ignored by major hosts |

## Related

- `openai-apps-sdk` — the decoupled data/render pattern.
- `host-capability-matrix` — which `_meta` fields each host honors.
- `ui-security-sandbox` — why server-side authorization is non-negotiable.
