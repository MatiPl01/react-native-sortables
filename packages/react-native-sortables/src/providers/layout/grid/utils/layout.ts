import type {
  Coordinate,
  Dimension,
  GridLayout,
  GridLayoutProps,
  Vector
} from '../../../../types';
import { getCrossIndex, getMainIndex } from './helpers';

export const calculateLayout = (
  {
    gaps,
    indexToKey,
    isVertical,
    itemDimensions,
    mainGroupSize,
    numGroups
  }: GridLayoutProps,
  prevLayout: GridLayout | null,
  activeItemKey: null | string
): GridLayout | null => {
  'worklet';
  if (!mainGroupSize) {
    return null;
  }

  const crossAxisOffsets = [0];
  const itemPositions: Record<string, Vector> = {};

  let crossDimension: Dimension;
  let mainCoordinate: Coordinate;
  let crossCoordinate: Coordinate;

  if (isVertical) {
    // grid with specified number of columns (vertical orientation)
    crossDimension = 'height'; // items can grow vertically
    mainCoordinate = 'x';
    crossCoordinate = 'y';
  } else {
    // grid with specified number of rows (horizontal orientation)
    crossDimension = 'width'; // items can grow horizontally
    mainCoordinate = 'y';
    crossCoordinate = 'x';
  }

  for (const [itemIndex, itemKey] of indexToKey.entries()) {
    const crossItemSize = itemDimensions[itemKey]?.[crossDimension];
    console.log('crossItemSize', itemKey, crossItemSize);

    // Return if the item is not yet measured
    if (crossItemSize === undefined) {
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

  // TODO - clean this up
  if (activeItemKey) {
    const newActivePosition = itemPositions[activeItemKey]?.[crossCoordinate];
    console.log('newActivePosition', activeItemKey, newActivePosition);
  }

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
