import { isIri } from "@hyperjump/json-schema-formats";


export default {
  id: "https://json-schema.org/format/iri",
  handler: (uri) => typeof uri !== "string" || isIri(uri)
};
