import type {
  AutoOffsetAdjustmentProps,
  Coordinate,
  GridLayout,
  GridLayoutProps,
  Vector
} from '../../../../types';
import { resolveDimension } from '../../../../utils';
import { getCrossIndex, getMainIndex } from './helpers';

/**
 * Calculates masonry-style layout where items stack within each column.
 * Items maintain their sequential grid order (respecting columns). Vertical spacing
 * between items in a column is controlled by gaps.cross (rowGap when vertical).
 */
const calculateMasonryLayout = ({
  gaps,
  indexToKey,
  isVertical,
  itemHeights,
  itemWidths,
  numGroups,
  startCrossOffset
}: GridLayoutProps): GridLayout | null => {
  'worklet';
  const mainGroupSize = (isVertical ? itemWidths : itemHeights) as
    | null
    | number;

  if (!mainGroupSize) {
    return null;
  }

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

  // Track the current height/position of each column independently
  // Each column stacks its items, separated by the configured cross gap
  const columnHeights = new Array(numGroups).fill(startCrossOffset ?? 0);

  for (const [itemIndex, itemKey] of indexToKey.entries()) {
    const crossItemSize = resolveDimension(crossItemSizes, itemKey);

    if (crossItemSize === null) {
      return null;
    }

    // Determine which column this item belongs to based on grid order
    const mainIndex = getMainIndex(itemIndex, numGroups);
    const crossAxisOffset = columnHeights[mainIndex]!;

    // Update item position - place it at the current column height
    itemPositions[itemKey] = {
      [crossCoordinate]: crossAxisOffset,
      [mainCoordinate]: mainIndex * (mainGroupSize + gaps.main)
    } as Vector;

    // Update column height - advance by item size plus cross gap
    columnHeights[mainIndex] = crossAxisOffset + crossItemSize + gaps.cross;
  }

  // Container size is determined by the tallest column
  const rawMaxColumnHeight = Math.max(...columnHeights);
  const baseCrossOffset = startCrossOffset ?? 0;
  // Remove the trailing cross gap from the tallest column if at least one item exists
  const maxColumnHeight =
    rawMaxColumnHeight > baseCrossOffset
      ? Math.max(rawMaxColumnHeight - gaps.cross, baseCrossOffset)
      : rawMaxColumnHeight;
  const mainSize = (mainGroupSize + gaps.main) * numGroups - gaps.main;

  return {
    containerCrossSize: maxColumnHeight,
    contentBounds: [
      {
        [crossCoordinate]: startCrossOffset ?? 0,
        [mainCoordinate]: 0
      } as Vector,
      {
        [crossCoordinate]: maxColumnHeight,
        [mainCoordinate]: mainSize
      } as Vector
    ],
    crossAxisOffsets: columnHeights,
    itemPositions
  };
};

/**
 * Calculates standard grid layout where items in the same row align vertically
 */
const calculateStandardLayout = ({
  gaps,
  indexToKey,
  isVertical,
  itemHeights,
  itemWidths,
  numGroups,
  startCrossOffset
}: GridLayoutProps): GridLayout | null => {
  'worklet';
  const mainGroupSize = (isVertical ? itemWidths : itemHeights) as
    | null
    | number;

  if (!mainGroupSize) {
    return null;
  }

  const crossAxisOffsets = [startCrossOffset ?? 0];
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
        [crossCoordinate]: startCrossOffset ?? 0,
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

export const calculateLayout = (props: GridLayoutProps): GridLayout | null => {
  'worklet';
  return props.masonry
    ? calculateMasonryLayout(props)
    : calculateStandardLayout(props);
};

export const calculateItemCrossOffset = ({
  crossGap,
  crossItemSizes,
  indexToKey,
  itemKey,
  masonry,
  numGroups
}: AutoOffsetAdjustmentProps): number => {
  'worklet';

  if (masonry) {
    // Masonry layout: calculate offset within the same group (column for vertical, row for horizontal)
    // Find the target item's index and group
    let targetItemIndex = -1;
    for (let i = 0; i < indexToKey.length; i++) {
      if (indexToKey[i] === itemKey) {
        targetItemIndex = i;
        break;
      }
    }

    if (targetItemIndex === -1) {
      return 0;
    }

    const targetGroup = getMainIndex(targetItemIndex, numGroups);
    let offset = 0;

    // Sum cross-axis sizes of all items in the same group that come before the target item
    // For vertical grids: sums heights of items in the same column
    // For horizontal grids: sums widths of items in the same row
    for (let i = 0; i < targetItemIndex; i++) {
      const group = getMainIndex(i, numGroups);
      if (group === targetGroup) {
        const key = indexToKey[i]!;
        const itemSize = resolveDimension(crossItemSizes, key);
        if (itemSize !== null) {
          offset += itemSize + crossGap;
        }
      }
    }

    return offset;
  }

  // Standard grid layout: calculate offset using row-based logic
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

    if (key === itemKey) {
      break;
    }
  }

  return activeItemCrossOffset;
};
