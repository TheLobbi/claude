---
name: ui:audit
intent: Run the complete agent-UI review across protocol conformance, tool surface, bridge, state, security, UX, performance, and host portability
tags:
  - mcp-apps-studio
  - command
  - review
inputs:
  - target
  - flags
risk: low
cost: medium
description: One pass over everything — spec conformance, decoupled tools, bridge ordering, CSP, untrusted-payload handling, accessibility, bundle budget, and per-host portability — with findings ranked blocking first
---

# /ui:audit

The pre-ship review. Everything `/ui:tool`, `/ui:bridge`, `/ui:csp`,
`/ui:state`, and `/ui:component` check, in one pass, ranked.

## Usage

```
/ui:audit
/ui:audit --host chatgpt,m365-copilot     # portability against specific hosts
/ui:audit --dimension security,perf
/ui:audit --strict                        # advisories become blocking (CI)
/ui:audit --fix                           # apply the mechanical findings
/ui:audit --report docs/ui-audit.md
```

## Flags

| Flag | Effect |
|---|---|
| `--host <list>` | Check every API used against those hosts' support matrices. |
| `--dimension <list>` | `protocol`, `tools`, `bridge`, `state`, `security`, `ux`, `perf`, `portability`. |
| `--strict` | Advisories fail the run. |
| `--fix` | Apply findings that need no judgment; prints a diff first. |
| `--report <path>` | Write a markdown report. |

## Dimensions

**Protocol conformance** — `ui://` scheme; mimeType exactly
`text/html;profile=mcp-app`; `_meta.ui` fields on the right object (tool vs
resource); every referenced URI registered; resource URI versioned.

**Tool surface** — decoupled data/render split; `content` present on every tool;
`structuredContent` lean and matching `outputSchema`; action-oriented names;
descriptions that state trigger situations and prerequisites; constrained
schemas; `visibility: ["app"]` on View-only tools.

**Bridge** — all handlers before `connect()`; lifecycle coverage; message
listener checks `event.source` and `jsonrpc`; every optional API guarded with a
real fallback; no host-name branching; `ui/message` vs `ui/update-model-context`
used for the right purpose.

**State** — each value in the right tier; write-through renders the response;
remount survival; model context bounded and debounced.

**Security** — CSP narrow and correctly placed; no `innerHTML`/`eval`;
`structuredContent` schema-validated with bounds; URL protocol allowlist;
host-mediated navigation; no raw third-party text into model context;
server-side authorization; no secrets in the bundle.

**UX** — display mode appropriate; action budget respected; all four states
present; system fonts and colors; WCAG AA contrast; alt text; keyboard reach;
`aria-live`; `prefers-reduced-motion`; safe-area insets.

**Performance** — bundle within budget; skeleton from `ontoolinput`; no remount
per interaction; polling cleaned up and visibility-guarded; `sendSizeChanged`
debounced and integer-rounded; lists virtualized past ~100 rows.

**Portability** — every host API used, cross-referenced against each target
host's matrix, with the design consequence spelled out.

## Output

```
UI AUDIT   plugins/expenses-ui       hosts: chatgpt, m365-copilot

BLOCKING (5)
  security   src/detail.tsx:63   innerHTML on untrusted structuredContent
  security   server.ts:88        csp in the config arg, not contents._meta
                                 → every fetch blocked at runtime
  bridge     src/app.tsx:34      ontoolresult assigned after connect()
                                 → initial tool-result dropped
  tools      server.ts:41        get_expenses carries resourceUri AND fetches
                                 → widget remounts on every refresh
  portability src/app.tsx:88     requestModal unguarded — undefined in M365 Copilot

ADVISORY (6)
  ux         no empty state; "No results." is the current copy
  ux         contrast 3.9:1 on the secondary label (AA needs 4.5:1)
  perf       bundle 640 KB — inline card budget is 200 KB
  perf       sendSizeChanged fires on every render
  state      selectedId not persisted; lost on display-mode change
  tools      render_expenses does not name its prerequisite in the description

PORTABILITY MATRIX
  API                     chatgpt   m365-copilot   used   guarded
  callTool                  ✓           ✓           ✓        —
  requestDisplayMode        ✓        ✓ fullscreen   ✓        ✓
  setWidgetState            ✓           ✓           ✓        ✓
  requestModal              ✓           ✗           ✓        ✗   ← blocking
  onteardown                ✓           ✗           ✓        ✗   ← advisory
  frameDomains              ✓           ✗           ✗        —

SCORE  61/100      --fix applies 6 mechanical findings.
```

## CI

```bash
node plugins/mcp-apps-studio/scripts/validate-mcp-app.mjs --strict <server-root>
node plugins/mcp-apps-studio/scripts/host-capability-check.mjs --host chatgpt,m365-copilot <view-root>
```

Both exit non-zero on blocking findings.

## Related

- `/ui:tool`, `/ui:bridge`, `/ui:csp`, `/ui:state`, `/ui:component` — the
  focused versions.
- Skill `host-capability-matrix` — the portability tables.
