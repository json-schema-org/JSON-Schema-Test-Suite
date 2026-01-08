'use strict';
// IDNA2008 validator using idnaMappingTableCompact.json
const punycode = require('punycode/');
const { props, viramas, ranges, mappings, bidi_ranges, joining_type_ranges } = require('./idnaMappingTableCompact.json');
// --- Error classes (short messages; RFC refs included in message) ---
const throwIdnaContextJError = (msg) => { throw Object.assign(new SyntaxError(msg), { name: "IdnaContextJError" }); };
const throwIdnaContextOError = (msg) => { throw Object.assign(new SyntaxError(msg), { name: "IdnaContextOError" }); };
const throwIdnaUnicodeError = (msg) => { throw Object.assign(new SyntaxError(msg), { name: "IdnaUnicodeError" }); };
const throwIdnaLengthError = (msg) => { throw Object.assign(new SyntaxError(msg), { name: "IdnaLengthError" }); };
const throwIdnaSyntaxError = (msg) => { throw Object.assign(new SyntaxError(msg), { name: "IdnaSyntaxError" }); };
const throwPunycodeError = (msg) => { throw Object.assign(new SyntaxError(msg), { name: "PunycodeError" }); };
const throwIdnaBidiError = (msg) => { throw Object.assign(new SyntaxError(msg), { name: "IdnaBidiError" }); };
// --- constants ---
const ZWNJ = 0x200c;
const ZWJ = 0x200d;
const MIDDLE_DOT = 0x00b7;
const GREEK_KERAIA = 0x0375;
const KATAKANA_MIDDLE_DOT = 0x30fb;
const HEBREW_GERESH = 0x05f3;
const HEBREW_GERSHAYIM = 0x05f4;
// Viramas (used for special ZWJ/ZWNJ acceptance)
const VIRAMAS = new Set(viramas);
// binary range lookup
function getRange(range, key) {
    if (!Array.isArray(range) || range.length === 0) return null;
    let lb = 0;
    let ub = range.length - 1;
    while (lb <= ub) {
        const mid = (lb + ub) >> 1;
        const r = range[mid];
        if (key < r[0]) ub = mid - 1;
        else if (key > r[1]) lb = mid + 1;
        else return r[2];
    }
    return null;
}
// mapping label (disallowed chars were removed from ranges, so undefined means disallowed or unassigned)
function uts46map(label) {
    const mappedCps = [];
    for (let i = 0; i < label.length; ) {
        const cp = label.codePointAt(i);
        const prop = props[getRange(ranges, cp)];
        const maps = mappings[String(cp)];
        // mapping cases
        if (prop === 'mapped' && Array.isArray(maps) && maps.length) {
            for (const mcp of maps) mappedCps.push(mcp);
        } else if (prop === 'valid' || prop === 'deviation') {
            mappedCps.push(cp);
        } else if (prop === 'ignored') {
            // drop
        } else {
            throwIdnaUnicodeError(`${cpHex(cp)} is disallowed in hostname (RFC 5892, UTS #46).`);
        }
        i += cp > 0xffff ? 2 : 1;
    }
    // mapped → label
    return String.fromCodePoint(...mappedCps);
}
// --- helpers ---
function cpHex(cp) {
    return `char '${String.fromCodePoint(cp)}' ` + JSON.stringify('(U+' + cp.toString(16).toUpperCase().padStart(4, '0') + ')');
}
// main validator
function isIdnHostname(hostname) {
    // basic hostname checks
    if (typeof hostname !== 'string') throwIdnaSyntaxError('Label must be a string (RFC 5890 §2.3.2.3).');
    // split hostname in labels by the separators defined in uts#46 §2.3
    const rawLabels = hostname.split(/[\x2E\uFF0E\u3002\uFF61]/);
    if (rawLabels.some((label) => label.length === 0)) throwIdnaLengthError('Label cannot be empty (consecutive or leading/trailing dot) (RFC 5890 §2.3.2.3).');
    // checks per label (IDNA is defined for labels, not for parts of them and not for complete domain names. RFC 5890 §2.3.2.1)
    let aceHostnameLength = 0;
    for (const rawLabel of rawLabels) {
        // ACE label (xn--) validation: decode and re-encode must match
        let label = rawLabel;
        if (/^xn--/i.test(rawLabel)) {
            if (/[^\p{ASCII}]/u.test(rawLabel)) throwIdnaSyntaxError(`A-label '${rawLabel}' cannot contain non-ASCII character(s) (RFC 5890 §2.3.2.1).`);
            const aceBody = rawLabel.slice(4);
            try {
                label = punycode.decode(aceBody);
            } catch (e) {
                throwPunycodeError(`Invalid ASCII Compatible Encoding (ACE) of label '${rawLabel}' (RFC 5891 §4.4 → RFC 3492).`);
            }
            if (!/[^\p{ASCII}]/u.test(label)) throwIdnaSyntaxError(`decoded A-label '${rawLabel}' result U-label '${label}' cannot be empty or all-ASCII character(s) (RFC 5890 §2.3.2.1).`);
            if (punycode.encode(label) !== aceBody) throwPunycodeError(`Re-encode mismatch for ASCII Compatible Encoding (ACE) label '${rawLabel}' (RFC 5891 §4.4 → RFC 3492).`);
        }
        // mapping phase (here because decoded A-label may contain disallowed chars)
        label = uts46map(label).normalize('NFC');
        // final ACE label lenght accounting
        let aceLabel;
        try {
            aceLabel = /[^\p{ASCII}]/u.test(label) ? punycode.toASCII(label) : label;
        } catch (e) {
            throwPunycodeError(`ASCII conversion failed for '${label}' (RFC 3492).`);
        }
        if (aceLabel.length > 63) throwIdnaLengthError('Final ASCII Compatible Encoding (ACE) label cannot exceed 63 bytes (RFC 5890 §2.3.2.1).');
        aceHostnameLength += aceLabel.length + 1;
        // hyphen rules (the other one is covered by bidi)
        if (/^-|-$/.test(label)) throwIdnaSyntaxError('Label cannot begin or end with hyphen-minus (RFC 5891 §4.2.3.1).');
        if (label.indexOf('--') === 2) throwIdnaSyntaxError('Label cannot contain consecutive hyphen-minus in the 3rd and 4th positions (RFC 5891 §4.2.3.1).');
        // leading combining marks check (some are not covered by bidi)
        if (/^\p{M}$/u.test(String.fromCodePoint(label.codePointAt(0)))) throwIdnaSyntaxError(`Label cannot begin with combining/enclosing mark ${cpHex(label.codePointAt(0))} (RFC 5891 §4.2.3.2).`);
        // spread cps for context and bidi checks
        const cps = Array.from(label).map((char) => char.codePointAt(0));
        let joinTypes = '';
        let digits = '';
        let bidiClasses = [];
        // per-codepoint contextual checks
        for (let j = 0; j < cps.length; j++) {
            const cp = cps[j];
            // check ContextJ ZWNJ (uses joining types and virama rule)
            if (cps.includes(ZWNJ)) {
                joinTypes += VIRAMAS.has(cp) ? 'V' : cp === ZWNJ ? 'Z' : getRange(joining_type_ranges, cp) || 'U';
                if (j === cps.length - 1 && /(?![LD][T]*)(?<!V)Z(?![T]*[RD])/.test(joinTypes)) throwIdnaContextJError(`char ${JSON.stringify('U+200C')} (ZWNJ) has invalid join context: '${joinTypes}' (RFC 5892 Appendix A.1).`);
            }
            // check ContextJ ZWJ (must be preceded by virama)
            if (cp === ZWJ) {
                if (j === 0 || !VIRAMAS.has(cps[j - 1])) {
                    throwIdnaContextJError(`${cpHex(cp)} cannot appear at start or without a Virama before (RFC 5892 Appendix A.2).`);
                }
            }
            // check ContextO MIDDLE_DOT
            if (cp === MIDDLE_DOT) {
                if (j === 0 || j === cps.length - 1 || !(cps[j - 1] === 0x6c && cps[j + 1] === 0x6c)) throwIdnaContextOError(`${cpHex(cp)} must be between two ASCII 'l' characters (RFC 5892 A.3).`);
            }
            // check ContextO GREEK_KERAIA, must be followed by a Greek character (next non-spacing mark)
            if (cp === GREEK_KERAIA) {
                if (!/^\p{Mn}*\p{sc=Greek}$/u.test(String.fromCodePoint(...cps.slice(j + 1)))) throwIdnaContextOError(`${cpHex(cp)} must be followed by Greek script (RFC 5892 A.4).`);
            }
            //  check ContextO HEBREW_GERESH and HEBREW_GERSHAYIM
            if (cp === HEBREW_GERESH || cp === HEBREW_GERSHAYIM) {
                if (j === 0 || !/^\p{sc=Hebrew}$/u.test(String.fromCodePoint(cps[j - 1]))) throwIdnaContextOError(`${cpHex(cp)} must be preceded by Hebrew script (RFC 5892 A.5/A.6).`);
            }
            // check ContextO KATAKANA_MIDDLE_DOT, allowed only if label contains at least one Hiragana / Katakana / Han character
            if (cp === KATAKANA_MIDDLE_DOT) {
                if (!/[\p{sc=Hiragana}\p{sc=Katakana}\p{sc=Han}]/u.test(String.fromCodePoint(...cps))) {
                    throwIdnaContextOError(`${cpHex(cp)} requires at least one Hiragana/Katakana/Han in the label (RFC 5892 Appendix A.7).`);
                }
            }
            // check mixed digit sets
            if ((cp >= 0x0660 && cp <= 0x0669) || (cp >= 0x06f0 && cp <= 0x06f9)) digits += (cp < 0x06f0 ? 'a' : 'e' );
            if (j === cps.length - 1 && /^(?=.*a)(?=.*e).*$/.test(digits)) throwIdnaContextOError('Arabic-Indic digits cannot be mixed with Extended Arabic-Indic digits (RFC 5892 Appendix A.8/A.9).');
            // validate bidi
            bidiClasses.push(getRange(bidi_ranges, cp));
            if (j === cps.length - 1 && (bidiClasses.includes('R') || bidiClasses.includes('AL'))) {
                // order of chars in label (RFC 5890 §2.3.3)
                if (bidiClasses[0] === 'R' || bidiClasses[0] === 'AL') {
                    for (let cls of bidiClasses) if (!['R', 'AL', 'AN', 'EN', 'ET', 'ES', 'CS', 'ON', 'BN', 'NSM'].includes(cls)) throwIdnaBidiError(`'${label}' breaks rule #2: Only R, AL, AN, EN, ET, ES, CS, ON, BN, NSM allowed in label (RFC 5893 §2.2)`);
                    if (!/(R|AL|EN|AN)(NSM)*$/.test(bidiClasses.join(''))) throwIdnaBidiError(`'${label}' breaks rule #3: label must end with R, AL, EN, or AN, followed by zero or more NSM (RFC 5893 §2.3)`);
                    if (bidiClasses.includes('EN') && bidiClasses.includes('AN')) throwIdnaBidiError(`'${label}' breaks rule #4: EN and AN cannot be mixed in the same label (RFC 5893 §2.4)`);
                } else if (bidiClasses[0] === 'L') {
                    for (let cls of bidiClasses) if (!['L', 'EN', 'ET', 'ES', 'CS', 'ON', 'BN', 'NSM'].includes(cls)) throwIdnaBidiError(`'${label}' breaks rule #5: Only L, EN, ET, ES, CS, ON, BN, NSM allowed in label (RFC 5893 §2.5)`);
                    if (!/(L|EN)(NSM)*$/.test(bidiClasses.join(''))) throwIdnaBidiError(`'${label}' breaks rule #6: label must end with L or EN, followed by zero or more NSM (RFC 5893 §2.6)`);
                } else {
                    throwIdnaBidiError(`'${label}' breaks rule #1: label must start with L or R or AL (RFC 5893 §2.1)`);
                }
            }
        }
    }
    if (aceHostnameLength - 1 > 253) throwIdnaLengthError('Final ASCII Compatible Encoding (ACE) hostname cannot exceed 253 bytes (RFC 5890 → RFC 1034 §3.1).');
    return true;
}
// return ACE hostname if valid
const idnHostname = (string) =>
    isIdnHostname(string) &&
    punycode.toASCII(
        string
            .split('.')
            .map((label) => uts46map(label).normalize('NFC'))
            .join('.')
    );
// export
module.exports = { isIdnHostname, idnHostname, uts46map, punycode };
