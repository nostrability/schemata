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

function* walkForTagSchemas(root) {
  if (!existsSync(root)) return;
  const entries = readdirSync(root);
  for (const name of entries) {
    const full = join(root, name);
    if (!statSync(full).isDirectory()) continue;
    if (name === 'tag') {
      // Look for subdirectories with schema.yaml
      for (const tagName of readdirSync(full)) {
        const tagDir = join(full, tagName);
        if (statSync(tagDir).isDirectory() && existsSync(join(tagDir, 'schema.yaml'))) {
          yield tagDir;
        }
      }
    }
    yield* walkForTagSchemas(full);
  }
}

describe('Structural lint', () => {
  const kindNumbers = new Map();

  for (const kindDir of [...walkForKindSchemas('nips'), ...walkForKindSchemas('mips')]) {
    const rel = kindDir.replace(/\\/g, '/');
    const schema = parse(readFileSync(join(kindDir, 'schema.yaml'), 'utf8'));

    test(`${rel} extends @/note.yaml or @/note-unsigned.yaml`, () => {
      const refs = (schema.allOf || []).map(s => s.$ref).filter(Boolean);
      const extendsNote = refs.some(r => r === '@/note.yaml' || r === '@/note-unsigned.yaml');
      expect(extendsNote, `${rel} must extend @/note.yaml or @/note-unsigned.yaml`).toBe(true);
    });

    test(`${rel} has no $id`, () => {
      expect(schema.$id).toBeUndefined();
    });

    // Collect kind numbers for uniqueness check
    const overlay = schema?.allOf?.find(s => s.properties?.kind?.const !== undefined);
    if (overlay) {
      const num = overlay.properties.kind.const;
      test(`${rel} kind ${num} is unique`, () => {
        if (kindNumbers.has(num)) {
          expect.fail(`Kind ${num} already defined in ${kindNumbers.get(num)}`);
        }
        kindNumbers.set(num, rel);
      });
    }
  }

  // Tag schema checks
  for (const tagDir of [...walkForTagSchemas('nips'), ...walkForTagSchemas('mips')]) {
    const rel = tagDir.replace(/\\/g, '/');
    const schema = parse(readFileSync(join(tagDir, 'schema.yaml'), 'utf8'));

    test(`${rel} extends @/tag.yaml or a tag alias`, () => {
      const refs = (schema.allOf || []).map(s => s.$ref).filter(Boolean);
      const extendsTag = refs.some(r => r === '@/tag.yaml' || r.startsWith('@/tag/'));
      expect(extendsTag, `${rel} must extend @/tag.yaml or an @/tag/*.yaml alias`).toBe(true);
    });
  }
});
