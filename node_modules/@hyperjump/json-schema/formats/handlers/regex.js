import { isRegex } from "@hyperjump/json-schema-formats";


export default {
  id: "https://json-schema.org/format/regex",
  handler: (regex) => typeof regex !== "string" || isRegex(regex)
};
