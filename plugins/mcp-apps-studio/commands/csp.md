---
name: ui:csp
intent: Derive and harden the Content Security Policy for an agent UI and run the full widget security review
tags:
  - mcp-apps-studio
  - command
  - security
inputs:
  - target
  - flags
risk: medium
cost: low
description: Compute the minimal connectDomains and resourceDomains from actual code, place CSP where the host reads it, and audit for untrusted-payload rendering, unsafe URLs, injection into model context, and leaked secrets
---

# /ui:csp

Two jobs: derive the narrowest CSP that still works, and catch the security
defects that CSP does not cover.

## Usage

```
/ui:csp                       # derive + audit the current project
/ui:csp --derive              # compute the allowlists from code, nothing else
/ui:csp --audit               # security review only
/ui:csp --strict              # fail on any advisory finding
/ui:csp --fix
```

## Flags

| Flag | Effect |
|---|---|
| `--derive` | Scan the View for network and asset origins; emit the exact `csp` object. |
| `--audit` | Run the security checklist without touching CSP. |
| `--strict` | Treat advisories as blocking. Use in CI. |
| `--host <name>` | Account for host support (e.g. Copilot ignores `frameDomains`). |
| `--fix` | Apply mechanical fixes and write the derived CSP. |

## Derivation

Scans for `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `import()`,
`<script src>`, `<link href>`, `<img src>`, `@font-face`, and CSS `url()`, then
emits:

```ts
_meta: {
  ui: {
    csp: {
      connectDomains: ["https://api.example.com"],
      resourceDomains: [],          // everything inlined by vite-plugin-singlefile
      frameDomains: [],
      baseUriDomains: [],
    },
    domain: "https://example.com",
  },
}
```

It also reports what you could remove: a CDN font that could be inlined, an
analytics endpoint nobody asked for, an origin reachable only from dead code.

**Placement is checked.** CSP belongs in the resource **contents** `_meta`, not
in `registerAppResource`'s config argument. Misplaced CSP produces a View that
loads and then silently cannot reach the network — the highest
confusion-per-character bug in this whole stack.

## Audit checklist

**Payload handling**
- No `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`,
  `dangerouslySetInnerHTML`, `eval`, or `new Function`.
- `structuredContent` schema-validated at the View boundary, with length and
  array bounds.

**URLs**
- Every data-derived URL passes an `http:`/`https:` protocol allowlist.
- Navigation goes through `openLink` / `ui/open-link` — never `window.open`,
  `location.assign`, or `top.location`.

**Model context**
- `updateModelContext` and `ui/message` carry bounded structured facts, not raw
  third-party prose. Passing upstream text into model context is a prompt
  injection you built yourself.

**Authorization**
- Every mutating tool authorizes server-side against the authenticated user.
- No total, price, quantity, or permission flag trusted from the component.
- Mutating tools idempotent.
- `visibility: ["app"]` not treated as access control.

**Secrets**
- No keys or tokens in the bundle, the `ui://` URI, query strings, or
  `initial-render-data`.
- Anonymous auth not present outside local development.

**Isolation**
- For mcp-ui: `sandbox.url` points at a dedicated proxy origin, never your
  application origin.

## Output

```
CSP  ui://approvals/v1.html

DERIVED
  connectDomains   ["https://api.expenses.example"]
  resourceDomains  []                    ← all assets inlined
  frameDomains     []
  domain           "https://expenses.example"

REMOVABLE
  ⚠ https://fonts.gstatic.com — one font face; inline it and drop the origin
  ⚠ https://cdn.plot.ly — reachable only from a deleted chart path

PLACEMENT
  ✗ csp is in the registerAppResource config argument, not contents._meta
       → every fetch will be blocked at runtime with no visible error

AUDIT
  ✗ src/detail.tsx:63  innerHTML = item.descriptionHtml   (untrusted payload)
  ✗ src/list.tsx:22    window.open(item.url)              → use openLink
  ✗ src/list.tsx:40    updateModelContext({ note: item.vendorBlurb })
                          → raw third-party text into model context
  ⚠ structuredContent not schema-validated at the boundary
  ✓ no secrets in bundle   ✓ mutating tools authorize server-side

4 blocking · 3 advisory   --fix applies 3 (placement, openLink, allowlist trim).
```

## CI

```bash
node plugins/mcp-apps-studio/scripts/validate-mcp-app.mjs --csp --strict <server-root>
```

Non-zero exit on any blocking finding.

## Related

- Skill `ui-security-sandbox` — the full threat model and checklist.
- Skill `host-capability-matrix` — which CSP properties each host honors.
- `/ui:audit` — this plus protocol, tools, bridge, and UX.
