# Release Process for Schemata

This document outlines the step-by-step process for releasing a new version of the Schemata project.

## Prerequisites

Before starting a release, ensure:
- All changes are committed to the `master` branch
- The build process runs successfully: `pnpm build`
- Tests pass (if applicable): `pnpm test`
- You have the necessary permissions to:
  - Push tags to the repository
  - Create GitHub releases (requires `SCHEMATA_PAT` secret)
  - Publish to NPM (requires `NPM_TOKEN` secret)
  - Deploy to GitHub Pages

## Release Steps

### 1. Update Version Number

Update the version in `package.json`:

```bash
# Edit package.json and update the version field
# Follow semantic versioning: MAJOR.MINOR.PATCH
vim package.json
```

### 2. Commit Version Update

**IMPORTANT**: You must commit and push the version change BEFORE creating the tag!

```bash
git add package.json
git commit -m "bump version to X.Y.Z"
git push origin master
```

### 3. Create and Push Git Tag

After the version commit is pushed, create a tag with the version number prefixed with 'v':

```bash
# Replace X.Y.Z with your version number (must match package.json)
git tag vX.Y.Z
git push origin vX.Y.Z
```

**Critical**: 
- The tag version must match the version in package.json (e.g., if package.json has "version": "0.1.4", use tag `v0.1.4`)
- Always push the version commit to master BEFORE creating and pushing the tag

### 4. Automated Release Process

Once the tag is pushed, the following automated processes will trigger:

#### A. Release and Publish Workflow
The `.github/workflows/release.yml` workflow will automatically:

1. **Build the project**
   - Converts YAML schemas to JSON
   - Removes `$id` from source files (added at build time)
   - Generates the distribution files

2. **Create Release Artifact**
   - Creates a zip file with all built schemas
   - Names it `schemata-vX.Y.Z.zip`

3. **Create GitHub Release**
   - Creates a new release on GitHub
   - Attaches the zip file as a release asset
   - Only if the release doesn't already exist

4. **Publish to NPM**
   - Publishes the package to NPM registry
   - Only if the version isn't already published

#### B. Deploy to GitHub Pages Workflow
The `.github/workflows/deploy-pages.yml` workflow will automatically:

1. **Download Latest Release**
   - Fetches the zip file from the latest GitHub release

2. **Flatten Directory Structure**
   - Reorganizes schemas for direct access:
     - `/note/kind/{kind}.json` - Event schemas by kind
     - `/tag/{tag_name}.json` - Tag schemas
     - `/message/{MESSAGE_TYPE}.json` - Protocol messages

3. **Add $id Properties**
   - Each schema gets an `$id` pointing to its GitHub Pages URL
   - Example: `https://nostrability.github.io/schemata/note/kind/1.json`

4. **Deploy to GitHub Pages**
   - Publishes the flattened structure to GitHub Pages
   - Available at: https://nostrability.github.io/schemata/

### 5. Manual Workflow Triggers (if needed)

If any workflow fails or you need to re-run them:

#### Trigger Release Workflow Manually
1. Go to Actions tab in GitHub
2. Select "Release and Publish" workflow
3. Click "Run workflow"
4. Enter the version (e.g., `v1.0.0`)

#### Trigger GitHub Pages Deployment Manually
1. Go to Actions tab in GitHub
2. Select "Deploy to GitHub Pages" workflow
3. Click "Run workflow"
4. Optionally enter a reason for manual deployment

## Verification

After the release process completes:

1. **Check GitHub Release**
   - Visit: https://github.com/nostrability/schemata/releases
   - Verify the new release exists with the correct asset

2. **Check NPM Package**
   - Visit: https://www.npmjs.com/package/@nostrwatch/schemata
   - Verify the new version is published

3. **Check GitHub Pages**
   - Visit: https://nostrability.github.io/schemata/
   - Test a few schema URLs:
     - https://nostrability.github.io/schemata/note/kind/1.json
     - https://nostrability.github.io/schemata/message/REQ.json
     - https://nostrability.github.io/schemata/tag/p.json

## Troubleshooting

### Release Workflow Fails

1. **Check Secrets**
   - Ensure `SCHEMATA_PAT` is configured in repository secrets
   - Ensure `NPM_TOKEN` is configured in repository secrets

2. **Version Already Exists**
   - The workflow skips creating releases/publishing if they already exist
   - This is normal behavior and not an error

### GitHub Pages Deployment Fails

1. **Check GitHub Pages Settings**
   - Go to Settings → Pages
   - Ensure "Source" is set to "GitHub Actions"
   - Not "Deploy from a branch"

2. **Check Permissions**
   - Go to Settings → Actions → General
   - Ensure workflow has appropriate permissions
   - The workflow needs: contents (read), pages (write), id-token (write)

### Manual Build Process

If you need to build locally:

```bash
# Install dependencies
pnpm install

# Run the build
pnpm build

# The build process will:
# 1. Clean dist directory
# 2. Convert YAML to JSON (via Makefile)
# 3. Add $id properties at build time
# 4. Bundle schemas

# To test the full build including packages
pnpm build:all
```

## Important Notes

- **Never manually add `$id` to source YAML files** - these are added automatically at build time
- **Always use semantic versioning** for version numbers
- **The `master` branch is the main branch** for releases
- **GitHub Pages URL structure** matches the flattened deployment structure, not the source structure

## Schema URL Structure

After deployment, schemas are accessible at:

- **Event Schemas**: `https://nostrability.github.io/schemata/note/kind/{kind}.json`
- **Tag Schemas**: `https://nostrability.github.io/schemata/tag/{tag_name}.json`
- **Protocol Messages**: `https://nostrability.github.io/schemata/message/{MESSAGE_TYPE}.json`

These URLs are automatically set as the `$id` property in each schema during the build process.