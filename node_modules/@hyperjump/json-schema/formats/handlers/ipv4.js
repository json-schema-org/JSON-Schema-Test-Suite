import { isIPv4 } from "@hyperjump/json-schema-formats";


export default {
  id: "https://json-schema.org/format/ipv4",
  handler: (ip) => typeof ip !== "string" || isIPv4(ip)
};
