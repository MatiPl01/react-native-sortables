/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { AnyFunction, AnyValue } from '../types';

export const zipArrays = <T, U>(a: Array<T>, b: Array<U>): Array<[T, U]> => {
  'worklet';
  return a.slice(0, b.length).map((_, i) => [a[i], b[i]]) as Array<[T, U]>;
};

export const repeat = <V extends ((index: number) => any) | AnyValue>(
  count: number,
  value: V
): Array<V extends AnyFunction ? ReturnType<V> : V> =>
  Array.from(
    { length: count },
    typeof value === 'function'
      ? (_, i) => (value as (index: number) => any)(i)
      : () => value
  );
