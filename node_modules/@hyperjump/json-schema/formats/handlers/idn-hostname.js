import { isIdn } from "@hyperjump/json-schema-formats";


export default {
  id: "https://json-schema.org/format/idn-hostname",
  handler: (hostname) => typeof hostname !== "string" || isIdn(hostname)
};
