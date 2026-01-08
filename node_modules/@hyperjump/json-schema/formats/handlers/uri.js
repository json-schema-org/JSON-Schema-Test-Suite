import { isUri } from "@hyperjump/json-schema-formats";


export default {
  id: "https://json-schema.org/format/uri",
  handler: (uri) => typeof uri !== "string" || isUri(uri)
};
