// Simple schema tests for NIP-05 identifier and well-known document
import Ajv from 'ajv';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load JSON schemas directly from dist to avoid ESM JSON import assertions
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
  // Identifier tests
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
    must(idValidate(id), `nip05 valid: ${id}`, idValidate.errors);
  }

  const badIds = [
    'bob@localhost', // no dot in domain
    'bad@@example.com',
    'no-at-symbol.example.com',
    'name@exa_mple.com', // underscore in domain label not allowed
    'bob@-example.com', // label cannot start with hyphen
    'bob@example-.com', // label cannot end with hyphen
    'bob@sub..example.com', // empty label
  ];
  for (const id of badIds) {
    if (idValidate(id)) {
      throw new Error(`[FAIL] nip05 invalid accepted: ${id}`);
    }
  }

  // Well-known tests
  const wkValidate = ajv.compile(nostrwellknownSchema);
  const pk = 'b0635d6a9851d3aed0cd6c495b282167acf761729078d975fc341b22650b07b9';
  const goodWK = {
    names: { bob: pk },
    relays: { [pk]: ['wss://relay.example.com', 'wss://relay2.example.com'] },
  };
  must(wkValidate(goodWK), 'well-known valid object', wkValidate.errors);

  const badWKs = [
    { names: { 'BadCaps': pk } }, // invalid name key
    { names: { bob: 'npub1xyz' } }, // value must be hex pubkey
    { names: { bob: pk }, relays: { nothex: ['wss://relay.example.com'] } },
    { names: { bob: pk }, relays: { [pk]: ['https://not-ws.example.com'] } },
    { names: { bob: pk }, extra: true }, // disallow additionalProperties
    { names: { bob: pk }, relays: { [pk]: ['ws:/bad'] } }, // bad URL format
    { names: { bob: pk }, relays: { [pk]: [123] } }, // non-string URL
  ];

  // Well-known: should allow empty maps
  const emptyWK = { names: {} };
  must(wkValidate(emptyWK), 'well-known allows empty names', wkValidate.errors);

  // Well-known: ws:// should be allowed
  const wsAllowed = { names: { bob: pk }, relays: { [pk]: ['ws://relay.example.com'] } };
  must(wkValidate(wsAllowed), 'well-known allows ws://', wkValidate.errors);
  for (const obj of badWKs) {
    if (wkValidate(obj)) {
      throw new Error('[FAIL] well-known invalid object accepted: ' + JSON.stringify(obj));
    }
  }

  console.log('[OK] All NIP-05 tests passed');
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
