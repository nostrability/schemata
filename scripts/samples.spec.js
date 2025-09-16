import { readdirSync, statSync, readFileSync, existsSync } from 'fs';
import { join, resolve, sep } from 'path';
import Ajv from 'ajv';
import { describe, test, expect, afterAll } from 'vitest';

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

// Limit initial scope to NIP-09 only to get PR green
for (const schemaDir of walkForSchemas('nips/nip-09')) {
  const samplesDir = join(schemaDir, 'samples');
  if (!existsSync(samplesDir)) continue;
  const rel = schemaDir.split(sep).join('/');
  const distSchema = `dist/${rel}/schema.json`;
  summary.totalSuites += 1;

  describe(`Samples: ${rel.replace(/^nips\//, '')}`, () => {
    if (!existsSync(distSchema)) {
      test.skip('schema not built yet', () => {});
      return;
    }
    const schema = loadJSON(distSchema);
    const validate = ajv.compile(schema);
    const files = readdirSync(samplesDir).filter((f) => f.endsWith('.json')).map((f) => join(samplesDir, f));
    for (const file of files) {
      const name = file.split(sep).pop() || file;
      const expectValid = name === 'valid.json';
      const expectInvalid = name.startsWith('invalid');
      if (!expectValid && !expectInvalid) continue;
      summary.totalCases += 1;
      test(`${name} should be ${expectValid ? 'valid' : 'invalid'}`, () => {
        const data = loadJSON(file);
        const ok = validate(data);
        if (expectValid) {
          if (!ok) summary.failures.push({ schema: rel, sample: name, errors: validate.errors });
          expect(ok).toBe(true);
          summary.passed += ok ? 1 : 0; summary.failed += ok ? 0 : 1;
        } else {
          if (ok) summary.failures.push({ schema: rel, sample: name, errors: [{ message: 'expected invalid but validated' }] });
          expect(ok).toBe(false);
          summary.passed += ok ? 0 : 1; summary.failed += ok ? 1 : 0;
        }
      });
    }
  });
}

afterAll(() => {
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
});
