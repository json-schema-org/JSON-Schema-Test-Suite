import * as fs from "node:fs";
import * as crypto from "node:crypto";
import jsonStringify from "json-stringify-deterministic";
import { normalize } from "./normalize.js";
import { loadRemotes } from "./load-remotes.js";

const DIALECT_MAP = {
  "draft2020-12": "https://json-schema.org/draft/2020-12/schema",
  "draft2019-09": "https://json-schema.org/draft/2019-09/schema",
  "draft7": "http://json-schema.org/draft-07/schema#",
  "draft6": "http://json-schema.org/draft-06/schema#",
  "draft4": "http://json-schema.org/draft-04/schema#"
};

function generateTestId(normalizedSchema, testData, testValid) {
  return crypto
    .createHash("md5")
    .update(jsonStringify(normalizedSchema) + jsonStringify(testData) + testValid)
    .digest("hex");
}

async function addIdsToFile(filePath, dialectUri) {
  console.log("Reading:", filePath);
  const tests = JSON.parse(fs.readFileSync(filePath, "utf8"));
  let added = 0;

  for (const testCase of tests) {
    // Pass dialectUri from directory, not from schema
    // @hyperjump/json-schema handles the schema's $schema internally
    const normalizedSchema = await normalize(testCase.schema, dialectUri);

    for (const test of testCase.tests) {
      if (!test.id) {
        test.id = generateTestId(normalizedSchema, test.data, test.valid);
        added++;
      }
    }
  }

  if (added > 0) {
    fs.writeFileSync(filePath, JSON.stringify(tests, null, 4) + "\n");
    console.log(` Added ${added} IDs`);
  } else {
    console.log(" All tests already have IDs");
  }
}

// Get dialect from command line argument (e.g., "draft2020-12")
const dialectArg = process.argv[2];
if (!dialectArg || !DIALECT_MAP[dialectArg]) {
  console.error("Usage: node add-test-ids.js <dialect> [file-path]");
  console.error("Available dialects:", Object.keys(DIALECT_MAP).join(", "));
  process.exit(1);
}

const dialectUri = DIALECT_MAP[dialectArg];
const filePath = process.argv[3];

// Load remotes only for the specified dialect
loadRemotes(dialectUri, "./remotes");

if (filePath) {
  // Process single file
  addIdsToFile(filePath, dialectUri);
} else {
  // Process all files in the dialect directory
  const testDir = `tests/${dialectArg}`;
  const files = fs.readdirSync(testDir).filter(f => f.endsWith('.json'));
  
  for (const file of files) {
    await addIdsToFile(`${testDir}/${file}`, dialectUri);
  }
}