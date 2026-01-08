import { isIdn } from "./uts46.js";

/**
 * @import * as API from "./index.d.ts"
 */

const ucschar = `[\\u{A0}-\\u{D7FF}\\u{F900}-\\u{FDCF}\\u{FDF0}-\\u{FFEF}\\u{10000}-\\u{1FFFD}\\u{20000}-\\u{2FFFD}\\u{30000}-\\u{3FFFD}\\u{40000}-\\u{4FFFD}\\u{50000}-\\u{5FFFD}\\u{60000}-\\u{6FFFD}\\u{70000}-\\u{7FFFD}\\u{80000}-\\u{8FFFD}\\u{90000}-\\u{9FFFD}\\u{A0000}-\\u{AFFFD}\\u{B0000}-\\u{BFFFD}\\u{C0000}-\\u{CFFFD}\\u{D0000}-\\u{DFFFD}\\u{E1000}-\\u{EFFFD}]`;

const alpha = `[a-zA-Z]`;
const hexdig = `[\\da-fA-F]`;

// Printable US-ASCII characters not including specials.
const atext = `(?:[\\w!#$%&'*+\\-/=?^\`{|}~]|${ucschar})`;
const atom = `${atext}+`;
const dotString = `${atom}(?:\\.${atom})*`;

// Any ASCII graphic or space without blackslash-quoting except double-quote and the backslash itself.
const qtextSMTP = `(?:[\\x20-\\x21\\x23-\\x5B\\x5D-\\x7E]|${ucschar})`;
// backslash followed by any ASCII graphic or space
const quotedPairSMTP = `\\\\[\\x20-\\x7E]`;
const qcontentSMTP = `(?:${qtextSMTP}|${quotedPairSMTP})`;
const quotedString = `"${qcontentSMTP}*"`;

const localPart = `(?:${dotString}|${quotedString})`; // MAY be case-sensitive

const letDig = `(?:${alpha}|\\d)`;
const ldhStr = `(?:${letDig}|-)*${letDig}`;
const letDigUcs = `(?:${alpha}|\\d|${ucschar})`;
const ldhStrUcs = `(?:${letDigUcs}|-)*${letDigUcs}`;
const subDomain = `${letDigUcs}${ldhStrUcs}?`;
const domain = `${subDomain}(?:\\.${subDomain})*`;

const decOctet = `(?:\\d|[1-9]\\d|1\\d\\d|2[0-4]\\d|25[0-5])`;
const ipv4Address = `${decOctet}\\.${decOctet}\\.${decOctet}\\.${decOctet}`;

const h16 = `${hexdig}{1,4}`;
const ls32 = `(?:${h16}:${h16}|${ipv4Address})`;
const ipv6Address = `(?:(?:${h16}:){6}${ls32}|::(?:${h16}:){5}${ls32}|(?:${h16})?::(?:${h16}:){4}${ls32}|(?:(?:${h16}:){0,1}${h16})?::(?:${h16}:){3}${ls32}|(?:(?:${h16}:){0,2}${h16})?::(?:${h16}:){2}${ls32}|(?:(?:${h16}:){0,3}${h16})?::(?:${h16}:){1}${ls32}|(?:(?:${h16}:){0,4}${h16})?::${ls32}|(?:(?:${h16}:){0,5}${h16})?::${h16}|(?:(?:${h16}:){0,6}${h16})?::)`;
const ipv6AddressLiteral = `IPv6:${ipv6Address}`;

const dcontent = `[\\x21-\\x5A\\x5E-\\x7E]`; // Printable US-ASCII excluding "[", "\", "]"
const generalAddressLiteral = `${ldhStr}:${dcontent}+`;

const addressLiteral = `\\[(?:${ipv4Address}|${ipv6AddressLiteral}|${generalAddressLiteral})\\]`;

const mailbox = `(?<localPart>${localPart})@(?:(?<ip>${addressLiteral})|(?<domain>${domain}))`;

const mailboxPattern = new RegExp(`^${mailbox}$`, "u");

/** @type API.isIdnEmail */
export const isIdnEmail = (email) => {
  const parsedEmail = mailboxPattern.exec(email)?.groups;

  return !!parsedEmail && (!parsedEmail.domain || isIdn(parsedEmail.domain));
};
