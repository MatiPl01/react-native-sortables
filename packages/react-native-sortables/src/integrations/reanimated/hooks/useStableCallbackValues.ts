import type { AnyFunction } from '../../../helperTypes';
import useStableCallbackValue from './useStableCallbackValue';

export default function useStableCallbackValues<
  T extends Record<string, AnyFunction>
>(callbacks: T) {
  return Object.fromEntries(
    Object.entries(callbacks).map(([key, callback]) => [
      key,
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useStableCallbackValue(callback)
    ])
  ) as { [K in keyof T]: T[K] };
}
