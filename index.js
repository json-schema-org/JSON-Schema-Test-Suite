var fs = require('fs'),
    path = require('path');

module.exports = {
  loadSync: loadTestSuiteSync,

  requiredOnlyFilter: function(file, parent, optional) {
    return !optional;
  },

  optionalOnlyFilter: function(file, parent, optional) {
    return optional;
  }
}

/**
 * Returns tests specified by draft and filtered by filter argument
 * @param draft 'draft3' | 'draft4' (default)
 * @param filter a function that returns true if the file (or directory) should be included; see exported requiredOnlyFilter
 * @returns []
 */
function loadTestSuiteSync(draft, filter) {
  return loadTestsSync([], path.join(__dirname, 'tests', draft || 'draft4'), filter);
}

/**
 * Returns test suite array
 * @param tests array to add tests to, will be returned
 * @param draftPath path to draft directory
 * @param filter 'required' | 'optional' | 'all' (default)
 * @param markOptional set to true when recursing into optional directory
 * @returns []
 */
function loadTestsSync(tests, draftPath, filter, parent, markOptional) {
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
      loadTestsSync(tests, path.join(draftPath, file), filter, file, markOptional || file == 'optional');
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
