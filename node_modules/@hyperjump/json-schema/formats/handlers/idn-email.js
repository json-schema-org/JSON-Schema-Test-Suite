import { isIdnEmail } from "@hyperjump/json-schema-formats";


export default {
  id: "https://json-schema.org/format/idn-email",
  handler: (email) => typeof email !== "string" || isIdnEmail(email)
};
