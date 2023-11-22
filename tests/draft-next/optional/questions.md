### `bignum` & `float-overflow`

Are these tests in optional because the JSON spec makes a concession for environments that can't handle arbitrary numbers?  While JSON Schema doesn't define any restrictions, it also doesn't make any such concessions.

I've put them in _undefined/_ for now.

References:
- https://datatracker.ietf.org/doc/html/rfc8259#section-6
- https://json-schema.org/draft/2020-12/json-schema-validation#section-4.2

### `format-assertion`

The spec isn't explicit on the requirement level for vocabularies as a feature.  I'd (@gregsdennis) assume it's a MUST, but that's just an interpretation.

There are requirement levels on `$vocabulary` and its usage, but nothing requiring that vocabularies be a supported feature in general.

As such, I'm not sure where this should go.

First, all of these tests assume that the `format-assertion` vocabulary is understood, which is optional.  ("An implementation that supports the Format-Assertion vocabulary..." implies that implementations have the option to not support it.)

Secondly, assuming the above, these test become mandatory because "full validation support" is a MUST requirement.

I think this is a MAY overall, but could use confirmation.

Also, we don't have any tests around _not_ understanding the `format-assertion` vocabulary.  I think this is partially due to the fact that we can't handle error scenarios.

References:
- https://json-schema.org/draft/2020-12/json-schema-core#section-4.3.3
- https://json-schema.org/draft/2020-12/json-schema-core#section-8.1.2
- https://json-schema.org/draft/2020-12/json-schema-validation#section-7.2.2