import Ajv from 'ajv';
import { readFileSync, readdirSync, statSync } from 'fs';
import { resolve, join } from 'path';
import { describe, test, expect } from 'vitest';

function loadSchema(path) {
  return JSON.parse(readFileSync(resolve(path), 'utf8'));
}

describe('Core schema shapes', () => {
  const ajv = new Ajv({ allErrors: true, strict: false });

  test('kind-1: basic note shape validates', () => {
    const schema = loadSchema('dist/nips/nip-01/kind-1/schema.json');
    const validate = ajv.compile(schema);

    const validEvent = {
      id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      pubkey: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      created_at: 1690000000,
      kind: 1,
      tags: [
        ['e', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'],
        ['p', 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb']
      ],
      content: 'hello world',
      sig: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc'
    };

    expect(validate(validEvent)).toBe(true);
    if (!validate(validEvent)) console.error(validate.errors);

    const invalidEvent = {
      id: 'not-hex',
      pubkey: 'short',
      created_at: 'not-a-number',
      kind: '1',
      tags: 'not-an-array',
      content: 123,
      sig: 456
    };
    expect(validate(invalidEvent)).toBe(false);
  });

  test('kind-10002: relay list metadata requires r tags', () => {
    const schema = loadSchema('dist/nips/nip-65/kind-10002/schema.json');
    const validate = ajv.compile(schema);

    const validEvent = {
      id: 'a'.repeat(64),
      pubkey: 'b'.repeat(64),
      created_at: 1700000000,
      kind: 10002,
      tags: [
        ['r', 'wss://relay.example.com'],
        ['r', 'wss://another.example.com']
      ],
      content: '',
      sig: 'c'.repeat(128)
    };
    expect(validate(validEvent)).toBe(true);
    if (!validate(validEvent)) console.error(validate.errors);

    const invalidEventWrongTag = {
      ...validEvent,
      tags: [ ['p', 'a'.repeat(64)] ]
    };
    expect(validate(invalidEventWrongTag)).toBe(false);
  });
});

describe('Source hygiene', () => {
  function* walk(dir) {
    const entries = readdirSync(dir);
    for (const name of entries) {
      const full = join(dir, name);
      const st = statSync(full);
      if (st.isDirectory()) {
        yield* walk(full);
      } else if (full.endsWith('.yaml')) {
        yield full;
      }
    }
  }

  test('no $id in source YAML files', () => {
    const roots = ['nips', '@'];
    for (const root of roots) {
      for (const file of walk(root)) {
        const content = readFileSync(file, 'utf8');
        expect(/^\$id:/m.test(content)).toBe(false);
      }
    }
  });
});

