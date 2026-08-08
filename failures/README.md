## Expected Failure Tests

The tests in this folder are expected to cause a failure of some sort in an implementation.

Failures can occur when attempting to load the schema or validate an instance.

## Structure

Each file is a JSON array of test scenarios.

Each scenario has a description, a schema, and an instance that should exercise the keyword being tested.

## Running the Suite

It's recommended that a test runner perform two tasks for each scenario:  load the schema and evaluate an instance.

The scenario passes if the implementation raises an error condition during these tasks.

## Examples

### Schema Load Error

This test presents an invalid schema.

```json
{
    "description": "cannot be number",
    "schema": { "items": 42 },
    "instance": [ "foo" ]
}
```

An implementation may use whatever means in order to determine that it is invalid, including meta-schema evaluation, static typing, or another mechanism.

Because some implementations may choose not to validate a schema until instance evaluation, an instance is provided to exercise the `items` keyword.

### Evaluation Error

This test provides a technically valid schema, however an implementation should be able to detect the infinite loop and raise an error.

```json
{
    "description": "infinite loop $ref",
    "schema": { "$ref": "#" },
    "instance": {}
}
```

While this schema will likely pass any loading validation, it should definitely raise an error when evaluating an instance.