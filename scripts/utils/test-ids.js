import * as crypto from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import jsonStringify from "json-stringify-deterministic";
import { applyEdits, modify } from "jsonc-parser";

import * as Pact from "@hyperjump/pact";
import * as JsonPointer from "@hyperjump/json-pointer";
import * as Schema from "@hyperjump/browser";
import { registerSchema, unregisterSchema } from "@hyperjump/json-schema";
import { getSchema, getKeywordId, getKeywordName } from "@hyperjump/json-schema/experimental";
import "@hyperjump/json-schema/draft-2020-12";
import "@hyperjump/json-schema/draft-2019-09";
import "@hyperjump/json-schema/draft-07";
import "@hyperjump/json-schema/draft-06";
import "@hyperjump/json-schema/draft-04";

const DIALECT_MAP = {
  "v1": "https://json-schema.org/v1",
  "draft2020-12": "https://json-schema.org/draft/2020-12/schema",
  "draft2019-09": "https://json-schema.org/draft/2019-09/schema",
  "draft7": "http://json-schema.org/draft-07/schema",
  "draft6": "http://json-schema.org/draft-06/schema",
  "draft4": "http://json-schema.org/draft-04/schema",
  "draft3": "http://json-schema.org/draft-03/schema"
};

export const generateIdsFor = async (version) => {
  const dialectUri = DIALECT_MAP[version];

  const registeredSchemas = await loadRemotes(version);

  for (const entry of await fs.readdir(`./tests/${version}`, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || path.extname(entry.name) !== ".json") {
      continue;
    }

    const edits = [];
    const filePath = path.resolve(entry.parentPath, entry.name);
    const json = await fs.readFile(filePath, "utf8")
    const suite = JSON.parse(json);

    for (let testCaseIndex = 0; testCaseIndex < suite.length; testCaseIndex++) {
      const testCase = suite[testCaseIndex];

      try {
        const normalizedSchema = await normalizeSchema(testCase.schema, dialectUri);

        for (let testIndex = 0; testIndex < testCase.tests.length; testIndex++) {
          const test = testCase.tests[testIndex];
          const id = generateTestId(normalizedSchema, test.data, test.valid);

          edits.push(...modify(json, [testCaseIndex, "tests", testIndex, "id"], id, {
            formattingOptions: {
              insertSpaces: true,
              tabSize: 4
            }
          }));
        }
      } catch (error) {
        console.log(`Failed to generate an ID for ${version} ${entry.name}: ${testCase.description}`);
        // console.log(error);
      }
    }

    if (edits.length > 0) {
      const updatedJson = applyEdits(json, edits);
      await fs.writeFile(filePath, updatedJson);
    }
  }

  for (const remoteUri of registeredSchemas) {
    unregisterSchema(remoteUri);
  }
};

export const loadRemotes = async (version, filePath = `./remotes`, url = "") => {
  const registeredSchemas = [];

  for (const entry of await fs.readdir(filePath, { withFileTypes: true })) {
    if (entry.isFile() && path.extname(entry.name) === ".json") {
      const remote = JSON.parse(await fs.readFile(`${filePath}/${entry.name}`, "utf8"));
      const schemaUri = `http://localhost:1234${url}/${entry.name}`;
      registerSchema(remote, schemaUri, DIALECT_MAP[version]);
      registeredSchemas.push(schemaUri);
    } else if (entry.isDirectory() && entry.name === version || !(entry.name in DIALECT_MAP)) {
      registeredSchemas.push(...await loadRemotes(version, `${filePath}/${entry.name}`, `${url}/${entry.name}`));
    }
  }

  return registeredSchemas;
};

export const generateTestId = (normalizedSchema, testData, testValid) => {
  return crypto
    .createHash("md5")
    .update(jsonStringify(normalizedSchema) + jsonStringify(testData) + testValid)
    .digest("hex");
};

export const normalizeSchema = async (rawSchema, dialectUri) => {
  const schemaUri = "https://test-suite.json-schema.org/main";

  try {
    const safeSchema = sanitizeTopLevelId(rawSchema, dialectUri);
    registerSchema(safeSchema, schemaUri, dialectUri);

    const schema = await getSchema(schemaUri);
    const ast = { metaData: {} };
    await compile(schema, ast);
    return ast;
  } finally {
    unregisterSchema(schemaUri);
  }
};

const sanitizeTopLevelId = (schema, dialectUri) => {
  if (typeof schema !== "object") {
    return schema;
  }

  const idToken = getKeywordName(dialectUri, "https://json-schema.org/keyword/id")
    ?? getKeywordName(dialectUri, "https://json-schema.org/keyword/draft-04/id");
  if (idToken in schema) {
    schema[idToken] = schema[idToken].replace(/^file:/, "x-file:");
  }

  return schema;
};

const compile = async (schema, ast) => {
  if (!(schema.document.baseUri in ast.metaData)) {
    ast.metaData[schema.document.baseUri] = {
      anchors: schema.document.anchors,
      dynamicAnchors: schema.document.dynamicAnchors
    };
  }

  const url = canonicalUri(schema);
  if (!(url in ast)) {
    const schemaValue = Schema.value(schema);
    if (!["object", "boolean"].includes(typeof schemaValue)) {
      throw Error(`No schema found at '${url}'`);
    }

    if (typeof schemaValue === "boolean") {
      ast[url] = schemaValue;
    } else {
      ast[url] = [];
      for await (const [keyword, keywordSchema] of Schema.entries(schema)) {
        const keywordUri = getKeywordId(keyword, schema.document.dialectId);
        if (!keywordUri || keywordUri === "https://json-schema.org/keyword/comment") {
          continue;
        }

        ast[url].push({
          keyword: keywordUri,
          location: JsonPointer.append(keyword, canonicalUri(schema)),
          value: await getKeywordHandler(keywordUri)(keywordSchema, ast, schema)
        });
      }
    }
  }

  return url;
};

const canonicalUri = (schema) => `${schema.document.baseUri}#${encodeURI(schema.cursor)}`;

const getKeywordHandler = (keywordUri) => {
  if (keywordUri in keywordHandlers) {
    return keywordHandlers[keywordUri];
  } else if (keywordUri.startsWith("https://json-schema.org/keyword/unknown#")) {
    return keywordHandlers["https://json-schema.org/keyword/unknown"];
  } else {
    throw Error(`Missing handler for keyword: ${keywordUri}`);
  }
};

const simpleValue = (keyword) => Schema.value(keyword);

const simpleApplicator = (keyword, ast) => compile(keyword, ast);

const objectApplicator = (keyword, ast) => {
  return Pact.pipe(
    Schema.entries(keyword),
    Pact.asyncMap(async ([propertyName, subSchema]) => [propertyName, await compile(subSchema, ast)]),
    Pact.asyncCollectObject
  );
};

const arrayApplicator = (keyword, ast) => {
  return Pact.pipe(
    Schema.iter(keyword),
    Pact.asyncMap(async (subSchema) => await compile(subSchema, ast)),
    Pact.asyncCollectArray
  );
};

const keywordHandlers = {
  "https://json-schema.org/keyword/additionalProperties": simpleApplicator,
  "https://json-schema.org/keyword/allOf": arrayApplicator,
  "https://json-schema.org/keyword/anyOf": arrayApplicator,
  "https://json-schema.org/keyword/const": simpleValue,
  "https://json-schema.org/keyword/contains": simpleApplicator,
  "https://json-schema.org/keyword/contentEncoding": simpleValue,
  "https://json-schema.org/keyword/contentMediaType": simpleValue,
  "https://json-schema.org/keyword/contentSchema": simpleApplicator,
  "https://json-schema.org/keyword/default": simpleValue,
  "https://json-schema.org/keyword/definitions": objectApplicator,
  "https://json-schema.org/keyword/dependentRequired": simpleValue,
  "https://json-schema.org/keyword/dependentSchemas": objectApplicator,
  "https://json-schema.org/keyword/deprecated": simpleValue,
  "https://json-schema.org/keyword/description": simpleValue,
  "https://json-schema.org/keyword/dynamicRef": simpleValue,
  "https://json-schema.org/keyword/else": simpleApplicator,
  "https://json-schema.org/keyword/enum": simpleValue,
  "https://json-schema.org/keyword/examples": simpleValue,
  "https://json-schema.org/keyword/exclusiveMaximum": simpleValue,
  "https://json-schema.org/keyword/exclusiveMinimum": simpleValue,
  "https://json-schema.org/keyword/format": simpleValue,
  "https://json-schema.org/keyword/if": simpleApplicator,
  "https://json-schema.org/keyword/items": simpleApplicator,
  "https://json-schema.org/keyword/maxContains": simpleValue,
  "https://json-schema.org/keyword/maxItems": simpleValue,
  "https://json-schema.org/keyword/maxLength": simpleValue,
  "https://json-schema.org/keyword/maxProperties": simpleValue,
  "https://json-schema.org/keyword/maximum": simpleValue,
  "https://json-schema.org/keyword/minContains": simpleValue,
  "https://json-schema.org/keyword/minItems": simpleValue,
  "https://json-schema.org/keyword/minLength": simpleValue,
  "https://json-schema.org/keyword/minProperties": simpleValue,
  "https://json-schema.org/keyword/minimum": simpleValue,
  "https://json-schema.org/keyword/multipleOf": simpleValue,
  "https://json-schema.org/keyword/not": simpleApplicator,
  "https://json-schema.org/keyword/oneOf": arrayApplicator,
  "https://json-schema.org/keyword/pattern": simpleValue,
  "https://json-schema.org/keyword/patternProperties": objectApplicator,
  "https://json-schema.org/keyword/prefixItems": arrayApplicator,
  "https://json-schema.org/keyword/properties": objectApplicator,
  "https://json-schema.org/keyword/propertyDependencies": (keyword, ast) => {
    return Pact.pipe(
      Schema.entries(keyword),
      Pact.asyncMap(async ([propertyName, valueSchemaMap]) => {
        return [
          propertyName,
          await Pact.pipe(
            Schema.entries(valueSchemaMap),
            Pact.asyncMap(async ([propertyValue, schema]) => [propertyValue, await compile(schema, ast)]),
            Pact.asyncCollectObject
          )
        ];
      }),
      Pact.asyncCollectObject
    );
  },
  "https://json-schema.org/keyword/propertyNames": simpleApplicator,
  "https://json-schema.org/keyword/readOnly": simpleValue,
  "https://json-schema.org/keyword/ref": compile,
  "https://json-schema.org/keyword/required": simpleValue,
  "https://json-schema.org/keyword/title": simpleValue,
  "https://json-schema.org/keyword/then": simpleApplicator,
  "https://json-schema.org/keyword/type": simpleValue,
  "https://json-schema.org/keyword/unevaluatedItems": simpleApplicator,
  "https://json-schema.org/keyword/unevaluatedProperties": simpleApplicator,
  "https://json-schema.org/keyword/uniqueItems": simpleValue,
  "https://json-schema.org/keyword/unknown": simpleValue,
  "https://json-schema.org/keyword/writeOnly": simpleValue,

  "https://json-schema.org/keyword/draft-2020-12/dynamicRef": simpleValue,
  "https://json-schema.org/keyword/draft-2020-12/format": simpleValue,
  "https://json-schema.org/keyword/draft-2020-12/format-assertion": simpleValue,

  "https://json-schema.org/keyword/draft-2019-09/formatAssertion": simpleValue,
  "https://json-schema.org/keyword/draft-2019-09/format": simpleValue,

  "https://json-schema.org/keyword/draft-07/format": simpleValue,

  "https://json-schema.org/keyword/draft-06/contains": simpleApplicator,
  "https://json-schema.org/keyword/draft-06/format": simpleValue,

  "https://json-schema.org/keyword/draft-04/additionalItems": simpleApplicator,
  "https://json-schema.org/keyword/draft-04/dependencies": (keyword, ast) => {
    return Pact.pipe(
      Schema.entries(keyword),
      Pact.asyncMap(async ([propertyName, schema]) => {
        return [
          propertyName,
          Schema.typeOf(schema) === "array" ? Schema.value(schema) : await compile(schema, ast)
        ];
      }),
      Pact.asyncCollectObject
    );
  },
  "https://json-schema.org/keyword/draft-04/exclusiveMaximum": simpleValue,
  "https://json-schema.org/keyword/draft-04/exclusiveMinimum": simpleValue,
  "https://json-schema.org/keyword/draft-04/format": simpleValue,
  "https://json-schema.org/keyword/draft-04/items": (keyword, ast) => {
    return Schema.typeOf(keyword) === "array"
      ? arrayApplicator(keyword, ast)
      : simpleApplicator(keyword, ast);
  },
  "https://json-schema.org/keyword/draft-04/maximum": simpleValue,
  "https://json-schema.org/keyword/draft-04/minimum": simpleValue
};
