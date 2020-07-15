#!/usr/bin/env node

'use strict'

const string = name => JSON.stringify(name)
const inline = name => JSON.stringify(name).slice(1, -1)

const makeNumber = name => `
        "schema": {
            "properties": { ${string(name)}: { "type": "number" } }
        },
        "tests": [
            { "description": "Valid on numbers", "data": 0, "valid": true },
            { "description": "Valid on arrays", "data": [], "valid": true },
            { "description": "Valid if not present", "data": {}, "valid": true },
            { "description": "Valid if correct", "data": { ${string(name)}: 10 }, "valid": true },
            { "description": "Invalid if incorrect (string)", "data": { ${string(name)}: "foo" }, "valid": false },
            { "description": "Invalid if incorrect (empty string)", "data": { ${string(name)}: "" }, "valid": false },
            { "description": "Invalid if incorrect (boolean true)", "data": { ${string(name)}: true }, "valid": false },
            { "description": "Invalid if incorrect (boolean false)", "data": { ${string(name)}: false }, "valid": false },
            { "description": "Invalid if incorrect (array)", "data": { ${string(name)}: [42] }, "valid": false },
            { "description": "Invalid if incorrect (empty array)", "data": { ${string(name)}: [] }, "valid": false },
            { "description": "Invalid if incorrect (object)", "data": { ${string(name)}: {} }, "valid": false }
        ]`.trim()
const makeObject = name => `
        "schema": {
            "properties": { ${string(name)}: { "type": "object" } }
        },
        "tests": [
            { "description": "Valid on numbers", "data": 0, "valid": true },
            { "description": "Valid on arrays", "data": [], "valid": true },
            { "description": "Valid if not present", "data": {}, "valid": true },
            { "description": "Valid if correct", "data": { ${string(name)}: {} }, "valid": true },
            { "description": "Invalid if incorrect (string)", "data": { ${string(name)}: "foo" }, "valid": false },
            { "description": "Invalid if incorrect (empty string)", "data": { ${string(name)}: "" }, "valid": false },
            { "description": "Invalid if incorrect (boolean true)", "data": { ${string(name)}: true }, "valid": false },
            { "description": "Invalid if incorrect (boolean false)", "data": { ${string(name)}: false }, "valid": false },
            { "description": "Invalid if incorrect (array)", "data": { ${string(name)}: [42] }, "valid": false },
            { "description": "Invalid if incorrect (empty array)", "data": { ${string(name)}: [] }, "valid": false },
            { "description": "Invalid if incorrect (zero number)", "data": { ${string(name)}: 0 }, "valid": false },
            { "description": "Invalid if incorrect (number)", "data": { ${string(name)}: 42 }, "valid": false }
        ]`.trim()
const makeRequired = name => `
        "schema": {
            "required": [${string(name)}]
        },
        "tests": [
            { "description": "Valid on numbers", "data": 0, "valid": true },
            { "description": "Valid on arrays", "data": [], "valid": true },
            { "description": "Invalid if not present", "data": {}, "valid": false },
            { "description": "Valid if present (string)", "data": { ${string(name)}: "foo" }, "valid": true },
            { "description": "Valid if present (empty string)", "data": { ${string(name)}: "" }, "valid": true },
            { "description": "Valid if present (boolean true)", "data": { ${string(name)}: true }, "valid": true },
            { "description": "Valid if present (boolean false)", "data": { ${string(name)}: false }, "valid": true },
            { "description": "Valid if present (array)", "data": { ${string(name)}: [42] }, "valid": true },
            { "description": "Valid if present (empty array)", "data": { ${string(name)}: [] }, "valid": true },
            { "description": "Valid if present (object)", "data": { ${string(name)}: {} }, "valid": true },
            { "description": "Valid if present (zero number)", "data": { ${string(name)}: 0 }, "valid": true },
            { "description": "Valid if present (number)", "data": { ${string(name)}: 42 }, "valid": true }
        ]`.trim()
const makeDefault = name => `
        "schema": {
            "properties": { ${string(name)}: { "default": "foo" } }
        },
        "tests": [
            { "description": "Valid on numbers", "data": 0, "valid": true },
            { "description": "Valid on arrays", "data": [], "valid": true },
            { "description": "Valid if not present", "data": {}, "valid": true },
            { "description": "Valid if present (string)", "data": { ${string(name)}: "foo" }, "valid": true },
            { "description": "Valid if present (empty string)", "data": { ${string(name)}: "" }, "valid": true },
            { "description": "Valid if present (boolean true)", "data": { ${string(name)}: true }, "valid": true },
            { "description": "Valid if present (boolean false)", "data": { ${string(name)}: false }, "valid": true },
            { "description": "Valid if present (array)", "data": { ${string(name)}: [42] }, "valid": true },
            { "description": "Valid if present (empty array)", "data": { ${string(name)}: [] }, "valid": true },
            { "description": "Valid if present (object)", "data": { ${string(name)}: {} }, "valid": true },
            { "description": "Valid if present (zero number)", "data": { ${string(name)}: 0 }, "valid": true },
            { "description": "Valid if present (number)", "data": { ${string(name)}: 42 }, "valid": true }
        ]`.trim()
const makePropertyDefault = (name, parent) => `
        "schema": {
            "properties": { ${string(parent)}: { "properties": { ${string(name)}: { "default": "foo" } } } }
        },
        "tests": [
            { "description": "Valid on numbers", "data": 0, "valid": true },
            { "description": "Valid on arrays", "data": [], "valid": true },
            { "description": "Valid if not present", "data": {}, "valid": true },
            { "description": "Valid if present (string)", "data": { ${string(name)}: "foo" }, "valid": true },
            { "description": "Valid if present (empty string)", "data": { ${string(name)}: "" }, "valid": true },
            { "description": "Valid if present (boolean true)", "data": { ${string(name)}: true }, "valid": true },
            { "description": "Valid if present (boolean false)", "data": { ${string(name)}: false }, "valid": true },
            { "description": "Valid if present (array)", "data": { ${string(name)}: [42] }, "valid": true },
            { "description": "Valid if present (empty array)", "data": { ${string(name)}: [] }, "valid": true },
            { "description": "Valid if present (object)", "data": { ${string(name)}: {} }, "valid": true },
            { "description": "Valid if present (zero number)", "data": { ${string(name)}: 0 }, "valid": true },
            { "description": "Valid if present (number)", "data": { ${string(name)}: 42 }, "valid": true }
        ]`.trim()
const makeBlock = (name, comment) => `
    {
        "description": "Does not see elements non existing on the object: '${inline(name)}' as number",
        "comment": ${string(comment)},
        ${makeNumber(name)}
    },
    {
        "description": "Does not see elements non existing on the object: '${inline(name)}' as object",
        "comment": ${string(comment)},
        ${makeObject(name)}
    },
    {
        "description": "Does not see elements non existing on the object: '${inline(name)}' via required",
        "comment": ${string(comment)},
        ${makeRequired(name)}
    }`
const makeBlockDefault = (name, proto) => `
    {
        "description": "Default value: '${inline(name)}' as number",
        "comment": "Default should not affect passing validation in all cases",
        ${makeDefault(name)}
    },
    {
        "description": "Default value on a '${string(proto).slice(1, -1)}' property: '${inline(name)}' as object",
        "comment": "Default should not affect passing validation in all cases",
        ${makePropertyDefault(name, proto)}
    },
    {
        "description": "Does not see inexisting elements on new objects: '${inline(name)}' via required",
        "comment": "Validating a new object should not be affected by previous default",
        ${makeRequired(name)}
    },
    {
        "description": "Does not see inexisting elements on new objects: '${inline(name)}' as number",
        "comment": "Validating a new object should not be affected by previous default",
        ${makeNumber(name)}
    },
    {
        "description": "Does not see inexisting elements on new objects: '${inline(name)}' as object",
        "comment": "Validating a new object should not be affected by previous default",
        ${makeObject(name)}
    }`
const tests = `[${
      makeBlock('x', 'This is a baseline check to validate that other properties are treated the same and are not special compared to it')
    },${
      ['length', 'toString', 'constructor', '__proto__'].map(name => 
        makeBlock(name, 'This is a common bug of some of the JS validators, this test detects it')
      ).join(',')
    },${
      ['foo', 'length', '__proto__'].map(name => makeBlockDefault(name, '__proto__')).join(',')
      /*
      // Lua-targeting, commented out until tested against an actual Lua-based impl
    },${
      ['__len', '__tostring', '__gc', '__index'].map(name => 
        makeBlock(name, 'Also test for Lua special name handling')
      ).join(',')
    },${
      makeBlockDefault('__index', '__index')
      */
    }
]`

// Ensure that everything is correct by checking against the validator
/*
const schemasafe = require('@exodus/schemasafe')
for (const useDefaults of [false, true]) {
  for (const suite of JSON.parse(tests)) {
    const validate = schemasafe.validator(suite.schema, { useDefaults })
    for (const test of suite.tests) {
      if (validate(test.data) !== test.valid)
        throw new Error(`${suite.description} / ${test.description}: expected ${test.valid} (defaults: ${useDefaults})`)
    }
  }
}
*/

console.log(tests)
