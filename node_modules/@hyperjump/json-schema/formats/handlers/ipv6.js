import { isIPv6 } from "@hyperjump/json-schema-formats";


export default {
  id: "https://json-schema.org/format/ipv6",
  handler: (ip) => typeof ip !== "string" || isIPv6(ip)
};
