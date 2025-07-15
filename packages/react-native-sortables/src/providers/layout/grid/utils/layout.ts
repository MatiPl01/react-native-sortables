import type {
  Coordinate,
  Dimension,
  GridLayout,
  GridLayoutProps,
  Vector
} from '../../../../types';
import { getCrossIndex, getMainIndex } from './helpers';

export const calculateLayout = ({
  gaps,
  indexToKey,
  isVertical,
  itemDimensions,
  mainGroupSize,
  numGroups
}: GridLayoutProps): GridLayout | null => {
  'worklet';
  if (!mainGroupSize) {
    return null;
  }

  const crossAxisOffsets = [0];
  const itemPositions: Record<string, Vector> = {};

  let mainDimension: Dimension;
  let crossDimension: Dimension;
  let mainCoordinate: Coordinate;
  let crossCoordinate: Coordinate;

  if (isVertical) {
    // grid with specified number of columns (vertical orientation)
    mainDimension = 'width';
    crossDimension = 'height'; // items can grow vertically
    mainCoordinate = 'x';
    crossCoordinate = 'y';
  } else {
    // grid with specified number of rows (horizontal orientation)
    mainDimension = 'height';
    crossDimension = 'width'; // items can grow horizontally
    mainCoordinate = 'y';
    crossCoordinate = 'x';
  }

  for (const [itemIndex, itemKey] of indexToKey.entries()) {
    const dimensions = itemDimensions[itemKey];
    const crossItemSize = dimensions?.[crossDimension];
    const mainItemSize = dimensions?.[mainDimension];

    // Return null if the item is not yet measured or the item main size
    // is different than the main group size (main size must be always the same)
    if (crossItemSize === undefined || mainItemSize !== mainGroupSize) {
      return null;
    }

    const mainIndex = getMainIndex(itemIndex, numGroups);
    const crossIndex = getCrossIndex(itemIndex, numGroups);
    const crossAxisOffset = crossAxisOffsets[crossIndex] ?? 0;

    // Update offset of the next group
    crossAxisOffsets[crossIndex + 1] = Math.max(
      crossAxisOffsets[crossIndex + 1] ?? 0,
      crossAxisOffset + crossItemSize + gaps.cross
    );

    // Update item position
    itemPositions[itemKey] = {
      [crossCoordinate]: crossAxisOffset,
      [mainCoordinate]: mainIndex * (mainGroupSize + gaps.main)
    } as Vector;
  }

  const lastCrossOffset = crossAxisOffsets[crossAxisOffsets.length - 1];

  return {
    calculatedDimensions: {
      [crossDimension]: lastCrossOffset
        ? Math.max(lastCrossOffset - gaps.cross, 0)
        : 0
    },
    crossAxisOffsets,
    itemPositions
  };
};
