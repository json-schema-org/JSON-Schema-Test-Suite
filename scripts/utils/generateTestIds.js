import * as crypto from "node:crypto";
import jsonStringify from "json-stringify-deterministic";

export default function generateTestId(normalizedSchema, testData, testValid) {
  return crypto
    .createHash("md5")
    .update(
      jsonStringify(normalizedSchema) +
      jsonStringify(testData) +
      testValid
    )
    .digest("hex");
}