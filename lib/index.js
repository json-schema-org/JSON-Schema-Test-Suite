var fs = require('fs')
var path = require('path')

module.exports = {
  testSync: testSync,

  loadSync: loadTestSuiteSync,

  draft3: function (filter) {
    return loadTestSuiteSync({ filter: filter, draft: 'draft3' })
  },

  draft4: function (filter) {
    return loadTestSuiteSync({ filter: filter, draft: 'draft4' })
  },

  loadAllSync: function (draft) {
    return loadTestSuiteSync({ draft: draft })
  },

  loadRequiredSync: function (draft) {
    return loadTestSuiteSync({ filter: requiredOnlyFilter, draft: draft })
  },

  loadOptionalSync: function (draft) {
    return loadTestSuiteSync({ filter: optionalOnlyFilter, draft: draft })
  },

  requiredOnlyFilter: requiredOnlyFilter,

  optionalOnlyFilter: optionalOnlyFilter
}

/**
 * convenience filter for required tests
 */
function requiredOnlyFilter (file, parent, optional) {
  return !optional
}

/**
 * convenience filter for optional tests
 */
function optionalOnlyFilter (file, parent, optional) {
  return optional
}

/**
 * Returns tests specified by draft and filtered by filter argument
 * @param filter a function that returns true if the file (or directory)
 *        should be included; the function is passed 3 arguments
 *        (file, parent, optional); optional is true if the file is
 *        the optional directory or any file under it.
 *        see exported requiredOnlyFilter
 * @param options an object with the following properties
 *        draft: 'draft3' | 'draft4' (default)
 * @returns []
 */
function loadTestSuiteSync (options) {
  var config = Object.assign({}, options)
  config.path = path.join(__dirname, '../tests', config.draft || 'draft4')

  return loadTestsSync(config)
}

/**
 * Returns test suite array
 * @param config an object with the following properties
 *        path: full path to the current test directory
 *        filter: (optional) a function that returns true if the file (or directory)
 *                should be included; the function is passed 3 arguments
 *                (file, parent, optional); optional is true if the file is
 *                the optional directory or any file under it.
 *        parent: the parent directory (undefined for the root of the tests directory)
 *        optional: set to true when recursing into optional directory
 * @returns []
 */
function loadTestsSync (config) {
  var filter = config.filter
  var testPath = config.path
  var parent = config.parent
  var optional = !!config.optional

  if (!testPath) throw new Error('missing path to test directory')

  var tests = []
  var testFiles = fs.readdirSync(testPath)

  testFiles.filter(function (file) {
    // optional might not be set at this point, so need to check if the file is named 'optional'
    // (meaning it's the actual optional directory)
    return filter ? filter(file, parent, optional || file === 'optional') : true
  }).forEach(function (file) {
    var filePath = path.join(testPath, file)
    var stats = fs.lstatSync(filePath)

    if (stats.isDirectory()) {
      // once optional is set after entering an 'optional' directory, no need to reevaluate
      tests = tests.concat(loadTestsSync({ filter: filter, path: path.join(testPath, file), parent: parent, optional: optional || file === 'optional' }))
    } else if (stats.isFile()) {
      var end = file.indexOf('.json')
      if (end > 0) {
        tests.push({
          name: file.substring(0, end),
          file: file,
          path: filePath,
          optional: optional,
          schemas: require(filePath)
        })
      }
    }
  })

  return tests
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
function testSync (validatorFactory, options, filter, draft) {
  if (typeof options === 'function') {
    draft = filter
    filter = options
    options = {}
  }

  var tests = loadTestSuiteSync({ filter: filter, draft: draft })

  tests.forEach(function (test) {
    test.schemas.forEach(function (schema) {
      var validator = validatorFactory(schema.schema, options)
      schema.tests.forEach(function (testCase) {
        testCase.result = validator.validate(testCase.data)
      })
    })
  })

  return tests
}
