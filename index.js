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

function testSync(validator, filter, draft) {
  var tests = loadTestSuiteSync(filter, draft);
}

/**
 * Returns tests specified by draft and filtered by filter argument
 * @param filter a function that returns true if the file (or directory) should be included; see exported requiredOnlyFilter
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
