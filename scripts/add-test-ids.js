import * as fs from "node:fs";
import * as crypto from "node:crypto";
import jsonStringify from "json-stringify-deterministic";
import { parse, modify, applyEdits } from "jsonc-parser";
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
    .update(
      jsonStringify(normalizedSchema) +
      jsonStringify(testData) +
      testValid
    )
    .digest("hex");
}

async function addIdsToFile(filePath, dialectUri) {
  console.log("Reading:", filePath);

  const text = fs.readFileSync(filePath, "utf8");
  const tests = parse(text);
  let edits = [];
  let added = 0;

  for (let i = 0; i < tests.length; i++) {
    const testCase = tests[i];
    const normalizedSchema = await normalize(testCase.schema, dialectUri);

    for (let j = 0; j < testCase.tests.length; j++) {
      const test = testCase.tests[j];

      if (!test.id) {
        const id = generateTestId(
          normalizedSchema,
          test.data,
          test.valid
        );

        const path = [i, "tests", j, "id"];

        edits.push(
          ...modify(text, path, id, {
            formattingOptions: {
              insertSpaces: true,
              tabSize: 2
            }
          })
        );

        added++;
      }
    }
  }

  if (added > 0) {
    const updatedText = applyEdits(text, edits);
    fs.writeFileSync(filePath, updatedText);
    console.log(` Added ${added} IDs`);
  } else {
    console.log(" All tests already have IDs");
  }
}

//CLI stuff

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
  await addIdsToFile(filePath, dialectUri);
} else {
  const testDir = `tests/${dialectArg}`;
  const files = fs.readdirSync(testDir).filter(f => f.endsWith(".json"));

  for (const file of files) {
    await addIdsToFile(`${testDir}/${file}`, dialectUri);
  }
}
