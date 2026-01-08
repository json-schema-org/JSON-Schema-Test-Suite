/**
 * @import * as API from "./index.d.ts"
 */

const alpha = `[a-zA-Z]`;
const hexdig = `[\\da-fA-F]`;
const pctEncoded = `%${hexdig}${hexdig}`;

const ucschar = `[\\u{A0}-\\u{D7FF}\\u{F900}-\\u{FDCF}\\u{FDF0}-\\u{FFEF}\\u{10000}-\\u{1FFFD}\\u{20000}-\\u{2FFFD}\\u{30000}-\\u{3FFFD}\\u{40000}-\\u{4FFFD}\\u{50000}-\\u{5FFFD}\\u{60000}-\\u{6FFFD}\\u{70000}-\\u{7FFFD}\\u{80000}-\\u{8FFFD}\\u{90000}-\\u{9FFFD}\\u{A0000}-\\u{AFFFD}\\u{B0000}-\\u{BFFFD}\\u{C0000}-\\u{CFFFD}\\u{D0000}-\\u{DFFFD}\\u{E1000}-\\u{EFFFD}]`;

const iprivate = `[\\u{E000}-\\u{F8FF}\\u{F0000}-\\u{FFFFD}\\u{100000}-\\u{10FFFD}]`;

const opLevel2 = `[+#]`;
const opLevel3 = `[./;?&]`;
const opReserve = `[=,!@|]`;
const operator = `(?:${opLevel2}|${opLevel3}${opReserve})`;

const varchar = `(?:${alpha}|\\d|_|${pctEncoded})`;
const varname = `${varchar}(?:\\.?${varchar})*`;
const maxLength = `(?:[1-9]|\\d{0,3})`; // positive integer < 10000
const prefix = `:${maxLength}`;
const explode = `\\*`;
const modifierLevel4 = `(?:${prefix}|${explode})`;
const varspec = `${varname}${modifierLevel4}?`;
const variableList = `${varspec}(?:,${varspec})*`;

const expression = `\\{${operator}?${variableList}\\}`;

// any Unicode character except: CTL, SP, DQUOTE, "%" (aside from pct-encoded), "<", ">", "\", "^", "`", "{", "|", "}"
const literals = `(?:[\\x21\\x23-\\x24\\x26-\\x3B\\x3D\\x3F-\\x5B\\x5D\\x5F\\x61-\\x7A\\x7E]|${ucschar}|${iprivate}|${pctEncoded})`;

const uriTemplate = `(?:${literals}|${expression})*`;

/**
 * @type API.isUriTemplate
 * @function
 */
export const isUriTemplate = RegExp.prototype.test.bind(new RegExp(`^${uriTemplate}$`, "u"));
