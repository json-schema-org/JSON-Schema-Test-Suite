import { isTime } from "@hyperjump/json-schema-formats";


export default {
  id: "https://json-schema.org/format/time",
  handler: (time) => typeof time !== "string" || isTime(time)
};
