/**
 * @import * as API from "./index.d.ts"
 */

const alpha = `[a-zA-Z]`;
const hexdig = `[\\da-fA-F]`;

// Printable US-ASCII characters not including specials.
const atext = `[\\w!#$%&'*+\\-/=?^\`{|}~]`;
const atom = `${atext}+`;
const dotString = `${atom}(?:\\.${atom})*`;

// Any ASCII graphic or space without blackslash-quoting except double-quote and the backslash itself.
const qtextSMTP = `[\\x20-\\x21\\x23-\\x5B\\x5D-\\x7E]`;
// backslash followed by any ASCII graphic or space
const quotedPairSMTP = `\\\\[\\x20-\\x7E]`;
const qcontentSMTP = `(?:${qtextSMTP}|${quotedPairSMTP})`;
const quotedString = `"${qcontentSMTP}*"`;

const localPart = `(?:${dotString}|${quotedString})`; // MAY be case-sensitive

const letDig = `(?:${alpha}|\\d)`;
const ldhStr = `(?:${letDig}|-)*${letDig}`;
const subDomain = `${letDig}${ldhStr}?`;
const domain = `${subDomain}(?:\\.${subDomain})*`;

const decOctet = `(?:\\d|[1-9]\\d|1\\d\\d|2[0-4]\\d|25[0-5])`;
const ipv4Address = `${decOctet}\\.${decOctet}\\.${decOctet}\\.${decOctet}`;

const h16 = `${hexdig}{1,4}`;
const ls32 = `(?:${h16}:${h16}|${ipv4Address})`;
const ipv6Address = `(?:(?:${h16}:){6}${ls32}|::(?:${h16}:){5}${ls32}|(?:${h16})?::(?:${h16}:){4}${ls32}|(?:(?:${h16}:){0,1}${h16})?::(?:${h16}:){3}${ls32}|(?:(?:${h16}:){0,2}${h16})?::(?:${h16}:){2}${ls32}|(?:(?:${h16}:){0,3}${h16})?::(?:${h16}:){1}${ls32}|(?:(?:${h16}:){0,4}${h16})?::${ls32}|(?:(?:${h16}:){0,5}${h16})?::${h16}|(?:(?:${h16}:){0,6}${h16})?::)`;
const ipv6AddressLiteral = `IPv6:${ipv6Address}`;

const dcontent = `[\\x21-\\x5A\\x5E-\\x7E]`; // Printable US-ASCII excluding "[", "\", "]"
const generalAddressLiteral = `${ldhStr}:${dcontent}+`;

const addressLiteral = `\\[(?:${ipv4Address}|${ipv6AddressLiteral}|${generalAddressLiteral})]`;

const mailbox = `${localPart}@(?:${domain}|${addressLiteral})`;

/**
 * @type API.isEmail
 * @function
 */
export const isEmail = RegExp.prototype.test.bind(new RegExp(`^${mailbox}$`));
