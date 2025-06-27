import type { SharedValue } from 'react-native-reanimated';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFunction = (...args: Array<any>) => any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyRecord = Record<string, any>;

export type Simplify<T> = {
  [K in keyof T]: T[K];
} & {};

type RequiredExcept<T, K extends keyof T> = Omit<Required<T>, K> & Pick<T, K>;

export type RequiredBy<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Maybe<T> = null | T | undefined;

export type DefaultProps<
  P extends AnyRecord,
  O extends keyof P = never, // optional props
  E extends keyof P = never // exclude from default props (must be passed by the user)
> = Omit<RequiredExcept<P, O>, E>;

export type NoUndef<T> = T extends undefined ? never : T;

type ReadonlySharedValue<V> = Readonly<Omit<SharedValue<V>, 'set'>>;

export type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends SharedValue<infer U>
    ? ReadonlySharedValue<U>
    : T[K] extends AnyRecord
      ? DeepReadonly<T[K]>
      : Readonly<T[K]>;
};
