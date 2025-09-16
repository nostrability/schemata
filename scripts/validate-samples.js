#!/usr/bin/env node
// Validate all sample JSON files against their built schemas in dist/.
// Scans nips/**/schema.yaml directories that contain a samples/ folder.

import { readdirSync, statSync, readFileSync, existsSync } from 'fs';
import { join, resolve, sep, relative as relpath } from 'path';
import Ajv from 'ajv';

function* walkForSchemas(root) {
  const entries = readdirSync(root);
  for (const name of entries) {
    const full = join(root, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      const schemaYaml = join(full, 'schema.yaml');
      if (existsSync(schemaYaml)) yield full;
      yield* walkForSchemas(full);
    }
  }
}

function loadJSON(path) {
  return JSON.parse(readFileSync(resolve(path), 'utf8'));
}

const summary = { totalSuites: 0, totalCases: 0, passed: 0, failed: 0, failures: [] };
const ajv = new Ajv({ allErrors: true, strict: false });
try {
  const mod = await import('ajv-formats');
  const addFormats = mod.default || mod;
  addFormats(ajv);
} catch (e) {
  console.warn('WARN: ajv-formats not available; URL/email formats may not be enforced.');
}

// CLI: allow selecting a single schema directory via --only <path> (directory or schema.yaml)
function parseArgs(argv) {
  const out = { only: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--only' && i + 1 < argv.length) {
      out.only = argv[++i];
    } else if (a.startsWith('--only=')) {
      out.only = a.slice('--only='.length);
    }
  }
  return out;
}

function resolveOnlyPath(p) {
  if (!p) return null;
  const abs = resolve(p);
  let dir = abs;
  try {
    const st = statSync(abs);
    if (st.isFile()) {
      if (abs.endsWith('schema.yaml')) dir = abs.slice(0, -'schema.yaml'.length - 1);
      else return null;
    }
  } catch (_) {
    return null;
  }
  const schemaYaml = join(dir, 'schema.yaml');
  if (!existsSync(schemaYaml)) return null;
  return dir;
}

const args = parseArgs(process.argv.slice(2));
const onlyDir = resolveOnlyPath(args.only);

let foundAny = false;
const schemaDirs = onlyDir ? [onlyDir] : Array.from(walkForSchemas('nips'));
for (const schemaDir of schemaDirs) {
  const samplesDir = join(schemaDir, 'samples');
  if (!existsSync(samplesDir)) continue;
  foundAny = true;
  const relLocal = relpath(process.cwd(), schemaDir);
  const rel = relLocal.split(sep).join('/');
  const distSchema = `dist/${rel}/schema.json`;
  summary.totalSuites += 1;

  if (!existsSync(distSchema)) {
    console.warn(`WARN: Built schema not found for ${rel}. Did you run 'pnpm build'?`);
    continue;
  }

  const schema = loadJSON(distSchema);
  const validate = ajv.compile(schema);

  // Detect stringified fields and prepare per-field validators (e.g., content)
  const stringified = Array.isArray(schema['x-stringified']) ? schema['x-stringified'] : [];
  const distContentSchema = `dist/${rel}/schema.content.json`;
  let validateContent = null;
  if (stringified.includes('content') && existsSync(distContentSchema)) {
    try {
      const contentSchema = loadJSON(distContentSchema);
      validateContent = ajv.compile(contentSchema);
    } catch (e) {
      console.warn(`WARN: Unable to compile content schema for ${rel}: ${e.message || e}`);
    }
  }
  const files = readdirSync(samplesDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => join(samplesDir, f));

  for (const file of files) {
    const name = file.split(sep).pop() || file;
    const expectValid = name === 'valid.json';
    const expectInvalid = name.startsWith('invalid');
    if (!expectValid && !expectInvalid) continue;
    summary.totalCases += 1;

    try {
      const data = loadJSON(file);
      const okEvent = validate(data);

      let okContent = true;
      const contentErrors = [];
      if (validateContent) {
        try {
          if (typeof data.content !== 'string') {
            okContent = false;
            contentErrors.push({ instancePath: '/content', message: 'expected string with stringified JSON' });
          } else {
            const parsed = JSON.parse(data.content);
            okContent = validateContent(parsed);
            if (!okContent) {
              for (const e of validateContent.errors || []) {
                contentErrors.push({ instancePath: `/content${e.instancePath || ''}` , message: e.message });
              }
            }
          }
        } catch (e) {
          okContent = false;
          contentErrors.push({ instancePath: '/content', message: `JSON parse error: ${e.message || e}` });
        }
      }

      const ok = okEvent && okContent;
      if (expectValid) {
        if (!ok) {
          const errs = [];
          if (!okEvent) errs.push(...(validate.errors || []));
          if (!okContent) errs.push(...contentErrors);
          summary.failures.push({ schema: rel, sample: name, errors: errs });
        }
        summary.passed += ok ? 1 : 0;
        summary.failed += ok ? 0 : 1;
      } else {
        if (ok) summary.failures.push({ schema: rel, sample: name, errors: [{ message: 'expected invalid but validated' }] });
        summary.passed += ok ? 0 : 1;
        summary.failed += ok ? 1 : 0;
      }
    } catch (e) {
      summary.failures.push({ schema: rel, sample: name, errors: [{ message: e.message || String(e) }] });
      summary.failed += 1;
    }
  }
}

if (!foundAny) {
  if (onlyDir) {
    console.error(`No samples found for schema: ${onlyDir}`);
    process.exit(2);
  }
  console.log('No sample suites found under nips/**/samples. Nothing to validate.');
  process.exit(0);
}

const lines = [];
lines.push('==== Samples Summary ====');
lines.push(`Suites: ${summary.totalSuites}, Cases: ${summary.totalCases}, Passed: ${summary.passed}, Failed: ${summary.failed}`);
if (summary.failures.length) {
  lines.push('Failures:');
  for (const f of summary.failures) {
    lines.push(`- ${f.schema} :: ${f.sample}`);
    const errs = (f.errors || []).slice(0, 3);
    for (const e of errs) {
      const path = e.instancePath || '';
      const msg = e.message || 'validation error';
      lines.push(`  • ${path} ${msg}`);
    }
    if ((f.errors || []).length > 3) lines.push('  • ...');
  }
}
console.log(lines.join('\n'));

process.exit(summary.failed > 0 ? 1 : 0);
