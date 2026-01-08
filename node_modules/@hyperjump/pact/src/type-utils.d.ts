export type IterableItem<T> = T extends Iterable<infer U> ? U : never;
export type AsyncIterableItem<T> = T extends AsyncIterable<infer U> ? U : never;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LastReturnType<T extends ((...args: any) => any)[]> = T extends [...any, (...args: any) => infer R] ? R : never;
