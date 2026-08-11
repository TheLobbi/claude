#!/usr/bin/env node
/**
 * Validate every workflow definition in this directory against the bundled
 * Claude Code workflow schema (workflows/schema/workflow.schema.json).
 *
 * Usage: node workflows/validate.mjs
 * Exits 1 if any workflow is invalid.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';

const here = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(here, 'schema', 'workflow.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

const files = fs
  .readdirSync(here)
  .filter((f) => f.endsWith('.json'))
  .sort();

let failed = 0;
for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(here, file), 'utf8'));
  if (validate(data)) {
    console.log(`  ✅ ${file}`);
  } else {
    failed += 1;
    console.error(`  ❌ ${file}`);
    for (const err of validate.errors ?? []) {
      console.error(`       ${err.instancePath || '/'} ${err.message}`);
    }
  }
}

if (failed > 0) {
  console.error(`\n${failed} workflow(s) failed validation.`);
  process.exit(1);
}
console.log(`\nValidated ${files.length} workflow definition(s) against workflow.schema.json.`);
