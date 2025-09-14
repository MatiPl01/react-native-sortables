'worklet';
import type { AnyRecord, Maybe } from '../helperTypes';
import type { Vector } from '../types';

export const lt = (a: number, b: number): boolean => a < b;
export const gt = (a: number, b: number): boolean => a > b;

export const areArraysDifferent = <T>(
  arr1: Array<T>,
  arr2: Array<T>,
  areEqual = (a: T, b: T): boolean => a === b
): boolean =>
  arr1.length !== arr2.length ||
  arr1.some((item, index) => !areEqual(item, arr2[index] as T));

export const areValuesDifferent = (
  value1: number | undefined,
  value2: number | undefined,
  eps?: number
): boolean => {
  if (value1 === undefined) {
    return value2 !== undefined;
  }
  if (value2 === undefined) {
    return true;
  }

  if (eps) {
    return Math.abs(value1 - value2) > eps;
  }

  return value1 !== value2;
};

export const areVectorsDifferent = (
  vec1: Vector,
  vec2: Vector,
  eps?: number
): boolean =>
  areValuesDifferent(vec1.x, vec2.x, eps) ||
  areValuesDifferent(vec1.y, vec2.y, eps);

export const haveEqualPropValues = <T extends AnyRecord>(
  obj1: Maybe<T>,
  obj2: Maybe<T>
): boolean => {
  if (!obj1 || !obj2) {
    return false;
  }

  const obj1Keys = Object.keys(obj1);
  const obj2Keys = Object.keys(obj2);
  return (
    obj1Keys.length === obj2Keys.length &&
    obj1Keys.every(key => obj1[key] === obj2[key])
  );
};
