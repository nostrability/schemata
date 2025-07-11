# @nostrability/schemata

JSON Schema definitions for Nostr protocol events, messages, and tags. Validate Nostr data structures in any programming language.

<<<<<<< Updated upstream
## Validators
Validators are tools that wrap the schemata to provide validation capabilities. They can be written in nay language. They utilize the json-schema artifacts produced by this repository.
- [`@nostrwatch/schemata-js-ajv`](https://github.com/sandwichfarm/nostr-watch/tree/next/libraries/schemata-js-ajv) - Typescript library for validating nostr events, depends on this package.

## Adding new Schemas
`@nostrability/schemata` assumes a kind is associated to a NIP. For development purposes you can bypass this by creating the directory "nipless".

### Conventions
Schemas are conventioned. They are included in directories for support purposes (complex multi-stage validation cases) with the following directory structure.

## Usage 
1. Download ZIP file (all languages) or include package (js only for now)
2. Validate `.json` schemas against nostr events. 
=======
## Quick Start

### For Users (Validate Nostr Events)
>>>>>>> Stashed changes

```bash
# Install the package (JavaScript/TypeScript)
npm install @nostrability/schemata

# Or download pre-built schemas for any language
curl -L https://github.com/nostrability/schemata/releases/latest/download/schemata.zip -o schemata.zip
```

```javascript
import { noteSchema, kind1Schema } from '@nostrability/schemata';
import Ajv from 'ajv';

const ajv = new Ajv();
const validate = ajv.compile(kind1Schema);

if (validate(nostrEvent)) {
  console.log('Valid event!');
} else {
  console.log('Validation errors:', validate.errors);
}
```

### For Contributors (Add New Schemas)

```bash
# Clone and setup
git clone https://github.com/nostrability/schemata.git
cd schemata
pnpm install
pnpm build

# Create new schema
mkdir -p nips/nip-XX/kind-YYYY
echo '$id: "https://schemata.nostr.watch/note/kind/YYYY"' > nips/nip-XX/kind-YYYY/schema.yaml
```

## What's Included

- **Event Schemas**: Validate structure of all standard Nostr event kinds
- **Message Schemas**: Validate WebSocket messages (REQ, EVENT, OK, etc.)
- **Tag Schemas**: Validate event tags (e, p, a, d, t, etc.)
- **Multi-language Support**: Generated validation code for Python, Rust, Go, Java, Swift, Kotlin

## Documentation

- 📖 **[Using Schemas](docs/usage.md)** - How to integrate schemas in your project
- 🛠️ **[Contributing](docs/contributing.md)** - How to add new schemas
- 🏗️ **[Architecture](docs/architecture.md)** - Technical design and build process

## Available Schemas

<details>
<summary>Core Schemas</summary>

- `@/note` - Base event structure (id, pubkey, created_at, kind, tags, content, sig)
- `@/secp256k1` - Validate secp256k1 keys and signatures
- `@/tag` - Base tag array structure
- `@/message/filter` - REQ message filters

</details>

<details>
<summary>Event Kinds (NIPs)</summary>

- **NIP-01**: `kind-0` (metadata), `kind-1` (text note), `kind-3` (contacts)
- **NIP-40**: `kind-40` (channel creation), `kind-41` (channel metadata), `kind-42` (channel message)
- More NIPs being added regularly

</details>

<details>
<summary>Tags</summary>

- `a` - Replaceable event reference
- `d` - Identifier for replaceable events  
- `e` - Event reference
- `p` - Public key reference
- `t` - Hashtag

</details>

## Installation

### NPM Package

```bash
npm install @nostrability/schemata
```

### Download Schemas

```bash
# Latest release with all languages
curl -L https://github.com/nostrability/schemata/releases/latest/download/schemata.zip -o schemata.zip

# Specific version
curl -L https://github.com/nostrability/schemata/releases/download/v0.1.1/schemata-v0.1.1.zip -o schemata.zip
```

### Programmatic Access

```javascript
// Get latest release info
const response = await fetch('https://api.github.com/repos/nostrability/schemata/releases/latest');
const release = await response.json();
console.log(release.assets[0].browser_download_url);
```

## Build From Source

```bash
# Clone repository
git clone https://github.com/nostrability/schemata.git
cd schemata

# Install dependencies
pnpm install

# Build schemas
pnpm build

# Generate code for all languages
pnpm build:all
```

## Project Structure

```
schemata/
├── @/                  # Aliases (shortcuts to schemas)
├── nips/               # Schema implementations by NIP
│   ├── nip-01/        # Core protocol
│   └── nip-*/         # Other NIPs
├── dist/               # Built schemas (git-ignored)
│   ├── @/             # Compiled aliases
│   ├── nips/          # Compiled schemas
│   └── bundle/        # JavaScript bundle
└── docs/              # Documentation
```

## Related Projects

- [`@nostrwatch/schemata-js-ajv`](https://github.com/sandwichfarm/nostr-watch/tree/next/libraries/schemata-js-ajv) - TypeScript validation library using these schemas

## Contributing

We welcome contributions! See [Contributing Guide](docs/contributing.md) for details.

Quick tips:
- Schemas are written in YAML, compiled to JSON
- Follow existing patterns for consistency
- Include error messages and descriptions
- Test with valid/invalid examples

## License

MIT

## Support

- 🐛 [Report Issues](https://github.com/nostrability/schemata/issues)
- 💬 [Discussions](https://github.com/nostrability/schemata/discussions)
- 📧 Contact: [your-email]