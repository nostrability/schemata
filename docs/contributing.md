# Contributing to Nostr Schemata

This guide explains how to write new schemata and contribute to the project.

## Project Structure

```
schemata/
├── @/                    # Alias definitions (shortcuts)
│   ├── note.yaml        # References nips/nip-01/note/schema.yaml
│   ├── tag.yaml         # References nips/nip-01/tag/schema.yaml
│   └── tag/             # Tag-specific aliases
│       ├── a.yaml       # References nips/nip-01/tag/a/schema.yaml
│       └── ...
├── nips/                 # Actual schema implementations
│   ├── nip-01/          # Schemas for NIP-01
│   │   ├── kind-1/      # Kind 1 (short text note)
│   │   ├── messages/    # WebSocket messages
│   │   ├── note/        # Base note structure
│   │   └── tag/         # Tag definitions
│   └── nipless/         # Experimental kinds without NIPs
└── scripts/             # Build tools
```

## Writing New Schemas

### Step 1: Determine Schema Location

1. **For NIPs with assigned numbers**: `nips/nip-XX/`
2. **For experimental kinds**: `nips/nipless/kind-XXXX/`
3. **For new message types**: `nips/nip-XX/messages/[client|relay]/`
4. **For new tag types**: `nips/nip-XX/tag/[letter]/`

### Step 2: Create Schema File

Create `schema.yaml` following this template:

```yaml
$id: "https://schemata.nostr.watch/[type]/[subtype]"
$schema: https://json-schema.org/draft/2020-12/schema
type: object  # or array, string, etc.
title: "Descriptive Title"
description: "What this schema validates"
properties:
  # Define properties here
required:
  - required_field1
  - required_field2
```

### Step 3: Schema Conventions

#### ID Pattern
Always use this format for `$id`:
```yaml
# For events
$id: "https://schemata.nostr.watch/note/kind/[number]"

# For tags
$id: "https://schemata.nostr.watch/note/tag/[letter]"

# For messages
$id: "https://schemata.nostr.watch/message/[client|relay]/[type]"
```

#### Error Messages
Include helpful error messages:
```yaml
properties:
  content:
    type: string
    errorMessage: "content must be a string"
    description: "The content of the note"
```

#### Using References
Reference other schemas for reusability:
```yaml
# Use aliases for common types
properties:
  pubkey:
    allOf:
      - $ref: "@/secp256k1.yaml"
    errorMessage: "pubkey must be a secp256k1 public key"

# Inherit from base schemas
allOf:
  - $ref: "@/note.yaml"
  - type: object
    properties:
      kind:
        const: 1
```

### Step 4: Tag Schema Pattern

For new tag types, follow this structure:

```yaml
$id: 'https://schemata.nostr.watch/note/tag/x'
$schema: "https://json-schema.org/draft/2020-12/schema"
title: xTag
allOf:
  - $ref: "@/tag.yaml"  # Inherit base array structure
  - type: array
    minItems: 2         # Most tags require at least 2 elements
    items:
      - const: "x"      # First element is always the tag identifier
      - type: string    # Second element (adjust type as needed)
        description: "Description of what this element represents"
    additionalItems: true  # Set to false if no additional items allowed
```

### Step 5: Create Alias (Optional)

For frequently used schemas, create an alias in `@/`:

```yaml
# @/my-schema.yaml
allOf: 
  - $ref: "nips/nip-XX/my-schema/schema.yaml"
```

### Step 6: Add Samples

Create sample files for testing:

```
nips/nip-XX/kind-YYYY/samples/
├── valid.json       # Valid example(s)
└── invalid.json     # Invalid example(s)
```

## Schema Best Practices

### 1. Use Specific Types
```yaml
# Good
properties:
  created_at:
    type: integer
    minimum: 0

# Bad
properties:
  created_at:
    type: number  # Too general
```

### 2. Add Constraints
```yaml
properties:
  kind:
    type: integer
    minimum: 0
    maximum: 65535
  
  tags:
    type: array
    maxItems: 1000  # Prevent abuse
```

### 3. Use Patterns for Validation
```yaml
properties:
  id:
    type: string
    pattern: "^[a-f0-9]{64}$"  # Validate hex format
```

### 4. Document Everything
```yaml
properties:
  d:
    type: string
    description: "Identifier for replaceable events"
    errorMessage: "d tag value must be a string"
```

### 5. Consider Optional Fields
```yaml
properties:
  optional_field:
    type: string
    description: "This field is optional"
# Don't include in 'required' array
```

## Common Patterns

### Event Schema
```yaml
$id: "https://schemata.nostr.watch/note/kind/XXXX"
$schema: https://json-schema.org/draft/2020-12/schema
title: kindXXXX
allOf: 
  - $ref: "@/note.yaml"
  - type: object
    properties:
      kind:
        const: XXXX
      content:
        # Define content structure if needed
```

### Message Schema
```yaml
$id: 'https://schemata.nostr.watch/message/client/mymessage'
type: "array"
items: 
- const: "MYMESSAGE"
- type: "string"
  description: "Subscription ID"
- type: "object"
  description: "Message parameters"
minItems: 3
maxItems: 3
```

### Complex Content Schema
For kinds with structured content, create `schema.content.yaml`:
```yaml
$id: "https://schemata.nostr.watch/note/kind/XXXX/content"
$schema: https://json-schema.org/draft/2020-12/schema
type: object
properties:
  name:
    type: string
  about:
    type: string
required:
  - name
```

## Testing Your Schema

1. Build the project:
   ```bash
   pnpm build
   ```

2. Run tests:
   ```bash
   pnpm test
   ```

3. Validate your samples manually:
   ```bash
   # The build process will validate all schemas
   make all
   ```

## Submitting Your Contribution

1. Fork the repository
2. Create a feature branch: `git checkout -b add-nip-XX-schemas`
3. Add your schemas following the conventions
4. Ensure all schemas build without errors
5. Commit with a descriptive message
6. Submit a pull request

## Naming Conventions Summary

- **Directories**: Use lowercase with hyphens (e.g., `kind-1`, `client-req`)
- **Schema files**: Always `schema.yaml` (or `schema.content.yaml` for content schemas)
- **Tag directories**: Single letter, lowercase (e.g., `tag/e/`, `tag/p/`)
- **Special tags**: Prefix with underscore (e.g., `tag/_E/` references `tag/e/`)

## Questions?

If you need help:
1. Check existing schemas for examples
2. Open an issue for discussion
3. Join the Nostr development community