import { addFormat } from "../lib/keywords.js";

import draft04Hostname from "./handlers/draft-04/hostname.js";
import dateTime from "./handlers/date-time.js";
import date from "./handlers/date.js";
import time from "./handlers/time.js";
import duration from "./handlers/duration.js";
import email from "./handlers/email.js";
import ipv4 from "./handlers/ipv4.js";
import ipv6 from "./handlers/ipv6.js";
import uri from "./handlers/uri.js";
import uriReference from "./handlers/uri-reference.js";
import iri from "./handlers/iri.js";
import iriReference from "./handlers/iri-reference.js";
import uuid from "./handlers/uuid.js";
import uriTemplate from "./handlers/uri-template.js";
import jsonPointer from "./handlers/json-pointer.js";
import relativeJsonPointer from "./handlers/relative-json-pointer.js";
import regex from "./handlers/regex.js";


addFormat(draft04Hostname);
addFormat(dateTime);
addFormat(date);
addFormat(time);
addFormat(duration);
addFormat(email);
addFormat(ipv4);
addFormat(ipv6);
addFormat(uri);
addFormat(uriReference);
addFormat(iri);
addFormat(iriReference);
addFormat(uuid);
addFormat(uriTemplate);
addFormat(jsonPointer);
addFormat(relativeJsonPointer);
addFormat(regex);
