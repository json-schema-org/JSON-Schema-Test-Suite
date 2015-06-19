var assert = require('assert'),
    glob = require('glob'),
    util = require('util'),
    suite = require('..');

describe('verify test suite loads all json test files', function () {

  var testMessage = 'The number of %s test groups should match the number of %s json files';
  var errorMessage = 'the actual number of test groups was expected match the number of %s json files';

  var drafts = [ 'draft3', 'draft4' ];

  var allPattern = './tests/%s/**/*.json';
  var requiredPattern = { glob: './tests/%s/**/*.json', ignore: './tests/%s/optional/*.json' };
  var optionalPattern = './tests/%s/optional/*.json';
  var minPattern = './tests/%s/**/min*.json';

  var patternTests = [
    { name: 'all', globPattern: allPattern },
    { name: 'required', globPattern: requiredPattern, filter: suite.requiredOnlyFilter },
    { name: 'optional', globPattern: optionalPattern, filter: suite.optionalOnlyFilter },
    { name: '"min"-prefixed', globPattern: minPattern, filter: function(file) {
      return /^min/.test(file);
    }}
  ];

  function compareCount(draft, globPattern, filter, name) {
    it (util.format(testMessage, draft, name), function() {
      var tests = suite.loadSync(draft, filter);
      var files;

      if (typeof globPattern == 'string') {
        files = glob.sync(util.format(globPattern, draft));
      } else {
        files = glob.sync(util.format(globPattern.glob, draft), {
          ignore: util.format(globPattern.ignore, draft)
        });
      }

      console.log('actual (suite): %d, expected (files): %d', tests.length, files.length);
      assert.equal(tests.length, files.length, util.format(errorMessage, name));
    });
  }

  drafts.forEach(function(draft) {
    patternTests.forEach(function(pt) {
      compareCount(draft, pt.globPattern, pt.filter, pt.name);
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