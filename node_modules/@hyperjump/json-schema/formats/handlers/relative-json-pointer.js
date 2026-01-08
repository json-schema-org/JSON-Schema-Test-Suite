import { isRelativeJsonPointer } from "@hyperjump/json-schema-formats";


export default {
  id: "https://json-schema.org/format/relative-json-pointer",
  handler: (pointer) => typeof pointer !== "string" || isRelativeJsonPointer(pointer)
};
