# JSON Schema Test Suite 
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](https://github.com/json-schema-org/.github/blob/main/CODE_OF_CONDUCT.md)
[![Project Status: Active – The project has reached a stable, usable state and is being actively developed.](https://www.repostatus.org/badges/latest/active.svg)](https://www.repostatus.org/#active)
[![Financial Contributors on Open Collective](https://opencollective.com/json-schema/all/badge.svg?label=financial+contributors)](https://opencollective.com/json-schema)

[![Build Status](https://github.com/json-schema-org/JSON-Schema-Test-Suite/workflows/Test%20Suite%20Sanity%20Checking/badge.svg)](https://github.com/json-schema-org/JSON-Schema-Test-Suite/actions?query=workflow%3A%22Test+Suite+Sanity+Checking%22)

This repository contains a set of JSON objects that implementors of JSON Schema
validation libraries can use to test their validators.

It is meant to be language agnostic and should require only a JSON parser.

The conversion of the JSON objects into tests within your test framework of
choice is the job of the validator implementor.

## Table of Contents

1. [Test Concepts](#test-concepts)
2. [Introduction to the Test Suite Structure](#introduction-to-the-test-suite-structure)
   1. [Definitions and Requirements](#definitions-and-requirements)
   2. [Draft Test Subdirectories](#draft-test-subdirectories)
3. [Coverage](#coverage)
4. [How to Utilize the Tests](#how-to-utilize-the-tests)
   1. [How to Implement a Test Runner](#how-to-implement-a-test-runner)
   2. [Test Suite Assumptions](#test-assumptions)
5. [Who Uses the Test Suite](#who-uses-the-test-suite)
   1. [Clojure](#clojure)
   2. [Coffeescript](#coffeescript)
   3. [C++](#c++)
   4. [Dart](#dart)
   5. [Elixir](#elixir)
   6. [Erlang](#erlang)
   7. [Go](#go)
   8. [Haskell](#haskell)
   9. [Java](#java)
   10. [JavaScript](#javascript)
   11. [Node.js](#node.js)
   12. [.NET](#.net)
   13. [PHP](#php)
   14. [PostgreSQL](#postgresql)
   15. [Python](#python)
   16. [Ruby](#ruby)
   17. [Rust](#rust)
   18. [Swift](#swift)
6. [Contributing](#contributing)
7. [Resources](#resources)

## Test Concepts

This set of tests can test anything that a JSON Schema can describe. It
currently does not provide a mechanism for testing anything that a JSON Schema
cannot describe.

For example, a schema can require that a string is a _URI-reference_ and even
that it matches a certain pattern, but it is not currently possible to require
that the URI is normalized.

This means there are limitations when using a draft's meta-schema as the schema
in a _test case_.

## Introduction to the Test Suite Structure

The tests in this suite are contained in the `tests` directory at the root of
this repository. Inside that directory is a subdirectory for each draft or
version of the specification.\
_Summary: There are tests for each draft._

Inside each draft directory there are a number of `.json` files and one or more
special subdirectories. The subdirectories contain `.json` files meant for a
specific testing purpose, and each `.json` file logically groups a set of _test
cases_ together. Often the grouping is by property under test, but not always.\
_Summary: There are a number of `.json` files for each draft._

The subdirectories are described in a following subsection.

Each `.json` file consists of an array containing a number of _test cases_, and
each _test case_ is composed of one schema and an array of _tests_.

### Definitions and Requirements

An outline of the definitions and requirements follows.

1. _Test_: A single test contains a description, an instance, and a Boolean that
   indicates whether that instance is considered valid against the associated
   schema. The required properties are:
   1. `"description"`: The test description.
   2. `"data"`: The instance to validate against the schema.
   3. `"valid"`: The expected validation result. A test is considered to pass if
      the actual validation result matches this value, and is considered to fail
      otherwise. Note that this value is only applicable for testing the
      contents of `"data"` and is not applicable for testing the contents of
      `"schema"` from the _test case_.
2. _Test Case_: One schema plus a list of _tests_. The required properties are:
   1. `"description"`: The test case description.
   2. `"schema"`: The schema against which all the test instances (`"data"`)
      are validated. This should be valid and loadable.
   3. `"tests"`: An array of _tests_.
3. _Test Runner_: A program that tests a validator implementation using the
   tests in this suite.

The term _Test Suite_ is left undefined in this section because different
testing frameworks or testing approaches may refer to a "suite" as the entire
set of tests or merely as a grouping of test cases. However, this document
refers to all the tests for all the drafts as the _Test Suite_.

A _test case_ example:

```json
{
    "description": "The test case description",
    "schema": {
        "description": "The schema against which the data in each test is validated",
        "type": "string"
    },
    "tests": [
        {
            "description": "Test for a valid instance",
            "data": "the instance to validate",
            "valid": true
        },
        {
            "description": "Test for an invalid instance",
            "data": 15,
            "valid": false
        }
    ]
}
```

### Draft Test Subdirectories

There is currently only one subdirectory that may exist within each draft test
directory. This is:

1. `optional/`: Contains tests that are considered optional.

This structure is in flux and may be amended in the future. For example, maybe
there will be one subdirectory underneath `optional/` for each feature, for
example, `optional/format/` for `"format"`-specific tests. This is evolving.

## Coverage

All JSON Schema specification releases should be well covered by this suite,
including drafts 2020-12, 2019-09, 07, 06, 04 and 03. Additional coverage is
always welcome, particularly for bugs encountered in real-world
implementations.

Drafts 04 and 03 are considered "frozen" in that less effort is put in to
backport new tests to these versions.

Contributions are very welcome, especially from implementers as they add support
to their own implementations.

If you see anything missing from the current supported drafts, or incorrect on
any draft still accepting bug fixes, please
[file an issue](https://github.com/json-schema-org/JSON-Schema-Test-Suite/issues)
or [submit a PR](https://github.com/json-schema-org/JSON-Schema-Test-Suite).

## How to Utilize the Tests

The test suite structure was described
[above](#introduction-to-the-test-suite-structure). This section describes:

1. How to implement a test runner for testing a validator implementation.
2. Assumptions the test suite makes and their rationales.

Note that the specific steps described here outline a procedure for running the
tests. The procedure doesn't need to be followed exactly, but the results of
your own procedure should produce the same effects.

After completing the tests, each test is marked as one of:
1. Pass
2. Fail
3. Not Executed

### How to Implement a Test Runner

To test a specific draft, walk the filesystem tree for that draft and execute
all the tests in each `.json` file encountered. Each `.json` file is either
located in the root of the draft test hierarchy or in a subdirectory. The
approach is similar for both cases, but tests found in subdirectories need to
follow the assumptions and restrictions for the containing subdirectory.

For each _test case_ in a `.json` file:
1. Load the schema from `"schema"`.
   1. If the schema is loaded successfully then it can be used for each test.
   2. If the schema is not loaded successfully or is found to be invalid, all
      _tests_ in this _test case_ should be marked as "Not Executed". It is not
      correct to assume that `"valid"` is false for these tests.
2. For each _test_ in the _test case_:
   1. Apply the schema to the instance found in `"data"`.
   2. The test passes if the schema application result matches the Boolean value
      found in `"valid"`.
   3. The test fails if the result does not match the value found in `"valid"`.

### Test Suite Assumptions

There are a few assumptions that the test suite makes around the structure of
the tests and around schema loading and application.

1. A schema, the contents of `"schema"` in a _test case_, should be valid
   and loadable.

   The rationale behind this is that we are testing instances in a _test's_
   `"data"` element, and not the schema itself. There is currently no mechanism
   for testing a schema unless the schema is represented as an instance inside
   a _test_ and the associated meta-schema is used as a `"$ref"` inside a
   _test case_. For example:

   ```json
   {
       "description": "Test the \"type\" schema keyword",
       "schema": {
           "$ref": "https://json-schema.org/draft/2019-09/schema"
        },
       "tests": [
           {
               "description": "Valid: string",
               "data": {
                   "type": "string"
               },
               "valid": true
           },
           {
               "description": "Invalid: null",
               "data": {
                   "type": null
               },
               "valid": false
           }
       ]
   }
   ```

   Even then, if it can't be represented by the JSON Schema language, then it is
   not currently possible to test. For example, it is not possible to test that a
   URI-reference is normalized.
2. Any tests in a subdirectory of a specific draft's test suite is handled a
   little differently than the tests in a draft's root directory.

   The `optional/` subdirectory contains tests that test concepts that are not
   required by the specification. For these tests, it is necessary to enable
   features that would not otherwise be required. For example, some of the
   optional tests require that a validator's `"format"` features be enabled.

## Who Uses the Test Suite

This suite is being used by:

### Clojure

* [jinx](https://github.com/juxt/jinx)
* [json-schema](https://github.com/tatut/json-schema)

### Coffeescript

* [jsck](https://github.com/pandastrike/jsck)

### Common Lisp

* [json-schema](https://github.com/fisxoj/json-schema)

### C++

* [Modern C++ JSON schema validator](https://github.com/pboettch/json-schema-validator)

### Dart

* [json\_schema](https://github.com/patefacio/json_schema)

### Elixir

* [ex\_json\_schema](https://github.com/jonasschmidt/ex_json_schema)

### Erlang

* [jesse](https://github.com/for-GET/jesse)

### Go

* [gojsonschema](https://github.com/sigu-399/gojsonschema)
* [validate-json](https://github.com/cesanta/validate-json)

### Haskell

* [aeson-schema](https://github.com/timjb/aeson-schema)
* [hjsonschema](https://github.com/seagreen/hjsonschema)

### Java

* [json-schema-validator](https://github.com/daveclayton/json-schema-validator)
* [everit-org/json-schema](https://github.com/everit-org/json-schema)
* [networknt/json-schema-validator](https://github.com/networknt/json-schema-validator)
* [Justify](https://github.com/leadpony/justify)
* [Snow](https://github.com/ssilverman/snowy-json)
* [jsonschemafriend](https://github.com/jimblackler/jsonschemafriend)

### JavaScript

* [json-schema-benchmark](https://github.com/Muscula/json-schema-benchmark)
* [direct-schema](https://github.com/IreneKnapp/direct-schema)
* [is-my-json-valid](https://github.com/mafintosh/is-my-json-valid)
* [jassi](https://github.com/iclanzan/jassi)
* [JaySchema](https://github.com/natesilva/jayschema)
* [json-schema-valid](https://github.com/ericgj/json-schema-valid)
* [Jsonary](https://github.com/jsonary-js/jsonary)
* [jsonschema](https://github.com/tdegrunt/jsonschema)
* [request-validator](https://github.com/bugventure/request-validator)
* [skeemas](https://github.com/Prestaul/skeemas)
* [tv4](https://github.com/geraintluff/tv4)
* [z-schema](https://github.com/zaggino/z-schema)
* [jsen](https://github.com/bugventure/jsen)
* [ajv](https://github.com/epoberezkin/ajv)
* [djv](https://github.com/korzio/djv)

### Node.js

For node.js developers, the suite is also available as an
[npm](https://www.npmjs.com/package/@json-schema-org/tests) package.

Node-specific support is maintained in a [separate
repository](https://github.com/json-schema-org/json-schema-test-suite-npm)
which also welcomes your contributions!

### .NET

* [Newtonsoft.Json.Schema](https://github.com/JamesNK/Newtonsoft.Json.Schema)
* [Manatee.Json](https://github.com/gregsdennis/Manatee.Json)

### Perl

* [JSON::Schema::Draft201909](https://github.com/karenetheridge/JSON-Schema-Draft201909)
* [JSON::Schema::Tiny](https://github.com/karenetheridge/JSON-Schema-Tiny)
* [Test::JSON::Schema::Acceptance](https://github.com/karenetheridge/Test-JSON-Schema-Acceptance)

### PHP

* [opis/json-schema](https://github.com/opis/json-schema)
* [json-schema](https://github.com/justinrainbow/json-schema)
* [json-guard](https://github.com/thephpleague/json-guard)

### PostgreSQL

* [postgres-json-schema](https://github.com/gavinwahl/postgres-json-schema)
* [is\_jsonb\_valid](https://github.com/furstenheim/is_jsonb_valid)

### Python

* [jsonschema](https://github.com/Julian/jsonschema)
* [fastjsonschema](https://github.com/seznam/python-fastjsonschema)
* [hypothesis-jsonschema](https://github.com/Zac-HD/hypothesis-jsonschema)
* [jschon](https://github.com/marksparkza/jschon)

### Ruby

* [json-schema](https://github.com/hoxworth/json-schema)
* [json\_schemer](https://github.com/davishmcclurg/json_schemer)

### Rust

* [jsonschema](https://github.com/Stranger6667/jsonschema-rs)
* [valico](https://github.com/rustless/valico)

### Scala

* [typed-json](https://github.com/frawa/typed-json)

### Swift

* [JSONSchema](https://github.com/kylef/JSONSchema.swift)

If you use it as well, please fork and send a pull request adding yourself to
the list :).

## Contributing

If you see something missing or incorrect, a pull request is most welcome!

There are some sanity checks in place for testing the test suite. You can run
them with `bin/jsonschema_suite check` or `tox`. They will be run automatically
by [GitHub Actions](https://github.com/json-schema-org/JSON-Schema-Test-Suite/actions?query=workflow%3A%22Test+Suite+Sanity+Checking%22)
as well.

## Resources

1. [JSON Schema Test Suite](https://github.com/json-schema-org/JSON-Schema-Test-Suite)
2. [JSON Schema](https://json-schema.org)
3. [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986.html)
