import punycode = require('punycode/');

/**
 * Validate a hostname. Returns true or throws a detailed error.
 *
 * @throws {SyntaxError}
 */
declare function isIdnHostname(hostname: string): true;

/**
 * Returns the ACE hostname or throws a detailed error (it also validates the input)
 *
 * @throws {SyntaxError}
 */
declare function idnHostname(hostname: string): string;

/**
 * Returns the uts46 mapped label (not hostname) or throws an error if the label
 * has dissallowed or unassigned chars.
 *
 * @throws {SyntaxError}
 */
declare function uts46map(label: string): string;

declare const IdnHostname: {
  isIdnHostname: typeof isIdnHostname;
  idnHostname: typeof idnHostname;
  uts46map: typeof uts46map;
  punycode: typeof punycode;
};

export = IdnHostname;
