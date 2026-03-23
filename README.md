# @nostrability/schemata

[![Test](https://github.com/nostrability/schemata/actions/workflows/test.yml/badge.svg)](https://github.com/nostrability/schemata/actions/workflows/test.yml)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/nostrability/schemata)

JSON Schema definitions for Nostr protocol events, messages, and tags. Validate Nostr data structures in any programming language.

**Quick Links:** [Installation](#installation) • [Quick Start](#quick-start) • [Available Schemas](#available-schemas) • [Contributing](#contributing) • [Build From Source](#build-from-source)

## Why JSON-Schema?
[JSON-Schema has the most active, widely supported specification standard, with the largest community and ecosystem](https://github.com/json-schema-org/json-schema-spec). **Most importantly, it is one of the few schema specification standards that support deep specification of strings (via formats or regex), making the nostresque typing of strings and the tuples that contain them possible.** There are schema validators and generators [schema-to-code] for Server Stubs and Client-SDKs available in every single language provided by the JSON-Schema community. The wide availability of JSON-Schema tooling lends itself to creating a system that caters specifically to the requirements of nostr as well as creating an **extensible** and **maintainable** system; which is why this exists.

## How is JSON-Schema different from Test Vectors?
In a nutshell JSON-Schema validates that the structure of the JSON blob is correct. JSON-Schema for a particular [kind](https://github.com/nostr-protocol/nips?tab=readme-ov-file#event-kinds) returns either a pass, or a fail. Whereas test vectors are a deterministic check - a certain input is made, and a certain output is expected. JSON blob validation does not preclude test vectors approach. Test vectors are outside the scope of schemata.

## Which JSON Schema specification version does schemata use?

[Draft-07](https://json-schema.org/draft-07/schema) to maximize interoperability, and simplicity.

## What is `@nostrability/schemata` good for?
- Integration Testing of both Clients and Relays
- Discovering broken events through fuzz testing
- As a fixture to generate dummy events that are valid 
- As an input to a stub and client-sdk generation effort (presently, tuples of strings have extremely limited support in JSON-Schema ecosystem, we could change this)

## What is it not good for?
- Runtime validation of events where performance is critical (JSON-Schema is notoriously slow due to the breadth of the specification)

## Alternatives?
`@fiatjaf` produced a bespoke schema specification solution available [here](https://github.com/nostr-protocol/registry-of-kinds). The benefit of this is that it includes only what it needs to and so its specification drafted for nostr and so the performance is notably better. The performance improvements make it sufficient for use as a runtime validator in performance sensitive applications. The downside is that validators need to be written and maintained for all languages, tooling is non-existent so workflows that benefit maintenance and extensibility are non-existent, all kinds are specified from a single file and any generator pattern would need to be completely rewritten from scratch. A nostr-specific schema validator may prove to be the best long-term solution, with the caveat that it will take extensive development for it to reach maturity.

## Why not any of the other *`n`* specification formats that are more performant and modern?
Read this closely and please understand: **Tuples of Strongly Typed Strings.** Yes, *Strongly Typed Strings*. Strongly typing strings is kind of unique to nostr. This concept is considered absurd in conventional system design. Thus, support for "Strongly Typed Strings" does not exist basically anywhere by default, except JSON-Schemas where it kind of exists by accident ... Could we change this? Yes! Are you volunteering? 

## How is it intended to be used?
`@nostability/schemata` aims to produce JSON-Schema that can be consumed by validators (for example, `ajv`). Ideally, each language would have one or more validator wrappers. The validator wrappers provide nostr specific methods to make utilization more straightforward for implementers. The original author of this repo has provided an example of this approach below


## Data Packages

Data packages vendor the compiled JSON schemas and provide a registry lookup for each language. They are consumed by validators.

| Language | Data Package | Registry API |
|----------|-------------|--------------|
| JS/TS | [`@nostrability/schemata`](https://www.npmjs.com/package/@nostrability/schemata) (npm) | `import { kind1Schema } from '@nostrability/schemata'` |
| Rust | [`schemata-rs`](https://github.com/nostrability/schemata-rs) | `schemata_rs::get("kind1Schema")` |
| Go | [`schemata-go`](https://github.com/nostrability/schemata-go) | `schemata.Get("kind1Schema")` |
| Python | [`schemata-py`](https://github.com/nostrability/schemata-py) | `schemata.get("kind1Schema")` |
| Kotlin | [`schemata-kt`](https://github.com/nostrability/schemata-kt) | `Schemata.get("kind1Schema")` |
| Java | [`schemata-java`](https://github.com/nostrability/schemata-java) | `Schemata.get("kind1Schema")` |
| Swift | *(bundled in validator)* | `SchemataValidator.getSchema("kind1Schema")` |
| Dart | [`schemata-dart`](https://github.com/nostrability/schemata-dart) | `Schemata.get('kind1Schema')` |
| PHP | [`schemata-php`](https://github.com/nostrability/schemata-php) | `Schemata::get('kind1Schema')` |
| C#/.NET | [`schemata-csharp`](https://github.com/nostrability/schemata-csharp) | `Schemata.Get("kind1Schema")` |
| C++ | [`schemata-cpp`](https://github.com/nostrability/schemata-cpp) | `schemata::get("kind1Schema")` |
| Ruby | [`schemata-ruby`](https://github.com/nostrability/schemata-ruby) | `SchemataNostr.get('kind1Schema')` |

> **Note:** Swift uses a single-package approach (schemas inlined into the validator) because SPM resource bundles cause iOS codesign failures. See [#88](https://github.com/nostrability/schemata/issues/88) for details on how this applies to future Kotlin Multiplatform support.

## Validators

Validators wrap a JSON Schema library and the data package to provide nostr-specific validation methods (`validateNote`, `validateNip11`, `validateMessage`). Best used in **CI and integration tests**, not runtime hot paths.

| Language | Validator | JSON Schema Library |
|----------|-----------|-------------------|
| JS/TS | [`@nostrwatch/schemata-js-ajv`](https://github.com/sandwichfarm/nostr-watch/tree/next/libraries/schemata-js-ajv) | [ajv](https://ajv.js.org/) |
| Rust | [`schemata-validator-rs`](https://github.com/nostrability/schemata-validator-rs) | [jsonschema](https://crates.io/crates/jsonschema) |
| Go | [`schemata-validator-go`](https://github.com/nostrability/schemata-validator-go) | [jsonschema/v6](https://github.com/santhosh-tekuri/jsonschema) |
| Python | [`schemata-validator-py`](https://github.com/nostrability/schemata-validator-py) | [jsonschema](https://python-jsonschema.readthedocs.io/) |
| Kotlin | [`schemata-validator-kt`](https://github.com/nostrability/schemata-validator-kt) | [json-schema-validator](https://github.com/networknt/json-schema-validator) |
| Java | [`schemata-validator-java`](https://github.com/nostrability/schemata-validator-java) | [json-schema-validator](https://github.com/networknt/json-schema-validator) |
| Swift | [`schemata-validator-swift`](https://github.com/nostrability/schemata-validator-swift) | [JSONSchema.swift](https://github.com/kylef/JSONSchema.swift) |
| Dart | [`schemata-validator-dart`](https://github.com/nostrability/schemata-validator-dart) | [json_schema](https://pub.dev/packages/json_schema) |
| PHP | [`schemata-validator-php`](https://github.com/nostrability/schemata-validator-php) | [opis/json-schema](https://opis.io/json-schema/) |
| C#/.NET | [`schemata-validator-csharp`](https://github.com/nostrability/schemata-validator-csharp) | [JsonSchema.Net](https://github.com/gregsdennis/json-everything) |
| C++ | [`schemata-validator-cpp`](https://github.com/nostrability/schemata-validator-cpp) | [valijson](https://github.com/tristanpenman/valijson) |
| Ruby | [`schemata-validator-ruby`](https://github.com/nostrability/schemata-validator-ruby) | [json_schemer](https://github.com/davishmcclurg/json_schemer) |

## Adding new Schemas
`@nostrability/schemata` assumes a kind is associated to a NIP and so the schemas are organized by NIP. The system has `aliases` that are generated via the build-script. The aliases make it easier to reference commonly reused schemas (such as tags, and base schemata like `note`). 

### Conventions
Schemas are conventioned. They are included in directories for support purposes (complex multi-stage validation cases) with the following directory structure (using the NIP-01 directory as an example)

```
. 
├── kind-0
├── kind-1
├── messages
│   ├── client-close
│   ├── ...
├── note
├── note-unsigned
├── secp256k1
└── tag
    ├── a
    ├── d
    ├── e
    ├── p
    └── t
```

Note: For payloads like `NIP-11` where it breaks the general "event" or "message" pattern, just place a `schema.yaml` in the NIP's directory. 

## Generating Stubs/Client-SDKs
Unfortunately, as of writing, none of the Stub or Client-SDK generators produce useful logic for tuples, and more importantl tuples of "typed strings". The reason for this is that tuples are not utilized in conventional programming as extensively as in nostr, so the maintainers of these generators are doing themselves a favor by not fully support tuples. However, that does not mean it is not possible. Generators could be written by the nostr community by forking existing generators (available in basically every language, even esoteric languages!) and writing nostr specific implementations. The result would negate any requirement for runtime validation via JSON-Schema since the validation would be handled programmatically by the generated Stub and/or Client-SDKs identically. 

## Usage 
1. Download ZIP file (all languages) or include package (js only for now)
2. Validate `.json` schemas against nostr events. 

## Quick Start

### For Users (Validate Nostr Events)

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

## Documentation
- 📖 **[Using Schemas](docs/usage.md)** - How to integrate schemas in your project
- 🛠️ **[Contributing](docs/contributing.md)** - How to add new schemas
- 🏗️ **[Architecture](docs/architecture.md)** - Technical design and build process

## Available Schemas

<details>
<summary>Event Kinds</summary>

- `kind-0` - Profile metadata (NIP-01)
- `kind-1` - Text note (NIP-01)  
- `kind-3` - Contact list (NIP-02)
- `kind-6` - Repost (NIP-18)
- `kind-16` - Generic repost (NIP-18)
- `kind-1111` - Comment (NIP-22)
- `kind-9802` - Highlight (NIP-84)
- `kind-10002` - Relay list metadata (NIP-65)
- `kind-13194` - Wallet Connect info (NIP-47)
- `kind-23194` - Wallet Connect request (NIP-47)
- `kind-23195` - Wallet Connect response (NIP-47)
- `kind-23196` - Wallet Connect notification, NIP-04 (NIP-47)
- `kind-23197` - Wallet Connect notification, NIP-44 (NIP-47)
- `kind-24133` - Nostr Connect request/response (NIP-46)

</details>

<details>
<summary>Protocol Messages</summary>

**Client to Relay:**
- `client-req` - Request events (REQ)
- `client-event` - Publish event (EVENT)
- `client-close` - Close subscription (CLOSE)
- `client-auth` - Authentication (AUTH)

**Relay to Client:**
- `relay-event` - Event delivery (EVENT)
- `relay-ok` - Command result (OK)
- `relay-eose` - End of stored events (EOSE)
- `relay-closed` - Subscription closed (CLOSED)
- `relay-notice` - Human-readable message (NOTICE)
- `relay-auth` - Authentication challenge (AUTH)

**Other:**
- `filter` - REQ message filter object

</details>

<details>
<summary>Tags</summary>

**Standard Tags:**
- `e` - Event reference
- `p` - Public key reference
- `a` - Replaceable event reference
- `d` - Identifier for replaceable events
- `t` - Hashtag
- `k` - Kind number reference
- `r` - Reference/relay URL

**NIP-84 Tags:**
- `context` - Context string for highlights
- `comment` - Quote highlight comment

**NIP-22 Comment Tags (uppercase):**
- `_E` - Uppercase event reference
- `_P` - Uppercase public key reference
- `_A` - Uppercase replaceable event reference
- `_K` - Uppercase kind reference

**NIP-47 Tags:**
- `encryption` - Supported encryption method
- `notifications` - Supported notification types

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
├── mips/               # Schema implementations by MIP (Marmot Improvement Proposals)
│   └── mip-00/        # MLS protocol schemas
├── dist/               # Built schemas (git-ignored)
│   ├── @/             # Compiled aliases
│   ├── nips/          # Compiled schemas
│   ├── mips/          # Compiled MIP schemas
│   └── bundle/        # JavaScript bundle
└── docs/              # Documentation
```

## Used By

| Project | Language | Usage | Status |
|---------|----------|-------|--------|
| [nostr-watch](https://github.com/sandwichfarm/nostr-watch) | TypeScript | Relay auditing pipeline (NIP-01, NIP-02, NIP-11, NIP-22, NIP-42, NIP-77) and GUI validation | Merged ([`0e865bf`](https://github.com/sandwichfarm/nostr-watch/commit/0e865bfccd307f39e87433f1823c00e457383459)) |
| [Synvya/client](https://github.com/Synvya/client) | TypeScript | Runtime pre-publish validation of kind-0, kind-1, and kind-30402 events | Merged ([#159](https://github.com/Synvya/client/pull/159)) |
| [applesauce](https://github.com/hzrd149/applesauce) | TypeScript | Kind-0 and kind-1 event serialization validation in CI | Merged ([#39](https://github.com/hzrd149/applesauce/pull/39)) |
| [notedeck](https://github.com/damus-io/notedeck) | Rust | enostr::Note serialization validation in CI | PR ([#1405](https://github.com/damus-io/notedeck/pull/1405)) |
| [damus](https://github.com/damus-io/damus) | Swift | NostrEvent serialization validation in CI | PR ([#3716](https://github.com/damus-io/damus/pull/3716)) |

## Contributing

We welcome contributions! See [Contributing Guide](docs/contributing.md) for details.

Quick tips:
- Schemas are written in YAML, compiled to JSON
- Follow existing patterns for consistency
- Include error messages and descriptions
- Test with valid/invalid examples

## Releasing

For maintainers: See [RELEASE.md](RELEASE.md) for the step-by-step release process.

## License

[GPL-3.0-or-later](LICENSE)

## Support

- 🐛 [Report Issues](https://github.com/nostrability/schemata/issues)
- 💬 [Discussions](https://github.com/nostrability/schemata/discussions)
- 📧 Contact: [iris.to/npub1zafcms4xya5ap9zr7xxr0jlrtrattwlesytn2s42030lzu0dwlzqpd26k5]
