import { isDate } from "@hyperjump/json-schema-formats";


export default {
  id: "https://json-schema.org/format/date",
  handler: (date) => typeof date !== "string" || isDate(date)
};
