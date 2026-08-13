# MCP Apps Studio

Turns a product requirement into a spec-correct interactive UI that an AI host
renders inline — a chart, form, or approval queue living in the conversation.

## Five protocols

| Protocol | Renders in | Use when |
|---|---|---|
| **MCP Apps** | Claude, ChatGPT, Copilot | Default. Portable across every compliant host. |
| **mcp-ui** | Goose, Postman, custom | Need `externalUrl`/`remoteDom`, or a pre-extension host. |
| **OpenAI Apps SDK** | ChatGPT | ChatGPT-only: checkout, files, modals, widget state. |
| **A2UI** | Your client's native widgets | UI as *data*. Non-web surfaces; no model-authored markup. |
| **AG-UI** | Your frontend | Long-running agents: progress, shared state, interrupts. |

MCP Apps is the substrate; mcp-ui and the Apps SDK layer on it. A2UI and AG-UI
are separate stacks. Pick with `/ui:protocol`, never by habit.

## Core pattern (MCP Apps)

Register a resource at `ui://…` with mimeType `text/html;profile=mcp-app`, and a
render tool whose `_meta.ui.resourceUri` points at it. The host calls the tool,
renders the resource in a sandboxed iframe, and proxies every `ui/*` JSON-RPC
message between View and server.

## Non-negotiables

- **Decouple data tools from render tools.** Only render tools carry
  `resourceUri` — otherwise the widget remounts on every call.
- **Every tool returns `content`.** Pixels-only tools break text-only hosts.
- **Register handlers before `connect()`**, or the first result is dropped.
- **CSP goes in the resource `contents._meta`**, not the config argument.
- **`structuredContent` is untrusted.** Schema-validate it; never `innerHTML`.
- **Feature-detect, never host-detect.** Unsupported APIs are `undefined`.
- **Breaking UI change ⇒ new `ui://` URI.** Hosts cache by URI.

Entry points: `/ui:protocol` when the host is unknown · `/ui:new` when it isn't ·
`/ui:ship` for the loop · `/ui:audit` before shipping.

## When to open deeper docs

| Signal | Open docs | Why |
| --- | --- | --- |
| Choosing a protocol | `docs/protocol-matrix.md` | Wire formats and discriminating axes. |
| "Does host X support Y?" | `docs/capability-matrix.md` | Per-host support and severity. |
| A term means two things | `docs/glossary.md` | Equivalents and name collisions. |
| Bridge or `_meta` details | `skills/mcp-apps-protocol/SKILL.md` | Every method, field, lifecycle. |
| Writing `ext-apps` code | `skills/mcp-apps-sdk/SKILL.md` | API surface, build, failure modes. |
| Model never calls the widget | `skills/tool-metadata-design/SKILL.md` | Discovery is a metadata bug. |
| Hardening before ship | `skills/ui-security-sandbox/SKILL.md` | CSP, threat model, checklist. |
| Slow or remounting widget | `skills/ui-performance/SKILL.md` | Budget, skeletons, remounts. |
| Shipping to M365 Copilot | `skills/m365-copilot-packaging/SKILL.md` | CORS, redirects, gaps. |
| Install and full reference | `README.md` | Commands, agents, templates. |
| Working inside this plugin | `CLAUDE.md` | Conventions, script contracts. |
