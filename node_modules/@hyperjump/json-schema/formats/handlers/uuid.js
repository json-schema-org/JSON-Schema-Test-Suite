import { isUuid } from "@hyperjump/json-schema-formats";


export default {
  id: "https://json-schema.org/format/uuid",
  handler: (uuid) => typeof uuid !== "string" || isUuid(uuid)
};
