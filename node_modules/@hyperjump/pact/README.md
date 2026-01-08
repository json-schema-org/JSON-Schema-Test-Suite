# Hyperjump Pact

Hyperjump Pact is a utility library that provides higher order functions for
working with iterators and async iterators.

## Installation
Designed for node.js (ES Modules, TypeScript) and browsers.

```bash
npm install @hyperjump/pact --save
```

## Usage

```javascript
import { pipe, range, map, filter, reduce } from "@hyperjump/pact";


const result = pipe(
  range(1, 10),
  filter((n) => n % 2 === 0),
  map((n) => n * 2),
  reduce((sum, n) => sum + n, 0)
);
console.log(result);
```

```javascript
import { pipe, asyncMap, asyncFilter, asyncReduce } from "@hyperjump/pact";
// You can alternatively import the async functions without the prefix
// import { pipe, map, filter, reduce } from "@hyperjump/pact/async";


const asyncSequence = async function* () {
  yield 1;
  yield 2;
  yield 3;
  yield 4;
  yield 5;
};

for await (const value of asyncSequence()) {
  console.log(value);
}

const result = await pipe(
  asyncSequence(),
  asyncFilter((n) => n % 2 === 0),
  asyncMap((n) => n * 2),
  asyncReduce((sum, n) => sum + n, 0)
);
console.log(result);
```

## API

https://pact.hyperjump.io

## Contributing

### Tests

Run the tests

```bash
npm test
```

Run the tests with a continuous test runner

```bash
npm test -- --watch
```

[hyperjump]: https://github.com/hyperjump-io/browser
[jref]: https://github.com/hyperjump-io/browser/blob/master/src/json-reference/README.md
