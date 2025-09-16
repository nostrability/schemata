#!/usr/bin/env node
// Minimal bech32 decode for NIP-19 npub -> hex
// No deps; supports bech32 and bech32m checksum variants.

const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const CHARKEY = Object.fromEntries([...CHARSET].map((c, i) => [c, i]));
const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

function polymod(values) {
  let chk = 1;
  for (const v of values) {
    const b = chk >>> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) {
      if ((b >>> i) & 1) chk ^= GEN[i];
    }
  }
  return chk >>> 0;
}

function hrpExpand(hrp) {
  const ret = [];
  for (const c of hrp) ret.push(c.charCodeAt(0) >>> 5);
  ret.push(0);
  for (const c of hrp) ret.push(c.charCodeAt(0) & 31);
  return ret;
}

function verifyChecksum(hrp, data) {
  const pm = polymod([...hrpExpand(hrp), ...data]);
  if (pm === 1) return 'bech32';
  if (pm === 0x2bc830a3) return 'bech32m';
  return null;
}

function decode(bech) {
  const str = bech.toLowerCase();
  const pos = str.lastIndexOf('1');
  if (pos < 1 || pos + 7 > str.length) throw new Error('invalid bech32 separator');
  const hrp = str.slice(0, pos);
  const data = [...str.slice(pos + 1)].map(c => {
    if (!(c in CHARKEY)) throw new Error('invalid bech32 char');
    return CHARKEY[c];
  });
  if (data.length < 6) throw new Error('too short data');
  const variant = verifyChecksum(hrp, data);
  if (!variant) throw new Error('invalid checksum');
  return { hrp, words: data.slice(0, -6), variant };
}

function convertBits(data, from, to, pad) {
  let acc = 0;
  let bits = 0;
  const maxv = (1 << to) - 1;
  const ret = [];
  for (const value of data) {
    if (value < 0 || value >> from !== 0) return null;
    acc = (acc << from) | value;
    bits += from;
    while (bits >= to) {
      bits -= to;
      ret.push((acc >> bits) & maxv);
    }
  }
  if (pad) {
    if (bits > 0) ret.push((acc << (to - bits)) & maxv);
  } else if (bits >= from || ((acc << (to - bits)) & maxv)) {
    return null;
  }
  return ret;
}

function toHex(bytes) {
  return Buffer.from(bytes).toString('hex');
}

function npubToHex(npub) {
  const { hrp, words } = decode(npub);
  if (hrp !== 'npub') throw new Error('expected npub HRP');
  const bytes = convertBits(words, 5, 8, false);
  if (!bytes) throw new Error('bit conversion failed');
  if (bytes.length !== 32) throw new Error('unexpected decoded length');
  return toHex(bytes);
}

// Run as a script
const npub = process.argv[2];
if (npub) {
  try {
    const hex = npubToHex(npub.trim());
    console.log(hex);
  } catch (e) {
    console.error('error:', e.message);
    process.exit(2);
  }
} else {
  // When imported as a module (not run as a script), do not produce output, perform error handling, or have side effects; only export npubToHex.
}

export { npubToHex };
