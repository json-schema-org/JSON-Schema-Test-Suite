export default {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$dynamicAnchor": "meta",

  "title": "OAS Base Vocabulary",
  "description": "A JSON Schema Vocabulary used in the OpenAPI JSON Schema Dialect",

  "type": ["object", "boolean"],
  "properties": {
    "discriminator": { "$ref": "#/$defs/discriminator" },
    "example": { "deprecated": true },
    "externalDocs": { "$ref": "#/$defs/external-docs" },
    "xml": { "$ref": "#/$defs/xml" }
  },

  "$defs": {
    "extensible": {
      "patternProperties": {
        "^x-": true
      }
    },

    "discriminator": {
      "$ref": "#/$defs/extensible",
      "type": "object",
      "properties": {
        "propertyName": {
          "type": "string"
        },
        "mapping": {
          "type": "object",
          "additionalProperties": {
            "type": "string"
          }
        },
        "defaultMapping": {
          "type": "string"
        }
      },
      "required": ["propertyName"],
      "unevaluatedProperties": false
    },
    "external-docs": {
      "$ref": "#/$defs/extensible",
      "type": "object",
      "properties": {
        "url": {
          "type": "string",
          "format": "uri-reference"
        },
        "description": {
          "type": "string"
        }
      },
      "required": ["url"],
      "unevaluatedProperties": false
    },
    "xml": {
      "$ref": "#/$defs/extensible",
      "type": "object",
      "properties": {
        "nodeType": {
          "type": "string",
          "enum": [
            "element",
            "attribute",
            "text",
            "cdata",
            "none"
          ]
        },
        "name": {
          "type": "string"
        },
        "namespace": {
          "type": "string",
          "format": "iri"
        },
        "prefix": {
          "type": "string"
        },
        "attribute": {
          "type": "boolean",
          "deprecated": true
        },
        "wrapped": {
          "type": "boolean",
          "deprecated": true
        }
      },
      "dependentSchemas": {
        "nodeType": {
          "properties": {
            "attribute": false,
            "wrapped": false
          }
        }
      },
      "unevaluatedProperties": false
    }
  }
};
