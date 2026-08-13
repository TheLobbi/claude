#!/usr/bin/env node
/**
 * host-capability-check.mjs — cross-reference the host APIs a View uses against
 * each target host's published support matrix.
 *
 * Usage:
 *   node host-capability-check.mjs --host chatgpt,m365-copilot [root]
 *   node host-capability-check.mjs --list                       # print the matrix
 *   node host-capability-check.mjs --json --host m365-copilot [root]
 *   node host-capability-check.mjs --strict --host m365-copilot [root]
 *
 * The matrix reflects the published Microsoft 365 Copilot support tables and the
 * defining vendor behaviour for ChatGPT and Claude. Host coverage moves — treat
 * this as a snapshot and probe getHostCapabilities() at runtime.
 */

import fs from 'node:fs';
import path from 'node:path';

const SOURCE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.html', '.vue', '.svelte']);
const SKIP_DIR = new Set(['node_modules', 'dist', 'build', 'coverage', '.git', '.next', 'out']);

/**
 * support: true = supported, false = unsupported, 'partial' = supported with a
 * documented restriction (see `note`).
 */
const MATRIX = [
  // --- component bridge ---------------------------------------------------
  { api: 'callTool',              mcpApps: 'callServerTool',        chatgpt: true,  claude: true,  'm365-copilot': true },
  { api: 'callServerTool',        mcpApps: 'callServerTool',        chatgpt: true,  claude: true,  'm365-copilot': true },
  { api: 'toolInput',             mcpApps: 'ontoolinput',           chatgpt: true,  claude: true,  'm365-copilot': true },
  { api: 'ontoolinput',           mcpApps: 'ontoolinput',           chatgpt: true,  claude: true,  'm365-copilot': true },
  { api: 'toolOutput',            mcpApps: 'ontoolresult',          chatgpt: true,  claude: true,  'm365-copilot': true },
  { api: 'ontoolresult',          mcpApps: 'ontoolresult',          chatgpt: true,  claude: true,  'm365-copilot': true },
  { api: 'ontoolinputpartial',    mcpApps: 'ontoolinputpartial',    chatgpt: true,  claude: true,  'm365-copilot': false,
    consequence: 'No streaming skeleton.', workaround: 'Make ontoolinput alone produce an acceptable loading state.' },
  { api: 'ontoolcancelled',       mcpApps: 'ontoolcancelled',       chatgpt: true,  claude: true,  'm365-copilot': false,
    consequence: 'Aborted calls never notify the View.', workaround: 'Time out in-flight rendering yourself.' },
  { api: 'onteardown',            mcpApps: 'onteardown',            chatgpt: true,  claude: true,  'm365-copilot': false,
    consequence: 'No flush signal at unmount; intervals and observers leak.',
    workaround: 'Persist on every meaningful change and guard long-running work with document.hidden.' },
  { api: 'onhostcontextchanged',  mcpApps: 'onhostcontextchanged',  chatgpt: true,  claude: true,  'm365-copilot': false,
    consequence: 'Theme and display-mode changes never reach the View.',
    workaround: 'Read theme once at init and back it with prefers-color-scheme.' },
  { api: 'sendMessage',           mcpApps: 'sendMessage',           chatgpt: true,  claude: true,  'm365-copilot': true },
  { api: 'sendFollowUpMessage',   mcpApps: 'sendMessage',           chatgpt: true,  claude: true,  'm365-copilot': true },
  { api: 'updateModelContext',    mcpApps: 'updateModelContext',    chatgpt: true,  claude: true,  'm365-copilot': true },
  { api: 'requestDisplayMode',    mcpApps: 'requestDisplayMode',    chatgpt: true,  claude: true,  'm365-copilot': 'partial',
    note: 'fullscreen only', consequence: 'No picture-in-picture.', workaround: 'Design for inline + fullscreen only.' },
  { api: 'notifyIntrinsicHeight', mcpApps: 'sendSizeChanged',       chatgpt: true,  claude: true,  'm365-copilot': true },
  { api: 'sendSizeChanged',       mcpApps: 'sendSizeChanged',       chatgpt: true,  claude: true,  'm365-copilot': true },
  { api: 'openExternal',          mcpApps: 'openLink',              chatgpt: true,  claude: true,  'm365-copilot': true },
  { api: 'openLink',              mcpApps: 'openLink',              chatgpt: true,  claude: true,  'm365-copilot': true },
  { api: 'setOpenInAppUrl',       mcpApps: null,                    chatgpt: true,  claude: false, 'm365-copilot': true },
  { api: 'widgetState',           mcpApps: null,                    chatgpt: true,  claude: false, 'm365-copilot': true },
  { api: 'setWidgetState',        mcpApps: null,                    chatgpt: true,  claude: false, 'm365-copilot': true,
    consequence: 'No widget-scoped persistence on hosts without it.',
    workaround: 'Use updateModelContext for the model-visible slice; move durable state to your server.' },
  { api: 'uploadFile',            mcpApps: null,                    chatgpt: true,  claude: false, 'm365-copilot': false,
    consequence: 'No user file upload from the View.', workaround: 'Server-side upload endpoint reached via openLink.' },
  { api: 'selectFiles',           mcpApps: null,                    chatgpt: true,  claude: false, 'm365-copilot': false,
    consequence: 'No host file picker.', workaround: 'Server-side flow.' },
  { api: 'getFileDownloadUrl',    mcpApps: null,                    chatgpt: true,  claude: false, 'm365-copilot': false,
    consequence: 'Cannot resolve file IDs to URLs.', workaround: 'Return signed URLs from a server tool.' },
  { api: 'requestModal',          mcpApps: null,                    chatgpt: true,  claude: false, 'm365-copilot': false,
    consequence: 'No host-controlled modal.', workaround: 'Build an in-widget overlay.' },
  { api: 'requestCheckout',       mcpApps: null,                    chatgpt: 'partial', claude: false, 'm365-copilot': false,
    note: 'private beta', consequence: 'No embedded payment sheet.', workaround: 'External checkout on your own domain.' },
  { api: 'sendLog',               mcpApps: 'sendLog',               chatgpt: true,  claude: true,  'm365-copilot': false,
    consequence: 'No host-side logging.', workaround: 'A ?debug flag revealing an on-screen log pane.' },
  { api: 'getHostCapabilities',   mcpApps: 'getHostCapabilities',   chatgpt: true,  claude: true,  'm365-copilot': true },
  { api: 'getHostVersion',        mcpApps: 'getHostVersion',        chatgpt: true,  claude: true,  'm365-copilot': false },
  { api: 'availableDisplayModes', mcpApps: 'availableDisplayModes', chatgpt: true,  claude: true,  'm365-copilot': false,
    consequence: 'Cannot enumerate supported modes.', workaround: 'Default to ["inline"] and feature-detect requestDisplayMode.' },
  { api: 'toolInfo',              mcpApps: 'toolInfo',              chatgpt: true,  claude: true,  'm365-copilot': false },

  // --- tool descriptor _meta ---------------------------------------------
  { kind: 'declarative', api: 'openai/outputTemplate',           mcpApps: '_meta.ui.resourceUri', chatgpt: true, claude: true,  'm365-copilot': true },
  { kind: 'declarative', api: 'openai/widgetAccessible',         mcpApps: '_meta.ui.visibility',  chatgpt: true, claude: false, 'm365-copilot': false,
    consequence: 'Ignored.', workaround: 'Use _meta.ui.visibility instead.' },
  { kind: 'declarative', api: 'openai/visibility',               mcpApps: '_meta.ui.visibility',  chatgpt: true, claude: true,  'm365-copilot': true },
  { kind: 'declarative', api: 'openai/toolInvocation/invoking',  mcpApps: null, chatgpt: true, claude: false, 'm365-copilot': false,
    consequence: 'No custom progress text.', workaround: 'Put status inside the widget.' },
  { kind: 'declarative', api: 'openai/toolInvocation/invoked',   mcpApps: null, chatgpt: true, claude: false, 'm365-copilot': false,
    consequence: 'No custom completion text.', workaround: 'Put status inside the widget.' },
  { kind: 'declarative', api: 'openai/fileParams',               mcpApps: null, chatgpt: true, claude: false, 'm365-copilot': false },

  // --- resource _meta -----------------------------------------------------
  { kind: 'declarative', api: 'openai/widgetDescription', mcpApps: null,                 chatgpt: true, claude: false, 'm365-copilot': false },
  { kind: 'declarative', api: 'prefersBorder',            mcpApps: '_meta.ui.prefersBorder', chatgpt: true, claude: true, 'm365-copilot': false,
    consequence: 'Border request silently ignored.', workaround: 'Do not depend on it visually.' },
  { kind: 'declarative', api: 'openai/widgetDomain',      mcpApps: '_meta.ui.domain',    chatgpt: true, claude: true,  'm365-copilot': false },

  // --- CSP ----------------------------------------------------------------
  { kind: 'declarative', api: 'connectDomains',  mcpApps: 'csp.connectDomains',  chatgpt: true, claude: true, 'm365-copilot': true },
  { kind: 'declarative', api: 'resourceDomains', mcpApps: 'csp.resourceDomains', chatgpt: true, claude: true, 'm365-copilot': true },
  { kind: 'declarative', api: 'frameDomains',    mcpApps: 'csp.frameDomains',    chatgpt: true, claude: true, 'm365-copilot': false,
    consequence: 'Nested iframes never render.', workaround: 'Inline the capability, or degrade to openLink.' },
  { kind: 'declarative', api: 'baseUriDomains',  mcpApps: 'csp.baseUriDomains',  chatgpt: false, claude: true, 'm365-copilot': false },

  // --- annotations --------------------------------------------------------
  { kind: 'declarative', api: 'readOnlyHint',    mcpApps: 'readOnlyHint',    chatgpt: true, claude: true, 'm365-copilot': true },
  { kind: 'declarative', api: 'destructiveHint', mcpApps: 'destructiveHint', chatgpt: true, claude: true, 'm365-copilot': false,
    consequence: 'No host confirmation prompt for destructive tools.', workaround: 'Build confirmation into your own UI.' },
  { kind: 'declarative', api: 'idempotentHint',  mcpApps: 'idempotentHint',  chatgpt: true, claude: true, 'm365-copilot': false },
  { kind: 'declarative', api: 'openWorldHint',   mcpApps: 'openWorldHint',   chatgpt: true, claude: true, 'm365-copilot': false },
];

const KNOWN_HOSTS = ['chatgpt', 'claude', 'm365-copilot'];

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith('--')));
const hostArg = argv.find((a) => a.startsWith('--host='))?.split('=')[1]
  ?? (argv.includes('--host') ? argv[argv.indexOf('--host') + 1] : null);
const positional = argv.filter((a) => !a.startsWith('--') && a !== hostArg);
const root = path.resolve(positional[0] ?? process.cwd());
const strict = flags.has('--strict');
const asJson = flags.has('--json');

if (flags.has('--list')) {
  const pad = (s, n) => String(s).padEnd(n);
  const cell = (v, note) => (v === true ? '✓' : v === false ? '✗' : `~ ${note ?? ''}`.trim());
  console.log(`${pad('API', 34)}${pad('MCP Apps equivalent', 30)}${pad('chatgpt', 10)}${pad('claude', 10)}m365-copilot`);
  for (const row of MATRIX) {
    console.log(
      pad(row.api, 34) + pad(row.mcpApps ?? '—', 30) +
      pad(cell(row.chatgpt, row.note), 10) + pad(cell(row.claude, row.note), 10) + cell(row['m365-copilot'], row.note),
    );
  }
  console.log('\n✓ supported · ✗ unsupported · ~ supported with a restriction');
  console.log('Snapshot only — probe getHostCapabilities() at runtime.');
  process.exit(0);
}

const hosts = (hostArg ? hostArg.split(',') : ['chatgpt', 'claude']).map((h) => h.trim());
const unknown = hosts.filter((h) => !KNOWN_HOSTS.includes(h));
if (unknown.length > 0) {
  console.error(`Unknown host(s): ${unknown.join(', ')}. Known: ${KNOWN_HOSTS.join(', ')}`);
  process.exit(2);
}

function walk(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIR.has(entry.name)) walk(full, out);
    } else if (SOURCE_EXT.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

const files = walk(root);
if (files.length === 0) {
  console.error(`No source files found under ${root}`);
  process.exit(2);
}

/** @type {Map<string, {file:string,line:number,guarded:boolean}[]>} */
const usages = new Map();

for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  for (const [i, line] of lines.entries()) {
    for (const row of MATRIX) {
      const { api } = row;
      let used = false;
      if (api.includes('/')) {
        used = line.includes(api);
      } else {
        // method call, property read, or object key
        used = new RegExp(`(?:\\.|\\b)${api}\\s*(?:\\(|\\?\\.|[:=,)\\]}]|$)`).test(line);
      }
      if (!used) continue;
      // A CSP allowlist declared empty means the capability is NOT in use —
      // `frameDomains: []` is the safe default, not a portability risk.
      if (/^(connect|resource|frame|baseUri)Domains$/.test(api)
        && new RegExp(`${api}\\s*:\\s*\\[\\s*\\]`).test(line)) continue;
      const guarded = line.includes(`?.${api}`)
        || new RegExp(`(?:if|&&|\\|\\||\\?)\\s*[^\\n]*\\b${api}\\b`).test(line)
        || new RegExp(`\\b${api}\\s*(?:&&|\\?)`).test(line);
      if (!usages.has(api)) usages.set(api, []);
      usages.get(api).push({ file: path.relative(root, file), line: i + 1, guarded });
    }
  }
}

const findings = [];
for (const [api, sites] of usages) {
  const row = MATRIX.find((r) => r.api === api);
  const declarative = row.kind === 'declarative';
  for (const host of hosts) {
    const support = row[host];
    if (support === true) continue;
    // Only a RUNTIME View API can dead-end: it is undefined, the call does
    // nothing, and the user gets a silent broken control. Declarative server
    // metadata cannot be "guarded" — an unsupported field is simply ignored,
    // which is a design note, not a defect.
    const anyUnguarded = sites.some((s) => !s.guarded);
    const level = !declarative && support === false && anyUnguarded ? 'blocking' : 'advisory';
    findings.push({
      level, api, host, declarative,
      support: support === 'partial' ? `partial (${row.note ?? 'restricted'})` : 'unsupported',
      consequence: row.consequence ?? 'Silently ignored on this host.',
      workaround: declarative
        ? (row.workaround ?? 'Do not depend on this field being honored.')
        : (row.workaround ?? 'Feature-detect and provide a fallback.'),
      sites,
    });
  }
}

const blocking = findings.filter((f) => f.level === 'blocking');
const advisory = findings.filter((f) => f.level === 'advisory');

if (asJson) {
  console.log(JSON.stringify({ root, hosts, filesScanned: files.length, findings }, null, 2));
} else {
  console.log(`HOST CAPABILITY CHECK  ${root}`);
  console.log(`  hosts: ${hosts.join(', ')} · ${files.length} files · ${usages.size} host APIs detected\n`);

  const pad = (s, n) => `${s}`.padEnd(n);
  const COL = 20;
  console.log(pad('API', 32) + pad('kind', 13) + hosts.map((h) => pad(h, COL)).join('') + pad('used', 6) + 'guarded');
  for (const [api, sites] of [...usages.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const row = MATRIX.find((r) => r.api === api);
    const cells = hosts
      .map((h) => pad(row[h] === true ? '✓' : row[h] === false ? '✗' : `~ ${row.note ?? 'partial'}`, COL))
      .join('');
    const kind = row.kind === 'declarative' ? 'declarative' : 'runtime';
    // "guarded" is meaningless for a declarative field — nothing to guard.
    const guarded = row.kind === 'declarative'
      ? 'n/a'
      : sites.every((s) => s.guarded) ? '✓' : sites.some((s) => s.guarded) ? 'partial' : '✗';
    console.log(pad(api, 32) + pad(kind, 13) + cells + pad(String(sites.length), 6) + guarded);
  }
  console.log('');

  const print = (list, label) => {
    if (list.length === 0) return;
    console.log(`${label} (${list.length})`);
    for (const f of list) {
      console.log(`  ${f.api} — ${f.support} on ${f.host}`);
      console.log(`    ${f.consequence}`);
      console.log(`    FIX  ${f.workaround}`);
      for (const s of f.sites.slice(0, 5)) {
        // "guarded" only means something for a runtime call.
        const suffix = f.declarative ? '' : s.guarded ? ' (guarded)' : ' (UNGUARDED)';
        console.log(`    ${f.declarative ? 'declared at' : 'at'} ${s.file}:${s.line}${suffix}`);
      }
      console.log('');
    }
  };
  print(blocking, 'BLOCKING');
  print(advisory, 'ADVISORY');

  if (findings.length === 0) console.log('Every detected host API is supported on all target hosts.\n');
  console.log('NOTE  This matrix is a snapshot of published vendor support. Probe ' +
    'getHostCapabilities() at runtime rather than trusting it indefinitely.');
}

process.exit(blocking.length > 0 || (strict && advisory.length > 0) ? 1 : 0);
