import * as Browser from "@hyperjump/browser";
import * as Instance from "../lib/instance.js";
import { getFormatHandler } from "../lib/keywords.js";


const id = "https://json-schema.org/keyword/draft-2020-12/format-assertion";

const compile = (schema) => Browser.value(schema);

const interpret = (format, instance) => {
  const handler = getFormatHandler(formats[format]);
  if (!handler) {
    throw Error(`The '${format}' format is not supported.`);
  }

  return handler(Instance.value(instance));
};

const annotation = (format) => format;

const formats = {
  "date-time": "https://json-schema.org/format/date-time",
  "date": "https://json-schema.org/format/date",
  "time": "https://json-schema.org/format/time",
  "duration": "https://json-schema.org/format/duration",
  "email": "https://json-schema.org/format/email",
  "idn-email": "https://json-schema.org/format/idn-email",
  "hostname": "https://json-schema.org/format/hostname",
  "idn-hostname": "https://json-schema.org/format/idn-hostname",
  "ipv4": "https://json-schema.org/format/ipv4",
  "ipv6": "https://json-schema.org/format/ipv6",
  "uri": "https://json-schema.org/format/uri",
  "uri-reference": "https://json-schema.org/format/uri-reference",
  "iri": "https://json-schema.org/format/iri",
  "iri-reference": "https://json-schema.org/format/iri-reference",
  "uuid": "https://json-schema.org/format/uuid",
  "uri-template": "https://json-schema.org/format/uri-template",
  "json-pointer": "https://json-schema.org/format/json-pointer",
  "relative-json-pointer": "https://json-schema.org/format/relative-json-pointer",
  "regex": "https://json-schema.org/format/regex"
};

export default { id, compile, interpret, annotation, formats };
