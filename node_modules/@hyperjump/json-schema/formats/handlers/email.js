import { isEmail } from "@hyperjump/json-schema-formats";


export default {
  id: "https://json-schema.org/format/email",
  handler: (email) => typeof email !== "string" || isEmail(email)
};
