export default {
  "$schema": "https://json-schema.org/v1",
  "title": "Meta-data vocabulary meta-schema",

  "properties": {
    "title": { "type": "string" },
    "description": { "type": "string" },
    "default": true,
    "deprecated": { "type": "boolean" },
    "readOnly": { "type": "boolean" },
    "writeOnly": { "type": "boolean" },
    "examples": { "type": "array" }
  }
};
