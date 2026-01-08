import * as fs from "node:fs";
import * as path from "node:path";
import { normalize } from "./normalize.js";
import { loadRemotes } from "./load-remotes.js";
import generateTestId from "./utils/generateTestIds.js";
import jsonFiles from "./utils/jsonfiles.js";


// Helpers       

function dialectFromDir(dir) {
  const draft = path.basename(dir);

  switch (draft) {
    case "draft2020-12":
      return "https://json-schema.org/draft/2020-12/schema";
    case "draft2019-09":
      return "https://json-schema.org/draft/2019-09/schema";
    case "draft7":
      return "http://json-schema.org/draft-07/schema#";
    case "draft6":
      return "http://json-schema.org/draft-06/schema#";
    case "draft4":
      return "http://json-schema.org/draft-04/schema#";
    default:
      throw new Error(`Unknown draft directory: ${draft}`);
  }
}




async function checkVersion(dir) {
  const missingIdFiles = new Set();
  const mismatchedIdFiles = new Set();

  const dialectUri = dialectFromDir(dir);

  console.log(`Checking tests in ${dir}...`);
  console.log(`Using dialect: ${dialectUri}`);

  // Load remotes ONCE for this dialect
  const remotesPath = "./remotes";
  loadRemotes(dialectUri, remotesPath);

  for (const file of jsonFiles(dir)) {
    const testCases = JSON.parse(fs.readFileSync(file, "utf8"));

    for (const testCase of testCases) {
      const normalizedSchema = await normalize(testCase.schema, dialectUri);

      for (const test of testCase.tests) {
        if (!test.id) {
          missingIdFiles.add(file);
          console.log(
            `  ✗ Missing ID: ${file} | ${testCase.description} | ${test.description}`
          );
          continue;
        }

        const expectedId = generateTestId(
          normalizedSchema,
          test.data,
          test.valid
        );

        if (test.id !== expectedId) {
          mismatchedIdFiles.add(file);
          console.log(`  ✗ Mismatched ID: ${file}`);
          console.log(
            `    Test: ${testCase.description} | ${test.description}`
          );
          console.log(`    Current ID:  ${test.id}`);
          console.log(`    Expected ID: ${expectedId}`);
        }
      }
    }
  }

  //Summary
  console.log("\n" + "=".repeat(60));
  console.log("Summary:");
  console.log("=".repeat(60));

  console.log("\nFiles with missing IDs:");
  missingIdFiles.size === 0
    ? console.log("  ✓ None")
    : [...missingIdFiles].forEach(f => console.log(`  - ${f}`));

  console.log("\nFiles with mismatched IDs:");
  mismatchedIdFiles.size === 0
    ? console.log("  ✓ None")
    : [...mismatchedIdFiles].forEach(f => console.log(`  - ${f}`));

  const hasErrors =
    missingIdFiles.size > 0 || mismatchedIdFiles.size > 0;

  console.log("\n" + "=".repeat(60));
  if (hasErrors) {
    console.log("❌ Check failed - issues found");
    process.exit(1);
  } else {
    console.log("✅ All checks passed!");
  }
}


// CLI 


const dir = process.argv[2];
if (!dir) {
  console.error("Usage: node scripts/check-test-ids.js <tests/draftXXXX>");
  process.exit(1);
}

await checkVersion(dir);
