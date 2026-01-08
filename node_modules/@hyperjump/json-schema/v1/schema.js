export default {
  "$schema": "https://json-schema.org/v1",
  "$vocabulary": {
    "https://json-schema.org/v1/vocab/core": true,
    "https://json-schema.org/v1/vocab/applicator": true,
    "https://json-schema.org/v1/vocab/unevaluated": true,
    "https://json-schema.org/v1/vocab/validation": true,
    "https://json-schema.org/v1/vocab/meta-data": true,
    "https://json-schema.org/v1/vocab/format": true,
    "https://json-schema.org/v1/vocab/content": true
  },
  "title": "Core and Validation specifications meta-schema",

  "$dynamicAnchor": "meta",

  "allOf": [
    { "$ref": "/v1/meta/core" },
    { "$ref": "/v1/meta/applicator" },
    { "$ref": "/v1/meta/validation" },
    { "$ref": "/v1/meta/meta-data" },
    { "$ref": "/v1/meta/format" },
    { "$ref": "/v1/meta/content" }
  ]
};
