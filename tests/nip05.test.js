// NIP-05 identifier and well-known schema tests (moved from project root)
import Ajv from 'ajv';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const nip05Schema = JSON.parse(readFileSync(resolve('dist/@/nip05.json'), 'utf8'));
const nostrwellknownSchema = JSON.parse(readFileSync(resolve('dist/@/nostr-well-known.json'), 'utf8'));

const ajv = new Ajv({ allErrors: true });

function must(valid, ctx, errors) {
  if (!valid) {
    const msg = ajv.errorsText(errors, { separator: '\n' });
    throw new Error(`[FAIL] ${ctx}:\n${msg}`);
  }
}

async function run() {
  // Supplied example: alex@gleasonator.dev and expected npub
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

  // Identifier tests
  const idValidate = ajv.compile(nip05Schema);
  must(idValidate(supplied.identifier), 'supplied identifier shape valid', idValidate.errors);
  const goodIds = [
    'bob@example.com',
    '_@example.com',
    'alice.01-foo@sub.example.co.uk',
    'ALICE@EXAMPLE.COM',
    'a_b.c-d@sub.xn--bcher-kva.de',
    'bob@xn--r8jz45g.xn--zckzah',
  ];
  for (const id of goodIds) must(idValidate(id), `nip05 valid: ${id}`, idValidate.errors);

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
    if (idValidate(id)) throw new Error(`[FAIL] nip05 invalid accepted: ${id}`);
  }

  // Well-known tests
  const wkValidate = ajv.compile(nostrwellknownSchema);
  must(wkValidate(supplied.wellKnown), 'supplied well-known shape valid', wkValidate.errors);
  const pk = 'b0635d6a9851d3aed0cd6c495b282167acf761729078d975fc341b22650b07b9';
  const goodWK = {
    names: { bob: pk },
    relays: { [pk]: ['wss://relay.example.com', 'wss://relay2.example.com'] },
  };
  must(wkValidate(goodWK), 'well-known valid object', wkValidate.errors);

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
    if (wkValidate(obj)) throw new Error('[FAIL] well-known invalid accepted: ' + JSON.stringify(obj));
  }

  // Allowed cases
  must(wkValidate({ names: {} }), 'well-known allows empty names', wkValidate.errors);
  must(wkValidate({ names: { bob: pk }, relays: { [pk]: ['ws://relay.example.com'] } }), 'well-known allows ws://', wkValidate.errors);

  console.log('[OK] NIP-05 tests passed');
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
