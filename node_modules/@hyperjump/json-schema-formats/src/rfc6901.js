/**
 * @import * as API from "./index.d.ts"
 */

const unescaped = `[\\u{00}-\\u{2E}\\u{30}-\\u{7D}\\u{7F}-\\u{10FFFF}]`; // %x2F ('/') and %x7E ('~') are excluded from 'unescaped'
const escaped = `~[01]`; // representing '~' and '/', respectively
const referenceToken = `(?:${unescaped}|${escaped})*`;
const jsonPointer = `(?:/${referenceToken})*`;

/**
 * @type API.isJsonPointer
 * @function
 */
export const isJsonPointer = RegExp.prototype.test.bind(new RegExp(`^${jsonPointer}$`, "u"));
