/**
 * @module
 */

// JSON Schema Validation - Dates, Times, and Duration
export { isDate, isTime, isDateTime, isDuration } from "./rfc3339.js";

// JSON Schema Validation - Email Addresses
export { isEmail } from "./rfc5321.js";
export { isIdnEmail } from "./rfc6531.js";

// JSON Schema Validation - Hostnames
export { isHostname } from "./rfc1123.js";
export { isAsciiIdn, isIdn } from "./uts46.js";

// JSON Schema Validation - IP Addresses
export { isIPv4 } from "./rfc2673.js";
export { isIPv6 } from "./rfc4291.js";

// JSON Schema Validation - Resource Identifiers
export { isUri, isUriReference } from "./rfc3986.js";
export { isIri, isIriReference } from "./rfc3987.js";
export { isUuid } from "./rfc4122.js";

// JSON Schema Validation - URI Template
export { isUriTemplate } from "./rfc6570.js";

// JSON Schema Validation - JSON Pointers
export { isJsonPointer } from "./rfc6901.js";
export { isRelativeJsonPointer } from "./draft-bhutton-relative-json-pointer-00.js";

// JSON Schema Validation - Regular Expressions
export { isRegex } from "./ecma262.js";
