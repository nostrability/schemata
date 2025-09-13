import Ajv from 'ajv';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, test, expect } from 'vitest';

const nip05Schema = JSON.parse(readFileSync(resolve('dist/@/nip05.json'), 'utf8'));
const nostrwellknownSchema = JSON.parse(readFileSync(resolve('dist/@/nostr-well-known.json'), 'utf8'));

const ajv = new Ajv({ allErrors: true });

describe('NIP-05 schemas', () => {
  const supplied = {
    identifier: 'alex@gleasonator.dev',
    hex: '0461fcbecc4c3374439932d6b8f11269ccdb7cc973ad7a50ae362db135a474dd',
    wellKnown: {
      names: {
        alex: '0461fcbecc4c3374439932d6b8f11269ccdb7cc973ad7a50ae362db135a474dd',
      },
      relays: {
        '0461fcbecc4c3374439932d6b8f11269ccdb7cc973ad7a50ae362db135a474dd': [
          'wss://gleasonator.dev/relay',
        ],
      },
    },
  };

  test('supplied example shapes are valid', () => {
    const idValidate = ajv.compile(nip05Schema);
    expect(idValidate(supplied.identifier)).toBe(true);
    if (!idValidate(supplied.identifier)) console.error(idValidate.errors);

    const wkValidate = ajv.compile(nostrwellknownSchema);
    expect(wkValidate(supplied.wellKnown)).toBe(true);
    if (!wkValidate(supplied.wellKnown)) console.error(wkValidate.errors);
  });

  test('identifier valid/invalid cases', () => {
    const idValidate = ajv.compile(nip05Schema);
    const goodIds = [
      'bob@example.com',
      '_@example.com',
      'alice.01-foo@sub.example.co.uk',
      'ALICE@EXAMPLE.COM',
      'a_b.c-d@sub.xn--bcher-kva.de',
      'bob@xn--r8jz45g.xn--zckzah',
    ];
    for (const id of goodIds) {
      expect(idValidate(id)).toBe(true);
    }

    const badIds = [
      'bob@localhost',
      'bad@@example.com',
      'no-at-symbol.example.com',
      'name@exa_mple.com',
      'bob@-example.com',
      'bob@example-.com',
      'bob@sub..example.com',
    ];
    for (const id of badIds) {
      expect(idValidate(id)).toBe(false);
    }
  });

  test('well-known valid/invalid cases', () => {
    const wkValidate = ajv.compile(nostrwellknownSchema);
    const pk = 'b0635d6a9851d3aed0cd6c495b282167acf761729078d975fc341b22650b07b9';
    const goodWK = {
      names: { bob: pk },
      relays: { [pk]: ['wss://relay.example.com', 'wss://relay2.example.com'] },
    };
    expect(wkValidate(goodWK)).toBe(true);

    const badWKs = [
      { names: { 'BadCaps': pk } },
      { names: { bob: 'npub1xyz' } },
      { names: { bob: pk }, relays: { nothex: ['wss://relay.example.com'] } },
      { names: { bob: pk }, relays: { [pk]: ['https://not-ws.example.com'] } },
      { names: { bob: pk }, extra: true },
      { names: { bob: pk }, relays: { [pk]: ['ws:/bad'] } },
      { names: { bob: pk }, relays: { [pk]: [123] } },
    ];
    for (const obj of badWKs) {
      expect(wkValidate(obj)).toBe(false);
    }

    // Allowed cases
    expect(wkValidate({ names: {} })).toBe(true);
    expect(wkValidate({ names: { bob: pk }, relays: { [pk]: ['ws://relay.example.com'] } })).toBe(true);
  });
});
