# MCP Apps Studio — working notes

Guidance for working *inside* this plugin, and for the agent-UI work it drives.

## The mental model

MCP Apps is the substrate. Everything else is positioned against it:

- **mcp-ui** implements MCP Apps and keeps its own action protocol for hosts
  that predate the extension. It adds `externalUrl` and `remoteDom` delivery.
- **OpenAI Apps SDK** is MCP Apps plus ChatGPT-only extensions. Use the standard
  field; reach for `window.openai` only for checkout, files, modals, and widget
  state.
- **A2UI** inverts the model — UI as data, rendered by the client's own widgets.
- **AG-UI** is a different problem: the event stream for long-running agents.

Never present mcp-ui or the Apps SDK as *alternatives* to MCP Apps. They are
additions.

## Defects that ship regularly

Ordered by how often they appear in real code. Every template, agent, and
validator in this plugin targets these specifically.

1. **A UI resource on a data tool.** The host remounts the iframe on every call,
   destroying local state. Fix: data tools (no `resourceUri`) and render tools
   (carry it), with the View calling app-only data tools directly for local
   interactions.
2. **Handlers registered after `connect()`.** The first `tool-result` is dropped.
   Presents as "it works, but only after I click refresh".
3. **CSP in the config argument instead of the resource `contents._meta`.**
   Every network call is blocked at runtime with no visible error. Highest
   confusion-per-character bug in the whole stack.
4. **No `content` on a tool.** Breaks text-only hosts and follow-up reasoning.
5. **`innerHTML` on `structuredContent`.** That payload travelled external
   service → server → model → your DOM.
6. **Unguarded optional host APIs.** They are `undefined`, not throwing — so the
   symptom is a silent dead button, not an error anyone notices in testing.
7. **Raw third-party prose into `updateModelContext`.** A self-inflicted prompt
   injection.
8. **A reused `ui://` URI after a breaking change.** Hosts treat it as a cache
   key; live conversations keep the old View.

## Conventions in this plugin

- Commands are `/ui:<verb>`; the namespace is reserved for this plugin.
- Skills carry the specs; commands orchestrate; agents do the work. When a fact
  belongs in more than one place, it goes in the skill and the others link to it.
- Every capability claim names its consequence, not just the rule — "widget
  remounts on every refresh", not "violates the decoupling guideline".
- Host support tables are a **snapshot**. Say so wherever one appears, and
  recommend `getHostCapabilities()` at runtime.

## Scripts

```bash
node scripts/scaffold-app.mjs --list
node scripts/validate-mcp-app.mjs --strict <root>
node scripts/host-capability-check.mjs --host chatgpt,m365-copilot <root>
node scripts/preview-host.mjs --server http://localhost:3001/mcp
```

All four are dependency-free Node ESM and run from anywhere.

`validate-mcp-app.mjs` and `host-capability-check.mjs` are **heuristic source
scanners**. They blank comments before scanning (so prose about a dangerous API
is not reported as a use of it) and resolve module-level `ui://` constant
bindings in both JS and Python (so the recommended pattern does not look like an
error). They still cannot verify runtime behaviour or server-side authorization
— both print a LIMITS note, and that note must stay.

`validate-mcp-app.mjs` covers TypeScript/JavaScript (`registerAppTool` /
`registerAppResource` / `registerTool` / `registerResource`, plus the View-side
bridge, payload, and capability checks) and Python (FastMCP `@mcp.tool` /
`@mcp.resource`; View-side checks are skipped, since a Python file is a server
with no DOM). A project with no tools and no resources is reported as **out of
scope**, not as a defect — an AG-UI endpoint is not a broken MCP Apps server.

`host-capability-check.mjs` distinguishes **runtime** APIs (a View call that
dead-ends when unsupported — blocking if unguarded) from **declarative** server
metadata (silently ignored when unsupported — always advisory, nothing to
guard). Keep that distinction when adding matrix rows: tag declarative rows with
`kind: 'declarative'`.

## Changing a template

Templates are the plugin's strongest claim, so they must stay honest:

```bash
node scripts/scaffold-app.mjs --template <t> --name "Test" --into /tmp/t
node scripts/validate-mcp-app.mjs /tmp/t          # must be clean
```

`mcp-ui-server` is the one expected advisory — it registers an `externalUrl`
resource for comparison that no tool points at, and says so in a comment.

Template tokens: `__APP_TITLE__`, `__APP_SLUG__`, `__APP_SNAKE__`,
`__APP_DESCRIPTION__`. Substitution applies to file *names* as well as contents.

## Adding a protocol

1. Write the spec skill first — message shapes, exact field names, the traps.
2. Add a row to `protocol-selection`'s decision tree and axes table, and to
   `docs/protocol-matrix.md`.
3. Add mappings to `ui-porting-migration` in both directions, naming what has
   **no** equivalent rather than dropping it silently.
4. Add a template that scaffolds and validates clean.
5. Extend `host-capability-check.mjs` if it introduces host-visible APIs.

## Repo integration

```bash
pnpm check:marketplace        # manifest + every plugin
pnpm check:plugin-indexes     # generated command/agent indexes
pnpm generate:plugin-indexes  # regenerate after adding a command or agent
```

Command and agent frontmatter is generated — `name`, `intent`, `tags`,
`inputs`, `risk`, `cost` are required and normalized by
`scripts/generate-plugin-indexes.mjs`. Write them, then run the generator; do
not hand-edit `commands/index.json` or `agents/index.json`.
