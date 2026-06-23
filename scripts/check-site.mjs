#!/usr/bin/env node
// Validates the generated GitHub Pages site so it can't silently break.
// Run after build-site.mjs. Checks that required files exist, the catalog
// data is well-formed and consistent with the marketplace manifest, and that
// index.html references every interactive hook the app script expects.

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = join(ROOT, 'site');
const errors = [];
const fail = (m) => errors.push(m);

// 1 · required files present
const required = [
  'index.html', '.nojekyll', 'robots.txt', 'sitemap.xml', 'manifest.webmanifest',
  '404.html', 'data/plugins.json', 'assets/styles.css', 'assets/app.js', 'assets/og.svg',
];
for (const f of required) {
  if (!existsSync(join(SITE, f))) fail(`missing required site file: ${f}`);
}

// 2 · catalog data well-formed and consistent with the manifest
let data;
try {
  data = JSON.parse(readFileSync(join(SITE, 'data', 'plugins.json'), 'utf8'));
} catch (e) {
  fail(`data/plugins.json is not valid JSON: ${e.message}`);
}

if (data) {
  const manifest = JSON.parse(readFileSync(join(ROOT, '.claude-plugin', 'marketplace.json'), 'utf8'));
  if (data.plugins.length !== manifest.plugins.length) {
    fail(`plugin count drift: data has ${data.plugins.length}, manifest has ${manifest.plugins.length} — run "pnpm build:site"`);
  }
  if (data.stats.plugins !== data.plugins.length) fail('stats.plugins does not match plugins.length');

  for (const p of data.plugins) {
    for (const k of ['name', 'version', 'description', 'category', 'counts']) {
      if (p[k] == null) fail(`plugin "${p.name || '?'}" missing field: ${k}`);
    }
  }
  // every stack references a real plugin
  const names = new Set(data.plugins.map((p) => p.name));
  for (const s of data.stacks || []) {
    for (const n of s.plugins) if (!names.has(n)) fail(`stack "${s.id}" references unknown plugin "${n}"`);
  }
  // webmanifest parses
  try {
    JSON.parse(readFileSync(join(SITE, 'manifest.webmanifest'), 'utf8'));
  } catch (e) {
    fail(`manifest.webmanifest invalid JSON: ${e.message}`);
  }
}

// 3 · index.html wires the elements app.js drives
const html = existsSync(join(SITE, 'index.html')) ? readFileSync(join(SITE, 'index.html'), 'utf8') : '';
const requiredIds = [
  'pluginGrid', 'filters', 'search', 'sort', 'stackGrid', 'subpluginList',
  'pluginModal', 'modalContent', 'palette', 'paletteInput', 'paletteResults',
  'themeToggle', 'paletteOpen', 'toTop',
];
for (const id of requiredIds) {
  if (!html.includes(`id="${id}"`)) fail(`index.html is missing #${id} (referenced by app.js)`);
}
if (!html.includes('./assets/app.js')) fail('index.html does not load assets/app.js');
if (!html.includes('./assets/styles.css')) fail('index.html does not load assets/styles.css');

if (errors.length) {
  console.error('✗ site validation failed:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`✓ site OK — ${data.plugins.length} plugins, ${data.stacks?.length || 0} stacks, ${required.length} files, ${requiredIds.length} DOM hooks verified`);
