import type { SharedValue } from 'react-native-reanimated';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFunction = (...args: Array<any>) => any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyRecord = Record<string, any>;

export type EmptyRecord = Record<string, never>;

export type Simplify<T> = {
  [K in keyof T]: T[K];
} & {};

type RequiredExcept<T, K extends keyof T> = Omit<Required<T>, K> & Pick<T, K>;

export type RequiredBy<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Maybe<T> = null | T | undefined;

type WithGetters<T extends AnyRecord> = {
  [K in keyof T]: T[K] | { get: () => T[K] };
};

export type DefaultProps<
  P extends AnyRecord,
  O extends keyof P = never, // optional props
  E extends keyof P = never // exclude from default props (must be passed by the user)
> = WithGetters<Omit<RequiredExcept<P, O>, E>>;

export type NoUndef<T> = T extends undefined ? never : T;

type ReadonlySharedValue<V> = Readonly<Omit<SharedValue<V>, 'set'>>;

export type DeepReadonly<T> = {
  // `ReadonlySharedValue` (no `set`) matches both mutable shared values and
  // derived values. Since Reanimated 4.4 `useDerivedValue` returns a distinct
  // `DerivedValue` type (a shared value without `set`), checking against
  // `SharedValue` directly would miss derived values.
  readonly [K in keyof T]: T[K] extends ReadonlySharedValue<infer U>
    ? ReadonlySharedValue<U>
    : T[K] extends AnyRecord
      ? DeepReadonly<T[K]>
      : Readonly<T[K]>;
};

type AllKeys<U> = U extends unknown ? keyof U : never;

export type MutuallyExclusiveUnion<
  T extends ReadonlyArray<unknown>,
  Processed extends ReadonlyArray<unknown> = []
> = T extends readonly [infer First, ...infer Rest]
  ?
      | (First & {
          [K in Exclude<
            AllKeys<[...Processed, ...Rest][number]>,
            keyof First
          >]?: never;
        })
      | MutuallyExclusiveUnion<Rest, readonly [...Processed, First]>
  : never;
