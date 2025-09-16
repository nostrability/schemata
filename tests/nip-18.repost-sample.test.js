import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, test, expect } from 'vitest';

function loadSchema(path) {
  return JSON.parse(readFileSync(resolve(path), 'utf8'));
}

describe('NIP-18: real repost sample validates', () => {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);

  test('kind-6 repost with embedded content and tags', () => {
    const schema = loadSchema('dist/nips/nip-18/kind-6/schema.json');
    const validate = ajv.compile(schema);

    const event = {"content":"{\"content\":\"Riverbank https:\\/\\/image.nostr.build\\/1fe17b310dc2298628c83599fd31ae2fb8ccf6f66aab45e4611b288161c1a7bb.gif\",\"tags\":[[\"alt\",\"A short note: Riverbank https:\\/\\/image.nostr.build\\/1fe17b310dc229...\"],[\"r\",\"https:\\/\\/image.nostr.build\\/1fe17b310dc2298628c83599fd31ae2fb8ccf6f66aab45e4611b288161c1a7bb.gif\"],[\"imeta\",\"url https:\\/\\/image.nostr.build\\/1fe17b310dc2298628c83599fd31ae2fb8ccf6f66aab45e4611b288161c1a7bb.gif\",\"x 4de8de1081a39e0e88b39a50d19a3ea9b082eefcf0205c9e8450f2ba9c8da941\",\"size 1484549\",\"m image\\/gif\",\"dim 656x368\",\"blurhash iFDvckIp00ofs,j?tRjZ%gMaIop0xat7tSM_WAfk.9xZD%tRWBjEa~WXxa_Nf59FWBf,xvV@M{%MR4RitSbct7s.M{ayjs\",\"ox 4de8de1081a39e0e88b39a50d19a3ea9b082eefcf0205c9e8450f2ba9c8da941\",\"alt \"]],\"kind\":1,\"pubkey\":\"0a69cf2560597cd4dfff9a75f40261d902a91b139cdacea10d54a52b43219250\",\"sig\":\"69258c84badbbb3cccaa204edb185d48f18d0d03b4d510fa145c2c3bd0c4aed6ab6f3ac65a7b6fce3125d2fadd38a0113f7134eb18350baaeb022528a0fa51b9\",\"id\":\"6d52117ba1560049e0681ae99e520953096876e44572497fb6992718d7cfe561\",\"created_at\":1757785121}","created_at":1757785398,"id":"34dbed02dafdba7e7ca200e094df812c8cba6ac5906de6d73c06df988ad92509","kind":6,"pubkey":"17538dc2a62769d09443f18c37cbe358fab5bbf981173542aa7c5ff171ed77c4","sig":"04eb2a862caddf3a95ae11e1c7cf361392f12993feeaebf9d393be892815c759f7c3a070af012042b29928fc2904809b5edac86f4de75b367e9a3fe15a222a82","tags":[["e","6d52117ba1560049e0681ae99e520953096876e44572497fb6992718d7cfe561","wss://nos.lol","root","0a69cf2560597cd4dfff9a75f40261d902a91b139cdacea10d54a52b43219250"],["p","0a69cf2560597cd4dfff9a75f40261d902a91b139cdacea10d54a52b43219250","wss://nos.lol"]]};

    expect(validate(event)).toBe(true);
    if (!validate(event)) console.error(validate.errors);
  });
});

