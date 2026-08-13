---
name: ui-security-sandbox
description: This skill should be used when hardening an agent UI — authoring the narrowest _meta.ui.csp allowlists, the iframe sandbox and proxy-origin model, treating structuredContent as untrusted input, prompt-injection through rendered data, host-mediated navigation, secrets handling, and the pre-ship security checklist.
version: 1.0.0
trigger_phrases: [widget csp, connectDomains, resourceDomains, frameDomains, sandbox iframe, untrusted structuredContent, prompt injection widget, xss agent ui, sandbox_proxy, widget security review]
categories: [security, ui, mcp, review]
author: mcp-apps-studio
created: 2026-08-13
updated: 2026-08-13
---

# Security model for agent-rendered UI

Your View renders data that travelled: external service → MCP server → model →
host → iframe. Every hop is a place content could have been shaped by someone
who is not your user. Design accordingly.

## The sandbox contract

- The View runs in a sandboxed iframe with **no access** to the host's DOM,
  cookies, `localStorage`, or origin.
- `postMessage` is the only channel, which makes every capability enumerable and
  auditable. That is a feature — do not try to widen it.
- CSP is **deny-by-default**. Anything not declared in `_meta.ui.csp` is blocked.
- Nested frames are blocked unless `frameDomains` opts in (and several hosts do
  not support `frameDomains` at all).

For mcp-ui's client renderer, the `sandbox.url` proxy origin is what enforces
isolation. **Never point it at your own application origin** to make something
work — that hands untrusted markup your session.

## Authoring CSP

Declare the narrowest possible allowlists in the **resource contents `_meta`**:

```ts
_meta: {
  ui: {
    csp: {
      connectDomains: ["https://api.example.com"],       // fetch / WebSocket
      resourceDomains: ["https://static.example.com"],   // scripts, styles, images, fonts
      frameDomains: [],                                  // nested iframes — leave empty
      baseUriDomains: [],
    },
    domain: "https://example.com",   // the origin the View is served as
  },
}
```

Rules:

- **One entry per real dependency.** No wildcards, no `https://*`.
- **No CDN domains you can avoid.** Inline assets with `vite-plugin-singlefile`
  or esbuild and `resourceDomains` shrinks to nothing.
- **`connectDomains` is not a convenience list.** Each entry is an origin the
  View may exfiltrate rendered data to. Justify every one.
- **`frameDomains` stays empty** unless a specific embed is a product
  requirement. Copilot ignores it entirely, so an embed-dependent design fails
  there anyway.
- **CSP goes in the contents `_meta`, not the config argument.** Misplacing it
  produces a View that loads and then silently cannot reach the network.

Review processes (OpenAI's, and any internal one worth having) diff the declared
policy against observed behavior. An over-broad allowlist is a review finding
before it is an incident.

## `structuredContent` is untrusted input

The single most important rule.

```tsx
// ❌ Executes anything the upstream service put in the field.
el.innerHTML = toolResult.structuredContent.description;

// ✅ Text is text.
el.textContent = toolResult.structuredContent.description;
```

React's default `{value}` interpolation is safe. `dangerouslySetInnerHTML` is
not, and neither is any string that reaches `innerHTML`, `outerHTML`,
`insertAdjacentHTML`, `document.write`, `eval`, `new Function`, or a `javascript:`
URL.

Validate the shape before rendering. A schema check at the View boundary — zod,
valibot, or a hand-rolled guard — turns a whole class of malformed-payload bugs
into a clean error state:

```ts
const Forecast = z.object({ city: z.string().max(120), days: z.array(Day).max(14) });
const parsed = Forecast.safeParse(toolResult.structuredContent);
if (!parsed.success) return renderError();
```

Bound array lengths and string lengths. An unbounded list is a denial-of-service
against your own render loop.

## URLs from data

Any URL that arrived in the payload is attacker-influenced.

```ts
function safeHref(raw: string): string | null {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch { return null; }
}
```

- Reject everything but `http:`/`https:` — this kills `javascript:`, `data:`,
  and `vbscript:` in one check.
- Navigate via **`app.openLink({ url })` / `ui/open-link`**, never
  `window.open`, `location.assign`, or `top.location`. Host-mediated navigation
  is the whole point: the host can show the destination and refuse.
- Same rule for image `src` — a `data:` image is usually fine, an arbitrary
  remote origin needs to be in `resourceDomains`.

## Prompt injection through the View

Two directions, both real:

**Data → model.** Whatever you pass to `ui/update-model-context` or
`ui/message` enters the conversation as trusted-looking context. If it contains
attacker-controlled text, you have handed an injection straight to the model.
Send *structured facts about what the user is looking at* — IDs, counts,
selections — not raw upstream prose.

```ts
// ❌ raw upstream text into model context
app.updateModelContext({ note: item.descriptionFromThirdParty });

// ✅ facts the model needs, bounded and typed
app.updateModelContext({ selectedIds: ids, view: "list", total: items.length });
```

**Model → View.** Tool arguments are model-authored. Validate them server-side
before acting; never treat "the model sent it" as authorization.

## Authorization lives on the server

- The View is a rendering surface, not a trust boundary. Every state-changing
  action goes through a tool call the **server** authorizes against the
  authenticated user.
- Never trust a total, price, quantity, permission flag, or ID computed in the
  component. Recompute server-side.
- Make mutating tools idempotent — a View can retry, and the host can replay.
- `visibility: ["app"]` hides a tool from the model. It does **not** authorize
  the caller. It is context hygiene, not access control.

## Secrets

- No API keys, tokens, or connection strings in the View bundle. The HTML is
  served to the host and readable by the user.
- Do not put credentials in `ui://` URIs, query strings, or `initial-render-data`.
- All privileged calls proxy through the server, which holds the credential.
- OAuth 2.1 or Entra SSO at the server boundary; anonymous auth is for local
  development only and must be removed before deploy.

## Storage

- `localStorage` in the iframe is unreliable and origin-scoped in ways you do
  not control. Never use it as a source of truth.
- Widget state (`setWidgetState`) is ephemeral and instance-scoped. Not storage.
- Durable data lives on your server, keyed to the authenticated user.

## Pre-ship checklist

- [ ] `connectDomains` and `resourceDomains` contain only origins actually used.
- [ ] `frameDomains` empty, or a documented product requirement.
- [ ] CSP is in the resource **contents** `_meta`.
- [ ] No `innerHTML` / `dangerouslySetInnerHTML` / `eval` / `new Function` anywhere.
- [ ] `structuredContent` schema-validated at the View boundary, with bounds.
- [ ] Every data-derived URL passes a protocol allowlist.
- [ ] All navigation goes through `openLink` / `ui/open-link`.
- [ ] Model context carries facts, not raw third-party text.
- [ ] Every mutating tool authorizes server-side and is idempotent.
- [ ] No secrets in the bundle, the URI, or render data.
- [ ] Anonymous auth removed; OAuth 2.1 or Entra SSO configured.
- [ ] Resource URI bumped if the UI changed in a breaking way.

Run `/ui:csp` for the automated pass over the first eight.

## Related

- `mcp-apps-protocol` — the sandbox and CSP fields.
- `host-capability-matrix` — which CSP properties each host honors.
- `m365-copilot-packaging` — CORS and redirect-URI allowlists.
