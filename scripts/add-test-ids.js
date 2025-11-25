import * as fs from "node:fs";
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

async function addIdsToFile(filePath) {
  console.log("Reading:", filePath);
  const tests = JSON.parse(fs.readFileSync(filePath, "utf8"));
  let changed = false;
  let added = 0;

  if (!Array.isArray(tests)) {
    console.log("Expected an array at top level, got:", typeof tests);
    return;
  }

  for (const testCase of tests) {
    if (!Array.isArray(testCase.tests)) continue;

    const dialectUri = getDialectUri(testCase.schema || {});
    const normalizedSchema = await normalize(testCase.schema || true, dialectUri);

    for (const test of testCase.tests) {
      if (!test.id) {
        test.id = generateTestId(normalizedSchema, test.data, test.valid);
        changed = true;
        added++;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(tests, null, 2) + "\n");
    console.log(`✓ Added ${added} IDs`);
  } else {
    console.log("✓ All tests already have IDs");
  }
}

// Load remotes for all dialects
const remotesPaths = ["./remotes"];
for (const dialectUri of Object.values(DIALECT_MAP)) {
  for (const path of remotesPaths) {
    if (fs.existsSync(path)) {
      loadRemotes(dialectUri, path);
    }
  }
}

const filePath = process.argv[2] || "tests/draft2020-12/enum.json";
addIdsToFile(filePath).catch(console.error);