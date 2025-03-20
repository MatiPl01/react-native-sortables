import type { Offset, Vector } from '../types';
import { gt, lt } from './equality';
import { error } from './logs';

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
    throw error(`Invalid offset: ${providedOffset}`);
  }

  const percentage = parseFloat(match[0]) / 100;
  return distance * percentage;
};

export const reorderInsert = (
  indexToKey: Array<string>,
  fromIndex: number,
  toIndex: number,
  fixedItemKeys: Record<string, boolean> | undefined
) => {
  'worklet';
  const direction = toIndex > fromIndex ? -1 : 1;
  const fromKey = indexToKey[fromIndex]!;
  const op = direction < 0 ? lt : gt;
  const result = [...indexToKey];

  if (fixedItemKeys) {
    let k = fromIndex;
    for (let i = fromIndex; op(i, toIndex); i -= direction) {
      const itemKey = result[i - direction]!;
      if (!fixedItemKeys[itemKey]) {
        result[k] = itemKey;
        k = i - direction;
      }
    }
  } else {
    for (let i = fromIndex; op(i, toIndex); i -= direction) {
      result[i] = result[i - direction]!;
    }
  }

  result[toIndex] = fromKey;

  return result;
};

export const reorderSwap = (
  indexToKey: Array<string>,
  fromIndex: number,
  toIndex: number
) => {
  'worklet';
  const result = [...indexToKey];
  [result[fromIndex], result[toIndex]] = [result[toIndex]!, result[fromIndex]!];
  return result;
};

export const isValidCoordinate = (coordinate: number): boolean => {
  'worklet';
  return !isNaN(coordinate) && coordinate > -Infinity && coordinate < Infinity;
};

export const isValidVector = (vector: Vector): boolean => {
  'worklet';
  return isValidCoordinate(vector.x) && isValidCoordinate(vector.y);
};
