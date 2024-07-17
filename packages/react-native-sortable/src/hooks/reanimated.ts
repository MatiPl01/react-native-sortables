/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-redeclare */
import {
  isSharedValue,
  type SharedValue,
  useDerivedValue
} from 'react-native-reanimated';

import type { Animatable } from '../types';

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
    const inputValue = isSharedValue(value) ? value.value : value;
    return modify ? modify(inputValue) : inputValue;
  }, [value, modify]);
}
