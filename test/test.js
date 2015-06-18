var assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    glob = require('glob'),
    util = require('util'),
    suite = require('..');

describe('verify test suite loads all json test files', function () {

  var testMessage = 'The number of %s test groups should match the number of %s json files';
  var errorMessage = 'expected the number of test groups to match the number of %s json files';

  var drafts = [ 'draft3', 'draft4' ];

  var allPattern = './tests/%s/**/*.json';
  var requiredPattern = './tests/%s/**/*.json';
  var optionalPattern = './tests/%s/**/*.json';

  var patternTests = [
    { pattern: allPattern, filter: 'ALL' },
    { pattern: requiredPattern, filter: 'REQUIRED' },
    { pattern: optionalPattern, filter: 'OPTIONAL' }
  ];

  function compareCount(draft, pattern, filter) {
    it (util.format(testMessage, draft, filter), function() {
      var tests = suite.loadSync(draft);
      var files = glob.sync(util.format(pattern, draft));

      assert.equal(tests.length, files.length, util.format(errorMessage, filter));
    });
  }

  drafts.forEach(function(draft) {
    patternTests.forEach(function(pt) {
      compareCount(draft, pt.pattern, pt.filter);
    })
  });
});

describe('[non remote ref tests]', function() {
  var tv4 = require('tv4');

  var tests = suite.loadSync('draft4').filter(function(test) {
    return test.group != 'refRemote';
  });

  tests.forEach(function(test) {
    describe(test.group, function() {
      test.schemas.forEach(function(schema) {
        describe(schema.description, function() {
          schema.tests.forEach(function(testCase) {
            it (testCase.description, function() {
              var valid = tv4.validate(testCase.data, schema.schema);
              assert.equal(valid, testCase.valid);
            });
          });
        });
      });
    })
  });

});