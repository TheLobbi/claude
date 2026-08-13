---
name: ui:new
intent: Scaffold a complete runnable agent-UI project for any supported protocol from a plain-language description of what the UI should do
tags:
  - mcp-apps-studio
  - command
  - scaffold
inputs:
  - description
  - flags
risk: medium
cost: medium
description: Turn a sentence into a working project — server, View, build config, CSP, and a local test loop — for MCP Apps, mcp-ui, OpenAI Apps SDK, A2UI, or AG-UI
---

# /ui:new

Takes "I want a widget that lets people approve expense reports" and produces a
project that builds, serves, and renders in a local host on the first run.

## Usage

```
/ui:new "a sortable table of search results with a detail drawer"
/ui:new --protocol mcp-apps --framework react "seat picker for a flight booking"
/ui:new --protocol openai-apps-sdk --lang python "restaurant carousel with map"
/ui:new --protocol a2ui "contact form rendered by our Flutter client"
/ui:new --protocol ag-ui --lang python "research agent with live progress"
/ui:new --into ./apps/approvals-ui
```

## Flags

| Flag | Values | Default |
|---|---|---|
| `--protocol` | `mcp-apps`, `mcp-ui`, `openai-apps-sdk`, `a2ui`, `ag-ui` | inferred, or `/ui:protocol` runs first |
| `--framework` | `react`, `vanilla`, `vue`, `svelte` | `react` |
| `--lang` | `ts`, `python` | `ts` |
| `--host` | `claude`, `chatgpt`, `m365-copilot`, `goose`, `custom` (repeatable) | `claude,chatgpt` |
| `--into <dir>` | Target directory | `./<slug>` |
| `--no-install` | Emit files, skip `npm install` | off |
| `--minimal` | Skip examples and the test harness | off |

## What it generates (MCP Apps / TypeScript / React)

```
<project>/
  package.json           "type": "module", build + serve scripts
  tsconfig.json          ES2022, ESNext modules, bundler resolution, strict
  vite.config.ts         vite-plugin-singlefile, INPUT-driven entry
  server.ts              registerAppTool + registerAppResource, Express + StreamableHTTP
  mcp-app.html           View entry point
  src/
    mcp-app.tsx          useApp, tool-input skeleton, tool-result render
    bridge.ts            the HostBridge adapter — components never touch app.* directly
    schema.ts            zod schemas for input, output, and View-boundary validation
  README.md              build, serve, and test-in-a-host instructions
  .env.example           no secrets, ever
```

## What it gets right by default

- **Decoupled tools.** A data tool with no `resourceUri` and a render tool that
  carries it. The single most common performance defect, absent from the start.
- **Text fallback.** Every tool returns real `content` alongside
  `structuredContent`, so a text-only host completes the workflow.
- **Handlers before `connect()`.** The ordering that loses the first
  `tool-result` when you get it wrong.
- **CSP in the resource contents `_meta`**, scoped to nothing until you add a
  dependency — and single-file bundling so `resourceDomains` stays empty.
- **Validation at the View boundary.** `structuredContent` is parsed with a
  bounded schema before it reaches the DOM. No `innerHTML` anywhere.
- **Versioned resource URI.** `ui://<name>/v1.html`, with the versioning rule
  documented in the README.
- **Feature-detected affordances.** Nothing host-dependent renders unguarded.
- **Skeleton from `ontoolinput`**, with an `ontoolinputpartial` upgrade where
  the host supports it.

Per-protocol variants swap the server and View layers and keep the same
adapter/validation spine — see `templates/` for the exact files.

## Flow

1. Resolve the protocol (runs `/ui:protocol` if not given and not inferable).
2. Derive the tool surface from the description — data tools, render tool,
   app-only helpers — and name them per `tool-metadata-design`.
3. Copy and parameterize the template (`scripts/scaffold-app.mjs`).
4. `npm install` unless `--no-install`.
5. Build once and run `scripts/validate-mcp-app.mjs` over the result.
6. Print the exact commands to see it render locally.

## After it finishes

```
cd <project>
npm run build && npm run serve          # your server on :3001

# then, from an ext-apps checkout:
SERVERS='["http://localhost:3001/mcp"]' npm start   # basic-host on :8080
```

## Related

- `/ui:protocol` — run first when the target is unclear.
- `/ui:component` — flesh out the View.
- `/ui:tool` — refine the tool surface.
- `/ui:preview` — the local test loop in detail.
- Skill `mcp-apps-sdk` — what the generated code is doing and why.
