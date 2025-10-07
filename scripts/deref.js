/**
 * scripts/deref.js
 *
 * Usage: node deref.js input.json output.json
 * Actually merges references using @apidevtools/json-schema-ref-parser
 */

import fs from "fs/promises";
import path from "path";
import $RefParser from "@apidevtools/json-schema-ref-parser";

const [inputFile, outputFile] = process.argv.slice(2);

try {
  const data = await fs.readFile(path.resolve(inputFile), "utf-8");
  const schema = JSON.parse(data);

  const deref = await $RefParser.dereference(schema, {
  });

  // Deduplicate $id values within the dereferenced tree to avoid
  // multiple occurrences of the same absolute $id in a single output.
  // Keep the first occurrence; remove subsequent duplicates.
  const seen = new Set();
  function dedupeIds(node, isRoot = false) {
    if (Array.isArray(node)) {
      for (const item of node) dedupeIds(item, false);
      return;
    }
    if (node && typeof node === "object") {
      if (typeof node.$id === "string") {
        if (!isRoot) {
          // Drop inlined $id values to avoid duplicates across schemas.
          delete node.$id;
        } else if (seen.has(node.$id)) {
          delete node.$id;
        } else {
          seen.add(node.$id);
        }
      }
      for (const val of Object.values(node)) dedupeIds(val, false);
    }
  }
  dedupeIds(deref, true);

  await fs.writeFile(path.resolve(outputFile), JSON.stringify(deref, null, 2), "utf-8");
  console.log(`Schema written to ${outputFile}`);
} catch (err) {
  console.error(err);
  process.exit(1);
}
