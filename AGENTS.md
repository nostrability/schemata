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
$schema: https://json-schema.org/draft/2020-12/schema
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
3. `scripts/add-schema-ids.js` - Adds `$id` properties with GitHub Pages URLs (before dereferencing)
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
- Create standalone test.js files

### DO:
- Follow existing schema patterns and conventions
- Use descriptive error messages in schemas
- Test schemas with valid/invalid examples
- Keep `master` as the main branch
- Use semantic versioning for releases
- Utilize vitest framework
- Make sure schemas test the data structure contained in payloads
- Ensure that schemas provide programmatic results, such that the result can be used in the release workflow to block releases when a test is failing, or block a PR merge when a test is failing.

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
$schema: https://json-schema.org/draft/2020-12/schema
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
$schema: "https://json-schema.org/draft/2020-12/schema"
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

## Development Approach

### Feature Development

When implementing new features in this repository:

1. **Understand the Request**
   - Identify if it's a new schema, build process change, or tooling improvement
   - Check existing patterns in similar implementations
   - Review NIPs documentation if adding protocol-specific schemas

2. **Plan the Implementation**
   - For complex features, use TodoWrite to track steps
   - Identify files that need modification
   - Consider impact on build process and existing schemas

3. **Follow Conventions**
   ```yaml
   # New event kind schema structure
   nips/nip-XX/kind-YYY/schema.yaml
   
   # New message schema structure
   nips/nip-XX/messages/message-type/schema.yaml
   
   # New tag schema structure
   nips/nip-XX/tag/tagname/schema.yaml
   ```

4. **Test the Changes**
   - Run `pnpm build` to ensure compilation works
   - Check that `$id` properties are correctly generated
   - Verify dereferencing preserves structure
   - Run `pnpm test` if tests exist

5. **Update Documentation**
   - Update README.md "Available Schemas" section if adding schemas
   - Update AGENTS.md if changing build process
   - Document any new conventions or patterns

### Bugfixing Approach

1. **Diagnose the Issue**
   - Check error messages and logs
   - Identify which stage of build process fails
   - Use `grep` and `find` to locate problematic files
   - Review recent changes that might have caused the issue

2. **Common Issues and Solutions**
   
   **Schema Issues:**
   - Missing references: Check `@/` aliases exist
   - Invalid YAML: Validate syntax and indentation
   - Circular references: Review `$ref` chains
   
   **Build Issues:**
   - `$id` already exists: Remove from source YAML files
   - Reference not found: Check relative paths and aliases
   - Dereferencing fails: Validate all referenced schemas exist
   
   **Workflow Issues:**
   - Version mismatch: Ensure package.json version matches tag
   - Permission errors: Check GitHub secrets and permissions
   - Deploy fails: Verify GitHub Pages settings

3. **Fix Implementation**
   - Make minimal changes to fix the issue
   - Preserve existing functionality
   - Test the fix locally with `pnpm build`
   - Verify no unintended side effects

4. **Prevent Regression**
   - Add validation if appropriate
   - Document the issue and solution
   - Consider adding automated checks

### CI/CD Development

1. **GitHub Actions Workflows**
   
   **Location:** `.github/workflows/`
   
   **Key Workflows:**
   - `release.yml` - Handles releases and NPM publishing
   - `deploy-pages.yml` - Deploys to GitHub Pages

2. **Modifying Workflows**
   
   **Before changing:**
   - Understand current workflow triggers
   - Review job dependencies
   - Check required secrets and permissions
   
   **Common modifications:**
   ```yaml
   # Adding new trigger
   on:
     push:
       branches: [master]
     workflow_dispatch:
   
   # Adding new job step
   - name: New Step
     run: |
       echo "Running new step"
   
   # Using outputs between steps
   - id: step1
     run: echo "VALUE=test" >> $GITHUB_OUTPUT
   - run: echo "${{ steps.step1.outputs.VALUE }}"
   ```

3. **Testing Workflow Changes**
   - Use `workflow_dispatch` for manual testing
   - Check Actions tab for execution logs
   - Verify artifacts and deployments
   - Test both success and failure paths

4. **Workflow Best Practices**
   - Use semantic version tags for actions
   - Store sensitive data in secrets
   - Add condition checks for optional steps
   - Include error handling and retries
   - Document workflow purpose and triggers

### Development Workflow

1. **Starting Development**
   ```bash
   # Clone and setup
   git clone <repo>
   cd schemata
   pnpm install
   
   # Create feature branch (if needed)
   git checkout -b feature/description
   
   # Test current build
   pnpm build
   ```

2. **During Development**
   ```bash
   # Regular build to test changes
   pnpm build
   
   # Check for schema issues
   grep -r '^\$id:' nips/ @/  # Should be empty
   
   # Validate specific schema
   ajv validate -s dist/nips/nip-01/kind-1/schema.json -d event.json
   ```

3. **Before Committing**
   - Run full build: `pnpm build`
   - Check no `$id` in source files
   - Verify all schemas have correct structure
   - Update documentation if needed
   - Test GitHub Pages output locally if changed

4. **Debugging Tips**
   ```bash
   # Check build stages individually
   make convert_json      # YAML to JSON
   make rewrite_refs      # Fix references
   node scripts/add-schema-ids.js  # Add $id
   make dereference_json  # Expand references
   
   # Inspect intermediate output
   cat dist/nips/nip-01/kind-1/schema.json | jq '.'
   
   # Find schema files
   find nips -name "*.yaml" -type f
   find dist -name "*.json" -type f
   ```

### Schema Development Guidelines

1. **Creating New Schemas**
   - Start with existing schema as template
   - Use `allOf` to extend base schemas
   - Add descriptive `title` and `description`
   - Include `errorMessage` for validations
   - Test with valid and invalid examples

2. **Schema Patterns**
   ```yaml
   # Extending events
   allOf:
     - $ref: "@/note.yaml"
     - type: object
       properties:
         kind:
           const: 123
   
   # Defining tags
   allOf:
     - $ref: "@/tag.yaml"
     - type: array
       items:
         - const: "tagname"
         - type: string
   
   # Protocol messages
   type: array
   items:
     - const: "MSG_TYPE"
     - type: object
   minItems: 2
   maxItems: 2
   ```

3. **Validation Patterns**
   ```yaml
   # Hex string validation
   pattern: "^[a-f0-9]{64}$"
   
   # URL validation
   pattern: "^wss?://"
   
   # Array constraints
   minItems: 1
   maxItems: 100
   uniqueItems: true
   
   # String constraints
   minLength: 1
   maxLength: 1000
   ```

## Contact

For questions about this repository structure or schemas, open an issue on GitHub.
