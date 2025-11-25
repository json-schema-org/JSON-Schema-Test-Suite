import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import jsonStringify from "json-stringify-deterministic";
import { normalize } from "./normalize.js";
import { loadRemotes } from "./load-remotes.js";

const DIALECT_MAP = {
  "https://json-schema.org/draft/2020-12/schema": "https://json-schema.org/draft/2020-12/schema",
  "https://json-schema.org/draft/2019-09/schema": "https://json-schema.org/draft/2019-09/schema",
  "http://json-schema.org/draft-07/schema#": "http://json-schema.org/draft-07/schema#",
  "http://json-schema.org/draft-06/schema#": "http://json-schema.org/draft-06/schema#",
  "http://json-schema.org/draft-04/schema#": "http://json-schema.org/draft-04/schema#"
};

function* jsonFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* jsonFiles(full);
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      yield full;
    }
  }
}

function getDialectUri(schema) {
  if (schema.$schema && DIALECT_MAP[schema.$schema]) {
    return DIALECT_MAP[schema.$schema];
  }
  return "https://json-schema.org/draft/2020-12/schema";
}

function generateTestId(normalizedSchema, testData, testValid) {
  return crypto
    .createHash("md5")
    .update(jsonStringify(normalizedSchema) + jsonStringify(testData) + testValid)
    .digest("hex");
}

async function checkVersion(dir) {
  const missingIdFiles = new Set();
  const duplicateIdFiles = new Set();
  const mismatchedIdFiles = new Set();
  const idMap = new Map();

  console.log(`Checking tests in ${dir}...`);

  for (const file of jsonFiles(dir)) {
    const tests = JSON.parse(fs.readFileSync(file, "utf8"));

    for (let i = 0; i < tests.length; i++) {
      const testCase = tests[i];
      if (!Array.isArray(testCase.tests)) continue;

      const dialectUri = getDialectUri(testCase.schema || {});
      const normalizedSchema = await normalize(testCase.schema || true, dialectUri);

      for (let j = 0; j < testCase.tests.length; j++) {
        const test = testCase.tests[j];

        if (!test.id) {
          missingIdFiles.add(file);
          console.log(`  ✗ Missing ID: ${file} | ${testCase.description} | ${test.description}`);
          continue;
        }

        const expectedId = generateTestId(normalizedSchema, test.data, test.valid);

        if (test.id !== expectedId) {
          mismatchedIdFiles.add(file);
          console.log(`  ✗ Mismatched ID: ${file}`);
          console.log(`    Test: ${testCase.description} | ${test.description}`);
          console.log(`    Current ID:  ${test.id}`);
          console.log(`    Expected ID: ${expectedId}`);
        }

        if (idMap.has(test.id)) {
          const existing = idMap.get(test.id);
          duplicateIdFiles.add(file);
          duplicateIdFiles.add(existing.file);
          console.log(`  ✗ Duplicate ID: ${test.id}`);
          console.log(`    First:  ${existing.file} | ${existing.testCase} | ${existing.test}`);
          console.log(`    Second: ${file} | ${testCase.description} | ${test.description}`);
        } else {
          idMap.set(test.id, {
            file,
            testCase: testCase.description,
            test: test.description
          });
        }
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("Summary:");
  console.log("=".repeat(60));

  console.log("\nFiles with missing IDs:");
  if (missingIdFiles.size === 0) {
    console.log("  ✓ None");
  } else {
    for (const f of missingIdFiles) console.log(`  - ${f}`);
  }

  console.log("\nFiles with mismatched IDs:");
  if (mismatchedIdFiles.size === 0) {
    console.log("  ✓ None");
  } else {
    for (const f of mismatchedIdFiles) console.log(`  - ${f}`);
  }

  console.log("\nFiles with duplicate IDs:");
  if (duplicateIdFiles.size === 0) {
    console.log("  ✓ None");
  } else {
    for (const f of duplicateIdFiles) console.log(`  - ${f}`);
  }

  const hasErrors = missingIdFiles.size > 0 || mismatchedIdFiles.size > 0 || duplicateIdFiles.size > 0;
  
  console.log("\n" + "=".repeat(60));
  if (hasErrors) {
    console.log("❌ Check failed - issues found");
    process.exit(1);
  } else {
    console.log("✅ All checks passed!");
  }
}

// Load remotes
const remotesPaths = ["./remotes"];
for (const dialectUri of Object.values(DIALECT_MAP)) {
  for (const path of remotesPaths) {
    if (fs.existsSync(path)) {
      loadRemotes(dialectUri, path);
    }
  }
}

const dir = process.argv[2] || "tests/draft2020-12";
checkVersion(dir).catch(console.error);