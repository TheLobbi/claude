#!/usr/bin/env node
/**
 * scaffold-app.mjs — copy a template into a new project, substituting tokens.
 *
 * Templates live in ../templates. Every template file may contain:
 *   __APP_TITLE__        human-readable name        "Expense Approvals"
 *   __APP_SLUG__         kebab-case identifier      "expense-approvals"
 *   __APP_SNAKE__        snake_case tool suffix     "expense_approvals"
 *   __APP_DESCRIPTION__  one-line description
 *
 * Usage:
 *   node scaffold-app.mjs --template mcp-app-react --name "Expense Approvals" --into ./apps/expenses
 *   node scaffold-app.mjs --list
 *   node scaffold-app.mjs --template a2ui-agent --name "Contact Form" --into ./a2ui --force
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(HERE, '..', 'templates');

const argv = process.argv.slice(2);
function opt(name, fallback = null) {
  const inline = argv.find((a) => a.startsWith(`--${name}=`));
  if (inline) return inline.slice(name.length + 3);
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
}
const has = (name) => argv.includes(`--${name}`);

function listTemplates() {
  return fs.readdirSync(TEMPLATES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

if (has('list') || argv.length === 0) {
  console.log('Available templates:\n');
  for (const name of listTemplates()) console.log(`  ${name}`);
  console.log('\nUsage: node scaffold-app.mjs --template <name> --name "My App" --into ./dir');
  process.exit(0);
}

const template = opt('template');
const appName = opt('name');
const into = opt('into');
const force = has('force');

if (!template || !appName) {
  console.error('Both --template and --name are required. Run with --list to see templates.');
  process.exit(2);
}

const templateDir = path.join(TEMPLATES_DIR, template);
if (!fs.existsSync(templateDir)) {
  console.error(`Unknown template "${template}". Available: ${listTemplates().join(', ')}`);
  process.exit(2);
}

/** "Expense Approvals" → "expense-approvals" */
function toSlug(value) {
  return value
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase() || 'mcp-app';
}

const slug = toSlug(appName);
const snake = slug.replace(/-/g, '_');
const target = path.resolve(into ?? `./${slug}`);

if (fs.existsSync(target) && fs.readdirSync(target).length > 0 && !force) {
  console.error(`${target} exists and is not empty. Pass --force to write into it anyway.`);
  process.exit(2);
}

const TOKENS = {
  __APP_TITLE__: appName,
  __APP_SLUG__: slug,
  __APP_SNAKE__: snake,
  __APP_DESCRIPTION__: opt('description', `${appName} — an agent-rendered interactive UI.`),
};

// Text formats get token substitution; anything else is copied byte-for-byte.
const TEXT_EXT = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.jsonl', '.html',
  '.css', '.md', '.py', '.txt', '.yml', '.yaml', '.svg', '.vue', '.svelte',
]);

function substitute(text) {
  let out = text;
  for (const [token, value] of Object.entries(TOKENS)) {
    out = out.split(token).join(value);
  }
  return out;
}

const written = [];

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    // node_modules/dist should never be in a template, but never copy them anyway.
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const src = path.join(from, entry.name);
    const dest = path.join(to, substitute(entry.name));
    if (entry.isDirectory()) {
      copyDir(src, dest);
    } else if (TEXT_EXT.has(path.extname(entry.name))) {
      fs.writeFileSync(dest, substitute(fs.readFileSync(src, 'utf8')));
      written.push(path.relative(target, dest));
    } else {
      fs.copyFileSync(src, dest);
      written.push(path.relative(target, dest));
    }
  }
}

copyDir(templateDir, target);

// A .gitignore so the first `git add` does not sweep in build output.
const gitignore = path.join(target, '.gitignore');
if (!fs.existsSync(gitignore)) {
  fs.writeFileSync(gitignore, 'node_modules/\ndist/\nbuild/\n.env\n.env.local\n');
  written.push('.gitignore');
}

console.log(`Scaffolded "${appName}" from template "${template}"`);
console.log(`  → ${target}`);
console.log(`  ${written.length} files\n`);
for (const file of written.sort()) console.log(`    ${file}`);

const isNode = fs.existsSync(path.join(target, 'package.json'));
const isPython = fs.existsSync(path.join(target, 'requirements.txt'));

console.log('\nNext:');
console.log(`  cd ${path.relative(process.cwd(), target) || '.'}`);
if (isNode) {
  console.log('  npm install');
  const pkg = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8'));
  if (pkg.scripts?.build) console.log('  npm run build');
  if (pkg.scripts?.serve) console.log('  npm run serve');
} else if (isPython) {
  console.log('  pip install -r requirements.txt');
  if (fs.existsSync(path.join(target, 'server.py'))) console.log('  python server.py');
  if (fs.existsSync(path.join(target, 'agent.py'))) console.log('  uvicorn agent:app --reload --port 8000');
}
console.log('\nThen validate:');
console.log(`  node ${path.relative(process.cwd(), path.join(HERE, 'validate-mcp-app.mjs'))} ${path.relative(process.cwd(), target) || '.'}`);
