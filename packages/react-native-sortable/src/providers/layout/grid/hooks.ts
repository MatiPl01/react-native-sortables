import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';

import { useDebugContext } from '../../../debug';
import { reorderItems } from '../../../utils';
import {
  useCommonValuesContext,
  useInactiveIndexToKey,
  useOrderUpdater
} from '../../shared';
import { useGridLayoutContext } from './GridLayoutProvider';
import type { GridLayout } from './types';
import { calculateLayout, getColumnIndex, getRowIndex } from './utils';

const MIN_ADDITIONAL_OFFSET = 5;

const DEBUG_COLORS = {
  backgroundColor: '#1111ef',
  borderColor: '#00007e'
};

export function useGridOrderUpdater(numColumns: number): void {
  const {
    activeItemKey,
    containerHeight,
    containerWidth,
    indexToKey,
    itemDimensions
  } = useCommonValuesContext();
  const { columnGap, columnWidth, rowGap } = useGridLayoutContext();
  const debugContext = useDebugContext();

  const othersLayout = useSharedValue<GridLayout | null>(null);
  const othersIndexToKey = useInactiveIndexToKey();

  const debugRects = debugContext?.useDebugRects([
    'top',
    'bottom',
    'left',
    'right'
  ]);

  // DEBUG RECTS
  useAnimatedReaction(
    () => activeItemKey.value,
    () => {
      if (debugRects && activeItemKey.value === null) {
        Object.values(debugRects).forEach(rect => rect.hide());
      }
    }
  );

  // LAYOUT WITHOUT ACTIVE ITEM
  useAnimatedReaction(
    () => ({
      columnWidth: columnWidth.value,
      gaps: {
        column: columnGap.value,
        row: rowGap.value
      },
      indexToKey: othersIndexToKey.value,
      itemDimensions: itemDimensions.value,
      numColumns
    }),
    props => {
      othersLayout.value = calculateLayout(props);
    },
    [numColumns]
  );

  useOrderUpdater(
    ({ activeIndex, strategy, touchPosition: { x, y } }) => {
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
          columnIndex * (columnWidth.value + columnGap.value) +
          columnWidth.value;
        rightBound = columnOffsetRight + additionalOffsetX;
      }

      // DEBUG ONLY
      if (debugRects) {
        debugRects.top.set({
          ...DEBUG_COLORS,
          from: { x: leftBound, y: topBound },
          to: { x: rightBound, y: rowOffsetAbove }
        });
        debugRects.bottom.set({
          ...DEBUG_COLORS,
          from: { x: leftBound, y: rowOffsetBelow - rowGap.value },
          to: { x: rightBound, y: bottomBound }
        });
        debugRects.left.set({
          ...DEBUG_COLORS,
          from: { x: leftBound, y: topBound },
          to: { x: columnOffsetLeft, y: bottomBound }
        });
        debugRects.right.set({
          ...DEBUG_COLORS,
          from: { x: columnOffsetRight, y: topBound },
          to: { x: rightBound, y: bottomBound }
        });
      }

      // Swap the active item with the item at the new index
      const limitedRowIndex = Math.max(
        0,
        Math.min(rowIndex, rowOffsets.length - 2)
      );
      const newIndex = Math.max(
        0,
        Math.min(limitedRowIndex * numColumns + columnIndex, itemsCount - 1)
      );
      if (newIndex === activeIndex) {
        return;
      }

      // return the new order of items
      return reorderItems(indexToKey.value, activeIndex, newIndex, strategy);
    },
    [numColumns, debugRects]
  );
}
