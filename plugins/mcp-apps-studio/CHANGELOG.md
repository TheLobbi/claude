# Changelog

All notable changes to the MCP Apps Studio plugin.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-08-13

Initial release. Expert system for building agent-rendered interactive UI across
five protocols.

### Added

**Commands (14)** — namespace `/ui:`

- `/ui:protocol` — choose the protocol stack, with rejected alternatives and the
  conditions that would flip the decision
- `/ui:new` — scaffold a runnable project for any supported protocol
- `/ui:tool` — design the tool surface: naming, descriptions, schemas, the
  decoupled data/render split, visibility, discovery testing
- `/ui:component` — author the View: display mode, four states, theming,
  accessibility
- `/ui:bridge` — implement or repair the host bridge and the portable adapter
- `/ui:state` — place state in the right ownership tier; survive remount
- `/ui:csp` — derive the minimal CSP and run the widget security review
- `/ui:preview` — local test loop: Inspector, host harness, tunnel, triage table
- `/ui:audit` — full pre-ship review across eight dimensions
- `/ui:port` — migrate between protocols
- `/ui:a2ui` — A2UI catalogs, surfaces, and schema validation
- `/ui:agui` — AG-UI event streams and human-in-the-loop interrupts
- `/ui:copilot` — package and ship into Microsoft 365 Copilot
- `/ui:ship` — requirement → deployed and verified in every target host

**Skills (16)** — the specifications themselves

`mcp-apps-protocol`, `mcp-apps-sdk`, `mcp-ui-sdk`, `openai-apps-sdk`,
`a2ui-protocol`, `ag-ui-protocol`, `host-capability-matrix`,
`protocol-selection`, `tool-metadata-design`, `widget-ux-patterns`,
`ui-state-architecture`, `ui-security-sandbox`, `ui-testing-harness`,
`ui-performance`, `ui-porting-migration`, `m365-copilot-packaging`

**Agents (13)**

`ui-protocol-strategist`, `mcp-app-builder`, `widget-designer`,
`bridge-engineer`, `tool-schema-architect`, `csp-security-auditor`,
`host-compat-auditor`, `a2ui-catalog-designer`, `agui-stream-engineer`,
`ui-accessibility-reviewer`, `ui-state-architect`, `ui-port-migrator`,
`ui-perf-optimizer`

**Templates (7)** — every one scaffolds and passes the validator clean

- `mcp-app-react` — MCP Apps, React + Vite single-file, with a `HostBridge`
  adapter and zod boundary validation
- `mcp-app-vanilla` — MCP Apps, no framework
- `openai-apps-sdk-node` — Apps SDK, Node server + esbuild React component,
  dual-writing standard and alias `_meta`
- `openai-apps-sdk-python` — Apps SDK, FastMCP
- `mcp-ui-server` — mcp-ui, `rawHtml` and `externalUrl` delivery, all five
  action types, async `messageId` flow
- `a2ui-agent` — A2UI catalog plus a streamed surface with two-way binding and
  `CheckRule` validation
- `ag-ui-server` — AG-UI, FastAPI + SSE, with terminal events on every path

**Scripts (4)** — dependency-free Node ESM, CI-ready

- `scaffold-app.mjs` — generate a project from a template with token substitution
- `validate-mcp-app.mjs` — static conformance, CSP, and payload-handling checks
  for TypeScript/JavaScript and Python (FastMCP) projects; exits non-zero on
  blocking findings
- `host-capability-check.mjs` — cross-reference every host API used against each
  target host's support matrix; `--list` prints the matrix
- `preview-host.mjs` — a local MCP Apps host implementing the real `ui/*` bridge
  over `postMessage` in a sandboxed iframe

**Docs**

- `docs/protocol-matrix.md` — the five protocols side by side, with wire formats
- `docs/capability-matrix.md` — per-host support and the runtime/declarative split
- `docs/glossary.md` — terms, cross-protocol equivalents, and the collisions
  where one word means different things in different specs

### Notes

- Both validators are heuristic source scanners and print a LIMITS note saying
  so. They blank comments before scanning and resolve module-level `ui://`
  constant bindings, so neither prose about a dangerous API nor the recommended
  URI-constant pattern produces a false positive.
- A project with no MCP tools or resources is reported as **out of scope**
  rather than as a defect — an AG-UI endpoint is not a broken MCP Apps server.
- `host-capability-check.mjs` separates **runtime** APIs (a View call that
  dead-ends when unsupported — blocking if unguarded) from **declarative**
  server metadata (silently ignored — always advisory, nothing to guard).
- Host support tables are a snapshot of published vendor documentation. Every
  surface that shows one says so and recommends probing
  `getHostCapabilities()` at runtime.
