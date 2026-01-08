export const curry: (
  <A, I, R>(curriedFn: (a: A) => (iterable: I) => R) => (
    (a: A, iterable: I) => R
  ) & (
    (a: A) => (iterable: I) => R
  )
) & (
  <A, I, R>(curriedFn: (a: A, b: B) => (iterable: I) => R) => (
    (a: A, b: B, iterable: I) => R
  ) & (
    (a: A, b: B) => (iterable: I) => R
  )
);
