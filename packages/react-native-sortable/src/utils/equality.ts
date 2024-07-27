import type { SharedValue } from 'react-native-reanimated';

import type { Position } from '../types';

export const areArraysDifferent = <T>(
  arr1: Array<T>,
  arr2: Array<T>,
  areEqual = (a: T, b: T): boolean => a === b
): boolean => {
  'worklet';
  return (
    arr1.length !== arr2.length ||
    arr1.some((item, index) => !areEqual(item, arr2[index] as T))
  );
};

export const arePositionsDifferent = (
  pos1: Position,
  pos2: Position
): boolean => {
  'worklet';
  return pos1.x !== pos2.x || pos1.y !== pos2.y;
};

export const updateIfDifferent = <T>(
  value: SharedValue<T>,
  newValue: T,
  areDifferent: (a: T, b: T) => boolean
): void => {
  'worklet';
  if (areDifferent(value.value, newValue)) {
    value.value = newValue;
  }
};
