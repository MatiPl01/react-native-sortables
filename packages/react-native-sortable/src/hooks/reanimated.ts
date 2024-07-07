/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-redeclare */
import {
  isSharedValue,
  type SharedValue,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated';

import { OFFSET_EPS } from '../constants';
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

export function useSmoothValueChange(
  initialValue: SharedValue<number>,
  target: SharedValue<number>,
  speed: SharedValue<number>
): SharedValue<number> {
  'worklet';
  const currentValue = useSharedValue(initialValue.value);
  const remainingDifference = useSharedValue(0);

  useAnimatedReaction(
    () => initialValue.value,
    value => {
      currentValue.value = value;
    },
    [initialValue]
  );

  useAnimatedReaction(
    () => ({
      mul: speed.value,
      remaining: remainingDifference.value,
      to: target.value
    }),
    ({ mul, to }) => {
      const difference = to - currentValue.value;
      const direction = Math.sign(difference);
      const step = direction * Math.sqrt(Math.abs(difference)) * mul;

      if (Math.abs(difference) > OFFSET_EPS) {
        currentValue.value = currentValue.value + step;
      } else {
        currentValue.value = to;
      }

      remainingDifference.value = difference - step;
    },
    [target]
  );

  return currentValue;
}
