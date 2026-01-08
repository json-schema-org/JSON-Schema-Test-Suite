export default {
  "$schema": "https://json-schema.org/v1",
  "title": "Core vocabulary meta-schema",

  "type": ["object", "boolean"],
  "properties": {
    "$id": {
      "type": "string",
      "format": "uri-reference",
      "$comment": "Non-empty fragments not allowed.",
      "pattern": "^[^#]*#?$"
    },
    "$schema": {
      "type": "string",
      "format": "uri"
    },
    "$anchor": { "$ref": "#/$defs/anchor" },
    "$ref": {
      "type": "string",
      "format": "uri-reference"
    },
    "$dynamicRef": {
      "type": "string",
      "pattern": "^#?[A-Za-z_][-A-Za-z0-9._]*$"
    },
    "$dynamicAnchor": { "$ref": "#/$defs/anchor" },
    "$vocabulary": {
      "type": "object",
      "propertyNames": {
        "type": "string",
        "format": "uri"
      },
      "additionalProperties": {
        "type": "boolean"
      }
    },
    "$comment": { "type": "string" },
    "$defs": {
      "type": "object",
      "additionalProperties": { "$dynamicRef": "meta" }
    }
  },

  "$defs": {
    "anchor": {
      "type": "string",
      "pattern": "^[A-Za-z_][-A-Za-z0-9._]*$"
    }
  }
};
