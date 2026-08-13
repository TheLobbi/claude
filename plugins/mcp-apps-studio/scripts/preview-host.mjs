#!/usr/bin/env node
/**
 * preview-host.mjs — a minimal, dependency-free MCP Apps host.
 *
 * Connects to a Streamable-HTTP MCP server, lists its tools, and renders any
 * ui:// resource in a sandboxed iframe with the real ui/* JSON-RPC bridge over
 * postMessage. Enough to catch lifecycle ordering, CSP blocks, capability
 * guards, and remount behaviour without cloning the ext-apps repo.
 *
 * It is a development harness, not a conformance host: no auth, no persistence,
 * and only the bridge methods listed in the Implements table below.
 *
 * Usage:
 *   node preview-host.mjs                                   # server :3001, host :8080
 *   node preview-host.mjs --server http://localhost:3001/mcp --port 8080
 */

import http from 'node:http';

const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const inline = argv.find((a) => a.startsWith(`--${name}=`));
  if (inline) return inline.slice(name.length + 3);
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
};

const SERVER_URL = opt('server', 'http://localhost:3001/mcp');
const PORT = Number(opt('port', '8080'));

let nextRpcId = 1;

/** One JSON-RPC call to the MCP server over Streamable HTTP. */
async function rpc(method, params = {}) {
  const res = await fetch(SERVER_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: nextRpcId++, method, params }),
  });

  const raw = await res.text();
  if (!res.ok) throw new Error(`${method} → HTTP ${res.status}: ${raw.slice(0, 400)}`);

  // Streamable HTTP may answer as JSON or as a one-shot SSE frame.
  const body = raw.trimStart().startsWith('event:') || raw.trimStart().startsWith('data:')
    ? raw.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trim()).join('')
    : raw;

  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new Error(`${method} → unparseable response: ${raw.slice(0, 400)}`);
  }
  if (parsed.error) throw new Error(`${method} → ${parsed.error.message ?? JSON.stringify(parsed.error)}`);
  return parsed.result;
}

async function initialize() {
  return rpc('initialize', {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'mcp-apps-studio-preview-host', version: '1.0.0' },
  });
}

/* -------------------------------------------------------------------------- */
/* The host page                                                              */
/* -------------------------------------------------------------------------- */

const PAGE = /* html */ `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" />
<title>MCP Apps preview host</title>
<style>
  :root { color-scheme: light dark; }
  body { margin:0; font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif; font-size:14px; }
  header { display:flex; gap:10px; align-items:center; padding:10px 14px; border-bottom:1px solid #8883; flex-wrap:wrap; }
  select, button, input { font:inherit; padding:6px 10px; border-radius:6px; border:1px solid #8886; background:transparent; color:inherit; }
  button { cursor:pointer; }
  main { display:grid; grid-template-columns: 1fr 420px; gap:0; height:calc(100vh - 53px); }
  #stage { padding:16px; overflow:auto; }
  #frame { width:100%; border:1px solid #8883; border-radius:10px; background:#fff; }
  @media (prefers-color-scheme: dark) { #frame { background:#141416; } }
  #log { border-left:1px solid #8883; padding:12px; overflow:auto; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:12px; }
  .entry { padding:4px 0; border-bottom:1px solid #8882; white-space:pre-wrap; word-break:break-word; }
  .in { color:#2563eb; } .out { color:#16a34a; } .err { color:#dc2626; }
  @media (prefers-color-scheme: dark) { .in { color:#60a5fa; } .out { color:#4ade80; } .err { color:#f87171; } }
  label { display:flex; gap:6px; align-items:center; }
</style></head>
<body>
<header>
  <strong>MCP Apps preview host</strong>
  <select id="tool"></select>
  <input id="args" placeholder='{"query":"test"}' size="34" />
  <button id="call">Call tool</button>
  <label>theme
    <select id="theme"><option value="light">light</option><option value="dark">dark</option></select>
  </label>
  <label>mode
    <select id="mode"><option>inline</option><option>fullscreen</option></select>
  </label>
  <button id="clear">Clear log</button>
</header>
<main>
  <div id="stage"><p id="hint">Pick a tool and call it. Tools carrying <code>_meta.ui.resourceUri</code> render a View.</p></div>
  <div id="log"></div>
</main>
<script>
const $ = (id) => document.getElementById(id);
let tools = [];
let currentFrame = null;
let hostContext = {
  theme: 'light', displayMode: 'inline',
  availableDisplayModes: ['inline', 'fullscreen'],
  viewport: { maxHeight: 640 },
  safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 },
  locale: navigator.language || 'en-US',
  userAgent: 'mcp-apps-studio-preview-host/1.0',
};

function log(kind, label, data) {
  const el = document.createElement('div');
  el.className = 'entry ' + kind;
  el.textContent = label + (data === undefined ? '' : ' ' + JSON.stringify(data));
  $('log').prepend(el);
}

async function api(path, body) {
  const res = await fetch(path, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json;
}

async function loadTools() {
  const { result } = await api('/api/tools');
  tools = result.tools ?? [];
  $('tool').innerHTML = tools.map((t) => {
    const ui = t._meta?.ui?.resourceUri ?? t._meta?.['openai/outputTemplate'];
    return '<option value="' + t.name + '">' + t.name + (ui ? ' 🖼' : '') + '</option>';
  }).join('');
  log('out', 'tools/list', tools.map((t) => t.name));
}

async function callTool() {
  const name = $('tool').value;
  const tool = tools.find((t) => t.name === name);
  let args = {};
  try { args = $('args').value.trim() ? JSON.parse($('args').value) : {}; }
  catch { log('err', 'arguments are not valid JSON'); return; }

  const resourceUri = tool?._meta?.ui?.resourceUri ?? tool?._meta?.['openai/outputTemplate'];
  log('in', 'tools/call ' + name, args);

  // Mount the View BEFORE the result arrives, and deliver tool-input first —
  // that is the real host ordering, and it is what surfaces skeleton bugs.
  if (resourceUri) {
    await mountView(resourceUri);
    post({ jsonrpc: '2.0', method: 'ui/notifications/tool-input', params: args });
  }

  try {
    const { result } = await api('/api/call', { name, arguments: args });
    log('out', 'result', { keys: Object.keys(result ?? {}) });
    if (resourceUri) post({ jsonrpc: '2.0', method: 'ui/notifications/tool-result', params: result });
    else $('stage').innerHTML = '<pre>' + JSON.stringify(result, null, 2).replace(/</g, '&lt;') + '</pre>';
  } catch (e) {
    log('err', 'tools/call failed: ' + e.message);
  }
}

async function mountView(uri) {
  const { result } = await api('/api/resource', { uri });
  const entry = result.contents?.[0];
  if (!entry?.text) { log('err', 'resource has no text: ' + uri); return; }

  const csp = entry._meta?.ui?.csp;
  log('out', 'resource ' + uri, { mimeType: entry.mimeType, bytes: entry.text.length, csp });
  if (entry.mimeType && !entry.mimeType.includes('profile=mcp-app')) {
    log('err', 'mimeType is not text/html;profile=mcp-app — real hosts may refuse this');
  }

  $('stage').innerHTML = '';
  const frame = document.createElement('iframe');
  frame.id = 'frame';
  // Same isolation posture as a real host: no same-origin, no top navigation.
  frame.setAttribute('sandbox', 'allow-scripts allow-forms allow-popups-to-escape-sandbox');
  frame.style.height = '420px';
  frame.srcdoc = entry.text;
  $('stage').appendChild(frame);
  currentFrame = frame;

  await new Promise((r) => frame.addEventListener('load', r, { once: true }));
}

function post(msg) {
  currentFrame?.contentWindow?.postMessage(msg, '*');
}

// --- the bridge ------------------------------------------------------------
window.addEventListener('message', async (event) => {
  if (!currentFrame || event.source !== currentFrame.contentWindow) return;
  const msg = event.data;
  if (!msg || msg.jsonrpc !== '2.0' || !msg.method) return;

  log('in', 'view → ' + msg.method, msg.params);
  const reply = (result) => msg.id !== undefined && post({ jsonrpc: '2.0', id: msg.id, result });
  const fail = (message) => msg.id !== undefined
    && post({ jsonrpc: '2.0', id: msg.id, error: { code: -32000, message } });

  switch (msg.method) {
    case 'ui/initialize':
      reply({ hostContext, capabilities: { tools: {}, resources: {} } });
      post({ jsonrpc: '2.0', method: 'ui/notifications/initialized', params: {} });
      break;
    case 'tools/call':
      try {
        const { result } = await api('/api/call', { name: msg.params?.name, arguments: msg.params?.arguments ?? {} });
        reply(result);
      } catch (e) { fail(e.message); }
      break;
    case 'resources/read':
      try {
        const { result } = await api('/api/resource', { uri: msg.params?.uri });
        reply(result);
      } catch (e) { fail(e.message); }
      break;
    case 'ui/size-changed':
      if (currentFrame && msg.params?.height) {
        currentFrame.style.height = Math.min(Number(msg.params.height) + 8, 900) + 'px';
      }
      reply({});
      break;
    case 'ui/request-display-mode': {
      const wanted = msg.params?.mode;
      const granted = hostContext.availableDisplayModes.includes(wanted) ? wanted : 'inline';
      hostContext = { ...hostContext, displayMode: granted };
      $('mode').value = granted;
      if (currentFrame) currentFrame.style.height = granted === 'fullscreen' ? '80vh' : '420px';
      reply({ mode: granted });
      post({ jsonrpc: '2.0', method: 'ui/notifications/host-context-changed', params: hostContext });
      break;
    }
    case 'ui/open-link':
      log('out', 'host would navigate to', msg.params?.url);
      reply({});
      break;
    case 'ui/message':
    case 'ui/update-model-context':
      reply({});
      break;
    default:
      // Unimplemented methods answer with an error rather than hanging, so the
      // View exercises its failure path instead of silently stalling.
      fail('preview-host does not implement ' + msg.method);
  }
});

$('call').onclick = callTool;
$('clear').onclick = () => { $('log').innerHTML = ''; };
$('theme').onchange = () => {
  hostContext = { ...hostContext, theme: $('theme').value };
  post({ jsonrpc: '2.0', method: 'ui/notifications/host-context-changed', params: hostContext });
};
$('mode').onchange = () => {
  hostContext = { ...hostContext, displayMode: $('mode').value };
  if (currentFrame) currentFrame.style.height = $('mode').value === 'fullscreen' ? '80vh' : '420px';
  post({ jsonrpc: '2.0', method: 'ui/notifications/host-context-changed', params: hostContext });
};

loadTools().catch((e) => log('err', 'could not list tools: ' + e.message));
</script>
</body></html>`;

/* -------------------------------------------------------------------------- */
/* The server                                                                 */
/* -------------------------------------------------------------------------- */

function readJson(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch { resolve({}); }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const send = (code, payload, type = 'application/json') => {
    res.writeHead(code, { 'content-type': type });
    res.end(type === 'application/json' ? JSON.stringify(payload) : payload);
  };

  try {
    if (req.method === 'GET' && (req.url === '/' || req.url.startsWith('/?'))) {
      return send(200, PAGE, 'text/html; charset=utf-8');
    }
    if (req.method === 'POST' && req.url === '/api/tools') {
      return send(200, { result: await rpc('tools/list') });
    }
    if (req.method === 'POST' && req.url === '/api/call') {
      const { name, arguments: args } = await readJson(req);
      return send(200, { result: await rpc('tools/call', { name, arguments: args ?? {} }) });
    }
    if (req.method === 'POST' && req.url === '/api/resource') {
      const { uri } = await readJson(req);
      return send(200, { result: await rpc('resources/read', { uri }) });
    }
    send(404, { error: 'not found' });
  } catch (e) {
    send(500, { error: e instanceof Error ? e.message : String(e) });
  }
});

try {
  const info = await initialize();
  console.log(`Connected to ${SERVER_URL} — ${info?.serverInfo?.name ?? 'unknown server'}`);
} catch (e) {
  console.error(`Could not reach ${SERVER_URL}: ${e.message}`);
  console.error('Start your MCP server first (npm run serve), then re-run this.');
  process.exit(1);
}

server.listen(PORT, () => {
  console.log(`Preview host on http://localhost:${PORT}`);
  console.log('\nImplements: ui/initialize, tools/call, resources/read, ui/size-changed,');
  console.log('ui/request-display-mode, ui/open-link, ui/message, ui/update-model-context,');
  console.log('and the tool-input / tool-result / initialized / host-context-changed notifications.');
  console.log('Anything else answers with an error so the View exercises its failure path.');
  console.log('\nThis is a development harness, not a conformance host. Verify in a real host before shipping.');
});
