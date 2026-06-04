#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const PLUGINS_DIR = path.join(ROOT, 'plugins');
const REQUIRED_FIELDS = ['name', 'intent', 'tags', 'inputs', 'risk', 'cost'];
const ALLOWED_RISK = new Set(['low', 'medium', 'high']);
const ALLOWED_COST = new Set(['low', 'medium', 'high']);

const args = new Set(process.argv.slice(2));
const checkOnly = args.has('--check');
const writeFrontmatter = !args.has('--no-write-frontmatter');

function parseFrontmatter(content) {
  if (!content.startsWith('---\n')) return { data: {}, body: content, hasFrontmatter: false };
  const end = content.indexOf('\n---', 4);
  if (end === -1) return { data: {}, body: content, hasFrontmatter: false };
  const raw = content.slice(4, end);
  const body = content.slice(end + 4).replace(/^\n/, '');
  let data = {};
  try {
    data = yaml.load(raw) || {};
  } catch {
    data = {};
  }
  return { data, body, hasFrontmatter: true };
}

function inferIntent(data, body, baseName, type) {
  if (typeof data.intent === 'string' && data.intent.trim()) return data.intent.trim();
  if (typeof data.description === 'string' && data.description.trim()) return data.description.trim();
  const firstLine = body.split('\n').find((line) => line.trim().length > 0) || '';
  return firstLine.replace(/^#\s+/, '').trim() || `${type} action for ${baseName}`;
}

function normalizeArray(value, fallback = []) {
  if (Array.isArray(value)) {
    const mapped = value
      .map((v) => {
        if (typeof v === 'string') return v;
        if (v && typeof v === 'object' && typeof v.name === 'string') return v.name;
        return '';
      })
      .map((v) => v.trim())
      .filter((v) => v && v !== '[object Object]');
    return mapped.length > 0 ? mapped : fallback;
  }
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((v) => v.trim()).filter(Boolean);
  }
  return fallback;
}

function normalizeRisk(value) {
  const normalized = String(value || '').toLowerCase();
  return ALLOWED_RISK.has(normalized) ? normalized : 'medium';
}

function normalizeCost(value) {
  const normalized = String(value || '').toLowerCase();
  return ALLOWED_COST.has(normalized) ? normalized : 'medium';
}

function buildNormalizedFrontmatter({ data, body, pluginName, type, fileName }) {
  const baseName = fileName.replace(/\.md$/, '');
  const fallbackName = data.name || `${pluginName}:${baseName}`;
  return {
    name: String(fallbackName),
    intent: inferIntent(data, body, baseName, type),
    tags: normalizeArray(data.tags, [pluginName, type, baseName]),
    inputs: normalizeArray(data.inputs, normalizeArray(data.arguments, [])),
    risk: normalizeRisk(data.risk),
    cost: normalizeCost(data.cost),
    ...(data.description ? { description: String(data.description) } : {}),
    ...(data.model ? { model: String(data.model) } : {}),
    ...(data.tools ? { tools: data.tools } : {}),
    ...(data.allowedTools ? { allowedTools: data.allowedTools } : {}),
    ...(data['allowed-tools'] ? { 'allowed-tools': data['allowed-tools'] } : {}),
    ...(data.examples ? { examples: data.examples } : {}),
    // Modern Claude Code agent frontmatter (preserved when present; absent for
    // plugins that do not use it, so their normalized output is unchanged).
    ...(data.effort ? { effort: String(data.effort) } : {}),
    ...(data.maxTurns !== undefined ? { maxTurns: data.maxTurns } : {}),
    ...(data.disallowedTools ? { disallowedTools: data.disallowedTools } : {}),
    ...(data.skills ? { skills: data.skills } : {}),
    ...(data.memory !== undefined ? { memory: data.memory } : {}),
    ...(data.background !== undefined ? { background: data.background } : {}),
    ...(data.isolation !== undefined ? { isolation: data.isolation } : {}),
    ...(data.flags ? { flags: data.flags } : {}),
    ...(data.category ? { category: String(data.category) } : {}),
  };
}

function serializeFrontmatter(frontmatter, body) {
  const dumped = yaml.dump(frontmatter, { lineWidth: -1, noRefs: true, sortKeys: false }).trimEnd();
  return `---\n${dumped}\n---\n\n${body.replace(/^\n+/, '')}`;
}

function ensureIndexesForPlugin(pluginDirName) {
  const pluginRoot = path.join(PLUGINS_DIR, pluginDirName);
  const manifestPath = path.join(pluginRoot, '.claude-plugin', 'plugin.json');
  if (!fs.existsSync(manifestPath)) return [];

  const changed = [];

  for (const type of ['commands', 'agents']) {
    const dir = path.join(pluginRoot, type);
    if (!fs.existsSync(dir)) continue;

    const entries = [];
    const mdFiles = fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort();

    for (const fileName of mdFiles) {
      const filePath = path.join(dir, fileName);
      const relativePath = path.relative(pluginRoot, filePath).replaceAll('\\\\', '/');
      const original = fs.readFileSync(filePath, 'utf8');
      const { data, body } = parseFrontmatter(original);
      const normalized = buildNormalizedFrontmatter({ data, body, pluginName: pluginDirName, type: type.slice(0, -1), fileName });

      const missing = REQUIRED_FIELDS.filter((field) => normalized[field] === undefined || normalized[field] === null || normalized[field] === '');
      if (missing.length > 0) {
        throw new Error(`${relativePath}: missing required frontmatter fields ${missing.join(', ')}`);
      }

      const rewritten = serializeFrontmatter(normalized, body);
      if (rewritten !== original) {
        if (checkOnly || !writeFrontmatter) {
          throw new Error(`${relativePath}: frontmatter is missing required shape or differs from generated form`);
        }
        fs.writeFileSync(filePath, rewritten);
        changed.push(relativePath);
      }

      entries.push({
        name: normalized.name,
        intent: normalized.intent,
        tags: normalized.tags,
        inputs: normalized.inputs,
        risk: normalized.risk,
        cost: normalized.cost,
        path: `${type}/${fileName}`
      });
    }

    const indexPath = path.join(dir, 'index.json');
    const payload = {
      version: 1,
      plugin: pluginDirName,
      type,
      generatedBy: 'scripts/generate-plugin-indexes.mjs',
      entries
    };

    const nextJson = `${JSON.stringify(payload, null, 2)}\n`;
    const currentJson = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : '';

    if (nextJson !== currentJson) {
      if (checkOnly) {
        throw new Error(`${path.relative(ROOT, indexPath)}: stale generated index`);
      }
      fs.writeFileSync(indexPath, nextJson);
      changed.push(path.relative(ROOT, indexPath).replaceAll('\\\\', '/'));
    }
  }

  return changed;
}

const pluginDirs = fs.readdirSync(PLUGINS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
let changedFiles = [];

for (const pluginDirName of pluginDirs) {
  changedFiles = changedFiles.concat(ensureIndexesForPlugin(pluginDirName));
}

if (checkOnly) {
  console.log('✅ Plugin frontmatter and generated indexes are valid.');
} else {
  console.log(`✅ Updated plugin frontmatter/indexes (${changedFiles.length} files changed).`);
}
