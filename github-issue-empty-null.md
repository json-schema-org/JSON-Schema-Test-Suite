**Title:** Add tests for empty and null value edge cases

The suite does not yet systematically cover empty arrays, empty objects, empty strings, and `null` instances across the relevant keywords. These are common real‑world edge cases, and adding targeted tests would help validators behave consistently. Many core keywords may be affected (e.g. `type`, `minItems` / `maxItems`, `minLength` / `maxLength`, `required`), but the scope can stay descriptive; the gaps are straightforward to identify, the tests are simple to write and follow existing patterns, and they are a good way to learn the test structure and contributing guidelines.

### Proposed scope

- **Review existing tests** for key structural and validation keywords and identify where empty/null cases are missing (empty `[]`, `{}`, `""`, and `null` as instance values).
- **Add minimal schemas plus instances** that include those values, with both valid and invalid outcomes where the schema allows either.
- **Follow existing test patterns and directory structure**; keep new tests small and focused, and add them to all applicable draft versions per [CONTRIBUTING](https://github.com/json-schema-org/JSON-Schema-Test-Suite/blob/main/CONTRIBUTING.md).
