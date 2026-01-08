import * as Browser from "@hyperjump/browser";
import * as Instance from "../lib/instance.js";
import { getShouldValidateFormat } from "../lib/configuration.js";
import { getFormatHandler } from "../lib/keywords.js";


const id = "https://json-schema.org/keyword/draft-06/format";

const compile = (schema) => Browser.value(schema);

const interpret = (format, instance) => {
  if (getShouldValidateFormat() === false) {
    return true;
  }

  const handler = getFormatHandler(formats[format]);
  return handler?.(Instance.value(instance)) ?? true;
};

const annotation = (format) => format;

const formats = {
  "date-time": "https://json-schema.org/format/date-time",
  "email": "https://json-schema.org/format/email",
  "hostname": "https://json-schema.org/format/draft-04/hostname",
  "ipv4": "https://json-schema.org/format/ipv4",
  "ipv6": "https://json-schema.org/format/ipv6",
  "uri": "https://json-schema.org/format/uri",
  "uri-reference": "https://json-schema.org/format/uri-reference",
  "uri-template": "https://json-schema.org/format/uri-template",
  "json-pointer": "https://json-schema.org/format/json-pointer"
};

export default { id, compile, interpret, annotation, formats };
