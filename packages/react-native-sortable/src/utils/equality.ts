import type { Vector } from '../types';

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

export const areVectorsDifferent = (pos1: Vector, pos2: Vector): boolean => {
  'worklet';
  return pos1.x !== pos2.x || pos1.y !== pos2.y;
};
