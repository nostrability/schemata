# @nostrability/schemata

[![npm](https://img.shields.io/npm/v/@nostrability/schemata)](https://www.npmjs.com/package/@nostrability/schemata)
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
- 🔍 **[Validator Compatibility](VALIDATORS.md)** - Cross-language API surface comparison

## Available Schemas

173 event kind schemas across 65 NIP/MIP directories, plus protocol messages and tags.

<details>
<summary>Event Kinds (173 schemas)</summary>

**NIP-01** — Core protocol
- `kind-0` - Profile metadata
- `kind-1` - Text note

**NIP-02** — Contact list
- `kind-3` - Contact list / follows

**NIP-03** — OpenTimestamps
- `kind-1040` - OpenTimestamps attestation

**NIP-04** — Encrypted DMs (deprecated)
- `kind-4` - Encrypted direct message

**NIP-09** — Event deletion
- `kind-5` - Event deletion request

**NIP-17** — Private direct messages
- `kind-14` - Chat message (rumor)
- `kind-15` - File header
- `kind-10050` - Relay list for DMs

**NIP-18** — Reposts
- `kind-6` - Repost
- `kind-16` - Generic repost

**NIP-22** — Comments
- `kind-1111` - Comment

**NIP-23** — Long-form content
- `kind-30023` - Long-form article
- `kind-30024` - Draft long-form article

**NIP-25** — Reactions
- `kind-7` - Reaction
- `kind-17` - Reaction to website

**NIP-28** — Public chat
- `kind-40` - Create channel
- `kind-41` - Channel metadata
- `kind-42` - Channel message
- `kind-43` - Hide message
- `kind-44` - Mute user

**NIP-29** — Relay-based groups
- `kind-9000` - Group add user
- `kind-9001` - Group remove user
- `kind-9002` - Group edit metadata
- `kind-9005` - Group delete event
- `kind-9007` - Group create
- `kind-9008` - Group delete
- `kind-9009` - Group edit status
- `kind-9021` - Group join request
- `kind-9022` - Group leave request
- `kind-39000` - Group metadata
- `kind-39001` - Group admins
- `kind-39002` - Group members
- `kind-39003` - Group roles

**NIP-32** — Labeling
- `kind-1985` - Label

**NIP-34** — Git stuff
- `kind-1617` - Git patch
- `kind-1618` - Git issue
- `kind-1619` - Git repo announcement
- `kind-1621` - Git reply
- `kind-1630` - Git status open
- `kind-1631` - Git status applied
- `kind-1632` - Git status closed
- `kind-1633` - Git status draft
- `kind-30617` - Git repository
- `kind-30618` - Git repository state

**NIP-35** — Torrents
- `kind-2003` - Torrent
- `kind-2004` - Torrent comment

**NIP-37** — Drafts
- `kind-10013` - Draft list
- `kind-31234` - Draft

**NIP-38** — User status
- `kind-30315` - User status

**NIP-39** — External identities
- `kind-10011` - Auth identity

**NIP-42** — Authentication
- `kind-22242` - Client authentication

**NIP-43** — Fast authentication (NIP proposal)
- `kind-8000` - Group join
- `kind-8001` - Group invite
- `kind-13534` - Group member list
- `kind-28934` - Group add event
- `kind-28935` - Group remove event
- `kind-28936` - Group event list

**NIP-46** — Nostr Connect
- `kind-24133` - Nostr Connect request/response

**NIP-47** — Wallet Connect
- `kind-13194` - Wallet Connect info
- `kind-23194` - Wallet Connect request
- `kind-23195` - Wallet Connect response
- `kind-23196` - Wallet Connect notification (NIP-04)
- `kind-23197` - Wallet Connect notification (NIP-44)

**NIP-51** — Lists (27 kinds)
- `kind-10000` - Mute list
- `kind-10001` - Pin list
- `kind-10003` - Bookmarks
- `kind-10004` - Communities list
- `kind-10005` - Public chats list
- `kind-10006` - Blocked relays list
- `kind-10007` - Search relays list
- `kind-10009` - User groups list
- `kind-10012` - Relay feeds list
- `kind-10015` - Interests list
- `kind-10020` - Tagged events list
- `kind-10030` - Custom emoji list
- `kind-10101` - Good wiki authors list
- `kind-10102` - Good wiki relays list
- `kind-30000` - People set
- `kind-30002` - Relay sets
- `kind-30003` - Bookmark sets
- `kind-30004` - Curation sets
- `kind-30005` - Video curation sets
- `kind-30006` - Picture curation sets
- `kind-30007` - Kind mute sets
- `kind-30015` - Interest set
- `kind-30030` - Custom emoji set
- `kind-30063` - Release artifact sets
- `kind-30267` - App curation sets
- `kind-39089` - Starter packs
- `kind-39092` - Media starter packs

**NIP-52** — Calendar events
- `kind-31922` - Date-based calendar event
- `kind-31923` - Time-based calendar event
- `kind-31924` - Calendar
- `kind-31925` - Calendar event RSVP

**NIP-53** — Live activities
- `kind-1311` - Live chat message
- `kind-10312` - Live participation list
- `kind-30311` - Live event
- `kind-30312` - Live event participant
- `kind-30313` - Live event draft

**NIP-54** — Wiki
- `kind-818` - Merge request
- `kind-30818` - Wiki article
- `kind-30819` - Wiki redirect

**NIP-56** — Reporting
- `kind-1984` - Report

**NIP-57** — Zaps
- `kind-9734` - Zap request
- `kind-9735` - Zap receipt

**NIP-58** — Badges
- `kind-8` - Badge award
- `kind-30008` - Profile badges
- `kind-30009` - Badge definition

**NIP-59** — Gift wrap
- `kind-13` - Seal
- `kind-1059` - Gift wrap

**NIP-5A** — Git files
- `kind-15128` - Git file blob
- `kind-35128` - Git file tree

**NIP-60** — Cashu wallet
- `kind-7374` - Cashu token
- `kind-7375` - Cashu proof
- `kind-17375` - Cashu quote

**NIP-61** — Nutzaps
- `kind-7376` - Nutzap
- `kind-9321` - Nutzap redemption
- `kind-10019` - Nutzap mint preferences

**NIP-62** — Request discovery relays
- `kind-62` - User discovery relay list

**NIP-64** — Inline resources
- `kind-64` - Inline resource

**NIP-65** — Relay list metadata
- `kind-10002` - Relay list metadata

**NIP-66** — Relay monitoring
- `kind-10166` - Relay monitor registration
- `kind-30166` - Relay monitor check

**NIP-68** — Picture event
- `kind-20` - Picture

**NIP-69** — Peer-to-peer trading
- `kind-38383` - Fiat/BTC offer

**NIP-71** — Video
- `kind-21` - Short-form portrait video
- `kind-22` - Short-form landscape video
- `kind-34235` - Video event
- `kind-34236` - Video view

**NIP-72** — Communities
- `kind-4550` - Community post approval
- `kind-34550` - Community definition

**NIP-75** — Zap goal
- `kind-9041` - Zap goal

**NIP-78** — Application-specific data
- `kind-30078` - App-specific data

**NIP-7D** — Threads
- `kind-11` - Thread root

**NIP-84** — Highlights
- `kind-9802` - Highlight

**NIP-85** — Trusted assertions
- `kind-30382` - Trusted assertion
- `kind-30383` - Trusted assertion revocation
- `kind-30384` - Trusted assertion query

**NIP-87** — Cashu mint discovery
- `kind-38172` - Mint recommendation
- `kind-38173` - Mint info

**NIP-88** — Polls
- `kind-1018` - Poll response
- `kind-1068` - Poll

**NIP-89** — App handlers
- `kind-31989` - App handler recommendation
- `kind-31990` - App handler

**NIP-90** — Data vending machine
- `kind-5000` - DVM text generation request
- `kind-5300` - DVM text extraction request
- `kind-5301` - DVM summarization request
- `kind-6000` - DVM text generation result
- `kind-6300` - DVM text extraction result
- `kind-6301` - DVM summarization result
- `kind-7000` - DVM job feedback

**NIP-94** — File metadata
- `kind-1063` - File metadata

**NIP-96** — HTTP file storage
- `kind-10096` - File storage server list

**NIP-98** — HTTP Auth
- `kind-27235` - HTTP authentication

**NIP-99** — Classifieds
- `kind-30402` - Classified listing
- `kind-30403` - Draft classified listing

**NIP-A0** — Coinjoin
- `kind-1222` - Coinjoin request
- `kind-1244` - Coinjoin proposal

**NIP-A4** — Extra-metadata gift wrap
- `kind-24` - Extra-metadata gift wrap

**NIP-B0** — Reviews
- `kind-39701` - Review

**NIP-b7** — Blossom
- `kind-10063` - Blossom server list

**NIP-C0** — Audio
- `kind-1337` - Audio event

**NIP-C7** — Group chat relay
- `kind-9` - Group chat message

**NKBIP-03** — Nostr Knowledge Base
- `kind-30` - Web source
- `kind-31` - Text source
- `kind-32` - Academic source
- `kind-33` - AI source

**BUD-04** — Blossom auth
- `kind-24242` - Blossom auth token

**MIP-00** — Marmot MLS
- `kind-443` - MLS key package
- `kind-10051` - MLS group list

**MIP-02** — Marmot welcome
- `kind-444` - MLS welcome message

**MIP-03** — Marmot group events
- `kind-445` - MLS group event

</details>

<details>
<summary>Protocol Messages (13 schemas)</summary>

**Client to Relay (NIP-01):**
- `client-req` - Request events (REQ)
- `client-event` - Publish event (EVENT)
- `client-close` - Close subscription (CLOSE)

**Client to Relay (NIP-42):**
- `client-auth` - Authentication (AUTH)

**Client to Relay (NIP-45):**
- `client-count` - Count events (COUNT)

**Relay to Client (NIP-01):**
- `relay-event` - Event delivery (EVENT)
- `relay-ok` - Command result (OK)
- `relay-eose` - End of stored events (EOSE)
- `relay-closed` - Subscription closed (CLOSED)
- `relay-notice` - Human-readable message (NOTICE)

**Relay to Client (NIP-42):**
- `relay-auth` - Authentication challenge (AUTH)

**Relay to Client (NIP-45):**
- `relay-count` - Count result (COUNT)

**Other (NIP-01):**
- `filter` - REQ message filter object

</details>

<details>
<summary>Tags (150+ schemas)</summary>

**NIP-01 — Standard tags:**
- `e` - Event reference
- `p` - Public key reference
- `a` - Replaceable event reference
- `d` - Identifier for replaceable events
- `t` - Hashtag
- Generic tag base schema

**NIP-17 — DM attachment tags:**
- `blurhash`, `decryption-key`, `decryption-nonce`, `dim`, `encryption-algorithm`, `fallback`, `file-type`, `ox`, `relay`, `size`, `subject`, `thumb`, `x`

**NIP-18 — Repost tags:**
- `k` - Kind number reference
- `q` - Quote reference

**NIP-22 — Comment tags (uppercase):**
- `_E`, `_P`, `_A`, `_K` - Uppercase event/pubkey/address/kind references

**NIP-23 — Long-form tags:**
- `published_at`

**NIP-25 — Reaction tags:**
- `e-react` - Reaction event reference
- `emoji` - Custom emoji

**NIP-29 — Group tags:**
- `code` - Group code

**NIP-32 — Label tags:**
- `l` - Label
- `L` - Label namespace

**NIP-34 — Git tags:**
- `applied-as-commits`, `branch-name`, `c`, `clone`, `commit`, `commit-pgp-sig`, `committer`, `e-root`, `e-status-reply`, `head`, `maintainers`, `merge-base`, `merge-commit`, `name`, `parent-commit`, `r-euc`, `ref`, `web`

**NIP-36 — Content warnings:**
- `content-warning`

**NIP-38 — Status tags:**
- `expiration`, `status-type`

**NIP-42 — Auth tags:**
- `challenge`, `relay`

**NIP-43 — Fast auth tags:**
- `claim`, `member`, `protected`

**NIP-47 — Wallet Connect tags:**
- `encryption`, `notifications`

**NIP-51 — List tags:**
- `group`, `word`

**NIP-52 — Calendar tags:**
- `end_tzid`, `fb`, `g`, `location`, `start_tzid`, `status`

**NIP-53 — Live activity tags:**
- `a-live`, `a-room`, `current_participants`, `endpoint`, `ends`, `hand`, `image`, `pinned`, `recording`, `relays`, `room`, `service`, `starts`, `status-live`, `status-room`, `streaming`, `summary`, `title`, `total_participants`

**NIP-56 — Report tags:**
- `e`, `p`, `server`, `x`

**NIP-57 — Zap tags:**
- `amount`, `bolt11`, `description`, `lnurl`, `preimage`

**NIP-5A — Git file tags:**
- `path`, `source`

**NIP-61 — Nutzap tags:**
- `e-redeemed`, `mint`, `proof`, `pubkey`, `relay`, `u`

**NIP-65 — Relay tags:**
- `r` - Relay URL with read/write marker

**NIP-68 — Picture tags:**
- `imeta`

**NIP-69 — Trading tags:**
- `amt`, `expires_at`, `f`, `fa`, `k`, `layer`, `network`, `pm`, `premium`, `s`, `y`, `z`

**NIP-71 — Video tags:**
- `imeta`

**NIP-73 — External content IDs:**
- `i`, `k`

**NIP-84 — Highlight tags:**
- `context`, `comment`

**NIP-87 — Cashu mint tags:**
- `modules`, `n`, `nuts`

**NIP-88 — Poll tags:**
- `endsAt`, `option`, `polltype`, `response`

**NIP-89 — App handler tags:**
- `client`

**NIP-90 — DVM tags:**
- `amount`, `bid`, `i`, `output`, `param`, `request`, `status`

**NIP-94 — File metadata tags:**
- `m`, `ox`, `url`

**NIP-98 — HTTP Auth tags:**
- `method`, `payload`

**NIP-b7 — Blossom tags:**
- `server`

**NKBIP-03 — Knowledge base tags:**
- `accessed_on`, `author`, `chapter_title`, `doi`, `editor`, `llm`, `page_range`, `published_by`, `published_in`, `published_on`, `version`

**MIP-00 — Marmot tags:**
- `client`, `encoding`, `i`, `mls_ciphersuite`, `mls_extensions`, `mls_proposals`, `mls_protocol_version`

**MIP-03 — Marmot group tags:**
- `h`

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
| [nostria](https://github.com/nostria-app/nostria) | Angular/TypeScript | Schema validation tests for 34 event kinds across 16 NIPs | Merged ([#576](https://github.com/nostria-app/nostria/pull/576)) |
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
