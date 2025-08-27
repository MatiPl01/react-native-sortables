'worklet';
import type {
  AutoOffsetAdjustmentProps,
  Coordinate,
  GridLayout,
  GridLayoutProps,
  Vector
} from '../../../../types';
import { resolveDimension } from '../../../../utils';
import { getCrossIndex, getMainIndex } from './helpers';

export const calculateLayout = (
  {
    gaps,
    indexToKey,
    isVertical,
    itemHeights,
    itemWidths,
    numGroups
  }: GridLayoutProps,
  additionalCrossOffset = 0
): GridLayout | null => {
  const mainGroupSize = (isVertical ? itemWidths : itemHeights) as
    | null
    | number;

  if (!mainGroupSize) {
    return null;
  }

  const crossAxisOffsets = [additionalCrossOffset];
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

  let lastCrossOffset = crossAxisOffsets[crossAxisOffsets.length - 1];
  lastCrossOffset = lastCrossOffset
    ? Math.max(lastCrossOffset - gaps.cross, 0)
    : 0;

  const mainSize = (mainGroupSize + gaps.main) * numGroups - gaps.main;

  return {
    containerCrossSize: lastCrossOffset,
    contentBounds: [
      {
        [crossCoordinate]: additionalCrossOffset,
        [mainCoordinate]: 0
      } as Vector,
      {
        [crossCoordinate]: lastCrossOffset,
        [mainCoordinate]: mainSize
      } as Vector
    ],
    crossAxisOffsets,
    itemPositions
  };
};

export const calculateActiveItemCrossOffset = ({
  activeItemKey,
  crossCoordinate,
  crossGap,
  crossItemSizes,
  indexToKey,
  itemPositions,
  keyToIndex,
  numGroups,
  snapBasedOffset
}: AutoOffsetAdjustmentProps): number => {
  let activeItemCrossOffset = 0;
  let currentGroupCrossSize = 0;
  let currentGroupCrossIndex = 0;

  // Find new active item position
  for (let i = 0; i < indexToKey.length; i++) {
    const crossIndex = getCrossIndex(i, numGroups);

    if (crossIndex !== currentGroupCrossIndex) {
      activeItemCrossOffset += currentGroupCrossSize + crossGap;
      currentGroupCrossIndex = crossIndex;
      currentGroupCrossSize = 0;
    }

    const key = indexToKey[i]!;
    currentGroupCrossSize = Math.max(
      currentGroupCrossSize,
      resolveDimension(crossItemSizes, key) ?? 0
    );

    if (key === activeItemKey) {
      break;
    }
  }

  const activeItemIndex = keyToIndex[activeItemKey];
  const itemAtActiveIndexKey = indexToKey[activeItemIndex!];
  const itemAtActiveIndexOffset =
    itemPositions[itemAtActiveIndexKey!]?.[crossCoordinate] ?? 0;

  return Math.max(
    0,
    itemAtActiveIndexOffset - activeItemCrossOffset + snapBasedOffset
  );
};
