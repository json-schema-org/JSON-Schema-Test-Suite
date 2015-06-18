var fs = require('fs'),
    path = require('path');

exports.loadSync = loadTestSuiteSync;

/**
 * Returns tests specified by draft and filtered by filter argument
 * @param draft 'draft3' | 'draft4' (default)
 * @param filter 'required' | 'optional' | 'all' (default)
 * @returns []
 */
function loadTestSuiteSync(draft, filter) {
  return loadTestsSync([], path.join(__dirname, 'tests', draft || 'draft4'));
}

/**
 * Returns test suite array
 * @param tests array to add tests to, will be returned
 * @param draftPath path to draft directory
 * @param filter 'required' | 'optional' | 'all' (default)
 * @param markOptional set to true when recursing into optional directory
 * @returns []
 */
function loadTestsSync(tests, draftPath, filter, markOptional) {
  filter = filter || 'all';
  markOptional = !!markOptional;

  var testFiles = fs.readdirSync(draftPath);

  testFiles.filter(function (file) {
    return ((filter == 'all')
      || (filter != 'required' && (markOptional || file == 'optional'))
      || (filter != 'optional' && !markOptional));
  }).forEach(function (file) {
    var filePath = path.join(draftPath, file);
    var stats = fs.lstatSync(filePath);

    if (stats.isDirectory() && file == 'optional') {
      loadTestsSync(tests, path.join(draftPath, file), filter, true);
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
