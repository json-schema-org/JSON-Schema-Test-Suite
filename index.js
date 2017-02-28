'use strict';

var Ajv = require('ajv');
var jsonSchemaTest = require('json-schema-test');
var glob = require('glob');
var assert = require('assert');

var ajv = new Ajv({addUsedSchema: false});
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));

var refs = {
  'http://localhost:1234/integer.json': require('./remotes/integer.json'),
  'http://localhost:1234/subSchemas.json': require('./remotes/subSchemas.json'),
  'http://localhost:1234/folder/folderInteger.json': require('./remotes/folder/folderInteger.json')
};

for (var uri in refs) ajv.addSchema(refs[uri], uri);

jsonSchemaTest(ajv, {
  description: 'Test suite',
  suites: {
    'draft-04': './tests/draft4/{**/,}*.json',
    'draft-06': './tests/draft6/{**/,}*.json'
  },
  skip: [ 'optional/zeroTerminatedFloats' ],
  cwd: __dirname,
  hideFolder: 'tests/'
});
