# MCP Apps Studio

Turns any product requirement into a spec-correct interactive UI that an AI host
renders inline — a chart, form, dashboard, map, or approval queue that lives in
the conversation instead of a wall of text.

Covers five protocols: **MCP Apps**, **mcp-ui**, the **OpenAI Apps SDK**,
**A2UI**, and **AG-UI**.

## Install

```
/plugin marketplace add TheLobbi/claude
/plugin install mcp-apps-studio@thelobbi-claude
```

## Start here

```
/ui:protocol "show a sortable table when our search tool returns results"
/ui:new --protocol mcp-apps --host chatgpt,m365-copilot "expense approval queue"
/ui:ship "let users approve expense reports inline with bulk actions"
```

`/ui:protocol` when the target host is unknown. `/ui:new` when it isn't.
`/ui:ship` to run the whole loop.

## The five protocols

| Protocol | Who renders it | Choose when |
|---|---|---|
| **MCP Apps** | Claude, ChatGPT, M365 Copilot — sandboxed iframe | Default. Portable across every compliant host. |
| **mcp-ui** | Goose, Postman, custom hosts | You need `externalUrl`/`remoteDom` delivery, or a host that predates the extension. |
| **OpenAI Apps SDK** | ChatGPT | ChatGPT-only capability: checkout, file upload, modals, widget state. |
| **A2UI** | Your client, with its own native widgets | UI as *data*. Flutter/SwiftUI surfaces, or when model-authored markup is unacceptable. |
| **AG-UI** | Your frontend | Long-running agents: streamed progress, shared state, human-in-the-loop interrupts. |

MCP Apps is the substrate; mcp-ui and the Apps SDK are layers on it. A2UI and
AG-UI are separate stacks solving adjacent problems. `/ui:protocol` picks.

## Commands

| Command | Does |
|---|---|
| `/ui:protocol` | Choose the protocol stack, with rejected alternatives and boundary conditions |
| `/ui:new` | Scaffold a runnable project for any protocol |
| `/ui:tool` | Design the tool surface so the model actually invokes the widget |
| `/ui:component` | Author the View — display mode, four states, theming, accessibility |
| `/ui:bridge` | Implement or repair the host bridge and the portable adapter |
| `/ui:state` | Place state in the right tier; survive remount |
| `/ui:csp` | Derive the minimal CSP and run the security review |
| `/ui:preview` | Local test loop — Inspector, host harness, tunnel, triage |
| `/ui:audit` | The full pre-ship review across eight dimensions |
| `/ui:port` | Migrate between protocols |
| `/ui:a2ui` | A2UI catalogs, surfaces, and schema validation |
| `/ui:agui` | AG-UI event streams and interrupts |
| `/ui:copilot` | Package and ship into Microsoft 365 Copilot |
| `/ui:ship` | Requirement → deployed and verified in every target host |

## Skills

The specs themselves, loaded on demand:

`mcp-apps-protocol` · `mcp-apps-sdk` · `mcp-ui-sdk` · `openai-apps-sdk` ·
`a2ui-protocol` · `ag-ui-protocol` · `host-capability-matrix` ·
`protocol-selection` · `tool-metadata-design` · `widget-ux-patterns` ·
`ui-state-architecture` · `ui-security-sandbox` · `ui-testing-harness` ·
`ui-performance` · `ui-porting-migration` · `m365-copilot-packaging`

## Agents

`ui-protocol-strategist` · `mcp-app-builder` · `widget-designer` ·
`bridge-engineer` · `tool-schema-architect` · `csp-security-auditor` ·
`host-compat-auditor` · `a2ui-catalog-designer` · `agui-stream-engineer` ·
`ui-accessibility-reviewer` · `ui-state-architect` · `ui-port-migrator` ·
`ui-perf-optimizer`

## Templates

Runnable projects, not snippets. Every one scaffolds and passes the validator
clean.

```bash
node scripts/scaffold-app.mjs --list
node scripts/scaffold-app.mjs --template mcp-app-react --name "Expense Approvals" --into ./apps/expenses
```

| Template | Stack |
|---|---|
| `mcp-app-react` | MCP Apps · React + Vite single-file · adapter + boundary schemas |
| `mcp-app-vanilla` | MCP Apps · no framework |
| `openai-apps-sdk-node` | Apps SDK · Node server + esbuild React component |
| `openai-apps-sdk-python` | Apps SDK · FastMCP |
| `mcp-ui-server` | mcp-ui · rawHtml + externalUrl, all five action types |
| `a2ui-agent` | A2UI · catalog + streamed surface |
| `ag-ui-server` | AG-UI · FastAPI + SSE event stream |

## Scripts

```bash
# Scaffold a project from a template
node scripts/scaffold-app.mjs --template <name> --name "My App" --into ./dir

# Static conformance, CSP, and payload-handling checks
node scripts/validate-mcp-app.mjs --strict <root>

# Every host API used, against each target host's support matrix
node scripts/host-capability-check.mjs --host chatgpt,m365-copilot <root>
node scripts/host-capability-check.mjs --list

# A dependency-free local MCP Apps host — real bridge, sandboxed iframe
node scripts/preview-host.mjs --server http://localhost:3001/mcp
```

The validators exit non-zero on blocking findings, so they drop straight into CI.
`validate-mcp-app.mjs` covers TypeScript/JavaScript servers and Views plus
Python (FastMCP) servers; A2UI and AG-UI projects are out of its scope and it
says so rather than inventing findings.

They are heuristic source scanners and say so — they cannot verify runtime
behaviour or that the widget actually renders. `/ui:preview` does that.

## The non-negotiables

Every template and every agent enforces these, because each one is a defect
that ships regularly:

1. **Decouple data tools from render tools.** Only render tools carry
   `_meta.ui.resourceUri`. Attach a template to a tool the model calls
   repeatedly and the host remounts the iframe every time.
2. **Every tool returns `content`.** A tool whose only useful output is rendered
   pixels does not work in a text-only host and is broken.
3. **Register every handler before `connect()`.** Reversed, the first
   `tool-result` is dropped.
4. **CSP goes in the resource `contents._meta`**, not the config argument.
   Misplaced, every network call is silently blocked at runtime.
5. **`structuredContent` is untrusted input.** Schema-validate at the View
   boundary. No `innerHTML`, ever.
6. **Feature-detect, never host-detect.** `if (window.openai?.requestModal)`,
   not `if (isChatGPT)`.
7. **Navigate through `openLink`.** The host must be able to show the
   destination and refuse.
8. **Model context carries facts, not prose.** Raw third-party text in
   `updateModelContext` is a prompt injection you built yourself.
9. **Breaking UI change ⇒ new `ui://` URI.** Hosts treat it as a cache key.

## Docs

- `docs/protocol-matrix.md` — the five protocols side by side
- `docs/capability-matrix.md` — per-host API support
- `docs/glossary.md` — terms, with the ones that collide across specs

## License

MIT
