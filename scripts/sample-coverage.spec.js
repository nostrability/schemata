import { readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';
import { describe, test, expect } from 'vitest';

function* walkForKindSchemas(root) {
  if (!existsSync(root)) return;
  const entries = readdirSync(root);
  for (const name of entries) {
    const full = join(root, name);
    if (!statSync(full).isDirectory()) continue;
    if (name.startsWith('kind-') && existsSync(join(full, 'schema.yaml'))) {
      yield full;
    }
    yield* walkForKindSchemas(full);
  }
}

describe('Sample coverage', () => {
  for (const kindDir of [...walkForKindSchemas('nips'), ...walkForKindSchemas('mips')]) {
    const rel = kindDir.replace(/\\/g, '/');
    const samplesDir = join(kindDir, 'samples');

    test(`${rel} has samples/ directory`, () => {
      expect(existsSync(samplesDir), `Missing: ${rel}/samples/`).toBe(true);
    });

    if (existsSync(samplesDir)) {
      const files = readdirSync(samplesDir).filter(f => f.endsWith('.json'));

      test(`${rel} has at least one valid sample`, () => {
        expect(files.some(f => f.startsWith('valid'))).toBe(true);
      });

      test(`${rel} has at least one invalid sample`, () => {
        expect(files.some(f => f.startsWith('invalid'))).toBe(true);
      });
    }
  }
});
