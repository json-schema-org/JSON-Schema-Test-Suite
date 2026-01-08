import { isDuration } from "@hyperjump/json-schema-formats";


export default {
  id: "https://json-schema.org/format/duration",
  handler: (duration) => typeof duration !== "string" || isDuration(duration)
};
