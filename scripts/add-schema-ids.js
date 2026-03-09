/**
 * add-schema-ids.js
 *
 * Adds $id property to all JSON schema files in dist/nips and dist/mips.
 * The $id will point to the GitHub Pages URL matching the flattened structure.
 *
 * Uses a two-pass system to detect name collisions between NIPs and MIPs:
 *   Pass 1: collect all schemas and their intended output slots
 *   Pass 2: detect collisions, assign prefixed names, write $id
 *
 * NIPs are processed first (alphabetically), then MIPs — matching the
 * glob order used by deploy-pages.yml. The first claimant gets the bare
 * name; subsequent claimants get "${source}_${name}".
 */

import {
  readdirSync,
  readFileSync,
  writeFileSync,
  existsSync
} from 'fs';
import { resolve, join, basename } from 'path';

const GITHUB_PAGES_BASE = 'https://nostrability.github.io/schemata';
const nipsDir = resolve('dist/nips');
const mipsDir = resolve('dist/mips');

function getAllJsonFiles(dir) {
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((ent) => {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      return getAllJsonFiles(full);
    }
    if (ent.name.endsWith('.json')) {
      return [full];
    }
    return [];
  });
}

/**
 * Convert a message directory name to its uppercase protocol name.
 */
function messageSlotName(messageType) {
  switch (messageType) {
    case 'client-req': return 'REQ';
    case 'client-event': return 'EVENT';
    case 'client-close': return 'CLOSE';
    case 'client-auth': return 'AUTH';
    case 'relay-event': return 'EVENT';
    case 'relay-ok': return 'OK';
    case 'relay-eose': return 'EOSE';
    case 'relay-closed': return 'CLOSED';
    case 'relay-notice': return 'NOTICE';
    case 'relay-auth': return 'AUTH';
    default: return messageType.toUpperCase().replace(/-/g, '_');
  }
}

/**
 * Parse a schema file path into a descriptor: { type, slot, source, filePath }
 *   type:   'kind' | 'tag' | 'message' | null
 *   slot:   the bare output name (e.g. 'client', 'REQ', '1')
 *   source: the NIP/MIP directory name (e.g. 'nip-89', 'mip-00')
 */
function parseSchema(filePath) {
  let relativePath;
  if (filePath.startsWith(mipsDir)) {
    relativePath = filePath.replace(mipsDir, '').replace(/^[\\/]/, '');
  } else {
    relativePath = filePath.replace(nipsDir, '').replace(/^[\\/]/, '');
  }
  const parts = relativePath.split(/[/\\]/);

  if (parts.length < 3) return null;
  if (basename(filePath) !== 'schema.json') return null;

  const source = parts[0];  // e.g. "nip-01", "mip-00"
  const typeDir = parts[1]; // e.g. "kind-1", "messages", "tag"

  // Kind schemas
  if (typeDir.startsWith('kind-')) {
    const kind = typeDir.replace('kind-', '');
    return { type: 'kind', slot: kind, source, filePath };
  }

  // Message schemas
  if (typeDir === 'messages' && parts.length >= 4) {
    const messageType = parts[2];
    return { type: 'message', slot: messageSlotName(messageType), source, filePath };
  }

  // Tag schemas
  if (typeDir === 'tag') {
    // nip-XX/tag/schema.json — generic tag
    if (parts.length === 3 && parts[2] === 'schema.json') {
      return { type: 'tag', slot: 'generic', source, filePath };
    }
    // nip-XX/tag/X/schema.json — named tag
    if (parts.length >= 4) {
      const tagName = parts[2];
      return { type: 'tag', slot: tagName, source, filePath };
    }
  }

  return null;
}

function main() {
  console.log('Adding $id properties to schema files...');

  // Collect all JSON files — NIPs first (alphabetically), then MIPs
  const jsonFiles = [...getAllJsonFiles(nipsDir), ...getAllJsonFiles(mipsDir)];
  console.log(`Found ${jsonFiles.length} JSON files to process`);

  // Pass 1: parse all schemas into descriptors
  const descriptors = [];
  for (const filePath of jsonFiles) {
    const desc = parseSchema(filePath);
    if (desc) {
      descriptors.push(desc);
    } else {
      console.log(`Skipping ${filePath} - doesn't match flattened structure`);
    }
  }

  // Pass 2: detect collisions and assign $id
  // Track claimed slots per type: Map<slot, source>
  const seenTags = new Map();
  const seenMessages = new Map();

  for (const desc of descriptors) {
    let outputName;

    if (desc.type === 'tag') {
      if (seenTags.has(desc.slot)) {
        // Collision: prefix with source
        outputName = `${desc.source}_${desc.slot}`;
        console.log(`  Collision: tag "${desc.slot}" already claimed by ${seenTags.get(desc.slot)}, using ${outputName} for ${desc.source}`);
      } else {
        outputName = desc.slot;
        seenTags.set(desc.slot, desc.source);
      }
    } else if (desc.type === 'message') {
      if (seenMessages.has(desc.slot)) {
        outputName = `${desc.source}_${desc.slot}`;
        console.log(`  Collision: message "${desc.slot}" already claimed by ${seenMessages.get(desc.slot)}, using ${outputName} for ${desc.source}`);
      } else {
        outputName = desc.slot;
        seenMessages.set(desc.slot, desc.source);
      }
    } else if (desc.type === 'kind') {
      // Kinds: no collision handling (separate issue)
      outputName = desc.slot;
    } else {
      continue;
    }

    // Build the $id URL
    let schemaId;
    if (desc.type === 'kind') {
      schemaId = `${GITHUB_PAGES_BASE}/note/kind/${outputName}.json`;
    } else if (desc.type === 'tag') {
      schemaId = `${GITHUB_PAGES_BASE}/tag/${outputName}.json`;
    } else if (desc.type === 'message') {
      schemaId = `${GITHUB_PAGES_BASE}/message/${outputName}.json`;
    }

    // Write $id into the schema file
    try {
      const content = readFileSync(desc.filePath, 'utf8');
      const schema = JSON.parse(content);
      schema['$id'] = schemaId;
      writeFileSync(desc.filePath, JSON.stringify(schema, null, 2));
      console.log(`Added $id to ${desc.filePath}: ${schemaId}`);
    } catch (error) {
      console.error(`Error processing ${desc.filePath}:`, error.message);
    }
  }

  console.log('Finished adding $id properties!');
}

main();
