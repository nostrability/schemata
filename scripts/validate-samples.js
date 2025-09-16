#!/usr/bin/env node
// Validate all sample JSON files against their built schemas in dist/.
// Scans nips/**/schema.yaml directories that contain a samples/ folder.

import { readdirSync, statSync, readFileSync, existsSync } from 'fs';
import { join, resolve, sep } from 'path';
import Ajv from 'ajv';

function* walkForSchemas(root) {
  const entries = readdirSync(root);
  for (const name of entries) {
    const full = join(root, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      const schemaYaml = join(full, 'schema.yaml');
      if (existsSync(schemaYaml)) yield full;
      yield* walkForSchemas(full);
    }
  }
}

function loadJSON(path) {
  return JSON.parse(readFileSync(resolve(path), 'utf8'));
}

const summary = { totalSuites: 0, totalCases: 0, passed: 0, failed: 0, failures: [] };
const ajv = new Ajv({ allErrors: true, strict: false });
try {
  const mod = await import('ajv-formats');
  const addFormats = mod.default || mod;
  addFormats(ajv);
} catch (e) {
  console.warn('WARN: ajv-formats not available; URL/email formats may not be enforced.');
}

let foundAny = false;
for (const schemaDir of walkForSchemas('nips')) {
  const samplesDir = join(schemaDir, 'samples');
  if (!existsSync(samplesDir)) continue;
  foundAny = true;
  const rel = schemaDir.split(sep).join('/');
  const distSchema = `dist/${rel}/schema.json`;
  summary.totalSuites += 1;

  if (!existsSync(distSchema)) {
    console.warn(`WARN: Built schema not found for ${rel}. Did you run 'pnpm build'?`);
    continue;
  }

  const schema = loadJSON(distSchema);
  const validate = ajv.compile(schema);
  const files = readdirSync(samplesDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => join(samplesDir, f));

  for (const file of files) {
    const name = file.split(sep).pop() || file;
    const expectValid = name === 'valid.json';
    const expectInvalid = name.startsWith('invalid');
    if (!expectValid && !expectInvalid) continue;
    summary.totalCases += 1;

    try {
      const data = loadJSON(file);
      const ok = validate(data);
      if (expectValid) {
        if (!ok) summary.failures.push({ schema: rel, sample: name, errors: validate.errors });
        summary.passed += ok ? 1 : 0;
        summary.failed += ok ? 0 : 1;
      } else {
        if (ok) summary.failures.push({ schema: rel, sample: name, errors: [{ message: 'expected invalid but validated' }] });
        summary.passed += ok ? 0 : 1;
        summary.failed += ok ? 1 : 0;
      }
    } catch (e) {
      summary.failures.push({ schema: rel, sample: name, errors: [{ message: e.message || String(e) }] });
      summary.failed += 1;
    }
  }
}

if (!foundAny) {
  console.log('No sample suites found under nips/**/samples. Nothing to validate.');
  process.exit(0);
}

const lines = [];
lines.push('==== Samples Summary ====');
lines.push(`Suites: ${summary.totalSuites}, Cases: ${summary.totalCases}, Passed: ${summary.passed}, Failed: ${summary.failed}`);
if (summary.failures.length) {
  lines.push('Failures:');
  for (const f of summary.failures) {
    lines.push(`- ${f.schema} :: ${f.sample}`);
    const errs = (f.errors || []).slice(0, 3);
    for (const e of errs) {
      const path = e.instancePath || '';
      const msg = e.message || 'validation error';
      lines.push(`  • ${path} ${msg}`);
    }
    if ((f.errors || []).length > 3) lines.push('  • ...');
  }
}
console.log(lines.join('\n'));

process.exit(summary.failed > 0 ? 1 : 0);
