# AGENTS.md

This file provides context for AI agents (LLMs) working with the Nostr Schemata repository.

## Repository Overview

This repository contains JSON Schema definitions for the Nostr protocol. The schemas are written in YAML format and compiled to JSON during the build process. The compiled schemas are then published to NPM and deployed to GitHub Pages for direct URL access.

## Key Concepts

### Schema Organization
- **Source schemas**: Located in `nips/` directory, organized by NIP number
- **Aliases**: Located in `@/` directory, providing shortcuts to commonly used schemas
- **Built schemas**: Generated in `dist/` directory (git-ignored)

### Schema Types
1. **Event schemas** (`kind-*`): Define Nostr event structures
2. **Message schemas** (`messages/*`): Define WebSocket protocol messages
3. **Tag schemas** (`tag/*`): Define event tag structures

## Common Tasks

### 1. Adding a New Schema

**Context**: Schemas must follow the existing directory structure and conventions.

```yaml
# Create directory structure
nips/nip-XX/kind-YYY/schema.yaml

# Basic schema template (DO NOT include $id in source files)
$schema: http://json-schema.org/draft-07/schema#
title: kindYYY
allOf: 
  - $ref: "@/note.yaml"  # For event kinds
  # Add specific properties/constraints
```

**Important**: 
- Never add `$id` properties to source YAML files
- `$id` is automatically added during build with the correct GitHub Pages URL
- Use `$ref` with `@/` prefix for aliases (e.g., `@/note.yaml`, `@/tag.yaml`)

### 2. Building the Project

**Commands**:
```bash
pnpm build          # Clean, compile YAML to JSON, add $id properties, bundle
pnpm build:all      # Build + generate code for all languages
pnpm build:test     # Build + run tests
```

**Build Process**:
1. `make convert_json` - Converts YAML to JSON
2. `make rewrite_refs` - Rewrites references to absolute paths
3. `add-schema-ids.js` - Adds `$id` properties with GitHub Pages URLs (before dereferencing)
4. `make dereference_json` - Dereferences schemas (embeds references inline, preserving `$id`)
5. `build.js` - Creates JavaScript bundle with exports

### 3. Creating a Release

**Prerequisites**:
- All changes committed to `master` branch
- Build passes: `pnpm build`
- Repository secrets configured: `SCHEMATA_PAT`, `NPM_TOKEN`

**Steps**:
1. Update version in `package.json`
2. Commit: `git commit -m "bump version to X.Y.Z"`
3. Push: `git push origin master`
4. Create tag: `git tag vX.Y.Z`
5. Push tag: `git push origin vX.Y.Z`

**Automated workflows will**:
- Create GitHub release with zip artifact
- Publish to NPM
- Deploy to GitHub Pages with flattened structure

### 4. GitHub Pages Deployment

**URL Structure after deployment**:
- Base: `https://nostrability.github.io/schemata/`
- Events: `./note/kind/{kind}.json`
- Tags: `./tag/{tag_name}.json`
- Messages: `./message/{MESSAGE_TYPE}.json`

**Manual trigger**:
1. Go to GitHub Actions tab
2. Select "Deploy to GitHub Pages"
3. Click "Run workflow"

### 5. Working with References

**Internal references**:
```yaml
$ref: "@/note.yaml"        # Alias to note schema
$ref: "@/tag/p.yaml"       # Specific tag schema
$ref: "../note/schema.yaml" # Relative path (avoid if possible)
```

**After build, schemas get $id**:
```json
{
  "$id": "https://nostrability.github.io/schemata/note/kind/1.json"
}
```

## File Structure

```
schemata/
├── @/                      # Aliases (shortcuts)
│   ├── note.yaml          # -> nips/nip-01/note/schema.yaml
│   ├── tag.yaml           # -> nips/nip-01/tag/schema.yaml
│   └── tag/               # Tag shortcuts
├── nips/                   # Source schemas by NIP
│   ├── nip-01/            # Core protocol
│   │   ├── kind-0/        # Profile metadata
│   │   ├── kind-1/        # Text note
│   │   ├── messages/      # Protocol messages
│   │   └── tag/           # Tag definitions
│   └── nip-*/             # Other NIPs
├── dist/                   # Built output (git-ignored)
├── scripts/                # Build scripts
├── .github/workflows/      # CI/CD
│   ├── release.yml        # Release and publish
│   └── deploy-pages.yml  # GitHub Pages deployment
└── RELEASE.md             # Release process documentation
```

## Important Rules

### DO NOT:
- Add `$id` to source YAML files (added automatically at build)
- Modify files in `dist/` directly (generated)
- Use absolute paths in `$ref` (use `@/` aliases or relative paths)
- Create documentation without being asked
- Commit changes without explicit user request

### DO:
- Follow existing schema patterns and conventions
- Use descriptive error messages in schemas
- Test schemas with valid/invalid examples
- Keep `master` as the main branch
- Use semantic versioning for releases

## Schema Validation Properties

**Common properties for events**:
```yaml
properties:
  id:
    type: string
    pattern: "^[a-f0-9]{64}$"
  pubkey:
    $ref: "@/secp256k1.yaml"
  created_at:
    type: number
  kind:
    type: number
    const: 1  # For specific kind
  tags:
    type: array
    items:
      $ref: "@/tag.yaml"
  content:
    type: string
  sig:
    type: string
    pattern: "^[a-f0-9]{128}$"
```

## Workflows

### Release Workflow (`release.yml`)
- **Trigger**: Push tag `v*.*.*` or manual
- **Actions**: Build, create GitHub release, publish NPM
- **Secrets needed**: `SCHEMATA_PAT`, `NPM_TOKEN`

### Deploy Pages Workflow (`deploy-pages.yml`)
- **Trigger**: After successful release or manual
- **Actions**: Download release, flatten structure, deploy to GitHub Pages
- **Permissions**: contents (read), pages (write), id-token (write)

## Testing

```bash
# Run tests after build
pnpm test

# Validate a specific event against schema
import { kind1Schema } from '@nostrability/schemata';
import Ajv from 'ajv';

const ajv = new Ajv();
const validate = ajv.compile(kind1Schema);
const valid = validate(event);
```

## GitHub Settings Required

1. **Pages**: Source = "GitHub Actions" (not "Deploy from branch")
2. **Secrets**: 
   - `SCHEMATA_PAT`: Personal access token for releases
   - `NPM_TOKEN`: NPM authentication token
3. **Workflow permissions**: Read and write permissions

## Message Type Mappings

When flattening for GitHub Pages:
- `client-req` → `REQ`
- `client-event` → `EVENT`
- `relay-ok` → `OK`
- `relay-eose` → `EOSE`
- `relay-notice` → `NOTICE`

## Quick Commands Reference

```bash
# Development
pnpm install        # Install dependencies
pnpm build         # Build schemas
pnpm test          # Run tests

# Release (maintainers)
git tag vX.Y.Z     # Create version tag
git push origin vX.Y.Z  # Trigger release

# Manual workflow triggers
# Go to: Actions → Select workflow → Run workflow
```

## Error Handling

If build fails with `$id` issues:
1. Check no `$id` in source YAML: `grep -r '^\$id:' nips/ @/`
2. Remove any found: `sed -i '/^\$id:/d' <file>`
3. Rebuild: `pnpm build`

If GitHub Pages deployment fails:
1. Check Settings → Pages → Source = "GitHub Actions"
2. Verify workflow permissions
3. Manually trigger from Actions tab

## Schema Design Patterns

### Event kinds
```yaml
$schema: http://json-schema.org/draft-07/schema#
title: kindX
allOf: 
  - $ref: "@/note.yaml"
  - type: object
    properties:
      kind:
        const: X
      # Additional constraints
```

### Tags
```yaml
$schema: "http://json-schema.org/draft-07/schema#"
allOf:
  - $ref: "@/tag.yaml"
  - type: array
    minItems: 2
    items:
      - const: "tagname"
      - type: string  # or specific schema
```

### Messages
```yaml
type: array
items:
  - const: "MESSAGE_TYPE"
  - # Additional items
minItems: 2
maxItems: 2  # If fixed length
```

## Contact

For questions about this repository structure or schemas, open an issue on GitHub.