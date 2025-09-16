import Ajv from 'ajv';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, test, expect } from 'vitest';

function loadSchema(path) {
  return JSON.parse(readFileSync(resolve(path), 'utf8'));
}

describe('NIP-18: Reposts', () => {
  const ajv = new Ajv({ allErrors: true, strict: false });

  test('kind-6 requires e tag with relay', () => {
    const schema = loadSchema('dist/nips/nip-18/kind-6/schema.json');
    const validate = ajv.compile(schema);

    const ok = {
      id: 'a'.repeat(64),
      pubkey: 'b'.repeat(64),
      created_at: 1700000000,
      kind: 6,
      tags: [
        ['e', 'c'.repeat(64), 'wss://relay.example.com'],
        ['p', 'd'.repeat(64)]
      ],
      content: JSON.stringify({ id: 'c'.repeat(64), kind: 1 }),
      sig: 'e'.repeat(128)
    };
    expect(validate(ok)).toBe(true);
    if (!validate(ok)) console.error(validate.errors);

    const missingRelay = {
      ...ok,
      tags: [ ['e', 'c'.repeat(64)] ]
    };
    expect(validate(missingRelay)).toBe(false);
  });

  test('kind-16 requires k tag (stringified kind)', () => {
    const schema = loadSchema('dist/nips/nip-18/kind-16/schema.json');
    const validate = ajv.compile(schema);

    const ok = {
      id: 'a'.repeat(64),
      pubkey: 'b'.repeat(64),
      created_at: 1700000001,
      kind: 16,
      tags: [ ['k', '30023'] ],
      content: JSON.stringify({ id: 'f'.repeat(64), kind: 30023 }),
      sig: 'e'.repeat(128)
    };
    expect(validate(ok)).toBe(true);
    if (!validate(ok)) console.error(validate.errors);

    const missingK = { ...ok, tags: [] };
    expect(validate(missingK)).toBe(false);
  });
});

describe('NIP-18: q tag', () => {
  const ajv = new Ajv({ allErrors: true, strict: false });

  test('q tag forms validate', () => {
    const schema = loadSchema('dist/nips/nip-18/tag/q/schema.json');
    const validate = ajv.compile(schema);

    const eid = 'f'.repeat(64);
    const pk = 'a'.repeat(64);

    const good = [
      ['q', eid],
      ['q', eid, 'wss://relay.example.com'],
      ['q', eid, 'wss://relay.example.com', pk],
    ];
    for (const t of good) expect(validate(t)).toBe(true);

    const bad = [
      ['q'],
      ['q', 'nothex'],
      ['q', eid, 'http://not-ws.com'],
      ['q', eid, 'wss://ok', 'npub1...'],
      ['q', eid, 'wss://ok', pk, 'extra']
    ];
    for (const t of bad) expect(validate(t)).toBe(false);
  });
});

