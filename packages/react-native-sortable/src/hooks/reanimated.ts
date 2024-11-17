/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-redeclare */
import { useCallback } from 'react';
import {
  isSharedValue,
  runOnJS,
  runOnUI,
  type SharedValue,
  useDerivedValue
} from 'react-native-reanimated';

import type { Animatable, AnyFunction } from '../types';
import { noop } from '../utils';
import { useStableCallback } from './callbacks';

export function useAnimatableValue<V>(value: Animatable<V>): SharedValue<V>;

export function useAnimatableValue<V, F extends (value: V) => any>(
  value: Animatable<V>,
  modify: F
): SharedValue<ReturnType<F>>;

export function useAnimatableValue<V, F extends (value: V) => any>(
  value: Animatable<V>,
  modify?: F
): SharedValue<ReturnType<F>> | SharedValue<V> {
  return useDerivedValue(() => {
    const inputValue = isSharedValue<V>(value) ? value.value : value;
    return modify ? modify(inputValue) : inputValue;
  }, [value, modify]);
}

export function useUIStableCallback<C extends AnyFunction>(callback: C) {
  return useStableCallback(
    runOnUI((...args: Parameters<C>) => callback(...args))
  );
}

export function useJSStableCallback<C extends AnyFunction>(callback?: C) {
  const hasCallback = !!callback;
  const stableCallback = useStableCallback(callback ?? noop);

  return useCallback(
    (...args: Parameters<C>) => {
      'worklet';
      if (hasCallback) runOnJS(stableCallback)(...args);
    },
    [stableCallback, hasCallback]
  );
}
