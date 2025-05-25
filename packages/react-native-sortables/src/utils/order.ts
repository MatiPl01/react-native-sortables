import type { DragEndParams } from '../types';

export const orderItems = <I>(
  data: Array<I>,
  itemKeys: Array<string>,
  { fromIndex, keyToIndex, toIndex }: DragEndParams,
  skipIfNoChange?: boolean
): Array<I> => {
  if (skipIfNoChange && fromIndex === toIndex) {
    return data;
  }

  const result: Array<I> = [];
  for (let i = 0; i < itemKeys.length; i++) {
    result[keyToIndex[itemKeys[i]!]!] = data[i]!;
  }
  return result;
};

export const getKeyToIndex = (
  itemKeys: Array<string>
): Record<string, number> => {
  'worklet';
  return itemKeys.reduce(
    (acc, key, index) => {
      acc[key] = index;
      return acc;
    },
    {} as Record<string, number>
  );
};
