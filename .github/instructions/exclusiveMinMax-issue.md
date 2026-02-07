# Add edge case tests for exclusiveMinimum and exclusiveMaximum keywords

The `exclusiveMinimum` and `exclusiveMaximum` test files currently contain only a single test case each across all draft versions. Coverage is limited to basic positive floats (e.g. `exclusiveMinimum: 1.1`, `exclusiveMaximum: 3.0`), with no tests for zero, negatives, integer boundaries, very large or very small numbers, or interaction with `minimum` / `maximum`. Expanding these tests would help validator implementations handle boundary conditions correctly and align coverage with the richer edge cases already present in `minimum.json` and `maximum.json`.

---

### Motivation

Implementations need to correctly handle exclusive bounds in a variety of numeric scenarios. The specification defines `exclusiveMinimum` and `exclusiveMaximum` for numeric validation; the suite should exercise integer boundaries, zero, negative numbers, and (where appropriate) extreme values. Tests that combine `exclusiveMinimum`/`exclusiveMaximum` with `minimum`/`maximum` would also clarify expected behavior when both are present. Better coverage here reduces the risk of validators misbehaving on real-world schemas that use these keywords.

### Current tests

Each of the following files contains only **one test case** (one schema plus its tests):

**exclusiveMinimum**

- [tests/draft7/exclusiveMinimum.json](https://github.com/json-schema-org/JSON-Schema-Test-Suite/blob/main/tests/draft7/exclusiveMinimum.json)
- [tests/draft2019-09/exclusiveMinimum.json](https://github.com/json-schema-org/JSON-Schema-Test-Suite/blob/main/tests/draft2019-09/exclusiveMinimum.json)
- [tests/draft2020-12/exclusiveMinimum.json](https://github.com/json-schema-org/JSON-Schema-Test-Suite/blob/main/tests/draft2020-12/exclusiveMinimum.json)
- [tests/v1/exclusiveMinimum.json](https://github.com/json-schema-org/JSON-Schema-Test-Suite/blob/main/tests/v1/exclusiveMinimum.json)

**exclusiveMaximum**

- [tests/draft7/exclusiveMaximum.json](https://github.com/json-schema-org/JSON-Schema-Test-Suite/blob/main/tests/draft7/exclusiveMaximum.json)
- [tests/draft2019-09/exclusiveMaximum.json](https://github.com/json-schema-org/JSON-Schema-Test-Suite/blob/main/tests/draft2019-09/exclusiveMaximum.json)
- [tests/draft2020-12/exclusiveMaximum.json](https://github.com/json-schema-org/JSON-Schema-Test-Suite/blob/main/tests/draft2020-12/exclusiveMaximum.json)
- [tests/v1/exclusiveMaximum.json](https://github.com/json-schema-org/JSON-Schema-Test-Suite/blob/main/tests/v1/exclusiveMaximum.json)

**Affected drafts:** draft-07, draft-2019-09, draft-2020-12, and v1. Representative links: [draft7](https://github.com/json-schema-org/JSON-Schema-Test-Suite/blob/main/tests/draft7/exclusiveMinimum.json), [draft2019-09](https://github.com/json-schema-org/JSON-Schema-Test-Suite/blob/main/tests/draft2019-09/exclusiveMinimum.json), [draft2020-12](https://github.com/json-schema-org/JSON-Schema-Test-Suite/blob/main/tests/draft2020-12/exclusiveMinimum.json), [v1](https://github.com/json-schema-org/JSON-Schema-Test-Suite/blob/main/tests/v1/exclusiveMinimum.json).

### Proposed additions

- **Integer boundaries:** Test cases where the bound is an integer (e.g. `exclusiveMinimum: 0`, `exclusiveMaximum: 10`) and instances use both integer and float representations (e.g. `0` vs `0.0`, `10` vs `10.0`) to assert correct exclusive comparison.
- **Zero:** Explicit tests for zero as either the bound or the instance (e.g. `exclusiveMinimum: 0` with valid `0.1` and invalid `0`; `exclusiveMaximum: 0` with valid `-0.1` and invalid `0`).
- **Negative numbers:** Test cases with negative bounds and/or negative instances (e.g. `exclusiveMinimum: -2`, `exclusiveMaximum: -1`) to cover signed comparisons.
- **Very large and very small numbers:** Edge cases with large or small finite values (within normal JSON number range). Implementation-specific overflow behavior may follow existing optional patterns (e.g. [tests/draft2020-12/optional/bignum.json](https://github.com/json-schema-org/JSON-Schema-Test-Suite/blob/main/tests/draft2020-12/optional/bignum.json), [tests/draft2020-12/optional/float-overflow.json](https://github.com/json-schema-org/JSON-Schema-Test-Suite/blob/main/tests/draft2020-12/optional/float-overflow.json)) where relevant.
- **Interaction with `minimum` / `maximum`:** Test cases where both `minimum` and `exclusiveMinimum`, or both `maximum` and `exclusiveMaximum`, appear in the same schema, to assert that implementations apply the exclusive bound correctly when used together.

### Implementation notes

- Follow the [CONTRIBUTING](https://github.com/json-schema-org/JSON-Schema-Test-Suite/blob/main/CONTRIBUTING.md) guidelines: use **minimal** schemas (only keywords under test) and prefer simpler instances where possible.
- Include both **valid** and **invalid** instances for each new test case where the schema allows either outcome; see the [README](https://github.com/json-schema-org/JSON-Schema-Test-Suite/blob/main/README.md) test structure.
- Add new test cases to **all applicable draft versions** (draft-07, draft-2019-09, draft-2020-12, v1), with any draft-specific adjustments (e.g. `$id` vs `id`, `$schema` usage) as needed.
- Before adding tests, review the spec sections for [exclusiveMinimum](https://json-schema.org/draft/2020-12/draft-bhutton-json-schema-validation-01#name-exclusiveminimum) and [exclusiveMaximum](https://json-schema.org/draft/2020-12/draft-bhutton-json-schema-validation-01#name-exclusivemaximum) to ensure the new cases match specified behavior.
