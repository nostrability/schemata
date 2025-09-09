# Using Nostr Schemata in Your Project

This guide explains how to use the Nostr schemata artifacts in your own language/project.

## Available Formats

The schemata are available in multiple formats:

1. **JSON Schema files** - The core validation schemas
2. **Language-specific code** - Generated validation code for various languages
3. **JavaScript/TypeScript bundle** - Pre-built ES module with all schemas

## Installation Methods

### 1. Download Release Artifacts

Download the latest release ZIP containing all generated code:

```bash
# Download latest release
curl -L https://github.com/nostrability/schemata/releases/latest/download/schemata-v0.1.1.zip -o schemata.zip
unzip schemata.zip
```

The ZIP contains:
- `dist/` - All JSON schemas and bundles
- Language-specific generated code (when available)

### 2. Programmatic Download

Use the GitHub API to fetch releases programmatically:

```javascript
// Fetch latest release
const response = await fetch('https://api.github.com/repos/nostrability/schemata/releases/latest');
const release = await response.json();
const downloadUrl = release.assets[0].browser_download_url;

// Download the artifact
const artifactResponse = await fetch(downloadUrl);
const artifactBuffer = await artifactResponse.arrayBuffer();
```

### 3. Direct Repository Access

Clone or download specific versions:

```bash
# Clone specific tag
git clone --branch v0.1.1 https://github.com/nostrability/schemata.git

# Download source archive
curl -L https://github.com/nostrability/schemata/archive/refs/tags/v0.1.1.tar.gz -o source.tar.gz
```

### 4. NPM Package (JavaScript/TypeScript)

```bash
npm install @nostrability/schemata
# or
yarn add @nostrability/schemata
# or
pnpm add @nostrability/schemata
```

## Using the Schemas

### JavaScript/TypeScript

```javascript
import { noteSchema, kind1Schema, eTagSchema } from '@nostrability/schemata';
import Ajv from 'ajv';

const ajv = new Ajv();
const validate = ajv.compile(noteSchema);

const event = {
  id: "...",
  pubkey: "...",
  created_at: 1234567890,
  kind: 1,
  tags: [],
  content: "Hello Nostr!",
  sig: "..."
};

if (validate(event)) {
  console.log('Valid event!');
} else {
  console.log('Invalid event:', validate.errors);
}
```

### Other Languages

After downloading the release artifact, use the generated code for your language:

- **Python**: `dist/packages/python/`
- **Rust**: `dist/packages/rust/`
- **Go**: `dist/packages/go/`
- **Java**: `dist/packages/java/`
- **Swift**: `dist/packages/swift/`
- **Kotlin**: `dist/packages/kotlin/`

Each language directory contains generated validation code with language-specific usage instructions.

### Direct JSON Schema Usage

Use the JSON schemas directly with any JSON Schema validator:

```python
import json
import jsonschema

# Load schema
with open('dist/@/note.json', 'r') as f:
    schema = json.load(f)

# Validate event
event = {...}
jsonschema.validate(event, schema)
```

## Writing Validation Wrappers

If you're building a validation library, follow these conventions:

```typescript
// Required types
type NSchemaResult = [boolean, NSchemaMessage[]];

interface NSchemaMessage {
    level: "info" | "warning" | "error";
    message: string;
}

// Required interface
interface NostrValidator {
    validate(event: NostrEvent): NSchemaResult;
    validateMany(events: NostrEvent[]): NSchemaResult[];
}
```

## Available Schemas

### Core Schemas (`@/`)
- `note` - Base event structure
- `secp256k1` - Secp256k1 key/signature validation
- `tag` - Base tag array structure
- `message/filter` - Filter for REQ messages

### Event Kinds (`nips/nip-*/kind-*/`)
- `kind-0` - Metadata
- `kind-1` - Short text note  
- `kind-3` - Contacts
- `kind-40` - Channel creation
- `kind-41` - Channel metadata
- `kind-42` - Channel message

### Tags (`@/tag/*/`)
- `a` - Replaceable event tag
- `d` - Identifier tag
- `e` - Event reference tag
- `p` - Pubkey tag
- `t` - Hashtag

### Messages (`nips/nip-01/messages/`)
- `client/req` - REQ message
- `client/event` - EVENT message
- `client/close` - CLOSE message
- `relay/event` - EVENT response
- `relay/ok` - OK response
- `relay/eose` - EOSE response
- `relay/closed` - CLOSED response
- `relay/notice` - NOTICE message

## Version Management

Check for new releases via:
- GitHub Releases API
- Git tags
- NPM registry (for JavaScript)

Always specify exact versions in production to ensure consistency.