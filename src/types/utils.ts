/* eslint-disable @typescript-eslint/no-explicit-any */

import type { SharedValue } from 'react-native-reanimated';

export type AnyFunction = (...args: Array<any>) => any;

export type Sharedify<T> = {
  [K in keyof T]: T[K] extends SharedValue<any>
    ? T[K]
    : T[K] extends infer U | undefined
      ? U extends undefined
        ? SharedValue<U> | undefined
        : SharedValue<U>
      : never;
};
