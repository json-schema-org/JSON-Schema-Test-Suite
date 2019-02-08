/* global describe it */
'use strict'

const Ajv = require('ajv')
const assert = require('assert')
const glob = require('glob')
const jsonSchemaTest = require('json-schema-test')
const util = require('util')
const testsuite = require('./index.js')

const drafts = [
  'draft3',
  'draft4',
  'draft6'
]

const loadFiles = (draft, globPattern) => {
  if (typeof globPattern === 'string') {
    return glob.sync(util.format(globPattern, draft))
  } else {
    return glob.sync(util.format(globPattern.glob, draft), {
      ignore: util.format(globPattern.ignore, draft)
    })
  }
}

const makeErrorMessage = (name) => {
  return `the actual number of test groups was expected match the number of ${name} json files`
}

const compareCount = (draft, globPattern, filter, name) => {
  const tests = testsuite.loadSync({ filter: filter, draft: draft })
  const files = loadFiles(draft, globPattern)

  assert.strictEqual(
    tests.length,
    files.length,
    makeErrorMessage(name)
  )
}

describe('verify test suite loads all json test files', function () {
  const allPattern = './tests/%s/**/*.json'
  const requiredPattern = { glob: './tests/%s/**/*.json', ignore: './tests/%s/optional/*.json' }
  const optionalPattern = './tests/%s/optional/*.json'
  const minPattern = './tests/%s/**/min*.json'

  const testPlans = [
    { name: 'all', globPattern: allPattern },
    { name: 'required', globPattern: requiredPattern, filter: testsuite.requiredOnlyFilter },
    { name: 'optional', globPattern: optionalPattern, filter: testsuite.optionalOnlyFilter },
    { name: '"min"-prefixed', globPattern: minPattern, filter: function (file) { return /^min/.test(file) } }
  ]

  // for the combination of draft directories and test plans, create a test case
  // and verify the number of tests returned by the test suite is equal to the actual
  // number of files that match the glob pattern.
  drafts.forEach(function (draft) {
    testPlans.forEach(function (pt) {
      it(`The number of ${draft} test groups should match the number of ${pt.name} json files`, function () {
        compareCount(draft, pt.globPattern, pt.filter, pt.name)
      })
    })
  })

  // test helper functions loadRequiredSync and loadOptionalSync
  drafts.forEach(function (draft) {
    it(`should load required ${draft} tests`, function () {
      const tests = testsuite.loadRequiredSync(draft)
      const files = loadFiles(draft, requiredPattern)

      assert.strictEqual(
        tests.length,
        files.length,
        makeErrorMessage('required')
      )
    })

    it(`should load optional ${draft} tests`, function () {
      const tests = testsuite.loadOptionalSync(draft)
      const files = loadFiles(draft, optionalPattern)

      assert.strictEqual(
        tests.length,
        files.length,
        makeErrorMessage('optional')
      )
    })
  })
})

const refs = {
  'http://localhost:1234/integer.json': require('../remotes/integer.json'),
  'http://localhost:1234/subSchemas.json': require('../remotes/subSchemas.json'),
  'http://localhost:1234/folder/folderInteger.json': require('../remotes/folder/folderInteger.json'),
  'http://localhost:1234/name.json': require('../remotes/name.json')
}

const SKIP = {
  4: ['optional/zeroTerminatedFloats'],
  7: [
    'format/idn-email',
    'format/idn-hostname',
    'format/iri',
    'format/iri-reference',
    'optional/content'
  ]
};

[4, 6, 7].forEach((draft) => {
  let ajv
  if (draft === 7) {
    ajv = new Ajv({ format: 'full' })
  } else {
    const schemaId = draft === 4 ? 'id' : '$id'
    ajv = new Ajv({ format: 'full', meta: false, schemaId })
    ajv.addMetaSchema(require(`ajv/lib/refs/json-schema-draft-0${draft}.json`))
    ajv._opts.defaultMeta = `http://json-schema.org/draft-0${draft}/schema#`
  }
  for (const uri in refs) ajv.addSchema(refs[uri], uri)

  jsonSchemaTest(ajv, {
    description: `Test suite draft-0${draft}`,
    suites: { tests: `../tests/draft${draft}/{**/,}*.json` },
    skip: SKIP[draft],
    cwd: __dirname,
    hideFolder: '../tests/'
  })
})
