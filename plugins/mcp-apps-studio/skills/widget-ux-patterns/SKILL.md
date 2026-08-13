---
name: widget-ux-patterns
description: This skill should be used when designing the visual and interaction layer of an agent-rendered widget — choosing among inline card, carousel, fullscreen, and picture-in-picture, action budgets, layout and typography rules, host theming, accessibility requirements, and the vendor dos and donts.
version: 1.0.0
trigger_phrases: [widget design, inline card, inline carousel, fullscreen widget, picture in picture, display mode, widget accessibility, widget theming, apps sdk design guidelines]
categories: [design, ux, ui, reference]
author: mcp-apps-studio
created: 2026-08-13
updated: 2026-08-13
---

# Widget UX patterns

An agent widget is a guest in someone else's interface. It inherits their theme,
competes with their composer, and gets closed the moment it feels like a
different app. Design to the container.

**Start with the smallest presentation that lets the user understand the result
or finish the task.** Request more space only when the workflow demands it.

## The four display modes

### Inline card

A focused result, a confirmation, or a small set of actions. The default.

- **Maximum two primary actions** — one primary CTA, one optional secondary.
- No deep navigation, no tabs, no drill-ins inside the card.
- No nested scrolling. Auto-fit content to the available height.
- Never duplicate a feature the host already provides.
- Preserve visual hierarchy: headline → supporting text → CTA.

Mobile: the card may expand its height to match content, up to the height of the
mobile display area.

### Inline carousel

Scanning a small set of similar, visually rich options — restaurants, playlists,
events.

- **3–8 items.** Fewer looks broken; more is a list, not a carousel.
- **≤3 lines of metadata** per item.
- **One clear CTA** per item.
- Consistent aspect ratios. A ragged carousel reads as a bug.

### Fullscreen

Rich tasks needing room: maps, editing canvases, detailed browsing.

- The host's composer **stays overlaid**. Design around it — never place
  controls where the composer lands.
- Do not replicate a native app wholesale. Fullscreen is a focused surface, not
  a port of your product.
- Provide an obvious way back to inline.
- In M365 Copilot, fullscreen is the *only* alternate mode supported.

### Picture-in-picture

An ongoing activity that should stay visible while the conversation continues —
a live session, game, or video.

- Minimal controls. PiP overloaded with chrome is unusable at that size.
- Must react to conversation input, not sit static.
- Auto-closes when the session ends. Do not fight it.

### Requesting a mode

```ts
const modes = app.getHostContext()?.availableDisplayModes ?? ["inline"];
if (modes.includes("fullscreen") && app.requestDisplayMode) {
  await app.requestDisplayMode({ mode: "fullscreen" });
}
```

The host may grant a different mode than requested. Render from the mode you
were *given*, never the one you asked for.

## Visual design

### Color

- Use **system colors** for text, icons, and structural elements like dividers.
- Brand accents belong on logos, small icons, and the primary button — nothing else.
- Do not override system text color or background with brand color.
- No custom gradients or background overrides.
- Honor `hostContext.theme` (and `prefers-color-scheme` as a backstop, since
  `onhostcontextchanged` is not universally supported).

### Typography

- Inherit the host's font stack. **No custom fonts, even in fullscreen.**
- Respect device-native sizing rules — SF Pro on iOS, sans-serif on Android.
- Limit size variation; prefer body and body-small.
- Partner styling (bold, italic, highlight) only *within* content areas.

### Layout

- Use the host's grid spacing for cards and collections.
- Consistent padding; never edge-to-edge text.
- Respect `safeAreaInsets` from host context.
- Drive height with `sendSizeChanged` / `notifyIntrinsicHeight` rather than
  guessing a fixed height.

### Icons and imagery

- Monochromatic, outlined iconography that matches the host's language.
- Fixed aspect ratios; never distort.
- **Do not render your own logo as a response element** — the host appends
  attribution itself.

## Accessibility — non-negotiable

- WCAG AA contrast minimum for text against background.
- Alt text on every image.
- Text resizing must not break layout — no fixed pixel heights around text.
- Full keyboard reachability; visible focus states.
- Semantic elements and ARIA roles (`aria-pressed`, `aria-live` for async
  results). A2UI: plumb `AccessibilityAttributes` to the native API.
- Respect `prefers-reduced-motion`.

## Loading, empty, and error states

Every widget needs four states, and three of them get skipped.

| State | Rule |
|---|---|
| **Loading** | Render a skeleton from `ontoolinput` before the result arrives. Never a bare spinner when you already know the shape. |
| **Empty** | Say what is missing and what to do next. Not "No results." |
| **Error** | Human-readable message plus a retry path. Also call `updateModelContext` so the model knows the view is degraded and can help. |
| **Partial** | With `ontoolinputpartial`, render progressively — but treat healed JSON as incomplete and never act on it. |

## Interaction with the conversation

- The widget and the chat are one experience. Do not build a parallel chat.
- Use `ui/message` / `sendFollowUpMessage` when the *user* should say something
  next; use `ui/update-model-context` when the model just needs to *know*
  something. Confusing these produces either a spammy transcript or a model
  that has no idea what the user selected.
- One meaningful update per user action. Do not stream context on every keystroke.

## Localization

The host mirrors locale to `document.documentElement.lang`.

```tsx
const locale = document.documentElement.lang || "en-US";
```

Format dates, numbers, and currency from that locale — not from the server's.

## Checklists

**Do**
- Inline for quick confirmations and simple actions
- Keep the composer usable in fullscreen
- Brand color on accents and badges only
- One clear CTA per carousel item
- Feature-detect before rendering any host-dependent affordance

**Don't**
- Deep navigation, tabs, or drill-ins inside a card
- Nested scrolling or cramped layouts
- Replicate host-native features
- Override system text colors or backgrounds
- Custom fonts, anywhere
- Overload PiP with controls or leave it static

## Related

- `host-capability-matrix` — which modes and APIs the target host supports.
- `ui-state-architecture` — preserving presentation state across remounts.
- `ui-performance` — skeletons, partial input, and offscreen pausing.
