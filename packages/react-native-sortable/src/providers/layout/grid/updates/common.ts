import type { SharedValue } from 'react-native-reanimated';

import type { SortableGridStrategyFactory } from '../../../../types';
import { getAdditionalSwapOffset, useDebugBoundingBox } from '../../../shared';
import { getColumnIndex, getRowIndex } from '../utils';

export const createGridStrategy =
  (
    useInactiveIndexToKey: () => SharedValue<Array<string>>,
    reorder: (
      indexToKey: Array<string>,
      activeIndex: number,
      newIndex: number
    ) => Array<string>
  ): SortableGridStrategyFactory =>
  ({
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

    return ({ activeIndex, position: { x, y } }) => {
      'worklet';
      if (!othersLayout.value) {
        return;
      }
      const { rowOffsets } = othersLayout.value;
      const startRowIndex = getRowIndex(activeIndex, numColumns);
      const startColumnIndex = getColumnIndex(activeIndex, numColumns);
      let rowIndex = startRowIndex;
      let columnIndex = startColumnIndex;

      // VERTICAL BOUNDS
      // Top bound
      let rowOffsetAbove = -Infinity;
      let topBound = Infinity;

      do {
        if (topBound !== Infinity) {
          rowIndex--;
        }
        rowOffsetAbove = rowOffsets[rowIndex] ?? 0;
        const rowAboveHeight =
          rowOffsets[rowIndex - 1] !== undefined
            ? rowOffsetAbove - rowOffsets[rowIndex - 1]! - rowGap.value
            : 0;
        const additionalOffsetTop = getAdditionalSwapOffset(
          rowGap.value,
          rowAboveHeight
        );
        topBound = rowOffsetAbove - additionalOffsetTop;
      } while (topBound > 0 && y < topBound);

      // Bottom bound
      let rowOffsetBelow = Infinity;
      let bottomBound = -Infinity;

      do {
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
        const additionalOffsetBottom = getAdditionalSwapOffset(
          rowGap.value,
          rowBelowHeight
        );
        bottomBound = rowOffsetBelow - rowGap.value + additionalOffsetBottom;
      } while (bottomBound < containerHeight.value && y > bottomBound);

      // HORIZONTAL BOUNDS
      const additionalOffsetX = getAdditionalSwapOffset(
        rowGap.value,
        columnWidth.value
      );

      // Left bound
      let columnOffsetLeft = -Infinity;
      let leftBound = Infinity;

      do {
        if (leftBound !== Infinity) {
          columnIndex--;
        }
        columnOffsetLeft = columnIndex * (columnWidth.value + columnGap.value);
        leftBound = columnOffsetLeft - additionalOffsetX;
      } while (leftBound > 0 && x < leftBound);

      // Right bound
      let columnOffsetRight = Infinity;
      let rightBound = -Infinity;

      do {
        if (rightBound !== -Infinity) {
          columnIndex++;
        }
        columnOffsetRight =
          columnIndex * (columnWidth.value + columnGap.value) +
          columnWidth.value;
        rightBound = columnOffsetRight + additionalOffsetX;
      } while (rightBound < containerWidth.value && x > rightBound);

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
      const itemsCount = indexToKey.value.length;
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
      return reorder(indexToKey.value, activeIndex, newIndex);
    };
  };
