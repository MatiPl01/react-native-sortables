import { OFFSET_EPS } from '../../../../constants';
import type {
  Coordinate,
  GridLayout,
  GridLayoutProps,
  Vector
} from '../../../../types';
import { resolveDimension } from '../../../shared';
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
  let crossItemSizes, mainItemSizes;

  if (isVertical) {
    // grid with specified number of columns (vertical orientation)
    mainCoordinate = 'x';
    crossCoordinate = 'y';
    mainItemSizes = itemWidths;
    crossItemSizes = itemHeights;
  } else {
    // grid with specified number of rows (horizontal orientation)
    mainCoordinate = 'y';
    crossCoordinate = 'x';
    mainItemSizes = itemHeights;
    crossItemSizes = itemWidths;
  }

  for (const [itemIndex, itemKey] of indexToKey.entries()) {
    const crossItemSize = resolveDimension(crossItemSizes, itemKey);
    const mainItemSize = resolveDimension(mainItemSizes, itemKey);

    // Return null if the item is not yet measured or the item main size
    // is different than the main group size (main size must be always the same)
    if (
      crossItemSize === undefined ||
      mainItemSize === undefined ||
      Math.abs(mainItemSize - mainGroupSize) > OFFSET_EPS
    ) {
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
