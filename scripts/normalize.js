import * as Schema from "@hyperjump/browser";
import * as Pact from "@hyperjump/pact";
import * as JsonPointer from "@hyperjump/json-pointer";
import { toAbsoluteIri } from "@hyperjump/uri";
import { registerSchema, unregisterSchema } from "@hyperjump/json-schema/draft-2020-12";
import { getSchema, getKeywordId } from "@hyperjump/json-schema/experimental";
import "@hyperjump/json-schema/draft-2019-09";
import "@hyperjump/json-schema/draft-07";
import "@hyperjump/json-schema/draft-06";
import "@hyperjump/json-schema/draft-04";


// ===========================================
//  CHANGE #2 (ADDED): sanitize file:// $id
// ===========================================
const sanitizeTopLevelId = (schema) => {
  if (typeof schema !== "object" || schema === null) return schema;
  const copy = { ...schema };
  if (typeof copy.$id === "string" && copy.$id.startsWith("file:")) {
    delete copy.$id;
  }
  return copy;
};
// ===========================================


export const normalize = async (rawSchema, dialectUri) => {
  const schemaUri = "https://test-suite.json-schema.org/main";

  // ===========================================
  //  CHANGE #2 (APPLIED HERE)
  // ===========================================
  const safeSchema = sanitizeTopLevelId(rawSchema);
  // ===========================================

  try {
    // BEFORE: registerSchema(rawSchema, schemaUri, dialectUri)
    registerSchema(safeSchema, schemaUri, dialectUri);

    const schema = await getSchema(schemaUri);
    const ast = { metaData: {} };
    await compile(schema, ast);
    return ast;
  } finally {
    unregisterSchema(schemaUri);
  }
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
  "https://json-schema.org/keyword/dynamicRef": simpleValue, // base dynamicRef

  // ===========================================
  // CHANGE #1 (ADDED): draft-2020-12/dynamicRef
  // ===========================================
  "https://json-schema.org/keyword/draft-2020-12/dynamicRef": simpleValue,
  // ===========================================

  "https://json-schema.org/keyword/else": simpleApplicator,
  "https://json-schema.org/keyword/enum": simpleValue,
  "https://json-schema.org/keyword/examples": simpleValue,
  "https://json-schema.org/keyword/exclusiveMaximum": simpleValue,
  "https://json-schema.org/keyword/exclusiveMinimum": simpleValue,
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
