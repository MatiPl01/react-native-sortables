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

const reorderInsert = <T>(
  array: Array<T>,
  fromIndex: number,
  toIndex: number
): Array<T> => {
  'worklet';
  const activeItem = array[fromIndex];

  if (activeItem === undefined) {
    return array;
  }

  if (toIndex < fromIndex) {
    return [
      ...array.slice(0, toIndex),
      activeItem,
      ...array.slice(toIndex, fromIndex),
      ...array.slice(fromIndex + 1)
    ];
  }
  return [
    ...array.slice(0, fromIndex),
    ...array.slice(fromIndex + 1, toIndex + 1),
    activeItem,
    ...array.slice(toIndex + 1)
  ];
};

const reorderSwap = <T>(
  array: Array<T>,
  fromIndex: number,
  toIndex: number
): Array<T> => {
  'worklet';
  const draggedItem = array[fromIndex];
  const swappedItem = array[toIndex];

  if (draggedItem === undefined || swappedItem === undefined) {
    return array;
  }

  const result = [...array];
  result[fromIndex] = swappedItem;
  result[toIndex] = draggedItem;
  return result;
};

export const reorderItems = <T>(
  array: Array<T>,
  fromIndex: number,
  toIndex: number,
  strategy: ReorderStrategy
): Array<T> => {
  'worklet';

  switch (strategy) {
    case 'insert':
      return reorderInsert(array, fromIndex, toIndex);
    case 'swap':
      return reorderSwap(array, fromIndex, toIndex);
  }
};
