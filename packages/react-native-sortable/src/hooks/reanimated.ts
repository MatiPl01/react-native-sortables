/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-redeclare */
import { useMemo } from 'react';
import {
  isSharedValue,
  type SharedValue,
  useAnimatedReaction,
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

export function useAnimatedSelect<V, K extends null | number | string>(
  selector: (key: K) => V,
  animatableKey: Animatable<K>
): { current: V } {
  const animatedKey = useAnimatableValue(animatableKey);
  const value = useMemo(
    () => ({ current: selector(animatedKey.value) }),
    [selector, animatedKey]
  );

  useAnimatedReaction(
    () => animatedKey.value,
    key => {
      value.current = selector(key);
    }
  );

  return value;
}
