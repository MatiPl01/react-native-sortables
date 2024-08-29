/* eslint-disable import/no-unused-modules */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useState } from 'react';
import {
  makeMutable,
  runOnJS,
  type SharedValue,
  useAnimatedReaction
} from 'react-native-reanimated';

export function maybeUpdateValue(
  target: SharedValue<number>,
  value: number,
  eps = 0.01
): void {
  'worklet';
  if (Math.abs(target.value - value) > eps) {
    target.value = value;
  }
}

export function useSplitSharedValue<T extends Record<string, any>>(
  value: SharedValue<T>
): { [key in keyof T]: SharedValue<T[key]> } {
  const [state, setState] = useState(
    () =>
      Object.fromEntries(
        Object.entries(value.value).map(([key, v]) => [key, makeMutable(v)])
      ) as unknown as { [key in keyof T]: SharedValue<T[key]> }
  );

  const updateState = useCallback(
    (v: T) => {
      const newState = {} as { [key in keyof T]: SharedValue<T[key]> };
      for (const key in v) {
        if (state[key] === undefined) {
          newState[key] = makeMutable(v[key]);
        }
      }
      setState(newState);
    },
    [state]
  );

  useAnimatedReaction(
    () => value.value,
    v => {
      let stateChanged = false;
      // add new props
      for (const key in v) {
        if (state[key] === undefined) {
          stateChanged = true;
        }
      }

      // Update state when new props appear for the first time
      if (stateChanged) {
        runOnJS(updateState)(v);
      }

      // Update existing props
      for (const key in v) {
        if (state[key]) {
          state[key].value = v[key];
        }
      }
    },
    [value, state]
  );

  return state;
}
