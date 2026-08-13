---
name: ui:component
intent: Author or improve the View itself — the widget markup, states, theming, accessibility, and display-mode behavior for a chosen protocol
tags:
  - mcp-apps-studio
  - command
  - ui
inputs:
  - description
  - flags
risk: medium
cost: medium
description: Build the widget — picks the display mode, writes all four states, wires host theme and safe areas, enforces WCAG AA and keyboard access, and keeps every host-dependent affordance feature-detected
---

# /ui:component

Writes the part the user actually sees. Assumes the tool surface exists (or runs
`/ui:tool` first).

## Usage

```
/ui:component "ranked list of restaurants with favorite and directions"
/ui:component --mode carousel "playlist picker"
/ui:component --mode fullscreen "map with a detail inspector"
/ui:component --improve src/mcp-app.tsx
/ui:component --a11y                       # accessibility pass only
/ui:component --states                     # add the missing loading/empty/error states
```

## Flags

| Flag | Effect |
|---|---|
| `--mode` | `inline`, `carousel`, `fullscreen`, `pip`. Default: recommended for the content. |
| `--framework` | `react`, `vanilla`, `vue`, `svelte`. Default: detected. |
| `--improve <file>` | Review and upgrade an existing View. |
| `--a11y` | Accessibility only: contrast, alt text, keyboard, ARIA, reduced motion. |
| `--states` | Add loading, empty, error, and partial states. |
| `--theme` | Wire host theme, safe areas, and locale. |

## Display mode

Picks the smallest presentation that does the job, and says why:

| Content | Mode | Budget |
|---|---|---|
| One result or confirmation | inline card | ≤2 primary actions, no nested scroll |
| 3–8 similar visual options | inline carousel | ≤3 metadata lines, 1 CTA each |
| Map, canvas, deep browse | fullscreen | composer stays overlaid — design around it |
| Live session, game, video | picture-in-picture | minimal controls, reacts to chat |

It renders from the mode the host **granted**, never the one requested, and
checks `availableDisplayModes` before offering a control at all.

## The four states

Most widgets ship with one. This writes all four:

- **Loading** — a skeleton built from `ontoolinput` (real city name, real row
  count), upgraded by `ontoolinputpartial` where the host supports it. Never a
  bare spinner when the shape is already known.
- **Empty** — what is missing and what to do next, not "No results."
- **Error** — human-readable message, retry path, and an
  `updateModelContext` call so the model knows the view is degraded.
- **Loaded** — the real thing.

## What it enforces

- `structuredContent` parsed through a bounded schema before it touches the DOM.
- No `innerHTML`, `dangerouslySetInnerHTML`, `eval`, or `new Function`.
- Data-derived URLs protocol-checked; navigation via `openLink`, never
  `window.open`.
- Host theme honored, with `prefers-color-scheme` as a backstop (because
  `onhostcontextchanged` is not universally supported).
- `safeAreaInsets` respected; height driven by debounced `sendSizeChanged`.
- WCAG AA contrast, alt text on every image, full keyboard reach with visible
  focus, `aria-live` on async regions, `prefers-reduced-motion` honored.
- System fonts and system colors — brand color on accents and the primary button
  only. No custom fonts.
- Every host-dependent control hidden when its API is `undefined`.

## Output

Writes or rewrites the View and its schema module, then prints:

```
COMPONENT  src/mcp-app.tsx — inline card

MODE     inline  (2 primary actions, content fits 320px — carousel unwarranted at 3 items)
STATES   loading ✓ (skeleton from ontoolinput)  empty ✓  error ✓ (+ updateModelContext)
A11Y     contrast 7.1:1 ✓   alt text ✓   keyboard ✓   aria-live on results ✓
THEME    hostContext.theme + prefers-color-scheme fallback ✓   safeAreaInsets ✓
GUARDS   requestDisplayMode ✓  sendLog ✓  setWidgetState ✓ — all feature-detected
SAFETY   schema-validated at boundary ✓   no innerHTML ✓   openLink for navigation ✓

SIZE     41 KB inlined  (budget 200 KB)
```

## Related

- Skill `widget-ux-patterns` — display modes, layout, and the vendor rules.
- Skill `ui-security-sandbox` — why the boundary validation is not optional.
- Skill `ui-performance` — skeletons, size-change debouncing, bundle budget.
- `/ui:bridge` — the host communication layer underneath.
