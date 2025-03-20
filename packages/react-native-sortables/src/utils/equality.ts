import type { AnyRecord, Dimensions, Maybe, Vector } from '../types';

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

export const areVectorsDifferent = (
  pos1: Vector,
  pos2: Vector,
  epx?: number
): boolean => {
  'worklet';
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
