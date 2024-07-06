/* eslint-disable import/no-unused-modules */
import {
  isSharedValue,
  type SharedValue,
  useDerivedValue
} from 'react-native-reanimated';

import type { Animatable } from '@/types';

export function useAnimatableValue<V>(value: Animatable<V>): SharedValue<V> {
  return useDerivedValue(
    () => (isSharedValue(value) ? value.value : value),
    [value]
  );
}
