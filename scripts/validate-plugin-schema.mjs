#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';

// `new URL(import.meta.url).pathname` yields a leading-slash path on Windows
// ("/C:/repo/scripts"), which path.resolve turns into "C:\C:\repo" and every
// schema read then fails with ENOENT. fileURLToPath decodes correctly on all
// platforms, so this check can actually run on Windows.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGINS_DIR = path.join(ROOT, 'plugins');
const pluginSchemaPath = path.join(ROOT, 'schemas', 'plugin.schema.json');
const hooksSchemaPath = path.join(ROOT, 'schemas', 'hooks.schema.json');

const ajv = new Ajv({ allErrors: true, allowUnionTypes: true, strict: false });
const pluginSchema = JSON.parse(fs.readFileSync(pluginSchemaPath, 'utf8'));
const hooksSchema = JSON.parse(fs.readFileSync(hooksSchemaPath, 'utf8'));
const validatePlugin = ajv.compile(pluginSchema);
const validateHooks = ajv.compile(hooksSchema);

const pluginDirs = fs.readdirSync(PLUGINS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();

const issues = [];

function formatErrors(errors = []) {
  return errors.map((e) => `${e.instancePath || '/'} ${e.message}`).join('; ');
}

for (const pluginName of pluginDirs) {
  const pluginRoot = path.join(PLUGINS_DIR, pluginName);
  const manifestPath = path.join(pluginRoot, '.claude-plugin', 'plugin.json');
  const hooksPath = path.join(pluginRoot, 'hooks', 'hooks.json');

  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (!validatePlugin(manifest)) {
      issues.push(`${pluginName}: invalid .claude-plugin/plugin.json -> ${formatErrors(validatePlugin.errors)}`);
    }
    if (manifest?.context?.entry !== manifest?.contextEntry) {
      issues.push(`${pluginName}: context.entry must match contextEntry for compatibility`);
    }

    if (!Array.isArray(manifest?.context?.bootstrapFiles) || manifest.context.bootstrapFiles.length === 0) {
      issues.push(`${pluginName}: context.bootstrapFiles must contain at least one bootstrap file`);
    }

    const summaryPath = path.join(pluginRoot, 'CONTEXT_SUMMARY.md');
    if (!fs.existsSync(summaryPath)) {
      issues.push(`${pluginName}: missing required CONTEXT_SUMMARY.md`);
    }
  } else {
    issues.push(`${pluginName}: missing .claude-plugin/plugin.json`);
  }

  if (fs.existsSync(hooksPath)) {
    const hooks = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));
    if (!validateHooks(hooks)) {
      issues.push(`${pluginName}: invalid hooks/hooks.json -> ${formatErrors(validateHooks.errors)}`);
    }
    if (hooks.plugin !== pluginName) {
      issues.push(`${pluginName}: hooks.plugin must be "${pluginName}"`);
    }
  }
}

if (issues.length) {
  console.error('Plugin schema validation failed:');
  for (const issue of issues) console.error(` - ${issue}`);
  process.exit(1);
}

console.log(`Validated ${pluginDirs.length} plugins against canonical plugin and hooks schemas.`);
