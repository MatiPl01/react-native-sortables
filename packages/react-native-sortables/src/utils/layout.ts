import type { Maybe } from '../helperTypes';
import type { Dimensions, Offset, Vector } from '../types';
import { areVectorsDifferent, gt, lt } from './equality';
import { error } from './logs';

const getOffsetDistance = (
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

export const calculateSnapOffset = (
  snapOffsetX: Offset,
  snapOffsetY: Offset,
  snapItemDimensions: Dimensions,
  snapItemOffset?: Maybe<Vector>
) => {
  'worklet';
  return {
    x:
      (snapItemOffset?.x ?? 0) +
      getOffsetDistance(snapOffsetX, snapItemDimensions.width),
    y:
      (snapItemOffset?.y ?? 0) +
      getOffsetDistance(snapOffsetY, snapItemDimensions.height)
  };
};

export const reorderInsert = (
  indexToKey: Array<string>,
  fromIndex: number,
  toIndex: number,
  fixedItemKeys: Record<string, boolean> | undefined
) => {
  'worklet';
  toIndex = Math.min(toIndex, indexToKey.length - 1);
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
  if (toIndex > indexToKey.length - 1) {
    return indexToKey;
  }
  const result = [...indexToKey];
  [result[fromIndex], result[toIndex]] = [result[toIndex]!, result[fromIndex]!];
  return result;
};

const isValidCoordinate = (coordinate: number): boolean => {
  'worklet';
  return !isNaN(coordinate) && coordinate > -Infinity && coordinate < Infinity;
};

export const isValidVector = (vector: Vector): boolean => {
  'worklet';
  return isValidCoordinate(vector.x) && isValidCoordinate(vector.y);
};

// Reuse the previous Vector reference for unchanged keys (so per-key derived
// values short-circuit on ===), and reuse the whole record when nothing moved.
export const reconcilePositions = (
  prev: Record<string, Vector>,
  next: Record<string, Vector>
): Record<string, Vector> => {
  'worklet';
  const result: Record<string, Vector> = {};
  let changed = false;
  let matched = 0;
  for (const key in next) {
    const prevPosition = prev[key];
    const nextPosition = next[key]!;
    if (prevPosition && !areVectorsDifferent(prevPosition, nextPosition)) {
      result[key] = prevPosition;
      matched++;
    } else {
      result[key] = nextPosition;
      changed = true;
    }
  }
  // Whole layout unchanged: reuse prev so the itemPositions write dedups.
  if (!changed && matched === Object.keys(prev).length) {
    return prev;
  }
  return result;
};
