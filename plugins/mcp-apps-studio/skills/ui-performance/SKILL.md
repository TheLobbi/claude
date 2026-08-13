---
name: ui-performance
description: This skill should be used when an agent UI is slow, heavy, or janky — bundle size and single-file inlining, skeletons from tool-input, ontoolinputpartial streaming, avoiding remount via decoupled tools, polling and chunked transfer through app-only tools, offscreen pausing with IntersectionObserver, and size-change churn.
version: 1.0.0
trigger_phrases: [widget slow, bundle size widget, ontoolinputpartial, IntersectionObserver widget, widget remount, polling app-only tool, chunked transfer mcp, sendSizeChanged loop]
categories: [performance, ui, mcp]
author: mcp-apps-studio
created: 2026-08-13
updated: 2026-08-13
---

# Performance for agent UIs

The whole View is fetched as one HTML string, mounted in a fresh iframe, and
frequently discarded. Every millisecond is on the user's critical path between
asking a question and seeing an answer.

## Bundle size

The View is inlined into the resource. A 2 MB bundle is 2 MB on every mount.

- Bundle to a **single file** (`vite-plugin-singlefile`, or esbuild to one ESM
  module inlined in a `<script type="module">`). This also empties
  `resourceDomains`, which is a security win.
- Keep the dependency set lean. A charting library, a date library, and a
  component kit will each out-weigh your actual widget.
- Prefer the platform: `Intl` over a date library, CSS grid over a layout
  library, inline SVG over an icon package.
- Tree-shake and target modern output — hosts run current engines.
- If you must load remotely, declare exactly those origins in `resourceDomains`
  and accept the extra round trip.

Rough budget: **under 200 KB** for an inline card is comfortable, **under
500 KB** for fullscreen. Past a megabyte, users see a visible gap.

## Perceived latency

The bridge hands you the tool **arguments before the result**. Use them.

```ts
app.ontoolinput = ({ city, days }) => renderSkeleton({ city, dayCount: days });
app.ontoolresult = (result) => render(result.structuredContent);
```

A skeleton built from real arguments — the right city name, the right number of
rows — reads as instant. A spinner reads as broken.

### Streaming partial input

```ts
app.ontoolinputpartial = (partial) => updatePreview(partial);
```

The host streams JSON-healed partial arguments as the model produces them.
Two rules:

- **Treat it as incomplete.** Healed JSON can contain truncated strings and
  missing keys. Render it; never act on it, never send it to a server.
- **Have a fallback.** M365 Copilot does not support it, so `ontoolinput` must
  produce an acceptable skeleton on its own.

## Do not remount

Remount is the most expensive thing that can happen and the easiest to cause.

The cause, nearly always: a UI resource attached to a tool the model calls
repeatedly. The fix is the decoupled data/render split —

- **Data tools**: fetch, compute, mutate. No `resourceUri`.
- **Render tools**: take prepared data, carry `resourceUri`.

Then let the View call **data tools directly** for local interactions ("Re-roll",
"Next page", "Refresh"). The widget updates in place; nothing remounts.

Mark those direct-call tools `visibility: ["app"]` so they stay out of the
model's tool list and out of the conversation context.

## Round trips

Every `callServerTool` is View → host → server → host → View. Budget for it.

- Batch. One tool that returns a page of results beats ten that return one each.
- Debounce user-driven calls (search-as-you-type: 250–400 ms).
- Render optimistically where the operation is safe to roll back, but do not
  push optimistic values into `updateModelContext` before the server confirms.
- Cache immutable lookups in View memory for the instance's lifetime.

### Polling

For live data, poll with an app-only tool and **always clean up**:

```ts
const id = setInterval(async () => {
  const r = await app.callServerTool({ name: "get_status", arguments: { jobId } });
  render(r.structuredContent);
}, 5000);

app.onteardown = () => clearInterval(id);
```

`onteardown` is unsupported in M365 Copilot. Pair it with a visibility check so
an orphaned View does not poll forever:

```ts
if (document.hidden) return;   // inside the interval body
```

Back off on errors — a failing endpoint polled every 5 s is a self-inflicted
outage.

### Chunked transfer

Hosts cap message size. For large payloads (files, images, long exports),
register an app-only tool returning paginated base64 chunks with `offset`,
`totalBytes`, and `hasMore`, and reassemble in the View. Show progress; users
tolerate slow far better than frozen.

## Offscreen work

A View scrolled out of the conversation still runs.

```ts
const io = new IntersectionObserver(([entry]) => {
  entry.isIntersecting ? resumeExpensiveWork() : pauseExpensiveWork();
});
io.observe(document.body);
```

Pause animation loops, polling, video, and canvas rendering. Combine with
`document.hidden` for tab-level backgrounding.

## Size changes

`sendSizeChanged` / `notifyIntrinsicHeight` drives host layout. Emitting it on
every frame produces visible thrash and, with some hosts, a resize feedback
loop.

- Emit on **content change**, not on every render.
- Use `ResizeObserver` and debounce (~100 ms).
- Round to integers; sub-pixel deltas cause oscillation.
- Never call it from inside a handler that fires *because* of a resize.

## Rendering

- Virtualize lists past ~100 rows.
- Bound what you render: cap array length at the parse boundary, paginate the rest.
- Keep animation to transform and opacity; honor `prefers-reduced-motion`.
- Avoid layout thrash — read all measurements, then write all styles.
- Memoize expensive derived data; the tool result is usually stable between renders.

## Measuring

```ts
performance.mark("app-connect");
app.ontoolresult = () => {
  performance.mark("first-render");
  app.sendLog?.({
    level: "info",
    data: performance.measure("ttfr", "app-connect", "first-render").duration,
  });
};
```

Track: time to first render, bundle size, round trips per interaction, remounts
per conversation. The last one should almost always be 1.

## Checklist

- [ ] Bundle inlined into a single file
- [ ] Bundle under budget (200 KB inline / 500 KB fullscreen)
- [ ] Skeleton rendered from `ontoolinput`
- [ ] `ontoolinputpartial` used where available, with a fallback
- [ ] Data and render tools decoupled; only render tools carry `resourceUri`
- [ ] Local interactions call app-only data tools, no remount
- [ ] Polling cleaned up in `onteardown` **and** guarded by `document.hidden`
- [ ] Large payloads chunked with progress
- [ ] Offscreen work paused via `IntersectionObserver`
- [ ] `sendSizeChanged` debounced and integer-rounded
- [ ] Lists virtualized past ~100 rows

## Related

- `openai-apps-sdk` — the decoupled tool pattern in full.
- `mcp-apps-sdk` — build configuration.
- `widget-ux-patterns` — loading, empty, and error states.
