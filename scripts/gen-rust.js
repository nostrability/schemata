/**
 * gen-rust.js
 *
 * Generates a Rust crate from all JSON schemas in dist/nips/ and dist/mips/.
 * Skips dist/@/ (aliases that would duplicate types).
 *
 * Each schema is wrapped in its own submodule to prevent auxiliary-type
 * name collisions (e.g. NIP-11 generates Fees, Limitation helper structs).
 * Only the top-level type is re-exported from the category module.
 *
 * Output: dist/packages/rust/  (Cargo.toml, src/, tests/)
 */

import { execFileSync } from 'child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
} from 'fs';
import { resolve, join, relative, basename, dirname } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist');
const NIPS_DIR = join(DIST, 'nips');
const MIPS_DIR = join(DIST, 'mips');
const OUT = join(DIST, 'packages', 'rust');
const SRC = join(OUT, 'src');
const TESTS_DIR = join(OUT, 'tests');
const FIXTURES_DIR = join(TESTS_DIR, 'fixtures');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAllJsonFiles(dir) {
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((ent) => {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) return getAllJsonFiles(full);
    if (ent.name.endsWith('.json')) return [full];
    return [];
  });
}

/** Convert hyphenated/underscored string to PascalCase */
function toPascalCase(str) {
  return str
    .split(/[-_]+/)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

/** Convert string to a valid Rust snake_case module name */
function toSnakeCase(str) {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
    .replace(/[-]+/g, '_')
    .replace(/__+/g, '_');
}

/**
 * Categorize a schema file by its path components.
 * Returns { category, modName, typeName } or null if uncategorizable.
 */
function categorizeSchema(filePath) {
  const rel = relative(DIST, filePath);
  // rel looks like: nips/nip-01/kind-1/schema.json  or  mips/mip-00/tag/client/schema.json
  const parts = rel.split('/');
  // parts: [source, spec, ...rest, 'schema.json']
  if (parts.length < 3) return null;

  const source = parts[0]; // 'nips' or 'mips'
  const spec = parts[1]; // 'nip-01' or 'mip-00'
  const rest = parts.slice(2, -1); // path components between spec and schema.json

  if (rest.length === 0) {
    // Schema directly in spec folder, e.g. nips/nip-11/schema.json
    const typeName = toPascalCase(spec);
    const modName = toSnakeCase(spec).replace(/_/g, '');
    return { category: 'other', modName, typeName, source, spec };
  }

  const first = rest[0];

  if (first.startsWith('kind-')) {
    const kindNum = first.replace('kind-', '');
    return {
      category: 'kind',
      modName: `kind${kindNum}`,
      typeName: `Kind${kindNum}`,
      source,
      spec,
    };
  }

  if (first === 'tag') {
    const tagName = rest[1] || 'tag';
    // Sanitize tag names: _A -> upper_a, e-react -> e_react
    const sanitized = tagName.replace(/^_/, 'upper_').replace(/-/g, '_');
    const modName = sanitized.toLowerCase();
    const typeName = toPascalCase(sanitized);
    return {
      category: 'tag',
      modName: `${spec.replace(/-/g, '')}_${modName}`,
      typeName: `${toPascalCase(spec)}${typeName}`,
      source,
      spec,
    };
  }

  if (first === 'messages') {
    const msgName = rest[1] || 'message';
    const modName = msgName.replace(/-/g, '_');
    const typeName = toPascalCase(msgName);
    return {
      category: 'message',
      modName: `${spec.replace(/-/g, '')}_${modName}`,
      typeName: `${toPascalCase(spec)}${typeName}`,
      source,
      spec,
    };
  }

  // Anything else (note, note-unsigned, secp256k1, identifier, well-known)
  const folderName = rest.join('_').replace(/-/g, '_');
  const modName = `${spec.replace(/-/g, '')}_${folderName}`;
  const typeName = `${toPascalCase(spec)}${toPascalCase(rest.join('-'))}`;
  return { category: 'other', modName, typeName, source, spec };
}

/**
 * Run quicktype on a single schema file.
 * Returns { code, actualTypeName } or null on failure.
 * quicktype may transform the top-level name (e.g. Secp256k1 → Secp256K1),
 * so we extract the actual name from the generated code.
 */
function runQuicktype(schemaPath, topLevelName) {
  try {
    const code = execFileSync('npx', [
      'quicktype',
      '--lang', 'rs',
      '--src-lang', 'schema',
      '--visibility', 'public',
      '--derive-debug',
      '--derive-clone',
      '--derive-partial-eq',
      '--skip-serializing-none',
      '--no-leading-comments',
      '--edition-2018',
      '--top-level', topLevelName,
      schemaPath,
    ], {
      encoding: 'utf-8',
      timeout: 30_000,
      cwd: DIST,
    });

    // Extract the actual top-level type name from generated code.
    // quicktype emits either `pub struct Name` or `pub type Name`.
    // The first such declaration is always the top-level type.
    const match = code.match(/^pub (?:struct|type|enum) (\w+)/m);
    const actualTypeName = match ? match[1] : topLevelName;

    return { code, actualTypeName };
  } catch (err) {
    return null;
  }
}

/**
 * Find valid.json fixture for a given dist schema by looking in the source tree.
 * Schema at dist/nips/nip-01/kind-1/schema.json -> nips/nip-01/kind-1/samples/valid.json
 */
function findFixture(schemaPath) {
  const rel = relative(DIST, schemaPath);
  const parts = rel.split('/');
  parts.pop(); // remove schema.json
  const srcDir = join(ROOT, ...parts, 'samples');
  const fixture = join(srcDir, 'valid.json');
  return existsSync(fixture) ? fixture : null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log('gen-rust: collecting schemas from dist/nips and dist/mips...');

  const nipsFiles = getAllJsonFiles(NIPS_DIR);
  const mipsFiles = getAllJsonFiles(MIPS_DIR);
  const allFiles = [...nipsFiles, ...mipsFiles];

  console.log(`gen-rust: found ${allFiles.length} schema files`);

  // Categorize all schemas
  const schemas = [];
  for (const f of allFiles) {
    const info = categorizeSchema(f);
    if (!info) {
      console.warn(`gen-rust: skipping uncategorizable schema: ${f}`);
      continue;
    }
    schemas.push({ ...info, path: f });
  }

  // Deduplicate by modName (first wins, matching build.js behavior)
  const seen = new Set();
  const unique = schemas.filter((s) => {
    if (seen.has(s.modName)) return false;
    seen.add(s.modName);
    return true;
  });

  console.log(`gen-rust: ${unique.length} unique schemas to generate`);

  // Prepare output directories
  mkdirSync(SRC, { recursive: true });
  mkdirSync(FIXTURES_DIR, { recursive: true });

  // Group by category
  const byCategory = { kind: [], tag: [], message: [], other: [] };
  const report = { success: [], warning: [] };
  const fixtures = []; // { fixtureName, typeName, categoryMod, modName }

  for (const schema of unique) {
    const { category, modName, typeName, path: schemaPath, spec } = schema;
    console.log(`gen-rust: [${category}] ${typeName} from ${relative(ROOT, schemaPath)}`);

    const result = runQuicktype(schemaPath, typeName);

    if (!result) {
      const entry = { schema: relative(ROOT, schemaPath), typeName, modName, category };
      report.warning.push(entry);
      console.warn(`gen-rust: WARNING — ${category} schema failed: ${typeName}`);
      continue;
    }

    const { code, actualTypeName } = result;
    report.success.push({ schema: relative(ROOT, schemaPath), typeName: actualTypeName, modName, category });
    byCategory[category].push({ modName, typeName: actualTypeName, code });

    // Check for fixture
    const fixturePath = findFixture(schemaPath);
    if (fixturePath) {
      const fixtureName = `${modName}-valid.json`;
      copyFileSync(fixturePath, join(FIXTURES_DIR, fixtureName));
      fixtures.push({ fixtureName, typeName: actualTypeName, categoryMod: category === 'kind' ? 'kinds' : category === 'tag' ? 'tags' : category === 'message' ? 'messages' : 'other', modName });
    }
  }

  // -----------------------------------------------------------------------
  // Write category module files
  // -----------------------------------------------------------------------

  for (const [category, entries] of Object.entries(byCategory)) {
    if (entries.length === 0) continue;

    const fileName = category === 'kind' ? 'kinds.rs'
      : category === 'tag' ? 'tags.rs'
      : category === 'message' ? 'messages.rs'
      : 'other.rs';

    let content = '#![allow(unused_imports)]\n\n';
    for (const { modName, typeName, code } of entries) {
      content += `pub mod ${modName} {\n`;
      // Indent each line of generated code
      for (const line of code.split('\n')) {
        if (line.trim()) {
          content += `    ${line}\n`;
        } else {
          content += '\n';
        }
      }
      content += `}\n`;
      content += `pub use ${modName}::${typeName};\n\n`;
    }

    writeFileSync(join(SRC, fileName), content);
    console.log(`gen-rust: wrote ${fileName} (${entries.length} types)`);
  }

  // -----------------------------------------------------------------------
  // Write lib.rs
  // -----------------------------------------------------------------------

  let libRs = '';
  if (byCategory.kind.length > 0) libRs += 'pub mod kinds;\n';
  if (byCategory.tag.length > 0) libRs += 'pub mod tags;\n';
  if (byCategory.message.length > 0) libRs += 'pub mod messages;\n';
  if (byCategory.other.length > 0) libRs += 'pub mod other;\n';

  writeFileSync(join(SRC, 'lib.rs'), libRs);
  console.log('gen-rust: wrote lib.rs');

  // -----------------------------------------------------------------------
  // Write Cargo.toml
  // -----------------------------------------------------------------------

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
  const version = pkg.version || '0.1.0';

  const cargoToml = `[package]
name = "nostrability-schemata"
version = "${version}"
edition = "2021"
description = "Generated Rust types from Nostrability JSON schemas"
license = "GPL-3.0-or-later"

[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
`;

  writeFileSync(join(OUT, 'Cargo.toml'), cargoToml);
  console.log('gen-rust: wrote Cargo.toml');

  // -----------------------------------------------------------------------
  // Write smoke tests
  // -----------------------------------------------------------------------

  if (fixtures.length > 0) {
    let testRs = `use serde_json;\n`;
    testRs += `use nostrability_schemata::*;\n\n`;

    for (const { fixtureName, typeName, categoryMod, modName } of fixtures) {
      const testName = `test_deserialize_${modName}`;
      testRs += `#[test]\n`;
      testRs += `fn ${testName}() {\n`;
      testRs += `    let data = include_str!("fixtures/${fixtureName}");\n`;
      testRs += `    let result = serde_json::from_str::<${categoryMod}::${typeName}>(data);\n`;
      testRs += `    assert!(result.is_ok(), "Failed to deserialize ${typeName}: {:?}", result.err());\n`;
      testRs += `}\n\n`;
    }

    writeFileSync(join(TESTS_DIR, 'smoke.rs'), testRs);
    console.log(`gen-rust: wrote smoke.rs (${fixtures.length} tests)`);
  }

  // -----------------------------------------------------------------------
  // Write CODEGEN_REPORT.md
  // -----------------------------------------------------------------------

  let reportMd = `# Codegen Report\n\n`;
  reportMd += `Generated by \`scripts/gen-rust.js\` at ${new Date().toISOString()}\n\n`;
  reportMd += `## Summary\n\n`;
  reportMd += `- **Success**: ${report.success.length}\n`;
  reportMd += `- **Skipped** (quicktype could not process): ${report.warning.length}\n`;
  reportMd += `- **Smoke tests**: ${fixtures.length}\n\n`;

  if (report.success.length > 0) {
    reportMd += `## Successful\n\n`;
    reportMd += `| Category | Type | Schema |\n`;
    reportMd += `|----------|------|--------|\n`;
    for (const s of report.success) {
      reportMd += `| ${s.category} | \`${s.typeName}\` | \`${s.schema}\` |\n`;
    }
    reportMd += `\n`;
  }

  if (report.warning.length > 0) {
    reportMd += `## Skipped\n\n`;
    reportMd += `These schemas failed quicktype codegen (typically due to unresolved \`$ref\` or \`allOf\`/\`oneOf\` complexity):\n\n`;
    for (const w of report.warning) {
      reportMd += `- \`${w.typeName}\` (${w.category}) — \`${w.schema}\`\n`;
    }
    reportMd += `\n`;
  }

  reportMd += `## Known Limitations\n\n`;
  reportMd += `- Smoke tests only prove sample fixtures deserialize — not full schema compatibility\n`;
  reportMd += `- quicktype may produce \`Option<T>\` for fields that are actually required, or vice versa\n`;
  reportMd += `- Complex \`allOf\`/\`oneOf\` schemas may produce unexpected Rust types\n`;
  reportMd += `- Tag schemas mostly become \`Vec<String>\` (type alias) — no field-level validation in Rust\n`;

  writeFileSync(join(OUT, 'CODEGEN_REPORT.md'), reportMd);
  console.log('gen-rust: wrote CODEGEN_REPORT.md');

  // -----------------------------------------------------------------------
  // Exit code
  // -----------------------------------------------------------------------

  if (report.success.length === 0) {
    console.error('gen-rust: no schemas succeeded — exiting with error');
    process.exit(1);
  }

  if (report.warning.length > 0) {
    console.warn(`gen-rust: ${report.warning.length} schema(s) skipped (see CODEGEN_REPORT.md)`);
  }

  console.log(`gen-rust: done — ${report.success.length} types generated`);
}

main();
