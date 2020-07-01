'use strict';

const Ajv = require('ajv');
const jsonSchemaTest = require('json-schema-test');

const refs = [
  require('./remotes/integer.json'),
  require('./remotes/subSchemas.json'),
  require('./remotes/folder/folderInteger.json'),
  require('./remotes/name.json'),
  require('./remotes/name-defs.json')
];

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
  let ajv;
  if (draft == 7) {
    ajv = new Ajv({format: 'full'});
  } else {
    const schemaId = draft == 4 ? 'id' : '$id';
    ajv = new Ajv({format: 'full', meta: false, schemaId});
    ajv.addMetaSchema(require(`ajv/lib/refs/json-schema-draft-0${draft}.json`));
    ajv._opts.defaultMeta = `http://json-schema.org/draft-0${draft}/schema#`;
  }
  for (const ref of refs) ajv.addSchema(ref, ref.$id);

  jsonSchemaTest(ajv, {
    description: `Test suite draft-0${draft}`,
    suites: {tests: `./tests/draft${draft}/{**/,}*.json`},
    skip: SKIP[draft],
    cwd: __dirname,
    hideFolder: 'tests/'
  });
});
