import { readdirSync, statSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';
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

describe('Error message coverage', () => {
  for (const kindDir of [...walkForKindSchemas('nips'), ...walkForKindSchemas('mips')]) {
    const rel = kindDir.replace(/\\/g, '/');
    const schema = parse(readFileSync(join(kindDir, 'schema.yaml'), 'utf8'));

    // Find the overlay object in allOf
    const overlay = schema?.allOf?.find(s => s.type === 'object' || s.properties);
    if (!overlay?.properties) continue;

    test(`${rel} kind property has errorMessage`, () => {
      if (overlay.properties.kind?.const !== undefined) {
        expect(overlay.properties.kind.errorMessage).toBeDefined();
      }
    });

    test(`${rel} all tag contains have errorMessage.contains`, () => {
      const tagsAllOf = overlay.properties.tags?.allOf;
      if (!tagsAllOf) return;
      for (const entry of tagsAllOf) {
        if (entry.contains) {
          expect(entry.errorMessage?.contains,
            `Missing errorMessage.contains for a contains constraint in ${rel}`
          ).toBeDefined();
        }
      }
    });
  }
});
