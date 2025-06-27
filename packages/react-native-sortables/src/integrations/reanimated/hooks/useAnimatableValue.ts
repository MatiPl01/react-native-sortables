/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-redeclare */
import type { SharedValue } from 'react-native-reanimated';
import { isSharedValue, useDerivedValue } from 'react-native-reanimated';

import type { Animatable } from '../types';

export default function useAnimatableValue<V>(
  value: Animatable<V>
): SharedValue<V>;

export default function useAnimatableValue<V, F extends (value: V) => any>(
  value: Animatable<V>,
  modify: F
): SharedValue<ReturnType<F>>;

export default function useAnimatableValue<V, F extends (value: V) => any>(
  value: Animatable<V>,
  modify?: F
): SharedValue<ReturnType<F>> | SharedValue<V> {
  return useDerivedValue(() => {
    const inputValue = isSharedValue<V>(value) ? value.value : value;
    return modify ? modify(inputValue) : inputValue;
  }, [value, modify]);
}
