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
