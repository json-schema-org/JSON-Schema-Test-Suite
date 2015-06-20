var fs = require('fs'),
    path = require('path');

module.exports = {
  testSync: testSync,

  loadSync: loadTestSuiteSync,

  loadRequiredSync: function (draft) {
    return loadTestSuiteSync(requiredOnlyFilter, draft);
  },

  loadOptionalSync: function (draft) {
    return loadTestSuiteSync(optionalOnlyFilter, draft);
  },

  requiredOnlyFilter: requiredOnlyFilter,

  optionalOnlyFilter: optionalOnlyFilter
}

function requiredOnlyFilter(file, parent, optional) {
  return !optional;
}

function optionalOnlyFilter(file, parent, optional) {
  return optional;
}

/**
 * Returns tests specified by draft and filtered by filter argument
 * @param filter a function that returns true if the file (or directory)
 *        should be included; the function is passed 3 arguments
 *        (file, parent, optional); optional is true if the file is
 *        the optional directory or any file under it.
 *        see exported requiredOnlyFilter
 * @param draft 'draft3' | 'draft4' (default)
 * @returns []
 */
function loadTestSuiteSync(filter, draft) {
  return loadTestsSync([], filter, path.join(__dirname, 'tests', draft || 'draft4'));
}

/**
 * Returns test suite array
 * @param tests array to add tests to, will be returned
 * @param filter 'required' | 'optional' | 'all' (default)
 * @param draftPath path to draft directory
 * @param markOptional set to true when recursing into optional directory
 * @returns []
 */
function loadTestsSync(tests, filter, draftPath, parent, markOptional) {
  markOptional = !!markOptional;

  var testFiles = fs.readdirSync(draftPath);

  testFiles.filter(function (file) {
    // markOptional might not be set at this point, so still need to check if the file is named 'optional'
    return filter ? filter(file, parent, markOptional || file == 'optional') : true;
  }).forEach(function (file) {
    var filePath = path.join(draftPath, file);
    var stats = fs.lstatSync(filePath);

    if (stats.isDirectory()) {
      // once markOptional is set after entering an 'optional' directory, no need to reevaluate
      loadTestsSync(tests, filter, path.join(draftPath, file), parent, markOptional || file == 'optional');
    } else if (stats.isFile()) {
      var end = file.indexOf('.json');
      if (end > 0) {
        tests.push({
          group: file.substring(0, end),
          file: file,
          path: filePath,
          optional: markOptional,
          schemas: require(filePath)
        });
      }
    }
  });

  return tests;
}

/**
 * Applies the validator function against all the tests that match the draft version and pass the filter
 * @param validatorFactory a function that takes 2 arguments (schema, options); if the schema argument is
 *        a string, it will parsed as JSON. The function should returns an object with a validate method
 *        that takes 1 argument (json). The validate method should return an object; if there were
 *        validation errors, the object should have a valid property that is true or false depending on
 *        whether there are validation errors, and an errors property with an array for the validation
 *        errors, if any. The schema and the JSON test data will be obtained from the test suite.
 * @param options an optional options argument that will be provided to validatorFactory
 * @param filter a function that returns true if the file (or directory)
 *        should be included; the function is passed 3 arguments
 *        (file, parent, optional); optional is true if the file is
 *        the optional directory or any file under it.
 *        see exported requiredOnlyFilter
 * @param draft 'draft3' | 'draft4' (default)
 */
function testSync(validatorFactory, options, filter, draft) {
  if (typeof options == 'function') {
    draft = filter;
    filter = options;
    options = {};
  }

  var tests = loadTestSuiteSync(filter, draft);

  tests.forEach(function (test) {
    test.schemas.forEach(function (schema) {
      var validator = validatorFactory(schema.schema, options);
      schema.tests.forEach(function (testCase) {
        testCase.result = validator.validate(testCase.data);
      });
    });
  });

  return tests;

}

