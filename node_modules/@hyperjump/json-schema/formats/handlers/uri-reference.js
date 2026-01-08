import { isUriReference } from "@hyperjump/json-schema-formats";


export default {
  id: "https://json-schema.org/format/uri-reference",
  handler: (uri) => typeof uri !== "string" || isUriReference(uri)
};
