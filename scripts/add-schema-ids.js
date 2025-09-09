/**
 * add-schema-ids.js
 * 
 * Adds $id property to all JSON schema files in dist/nips
 * The $id will point to the GitHub Pages URL matching the flattened structure
 */

import {
  readdirSync,
  readFileSync,
  writeFileSync,
  existsSync
} from 'fs';
import { resolve, join, basename, dirname } from 'path';

const GITHUB_PAGES_BASE = 'https://nostrability.github.io/schemata';
const nipsDir = resolve('dist/nips');

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

function getSchemaId(filePath) {
  // Parse the path to determine the type and generate the correct URL
  const relativePath = filePath.replace(nipsDir, '').replace(/^[\\/]/, '');
  const parts = relativePath.split(/[/\\]/);
  
  // parts[0] = nip-XX
  // parts[1] = kind-YY | messages | tag | ...
  // parts[2] = schema.json or subfolder
  
  if (parts.length < 3) return null;
  
  const nipDir = parts[0]; // e.g., "nip-01"
  const typeDir = parts[1]; // e.g., "kind-1", "messages", "tag"
  
  // Handle kind schemas
  if (typeDir.startsWith('kind-')) {
    const kind = typeDir.replace('kind-', '');
    if (basename(filePath) === 'schema.json') {
      return `${GITHUB_PAGES_BASE}/note/kind/${kind}.json`;
    }
  }
  
  // Handle message schemas
  if (typeDir === 'messages' && parts.length >= 3) {
    const messageType = parts[2]; // e.g., "client-req", "relay-event"
    if (basename(filePath) === 'schema.json') {
      // Convert message type to uppercase format used in GitHub Pages
      let msgName;
      switch(messageType) {
        case 'client-req': msgName = 'REQ'; break;
        case 'client-event': msgName = 'EVENT'; break;
        case 'client-close': msgName = 'CLOSE'; break;
        case 'client-auth': msgName = 'AUTH'; break;
        case 'relay-event': msgName = 'EVENT'; break;
        case 'relay-ok': msgName = 'OK'; break;
        case 'relay-eose': msgName = 'EOSE'; break;
        case 'relay-closed': msgName = 'CLOSED'; break;
        case 'relay-notice': msgName = 'NOTICE'; break;
        case 'relay-auth': msgName = 'AUTH'; break;
        default: 
          msgName = messageType.toUpperCase().replace(/-/g, '_');
      }
      
      // Note: In the deploy workflow, if there are conflicts, it prefixes with nip name
      // For now, we'll use the simple name as the primary ID
      return `${GITHUB_PAGES_BASE}/message/${msgName}.json`;
    }
  }
  
  // Handle tag schemas
  if (typeDir === 'tag') {
    // If we only have nip-XX/tag/schema.json (generic tag schema)
    if (parts.length === 2 && parts[1] === 'tag' && basename(filePath) === 'schema.json') {
      return `${GITHUB_PAGES_BASE}/tag/generic.json`;
    } 
    // If we have nip-XX/tag/X/schema.json (specific tag schema)
    else if (parts.length >= 3 && parts[2] !== 'schema.json') {
      const tagName = parts[2]; // e.g., "e", "p", "a", "_P"
      if (basename(filePath) === 'schema.json') {
        return `${GITHUB_PAGES_BASE}/tag/${tagName}.json`;
      }
    }
    // If parts[2] is 'schema.json', it means we have nip-XX/tag/schema.json
    else if (parts.length === 3 && parts[2] === 'schema.json') {
      return `${GITHUB_PAGES_BASE}/tag/generic.json`;
    }
  }
  
  // For other schemas that don't match the flattened structure, return null
  return null;
}

function processSchema(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const schema = JSON.parse(content);
    
    const schemaId = getSchemaId(filePath);
    if (schemaId) {
      // Add or overwrite the $id property
      schema['$id'] = schemaId;
      
      // Write back the modified schema
      writeFileSync(filePath, JSON.stringify(schema, null, 2));
      console.log(`Added $id to ${filePath}: ${schemaId}`);
    } else {
      console.log(`Skipping ${filePath} - doesn't match flattened structure`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

function main() {
  console.log('Adding $id properties to schema files...');
  
  const jsonFiles = getAllJsonFiles(nipsDir);
  console.log(`Found ${jsonFiles.length} JSON files to process`);
  
  jsonFiles.forEach(processSchema);
  
  console.log('Finished adding $id properties!');
}

main();