/* eslint-disable @typescript-eslint/no-explicit-any */

import type { SharedValue } from 'react-native-reanimated';

export type AnyFunction = (...args: Array<any>) => any;

export type AnyRecord = Record<string, any>;

export type Simplify<T> = {
  [K in keyof T]: T[K];
} & {};

export type Animatable<V> = SharedValue<V> | V;

type UnAnimatable<V> = V extends SharedValue<infer U> ? U : V;

export type AnimatableProps<T extends Record<string, any>> = {
  [K in keyof T]: Animatable<UnAnimatable<T[K]>>;
};

export type AnimatedValues<T extends Record<string, any>> = {
  [K in keyof T]: SharedValue<UnAnimatable<T[K]>>;
};

type RequiredExcept<T, K extends keyof T> = Omit<Required<T>, K> & Pick<T, K>;

export type RequiredBy<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Maybe<T> = null | T | undefined;

export type DefaultProps<
  P extends Record<string, any>,
  O extends keyof P = never, // optional props
  E extends keyof P = never // exclude from default props (must be passed by the user)
> = Omit<RequiredExcept<P, O>, E>;

export type NoUndef<T> = T extends undefined ? never : T;

type ReadonlySharedValue<V> = Readonly<Omit<SharedValue<V>, 'set'>>;

export type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends SharedValue<infer U>
    ? ReadonlySharedValue<U>
    : T[K] extends Record<string, any>
      ? DeepReadonly<T[K]>
      : Readonly<T[K]>;
};
