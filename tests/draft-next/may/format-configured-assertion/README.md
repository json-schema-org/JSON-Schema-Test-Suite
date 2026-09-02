This folder contains tests to cover the case when the `format-annotation` vocabulary is present, meaning `format` should not be validated, but the implementation is configured to validate it anyway.

_Implementations must be configured to validate `format` when running these tests in order for the tests to be effective._  If the implementation does not support such a configuration, these tests may be skipped.

<!-- we'll need to update this link when draft/next is published -->
[Validation Section 7.2.1](https://json-schema.org/draft/2020-12/json-schema-validation#section-7.2.1) states

> When the implementation is configured for assertion behavior, it:
>
> - SHOULD provide an implementation-specific best effort validation for each format attribute defined below;
> - MAY choose to implement validation of any or all format attributes as a no-op by always producing a validation result of true;

The tests in herein cover the second point.  As such, these test cases are invalid data for their respective formats, so validation is expected to fail.

Returns a passing validation for these scenarios is permitted.