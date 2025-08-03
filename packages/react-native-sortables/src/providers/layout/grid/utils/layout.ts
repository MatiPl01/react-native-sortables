import type {
  Coordinate,
  GridLayout,
  GridLayoutProps,
  Vector
} from '../../../../types';
import { resolveDimension } from '../../../../utils';
import { getCrossIndex, getMainIndex } from './helpers';

export const calculateLayout = ({
  gaps,
  indexToKey,
  isVertical,
  itemHeights,
  itemWidths,
  mainGroupSize,
  numGroups
}: GridLayoutProps): GridLayout | null => {
  'worklet';
  if (!mainGroupSize) {
    return null;
  }

  const crossAxisOffsets = [0];
  const itemPositions: Record<string, Vector> = {};

  let mainCoordinate: Coordinate;
  let crossCoordinate: Coordinate;
  let crossItemSizes;

  if (isVertical) {
    // grid with specified number of columns (vertical orientation)
    mainCoordinate = 'x';
    crossCoordinate = 'y';
    crossItemSizes = itemHeights;
  } else {
    // grid with specified number of rows (horizontal orientation)
    mainCoordinate = 'y';
    crossCoordinate = 'x';
    crossItemSizes = itemWidths;
  }

  for (const [itemIndex, itemKey] of indexToKey.entries()) {
    const crossItemSize = resolveDimension(crossItemSizes, itemKey);

    // Return null if the item is not yet measured or the item main size
    // is different than the main group size (main size must be always the same)
    if (crossItemSize === null) {
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
    controlledContainerDimensions: {
      [isVertical ? 'height' : 'width']: lastCrossOffset
        ? Math.max(lastCrossOffset - gaps.cross, 0)
        : 0
    },
    crossAxisOffsets,
    itemPositions
  };
};
