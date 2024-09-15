import { useAnimatedReaction } from 'react-native-reanimated';

import { useDebugContext } from '../../../debug';
import { reorderItems } from '../../../utils';
import { useCommonValuesContext, useOrderUpdater } from '../../shared';
import { useGridLayoutContext } from './GridLayoutProvider';
import { getColumnIndex, getRowIndex } from './utils';

const MIN_ADDITIONAL_OFFSET = 5;

const DEBUG_COLORS = {
  backgroundColor: '#1111ef',
  borderColor: '#00007e'
};

export function useGridOrderUpdater(numColumns: number): void {
  const { activeItemKey, containerHeight, containerWidth, indexToKey } =
    useCommonValuesContext();
  const { columnGap, columnWidth, rowGap, rowOffsets } = useGridLayoutContext();
  const debugContext = useDebugContext();

  const debugRects = debugContext?.useDebugRects([
    'top',
    'bottom',
    'left',
    'right'
  ]);

  useAnimatedReaction(
    () => activeItemKey.value,
    () => {
      if (debugRects && activeItemKey.value === null) {
        Object.values(debugRects).forEach(rect => rect.hide());
      }
    }
  );

  useOrderUpdater(
    ({ activeIndex, strategy, touchPosition: { x, y } }) => {
      'worklet';
      const itemsCount = indexToKey.value.length;
      const rowIndex = getRowIndex(activeIndex, numColumns);
      const columnIndex = getColumnIndex(activeIndex, numColumns);

      // Get active item bounding box
      const rowOffsetAbove = rowOffsets.value[rowIndex];
      const rowOffsetBelow = rowOffsets.value[rowIndex + 1];
      if (rowOffsetAbove === undefined || rowOffsetBelow === undefined) {
        return;
      }
      const columnOffsetLeft =
        columnIndex * (columnWidth.value + columnGap.value);
      const columnOffsetRight = columnOffsetLeft + columnWidth.value;

      // Horizontal bounds
      const additionalOffsetX = Math.min(
        rowGap.value / 2 + MIN_ADDITIONAL_OFFSET,
        rowGap.value + columnWidth.value / 2
      );
      const leftBound = columnOffsetLeft - additionalOffsetX;
      const rightBound = columnOffsetRight + additionalOffsetX;

      // Top bound
      const rowAboveHeight =
        rowOffsets.value[rowIndex - 1] !== undefined
          ? rowOffsetAbove - rowOffsets.value[rowIndex - 1]! - rowGap.value
          : 0;
      const additionalOffsetTop = Math.min(
        rowGap.value / 2 + MIN_ADDITIONAL_OFFSET,
        rowGap.value + rowAboveHeight / 2
      );
      const topBound = rowOffsetAbove - additionalOffsetTop;

      // Bottom bound
      const rowBelowHeight =
        rowOffsets.value[rowIndex + 2] !== undefined
          ? rowOffsets.value[rowIndex + 2]! - rowOffsetBelow - rowGap.value
          : 0;
      const additionalOffsetBottom = Math.min(
        rowGap.value / 2 + MIN_ADDITIONAL_OFFSET,
        rowGap.value + rowBelowHeight / 2
      );
      const bottomBound =
        rowOffsetBelow - rowGap.value + additionalOffsetBottom;

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

      // Check if the center of the active item is over the top or bottom edge of the container
      let dy = 0;
      if (topBound > 0 && y < topBound) {
        dy = -1;
      } else if (bottomBound < containerHeight.value && y > bottomBound) {
        dy = 1;
      }

      // Check if the center of the active item is over the left or right edge of the container
      let dx = 0;
      if (leftBound > 0 && x < leftBound) {
        dx = -1;
      } else if (rightBound < containerWidth.value && x > rightBound) {
        dx = 1;
      }

      const indexOffset = dy * numColumns + dx;
      let newIndex = activeIndex + indexOffset;
      // Adjust the index to be within the bounds
      if (newIndex < 0 || newIndex >= itemsCount) {
        newIndex -=
          numColumns * Math.ceil((newIndex - itemsCount + 1) / numColumns);
      }
      if (newIndex === activeIndex) {
        return;
      }
      // return the new order of items
      return reorderItems(indexToKey.value, activeIndex, newIndex, strategy);
    },
    [numColumns, debugRects]
  );
}
