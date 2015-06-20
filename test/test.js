var assert = require('assert'),
    glob = require('glob'),
    util = require('util'),
    testsuite = require('..');

var drafts = [ /*'draft3',*/ 'draft4' ];

describe('verify test suite loads all json test files', function () {
  var testMessage = 'The number of %s test groups should match the number of %s json files';
  var errorMessage = 'the actual number of test groups was expected match the number of %s json files';

  var allPattern = './tests/%s/**/*.json';
  var requiredPattern = { glob: './tests/%s/**/*.json', ignore: './tests/%s/optional/*.json' };
  var optionalPattern = './tests/%s/optional/*.json';
  var minPattern = './tests/%s/**/min*.json';

  var testPlans = [
    { name: 'all', globPattern: allPattern },
    { name: 'required', globPattern: requiredPattern, filter: testsuite.requiredOnlyFilter },
    { name: 'optional', globPattern: optionalPattern, filter: testsuite.optionalOnlyFilter },
    { name: '"min"-prefixed', globPattern: minPattern, filter: function (file) { return /^min/.test(file); } }
  ];

  function loadFiles(draft, globPattern) {
    if (typeof globPattern == 'string') {
      return glob.sync(util.format(globPattern, draft));
    } else {
      return glob.sync(util.format(globPattern.glob, draft), {
        ignore: util.format(globPattern.ignore, draft)
      });
    }
  }

  function compareCount(draft, globPattern, filter, name) {
    var tests = testsuite.loadSync({ filter: filter, draft: draft });
    var files = loadFiles(draft, globPattern);

    assert.equal(tests.length, files.length, util.format(errorMessage, name));
  }

  // for the combination of draft directories and test plans, create a test case
  // and verify the number of tests returned by the test suite is equal to the actual
  // number of files that match the glob pattern.
  drafts.forEach(function (draft) {
    testPlans.forEach(function (pt) {
      it(util.format(testMessage, draft, pt.name), function () {
        compareCount(draft, pt.globPattern, pt.filter, pt.name);
      });
    })
  });

  // test helper functions loadRequiredSync and loadOptionalSync
  drafts.forEach(function (draft) {
    it(util.format('should load required %s tests', draft), function () {
      var tests = testsuite.loadRequiredSync(draft);
      var files = loadFiles(draft, requiredPattern);

      assert.equal(tests.length, files.length, util.format(errorMessage, 'required'));
    })

    it(util.format('should load optional %s tests', draft), function () {
      var tests = testsuite.loadOptionalSync(draft);
      var files = loadFiles(draft, optionalPattern);

      assert.equal(tests.length, files.length, util.format(errorMessage, 'optional'));
    })
  });

});

describe('validator tests', function() {
  var validatorResults = [];

  after(function() {
    validatorResults.forEach(function(validator) {
      console.log('\n******************************');
      console.log('validator: %s (%s)', validator.name, validator.draft);
      console.log('pass: ' + validator.results.pass);
      console.log('fail: ' + validator.results.fail);
    });
  });

  describe('tv4 validator tests', function () {
    var tv4 = require('tv4');

    var tv4Factory = function (schema, options) {
      if (typeof schema == 'string') {
        schema = JSON.parse(text);
      }

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

    // create a test suite for each draft
    drafts.forEach(function (draft) {
      var validatorResult = { name: 'tv4', draft: draft, results: { pass: 0, fail: 0 }};
      validatorResults.push(validatorResult);

      describe(draft, function () {

        var tests = testsuite.testSync(tv4Factory, {}, void 0, draft);
        tests.forEach(function (test) {
          describe(test.group, function () {
            test.schemas.forEach(function (schema) {
              describe(schema.description, function () {
                schema.tests.forEach(function (testCase) {
                  it(testCase.description, function () {
                    var result = testCase.result;
                    if (result.valid === testCase.valid) {
                      validatorResult.results.pass++;
                    } else {
                      validatorResult.results.fail++;
                    }

                    assert.equal(result.valid, testCase.valid);
                  });
                });
              });
            });
          })
        });
      });
    });

  });

  describe('z-schema validator tests', function () {
var ZSchema = require('z-schema');

var zschemaFactory = function (schema, options) {
  var zschema = new ZSchema(options);

  if (typeof schema == 'string') {
    schema = JSON.parse(text);
  }

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

    // create a test suite for each draft
    drafts.forEach(function (draft) {
      var validatorResult = { name: 'zschema', draft: draft, results: { pass: 0, fail: 0 }};
      validatorResults.push(validatorResult);

      describe(draft, function () {

        var tests = testsuite.testSync(zschemaFactory, {}, void 0, draft);
        tests.forEach(function (test) {
          describe(test.group, function () {
            test.schemas.forEach(function (schema) {
              describe(schema.description, function () {
                schema.tests.forEach(function (testCase) {
                  it(testCase.description, function () {
                    var result = testCase.result;
                    if (result.valid === testCase.valid) {
                      validatorResult.results.pass++;
                    } else {
                      validatorResult.results.fail++;
                    }

                    assert.equal(result.valid, testCase.valid);
                  });
                });
              });
            });
          })
        });
      });
    });

  });
});

