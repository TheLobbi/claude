# Host capability matrix

Which host implements what. **Unsupported APIs are `undefined`, not throwing** —
so a missing guard produces a silent dead button, not an error anyone notices in
testing.

The live version of this table is in the checker:

```bash
node scripts/host-capability-check.mjs --list
node scripts/host-capability-check.mjs --host chatgpt,m365-copilot <root>
```

The full annotated tables — component bridge, tool `_meta`, annotations,
resource `_meta`, CSP properties, client `_meta` — are in the
`host-capability-matrix` skill.

## Two kinds of capability

The distinction matters for severity, and the checker enforces it.

| Kind | Example | When unsupported | Severity |
|---|---|---|---|
| **Runtime** | `requestModal`, `onteardown`, `sendLog` | The call is `undefined` and dead-ends | **Blocking** if unguarded |
| **Declarative** | `prefersBorder`, `destructiveHint`, `frameDomains` | Silently ignored by the host | **Advisory** — nothing to guard |

You cannot feature-detect a `_meta` field you sent to a server. You can only
avoid depending on it visually or behaviorally.

## Where the gaps change design, not just code

Drawn from the published Microsoft 365 Copilot support tables, which are the
most complete public statement of any host's coverage.

| Gap | Consequence | Work around it by |
|---|---|---|
| `frameDomains` unsupported | No nested iframes at all | Inline the capability, or degrade to `openLink` |
| Only fullscreen alternate mode | No PiP | Design inline + fullscreen only |
| `onteardown` unsupported | No flush signal; intervals leak | Persist on change; guard intervals with `document.hidden` |
| `onhostcontextchanged` unsupported | Theme changes never arrive | Read theme at init; back it with `prefers-color-scheme` |
| `ontoolinputpartial` unsupported | No streaming skeleton | Make `ontoolinput` alone produce an acceptable one |
| `sendLog` unsupported | No host-side logging | `?debug` flag revealing an on-screen log pane |
| `availableDisplayModes` unsupported | Cannot enumerate modes | Default to `["inline"]`; feature-detect the request API |
| `requestModal` unsupported | No host modal | In-widget overlay |
| `uploadFile` / `getFileDownloadUrl` unsupported | No file round-trip | Server-side upload endpoint + `openLink` |
| `destructiveHint` ignored | No host confirmation prompt | Build confirmation into your UI |
| `toolInvocation/invoking`+`invoked` unsupported | No custom progress text | Put status in the widget |
| `prefersBorder`, `widgetDescription`, `widgetDomain` ignored | Silently dropped | Do not depend on them visually |

## Detection patterns

Minimal guard:

```ts
if (window.openai?.callTool) {
  const result = await window.openai.callTool({ name: 'myTool', params: {} });
} else {
  // fallback
}
```

Conditional affordance — never render a control the host cannot honor:

```tsx
function FullScreenButton() {
  if (!window.openai?.requestDisplayMode) return null;
  return <button onClick={() => window.openai.requestDisplayMode({ mode: 'fullscreen' })}>
    Enter Fullscreen
  </button>;
}
```

Startup probe — prefer this for anything non-trivial:

```ts
const caps = await app.getHostCapabilities();
const modes = app.getHostContext()?.availableDisplayModes ?? ['inline'];
```

The `?? ['inline']` is doing real work: `availableDisplayModes` is itself
unsupported on some hosts.

## Rules

1. Never branch on host name or user agent. Test for the capability.
2. Never render an affordance whose API is missing — hide it, do not disable it.
3. A guard without a fallback is not a guard. A `try/catch` that swallows leaves
   a dead control.
4. Prefer `getHostCapabilities()` over any static table, **including this one**.

## Currency

This is a snapshot of published vendor support. Host coverage moves. Re-verify
against the vendor docs before shipping, and probe at runtime regardless.
