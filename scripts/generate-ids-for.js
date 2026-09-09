import { generateIdsFor } from "./utils/test-ids.js";

const version = process.argv[2];
if (!version) {
  console.error("Usage: node scripts/generate-ids-for.js <draftXXXX>");
  process.exit(1);
}

await generateIdsFor(version);
