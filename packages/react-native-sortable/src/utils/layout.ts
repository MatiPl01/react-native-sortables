import type { Offset, ReorderStrategy } from '../types';

export const getOffsetDistance = (
  providedOffset: Offset,
  distance: number
): number => {
  'worklet';
  if (typeof providedOffset === 'number') {
    return providedOffset;
  }

  const match = providedOffset.match(/-?\d+(.\d+)?%$/);
  if (!match) {
    throw new Error(
      `[react-native-scrollable] Invalid offset: ${providedOffset}`
    );
  }

  const percentage = parseFloat(match[0]) / 100;
  return distance * percentage;
};

const reorderInsert = (
  indexToKey: Array<string>,
  fromIndex: number,
  toIndex: number
): Array<string> => {
  'worklet';
  const activeKey = indexToKey[fromIndex];

  if (activeKey === undefined) {
    return indexToKey;
  }

  if (toIndex < fromIndex) {
    return [
      ...indexToKey.slice(0, toIndex),
      activeKey,
      ...indexToKey.slice(toIndex, fromIndex),
      ...indexToKey.slice(fromIndex + 1)
    ];
  }
  return [
    ...indexToKey.slice(0, fromIndex),
    ...indexToKey.slice(fromIndex + 1, toIndex + 1),
    activeKey,
    ...indexToKey.slice(toIndex + 1)
  ];
};

const reorderSwap = (
  indexToKey: Array<string>,
  fromIndex: number,
  toIndex: number
): Array<string> => {
  'worklet';
  const fromKey = indexToKey[fromIndex];
  const toKey = indexToKey[toIndex];

  if (fromKey === undefined || toKey === undefined) {
    return indexToKey;
  }

  const result = [...indexToKey];
  result[fromIndex] = toKey;
  result[toIndex] = fromKey;
  return result;
};

export const reorderItems = (
  indexToKey: Array<string>,
  fromIndex: number,
  toIndex: number,
  strategy: ReorderStrategy
): Array<string> => {
  'worklet';

  switch (strategy) {
    case 'insert':
      return reorderInsert(indexToKey, fromIndex, toIndex);
    case 'swap':
      return reorderSwap(indexToKey, fromIndex, toIndex);
  }
};
