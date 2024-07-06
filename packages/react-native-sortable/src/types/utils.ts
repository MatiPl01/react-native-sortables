/* eslint-disable @typescript-eslint/no-explicit-any */

import type { SharedValue } from 'react-native-reanimated';

export type AnyFunction = (...args: Array<any>) => any;

export type Prettify<T> = {
  [K in keyof T]: T[K];
  // eslint-disable-next-line @typescript-eslint/ban-types
} & {};

export type Animatable<V> = SharedValue<V> | V;

export type UnAnimatable<V> = V extends SharedValue<infer U> ? U : V;

export type AnimatableValues<T extends Record<string, any>> = {
  [K in keyof T]: Animatable<UnAnimatable<T[K]>>;
};

export type AnimatedValues<T extends Record<string, any>> = {
  [K in keyof T]: SharedValue<UnAnimatable<T[K]>>;
};

export type RequiredBy<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

export type RequiredExcept<T, K extends keyof T> = Omit<Required<T>, K> &
  Pick<T, K>;
