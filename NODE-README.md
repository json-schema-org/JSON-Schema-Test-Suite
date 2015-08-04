For Node.js Developers
======================

[![NPM](https://nodei.co/npm/json-schema-test-suite.png?compact=true)](https://nodei.co/npm/json-schema-test-suite/)

The JSON Schema Test Suite is meant to be a language agnostic test suite for testing JSON Schema validation libraries.
It is generally added to projects as a git submodule. However, to simplify things for Node.js developers, the test suite has also
been made available as an [npm package](https://www.npmjs.com/package/json-schema-test-suite).

    npm install json-schema-test-suite

Node-specific support for JSON Schema Test Suite is maintained on the repo's [node branch]
(https://github.com/json-schema/JSON-Schema-Test-Suite/tree/node).

### Usage:

There are a number of ways to load tests from the suite:

    var testSuite = require('json-schema-test-suite');

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
  name:    'additionalItems',
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
var testSuite = require('json-schema-test-suite');

var tests = testSuite.testSync(factory);
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

You can run mocha unit tests from a clone of the repo or browse the unit test source [here](https://github.com/atomiqio/JSON-Schema-Test-Suite/blob/node/test/test.js) for examples using both [tv4](https://github.com/geraintluff/tv4) and [z-schema](https://github.com/zaggino/z-schema).

    npm install
    npm test

### Generating JSON Schema

[json-schema-builder](https://github.com/atomiqio/json-schema-builder) is a
fluent JavaScript API for generating syntactically correct JSON Schema that
provides an alternative to writing JSON Schema documents by hand.
