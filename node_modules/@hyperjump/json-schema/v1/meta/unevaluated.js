export default {
  "$schema": "https://json-schema.org/v1",
  "title": "Unevaluated applicator vocabulary meta-schema",

  "properties": {
    "unevaluatedItems": { "$dynamicRef": "meta" },
    "unevaluatedProperties": { "$dynamicRef": "meta" }
  }
};
