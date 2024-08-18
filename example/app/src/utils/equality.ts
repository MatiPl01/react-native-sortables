export const areSameArrays = <T>(
  arr1: Array<T>,
  arr2: Array<T>,
  areEqual = (a: T, b: T): boolean => a === b
): boolean =>
  arr1.length === arr2.length &&
  arr1.every((item, index) => areEqual(item, arr2[index] as T));
