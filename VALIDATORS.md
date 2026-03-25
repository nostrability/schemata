# Validator Compatibility Matrix

Cross-language API surface comparison for all `schemata-validator-*` implementations. The reference implementation is [`@nostrwatch/schemata-js-ajv`](https://github.com/sandwichfarm/nostr-watch/tree/next/libraries/schemata-js-ajv).

## Core Functions

| Function | JS (ref) | Rust | Kotlin | Go | Swift | Dart | Python | Java | PHP | Ruby | C# | C++ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `validate` | yes | yes | yes | yes | — | yes | yes | yes | yes | yes | yes | yes |
| `validateNote` | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes |
| `validateNip11` | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | — | yes |
| `validateMessage` | yes | yes | yes | yes | yes | yes | yes | yes | — | — | — | yes |
| `getSchema` | — | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes |

## Types

| Type | JS (ref) | Rust | Kotlin | Go | Swift | Dart | Python | Java | PHP | Ruby | C# | C++ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `ValidationResult` | yes | yes | yes | yes | yes | yes | yes | yes (record) | yes | yes (Struct) | yes (record) | yes |
| `ValidationError` | AJV ErrorObject | yes | yes | yes | yes | yes | yes (dataclass) | yes (record) | yes | yes (Struct) | yes (record) | yes |
| `Subject` enum | string literal | yes | yes | yes (int) | yes | yes | yes (Enum) | yes | — | — | yes | yes |

## Internal Features

| Feature | JS (ref) | Rust | Kotlin | Go | Swift | Dart | Python | Java | PHP | Ruby | C# | C++ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Strip nested `$id` | — | yes | yes | yes | yes | yes | yes | yes | yes | yes | — | yes |
| Strip nested `$schema` | — | — | — | — | yes | yes | — | yes | yes | yes | — | yes |
| Additional props warnings | yes | yes | yes | yes | yes | yes | yes | — | — | — | — | — |
| `errorMessage` enrichment | — | yes | yes | yes* | — | — | yes | — | — | — | — | — |

\* Go has the code but `enrichMessage` is never called (dead code).

## Input Types

| Language | Schema input | Data input |
|---|---|---|
| JS (ref) | internal (AJV compiled) | `any` / `NostrEvent` |
| Rust | `&serde_json::Value` | `&serde_json::Value` |
| Kotlin | `JsonElement` (kotlinx) | `JsonElement` (kotlinx) |
| Go | `json.RawMessage` | `json.RawMessage` |
| Swift | `[String: Any]` | `[String: Any]` / `Any` |
| Dart | `Map<String, dynamic>` | `dynamic` |
| Python | `dict` | `Any` |
| Java | `String` (JSON) | `String` (JSON) |
| PHP | `array` | `mixed` |
| Ruby | `Hash` | `Object` |
| C# | `string` (JSON) | `string` (JSON) |
| C++ | `const std::string&` (JSON) | `const std::string&` (JSON) |

## JSON Schema Library & Draft

| Language | Library | Draft |
|---|---|---|
| JS (ref) | AJV | 7 |
| Rust | `jsonschema` 0.45 | 7 |
| Kotlin | networknt json-schema-validator 1.5.6 | 7 |
| Go | santhosh-tekuri/jsonschema v6 | 7 |
| Swift | kylef/JSONSchema.swift | 7 |
| Dart | Workiva json_schema 5.2 | 7 |
| Python | jsonschema >=4.0 | 7 |
| Java | networknt json-schema-validator 1.5.6 | 7 |
| PHP | opis/json-schema 2.0 | 7 |
| Ruby | json_schemer 2.0 | 7 |
| C# | JsonSchema.Net 7.* | 7 |
| C++ | valijson 1.0.3 | 7 |

## Gaps

| Gap | Affected repos | Severity |
|---|---|---|
| Missing `validateMessage` | PHP, Ruby, C# | Medium — can't validate relay/client protocol messages |
| Missing `validateNip11` | C# | Medium — can't validate relay info documents |
| Missing `validate` (low-level) | Swift | Low — users can't validate against arbitrary schemas |
| No `Subject` enum | PHP, Ruby | Low — follows from missing `validateMessage` |
| No additional-props warnings | Java, PHP, Ruby, C#, C++ | Medium — `warnings` array always empty, reduces signal |
| No `errorMessage` enrichment | JS, Swift, Dart, Java, PHP, Ruby, C#, C++ | Low — uses default validator error strings instead |
| Dead `enrichMessage` code | Go | Trivial — defined but never wired into `Validate()` |
| `getSchema` missing from JS ref | JS | Intentional — JS uses internal AJV compiled schemas |
| No nested `$id` stripping | JS, C# | Low — may cause resolution issues with certain schemas |
