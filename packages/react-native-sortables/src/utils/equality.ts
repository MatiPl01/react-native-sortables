import type { AnyRecord, Maybe } from '../helperTypes';
import type { Vector } from '../types';

export function lt(a: number, b: number): boolean {
  'worklet';
  return a < b;
}

export function gt(a: number, b: number): boolean {
  'worklet';
  return a > b;
}

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

export const areValuesDifferent = (
  dim1: number | undefined,
  dim2: number | undefined,
  eps?: number
): boolean => {
  'worklet';
  if (dim1 === undefined) {
    return dim2 !== undefined;
  }
  if (dim2 === undefined) {
    return true;
  }

  if (eps) {
    return Math.abs(dim1 - dim2) > eps;
  }

  return dim1 !== dim2;
};

export const areVectorsDifferent = (
  vec1: Vector,
  vec2: Vector,
  eps?: number
): boolean => {
  'worklet';
  return (
    areValuesDifferent(vec1.x, vec2.x, eps) ||
    areValuesDifferent(vec1.y, vec2.y, eps)
  );
};

export const haveEqualPropValues = <T extends AnyRecord>(
  obj1: Maybe<T>,
  obj2: Maybe<T>
): boolean => {
  'worklet';
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
