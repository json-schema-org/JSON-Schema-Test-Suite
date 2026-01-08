import { isAsciiIdn } from "@hyperjump/json-schema-formats";


export default {
  id: "https://json-schema.org/format/draft-04/hostname",
  handler: (hostname) => typeof hostname !== "string" || isAsciiIdn(hostname)
};
