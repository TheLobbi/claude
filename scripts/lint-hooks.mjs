import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const MAX_PROMPT_LENGTH = 280;
// Native Claude Code lifecycle events (object-keyed hooks form). Unknown PascalCase
// keys are allowed (Claude Code adds events over time) but flagged as a notice.
const KNOWN_EVENTS = new Set([
  'SessionStart', 'SessionEnd', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse',
  'PostToolUseFailure', 'PreSubagentCreate', 'SubagentStart', 'SubagentStop',
  'Stop', 'Notification', 'PreCompact', 'TaskCompleted',
]);
// Legacy declarative-array form (kept for back-compat with the canonical schema).
const SEVERITIES = new Set(['advisory', 'warn', 'block']);
const SCOPES = new Set(['session', 'prompt', 'tool', 'task']);

function listHookFiles() {
  return fs.readdirSync(path.join(ROOT, 'plugins'))
    .map((plugin) => path.join(ROOT, 'plugins', plugin, 'hooks', 'hooks.json'))
    .filter((file) => fs.existsSync(file));
}
function rel(file) { return path.relative(ROOT, file); }

const errors = [];
const notices = [];

function lintNative(file, hooks) {
  for (const [event, groups] of Object.entries(hooks)) {
    const ev = `${rel(file)} hooks.${event}`;
    if (!/^[A-Z][A-Za-z]+$/.test(event)) errors.push(`${ev}: event name must be PascalCase`);
    else if (!KNOWN_EVENTS.has(event)) notices.push(`${ev}: '${event}' is not a known lifecycle event`);
    if (!Array.isArray(groups)) { errors.push(`${ev} must be an array of matcher groups`); continue; }
    groups.forEach((group, gidx) => {
      const gp = `${ev}[${gidx}]`;
      if (group.matcher !== undefined && typeof group.matcher !== 'string') errors.push(`${gp}.matcher must be a string`);
      if (!Array.isArray(group.hooks) || group.hooks.length === 0) { errors.push(`${gp} must define a non-empty hooks array`); return; }
      group.hooks.forEach((h, hidx) => {
        const hp = `${gp}.hooks[${hidx}]`;
        if (!h.type) errors.push(`${hp} missing 'type'`);
        if (h.type === 'command' && !h.command) errors.push(`${hp} type 'command' requires a 'command'`);
        if (h.timeout !== undefined && typeof h.timeout !== 'number') errors.push(`${hp}.timeout must be a number`);
        if (h.prompt && h.prompt.length > MAX_PROMPT_LENGTH) errors.push(`${hp} prompt exceeds ${MAX_PROMPT_LENGTH} chars (${h.prompt.length})`);
      });
    });
  }
}

function lintLegacyArray(file, hooks) {
  const ids = new Set();
  hooks.forEach((hook, idx) => {
    const prefix = `${rel(file)} hooks[${idx}]`;
    for (const field of ['id', 'event', 'severity', 'description', 'trigger', 'handlers']) {
      if (!(field in hook)) errors.push(`${prefix} missing '${field}'`);
    }
    if (hook.id) { if (ids.has(hook.id)) errors.push(`${prefix} duplicate id '${hook.id}'`); ids.add(hook.id); }
    if (hook.severity && !SEVERITIES.has(hook.severity)) errors.push(`${prefix} invalid severity '${hook.severity}'`);
    const trigger = hook.trigger || {};
    if (trigger.scope && !SCOPES.has(trigger.scope)) errors.push(`${prefix} trigger.scope must be one of ${[...SCOPES].join(', ')}`);
    if (!Array.isArray(hook.handlers) || hook.handlers.length === 0) errors.push(`${prefix} must include at least one handler`);
  });
}

for (const file of listHookFiles()) {
  const raw = fs.readFileSync(file, 'utf8');
  let data;
  try { data = JSON.parse(raw); } catch (err) { errors.push(`${rel(file)} invalid JSON: ${err.message}`); continue; }

  for (const field of ['$schema', 'version', 'plugin', 'hooks']) {
    if (!(field in data)) errors.push(`${rel(file)} missing root field '${field}'`);
  }
  if (data.version !== '2.0.0') errors.push(`${rel(file)} must use version 2.0.0`);

  if (Array.isArray(data.hooks)) {
    if (data.hooks.length === 0) errors.push(`${rel(file)} hooks array is empty`);
    else lintLegacyArray(file, data.hooks);
  } else if (data.hooks && typeof data.hooks === 'object') {
    if (Object.keys(data.hooks).length === 0) errors.push(`${rel(file)} hooks object is empty`);
    else lintNative(file, data.hooks);
  } else {
    errors.push(`${rel(file)} 'hooks' must be a native event-keyed object or a legacy array`);
  }
}

for (const n of notices) console.warn(`⚠️  ${n}`);
if (errors.length) {
  for (const e of errors) console.error(`❌ ${e}`);
  process.exit(1);
}
console.log(`✅ Hook lint passed${notices.length ? ` (${notices.length} notice(s))` : ''}`);
