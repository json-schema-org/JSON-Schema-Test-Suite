import { isIriReference } from "@hyperjump/json-schema-formats";


export default {
  id: "https://json-schema.org/format/iri-reference",
  handler: (uri) => typeof uri !== "string" || isIriReference(uri)
};
