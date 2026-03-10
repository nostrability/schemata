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

// Scan all NIP and MIP schemas for samples
for (const schemaDir of [...walkForSchemas('nips'), ...walkForSchemas('mips')]) {
  const samplesDir = join(schemaDir, 'samples');
  if (!existsSync(samplesDir)) continue;
  const rel = schemaDir.split(sep).join('/');
  const distSchema = `dist/${rel}/schema.json`;
  summary.totalSuites += 1;

  describe(`Samples: ${rel.replace(/^(nips|mips)\//, '')}`, () => {
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
        const testPassed = expectValid ? ok : !ok;
        if (!testPassed) {
          const errors = expectValid
            ? validate.errors
            : [{ message: 'expected invalid but validated' }];
          summary.failures.push({ schema: rel, sample: name, errors });
        }
        summary.passed += testPassed ? 1 : 0;
        summary.failed += testPassed ? 0 : 1;
        if (expectValid) {
          expect(ok).toBe(true);
        } else {
          expect(ok).toBe(false);
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
