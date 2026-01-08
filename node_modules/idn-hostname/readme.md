---

title: IDN Hostname

description: A validator for Internationalized Domain Names (`IDNA`) in conformance with the current standards.

---

## Overview

This is a validator for Internationalized Domain Names (`IDNA`) in conformance with the current standards (`RFC 5890 - 5891 - 5892 - 5893 - 3492`) and the current adoption level of Unicode (`UTS#46`) in javascript (`15.1.0`).

**Browser/Engine Support:** Modern browsers (Chrome, Firefox, Safari, Edge) and Node.js (v18+).

This document explains, in plain terms, what this validator does, which RFC/UTS rules it enforces, what it intentionally **does not** check, and gives some relevant examples so you can see how hostnames are classified.

The data source for the validator is a `json` constructed as follows:

-   Baseline = Unicode `IdnaMappingTable` with allowed chars (based on props: valid/mapped/deviation/ignored/disallowed).
-   Viramas = Unicode `DerivedCombiningClass` with `viramas`(Canonical_Combining_Class=Virama).
-   Overlay 1 = Unicode `IdnaMappingTable` for mappings applied on top of the baseline.
-   Overlay 2 = Unicode `DerivedJoinTypes` for join types (D,L,R,T,U) applied on top of the baseline.
-   Overlay 3 = Unicode `DerivedBidiClass` for bidi classes (L,R,AL,NSM,EN,ES,ET,AN,CS,BN,B,S,WS,ON) applied on top of the baseline.

## Usage

**Install:**
```js title="js"
npm i idn-hostname
```

**Import the idn-hostname validator:**
```js title="js"
const  { isIdnHostname } = require('idn-hostname');
// the validator is returning true or detailed error
try {
    if ( isIdnHostname('abc')) console.log(true);
} catch (error) {
    console.log(error.message);
}
```

**Import the idn-hostname ACE converter:**
```js title="js"
const  { idnHostname } = require('idn-hostname');
// the idnHostname is returning the ACE hostname or detailed error (it also validates the input)
try {
    const idna = idnHostname('abc');
} catch (error) {
    console.log(error.message);
}
```

**Import the punycode converter (convenient exposure of punycode functions):**
```js title="js"
const  { idnHostname, punycode } = require('idn-hostname');
// get the unicode version of an ACE hostname or detailed error
try {
    const uLabel = punycode.toUnicode(idnHostname('abc'));
    // or simply use the punycode API for some needs
} catch (error) {
    console.log(error.message);
}
```

**Import the UTS46 mapping function:**
```js title="js"
const  { uts46map } = require('idn-hostname');
// the uts46map is returning the uts46 mapped label (not hostname) or an error if label has dissallowed or unassigned chars
try {
    const label = uts46map('abc').normalize('NFC');
} catch (error) {
    console.log(error.message);
}
```

## Versioning

Each release will have its `major` and `minor` version identical with the related `unicode` version, and the `minor` version variable. No `major` or `minor` (structural) changes are expected other than a `unicode` version based updated `json` data source.

## What does (point-by-point)

1. **Baseline data**: uses the Unicode `IdnaMappingTable` (RFC 5892 / Unicode UCD) decoded into per-code-point classes (PVALID, DISALLOWED, CONTEXTJ, CONTEXTO, UNASSIGNED).

    - Reference: RFC 5892 (IDNA Mapping Table derived from Unicode).

2. **UTS#46 overlay**: applies UTS#46 statuses/mappings on top of the baseline. Where `UTS#46` marks a code point as `valid`, `mapped`, `deviation`, `ignored` or `disallowed`, those override the baseline for that codepoint. Mappings from `UTS#46` are stored in the `mappings` layer.

    - Reference: `UTS#46` (Unicode IDNA Compatibility Processing).

3. **Join Types overlay**: uses the Unicode `DerivedJoinTypes` to apply char join types on top of the baseline. Mappings from Join Types are stored in the `joining_type_ranges` layer.

    - Reference: `RFC 5892` (The Unicode Code Points and IDNA).

4. **BIDI overlay**: uses the Unicode `DerivedBidiClass` to apply BIDI derived classes on top of the baseline. Mappings from BIDI are stored in the `bidi_ranges` layer.

    - Reference: `RFC 5893` (Right-to-Left Scripts for IDNA).

5. **Compact four-layer data source**: the script uses a compact JSON (`idnaMappingTableCompact.json`) merged from three data sources with:

    - `props` — list of property names (`valid`,`mapped`,`deviation`,`ignored`,`disallowed`),
    - `viramas` — list of `virama` codepoints (Canonical_Combining_Class=Virama),
    - `ranges` — merged contiguous ranges with a property index,
    - `mappings` — map from code point → sequence of code points (for `mapped`/`deviation`),
    - `joining_type_ranges` — merged contiguous ranges with a property index.
    - `bidi_ranges` — merged contiguous ranges with a property index.

6. **Mapping phase (at validation time)**:

    - For each input label the validator:
        1. Splits the hostname into labels (by `.` or alternate label separators). Empty labels are rejected.
        2. For each label, maps codepoints according to `mappings` (`valid` and `deviation` are passed as they are, `mapped` are replaced with the corresponding codepoints, `ignored` are ignored, any other chars are triggering `IdnaUnicodeError`).
        3. Normalizes the resulting mapped label with NFC.
        4. Checks length limits (label ≤ 63, full name ≤ 253 octets after ASCII punycode conversion).
        5. Validates label-level rules (leading combining/enclosing marks forbidden, hyphen rules, ACE/punycode re-encode correctness).
        6. Spreads each label into code points for contextual and bidi checks.
        7. Performs contextual checks (CONTEXTJ, CONTEXTO) using the `joining_type_ranges` from compact table (e.g. virama handling for ZWJ/ZWNJ, Catalan middle dot rule, Hebrew geresh/gershayim rule, Katakana middle dot contextual rule, Arabic digit mixing rule).
        8. Checks Bidi rules using the `bidi_ranges` from compact table.
    - See the sections below for exact checks and RFC references.

7. **Punycode / ACE checking**:

    - If a label starts with the ACE prefix `xn--`, the validator will decode the ACE part (using punycode), verify decoding succeeds, and re-encode to verify idempotency (the encoded value must match the original ACE, case-insensitive).
    - If punycode decode or re-encode fails, the label is rejected.
    - Reference: RFC 5890 §2.3.2.1, RFC 3492 (Punycode).

8. **Leading/trailing/compressed-hyphens**:

    - Labels cannot start or end with `-` (LDH rule).
    - ACE/punycode special rule: labels containing `--` at positions 3–4 (that’s the ACE indicator) and not starting with `xn` are invalid (RFC 5891 §4.2)

9. **Combining/enclosing marks**:

    - A label may not start with General Category `M` — i.e. combining or enclosing mark at the start of a label is rejected. (RFC 5891 §4.2.3.2)

10. **Contextual checks (exhaustive requirements from RFC 5892 A.1-A.9 appendices)**:

    - ZWNJ / ZWJ: allowed in context only (CONTEXTJ) (Appendix A.1/A.2, RFC 5892 and PR-37). Implemented checks:
        - ZWJ/ZWNJ allowed without other contextual condition if preceded by a virama (a diacritic mark used in many Indic scripts to suppress the inherent vowel that normally follows a consonant).
        - ZWNJ (if not preceded by virama) allowed only if joining context matches the RFC rules.
    - Middle dot (U+00B7): allowed only between two `l` / `L` (Catalan rule). (RFC 5891 §4.2.3.3; RFC 5892 Appendix A.3)
    - Greek keraia (U+0375): must be followed by a Greek letter. (RFC 5892 Appendix A.4)
    - Hebrew geresh/gershayim (U+05F3 / U+05F4): must follow a Hebrew letter. (RFC 5892 Appendix A.5/A.6)
    - Katakana middle dot (U+30FB): allowed if the label contains at least one character in Hiragana/Katakana/Han. (RFC 5892 Appendix A.7)
    - Arabic/Extended Arabic digits: the mix of Arabic-Indic digits (U+0660–U+0669) with Extended Arabic-Indic digits (U+06F0–U+06F9) within the same label is not allowed. (RFC 5892 Appendix A.8/A.9)

11. **Bidi enforcement**:

    - In the Unicode Bidirectional Algorithm (BiDi), characters are assigned to bidirectional classes that determine their behavior in mixed-direction text. These classes are used by the algorithm to resolve the order of characters. If given input is breaking one of the six Bidi rules the label is rejected. (RFC 5893)

12. **Total and per-label length**:

    - Total ASCII length (after ASCII conversion of non-ASCII labels) must be ≤ 253 octets. (RFC 5890, RFC 3492)

13. **Failure handling**:

    - The validator throws short errors (single-line, named exceptions) at the first fatal violation encountered (the smallest error ends the function). Each thrown error includes the RFC/UTS rule reference in its message.

## What does _not_ do

-   This validator does not support `context` or `locale` specific [Special Casing](https://www.unicode.org/Public/16.0.0/ucd/SpecialCasing.txt) mappings. For such needs some sort of `mapping` must be done before using this validator.
-   This validator does not support `UTS#46 useTransitional` backward compatibility flag.
-   This validator does not support `UTS#46 STD3 ASCII rules`, when required they can be enforced on separate layer.
-   This validator does not attempt to resolve or query DNS — it only validates label syntax/mapping/contextual/bidi rules.

## Examples

### PASS examples

```yaml title="yaml"
  - hostname: "a"                       # single char label
  - hostname: "a⁠b"                      # contains WORD JOINER (U+2060), ignored in IDNA table
  - hostname: "example"                 # multi char label
  - hostname: "host123"                 # label with digits
  - hostname: "test-domain"             # label with hyphen-minus
  - hostname: "my-site123"              # label with hyphen-minus and digits
  - hostname: "sub.domain"              # multi-label
  - hostname: "mañana"                  # contains U+00F1
  - hostname: "xn--maana-pta"           # ACE for mañana
  - hostname: "bücher"                  # contains U+00FC
  - hostname: "xn--bcher-kva"           # ACE for bücher
  - hostname: "café"                    # contains U+00E9
  - hostname: "xn--caf-dma"             # ACE for café
  - hostname: "straße"                  # German sharp s; allowed via exceptions
  - hostname: "façade"                  # French ç
  - hostname: "élève"                   # French é and è
  - hostname: "Γειά"                    # Greek
  - hostname: "åland"                   # Swedish å
  - hostname: "naïve"                   # Swedish ï
  - hostname: "smörgåsbord"             # Swedish ö
  - hostname: "пример"                  # Cyrillic
  - hostname: "пример.рф"               # multi-label Cyrillic
  - hostname: "xn--d1acpjx3f.xn--p1ai"  # ACE for Cyrillic
  - hostname: "مثال"                    # Arabic
  - hostname: "דוגמה"                   # Hebrew
  - hostname: "예시"                     # Korean Hangul
  - hostname: "ひらがな"                 # Japanese Hiragana
  - hostname: "カタカナ"                 # Japanese Katakana
  - hostname: "例.例"                    # multi-label Japanese Katakana
  - hostname: "例子"                    # Chinese Han
  - hostname: "สาธิต"                    # Thai
  - hostname: "ຕົວຢ່າງ"                   # Lao
  - hostname: "उदाहरण"                  # Devanagari
  - hostname: "क्‍ष"                      # Devanagari with Virama + ZWJ
  - hostname: "क्‌ष"                     # Devanagari with Virama + ZWNJ
  - hostname: "l·l"                     # Catalan middle dot between 'l' (U+00B7)
  - hostname: "L·l"                     # Catalan middle dot between mixed case 'l' chars
  - hostname: "L·L"                     # Catalan middle dot between 'L' (U+004C)
  - hostname: "( "a".repeat(63) ) "     # 63 'a's (label length OK)
```

### FAIL examples

```yaml title="yaml"
  - hostname: ""                          # empty hostname
  - hostname: "-abc"                      # leading hyphen forbidden (LDH)
  - hostname: "abc-"                      # trailing hyphen forbidden (LDH)
  - hostname: "a b"                       # contains space
  - hostname: "a	b"                # contains control/tab
  - hostname: "a@b"                       # '@'
  - hostname: ".abc"                      # leading dot → empty label
  - hostname: "abc."                      # trailing dot → empty label (unless FQDN handling expects trailing dot)
  - hostname: "a..b"                      # empty label between dots
  - hostname: "a.b..c"                    # empty label between dots
  - hostname: "a#b"                       # illegal char '#'
  - hostname: "a$b"                       # illegal char '$'
  - hostname: "abc/def"                   # contains slash
  - hostname: "a\b"                       # contains backslash
  - hostname: "a%b"                       # contains percent sign
  - hostname: "a^b"                       # contains caret
  - hostname: "a*b"                       # contains asterisk
  - hostname: "a(b)c"                     # contains parentheses
  - hostname: "a=b"                       # contains equal sign
  - hostname: "a+b"                       # contains plus sign
  - hostname: "a,b"                       # contains comma
  - hostname: "a@b"                       # contains '@'
  - hostname: "a;b"                       # contains semicolon
  - hostname: "\n"                        # contains newline
  - hostname: "·"                         # middle-dot without neighbors
  - hostname: "a·"                        # middle-dot at end
  - hostname: "·a"                        # middle-dot at start
  - hostname: "a·l"                       # middle dot not between two 'l' (Catalan rule)
  - hostname: "l·a"                       # middle dot not between two 'l'
  - hostname: "α͵"                        # Greek keraia not followed by Greek
  - hostname: "α͵S"                       # Greek keraia followed by non-Greek
  - hostname: "٠۰"                        # Arabic-Indic & Extended Arabic-Indic digits mixed
  - hostname: ( "a".repeat(64) )          # label length > 63
  - hostname: "￿"                         # noncharacter (U+FFFF) disallowed in IDNA table
  - hostname: "a‌"                         # contains ZWNJ (U+200C) at end (contextual rules fail)
  - hostname: "a‍"                         # contains ZWJ (U+200D) at end (contextual rules fail)
  - hostname: "̀hello"                     # begins with combining mark (U+0300)
  - hostname: "҈hello"                    # begins with enclosing mark (U+0488)
  - hostname: "실〮례"                      # contains HANGUL SINGLE DOT TONE MARK (U+302E)
  - hostname: "control\x01char"           # contains control character
  - hostname: "abc\u202Edef"              # bidi formatting codepoint, disallowed in IDNA table
  - hostname: "́"                          # contains combining mark (U+0301)
  - hostname: "؜"                          # contains Arabic control (control U+061C)
  - hostname: "۝"                         # Arabic end of ayah (control U+06DD)
  - hostname: "〯"                        # Hangul double-dot (U+302F), disallowed in IDNA table
  - hostname: "a￰b"                        # contains noncharacter (U+FFF0) in the middle
  - hostname: "emoji😀"                   # emoji (U+1F600), disallowed in IDNA table
  - hostname: "label\uD800"               # contains high surrogate on its own
  - hostname: "\uDC00label"               # contains low surrogate on its own
  - hostname: "a‎"                         # contains left-to-right mark (control formatting)
  - hostname: "a‏"                         # contains right-to-left mark (control formatting)
  - hostname: "xn--"                      # ACE prefix without payload
  - hostname: "xn---"                     # triple hyphen-minus (extra '-') in ACE
  - hostname: "xn---abc"                  # triple hyphen-minus followed by chars
  - hostname: "xn--aa--bb"                # ACE payload having hyphen-minus in the third and fourth position
  - hostname: "xn--xn--double"            # ACE payload that is also ACE
  - hostname: "xn--X"                     # invalid punycode (decode fails)
  - hostname: "xn--abcナ"                 # ACE containing non-ASCII char
  - hostname: "xn--abc\x00"               # ACE containing control/NUL
  - hostname: "xn--abc\uFFFF"             # ACE containing noncharacter
```

:::note

Far from being exhaustive, the examples are illustrative and chosen to demonstrate rule coverage. Also:
- some of the characters are invisible,
- some unicode codepoints that cannot be represented in `yaml` (those having `\uXXXX`) should be considered as `json`.

:::

**References (specs)**

-   `RFC 5890` — Internationalized Domain Names for Applications (IDNA): Definitions and Document Framework.
-   `RFC 5891` — IDNA2008: Protocol and Implementation (label rules, contextual rules, ACE considerations).
-   `RFC 5892` — IDNA Mapping Table (derived from Unicode).
-   `RFC 5893` — Right-to-left Scripts: Bidirectional text handling for domain names.
-   `RFC 3492` — Punycode (ACE / punycode algorithm).
-   `UTS #46` — Unicode IDNA Compatibility Processing (mappings / deviations / transitional handling).

:::info

Links are intentionally not embedded here — use the RFC/UTS numbers to fetch authoritative copies on ietf.org and unicode.org.

:::

## Disclaimer

Some hostnames above are language or script-specific examples — they are provided to exercise the mapping/context rules, not to endorse any particular registration practice. Also, there should be no expectation that results validated by this validator will be automatically accepted by registrants, they may apply their own additional rules on top of those defined by IDNA.
