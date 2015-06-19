var assert = require('assert'),
    glob = require('glob'),
    util = require('util'),
    testsuite = require('..');

describe('verify test suite loads all json test files', function () {
  var testMessage = 'The number of %s test groups should match the number of %s json files';
  var errorMessage = 'the actual number of test groups was expected match the number of %s json files';

  var drafts = ['draft3', 'draft4'];

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
    var tests = testsuite.loadSync(filter, draft);
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

describe('[non remote ref tests]', function () {
  var tv4 = require('tv4');

  //var tests = testsuite.loadSync().filter(function(test) {
  //  return test.group != 'refRemote';
  //});

  var tests = testsuite.loadSync(function (file) {
    return file != 'refRemote.json';
  });

  tests.forEach(function (test) {
    describe(test.group, function () {
      test.schemas.forEach(function (schema) {
        describe(schema.description, function () {
          schema.tests.forEach(function (testCase) {
            it(testCase.description, function () {
              var valid = tv4.validate(testCase.data, schema.schema);
              assert.equal(valid, testCase.valid);
            });
          });
        });
      });
    })
  });

});