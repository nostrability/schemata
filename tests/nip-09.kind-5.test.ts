import Ajv from 'ajv';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { resolve, join } from 'path';
import { describe, test, expect } from 'vitest';

function loadJSON(path: string) {
  return JSON.parse(readFileSync(resolve(path), 'utf8'));
}

describe('NIP-09: kind-5 deletion request samples', () => {
  const schemaPath = 'dist/nips/nip-09/kind-5/schema.json';
  if (!existsSync(schemaPath)) {
    test.skip('schema not built yet', () => {});
    return;
  }

  const ajv = new Ajv({ allErrors: true, strict: false });
  const schema = loadJSON(schemaPath);
  const validate = ajv.compile(schema);

  const samplesDir = 'nips/nip-09/kind-5/samples';
  const files = readdirSync(samplesDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => join(samplesDir, f));

  for (const file of files) {
    const name = file.split('/').pop() || file;
    const expectValid = name === 'valid.json';
    const expectInvalid = name.startsWith('invalid');
    if (!expectValid && !expectInvalid) continue;

    test(`${name} should be ${expectValid ? 'valid' : 'invalid'}`, () => {
      const data = loadJSON(file);
      const ok = validate(data);
      if (expectValid) {
        if (!ok) console.error(validate.errors);
        expect(ok).toBe(true);
      } else {
        expect(ok).toBe(false);
      }
    });
  }
});

