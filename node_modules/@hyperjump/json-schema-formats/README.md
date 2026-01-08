# Hyperjump - JSON Schema Formats 

A collection of validation functions for the JSON Schema `format` keyword.

## Install

This module is designed for Node.js (ES Modules, TypeScript) and browsers. It
should work in Bun and Deno as well, but the test runner doesn't work in these
environments, so this module may be less stable in those environments.

### Node.js

```bash
npm install @hyperjump/json-schema-formats
```

### TypeScript

This package uses the package.json "exports" field. [TypeScript understands
"exports"](https://devblogs.microsoft.com/typescript/announcing-typescript-4-5-beta/#packagejson-exports-imports-and-self-referencing),
but you need to change a couple settings in your `tsconfig.json` for it to work.

```jsonc
    "module": "Node16", // or "NodeNext"
    "moduleResolution": "Node16", // or "NodeNext"
```

## API

<https://json-schema-formats.hyperjump.io/modules.html>

## Contributing

Contributions are welcome! Please create an issue to propose and discuss any
changes you'd like to make before implementing it. If it's an obvious bug with
an obvious solution or something simple like a fixing a typo, creating an issue
isn't required. You can just send a PR without creating an issue. Before
submitting any code, please remember to first run the following tests.

- `npm test` (Tests can also be run continuously using `npm test -- --watch`)
- `npm run lint`
- `npm run type-check`
