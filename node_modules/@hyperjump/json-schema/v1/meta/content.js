export default {
  "$schema": "https://json-schema.org/v1",
  "title": "Content vocabulary meta-schema",

  "properties": {
    "contentMediaType": { "type": "string" },
    "contentEncoding": { "type": "string" },
    "contentSchema": { "$dynamicRef": "meta" }
  }
};
