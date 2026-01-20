These tests cover behaviors that:

- the JSON Schema specification explicitly states is undefined
- the JSON Schema specification does not address at all
- have been found to have limited interoperability

Largely, these tests come from implementation behaviors we've observed in the wild, and they serve as documentation that _someone_ decided to do it a particular way.  These behaviors' inclusion in this suite does NOT imply endorsement by either the specification or the organization.

As such, many of these tests may actually be contradictory, and it is not expected that any single implementation should (or even could) pass all of them.

### `dependencies` compatibility

The `dependencies` keyword has been deprecated as of draft 2019-09, however some implementations may wish to continue supporting it.

These tests ensure that functionality remains consistent with the previous drafts which defined the keyword.

### Referencing into unknown locations

This behavior is explicitly undefined.

See https://json-schema.org/draft/2020-12/json-schema-core#section-9.4.2.