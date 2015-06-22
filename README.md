<<<<<<< HEAD
JSON Schema Test Suite [![Build Status](https://travis-ci.org/json-schema-org/JSON-Schema-Test-Suite.svg?branch=master)](https://travis-ci.org/json-schema-org/JSON-Schema-Test-Suite)
=======
This is a fork of JSON Schema Test Suite for Node.js developers
===============================================================
=======
Node.js fork of JSON Schema Test Suite
======================================
>>>>>>> 9ec69b0... lodash needs to be a regular dependency, updated package.json, README.md

This is a fork of JSON Schema Test Suite for Node.js validator development.

The JSON Schema Test Suite is meant to be a language agnostic test suite for testing JSON Schema validation libraries. This fork makes the test suite available as an [npm package](https://www.npmjs.com/package/@atomiq/json-schema-test-suite) for use with Node.js.

    npm install @atomiq/json-schema-test-suite

When pulling the source from GitHub, make sure to checkout the `node` branch for taking advantage of the node features in this fork. The master and develop branches track the [upstream repo](https://github.com/json-schema/JSON-Schema-Test-Suite/). It is current with the latest commit to `7511038dcb4f4b430fa2a929184da70b670bdd35` (June 17, 2015) on the upstream `develop` branch.

### Usage:

There are a number of ways of loading the tests:

    var testSuite = require('@atomiq/json-schema-test-suite');

    // this will load all (required and optional) draft4 tests
    var tests = testSuite.loadSync();

    // optional `filter` is a function that takes 3 arguments (filename, parent, optional)
    // and returns true if the test should be included. The optional argument is true
    // for all files under the `<draft>/optional` directory.
    // optional `draft` should be either `'draft3'` or `'draft4'`
    var tests = testSuite.loadSync(filter, draft);

    // convenience functions:

    // The following take an optional `filter` as described previously (undefined will load all tests)
    var draft3 = testSuite.draft3();
    var draft4 = testSuite.draft4();

    // The following take an optional `draft` argument (defaults to 'draft4')
    var all = testSuite.loadAllSync();
    var required = testSuite.loadRequiredSync();
    var optional = testSuite.loadOptionalSync();

    
The return value of these functions is an array of objects that correspond to each file under `tests/<draft>` that
passed the filter (the default is all, so the array will also include all the optional files).

Each object has the following structure (using `tests/draft4/additionalItems.json` as an example):

```
{
  group:    'additionalItems',
  file:     'additionalItems.json',
  optional: false,  // true if a file under the optional directory
  path:     '/full/path/to/JSON-Schema-Test-Suite/tests/draft4/additionalItems.json',
  schemas:  []
}
```

The `schemas` property contains the array of objects loaded from the test file.
Each object consists of a schema and description, along with a number of tests used for validation. Using the first schema object in the array from `tests/draft4/additionalItems.json` as an example:

```
{
  description: 'additionalItems as schema',
  schema: {
    items: [{}],
    additionalItems: { type: "integer" }
  },
  tests: [
    {
      description: "additional items match schema",
      data: [ null, 2, 3, 4 ],
      valid: true
    },
    {
      description: "additional items do not match schema",
      data: [ null, 2, 3, "foo" ],
      valid: false
    }
  ]
}
```

### Testing a JSON Validator

You can apply a validator against all the tests. You need to create a validator factory function that takes a JSON schema and an options argument, and returns an object with a validate method. The validate function should take a JSON object to be validated against the schema. It should return an object with a valid property set to true or false, and if not valid, an errors property that is an array of one or more validation errors.

The following are examples of `Tiny Validator (tv4)` and `z-schema` validator factories used by the unit test.


#### tv4
```
var tv4 = require('tv4');

var tv4Factory = function (schema, options) {
  return {
    validate: function (json) {
      try {
        var valid = tv4.validate(json, schema);
        return valid ? { valid: true } : { valid: false, errors: [ tv4.error ] };
      } catch (err) {
        return { valid: false, errors: [err.message] };
      }
    }
  };
};
```

#### ZSchema

```
var ZSchema = require('z-schema');

var zschemaFactory = function (schema, options) {
  var zschema = new ZSchema(options);

  return {
    validate: function (json) {
      try {
        var valid = zschema.validate(json, schema);
        return valid ? { valid: true } : { valid: false, errors: zschema.getLastErrors() };
      } catch (err) {
        return { valid: false, errors: [err.message] };
      }
    }
  };
};
```

#### Testing the Validator

Using a validator factory as described above, you can test it as follows.

```
var testSuite = require('@atomiq/json-schema-test-suite');
var factory = require('YOUR-FACTORY');

var options = { ... };

var tests = testSuite.testSync(factory, options);
```

The `tests` return value is as described previously in the Usage section, with an additional property for each test object that corresponds to the test result:

```
{
  description: 'additionalItems as schema',
  schema: {
    items: [{}],
    additionalItems: { type: "integer" }
  },
  tests: [
    {
      description: "additional items match schema",
      data: [ null, 2, 3, 4 ],
      valid: true,
      result: {
        valid: false,
        errors: [ ... ]
      }
    },
    {
      description: "additional items do not match schema",
      data: [ null, 2, 3, "foo" ],
      valid: false,
      result: {
        true
      }
    }
  ]
}
```

### Unit Tests

You can run `npm test` from a clone of the repo or browse the unit test source [here](https://github.com/atomiqio/JSON-Schema-Test-Suite/blob/node/test/test.js) for examples using both [tv4](https://github.com/geraintluff/tv4) and [z-schema](https://github.com/zaggino/z-schema).


---


JSON Schema Test Suite [![Build Status](https://travis-ci.org/json-schema/JSON-Schema-Test-Suite.png?branch=develop)](https://travis-ci.org/json-schema/JSON-Schema-Test-Suite)

This repository contains a set of JSON objects that implementors of JSON Schema
validation libraries can use to test their validators.

It is meant to be language agnostic and should require only a JSON parser.

The conversion of the JSON objects into tests within your test framework of
choice is still the job of the validator implementor.

Structure of a Test
-------------------

If you're going to use this suite, you need to know how tests are laid out. The
tests are contained in the `tests` directory at the root of this repository.

Inside that directory is a subdirectory for each draft or version of the
schema.

If you look inside the draft directory, there are a number of `.json` files,
which logically group a set of test cases together. Often the grouping is by
property under test, but not always, especially within optional test files
(discussed below).

Inside each `.json` file is a single array containing objects. It's easiest to
illustrate the structure of these with an example:

```json
    {
        "description": "the description of the test case",
        "schema": {"the schema that should" : "be validated against"},
        "tests": [
            {
                "description": "a specific test of a valid instance",
                "data": "the instance",
                "valid": true
            },
            {
                "description": "another specific test this time, invalid",
                "data": 15,
                "valid": false
            }
        ]
    }
```

So a description, a schema, and some tests, where tests is an array containing
one or more objects with descriptions, data, and a boolean indicating whether
they should be valid or invalid.

Coverage
--------

Drafts 03, 04, 06, and 07 should have full coverage, with drafts 06 and 07
being considered current and actively supported.  Bug fixes will be made as
needed for draft-04 as it is still the most widely used, while draft-03
is long since deprecated.

If you see anything missing from the current supported drafts, or incorrect
on any draft still accepting bug fixes, please file an issue or submit a PR.

Who Uses the Test Suite
-----------------------

This suite is being used by:

### Coffeescript ###

* [jsck](https://github.com/pandastrike/jsck)

### C++ ###

* [Modern C++ JSON schema validator](https://github.com/pboettch/json-schema-validator)

### Dart ###

* [json_schema](https://github.com/patefacio/json_schema) 

### Elixir ###

* [ex_json_schema](https://github.com/jonasschmidt/ex_json_schema)

### Erlang ###

* [jesse](https://github.com/for-GET/jesse)

### Go ###

* [gojsonschema](https://github.com/sigu-399/gojsonschema) 
* [validate-json](https://github.com/cesanta/validate-json)

### Haskell ###

* [aeson-schema](https://github.com/timjb/aeson-schema)
* [hjsonschema](https://github.com/seagreen/hjsonschema)

### Java ###

* [json-schema-validator](https://github.com/daveclayton/json-schema-validator)
* [everit-org/json-schema](https://github.com/everit-org/json-schema)
* [networknt/json-schema-validator](https://github.com/networknt/json-schema-validator)
* [Justify](https://github.com/leadpony/justify)

### JavaScript ###

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

### Node.js ###

The JSON Schema Test Suite is also available as an
[npm](https://www.npmjs.com/package/json-schema-test-suite) package.
Node-specific support is maintained on the [node branch](https://github.com/json-schema-org/JSON-Schema-Test-Suite/tree/node).
See [NODE-README.md](https://github.com/json-schema-org/JSON-Schema-Test-Suite/blob/node/NODE-README.md)
for more information.

### .NET ###

* [Newtonsoft.Json.Schema](https://github.com/JamesNK/Newtonsoft.Json.Schema)
* [Manatee.Json](https://github.com/gregsdennis/Manatee.Json)

### PHP ###

* [json-schema](https://github.com/justinrainbow/json-schema)
* [json-guard](https://github.com/thephpleague/json-guard)

### Python ###

* [jsonschema](https://github.com/Julian/jsonschema)
* [fastjsonschema](https://github.com/seznam/python-fastjsonschema)

### Ruby ###

* [json-schema](https://github.com/hoxworth/json-schema)

### Rust ###

* [valico](https://github.com/rustless/valico)

### Swift ###

* [JSONSchema](https://github.com/kylef/JSONSchema.swift)

### Clojure ###

* [json-schema](https://github.com/tatut/json-schema)

### PostgreSQL ###

* [postgres-json-schema](https://github.com/gavinwahl/postgres-json-schema)
* [is_jsonb_valid](https://github.com/furstenheim/is_jsonb_valid)

If you use it as well, please fork and send a pull request adding yourself to
the list :).

Contributing
------------

If you see something missing or incorrect, a pull request is most welcome!

There are some sanity checks in place for testing the test suite. You can run
them with `bin/jsonschema_suite check && npm test` or `tox && npm test`. They will be run automatically by
[Travis CI](https://travis-ci.org/) as well.
