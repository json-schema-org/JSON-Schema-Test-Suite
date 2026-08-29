# Validation Test Suite

[![Project Status: Active – The project has reached a stable, usable state and is being actively developed.](https://www.repostatus.org/badges/latest/active.svg)](https://www.repostatus.org/#active)

[![Build Status](https://github.com/json-schema-org/JSON-Schema-Test-Suite/workflows/Test%20Suite%20Sanity%20Checking/badge.svg)](https://github.com/json-schema-org/JSON-Schema-Test-Suite/actions?query=workflow%3A%22Test+Suite+Sanity+Checking%22)

This directory contains the validation test suite for JSON Schema. These tests
verify that implementations correctly validate instances against schemas
according to the JSON Schema specification.

The test suite exists to verify specified behavior defined by the JSON Schema
specification and should not be confused with a style guide. It is not intended
to demonstrate how schemas ought to be written. Tests may appear unusual or
unintuitive, but they exist solely to exercise behavior prescribed by the
specification.

It is meant to be language agnostic and should require only a JSON parser. The
conversion of the JSON objects into tests within a specific language and test
framework of choice is left to be done by the validator implementer.

## Coverage

JSON Schema draft-04 and later releases are well covered by this suite. draft-03
is reasonably well covered. While the suite can be run against older versions,
coverage is limited for keywords that didn't exist or were different before
draft-03.

Additional coverage is always welcome, particularly for bugs encountered in
real-world implementations. If you see anything missing or incorrect, please
feel free to [file an issue](https://github.com/json-schema-org/JSON-Schema-Test-Suite/issues)
or [submit a PR](https://github.com/json-schema-org/JSON-Schema-Test-Suite).

## Test Suite Structure

The tests in this suite are contained in the `tests` directory within this
validation directory.

Each `.json` file in the `tests` directory contains a collection of related
tests. Often the grouping is by keyword under test, but not always. Each `.json`
file consists of a single JSON object with a `description` and a `tests` array
of test cases.

Files with a `-legacy` suffix contain tests for older keyword syntaxes and
behaviors that have been replaced in newer drafts. For example, `id-legacy.json`
contains tests for the `id` keyword which was renamed to `$id` in draft-06.

In addition to the test files, there are special subdirectories whose purpose is
[described below](#subdirectories), and which contain additional `.json` files.

### Terminology

For clarity, we first define this document's usage of some testing terminology:

| term            | definition                                                                                                                                                        |
|-----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **test suite**  | the entirety of the contents of this directory, containing tests for multiple different releases of the JSON Schema specification                                |
| **test case**   | a single schema, along with a description and an array of *test*s                                                                                                 |
| **test**        | within a *test case*, a single test example, containing a description, instance and a boolean indicating whether the instance is valid under the test case schema |
| **test runner** | a program, external to this repository and authored by a user of this suite, which is executing each of the tests in the suite                                    |

An example illustrating this structure is immediately below, and a JSON Schema
containing a formal definition of the contents of test cases can be found
[alongside this README](./validation-test-schema.json).

### Sample Test Case

Here is a single *test case*, containing one or more tests:

```json
{
    "description": "The test case description",
    "schema": {
        "type": "string"
    },
    "tests": [
        {
            "description": "a test with a valid instance",
            "data": "a string",
            "valid": true
        },
        {
            "description": "a test with an invalid instance",
            "data": 15,
            "valid": false
        }
    ]
}
```

### Test Case Compatibility

Test cases may include a `compatibility` property that specifies which JSON Schema
dialects the test applies to. This allows a single test file to cover multiple
specification versions. Schemas in test cases should not include `$schema` so
that the same test can be run against multiple dialects.

Dialects are indicated by the number corresponding to their release. Date-based
releases use just the year. If this property isn't present, it means the test case
is compatible with any dialect.

If this property is present with a number, the number indicates the minimum
release the test case is compatible with. This example indicates that the test
case is compatible with draft-07 and up.

**Example**: `"compatibility": "7"`

You can use a `<=` operator to indicate that the test case is compatible with
releases less than or equal to the given release. This example indicates that
the test case is compatible with 2019-09 and under.

**Example**: `"compatibility": "<=2019"`

You can use comma-separated values to indicate multiple constraints if needed,
but constraints must be ordered smallest to largest. This example indicates that
the test case is compatible with releases between draft-06 and 2019-09.

**Example**: `"compatibility": "6,<=2019"`

For convenience, you can use the `=` operator to indicate a test case is only
compatible with a single release. This example indicates that the test case is
compatible only with 2020-12.

**Example**: `"compatibility": "=2020"`

There can be more than two constraints. This example indicates that the test
case is compatible with draft-03 only, plus draft-07 through 2020-12.

**Example**: `"compatibility": "=3,7,<=2020"`

Contraints can be open ended on both ends. This example indicates that the test
case is compatible up to draft-03 and draft-07 and later.

**Example**: `"compatibility": "<=3,7"`

Starting with v1, JSON Schema will have yearly releases. These are indicated
by the full year in the compatibility property (e.g., `2027`, `2028`). Tests for
features that are in the specification but not yet part of a release use
`9999` as a placeholder. Implementations are expected to implement and pass
these tests. It's the last step we require before the feature can be officially
released.

**Example**: `"compatibility": "9999"`

#### Compatibility matching

The following psudocode shows the algorithm for correctly determining if a test
case is compatible with the version being tested. It's not as straightforward as
it seems, so take please consider the psudocode when implementing.

```
FUNCTION isCompatible(compatibility, versionUnderTest):
    isValid = true

    FOR EACH constraint IN SPLIT(compatibility, ","):
        (operator, version) = PARSE constraint

        SWITCH operator:
            CASE "":
                isValid = (versionUnderTest >= version)
            CASE "<=":
                isValid = (versionUnderTest <= version)
            CASE "=":
                isValid = (versionUnderTest == version)

        // IMPORTANT!
        IF versionUnderTest <= version:
            BREAK

    RETURN isValid
```

The constraints are combined as a disjunction over releases: each term describes
a range (or single release) that the test case is compatible with, and the test
case applies to a dialect if it matches any of them.

### External Schemas

Test cases may include an `externalSchemas` property that defines additional
schemas referenced by the test case's schema. This replaces the `remotes`
directory used in previous versions of the test suite.

The `externalSchemas` property is an object where the keys are retrieval URIs
and the values are schemas. Test runners should load each schema and make it
available at the corresponding URI before validating the test case. External
schemas should avoid including `$id` or `id` to keep the tests compatible with
as many dialects as possible. Test runners can insert `$id` or `id` as necessary
if they don't have a mechanism for associating a URI with a schema outside the
schema.

### Subdirectories

The `tests` directory may contain one or more subdirectories.

These are:

1. `optional/`: Contains tests that are considered optional. Note that this
   subdirectory currently conflates many reasons why a test may be optional --
   it may be because tests within a particular file are indeed not required by the
   specification but still potentially useful to an implementer, or it may be
   because tests within it only apply to programming languages with particular
   functionality (in which case they are not truly optional in such a language). In
   the future this directory structure will be made richer to reflect these
   differences more clearly.

   Within `optional/`, there is also a `format/` subdirectory that contains
   per-format test files (e.g., `email.json`, `uri.json`). Through draft-07,
   format assertion is optional. In 2019-09 and 2020-12, annotation is required
   by default and may be enabled with configuration. Implementations may need to
   configure their test runners to enable format assertion before running these
   tests.

2. `proposals/`: Contains a subfolder for each active proposal to the
   specification. If the proposal is a keyword (generally the case), then the
   subfolder will bear the name of that keyword. Inside the proposal subfolder is a
   series of test files that would contain amendments to the required test suite
   should the proposal be incorporated into the specification. These tests should
   be considered volatile while the proposal is in development; however,
   implementations claiming to support the proposal are expected to pass its tests.

## Using the Suite to Test a Validator Implementation

The test suite structure was described [above](#test-suite-structure).

If you are authoring a new validator implementation, or adding support for an
additional version of the specification, this section describes:

1. How to implement a test runner which passes tests to your validator
2. Invariants the test suite claims to hold for its tests

### How to Implement a Test Runner

Presented here is a possible implementation of a test runner. The precise steps
described do not need to be followed exactly, but the results of your own
procedure should produce the same effects.

To test a specific dialect:

* For each `.json` file found in the `tests` directory:
  * for each test case present in the file:
    * check the `compatibility` property (if present) to determine if the test case
      applies to the dialect you are testing. If the test case doesn't apply,
      continue to the next test case.
    * if the test case has an `externalSchemas` property, load each schema it
      contains, using the keys as retrieval URIs. Designate the dialect either
      by inserting `$schema` or by configuration.
    * load the schema from the `"schema"` property. Designate the dialect either
      by inserting `$schema` or by configuration.
    * log the test case description from the `"description"` property for
      debugging or outputting
    * for each test in the `"tests"` property:
      * load the instance to be tested from the `"data"` property
      * log the individual test description from the `"description"` property
        for debugging or outputting
      * use the schema loaded above to validate whether the instance is
        considered valid under your implementation
      * if the result from your implementation matches the value found in the
        `"valid"` property, your implementation correctly implements the
        specific example
      * if the result does not match, or your implementation errors or crashes,
        your implementation does not correctly implement the specific example

If your implementation supports multiple versions, run the above procedure for
each version supported, configuring your implementation as appropriate to call
each version individually.

### Invariants & Guarantees

The test suite guarantees a number of things about tests it defines. Any
deviation from the below is generally considered a bug. If you suspect one,
please [file an issue](https://github.com/json-schema-org/JSON-Schema-Test-Suite/issues/new):

1. All files containing test cases are valid JSON.
2. The contents of the `"schema"` property in a test case are always valid
   JSON Schemas for all compatible dialects according to the `"compatibility"`
   property.
3. The values in the `"externalSchemas"` property (if present) are always valid
   JSON Schemas for all compatible dialects according to the `"compatibility"`
   property.

   The rationale behind this is that we are testing instances in a test's
   `"data"` element, and not the schema itself. The [json-schema-spec](https://github.com/json-schema-org/json-schema-spec)
   repo includes a test suite for the meta-schema. Any tests that test that
   something is a syntactically correct schema should go in that suite instead
   of this one.

## Known Limitations

JSON Schema validation can only assert that an instance is valid (`true`) or
invalid (`false`). It cannot express indeterminate or error states. This means
there are behaviors mandated by the specification that cannot be tested by this
suite.

For example, a `$ref` that points to a non-existent location should be an error,
but the test suite doesn't have a way to express that result. Another example of
an expected error that the test suite can't express is a v1 schema with unknown
keywords.

## Contributing

If you see something missing or incorrect, a pull request is most welcome!

When writing tests, design them to apply to as many dialects as possible using
the `compatibility` property. However, sometimes it's necessary to include a copy
of a test that is similar but uses older syntax. For example, adding a test that
uses `$id` might also need a second similar test that uses `id`. In such cases,
add the older test in the appropriate `-legacy` file.

There are some sanity checks in place for testing the test suite. You can run
them with `python check_validation_suite.py` or `tox`. They will be run automatically
by [GitHub Actions](https://github.com/json-schema-org/JSON-Schema-Test-Suite/actions?query=workflow%3A%22Test+Suite+Sanity+Checking%22)
as well.

This repository is maintained by the JSON Schema organization, and is
governed by the JSON Schema Technical Steering Committee (TSC).
