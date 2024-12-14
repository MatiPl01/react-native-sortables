import type { SortableGridStrategyFactory } from '../../../../../types';
import { reorderInsert } from '../../../../../utils';
import { useDebugBoundingBox, useInactiveIndexToKey } from '../../../../shared';
import { getColumnIndex, getRowIndex } from '../../utils';

const MIN_ADDITIONAL_OFFSET = 5;

export const useInsertStrategy: SortableGridStrategyFactory = ({
  columnGap,
  columnWidth,
  containerHeight,
  containerWidth,
  indexToKey,
  numColumns,
  rowGap,
  useGridLayout
}) => {
  const othersIndexToKey = useInactiveIndexToKey();
  const othersLayout = useGridLayout(othersIndexToKey);
  const debugBox = useDebugBoundingBox();

  return ({ activeIndex, touchPosition: { x, y } }) => {
    'worklet';
    if (!othersLayout.value) {
      return;
    }
    const { rowOffsets } = othersLayout.value;
    const itemsCount = indexToKey.value.length;
    const startRowIndex = getRowIndex(activeIndex, numColumns);
    const startColumnIndex = getColumnIndex(activeIndex, numColumns);
    let rowIndex = startRowIndex;
    let columnIndex = startColumnIndex;

    // VERTICAL BOUNDS
    // Top bound
    let rowOffsetAbove = -Infinity;
    let topBound = Infinity;

    while (topBound > 0 && y < topBound) {
      if (topBound !== Infinity) {
        rowIndex--;
      }
      rowOffsetAbove = rowOffsets[rowIndex] ?? 0;
      const rowAboveHeight =
        rowOffsets[rowIndex - 1] !== undefined
          ? rowOffsetAbove - rowOffsets[rowIndex - 1]! - rowGap.value
          : 0;
      const additionalOffsetTop = Math.min(
        rowGap.value / 2 + MIN_ADDITIONAL_OFFSET,
        rowGap.value + rowAboveHeight / 2
      );
      topBound = rowOffsetAbove - additionalOffsetTop;
    }

    // Bottom bound
    let rowOffsetBelow = Infinity;
    let bottomBound = -Infinity;

    while (
      bottomBound < containerHeight.value &&
      y > bottomBound &&
      rowOffsets[rowIndex] !== undefined
    ) {
      if (bottomBound !== -Infinity) {
        rowIndex++;
      }
      const nextRowOffset = rowOffsets[rowIndex + 1];
      if (!nextRowOffset) {
        break;
      }
      rowOffsetBelow = nextRowOffset;
      const rowBelowHeight =
        rowOffsets[rowIndex + 2] !== undefined && rowOffsetBelow !== undefined
          ? rowOffsets[rowIndex + 2]! - rowOffsetBelow - rowGap.value
          : 0;
      const additionalOffsetBottom = Math.min(
        rowGap.value / 2 + MIN_ADDITIONAL_OFFSET,
        rowGap.value + rowBelowHeight / 2
      );
      bottomBound = rowOffsetBelow - rowGap.value + additionalOffsetBottom;
    }

    // HORIZONTAL BOUNDS
    const additionalOffsetX = Math.min(
      rowGap.value / 2 + MIN_ADDITIONAL_OFFSET,
      rowGap.value + columnWidth.value / 2
    );

    // Left bound
    let columnOffsetLeft = -Infinity;
    let leftBound = Infinity;

    while (leftBound > 0 && x < leftBound) {
      if (leftBound !== Infinity) {
        columnIndex--;
      }
      columnOffsetLeft = columnIndex * (columnWidth.value + columnGap.value);
      leftBound = columnOffsetLeft - additionalOffsetX;
    }

    // Right bound
    let columnOffsetRight = Infinity;
    let rightBound = -Infinity;

    while (rightBound < containerWidth.value && x > rightBound) {
      if (rightBound !== -Infinity) {
        columnIndex++;
      }
      columnOffsetRight =
        columnIndex * (columnWidth.value + columnGap.value) + columnWidth.value;
      rightBound = columnOffsetRight + additionalOffsetX;
    }

    // DEBUG ONLY
    if (debugBox) {
      debugBox.top.update(
        { x: leftBound, y: topBound },
        { x: rightBound, y: rowOffsetAbove }
      );
      debugBox.bottom.update(
        { x: leftBound, y: rowOffsetBelow - rowGap.value },
        { x: rightBound, y: bottomBound }
      );
      debugBox.left.update(
        { x: leftBound, y: topBound },
        { x: columnOffsetLeft, y: bottomBound }
      );
      debugBox.right.update(
        { x: columnOffsetRight, y: topBound },
        { x: rightBound, y: bottomBound }
      );
    }

    // Swap the active item with the item at the new index
    const limitedRowIndex = Math.max(
      0,
      Math.min(rowIndex, Math.floor((itemsCount - 1) / numColumns))
    );
    const newIndex = Math.max(
      0,
      Math.min(limitedRowIndex * numColumns + columnIndex, itemsCount - 1)
    );
    if (newIndex === activeIndex) {
      return;
    }

    // return the new order of items
    return reorderInsert(indexToKey.value, activeIndex, newIndex);
  };
};
