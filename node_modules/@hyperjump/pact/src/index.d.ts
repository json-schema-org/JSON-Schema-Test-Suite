import type { LastReturnType } from "./type-utils.d.ts";


/**
 * Apply a function to every value in the iterator
 */
export const map: (
  <A, B>(fn: Mapper<A, B>, iterator: Iterable<A>) => Generator<B>
) & (
  <A, B>(fn: Mapper<A, B>) => (iterator: Iterable<A>) => Generator<B>
);
export type Mapper<A, B> = (item: A) => B;

/**
 * Same as `map`, but works with AsyncIterables and async mapping functions.
 */
export const asyncMap: (
  <A, B>(fn: AsyncMapper<A, B>, iterator: Iterable<A> | AsyncIterable<A>) => AsyncGenerator<B>
) & (
  <A, B>(fn: AsyncMapper<A, B>) => (iterator: Iterable<A> | AsyncIterable<A>) => AsyncGenerator<B>
);
export type AsyncMapper<A, B> = (item: A) => Promise<B> | B;

/**
 * Apply a function to every value in the iterator, but yield the original
 * value, not the result of the function.
 */
export const tap: (
  <A>(fn: Tapper<A>, iterator: Iterable<A>) => Generator<A>
) & (
  <A>(fn: Tapper<A>) => (iterator: Iterable<A>) => Generator<A>
);
export type Tapper<A> = (item: A) => void;

/**
 * Same as `tap`, but works with AsyncIterables.
 */
export const asyncTap: (
  <A>(fn: AsyncTapper<A>, iterator: AsyncIterable<A>) => AsyncGenerator<A>
) & (
  <A>(fn: AsyncTapper<A>) => (iterator: AsyncIterable<A>) => AsyncGenerator<A>
);
export type AsyncTapper<A> = (item: A) => Promise<void> | void;

/**
 * Yields only the values in the iterator that pass the predicate function.
 */
export const filter: (
  <A>(fn: Predicate<A>, iterator: Iterable<A>) => Generator<A>
) & (
  <A>(fn: Predicate<A>) => (iterator: Iterable<A>) => Generator<A>
);
export type Predicate<A> = (item: A) => boolean;

/**
 * Same as `filter`, but works with AsyncIterables and async predicate
 * functions.
 */
export const asyncFilter: (
  <A>(fn: AsyncPredicate<A>, iterator: Iterable<A> | AsyncIterable<A>) => AsyncGenerator<A>
) & (
  <A>(fn: AsyncPredicate<A>) => (iterator: Iterable<A> | AsyncIterable<A>) => AsyncGenerator<A>
);
export type AsyncPredicate<A> = (item: A) => Promise<boolean> | boolean;

/**
 * Same as `reduce` except it emits the accumulated value after each update
 */
export const scan: (
  <A, B>(fn: Reducer<A, B>, acc: B, iter: Iterable<A>) => Generator<B>
) & (
  <A, B>(fn: Reducer<A, B>, acc: B) => (iter: Iterable<A>) => Generator<B>
);

/**
 * Same as `scan`, but works with AsyncIterables and async predicate
 * functions.
 */
export const asyncScan: (
  <A, B>(fn: AsyncReducer<A, B>, acc: B, iter: Iterable<A> | AsyncIterable<A>) => AsyncGenerator<B>
) & (
  <A, B>(fn: AsyncReducer<A, B>, acc: B) => (iter: Iterable<A> | AsyncIterable<A>) => AsyncGenerator<B>
);

/**
 * Yields values from the iterator with all sub-iterator elements concatenated
 * into it recursively up to the specified depth.
 */
export const flatten: <A>(iterator: NestedIterable<A>, depth?: number) => Generator<A | NestedIterable<A>>;
export type NestedIterable<A> = Iterable<A | NestedIterable<A>>;

/**
 * Same as `flatten`, but works with AsyncGenerators.
 */
export const asyncFlatten: <A>(iterator: NestedIterable<A> | NestedAsyncIterable<A>, depth?: number) => AsyncGenerator<A | NestedIterable<A> | NestedAsyncIterable<A>>;
export type NestedAsyncIterable<A> = AsyncIterable<A | NestedAsyncIterable<A> | NestedIterable<A>>;

/**
 * Yields all the values in the iterator except for the first `n` values.
 */
export const drop: (
  <A>(count: number, iterator: Iterable<A>) => Generator<A>
) & (
  <A>(count: number) => (iterator: Iterable<A>) => Generator<A>
);

/**
 * Same as `drop`, but works with AsyncIterables.
 */
export const asyncDrop: (
  <A>(count: number, iterator: AsyncIterable<A>) => AsyncGenerator<A>
) & (
  <A>(count: number) => (iterator: AsyncIterable<A>) => AsyncGenerator<A>
);

/**
 * Same as `drop` but instead of dropping a specific number of values, it drops
 * values until the `fn(value)` is `false` and then yields the remaining values.
 */
export const dropWhile: (
  <A>(fn: Predicate<A>, iterator: Iterable<A>) => Generator<A>
) & (
  <A>(fn: Predicate<A>) => (iterator: Iterable<A>) => Generator<A>
);

/**
 * Same as `dropWhile`, but works with AsyncIterables.
 */
export const asyncDropWhile: (
  <A>(fn: AsyncPredicate<A>, iterator: AsyncIterable<A>) => AsyncGenerator<A>
) & (
  <A>(fn: AsyncPredicate<A>) => (iterator: AsyncIterable<A>) => AsyncGenerator<A>
);

/**
 * Yields the first `n` values in the iterator.
 */
export const take: (
  <A>(count: number, iterator: Iterable<A>) => Generator<A>
) & (
  <A>(count: number) => (iterator: Iterable<A>) => Generator<A>
);

/**
 * Same as `take`, but works with AsyncIterables.
 */
export const asyncTake: (
  <A>(count: number, iterator: AsyncIterable<A>) => AsyncGenerator<A>
) & (
  <A>(count: number) => (iterator: AsyncIterable<A>) => AsyncGenerator<A>
);

/**
 * Same as `take` but instead of yielding a specific number of values, it yields
 * values as long as the `fn(value)` returns `true` and drops the rest.
 */
export const takeWhile: (
  <A>(fn: Predicate<A>, iterator: Iterable<A>) => Generator<A>
) & (
  <A>(fn: Predicate<A>) => (iterator: Iterable<A>) => Generator<A>
);

/**
 * Same as `takeWhile`, but works with AsyncGenerators.
 */
export const asyncTakeWhile: (
  <A>(fn: AsyncPredicate<A>, iterator: AsyncIterable<A>) => AsyncGenerator<A>
) & (
  <A>(fn: AsyncPredicate<A>) => (iterator: AsyncIterable<A>) => AsyncGenerator<A>
);

/**
 * Returns the first value in the iterator.
 */
export const head: <A>(iterator: Iterable<A>) => A | undefined;

/**
 * Same as `head`, but works with AsyncGenerators.
 */
export const asyncHead: <A>(iterator: AsyncIterable<A>) => Promise<A | undefined>;

/**
 * Yields numbers starting from `from` until `to`. If `to` is not passed, the
 * iterator will be infinite.
 */
export const range: (from: number, to?: number) => Generator<number>;

/**
 * Yields nothing.
 */
export const empty: () => Generator<never>;

/**
 * Yields nothing asynchronously.
 */
export const asyncEmpty: () => AsyncGenerator<never>;

/**
 * Yields tuples containing a value from each iterator. The iterator will have
 * the same length as `iter1`. If `iter1` is longer than `iter2`, the second
 * value of the tuple will be undefined. If `iter2` is longer than `iter1`, the
 * remaining values in `iter2` will be ignored.
 */
export const zip: <A, B>(iter1: Iterable<A>, iter2: Iterable<B>) => Generator<[A, B]>;

/**
 * Same as `zip` but works with AsyncIterables.
 */
export const asyncZip: <A, B>(iter1: AsyncIterable<A>, iter2: AsyncIterable<B>) => AsyncGenerator<[A, B]>;

/**
 * Yields values from each iterator in order.
 */
export const concat: <A>(...iters: Iterable<A>[]) => Generator<A>;

/**
 * Same as `concat` but works with AsyncIterables.
 */
export const asyncConcat: <A>(...iters: (Iterable<A> | AsyncIterable<A>)[]) => AsyncGenerator<A>;

/**
 * Reduce an iterator to a single value.
 */
export const reduce: (
  <A, B>(fn: Reducer<A, B>, acc: B, iter: Iterable<A>) => B
) & (
  <A, B>(fn: Reducer<A, B>, acc: B) => (iter: Iterable<A>) => B
);
export type Reducer<A, B> = (acc: B, item: A) => B;

/**
 * Same as `reduce`, but works with AsyncGenerators and async reducer functions.
 */
export const asyncReduce: (
  <A, B>(fn: AsyncReducer<A, B>, acc: B, iter: Iterable<A> | AsyncIterable<A>) => Promise<B>
) & (
  <A, B>(fn: AsyncReducer<A, B>, acc: B) => (iter: Iterable<A> | AsyncIterable<A>) => Promise<B>
);
export type AsyncReducer<A, B> = (acc: B, item: A) => Promise<B> | B;

/**
 * Returns a boolean indicating whether or not all values in the iterator passes
 * the predicate function.
 */
export const every: (
  <A>(fn: Predicate<A>, iterator: Iterable<A>) => boolean
) & (
  <A>(fn: Predicate<A>) => (iterator: Iterable<A>) => boolean
);

/**
 * Same as `every`, but works with AsyncIterables and async predicate functions.
 */
export const asyncEvery: (
  <A>(fn: AsyncPredicate<A>, iterator: Iterable<A> | AsyncIterable<A>) => Promise<boolean>
) & (
  <A>(fn: AsyncPredicate<A>) => (iterator: Iterable<A> | AsyncIterable<A>) => Promise<boolean>
);

/**
 * Returns a boolean indicating whether or not there exists a value in the
 * iterator that passes the predicate function.
 */
export const some: (
  <A>(fn: Predicate<A>, iterator: Iterable<A>) => boolean
) & (
  <A>(fn: Predicate<A>) => (iterator: Iterable<A>) => boolean
);

/**
 * Same as `some`, but works with AsyncIterables and async predicate functions.
 */
export const asyncSome: (
  <A>(fn: AsyncPredicate<A>, iterator: Iterable<A> | AsyncIterable<A>) => Promise<boolean>
) & (
  <A>(fn: AsyncPredicate<A>) => (iterator: Iterable<A> | AsyncIterable<A>) => Promise<boolean>
);

/**
 * Returns the first value that passes the predicate function.
 */
export const find: (
  <A>(fn: Predicate<A>, iterator: Iterable<A>) => A
) & (
  <A>(fn: Predicate<A>) => (iterator: Iterable<A>) => A
);

/**
 * Same as `find`, but works with AsyncIterables and async predicate functions.
 */
export const asyncFind: (
  <A>(fn: AsyncPredicate<A>, iterator: Iterable<A> | AsyncIterable<A>) => Promise<A>
) & (
  <A>(fn: AsyncPredicate<A>) => (iterator: Iterable<A> | AsyncIterable<A>) => Promise<A>
);

/**
 * Returns the number of items in the iterator.
 */
export const count: <A>(iterator: Iterable<A>) => number;

/**
 * Same as `count`, but works with AsyncIterables.
 */
export const asyncCount: <A>(iterator: AsyncIterable<A>) => Promise<number>;

/**
 * Collect all the items in the iterator into an array.
 */
export const collectArray: <A>(iterator: Iterable<A>) => A[];

/**
 * Same as `collectArray`, but works with AsyncIterables.
 */
export const asyncCollectArray: <A>(iterator: AsyncIterable<A>) => Promise<A[]>;

/**
 * Collect all the items in the iterator into a Set.
 */
export const collectSet: <A>(iterator: Iterable<A>) => Set<A>;

/**
 * Same as `collectSet`, but works with AsyncIterables.
 */
export const asyncCollectSet: <A>(iterator: AsyncIterable<A>) => Promise<Set<A>>;

/**
 * Collect all the key/value tuples in the iterator into a Map.
 */
export const collectMap: <A, B>(iterator: Iterable<[A, B]>) => Map<A, B>;

/**
 * Same as `collectMap`, but works with AsyncGenerators.
 */
export const asyncCollectMap: <A, B>(iterator: AsyncIterable<[A, B]>) => Promise<Map<A, B>>;

/**
 * Collect all the key/value tuples in the iterator into an Object.
 */
export const collectObject: <A>(iterator: Iterable<[string, A]>) => Record<string, A>;

/**
 * Same as `collectObject`, but works with AsyncGenerators.
 */
export const asyncCollectObject: <A>(iterator: AsyncIterable<[string, A]>) => Promise<Record<string, A>>;

/**
 * Collect all the items in the iterator into a string separated by the
 * separator token.
 */
export const join: (
  (separator: string, iterator: Iterable<string>) => string
) & (
  (separator: string) => (iterator: Iterable<string>) => string
);

/**
 * Same as `join`, but works with AsyncIterables.
 */
export const asyncJoin: (
  (separator: string, iterator: AsyncIterable<string>) => Promise<string>
) & (
  (separator: string) => (iterator: AsyncIterable<string>) => Promise<string>
);

/**
 * Starting with an iterator, apply any number of functions to transform the
 * values and return the result.
 */
export const pipe: (
  <A, B>(initialValue: A, ...fns: [
    (a: A) => B
  ]) => B
) & (
  <A, B, C>(initialValue: A, ...fns: [
    (a: A) => B,
    (b: B) => C
  ]) => C
) & (
  <A, B, C, D>(initialValue: A, ...fns: [
    (a: A) => B,
    (b: B) => C,
    (c: C) => D
  ]) => D
) & (
  <A, B, C, D, E>(initialValue: A, ...fns: [
    (a: A) => B,
    (b: B) => C,
    (c: C) => D,
    (c: D) => E
  ]) => E
) & (
  <A, B, C, D, E, F>(initialValue: A, ...fns: [
    (a: A) => B,
    (b: B) => C,
    (c: C) => D,
    (d: D) => E,
    (e: E) => F
  ]) => F
) & (
  <A, B, C, D, E, F, G>(initialValue: A, ...fns: [
    (a: A) => B,
    (b: B) => C,
    (c: C) => D,
    (d: D) => E,
    (e: E) => F,
    (f: F) => G
  ]) => G
) & (
  <A, B, C, D, E, F, G, H>(initialValue: A, ...fns: [
    (a: A) => B,
    (b: B) => C,
    (c: C) => D,
    (d: D) => E,
    (e: E) => F,
    (f: F) => G,
    (g: G) => H
  ]) => H
) & (
  <A, B, C, D, E, F, G, H, I>(initialValue: A, ...fns: [
    (a: A) => B,
    (b: B) => C,
    (c: C) => D,
    (d: D) => E,
    (e: E) => F,
    (f: F) => G,
    (g: G) => H,
    (h: H) => I
  ]) => I
) & (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  <A, B, C, D, E, F, G, H, I, J extends ((j: any) => any)[]>(initialValue: A, ...fns: [
    (a: A) => B,
    (b: B) => C,
    (c: C) => D,
    (d: D) => E,
    (e: E) => F,
    (f: F) => G,
    (g: G) => H,
    (h: H) => I,
    ...J
  ]) => LastReturnType<J>
);
