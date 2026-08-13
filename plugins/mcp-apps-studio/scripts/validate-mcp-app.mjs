#!/usr/bin/env node
/**
 * validate-mcp-app.mjs — static conformance checks for an MCP Apps / Apps SDK project.
 *
 * Heuristic source scanner, not a type checker. It reads .ts/.tsx/.js/.jsx/.mjs
 * and .py files and reports wiring, CSP, and payload-handling defects that are
 * visible without executing anything. A clean run is not proof the app is
 * correct — see the LIMITS note it prints.
 *
 * TypeScript/JavaScript: registerAppTool / registerAppResource / registerTool /
 * registerResource, plus the View-side checks (bridge ordering, untrusted-payload
 * sinks, capability guards).
 * Python: FastMCP `@mcp.tool` / `@mcp.resource` decorators. View-side checks are
 * skipped — a Python file is a server, with no DOM and no host bridge.
 *
 * Out of scope: A2UI (use /ui:a2ui --validate) and AG-UI (use /ui:agui --audit).
 *
 * Usage:
 *   node validate-mcp-app.mjs [root]            # default: cwd
 *   node validate-mcp-app.mjs --csp [root]      # CSP + security findings only
 *   node validate-mcp-app.mjs --strict [root]   # advisories exit non-zero too
 *   node validate-mcp-app.mjs --json [root]     # machine-readable output
 */

import fs from 'node:fs';
import path from 'node:path';

const SOURCE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.py']);
const isPython = (file) => path.extname(file) === '.py';
const SKIP_DIR = new Set(['node_modules', 'dist', 'build', 'coverage', '.git', '.next', 'out']);
const APP_MIME = 'text/html;profile=mcp-app';

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const root = path.resolve(args.find((a) => !a.startsWith('--')) ?? process.cwd());
const cspOnly = flags.has('--csp');
const strict = flags.has('--strict');
const asJson = flags.has('--json');

/** @type {{level:'blocking'|'advisory', rule:string, file:string, line:number, message:string, fix?:string}[]} */
const findings = [];

function add(level, rule, file, line, message, fix) {
  findings.push({ level, rule, file: path.relative(root, file) || path.basename(file), line, message, fix });
}

function walk(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIR.has(entry.name)) walk(full, out);
    } else if (SOURCE_EXT.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

/**
 * Blank out comments while preserving every byte offset and line break, so
 * findings still report accurate positions. A naive strip is not an option:
 * `ui://…` and `https://…` inside string literals would be mangled, so this
 * tracks string and template state as it goes.
 *
 * Without this, a comment saying "never use dangerouslySetInnerHTML" is
 * reported as a use of dangerouslySetInnerHTML.
 */
function blankComments(text, python = false) {
  if (python) {
    // Python: `#` comments outside string literals. Triple-quoted docstrings are
    // left alone — they are string literals, and blanking them would hide URIs.
    return text.split('\n').map((line) => {
      let quote = null;
      for (let i = 0; i < line.length; i += 1) {
        const ch = line[i];
        if (ch === '\\') { i += 1; continue; }
        if (quote) { if (ch === quote) quote = null; continue; }
        if (ch === "'" || ch === '"') { quote = ch; continue; }
        if (ch === '#') return line.slice(0, i) + ' '.repeat(line.length - i);
      }
      return line;
    }).join('\n');
  }
  const out = text.split('');
  let i = 0;
  let state = 'code'; // code | line | block | single | double | tick
  while (i < text.length) {
    const ch = text[i];
    const next = text[i + 1];
    if (state === 'code') {
      if (ch === '/' && next === '/') { state = 'line'; out[i] = ' '; out[i + 1] = ' '; i += 2; continue; }
      if (ch === '/' && next === '*') { state = 'block'; out[i] = ' '; out[i + 1] = ' '; i += 2; continue; }
      if (ch === "'") state = 'single';
      else if (ch === '"') state = 'double';
      else if (ch === '`') state = 'tick';
      i += 1; continue;
    }
    if (state === 'line') {
      if (ch === '\n') { state = 'code'; i += 1; continue; }
      out[i] = ' '; i += 1; continue;
    }
    if (state === 'block') {
      if (ch === '*' && next === '/') { state = 'code'; out[i] = ' '; out[i + 1] = ' '; i += 2; continue; }
      if (ch !== '\n') out[i] = ' ';
      i += 1; continue;
    }
    // inside a string literal
    if (ch === '\\') { i += 2; continue; }
    if ((state === 'single' && ch === "'") || (state === 'double' && ch === '"') || (state === 'tick' && ch === '`')) {
      state = 'code';
    }
    i += 1;
  }
  return out.join('');
}

/** Blank out JSX `{/* … *\/}` comment expressions, preserving offsets. */
function blankJsxComments(text) {
  return text.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, (match) =>
    match.replace(/[^\n]/g, ' '));
}

/** Extract every literal `ui://...` string with its position. */
function findUiUris(text) {
  const out = [];
  const re = /['"`](ui:\/\/[^'"`\s]+)['"`]/g;
  let m;
  while ((m = re.exec(text)) !== null) out.push({ uri: m[1], index: m.index });
  return out;
}

/**
 * Map module-level `const NAME = 'ui://…'` bindings so a registration that
 * references the identifier still resolves. Holding the URI in a const is the
 * recommended pattern, so failing to follow it would flag every correct project.
 */
function uriConstants(text) {
  const map = new Map();
  // JS/TS: const|let|var NAME = 'ui://…'   ·   Python: NAME = "ui://…"
  const re = /(?:^|\n)\s*(?:(?:const|let|var)\s+)?([A-Za-z_$][\w$]*)\s*(?::[^=\n]+)?=\s*['"`](ui:\/\/[^'"`\s]+)['"`]/g;
  let m;
  while ((m = re.exec(text)) !== null) map.set(m[1], m[2]);
  return map;
}

/** Literal ui:// strings in `snippet`, plus any resolved via `constants`. */
function resolveUiUris(snippet, constants) {
  const found = findUiUris(snippet).map((u) => u.uri);
  for (const [name, uri] of constants) {
    if (new RegExp(`\\b${name}\\b`).test(snippet)) found.push(uri);
  }
  return [...new Set(found)];
}

/**
 * True when `api` is guarded at or shortly before `lineIndex`. Guards routinely
 * sit on an earlier line — an early return, or an `if` opening a block — so a
 * line-scoped check alone produces false positives on correct code.
 */
function isGuarded(lines, lineIndex, api) {
  const line = lines[lineIndex];
  if (line.includes(`?.${api}`)) return true;
  if (new RegExp(`\\b${api}\\s*(?:&&|\\?)`).test(line)) return true;

  const WINDOW = 6;
  for (let i = Math.max(0, lineIndex - WINDOW); i <= lineIndex; i += 1) {
    const prior = lines[i];
    if (!new RegExp(`\\b${api}\\b`).test(prior)) continue;
    // if (!app.foo) return / if (app.foo) { / typeof app.foo === 'function' /
    // const caps = { canX: typeof app.foo === 'function' }
    if (/\b(if|return|typeof|&&|\|\||\?)\b/.test(prior) && !new RegExp(`${api}\\s*\\(`).test(prior)) {
      return true;
    }
  }
  return false;
}

/**
 * Slice the balanced-brace region that follows `startIndex`, so we can inspect a
 * single registration call without a real parser. Returns '' if unbalanced.
 */
function balancedSlice(text, startIndex, open = '(', close = ')') {
  const from = text.indexOf(open, startIndex);
  if (from === -1) return '';
  let depth = 0;
  for (let i = from; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === open) depth += 1;
    else if (ch === close) {
      depth -= 1;
      if (depth === 0) return text.slice(from, i + 1);
    }
  }
  return '';
}

const files = walk(root);
if (files.length === 0) {
  console.error(`No JavaScript, TypeScript, or Python source files found under ${root}.`);
  console.error('This validator covers MCP Apps / mcp-ui / Apps SDK servers and their Views.');
  console.error('A2UI catalogs and surface streams are validated by /ui:a2ui --validate;');
  console.error('AG-UI event streams by /ui:agui --audit.');
  process.exit(2);
}

/**
 * FastMCP-style Python registration:
 *
 *   @mcp.tool(name="x", description="…", meta={"ui": {"resourceUri": URI}})
 *   def x(...): ...
 *
 *   @mcp.resource(URI, mime_type=APP_MIME)
 *   def component(): ...
 *
 * The decorator argument list plus the function body up to the next top-level
 * `def`/`@` is treated as the registration, which is enough for the wiring,
 * fallback-content, and schema checks.
 */
function collectPython(file, text, constants) {
  const decoratorRe = /@\s*\w+\s*\.\s*(tool|resource)\s*\(/g;
  let m;
  while ((m = decoratorRe.exec(text)) !== null) {
    const kind = m[1];
    const args = balancedSlice(text, m.index);
    const line = lineOf(text, m.index);

    // Body = the decorated function, from just after the decorator's argument
    // list to the next COLUMN-ZERO `@`, `def`, or `if __name__`. The decorated
    // function's own `def` sits at column zero too, so it is skipped explicitly.
    const argsStart = text.indexOf('(', m.index);
    const rest = text.slice(argsStart + args.length);
    const afterDef = rest.indexOf('\n', rest.search(/\bdef\b/) === -1 ? 0 : rest.search(/\bdef\b/));
    const searchFrom = afterDef === -1 ? 0 : afterDef;
    const nextTopRel = rest.slice(searchFrom).search(/\n(?=@\w|@\s*\w|def\s|if\s+__name__)/);
    const body = nextTopRel === -1 ? rest : rest.slice(0, searchFrom + nextTopRel);
    const unit = args + body;

    if (kind === 'resource') {
      for (const uri of resolveUiUris(args, constants)) {
        if (!registeredResources.has(uri)) registeredResources.set(uri, { file, line });
      }
      continue;
    }

    const nameMatch = args.match(/name\s*=\s*['"]([\w.-]+)['"]/);
    const name = nameMatch ? nameMatch[1] : '<unnamed>';
    const hasResourceUri = /resourceUri/.test(args) || /openai\/outputTemplate/.test(args);

    if (hasResourceUri) {
      toolsWithUi.push({ name, uri: resolveUiUris(args, constants)[0] ?? null, file, line, body: unit });
    } else {
      dataToolNames.add(name);
    }

    if (cspOnly) continue;
    if (!/["']content["']\s*:/.test(unit)) {
      add('blocking', 'missing-text-fallback', file, line,
        `Tool "${name}" never returns a "content" list.`,
        'Return "content": [{"type": "text", "text": "…"}] so text-only hosts and the model can still use the tool.');
    }
    if (!/description\s*=/.test(args)) {
      add('blocking', 'missing-description', file, line,
        `Tool "${name}" has no description — the model cannot tell when to call it.`,
        'Describe what it does, when to call it, what it depends on, and when not to call it.');
    }
  }
}

// ---------------------------------------------------------------------------
// Pass 1 — collect registrations across the whole tree
// ---------------------------------------------------------------------------

const registeredResources = new Map(); // uri -> { file, line }
const toolsWithUi = [];                // { name, uri, file, line, body }
const dataToolNames = new Set();
const sources = new Map();             // file -> text

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  sources.set(file, text);
  const constants = uriConstants(text);

  if (isPython(file)) {
    collectPython(file, text, constants);
    continue;
  }

  // registerAppResource(server, name, uri, config, handler) | server.registerResource(...)
  const resRe = /\b(registerAppResource|registerResource)\s*\(/g;
  let m;
  while ((m = resRe.exec(text)) !== null) {
    const call = balancedSlice(text, m.index);
    for (const uri of resolveUiUris(call, constants)) {
      if (!registeredResources.has(uri)) {
        registeredResources.set(uri, { file, line: lineOf(text, m.index) });
      }
    }
  }

  // registerAppTool(server, "name", { ... }, handler) | server.registerTool("name", {...})
  const toolRe = /\b(registerAppTool|registerTool)\s*\(/g;
  while ((m = toolRe.exec(text)) !== null) {
    const call = balancedSlice(text, m.index);
    const nameMatch = call.match(/['"`]([a-zA-Z_][\w.-]*)['"`]/);
    const name = nameMatch ? nameMatch[1] : '<unnamed>';
    const line = lineOf(text, m.index);
    const hasResourceUri = /resourceUri\s*:/.test(call) || /openai\/outputTemplate/.test(call);
    if (hasResourceUri) {
      const uri = resolveUiUris(call, constants)[0] ?? null;
      toolsWithUi.push({ name, uri, file, line, body: call });
    } else {
      dataToolNames.add(name);
    }

    // --- per-tool checks -------------------------------------------------
    if (!cspOnly) {
      if (!/\bcontent\s*:/.test(call)) {
        add('blocking', 'missing-text-fallback', file, line,
          `Tool "${name}" never returns a \`content\` array.`,
          'Return content: [{ type: "text", text: "…" }] so text-only hosts and the model can still use the tool.');
      }
      if (/structuredContent\s*:/.test(call) && !/outputSchema\s*:/.test(call)) {
        add('advisory', 'missing-output-schema', file, line,
          `Tool "${name}" returns structuredContent with no outputSchema.`,
          'Declare outputSchema so the contract is explicit for the model, the View, and your tests.');
      }
      if (!/description\s*:/.test(call)) {
        add('blocking', 'missing-description', file, line,
          `Tool "${name}" has no description — the model cannot tell when to call it.`,
          'Describe what it does, when to call it, what it depends on, and when not to call it.');
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Pass 2 — cross-registration checks
// ---------------------------------------------------------------------------

if (!cspOnly) {
  for (const tool of toolsWithUi) {
    if (!tool.uri) {
      add('advisory', 'unresolvable-resource-uri', tool.file, tool.line,
        `Tool "${tool.name}" declares a UI resource but the URI is not a literal — cannot verify it resolves.`,
        'Use a module-level const holding a literal ui:// string.');
    } else if (!registeredResources.has(tool.uri)) {
      add('blocking', 'unregistered-resource', tool.file, tool.line,
        `Tool "${tool.name}" points at ${tool.uri}, which no registerAppResource/registerResource call registers.`,
        'Register the resource, or correct the URI.');
    }

    // A tool that both renders and does I/O will remount the widget on every call.
    const doesIo = /\b(await\s+fetch|axios|\.query\(|\.insert\(|\.update\(|\.delete\(|prisma\.|db\.)/.test(tool.body);
    if (doesIo) {
      add('blocking', 'coupled-data-and-render', tool.file, tool.line,
        `Tool "${tool.name}" carries a UI resource and also performs I/O — the widget remounts on every call.`,
        'Split into a data tool (no resourceUri) and a render tool (resourceUri only).');
    }
  }

  for (const [uri, where] of registeredResources) {
    const referenced = toolsWithUi.some((t) => t.uri === uri);
    if (!referenced) {
      add('advisory', 'orphan-resource', where.file, where.line,
        `Resource ${uri} is registered but no tool references it.`,
        'Point a render tool at it via _meta.ui.resourceUri, or remove it.');
    }
    if (!/\/v\d+(\.|$|\/)/.test(uri) && !/v\d+\.html$/.test(uri)) {
      add('advisory', 'unversioned-resource-uri', where.file, where.line,
        `Resource URI ${uri} carries no version segment.`,
        'Hosts treat the URI as a cache key. Use ui://<name>/v1.html so a breaking change can publish a new URI.');
    }
  }

  // Only meaningful if this IS an MCP server. A project with no tools and no
  // resources at all — an AG-UI endpoint, an A2UI agent, a plain library — is
  // out of scope, and is reported as such below rather than as a defect.
  const looksLikeMcpServer = toolsWithUi.length + dataToolNames.size + registeredResources.size > 0;
  if (looksLikeMcpServer && toolsWithUi.length === 0) {
    add('blocking', 'no-ui-tool', root, 0,
      'No tool declares _meta.ui.resourceUri (or openai/outputTemplate) — no host will ever render a widget.',
      'Add _meta: { ui: { resourceUri } } to the render tool.');
  }
}

// ---------------------------------------------------------------------------
// Pass 3 — per-file CSP, mimeType, bridge, and payload-handling checks
// ---------------------------------------------------------------------------

for (const [file, rawText] of sources) {
  const py = isPython(file);
  // Scan with comments blanked so prose about a dangerous API is not reported
  // as a use of it. Offsets and line numbers are preserved.
  const text = py ? blankComments(rawText, true) : blankJsxComments(blankComments(rawText));
  const lines = text.split('\n');
  const hasUiUri = /ui:\/\//.test(text);

  // --- checks that apply to every language --------------------------------

  // mimeType. Python spells it mime_type= on the decorator and "mimeType" in
  // the returned contents dict.
  if (py && hasUiUri && /mime_type\s*=|["']mimeType["']\s*:/.test(text)) {
    if (!text.includes(APP_MIME) && !/APP_MIME|RESOURCE_MIME_TYPE/.test(text)) {
      const idx = text.search(/mime_type\s*=|["']mimeType["']\s*:/);
      add('blocking', 'wrong-mimetype', file, lineOf(text, idx),
        'A ui:// resource is registered without the MCP Apps mimeType.',
        `Use "${APP_MIME}".`);
    }
  }

  // mimeType (JS/TS)
  if (!py && hasUiUri && /mimeType\s*:/.test(text)) {
    const usesConst = /RESOURCE_MIME_TYPE/.test(text);
    const usesLiteral = text.includes(APP_MIME);
    const usesSkybridge = /text\/html\+skybridge/.test(text);
    if (usesSkybridge) {
      const idx = text.indexOf('text/html+skybridge');
      add('advisory', 'legacy-mimetype', file, lineOf(text, idx),
        'Uses the legacy text/html+skybridge mimeType.',
        `Prefer RESOURCE_MIME_TYPE ("${APP_MIME}") for cross-host compatibility.`);
    } else if (!usesConst && !usesLiteral) {
      const idx = text.search(/mimeType\s*:/);
      add('blocking', 'wrong-mimetype', file, lineOf(text, idx),
        'A ui:// resource is registered without the MCP Apps mimeType.',
        `Use RESOURCE_MIME_TYPE from @modelcontextprotocol/ext-apps/server ("${APP_MIME}").`);
    }
  }

  // CSP presence — Python declares it as a "csp" key in the contents dict.
  if (py && hasUiUri && /@\s*\w+\s*\.\s*resource\s*\(/.test(text) && !/["']csp["']\s*:/.test(text)) {
    const idx = text.search(/@\s*\w+\s*\.\s*resource\s*\(/);
    add('advisory', 'no-csp-declared', file, lineOf(text, idx),
      'No _meta.ui.csp declared on the resource.',
      'Declare connectDomains/resourceDomains explicitly — CSP is deny-by-default, so an undeclared origin is a runtime block.');
  }

  // CSP presence and placement (JS/TS).
  const cspIdx = text.search(/\bcsp\s*:/);
  if (!py && hasUiUri && /registerAppResource|registerResource/.test(text)) {
    if (cspIdx === -1) {
      const idx = text.search(/registerAppResource|registerResource/);
      add('advisory', 'no-csp-declared', file, lineOf(text, idx),
        'No _meta.ui.csp declared on the resource.',
        'Declare connectDomains/resourceDomains explicitly — CSP is deny-by-default, so an undeclared origin is a runtime block.');
    } else {
      // CSP must sit inside the `contents:` array, not the config argument.
      const contentsIdx = text.search(/\bcontents\s*:/);
      if (contentsIdx !== -1 && cspIdx < contentsIdx) {
        add('blocking', 'csp-misplaced', file, lineOf(text, cspIdx),
          'csp appears before `contents:` — it is likely in the registerAppResource config argument.',
          'Move csp into the resource contents _meta. Misplaced CSP silently blocks every network call at runtime.');
      }
    }
  }

  // Wildcard origins in any allowlist — whether the key and value share a line
  // or the array spans several.
  let inAllowlist = false;
  for (const [i, line] of lines.entries()) {
    const opensAllowlist = /(connectDomains|resourceDomains|frameDomains|baseUriDomains)\s*:/.test(line);
    if (opensAllowlist) inAllowlist = !/\]/.test(line);
    else if (inAllowlist && /\]/.test(line)) inAllowlist = false;

    if (!opensAllowlist && !inAllowlist) continue;
    if (/['"`]\s*(?:https?:)?\/\/\*|['"`]\*['"`]|['"`]https?:\/\/[^'"`]*\*/.test(line)) {
      add('blocking', 'wildcard-origin', file, i + 1,
        'Wildcard origin in a CSP allowlist.',
        'List exact origins. Each entry is somewhere the View can send rendered data.');
    }
  }

  // --- View-side checks: JS/TS only ---------------------------------------
  // A Python file is a server; it has no DOM, no host bridge, and no iframe.
  // Running these against it would only produce noise.

  // Untrusted-payload sinks.
  const sinks = py ? [] : [
    [/\.innerHTML\s*=/, 'innerHTML assignment'],
    [/\.outerHTML\s*=/, 'outerHTML assignment'],
    [/insertAdjacentHTML\s*\(/, 'insertAdjacentHTML'],
    [/document\.write\s*\(/, 'document.write'],
    [/dangerouslySetInnerHTML/, 'dangerouslySetInnerHTML'],
    [/\beval\s*\(/, 'eval'],
    [/new\s+Function\s*\(/, 'new Function'],
  ];
  for (const [i, line] of lines.entries()) {
    for (const [re, label] of sinks) {
      if (re.test(line)) {
        add('blocking', 'untrusted-html-sink', file, i + 1,
          `${label} — tool payloads are untrusted input (external service → server → model → your DOM).`,
          'Render as text, or sanitize through a vetted sanitizer with an explicit allowlist.');
      }
    }
  }

  // Navigation must be host-mediated.
  if (!py) for (const [i, line] of lines.entries()) {
    if (/\bwindow\.open\s*\(/.test(line) || /\b(top|parent)\.location\s*=/.test(line) || /location\.assign\s*\(/.test(line)) {
      add('blocking', 'unmediated-navigation', file, i + 1,
        'Direct navigation from inside the View.',
        'Use app.openLink({ url }) / ui/open-link so the host can show the destination and refuse.');
    }
  }

  // Handler registration must precede connect().
  const connectIdx = py ? -1 : text.search(/\bapp\s*\.\s*connect\s*\(/);
  if (connectIdx !== -1) {
    const handlerRe = /\bapp\s*\.\s*(ontoolresult|ontoolinput|ontoolinputpartial|onteardown|onhostcontextchanged|ontoolcancelled)\s*=/g;
    let hm;
    while ((hm = handlerRe.exec(text)) !== null) {
      if (hm.index > connectIdx) {
        add('blocking', 'handler-after-connect', file, lineOf(text, hm.index),
          `app.${hm[1]} is assigned after app.connect() — the initial notification is dropped.`,
          'Register every handler before calling connect().');
      }
    }
  }

  // Unguarded optional host APIs.
  const optional = [
    'requestDisplayMode', 'requestModal', 'requestCheckout', 'uploadFile',
    'selectFiles', 'getFileDownloadUrl', 'setWidgetState', 'sendLog',
  ];
  if (!py) for (const [i, line] of lines.entries()) {
    for (const api of optional) {
      // window.openai.foo( or app.foo( — flagged unless optional-chained, or
      // guarded on this line or shortly above (early return, enclosing if).
      const called = new RegExp(`(?:window\\.openai|openai|app)\\s*\\.\\s*${api}\\s*\\(`).test(line);
      if (called && !isGuarded(lines, i, api)) {
        add('blocking', 'unguarded-host-api', file, i + 1,
          `${api} called without a capability guard — it is undefined on hosts that do not implement it.`,
          `Guard with if (app.${api}) / obj?.${api}?.(…) and provide a real fallback.`);
      }
    }
  }

  // Host-name branching.
  if (!py) for (const [i, line] of lines.entries()) {
    if (/\b(isChatGPT|isClaude|isCopilot|hostName\s*===|userAgent\s*.*(ChatGPT|Copilot))/.test(line)) {
      add('advisory', 'host-name-branch', file, i + 1,
        'Branching on host identity rather than capability.',
        'Test for the capability you need; a host-name branch is a permanent fork.');
    }
  }

  // postMessage listener hygiene (hand-rolled bridges).
  if (!py && /addEventListener\s*\(\s*['"`]message['"`]/.test(text)) {
    if (!/event\.source\s*!==\s*window\.parent|event\.source\s*===\s*window\.parent/.test(text)) {
      const idx = text.search(/addEventListener\s*\(\s*['"`]message['"`]/);
      add('blocking', 'unchecked-message-source', file, lineOf(text, idx),
        'message listener does not verify event.source === window.parent.',
        'Any frame on the page can otherwise drive the View.');
    }
    // An MCP Apps bridge must check the JSON-RPC envelope. An mcp-ui-style
    // bridge legitimately dispatches on a `type` discriminator instead, so
    // accept either — flag only a listener that validates neither.
    const checksJsonRpc = /jsonrpc/.test(text);
    const checksDiscriminator = /\.\s*type\s*===\s*['"`]/.test(text)
      || /switch\s*\(\s*\w+(?:\.\w+)*\.type\s*\)/.test(text);
    if (!checksJsonRpc && !checksDiscriminator) {
      const idx = text.search(/addEventListener\s*\(\s*['"`]message['"`]/);
      add('advisory', 'unvalidated-message-envelope', file, lineOf(text, idx),
        'message listener validates neither a JSON-RPC envelope nor a message-type discriminator.',
        'Ignore messages where data.jsonrpc !== "2.0" (MCP Apps) or where data.type is not one you handle (mcp-ui).');
    }
  }

  // Secrets in source.
  for (const [i, line] of lines.entries()) {
    if (/(?:api[_-]?key|secret|token|password|client[_-]?secret)\s*[:=]\s*['"`][A-Za-z0-9_\-]{16,}['"`]/i.test(line)) {
      add('blocking', 'possible-hardcoded-secret', file, i + 1,
        'Possible hardcoded credential — the View bundle is served to the host and readable by the user.',
        'Move it to the server and proxy the privileged call.');
    }
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const blocking = findings.filter((f) => f.level === 'blocking');
const advisory = findings.filter((f) => f.level === 'advisory');

if (asJson) {
  console.log(JSON.stringify({
    root,
    filesScanned: files.length,
    resources: [...registeredResources.keys()],
    uiTools: toolsWithUi.map((t) => ({ name: t.name, uri: t.uri })),
    dataTools: [...dataToolNames],
    findings,
  }, null, 2));
} else {
  console.log(`MCP APP VALIDATE  ${root}`);
  console.log(`  ${files.length} source files · ${registeredResources.size} ui:// resources · ` +
    `${toolsWithUi.length} render tools · ${dataToolNames.size} data tools\n`);

  const print = (list, label) => {
    if (list.length === 0) return;
    console.log(`${label} (${list.length})`);
    for (const f of list) {
      console.log(`  ${f.rule.padEnd(28)} ${f.file}:${f.line}`);
      console.log(`  ${''.padEnd(28)} ${f.message}`);
      if (f.fix) console.log(`  ${''.padEnd(28)} FIX  ${f.fix}`);
      console.log('');
    }
  };

  print(blocking, 'BLOCKING');
  print(advisory, 'ADVISORY');

  if (toolsWithUi.length + dataToolNames.size + registeredResources.size === 0) {
    console.log('No MCP tools or resources found — this does not look like an MCP Apps,');
    console.log('mcp-ui, or Apps SDK project, so there is nothing here for this validator');
    console.log('to check. A2UI: /ui:a2ui --validate. AG-UI: /ui:agui --audit.\n');
  } else if (findings.length === 0) {
    console.log('No findings.\n');
  }
  console.log('LIMITS  Heuristic source scan. It cannot verify runtime behaviour, ' +
    'server-side authorization, or that the widget actually renders. Run /ui:preview for that.');
}

const failed = blocking.length > 0 || (strict && advisory.length > 0);
process.exit(failed ? 1 : 0);
