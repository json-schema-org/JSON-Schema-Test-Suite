import { isJsonPointer } from "@hyperjump/json-schema-formats";


export default {
  id: "https://json-schema.org/format/json-pointer",
  handler: (pointer) => typeof pointer !== "string" || isJsonPointer(pointer)
};
