/**
 * @import * as API from "./curry.d.ts"
 */


// eslint-disable-next-line @stylistic/no-extra-parens
export const curry = /** @type API.curry */ ((fn) => (...args) => {
  /** @typedef {Parameters<ReturnType<typeof fn>>[0]} I */

  const firstApplication = fn.length === 1
    ? /** @type Extract<typeof fn, (a: any) => any> */ (fn)(args[0])
    : fn(args[0], args[1]);
  const iterable = /** @type I */ (args[fn.length]); // eslint-disable-line @typescript-eslint/no-unsafe-assignment
  return iterable === undefined ? firstApplication : firstApplication(iterable);
});
