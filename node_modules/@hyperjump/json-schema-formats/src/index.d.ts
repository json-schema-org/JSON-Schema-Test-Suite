/**
 * The 'date' format. Validates that a string represents a date according to
 * [RFC 3339, section 5.6](https://www.rfc-editor.org/rfc/rfc3339.html#section-5.6).
 *
 * @see [JSON Schema Core, section 7.3.1](https://json-schema.org/draft/2020-12/draft-bhutton-json-schema-validation-01#section-7.3.1)
 */
export const isDate: (date: string) => boolean;

/**
 * The 'time' format. Validates that a string represents a time according to
 * [RFC 3339, section 5.6](https://www.rfc-editor.org/rfc/rfc3339.html#section-5.6).
 *
 * **NOTE**: Leap seconds are only allowed on specific dates. Since there is no date
 * in this context, leap seconds are never allowed.
 *
 * @see [JSON Schema Core, section 7.3.1](https://json-schema.org/draft/2020-12/draft-bhutton-json-schema-validation-01#section-7.3.1)
 */
export const isTime: (time: string) => boolean;

/**
 * The 'date-time' format. Validates that a string represents a date-time
 * according to [RFC 3339, section 5.6](https://www.rfc-editor.org/rfc/rfc3339.html#section-5.6).
 *
 * @see [JSON Schema Core, section 7.3.1](https://json-schema.org/draft/2020-12/draft-bhutton-json-schema-validation-01#section-7.3.1)
 */
export const isDateTime: (dateTime: string) => boolean;

/**
 * The 'duration' format. Validates that a string represents a duration
 * according to [RFC 3339, Appendix A](https://www.rfc-editor.org/rfc/rfc3339.html#appendix-A).
 *
 * @see [JSON Schema Core, section 7.3.1](https://json-schema.org/draft/2020-12/draft-bhutton-json-schema-validation-01#section-7.3.1)
 */
export const isDuration: (duration: string) => boolean;

/**
 * The 'email' format. Validates that a string represents an email as defined by
 * the "Mailbox" ABNF rule in [RFC 5321, section 4.1.2](https://www.rfc-editor.org/rfc/rfc5321.html#section-4.1.2).
 *
 * @see [JSON Schema Core, section 7.3.2](https://json-schema.org/draft/2020-12/draft-bhutton-json-schema-validation-01#section-7.3.2)
 */
export const isEmail: (email: string) => boolean;

/**
 * The 'idn-email' format. Validates that a string represents an email as
 * defined by the "Mailbox" ABNF rule in [RFC 6531, section 3.3](https://www.rfc-editor.org/rfc/rfc6531.html#section-3.3).
 *
 * @see [JSON Schema Core, section 7.3.2](https://json-schema.org/draft/2020-12/draft-bhutton-json-schema-validation-01#section-7.3.2)
 */
export const isIdnEmail: (email: string) => boolean;

/**
 * The 'hostname' format in draft-04 - draft-06. Validates that a string
 * represents a hostname as defined by [RFC 1123, section 2.1](https://www.rfc-editor.org/rfc/rfc1123.html#section-2.1).
 *
 * **NOTE**: The 'hostname' format changed in draft-07. Use {@link isAsciiIdn} for
 * draft-07 and later.
 *
 * @see [JSON Schema Core, section 7.3.3](https://json-schema.org/draft/2020-12/draft-bhutton-json-schema-validation-01#section-7.3.3)
 */
export const isHostname: (hostname: string) => boolean;

/**
 * The 'hostname' format since draft-07. Validates that a string represents an
 * IDNA2008 internationalized domain name consiting of only A-labels and NR-LDH
 * labels as defined by [RFC 5890, section 2.3.2.1](https://www.rfc-editor.org/rfc/rfc5890.html#section-2.3.2.3).
 *
 * **NOTE**: The 'hostname' format changed in draft-07. Use {@link isHostname}
 * for draft-06 and earlier.
 *
 * @see [JSON Schema Core, section 7.3.3](https://json-schema.org/draft/2020-12/draft-bhutton-json-schema-validation-01#section-7.3.3)
 */
export const isAsciiIdn: (hostname: string) => boolean;

/**
 * The 'idn-hostname' format. Validates that a string represents an IDNA2008
 * internationalized domain name as defined by [RFC 5890, section 2.3.2.1](https://www.rfc-editor.org/rfc/rfc5890.html#section-2.3.2.1).
 *
 * @see [JSON Schema Core, section 7.3.3](https://json-schema.org/draft/2020-12/draft-bhutton-json-schema-validation-01#section-7.3.3)
 */
export const isIdn: (hostname: string) => boolean;

/**
 * The 'ipv4' format. Validates that a string represents an IPv4 address
 * according to the "dotted-quad" ABNF syntax as defined in
 * [RFC 2673, section 3.2](https://www.rfc-editor.org/rfc/rfc2673.html#section-3.2).
 *
 * @see [JSON Schema Core, section 7.3.4](https://json-schema.org/draft/2020-12/draft-bhutton-json-schema-validation-01#section-7.3.4)
 */
export const isIPv4: (ip: string) => boolean;

/**
 * The 'ipv6' format. Validates that a string represents an IPv6 address as
 * defined in [RFC 4291, section 2.2](https://www.rfc-editor.org/rfc/rfc4291.html#section-2.2).
 *
 * @see [JSON Schema Core, section 7.3.4](https://json-schema.org/draft/2020-12/draft-bhutton-json-schema-validation-01#section-7.3.4)
 */
export const isIPv6: (ip: string) => boolean;

/**
 * The 'uri' format. Validates that a string represents a URI as defined by [RFC
 * 3986](https://www.rfc-editor.org/rfc/rfc3986.html).
 *
 * @see [JSON Schema Core, section 7.3.5](https://json-schema.org/draft/2020-12/draft-bhutton-json-schema-validation-01#section-7.3.5)
 */
export const isUri: (uri: string) => boolean;

/**
 * The 'uri-reference' format. Validates that a string represents a URI
 * Reference as defined by [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986.html).
 *
 * @see [JSON Schema Core, section 7.3.5](https://json-schema.org/draft/2020-12/draft-bhutton-json-schema-validation-01#section-7.3.5)
 */
export const isUriReference: (uri: string) => boolean;

/**
 * The 'iri' format. Validates that a string represents an IRI as defined by
 * [RFC 3987](https://www.rfc-editor.org/rfc/rfc3987.html).
 *
 * @see [JSON Schema Core, section 7.3.5](https://json-schema.org/draft/2020-12/draft-bhutton-json-schema-validation-01#section-7.3.5)
 */
export const isIri: (iri: string) => boolean;

/**
 * The 'iri-reference' format. Validates that a string represents an IRI
 * Reference as defined by [RFC 3987](https://www.rfc-editor.org/rfc/rfc3987.html).
 *
 * @see [JSON Schema Core, section 7.3.5](https://json-schema.org/draft/2020-12/draft-bhutton-json-schema-validation-01#section-7.3.5)
 */
export const isIriReference: (iri: string) => boolean;

/**
 * The 'uuid' format. Validates that a string represents a UUID address as
 * defined by [RFC 4122](https://www.rfc-editor.org/rfc/rfc4122.html).
 *
 * @see [JSON Schema Core, section 7.3.5](https://json-schema.org/draft/2020-12/draft-bhutton-json-schema-validation-01#section-7.3.5)
 */
export const isUuid: (uuid: string) => boolean;

/**
 * The 'uri-template' format. Validates that a string represents a URI Template
 * as defined by [RFC 6570](https://www.rfc-editor.org/rfc/rfc6570.html).
 *
 * @see [JSON Schema Core, section 7.3.6](https://json-schema.org/draft/2020-12/draft-bhutton-json-schema-validation-01#section-7.3.6)
 */
export const isUriTemplate: (uriTemplate: string) => boolean;

/**
 * The 'json-pointer' format. Validates that a string represents a JSON Pointer
 * as defined by [RFC 6901](https://www.rfc-editor.org/rfc/rfc6901.html).
 *
 * @see [JSON Schema Core, section 7.3.7](https://json-schema.org/draft/2020-12/draft-bhutton-json-schema-validation-01#section-7.3.7)
 */
export const isJsonPointer: (pointer: string) => boolean;

/**
 * The 'relative-json-pointer' format. Validates that a string represents an IRI
 * Reference as defined by [draft-bhutton-relative-json-pointer-00](https://datatracker.ietf.org/doc/html/draft-bhutton-relative-json-pointer-00).
 *
 * @see [JSON Schema Core, section 7.3.5](https://json-schema.org/draft/2020-12/draft-bhutton-json-schema-validation-01#section-7.3.5)
 */
export const isRelativeJsonPointer: (pointer: string) => boolean;

/**
 * The 'regex' format. Validates that a string represents a regular expression
 * as defined by [ECMA-262](https://262.ecma-international.org/5.1/).
 *
 * @see [JSON Schema Core, section 7.3.8](https://json-schema.org/draft/2020-12/draft-bhutton-json-schema-validation-01#section-7.3.8)
 */
export const isRegex: (regex: string) => boolean;
