import type { SharedValue } from 'react-native-reanimated';

import type { Dimensions, Vector } from '../types';

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

export const areVectorsDifferent = (
  pos1: Vector | null,
  pos2: Vector | null,
  epx?: number
): boolean => {
  'worklet';
  if (!pos1 || !pos2) {
    return pos1 !== pos2;
  }
  if (epx) {
    return Math.abs(pos1.x - pos2.x) > epx || Math.abs(pos1.y - pos2.y) > epx;
  }
  return pos1.x !== pos2.x || pos1.y !== pos2.y;
};

export const areDimensionsDifferent = (
  dim1: Dimensions,
  dim2: Dimensions,
  eps?: number
): boolean => {
  'worklet';
  if (eps) {
    return (
      Math.abs(dim1.width - dim2.width) > eps ||
      Math.abs(dim1.height - dim2.height) > eps
    );
  }
  return dim1.width !== dim2.width || dim1.height !== dim2.height;
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

export function maybeUpdateValue(
  target: SharedValue<null | number>,
  value: number,
  eps = 0.01
): void {
  'worklet';
  if (target.value === null || Math.abs(target.value - value) > eps) {
    target.value = value;
  }
}
